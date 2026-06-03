import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Helper to check if a time slot is within the salon's working hours (08:00 - 19:00)
 */
function isWithinWorkingHours(startTime: string, endTime: string): boolean {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const opening = 8 * 60; // 08:00
    const closing = 19 * 60; // 19:00
    return startTotal >= opening && endTotal <= closing;
}

/**
 * Helper to check if the appointment is older than 5 hours.
 */
async function isExpired(id: string): Promise<boolean> {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return true;

    // Convert dd/MM/yyyy to yyyy-MM-dd for valid Date parsing
    const [day, month, year] = appointment.appointmentDate.split('/');
    const isoDate = `${year}-${month}-${day}`;
    const appointmentDateTime = new Date(`${isoDate}T${appointment.startTime}`);
    const now = new Date();
    const diffInMs = now.getTime() - appointmentDateTime.getTime();
    const fiveHoursInMs = 5 * 60 * 60 * 1000;

    return diffInMs > fiveHoursInMs;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salonId = searchParams.get('salonId');

        if (!salonId) {
            return NextResponse.json({ message: "L'ID du salon est requis" }, { status: 400 });
        }

        const appointments = await prisma.appointment.findMany({
            where: { service: { salonId } },
            include: { user: true, service: true, staff: true }
        });

        return NextResponse.json({ appointments }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching admin appointments:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, serviceId, staffId, appointmentDate, timeSlots } = body;

        if (!email || !serviceId || !appointmentDate || !timeSlots || !Array.isArray(timeSlots)) {
            return NextResponse.json({ message: 'Tous les champs sont requis.' }, { status: 400 });
        }

        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            return NextResponse.json({ message: 'Service introuvable.' }, { status: 404 });
        }

        const dailyCount = await prisma.appointment.count({ where: { appointmentDate } });
        if (dailyCount >= 13) {
            return NextResponse.json({ message: 'Le salon est complet pour cette journée.' }, { status: 403 });
        }

        for (const slot of timeSlots) {
            const [start, end] = slot.split(' - ');
            if (!start || !end || !isWithinWorkingHours(start, end)) {
                return NextResponse.json({ message: `Créneau ${slot} invalide ou hors horaires.` }, { status: 400 });
            }
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: { email, givenName: 'Client', familyName: 'Kinde' }
            });
        }

        const appointments = await Promise.all(
            timeSlots.map(async (slot) => {
                const [startTime, endTime] = slot.split(' - ');
                let assignedPost: number | null = null;
                for (let p = 1; p <= 4; p++) {
                    const existing = await prisma.appointment.findFirst({
                        where: { appointmentDate, startTime, postNumber: p }
                    });
                    if (!existing) {
                        assignedPost = p;
                        break;
                    }
                }
                if (assignedPost === null) throw new Error(`Le créneau ${slot} est complet.`);

                return prisma.appointment.create({
                    data: {
                        userId: user.id,
                        serviceId,
                        staffId,
                        appointmentDate,
                        startTime,
                        endTime,
                        postNumber: assignedPost,
                        status: 'PENDING'
                    }
                });
            })
        );

        return NextResponse.json({ appointments }, { status: 201 });
    } catch (error: any) {
        console.error('Booking Error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ message: 'Ce créneau est déjà pris.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, appointmentDate, startTime, endTime, serviceId, staffId } = body;

        if (!id) return NextResponse.json({ message: "ID requis" }, { status: 400 });
        if (await isExpired(id)) return NextResponse.json({ message: "Trop tard pour modifier." }, { status: 403 });

        const currentApp = await prisma.appointment.findUnique({ where: { id } });
        if (!currentApp) return NextResponse.json({ message: "RDV non trouvé" }, { status: 404 });

        let postNumberToUse: number | undefined;
        const isMoving = (appointmentDate && appointmentDate !== currentApp.appointmentDate) || 
                         (startTime && startTime !== currentApp.startTime);

        if (isMoving) {
            const targetDate = appointmentDate || currentApp.appointmentDate;
            const targetTime = startTime || currentApp.startTime;
            let foundPost = null;
            for (let p = 1; p <= 4; p++) {
                const conflict = await prisma.appointment.findFirst({
                    where: { id: { not: id }, appointmentDate: targetDate, startTime: targetTime, postNumber: p }
                });
                if (!conflict) { foundPost = p; break; }
            }
            if (!foundPost) return NextResponse.json({ message: "Créneau complet." }, { status: 409 });
            postNumberToUse = foundPost;
        }

        const updated = await prisma.appointment.update({
            where: { id },
            data: {
                appointmentDate, startTime, endTime, serviceId, staffId,
                ...(postNumberToUse && { postNumber: postNumberToUse })
            }
        });

        return NextResponse.json({ message: "Mis à jour", updatedAppointment: updated }, { status: 200 });
    } catch (error: any) {
        console.error('Update Error:', error);
        if (error.code === 'P2002') return NextResponse.json({ message: "Conflit de créneau." }, { status: 409 });
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ message: "ID requis" }, { status: 400 });
        if (await isExpired(id)) return NextResponse.json({ message: "Trop tard pour annuler." }, { status: 403 });

        await prisma.appointment.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        return NextResponse.json({ message: "Annulé avec succès" }, { status: 200 });
    } catch (error: any) {
        console.error('Delete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

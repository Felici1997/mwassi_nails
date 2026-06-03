import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salonId = searchParams.get('salonId');

        if (!salonId) {
            return NextResponse.json({ message: "L'ID du salon est requis" }, { status: 400 });
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                service: {
                    salonId: salonId
                }
            },
            include: {
                user: true,
                service: true,
                staff: true
            }
        });

        return NextResponse.json({ appointments }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching admin appointments:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, appointmentDate, startTime, endTime, serviceId, staffId } = body;

        if (!id) {
            return NextResponse.json({ message: "L'ID est requis" }, { status: 400 });
        }

        if (await isExpired(id)) {
            return NextResponse.json({ message: "Modification impossible : le rendez-vous est passé depuis plus de 5h." }, { status: 403 });
        }

        // If date or time is changing, we need to find a new available postNumber
        let postNumberToUse: number | undefined;
        
        // Fetch current appointment to see if it's moving
        const currentApp = await prisma.appointment.findUnique({ where: { id } });
        if (!currentApp) return NextResponse.json({ message: "Rendez-vous non trouvé" }, { status: 404 });

        const isMoving = appointmentDate && appointmentDate !== currentApp.appointmentDate || 
                         startTime && startTime !== currentApp.startTime;

        if (isMoving) {
            const targetDate = appointmentDate || currentApp.appointmentDate;
            const targetTime = startTime || currentApp.startTime;
            
            let foundPost = null;
            for (let p = 1; p <= 4; p++) {
                const conflict = await prisma.appointment.findFirst({
                    where: {
                        id: { not: id }, // ignore current appointment
                        appointmentDate: targetDate,
                        startTime: targetTime,
                        postNumber: p
                    }
                });
                if (!conflict) {
                    foundPost = p;
                    break;
                }
            }
            if (!foundPost) {
                return NextResponse.json({ message: "Toutes les places sont occupées pour ce nouveau créneau." }, { status: 409 });
            }
            postNumberToUse = foundPost;
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                appointmentDate,
                startTime,
                endTime,
                serviceId,
                staffId,
                ...(postNumberToUse && { postNumber: postNumberToUse })
            }
        });

        return NextResponse.json({ message: "Rendez-vous mis à jour", updatedAppointment }, { status: 200 });
        } catch (error: any) {
            console.error('Error updating appointment:', error);
            if (error.code === 'P2002') {
                return NextResponse.json({ message: "Conflit de créneau : ce poste est déjà occupé." }, { status: 409 });
            }
            return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
        }
}

        const updateData: any = {};
        if (appointmentDate !== undefined) updateData.appointmentDate = appointmentDate;
        if (startTime !== undefined) updateData.startTime = startTime;
        if (endTime !== undefined) updateData.endTime = endTime;
        if (serviceId !== undefined) updateData.serviceId = serviceId;
        if (staffId !== undefined) updateData.staffId = staffId;
        if (status !== undefined) updateData.status = status;
        if (rejectionNote !== undefined) updateData.rejectionNote = rejectionNote;

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ message: "Rendez-vous mis à jour avec succès", updatedAppointment }, { status: 200 });
    } catch (error: any) {
        console.error('Error updating appointment:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ message: "L'ID du rendez-vous est requis" }, { status: 400 });
        }

        await prisma.appointment.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Rendez-vous annulé avec succès" }, { status: 200 });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

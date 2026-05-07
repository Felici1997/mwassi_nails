import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface AppointmentRequest {
    email: string;
    serviceId: string;
    staffId?: string;
    appointmentDate: string;
    timeSlots: string[];
}

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
    const appointment = await prisma.appointment.findUnique({
        where: { id }
    });

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

export async function POST(request: Request) {
    try {
        const { email, serviceId, staffId, appointmentDate, timeSlots } = await request.json();
        console.log('Booking request received:', { email, serviceId, appointmentDate, timeSlots });

        if (!email || !serviceId || !appointmentDate || !timeSlots || !Array.isArray(timeSlots)) {
            return NextResponse.json({ message: 'Tous les champs sont requis et timeSlots doit être un tableau.' }, { status: 400 });
        }

        // 1. Check Daily Quota (Max 13 clients per day)
        const dailyCount = await prisma.appointment.count({
            where: { appointmentDate }
        });

        if (dailyCount >= 13) {
            return NextResponse.json({ message: 'Le salon est complet pour cette journée (max 13 clients), veuillez réserver un autre jour.' }, { status: 403 });
        }

        // 2. Validate working hours for all slots
        for (const slot of timeSlots) {
            if (!slot.includes(' - ')) {
                return NextResponse.json({ message: `Format de créneau invalide : ${slot}` }, { status: 400 });
            }
            const [start, end] = slot.split(' - ');
            if (!isWithinWorkingHours(start, end)) {
                return NextResponse.json({ message: `Le créneau ${slot} est en dehors des heures d'ouverture (08:00 - 19:00).` }, { status: 400 });
            }
        }

        // Auto-create user if they don't exist in the DB
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('User not found, creating new user:', email);
            user = await prisma.user.create({
                data: {
                    email,
                    givenName: 'Client',
                    familyName: 'Kinde'
                }
            });
        }

        // 3. Create appointments and assign postNumber
        const appointments = await Promise.all(
            timeSlots.map(async (slot) => {
                const [startTime, endTime] = slot.split(' - ');
                
                // Find the first available post (1 to 4)
                let assignedPost = 1;
                for (let p = 1; p <= 4; p++) {
                    const existing = await prisma.appointment.findFirst({
                        where: {
                            appointmentDate,
                            startTime,
                            postNumber: p
                        }
                    });
                    if (!existing) {
                        assignedPost = p;
                        break;
                    }
                }

                return prisma.appointment.create({
                    data: {
                        userId: user.id,
                        serviceId,
                        staffId,
                        appointmentDate,
                        startTime,
                        endTime,
                        postNumber: assignedPost
                    }
                });
            })
        );
        console.log('Appointments created successfully');
        return NextResponse.json({ appointments }, { status: 201 });

    } catch (error) {
        console.error('Error in POST API:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ message: "email manquant" }, { status: 400 });
        }
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                appointments: {
                    include: {
                        service: true,
                        staff: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const appointmentsWithoutUserId = user.appointments.map(({ userId, ...rest }) => rest);

        return NextResponse.json({ appointments: appointmentsWithoutUserId }, { status: 200 });

    } catch (error) {
        console.error('Error in API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                appointmentDate,
                startTime,
                endTime,
                serviceId,
                staffId
            }
        });

        return NextResponse.json({ message: "Rendez-vous mis à jour", updatedAppointment }, { status: 200 });
        } catch (error) {
            console.error('Error updating appointment:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ message: 'L\'ID du rendez-vous est requis' }, { status: 400 });
        }

        if (await isExpired(id)) {
            return NextResponse.json({ message: "Annulation impossible : le rendez-vous est passé depuis plus de 5h." }, { status: 403 });
        }

        await prisma.appointment.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Rendez-vous supprimé avec succès' }, { status: 200 });
        } catch (error) {
            console.error('Error in API:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
}

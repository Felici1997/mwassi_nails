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
                user: {
                    select: { givenName: true, familyName: true, email: true }
                },
                service: {
                    select: { name: true, id: true }
                },
                staff: {
                    select: { name: true, id: true }
                }
            },
            orderBy: {
                appointmentDate: 'asc',
                startTime: 'asc'
            }
        });

        return NextResponse.json({ appointments }, { status: 200 });
    } catch (error) {
        console.error('Error fetching admin appointments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, appointmentDate, startTime, endTime, serviceId, staffId } = body;

        if (!id) {
            return NextResponse.json({ message: "L'ID du rendez-vous est requis" }, { status: 400 });
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

        return NextResponse.json({ message: "Rendez-vous modifié avec succès", updatedAppointment }, { status: 200 });
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

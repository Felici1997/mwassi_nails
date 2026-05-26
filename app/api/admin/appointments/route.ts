import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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
        try {
            fs.writeFileSync(path.join(process.cwd(), 'api_error.log'), `${new Date().toISOString()} - ${error.stack || error}\n`, { flag: 'a' });
        } catch (fsError) {
            console.error('Failed to write to log file', fsError);
        }
        console.error('Error fetching admin appointments:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, appointmentDate, startTime, endTime, serviceId, staffId, status, rejectionNote } = body;

        if (!id) {
            return NextResponse.json({ message: "L'ID du rendez-vous est requis" }, { status: 400 });
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

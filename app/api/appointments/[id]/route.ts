import { NextResponse } from 'next/server';
import { AppointmentService } from '@/services/appointment.service';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const body: Record<string, unknown> = await request.json();
        const updated = await AppointmentService.updateAppointment(params.id, body);
        return NextResponse.json({ message: "Mis à jour", updatedAppointment: updated }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await AppointmentService.cancelAppointment(params.id);
        return NextResponse.json({ message: 'Supprimé avec succès' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

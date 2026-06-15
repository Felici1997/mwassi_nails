import { NextResponse } from 'next/server';
import { AppointmentService } from '@/services/appointment.service';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { ...updates } = body;
        const updated = await AppointmentService.updateAppointment(params.id, updates);
        return NextResponse.json({ message: "Mis à jour", updatedAppointment: updated }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await AppointmentService.cancelAppointment(params.id);
        return NextResponse.json({ message: 'Supprimé avec succès' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

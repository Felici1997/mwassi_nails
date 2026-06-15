import { NextResponse } from 'next/server';
import { AppointmentService } from '@/services/appointment.service';
import { SalonService } from '@/services/salon.service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salonId = searchParams.get('salonId') || await SalonService.getMwassiSalonId();
        const appointments = await AppointmentService.getAppointmentsBySalon(salonId);
        return NextResponse.json({ appointments }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        const updated = await AppointmentService.updateAppointment(id, updates);
        return NextResponse.json({ updated }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        await AppointmentService.cancelAppointment(id);
        return NextResponse.json({ message: 'Rendez-vous annulé' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

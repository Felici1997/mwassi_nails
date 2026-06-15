import { NextResponse } from 'next/server';
import { AppointmentService } from '@/services/appointment.service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, serviceId, staffId, appointmentDate, timeSlots } = body;

        if (!email || !serviceId || !appointmentDate || !timeSlots || !Array.isArray(timeSlots)) {
            return NextResponse.json({ message: 'Tous les champs sont requis.' }, { status: 400 });
        }

        const appointments = await AppointmentService.createBooking({ email, serviceId, staffId, appointmentDate, timeSlots });
        return NextResponse.json({ appointments }, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ message: 'Ce créneau vient d\'être pris. Veuillez choisir un autre horaire.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        if (!email) return NextResponse.json({ message: "email manquant" }, { status: 400 });
        
        const appointments = await AppointmentService.getUserAppointments(email);
        return NextResponse.json({ appointments }, { status: 200 });
    } catch (error: any) {
        if (error.message === 'Utilisateur non trouvé') return NextResponse.json({ message: error.message }, { status: 404 });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ message: "L'ID est requis" }, { status: 400 });
        
        const updated = await AppointmentService.updateAppointment(id, updates);
        return NextResponse.json({ message: "Mis à jour", updatedAppointment: updated }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ message: 'L\'ID est requis' }, { status: 400 });
        
        await AppointmentService.cancelAppointment(id);
        return NextResponse.json({ message: 'Supprimé avec succès' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}



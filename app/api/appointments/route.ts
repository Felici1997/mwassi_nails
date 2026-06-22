import { NextResponse } from 'next/server';
import { AppointmentService } from '@/services/appointment.service';
import { UserService } from '@/services/user.service';

export async function POST(request: Request) {
    try {
        const body: { email?: string; serviceId?: string; staffId?: string | null; appointmentDate?: string; timeSlots?: string[]; notes?: string; imageUrl?: string } = await request.json();
        const { email, serviceId, staffId, appointmentDate, timeSlots, notes, imageUrl } = body;

        if (!email || !serviceId || !appointmentDate || !timeSlots || !Array.isArray(timeSlots)) {
            return NextResponse.json({ message: 'Tous les champs sont requis.' }, { status: 400 });
        }

        const dbUser = await UserService.getUserByEmail(email);
        if (!dbUser?.phone1 || !dbUser?.fullName) {
            return NextResponse.json({ message: 'Complétez votre profil avant de réserver.', requiresProfile: true }, { status: 403 });
        }

        const appointments = await AppointmentService.createBooking({ email, serviceId, staffId, appointmentDate, timeSlots, notes, imageUrl });
        return NextResponse.json({ appointments }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
            return NextResponse.json({ message: 'Ce créneau vient d\'être pris. Veuillez choisir un autre horaire.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        if (!email) return NextResponse.json({ message: "email manquant" }, { status: 400 });
        
        const appointments = await AppointmentService.getUserAppointments(email);
        return NextResponse.json({ appointments }, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Utilisateur non trouvé') return NextResponse.json({ message: error.message }, { status: 404 });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body: { id?: string; [key: string]: unknown } = await request.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ message: "L'ID est requis" }, { status: 400 });
        
        const updated = await AppointmentService.updateAppointment(id, updates);
        return NextResponse.json({ message: "Mis à jour", updatedAppointment: updated }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json() as { id?: string };
        if (!id) return NextResponse.json({ message: 'L\'ID est requis' }, { status: 400 });
        
        await AppointmentService.cancelAppointment(id);
        return NextResponse.json({ message: 'Supprimé avec succès' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

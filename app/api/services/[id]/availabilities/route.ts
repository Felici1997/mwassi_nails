import { NextResponse } from 'next/server';
import { AppointmentService } from '@/services/appointment.service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { serviceId, appointmentDate } = body;
        
        console.log('--- DEBUG: Availabilities API ---');
        console.log('Request Body:', body);

        if (!serviceId || !appointmentDate) {
            console.log('DEBUG: Missing fields');
            return NextResponse.json({ message: 'Tous les champs sont requis' }, { status: 400 });
        }

        const dateParts = appointmentDate.split('/');
        if (dateParts.length !== 3 || dateParts[2].length !== 4) {
            console.log('DEBUG: Invalid date format:', appointmentDate);
            return NextResponse.json({ message: 'Format de date invalide. Utilisez le format dd/MM/yyyy.' }, { status: 400 });
        }

        const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
        if (isNaN(date.getTime())) {
            console.log('DEBUG: Date object is NaN');
            return NextResponse.json({ message: 'Date invalide.' }, { status: 400 });
        }

        console.log('DEBUG: Fetching availabilities for service:', serviceId);
        const { service, salonId, existingAppointments } = await AppointmentService.getAvailabilities(serviceId, appointmentDate);

        console.log('DEBUG: Successfully fetched data. Service:', service?.name);
        return NextResponse.json({ service, salonId, existingAppointments }, { status: 200 });
    } catch (error: any) {
        console.error('DEBUG ERROR:', error);
        if (error.message === 'Service non trouvé.') {
            return NextResponse.json({ message: error.message }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

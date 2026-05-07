import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { serviceId, appointmentDate } = await request.json()

        if (!serviceId || !appointmentDate) {
            return NextResponse.json({ message: 'Tous les champs sont requis' }, { status: 400 });
        }

        const dateParts = appointmentDate.split('/')
        if (dateParts.length !== 3 || dateParts[2].length !== 4) {
            return NextResponse.json({ message: 'Format de date invalide. Utilisez le format dd/MM/yyyy.' }, { status: 400 });
        }  // 10/12/2004


        const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`); // Conversion en objet Date

        // Vérifier si la date est valide
        if (isNaN(date.getTime())) {
            return NextResponse.json(
                { message: 'Date invalide.' },
                { status: 400 }
            );
        }

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                duration: true,
                imgUrl: true,
                salonId: true
            }
        })

        if (!service) {
            return NextResponse.json(
                { message: 'Service non trouvé.' },
                { status: 404 }
            );
        }

        const existingAppointments = await prisma.appointment.findMany({
             where : {
                serviceId : serviceId ,
                appointmentDate : appointmentDate
             },
             select: {
                    startTime:true,
                    endTime: true
             }
        })

        return NextResponse.json({ service , salonId: service.salonId, existingAppointments}, { status: 200 });


    } catch (error) {
        console.error('Error in API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

}

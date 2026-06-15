import { NextResponse } from 'next/server';
import { ServiceService } from '@/services/service.service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, price, duration, category, description } = body;

        if (!name || !price || !duration) {
            return NextResponse.json({ message: "Le nom, le prix et la durée sont obligatoires" }, { status: 400 });
        }

        const newService = await ServiceService.createService({
            name, 
            price: parseFloat(price), 
            duration: parseInt(duration, 10), 
            category, 
            description 
        });

        return NextResponse.json({ message: "Service créé avec succès", serviceId: newService.id }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating service:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function GET(_request: Request) {
    try {
        const { services, salonName } = await ServiceService.getServicesForSalon();
        return NextResponse.json({ services, salonName }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { serviceId } = await request.json();
        if (!serviceId) {
            return NextResponse.json({ message: "ID du service manquant" }, { status: 400 });
        }
        await ServiceService.deleteService(serviceId);
        return NextResponse.json({ message: 'Service supprimé avec succès' }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting service:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}



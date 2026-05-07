import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request) {
    try {
        const { serviceId, name, price, duration, description } = await request.json();

        if (!serviceId) {
            return NextResponse.json({ message: "L'ID du service est requis" }, { status: 400 });
        }

        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: {
                name: name,
                price: price ? parseFloat(price) : undefined,
                duration: duration ? parseInt(duration, 10) : undefined,
                description: description,
            }
        });

        return NextResponse.json({ message: "Service mis à jour avec succès", updatedService }, { status: 200 });
    } catch (error) {
        console.error('Error updating service:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

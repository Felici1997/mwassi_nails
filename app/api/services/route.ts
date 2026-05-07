import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function getMwassiSalon() {
    const salonName = "Mwassi Nails";
    let salon = await prisma.salon.findUnique({
        where: { name: salonName }
    });

    if (!salon) {
        // Create a dummy user to be the creator if not exists
        const adminUser = await prisma.user.upsert({
            where: { email: 'admin@nailbook.com' },
            update: {},
            create: {
                email: 'admin@nailbook.com',
                givenName: 'Admin',
                familyName: 'NailBook',
            },
        });

        salon = await prisma.salon.create({
            data: {
                name: salonName,
                createdById: adminUser.id
            },
        });
    }
    return salon;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, price, duration, category, description } = body;

        if (!name || !price || !duration) {
            return NextResponse.json({ message: "Le nom, le prix et la durée sont obligatoires" }, { status: 400 });
        }

        const salon = await getMwassiSalon();

        const newService = await prisma.service.create({
            data: {
                name,
                price: parseFloat(price),
                duration: parseInt(duration, 10),
                category: category || "Divers",
                description: description || "",
                salonId: salon.id
            }
        });

        return NextResponse.json({ message: "Service créé avec succès", serviceId: newService.id }, { status: 201 });

    } catch (error) {
        console.error('Error creating service:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const salon = await getMwassiSalon();
        const services = await prisma.service.findMany({
            where : { salonId : salon.id },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json({ services , salonName: salon.name }, { status: 200 });

    } catch (error) {
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
        await prisma.service.delete({
            where : { id: serviceId }
        })
        return NextResponse.json({ message: 'Service supprimé avec succès' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting service:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

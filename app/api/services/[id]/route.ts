import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if any appointments are linked to this service
        const appointments = await prisma.appointment.findMany({
            where: { serviceId: id }
        });

        if (appointments.length > 0) {
            return NextResponse.json(
                { message: `Impossible de supprimer le service car ${appointments.length} rendez-vous y sont liés.` },
                { status: 400 }
            );
        }

        await prisma.service.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Service supprimé avec succès" }, { status: 200 });
    } catch (error) {
        console.error('Error deleting service:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

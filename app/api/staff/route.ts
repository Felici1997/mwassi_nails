import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salonId = searchParams.get('salonId');

        if (!salonId) {
            return NextResponse.json({ error: 'salonId manquant' }, { status: 400 });
        }

        const staff = await prisma.staff.findMany({
            where: { salonId },
            include: {
                user: {
                    select: {
                        givenName: true,
                        familyName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        return NextResponse.json({ staff }, { status: 200 });
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, salonId, userId } = await request.json();

        if (!name || !salonId || !userId) {
            return NextResponse.json({ error: 'Nom, salonId et userId sont requis' }, { status: 400 });
        }

        const staffMember = await prisma.staff.create({
            data: {
                name,
                salonId,
                userId
            }
        });

        return NextResponse.json({ message: "Membre du personnel ajouté", staffMember }, { status: 201 });
    } catch (error) {
        console.error('Error adding staff:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, name, role, userId } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID est requis' }, { status: 400 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;

        const updatedStaff = await prisma.staff.update({
            where: { id },
            data: updateData
        });

        if (role && userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { role }
            });
        }

        return NextResponse.json({ message: "Membre mis à jour", updatedStaff }, { status: 200 });
    } catch (error) {
        console.error('Error updating staff:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        }

        await prisma.staff.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Membre supprimé" }, { status: 200 });
    } catch (error) {
        console.error('Error deleting staff:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { StaffService } from '@/services/staff.service';
import { SalonService } from '@/services/salon.service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salonId = searchParams.get('salonId') || await SalonService.getMwassiSalonId();
        const staff = await StaffService.getStaffBySalon(salonId);
        return NextResponse.json({ staff }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, salonId, userId } = await request.json();
        if (!name || !userId) {
            return NextResponse.json({ error: 'Nom et userId sont requis' }, { status: 400 });
        }
        const finalSalonId = salonId || await SalonService.getMwassiSalonId();
        const staffMember = await StaffService.addStaff({ name, salonId: finalSalonId, userId });
        return NextResponse.json({ message: "Membre du personnel ajouté", staffMember }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, name, role, userId } = await request.json();
        if (!id) return NextResponse.json({ error: 'ID est requis' }, { status: 400 });
        const updatedStaff = await StaffService.updateStaff(id, { name, role, userId });
        return NextResponse.json({ message: "Membre mis à jour", updatedStaff }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        await StaffService.removeStaff(id);
        return NextResponse.json({ message: "Membre supprimé" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

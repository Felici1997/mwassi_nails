import { NextResponse } from 'next/server';
import { SalonService } from '@/services/salon.service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salonId = searchParams.get('salonId') || await SalonService.getMwassiSalonId();
 
        const stats = await SalonService.getAdminStats(salonId);
        return NextResponse.json(stats, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}



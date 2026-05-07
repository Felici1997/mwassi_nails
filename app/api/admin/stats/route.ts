import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salonId = searchParams.get('salonId');

        if (!salonId) {
            return NextResponse.json({ error: 'salonId manquant' }, { status: 400 });
        }

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const [totalServices, appointmentsToday] = await Promise.all([
            prisma.service.count({
                where: { salonId }
            }),
            prisma.appointment.count({
                where: {
                    service: { salonId },
                    appointmentDate: todayStr
                }
            }),
        ]);

        // Correct way to get revenue:
        const appointmentsWithService = await prisma.appointment.findMany({
            where: {
                service: { salonId }
            },
            include: {
                service: true
            }
        });

        const totalRevenue = appointmentsWithService.reduce((acc, app) => acc + app.service.price, 0);

        return NextResponse.json({
            totalServices,
            appointmentsToday,
            totalRevenue
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

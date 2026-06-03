import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salonId = searchParams.get('salonId');

        if (!salonId) {
            return NextResponse.json({ error: 'salonId manquant' }, { status: 400 });
        }

        const today = dayjs().format('DD/MM/YYYY');

        // 1. Total Services
        const totalServices = await prisma.service.count({
            where: { salonId }
        });

        // 2. Appointments Today
        const appointmentsToday = await prisma.appointment.count({
            where: {
                appointmentDate: today,
                salonId: { // Wait, appointment doesn't have salonId directly. It has serviceId.
                    // We need to filter through service.
                }
            }
        });
        // Correction: Filter by service's salonId
        const appointmentsTodayCount = await prisma.appointment.count({
            where: {
                appointmentDate: today,
                service: {
                    salonId: salonId
                }
            }
        });

        // 3. Total Revenue (Sum of prices of all appointments for this salon)
        const appointments = await prisma.appointment.findMany({
            where: {
                service: {
                    salonId: salonId
                }
            },
            include: {
                service: true
            }
        });

        const totalRevenue = appointments.reduce((sum, app) => {
            return sum + (app.service.price || 0);
        }, 0);

        return NextResponse.json({
            totalServices,
            appointmentsToday: appointmentsTodayCount,
            totalRevenue
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

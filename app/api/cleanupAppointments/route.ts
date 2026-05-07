import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';

export async function DELETE(request: Request) {
    try {
        const now = dayjs()

        const expiredAppointments = await prisma.appointment.findMany({
            where : {
                OR: [
                    {
                        appointmentDate : {
                            lt:now.format('DD/MM/YYYY')
                        }
                    },
                    {
                        appointmentDate : {
                            equals:now.format('DD/MM/YYYY')
                        },
                        endTime : {
                            lt: now.format('HH:mm')
                        }

                    }
                ]
            }
        })

        if(expiredAppointments.length > 0){
            await prisma.appointment.deleteMany({
                where : {
                    id : {
                        in : expiredAppointments.map((appointment) => appointment.id)
                    }
                }
            })
        }
        
    return NextResponse.json({ message: 'Expired appointments cleaned up' });
  
    } catch (error) {
        console.error('Error cleaning up appointments:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
      }
}

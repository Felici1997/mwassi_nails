import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const result = await prisma.appointment.updateMany({
      where: {
        postNumber: null,
      },
      data: {
        postNumber: 1,
      },
    });
    return NextResponse.json({ message: `Updated ${result.count} appointments.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

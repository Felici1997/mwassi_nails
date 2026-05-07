import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        givenName: true,
        familyName: true,
      },
      orderBy: {
        email: 'asc'
      }
    });
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, famillyName, givenName } = await request.json();

    if (!email || !famillyName || !givenName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          famillyName,
          givenName,
        },
      });
    } else {
      if (user.famillyName == null || user.givenName == null) {
        user = await prisma.user.update({
          where: { email },
          data: {
            famillyName: user.famillyName ?? famillyName,
            givenName: user.givenName ?? givenName,
          },
        });
      }
    }

    const salon = await prisma.salon.findUnique({
      where: { name: "Mwassi Nails" }
    });

    if (salon) {
      return NextResponse.json({ salonId: salon.id });
    } else {
      // In case the salon doesn't exist yet, create it
      const newSalon = await prisma.salon.create({
        data: {
          name: "Mwassi Nails",
          createdBy: { connect: { id: user.id } }
        }
      });
      return NextResponse.json({ salonId: newSalon.id });
    }
  } catch (error) {
    console.error('Error in API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

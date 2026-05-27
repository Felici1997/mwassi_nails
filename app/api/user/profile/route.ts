import { NextResponse, NextRequest } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const profileSchema = z.object({
  fullName: z.string().optional(),
  phone1: z.string().min(5, "Phone number too short"),
  phone2: z.string().optional(),
  birthday: z.string().optional(), // ISO string
  profession: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const { isAuthenticated, user } = await getKindeServerSession();

  if (!isAuthenticated || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = profileSchema.parse(body);

    // Handle empty birthday string
    const birthdayValue = validatedData.birthday && validatedData.birthday.trim() !== "" 
      ? new Date(validatedData.birthday) 
      : undefined;

    const updatedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: validatedData.fullName,
        phone1: validatedData.phone1,
        phone2: validatedData.phone2,
        profession: validatedData.profession,
        birthday: birthdayValue,
      },
      create: {
        email: user.email,
        fullName: validatedData.fullName,
        phone1: validatedData.phone1,
        phone2: validatedData.phone2,
        profession: validatedData.profession,
        birthday: birthdayValue,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Detailed Profile Update Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

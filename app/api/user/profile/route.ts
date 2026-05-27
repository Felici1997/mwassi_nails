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

    const updatedUser = await prisma.user.update({
      where: { email: user.email },
      data: {
        ...validatedData,
        birthday: validatedData.birthday ? new Date(validatedData.birthday) : undefined,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

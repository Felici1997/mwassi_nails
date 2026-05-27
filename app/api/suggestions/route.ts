import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const suggestionSchema = z.object({
  content: z.string().min(1, "Suggestion cannot be empty").max(1000, "Suggestion too long"),
});

export async function POST(req: Request) {
  const { isAuthenticated, user } = await getKindeServerSession();

  if (!isAuthenticated || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content } = suggestionSchema.parse(body);

    // Find the user in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const suggestion = await prisma.suggestion.create({
      data: {
        userId: dbUser.id,
        content,
      },
    });

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Suggestion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

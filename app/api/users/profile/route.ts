import { NextResponse, NextRequest } from 'next/server';
import { UserService } from '@/services/user.service';

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const email = body.email as string | undefined;
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  try {
    const updatedUser = await UserService.updateProfile(email, body);
    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: (error as { errors: [{ message: string }] }).errors[0].message }, { status: 400 });
    }
    console.error('Detailed Profile Update Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

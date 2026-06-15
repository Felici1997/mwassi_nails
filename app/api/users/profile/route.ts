import { NextResponse, NextRequest } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { UserService } from '@/services/user.service';

export async function PATCH(req: NextRequest) {
  const { isAuthenticated, user } = await getKindeServerSession();

  if (!isAuthenticated || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updatedUser = await UserService.updateProfile(user.email, body);
    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
        return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Detailed Profile Update Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}



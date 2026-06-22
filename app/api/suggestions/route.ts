import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { NotificationService } from '@/services/notification.service';

export async function POST(req: Request) {
  const { isAuthenticated, user } = await getKindeServerSession();

  if (!isAuthenticated || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: { content?: string } = await req.json();
    const { content } = body;
    const suggestion = await NotificationService.createSuggestion(user.email, content);
    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: (error as { errors: unknown }).errors }, { status: 400 });
    }
    console.error('Suggestion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

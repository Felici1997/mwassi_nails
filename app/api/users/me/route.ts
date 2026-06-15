import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { UserService } from '@/services/user.service';

export async function GET() {
    const { isAuthenticated, getUser } = await getKindeServerSession();
    const user = await getUser();

    console.log('--- DEBUG SERVER: /api/users/me ---');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user email:', user?.email);

    if (!isAuthenticated || !user || !user.email) {
        console.log('DEBUG SERVER: Access denied (Unauthorized)');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dbUser = await UserService.getUserByEmail(user.email);
        console.log('DEBUG SERVER: DB User found:', dbUser?.email, 'Role:', dbUser?.role);

        return NextResponse.json({ 
            role: dbUser?.role || 'USER', 
            email: user.email,
            profile: dbUser,
            isProfileComplete: !!dbUser?.phone1 
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user role:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

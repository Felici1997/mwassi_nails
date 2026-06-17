import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { UserService } from '@/services/user.service';

export async function GET() {
    const { isAuthenticated, getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!isAuthenticated || !user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dbUser = await UserService.getUserByEmail(user.email);

        return NextResponse.json({ 
            role: dbUser?.role || 'USER', 
            email: user.email,
            profile: dbUser,
            isProfileComplete: !!(dbUser?.phone1 && dbUser?.fullName) 
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user role:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

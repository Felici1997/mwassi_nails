import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
    const { isAuthenticated, user } = await getKindeServerSession();

    if (!isAuthenticated || !user) {
        return NextResponse.json({ error: 'Unauthorized', authenticated: isAuthenticated, userEmail: user?.email }, { status: 401 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { 
                role: true,
                fullName: true,
                phone1: true,
                phone2: true,
                birthday: true,
                profession: true,
            }
        });

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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRole(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { role: true }
        });
        console.log(`User ${email} has role: ${user?.role}`);
    } catch (error) {
        console.error('Error checking role:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const email = 'mrpfouapo@gmail.com';
checkRole(email);

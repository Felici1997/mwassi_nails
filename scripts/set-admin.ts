import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdmin(email: string) {
    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { role: 'ADMIN' },
            create: {
                email,
                role: 'ADMIN',
                givenName: 'Admin',
                familyName: 'User',
            },
        });
        console.log(`User ${email} is now an ADMIN.`);
    } catch (error) {
        console.error('Error setting admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address.');
    process.exit(1);
}

setAdmin(email);

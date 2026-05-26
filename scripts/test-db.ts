import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
    try {
        await prisma.$connect();
        console.log('✅ Database connection successful');
        const count = await prisma.appointment.count();
        console.log(`Total appointments in DB: ${count}`);
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();

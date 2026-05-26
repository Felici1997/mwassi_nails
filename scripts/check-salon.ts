import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSalon(salonId: string) {
    try {
        const salon = await prisma.salon.findUnique({
            where: { id: salonId }
        });
        if (salon) {
            console.log(`✅ Salon found: ${salon.name}`);
        } else {
            console.log(`❌ Salon not found with ID: ${salonId}`);
        }
    } catch (error) {
        console.error('Error checking salon:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSalon('cmor6kyk20002gp399ebvy9gx');

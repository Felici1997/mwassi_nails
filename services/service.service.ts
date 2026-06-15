import prisma from '@/lib/db/prisma';
import { SalonService } from './salon.service';

export const ServiceService = {
    async createService(data: { name: string; price: number; duration: number; category?: string; description?: string }) {
        const salon = await SalonService.getMwassiSalon();
        return await prisma.service.create({
            data: {
                name: data.name,
                price: data.price,
                duration: data.duration,
                category: data.category || "Divers",
                description: data.description || "",
                salonId: salon.id
            }
        });
    },

    async getServicesForSalon(salonId?: string) {
        const salon = salonId 
            ? await prisma.salon.findUnique({ where: { id: salonId } })
            : await SalonService.getMwassiSalon();

        if (!salon) throw new Error('Salon introuvable');

        const services = await prisma.service.findMany({
            where: { salonId: salon.id },
            orderBy: { name: 'asc' }
        });

        return { services, salonName: salon.name };
    },

    async deleteService(id: string) {
        return await prisma.service.delete({
            where: { id }
        });
    },

    async updateService(id: string, data: any) {
        return await prisma.service.update({
            where: { id },
            data: data
        });
    }
};

import prisma from '@/lib/db/prisma';
import { SalonService } from './salon.service';

export const StaffService = {
    async getStaffBySalon(salonId?: string) {
        const finalSalonId = salonId || await SalonService.getMwassiSalonId();
        return await prisma.staff.findMany({
            where: { salonId: finalSalonId },
            include: {
                user: {
                    select: {
                        givenName: true,
                        familyName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
    },

    async addStaff(data: { name: string; salonId?: string; userId: string }) {
        const finalSalonId = data.salonId || await SalonService.getMwassiSalonId();
        return await prisma.staff.create({
            data: {
                name: data.name,
                salonId: finalSalonId,
                userId: data.userId
            }
        });
    },

    async updateStaff(id: string, data: { name?: string; role?: string; userId?: string }) {
        const updatedStaff = await prisma.staff.update({
            where: { id },
            data: {
                name: data.name
            }
        });

        if (data.role && data.userId) {
            await prisma.user.update({
                where: { id: data.userId },
                data: { role: data.role }
            });
        }

        return updatedStaff;
    },

    async removeStaff(id: string) {
        return await prisma.staff.delete({
            where: { id }
        });
    }
};

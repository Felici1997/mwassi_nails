import prisma from '@/lib/db/prisma';
import { SalonService } from './salon.service';

export interface AppointmentUpdateInput {
    appointmentDate?: string;
    startTime?: string;
    endTime?: string;
    serviceId?: string;
    staffId?: string;
    status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
    rejectionNote?: string;
}

export const AppointmentService = {
    async isWithinWorkingHours(startTime: string, endTime: string): Promise<boolean> {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        const opening = 8 * 60; // 08:00
        const closing = 19 * 60; // 19:00
        return startTotal >= opening && endTotal <= closing;
    },

    async getAvailabilities(serviceId: string, appointmentDate: string) {
        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        });

        if (!service) {
            throw new Error('Service non trouvé.');
        }

        const existingAppointments = await prisma.appointment.findMany({
            where: {
                serviceId,
                appointmentDate
            },
            select: {
                startTime: true,
                endTime: true
            }
        });

        return {
            service,
            salonId: service.salonId,
            existingAppointments
        };
    },

    async isExpired(id: string): Promise<boolean> {
        const appointment = await prisma.appointment.findUnique({ where: { id } });
        if (!appointment) return true;

        const [day, month, year] = appointment.appointmentDate.split('/');
        const isoDate = `${year}-${month}-${day}`;
        const appointmentDateTime = new Date(`${isoDate}T${appointment.startTime}`);
        const now = new Date();
        const diffInMs = now.getTime() - appointmentDateTime.getTime();
        const fiveHoursInMs = 5 * 60 * 60 * 1000;

        return diffInMs > fiveHoursInMs;
    },

    async getAppointmentsBySalon(salonId?: string) {
        const finalSalonId = salonId || await SalonService.getMwassiSalonId();
        return await prisma.appointment.findMany({
            where: { service: { salonId: finalSalonId } },
            include: { user: true, service: true, staff: true }
        });
    },

    async getUserAppointments(email: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { appointments: { include: { service: true, staff: true } } }
        });

        if (!user) throw new Error('Utilisateur non trouvé');

        return user.appointments.map(({ userId, ...rest }) => rest);
    },

    async createBooking(data: {
        email: string;
        serviceId: string;
        staffId: string;
        appointmentDate: string;
        timeSlots: string[];
    }) {
        const { email, serviceId, staffId, appointmentDate, timeSlots } = data;

        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) throw new Error('Service introuvable.');

        const dailyCount = await prisma.appointment.count({ where: { appointmentDate } });
        if (dailyCount >= 13) throw new Error('Le salon est complet pour cette journée.');

        for (const slot of timeSlots) {
            const [start, end] = slot.split(' - ');
            if (!start || !end || !(await this.isWithinWorkingHours(start, end))) {
                throw new Error(`Créneau ${slot} invalide ou hors horaires.`);
            }
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: { email, givenName: 'Client', familyName: 'Kinde' }
            });
        }

        const appointments = await Promise.all(
            timeSlots.map(async (slot) => {
                const [startTime, endTime] = slot.split(' - ');
                let assignedPost: number | null = null;
                for (let p = 1; p <= 4; p++) {
                    const existing = await prisma.appointment.findFirst({
                        where: { appointmentDate, startTime, postNumber: p }
                    });
                    if (!existing) {
                        assignedPost = p;
                        break;
                    }
                }
                if (assignedPost === null) throw new Error(`Le créneau ${slot} est complet.`);

                return prisma.appointment.create({
                    data: {
                        userId: user.id,
                        serviceId,
                        staffId,
                        appointmentDate,
                        startTime,
                        endTime,
                        postNumber: assignedPost,
                        status: 'PENDING'
                    }
                });
            })
        );

        return appointments;
    },

    async updateAppointment(id: string, updates: AppointmentUpdateInput) {
        if (await this.isExpired(id)) throw new Error('Trop tard pour modifier.');

        const currentApp = await prisma.appointment.findUnique({ where: { id } });
        if (!currentApp) throw new Error('RDV non trouvé');

        const updateData: any = {};
        if (updates.status) updateData.status = updates.status;
        if (updates.rejectionNote) updateData.rejectionNote = updates.rejectionNote;

        if (updates.appointmentDate || updates.startTime || updates.endTime || updates.serviceId || updates.staffId) {
            if (updates.appointmentDate) updateData.appointmentDate = updates.appointmentDate;
            if (updates.startTime) updateData.startTime = updates.startTime;
            if (updates.endTime) updateData.endTime = updates.endTime;
            if (updates.serviceId) updateData.serviceId = updates.serviceId;
            if (updates.staffId) updateData.staffId = updates.staffId;

            const isMoving = (updates.appointmentDate && updates.appointmentDate !== currentApp.appointmentDate) || 
                             (updates.startTime && updates.startTime !== currentApp.startTime);

            if (isMoving) {
                const targetDate = updates.appointmentDate || currentApp.appointmentDate;
                const targetTime = updates.startTime || currentApp.startTime;
                let foundPost = null;
                for (let p = 1; p <= 4; p++) {
                    const conflict = await prisma.appointment.findFirst({
                        where: { id: { not: id }, appointmentDate: targetDate, startTime: targetTime, postNumber: p }
                    });
                    if (!conflict) { foundPost = p; break; }
                }
                if (!foundPost) throw new Error('Créneau complet.');
                updateData.postNumber = foundPost;
            }
        }

        return await prisma.appointment.update({
            where: { id },
            data: updateData
        });
    },

    async cancelAppointment(id: string) {
        if (await this.isExpired(id)) throw new Error('Trop tard pour annuler.');
        return await prisma.appointment.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    },

    async cleanupExpiredAppointments() {
        const now = new Date();
        const todayStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const currentTime = now.toTimeString().slice(0, 5);

        const expiredAppointments = await prisma.appointment.findMany({
            where: {
                OR: [
                    { appointmentDate: { lt: todayStr } },
                    {
                        appointmentDate: { equals: todayStr },
                        endTime: { lt: currentTime }
                    }
                ]
            }
        });

        if (expiredAppointments.length > 0) {
            return await prisma.appointment.deleteMany({
                where: {
                    id: { in: expiredAppointments.map(app => app.id) }
                }
            });
        }
        return { count: 0 };
    }
};


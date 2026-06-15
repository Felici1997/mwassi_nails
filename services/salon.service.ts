import prisma from '@/lib/db/prisma';

export const SalonService = {
    async getMwassiSalon() {
        const salon = await prisma.salon.findUnique({
            where: { name: 'Mwassi Nails' }
        });
        if (!salon) throw new Error('Le salon Mwassi Nails n\'a pas été configuré.');
        return salon;
    },

    async getMwassiSalonId() {
        const salon = await this.getMwassiSalon();
        return salon.id;
    },

    async getAdminStats(salonId: string) {
        const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        // Note: the app uses dd/MM/yyyy
        const formattedToday = today.replace(/\//g, '/'); // just in case

        const totalServices = await prisma.service.count({
            where: { salonId }
        });

        const appointmentsTodayCount = await prisma.appointment.count({
            where: {
                appointmentDate: formattedToday,
                service: { salonId }
            }
        });

        const appointments = await prisma.appointment.findMany({
            where: {
                service: { salonId }
            },
            include: { service: true }
        });

        const totalRevenue = appointments.reduce((sum, app) => sum + (app.service.price || 0), 0);

        return {
            totalServices,
            appointmentsToday: appointmentsTodayCount,
            totalRevenue
        };
    }
};

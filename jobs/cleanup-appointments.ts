import { AppointmentService } from '@/services/appointment.service';

export async function run() {
    console.log('Running appointment cleanup job...');
    try {
        const result = await AppointmentService.cleanupExpiredAppointments();
        console.log('Cleanup completed successfully.');
    } catch (error) {
        console.error('Error running cleanup job:', error);
    }
}

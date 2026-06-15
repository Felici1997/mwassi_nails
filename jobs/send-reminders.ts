import { NotificationService } from '@/services/notification.service';

export async function run() {
    console.log('Running daily reminders job...');
    try {
        const result = await NotificationService.sendDailyReminders();
        console.log(`Successfully sent ${result.sentCount} reminders.`);
        if (result.errors.length > 0) {
            console.error('Errors encountered:', result.errors);
        }
    } catch (error) {
        console.error('Error running reminders job:', error);
    }
}

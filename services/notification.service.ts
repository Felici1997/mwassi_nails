import prisma from '@/lib/db/prisma';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend('re_Yj9CBYPY_FkcHVS5ELrLi1c28PYhgqvLh');

const suggestionSchema = z.object({
    content: z.string().min(1, "Suggestion cannot be empty").max(1000, "Suggestion too long"),
});

export const NotificationService = {
    async createSuggestion(email: string, content: string) {
        const validated = suggestionSchema.parse({ content });
        
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) throw new Error('User not found in database');

        return await prisma.suggestion.create({
            data: {
                userId: dbUser.id,
                content: validated.content,
            },
        });
    },

    async sendDailyReminders() {
        const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedToday = today.replace(/\//g, '/');

        const appointments = await prisma.appointment.findMany({
            where: {
                appointmentDate: formattedToday,
            },
            include: {
                user: {
                    select: {
                        email: true,
                        givenName: true,
                        familyName: true,
                    },
                },
                service: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (appointments.length === 0) return { sentCount: 0, errors: [] };

        let sentCount = 0;
        const errors = [];

        for (const app of appointments) {
            if (app.user?.email) {
                try {
                    await resend.emails.send({
                        from: 'NailBook <onboarding@resend.dev>',
                        to: app.user.email,
                        subject: `Rappel : Votre rendez-vous chez Mwassi Nails aujourd'hui ! ✨`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                <h2 style="color: #E11D48;">Bonjour ${app.user.givenName || 'Client'},</h2>
                                <p>Ceci est un petit rappel pour votre rendez-vous aujourd'hui !</p>
                                <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 5px 0;"><strong>Service :</strong> ${app.service.name}</p>
                                    <p style="margin: 5px 0;"><strong>Heure :</strong> ${app.startTime} - ${app.endTime}</p>
                                </div>
                                <p>Nous avons hâte de vous voir chez <strong>Mwassi Nails</strong> !</p>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                                <p style="font-size: 12px; color: #9CA3AF; text-align: center;">
                                    Si vous avez un empêchement, merci de nous prévenir au plus vite.
                                </p>
                            </div>
                        `,
                    });
                    sentCount++;
                } catch (err: any) {
                    errors.push({ email: app.user.email, error: err.message || 'Unknown error' });
                }
            }
        }

        return { sentCount, errors };
    }
};


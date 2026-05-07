import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend('re_Yj9CBYPY_FkcHVS5ELrLi1c28PYhgqvLh');

export async function GET() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1. Fetch all appointments for today
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: todayStr,
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

    if (appointments.length === 0) {
      return NextResponse.json({ message: 'Aucun rendez-vous pour aujourd\'hui.' }, { status: 200 });
    }

    let sentCount = 0;
    const errors = [];

    // 2. Iterate through appointments and send emails
    for (const app of appointments) {
      if (app.user?.email) {
        try {
          await resend.emails.send({
            from: 'NailBook <onboarding@resend.dev>', // Default Resend testing address
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
        } catch (err) {
          console.error(`Failed to send email to ${app.user.email}:`, err);
          errors.push({ email: app.user.email, error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    }

    return NextResponse.json({
      message: `Processus terminé : ${sentCount} emails envoyés.`,
      sentCount,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 200 });

  } catch (error) {
    console.error('Error in reminder API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

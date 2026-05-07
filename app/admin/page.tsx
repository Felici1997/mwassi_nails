import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function AdminPage() {
    // 1. Find the salon "Mwassi Nails"
    const salon = await prisma.salon.findUnique({
        where: { name: 'Mwassi Nails' }
    });

    if (!salon) {
        // Fallback if for some reason the salon doesn't exist
        redirect('/dashboard');
    }

    // 2. Redirect to the correct admin dashboard URL
    redirect(`/admin/${salon.id}`);
}

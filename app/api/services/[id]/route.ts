import { NextResponse } from 'next/server';
import { ServiceService } from '@/services/service.service';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body: Record<string, unknown> = await request.json();

        const updated = await ServiceService.updateService(id, body);
        return NextResponse.json({ message: 'Service mis à jour', service: updated }, { status: 200 });
    } catch (error) {
        console.error('Error updating service:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        await ServiceService.deleteService(id);
        return NextResponse.json({ message: 'Service supprimé avec succès' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting service:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

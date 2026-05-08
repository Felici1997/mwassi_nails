import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {

    try {
        const { email, salonName } = await request.json()

        if (!email || !salonName) {
            return NextResponse.json({ error: 'Email et nom du salon sont requis.' },
                { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouvé.' },
                { status: 404 });
        }

        const existingSalon = await prisma.salon.findUnique({
            where: { name: salonName }
        })

        if (existingSalon) {
            return NextResponse.json(
                { message: 'Un salon avec ce nom existe déjà.' },
                { status: 409 }
            );
        }


        const newSalon = await prisma.salon.create({
            data: {
                name: salonName,
                createdBy: { connect: { id: user.id } },
            }
        })

        return NextResponse.json(
            { message: 'Salon créé avec succès.', salon: newSalon },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error in API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export async function GET(request: Request) {
    try {
        const {searchParams} = new URL(request.url)
        const email = searchParams.get('email')

        if(!email){
            return NextResponse.json({ error: 'L\'email est requis.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where : {email}
        })

        if(!user){
            return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
        }

        const salons  = await prisma.salon.findMany({
            where: {
                createdById: user.id
            }
        })

        return NextResponse.json(
            { salons},
            { status: 200 });

    } catch (error) {
        console.error('Error in API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE (request : Request){
    try {
        const {id} = await request.json();
        
        const salon = await prisma.salon.findUnique({
            where : {id}
        })

        if(!salon){
            return NextResponse.json({ message: 'Salon non trouvé' }, { status: 404 });
        }

        // Since User.companyId was removed in favor of Staff relation, we don't need to update users anymore
        // Unless we want to handle something else.

        await prisma.appointment.deleteMany({
            where: {
                service: {
                    salonId :id
                }
            }
        })

        await prisma.service.deleteMany({
            where: {
                salonId:id,
            }
        })

        await prisma.salon.delete({
            where :{id}
        })

        return NextResponse.json({ message: 'Salon supprimé avec succes' }, { status: 200 });
    }catch (error) {
        console.error('Error in API:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH (request : Request){
    try {
        const {id , creatorEmail , employeeEmail , action} = await request.json()

        const creator = await prisma.user.findUnique({
            where : {email : creatorEmail}
        })

        if(!creator){
            return NextResponse.json({ message: 'Créateur non trouvé' }, { status: 404 });
        }

        const salon = await prisma.salon.findUnique({
            where : {id}
        })

        if(!salon){
            return NextResponse.json({ message: 'Salon non trouvé' }, { status: 404 });
        }

        if(salon.createdById !== creator.id){
            return NextResponse.json({ message:  'L\'utilisateur n\'est pas le créateur du salon'  }, { status: 403 });
        }

        if(action === 'ADD'){
            let employee = await prisma.user.findUnique({
                where : {email : employeeEmail}
            })

            // Note: In the new schema, we use Staff model for salon membership.
            // We should create a Staff record.

            if(!employee){
                employee = await prisma.user.create({
                    data : {
                        email : employeeEmail,
                    }
                })
            }

            // I need to update the schema to add Staff -> User relation.
            return NextResponse.json({ message: 'Staff management requires schema update. Please update Staff model to include User relation.' }, { status: 500 });
    
        }else if(action === 'DELETE'){
            return NextResponse.json({ message: 'Staff management requires schema update.' }, { status: 500 });
        }  
    } catch (error) {
        console.error('Error in API:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

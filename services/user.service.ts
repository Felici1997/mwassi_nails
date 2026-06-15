import prisma from '@/lib/db/prisma';
import { z } from 'zod';

export const profileSchema = z.object({
    fullName: z.string().optional(),
    phone1: z.string().min(5, "Phone number too short"),
    phone2: z.string().optional(),
    birthday: z.string().optional(),
    profession: z.string().optional(),
});

export const UserService = {
    async updateProfile(email: string, data: any) {
        const validatedData = profileSchema.parse(data);
        
        const birthdayValue = validatedData.birthday && validatedData.birthday.trim() !== "" 
            ? new Date(validatedData.birthday) 
            : undefined;

        return await prisma.user.upsert({
            where: { email },
            update: {
                fullName: validatedData.fullName,
                phone1: validatedData.phone1,
                phone2: validatedData.phone2,
                profession: validatedData.profession,
                birthday: birthdayValue,
            },
            create: {
                email,
                fullName: validatedData.fullName,
                phone1: validatedData.phone1,
                phone2: validatedData.phone2,
                profession: validatedData.profession,
                birthday: birthdayValue,
            },
        });
    },

    async getUserById(id: string) {
        return await prisma.user.findUnique({ where: { id } });
    },

    async getUserByEmail(email: string) {
        return await prisma.user.findUnique({ where: { email } });
    },

    async getAllUsers() {
        return await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                givenName: true,
                familyName: true,
            },
            orderBy: {
                email: 'asc'
            }
        });
    },

    async upsertUser(data: { email: string; givenName?: string; familyName?: string }) {
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            return await prisma.user.create({
                data: {
                    email: data.email,
                    givenName: data.givenName,
                    familyName: data.familyName,
                }
            });
        }
        return await prisma.user.update({
            where: { email: data.email },
            data: {
                givenName: user.givenName ?? data.givenName,
                familyName: user.familyName ?? data.familyName,
            }
        });
    }
};

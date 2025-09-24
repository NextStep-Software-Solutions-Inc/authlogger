'use server';

import { PrismaClient } from '@/app/generated/prisma';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function createApplication(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (!name) {
            return { success: false, error: 'Application name is required' };
        }

        const application = await prisma.application.create({
            data: {
                name,
                description: description || null,
            },
        });

        revalidatePath('/applications');

        return { success: true, application };
    } catch (error: unknown) {
        console.error('Error creating application:', error);

        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return { success: false, error: 'Application name already exists' };
        }

        return { success: false, error: 'Internal server error' };
    }
}

export async function getApplications() {
    try {
        const applications = await prisma.application.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return { success: true, applications };
    } catch (error) {
        console.error('Error fetching applications:', error);
        return { success: false, error: 'Failed to fetch applications' };
    }
}

export async function updateApplication(formData: FormData) {
    try {
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (!id || !name) {
            return { success: false, error: 'Application ID and name are required' };
        }

        const application = await prisma.application.update({
            where: { id },
            data: {
                name,
                description: description || null,
            },
        });

        revalidatePath('/applications');

        return { success: true, application };
    } catch (error: unknown) {
        console.error('Error updating application:', error);

        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return { success: false, error: 'Application name already exists' };
        }

        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return { success: false, error: 'Application not found' };
        }

        return { success: false, error: 'Internal server error' };
    }
}

export async function deleteApplication(formData: FormData) {
    try {
        const id = formData.get('id') as string;

        if (!id) {
            return { success: false, error: 'Application ID is required' };
        }

        await prisma.application.delete({
            where: { id },
        });

        revalidatePath('/applications');

        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting application:', error);

        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return { success: false, error: 'Application not found' };
        }

        return { success: false, error: 'Internal server error' };
    }
}
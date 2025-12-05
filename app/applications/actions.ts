'use server';

import { prisma, isPrismaError, PRISMA_ERROR_CODES, getPrismaErrorMessage } from '@/app/lib/db';
import { revalidatePath } from 'next/cache';
import { unstable_cache } from 'next/cache';

// Types
export interface Application {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApplicationWithStats extends Application {
    _count?: {
        authEvents: number;
    };
}

interface ActionResult<T = void> {
    success: boolean;
    error?: string;
    data?: T;
}

// Validation helpers
function validateName(name: string | null): string | null {
    if (!name || typeof name !== 'string') {
        return 'Application name is required';
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
        return 'Application name must be at least 2 characters';
    }
    if (trimmed.length > 100) {
        return 'Application name must be less than 100 characters';
    }
    // Allow alphanumeric, spaces, hyphens, underscores
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
        return 'Application name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    return null;
}

function validateId(id: string | null): string | null {
    if (!id || typeof id !== 'string') {
        return 'Application ID is required';
    }
    // UUID validation
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return 'Invalid application ID format';
    }
    return null;
}

// Cached queries
export const getApplicationsCached = unstable_cache(
    async () => {
        const applications = await prisma.application.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { authEvents: true }
                }
            }
        });
        return applications;
    },
    ['applications-list'],
    { revalidate: 60, tags: ['applications'] } // Revalidate every 60 seconds
);

export const getApplicationByIdCached = unstable_cache(
    async (id: string) => {
        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { authEvents: true }
                }
            }
        });
        return application;
    },
    ['application-detail'],
    { revalidate: 60, tags: ['applications'] }
);

// Server Actions
export async function createApplication(formData: FormData): Promise<ActionResult<Application>> {
    try {
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        // Validation
        const nameError = validateName(name);
        if (nameError) {
            return { success: false, error: nameError };
        }

        const application = await prisma.application.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
            },
        });

        revalidatePath('/applications');

        return { success: true, data: application };
    } catch (error: unknown) {
        if (isPrismaError(error) && error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT) {
            return { success: false, error: 'An application with this name already exists' };
        }

        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

export async function getApplications(): Promise<ActionResult<ApplicationWithStats[]>> {
    try {
        const applications = await getApplicationsCached();
        return { success: true, data: applications };
    } catch {
        return { success: false, error: 'Failed to fetch applications' };
    }
}

export async function getApplicationById(id: string): Promise<ActionResult<ApplicationWithStats | null>> {
    try {
        const idError = validateId(id);
        if (idError) {
            return { success: false, error: idError };
        }

        const application = await getApplicationByIdCached(id);
        return { success: true, data: application };
    } catch {
        return { success: false, error: 'Failed to fetch application' };
    }
}

export async function updateApplication(formData: FormData): Promise<ActionResult<Application>> {
    try {
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        // Validation
        const idError = validateId(id);
        if (idError) {
            return { success: false, error: idError };
        }

        const nameError = validateName(name);
        if (nameError) {
            return { success: false, error: nameError };
        }

        const application = await prisma.application.update({
            where: { id },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
            },
        });

        revalidatePath('/applications');

        return { success: true, data: application };
    } catch (error: unknown) {
        if (isPrismaError(error)) {
            if (error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT) {
                return { success: false, error: 'An application with this name already exists' };
            }
            if (error.code === PRISMA_ERROR_CODES.RECORD_NOT_FOUND) {
                return { success: false, error: 'Application not found' };
            }
        }

        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

export async function deleteApplication(formData: FormData): Promise<ActionResult> {
    try {
        const id = formData.get('id') as string;

        // Validation
        const idError = validateId(id);
        if (idError) {
            return { success: false, error: idError };
        }

        // Check if application has events
        const eventCount = await prisma.authEvent.count({
            where: { applicationId: id }
        });

        if (eventCount > 0) {
            return {
                success: false,
                error: `Cannot delete application with ${eventCount} associated events. Delete the events first.`
            };
        }

        await prisma.application.delete({
            where: { id },
        });

        revalidatePath('/applications');

        return { success: true };
    } catch (error: unknown) {
        if (isPrismaError(error) && error.code === PRISMA_ERROR_CODES.RECORD_NOT_FOUND) {
            return { success: false, error: 'Application not found' };
        }

        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Search/filter applications (for autocomplete, etc.)
export async function searchApplications(query: string): Promise<ActionResult<Application[]>> {
    try {
        if (!query || query.length < 2) {
            return { success: true, data: [] };
        }

        const applications = await prisma.application.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            orderBy: { name: 'asc' },
            take: 10
        });

        return { success: true, data: applications };
    } catch {
        return { success: false, error: 'Failed to search applications' };
    }
}

// Get application statistics
export async function getApplicationStats(id: string): Promise<ActionResult<{
    totalEvents: number;
    eventsByType: { type: string; count: number }[];
    recentEvents: number;
}>> {
    try {
        const idError = validateId(id);
        if (idError) {
            return { success: false, error: idError };
        }

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [totalEvents, eventsByType, recentEvents] = await Promise.all([
            prisma.authEvent.count({
                where: { applicationId: id }
            }),
            prisma.authEvent.groupBy({
                by: ['eventType'],
                where: { applicationId: id },
                _count: { eventType: true },
                orderBy: { _count: { eventType: 'desc' } }
            }),
            prisma.authEvent.count({
                where: {
                    applicationId: id,
                    createdAt: { gte: last24Hours }
                }
            })
        ]);

        return {
            success: true,
            data: {
                totalEvents,
                eventsByType: eventsByType.map(item => ({
                    type: item.eventType,
                    count: item._count.eventType
                })),
                recentEvents
            }
        };
    } catch {
        return { success: false, error: 'Failed to fetch application statistics' };
    }
}

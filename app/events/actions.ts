'use server';

import { prisma, isPrismaError, getPrismaErrorMessage } from '@/app/lib/db';
import { unstable_cache } from 'next/cache';
import * as XLSX from 'xlsx';

// Types
export interface EventFilters {
    applicationId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    search?: string;
}

export interface PaginationParams {
    limit?: number;
    offset?: number;
    page?: number;
}

export interface AuthEvent {
    id: string;
    eventType: string;
    userId: string;
    applicationId: string;
    createdAt: Date;
    application: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        authUserId: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
}

export interface EventStats {
    totalEvents: number;
    eventsByType: { type: string; count: number }[];
    recentActivity: AuthEvent[];
    todayCount: number;
    weekCount: number;
    uniqueUsers: number;
}

interface ActionResult<T = void> {
    success: boolean;
    error?: string;
    data?: T;
}

// Validation helpers
function validateDateString(date: string | undefined): Date | null {
    if (!date) return null;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function validatePagination(params: PaginationParams): { limit: number; offset: number } {
    const limit = Math.min(Math.max(1, params.limit || 50), 100); // 1-100 range
    const page = Math.max(1, params.page || 1);
    const offset = params.offset ?? (page - 1) * limit;
    return { limit, offset: Math.max(0, offset) };
}

// Build Prisma where clause from filters
function buildWhereClause(filters: EventFilters) {
    const where: Record<string, unknown> = {};

    if (filters.applicationId) {
        where.applicationId = filters.applicationId;
    }

    if (filters.eventType) {
        where.eventType = filters.eventType;
    }

    if (filters.userId) {
        where.userId = filters.userId;
    }

    const startDate = validateDateString(filters.startDate);
    const endDate = validateDateString(filters.endDate);

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            (where.createdAt as Record<string, Date>).gte = startDate;
        }
        if (endDate) {
            // Set end date to end of day
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            (where.createdAt as Record<string, Date>).lte = endOfDay;
        }
    }

    // Search in user names or event types
    if (filters.search) {
        where.OR = [
            { eventType: { contains: filters.search, mode: 'insensitive' } },
            { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
            { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        ];
    }

    return where;
}

// Include clause for event queries
const eventInclude = {
    application: {
        select: { id: true, name: true }
    },
    user: {
        select: { id: true, authUserId: true, firstName: true, lastName: true }
    }
};

// Cached queries for frequently accessed data
export const getEventTypesCached = unstable_cache(
    async () => {
        const types = await prisma.authEvent.findMany({
            select: { eventType: true },
            distinct: ['eventType'],
            orderBy: { eventType: 'asc' }
        });
        return types.map(t => t.eventType);
    },
    ['event-types'],
    { revalidate: 300, tags: ['events'] } // Cache for 5 minutes
);

export const getApplicationsForFilterCached = unstable_cache(
    async () => {
        const applications = await prisma.application.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
        return applications;
    },
    ['applications-for-filter'],
    { revalidate: 60, tags: ['applications'] }
);

// Main event queries
export async function getEvents(
    filters: EventFilters = {},
    pagination: PaginationParams = {}
): Promise<ActionResult<{ events: AuthEvent[]; total: number; hasMore: boolean }>> {
    try {
        const where = buildWhereClause(filters);
        const { limit, offset } = validatePagination(pagination);

        const [events, total] = await Promise.all([
            prisma.authEvent.findMany({
                where,
                include: eventInclude,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.authEvent.count({ where })
        ]);

        return {
            success: true,
            data: {
                events: events as AuthEvent[],
                total,
                hasMore: offset + limit < total
            }
        };
    } catch (error) {
        console.error('Error fetching events:', error);
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Get event statistics with caching
export async function getEventStats(
    filters: EventFilters = {}
): Promise<ActionResult<EventStats>> {
    try {
        const where = buildWhereClause(filters);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const [
            totalEvents,
            eventsByType,
            recentActivity,
            todayCount,
            weekCount,
            uniqueUsers
        ] = await Promise.all([
            // Total events count
            prisma.authEvent.count({ where }),

            // Events grouped by type
            prisma.authEvent.groupBy({
                by: ['eventType'],
                where,
                _count: { eventType: true },
                orderBy: { _count: { eventType: 'desc' } }
            }),

            // Recent activity (last 10 events)
            prisma.authEvent.findMany({
                where,
                include: eventInclude,
                orderBy: { createdAt: 'desc' },
                take: 10
            }),

            // Today's events
            prisma.authEvent.count({
                where: {
                    ...where,
                    createdAt: { gte: todayStart }
                }
            }),

            // This week's events
            prisma.authEvent.count({
                where: {
                    ...where,
                    createdAt: { gte: weekStart }
                }
            }),

            // Unique users
            prisma.authEvent.findMany({
                where,
                select: { userId: true },
                distinct: ['userId']
            }).then(users => users.length)
        ]);

        return {
            success: true,
            data: {
                totalEvents,
                eventsByType: eventsByType.map(item => ({
                    type: item.eventType,
                    count: item._count.eventType
                })),
                recentActivity: recentActivity as AuthEvent[],
                todayCount,
                weekCount,
                uniqueUsers
            }
        };
    } catch (error) {
        console.error('Error fetching event stats:', error);
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Get single event by ID
export async function getEventById(id: string): Promise<ActionResult<AuthEvent | null>> {
    try {
        if (!id) {
            return { success: false, error: 'Event ID is required' };
        }

        const event = await prisma.authEvent.findUnique({
            where: { id },
            include: eventInclude
        });

        return { success: true, data: event as AuthEvent | null };
    } catch (error) {
        console.error('Error fetching event:', error);
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Get events trend data (for charts)
export async function getEventsTrend(
    filters: EventFilters = {},
    days: number = 30
): Promise<ActionResult<{ date: string; count: number }[]>> {
    try {
        const where = buildWhereClause(filters);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Get events within date range
        const events = await prisma.authEvent.findMany({
            where: {
                ...where,
                createdAt: { gte: startDate }
            },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        // Group by date
        const countsByDate = new Map<string, number>();

        // Initialize all dates with 0
        for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            countsByDate.set(dateStr, 0);
        }

        // Count events per date
        events.forEach(event => {
            const dateStr = event.createdAt.toISOString().split('T')[0];
            countsByDate.set(dateStr, (countsByDate.get(dateStr) || 0) + 1);
        });

        const trend = Array.from(countsByDate.entries()).map(([date, count]) => ({
            date,
            count
        }));

        return { success: true, data: trend };
    } catch (error) {
        console.error('Error fetching events trend:', error);
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Export events to Excel
export async function exportEventsToExcel(
    filters: EventFilters & { applicationId: string }
): Promise<ActionResult<{ buffer: Buffer; filename: string; count: number }>> {
    try {
        const { applicationId, ...otherFilters } = filters;

        if (!applicationId) {
            return { success: false, error: 'Application ID is required for export' };
        }

        const where = buildWhereClause({ applicationId, ...otherFilters });

        // Limit export to 10,000 records for performance
        const events = await prisma.authEvent.findMany({
            where,
            include: eventInclude,
            orderBy: { createdAt: 'desc' },
            take: 10000
        });

        if (events.length === 0) {
            return { success: false, error: 'No events to export' };
        }

        // Transform data for Excel - simplified template with only UserName, Event Type, Date, Time
        const excelData = events.map(event => ({
            'UserName': event.user?.firstName && event.user?.lastName
                ? `${event.user.firstName} ${event.user.lastName}`.trim()
                : event.user?.firstName || event.user?.lastName || event.user?.authUserId || 'Unknown User',
            'Event Type': event.eventType,
            'Date': event.createdAt.toLocaleDateString('en-US', { 
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            'Time': event.createdAt.toLocaleTimeString('en-US', { 
                timeZone: 'UTC',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }),
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Auto-size columns
        ws['!cols'] = [
            { wch: 30 }, // UserName
            { wch: 20 }, // Event Type
            { wch: 12 }, // Date
            { wch: 12 }, // Time
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Events');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Get application name for filename
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: { name: true }
        });

        const appName = application?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `auth_events_${appName}_${timestamp}.xlsx`;

        return {
            success: true,
            data: {
                buffer,
                filename,
                count: events.length
            }
        };
    } catch (error) {
        console.error('Error exporting events to Excel:', error);
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Get applications for filter dropdown (cached wrapper)
export async function getApplicationsForFilter(): Promise<ActionResult<{ id: string; name: string }[]>> {
    try {
        const applications = await getApplicationsForFilterCached();
        return { success: true, data: applications };
    } catch (error) {
        console.error('Error fetching applications:', error);
        return { success: false, error: 'Failed to fetch applications' };
    }
}

// Get users for filter dropdown
export async function getUsersForFilter(): Promise<ActionResult<{ id: string; authUserId: string; firstName: string | null; lastName: string | null }[]>> {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, authUserId: true, firstName: true, lastName: true },
            orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
        });
        return { success: true, data: users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Failed to fetch users' };
    }
}

// Get available event types (cached wrapper)
export async function getEventTypes(): Promise<ActionResult<string[]>> {
    try {
        const types = await getEventTypesCached();
        return { success: true, data: types };
    } catch (error) {
        console.error('Error fetching event types:', error);
        return { success: false, error: 'Failed to fetch event types' };
    }
}

// Delete events (with safety checks)
export async function deleteEvent(id: string): Promise<ActionResult> {
    try {
        if (!id) {
            return { success: false, error: 'Event ID is required' };
        }

        await prisma.authEvent.delete({
            where: { id }
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting event:', error);
        if (isPrismaError(error) && error.code === 'P2025') {
            return { success: false, error: 'Event not found' };
        }
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Bulk delete events (with limit for safety)
export async function deleteEventsByFilter(
    filters: EventFilters,
    limit: number = 1000
): Promise<ActionResult<{ deleted: number }>> {
    try {
        const where = buildWhereClause(filters);

        // Get IDs to delete (limited for safety)
        const events = await prisma.authEvent.findMany({
            where,
            select: { id: true },
            take: limit
        });

        if (events.length === 0) {
            return { success: true, data: { deleted: 0 } };
        }

        const result = await prisma.authEvent.deleteMany({
            where: {
                id: { in: events.map(e => e.id) }
            }
        });

        return { success: true, data: { deleted: result.count } };
    } catch (error) {
        console.error('Error bulk deleting events:', error);
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

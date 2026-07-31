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

// Parse date string ('YYYY-MM-DD' or ISO) to start of day in Asia/Manila (00:00:00.000 +08:00) as epoch timestamp in milliseconds
function parseManilaStartDateToMs(dateStr: string | undefined): number | null {
    if (!dateStr) return null;
    const isoStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00.000+08:00`;
    const parsed = new Date(isoStr);
    return isNaN(parsed.getTime()) ? null : parsed.getTime();
}

// Parse date string ('YYYY-MM-DD' or ISO) to end of day in Asia/Manila (23:59:59.999 +08:00) as epoch timestamp in milliseconds
function parseManilaEndDateToMs(dateStr: string | undefined): number | null {
    if (!dateStr) return null;
    const isoStr = dateStr.includes('T') ? dateStr : `${dateStr}T23:59:59.999+08:00`;
    const parsed = new Date(isoStr);
    return isNaN(parsed.getTime()) ? null : parsed.getTime();
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

    // Use timestamp BigInt filtering based on Asia/Manila (+08:00) timezone boundaries
    const startMs = parseManilaStartDateToMs(filters.startDate);
    const endMs = parseManilaEndDateToMs(filters.endDate);

    if (startMs !== null || endMs !== null) {
        where.timeStamp = {};
        if (startMs !== null) {
            (where.timeStamp as Record<string, bigint>).gte = BigInt(startMs);
        }
        if (endMs !== null) {
            (where.timeStamp as Record<string, bigint>).lte = BigInt(endMs);
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
                orderBy: { timeStamp: 'desc' },
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
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Get event statistics with caching
export async function getEventStats(
    filters: EventFilters = {}
): Promise<ActionResult<EventStats>> {
    try {
        const where = buildWhereClause(filters);

        // Compute today/week start timestamps in Asia/Manila (+08:00)
        const now = new Date();
        const manilaDateStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Manila' }); // YYYY-MM-DD
        const todayStartMs = new Date(`${manilaDateStr}T00:00:00.000+08:00`).getTime();
        const weekStartMs = todayStartMs - 7 * 24 * 60 * 60 * 1000;

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
                orderBy: { timeStamp: 'desc' },
                take: 10
            }),

            // Today's events (using timeStamp index)
            prisma.authEvent.count({
                where: {
                    ...where,
                    timeStamp: { gte: BigInt(todayStartMs) }
                }
            }),

            // This week's events (using timeStamp index)
            prisma.authEvent.count({
                where: {
                    ...where,
                    timeStamp: { gte: BigInt(weekStartMs) }
                }
            }),

            // Unique users via DB aggregation
            prisma.authEvent.groupBy({
                by: ['userId'],
                where
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
        const now = new Date();
        const manilaDateStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Manila' });
        const startMs = new Date(`${manilaDateStr}T00:00:00.000+08:00`).getTime() - (days * 24 * 60 * 60 * 1000);

        // Get events within date range using timeStamp index
        const events = await prisma.authEvent.findMany({
            where: {
                ...where,
                timeStamp: { gte: BigInt(startMs) }
            },
            select: { createdAt: true },
            orderBy: { timeStamp: 'asc' }
        });

        // Group by date
        const countsByDate = new Map<string, number>();

        // Initialize all dates with 0
        const startDate = new Date(startMs);
        for (let i = 0; i <= days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Manila' });
            countsByDate.set(dateStr, 0);
        }

        // Count events per date in Manila timezone
        events.forEach(event => {
            const dateStr = event.createdAt.toLocaleDateString('sv-SE', { timeZone: 'Asia/Manila' });
            countsByDate.set(dateStr, (countsByDate.get(dateStr) || 0) + 1);
        });

        const trend = Array.from(countsByDate.entries()).map(([date, count]) => ({
            date,
            count
        }));

        return { success: true, data: trend };
    } catch (error) {
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Export events to Excel - Full format with all details
export async function exportFullEventsToExcel(
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

        // Transform data for Excel - Full format with all details
        const excelData = events.map(event => ({
            'Event ID': event.id,
            'Event Type': event.eventType,
            'User ID': event.userId,
            'User Name': event.user?.firstName && event.user?.lastName
                ? `${event.user.firstName} ${event.user.lastName}`.trim()
                : event.user?.firstName || event.user?.lastName || event.user?.authUserId || 'Unknown User',
            'Application': event.application?.name || 'Unknown',
            'Timestamp': event.createdAt.toISOString(),
            'Date': event.createdAt.toLocaleDateString('en-US', {
                timeZone: 'Asia/Manila',
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
            }),
            'Time': event.createdAt.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Manila',
                hour: 'numeric',
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
            { wch: 30 }, // Event ID
            { wch: 18 }, // Event Type
            { wch: 30 }, // User ID
            { wch: 25 }, // User Name
            { wch: 15 }, // Application
            { wch: 26 }, // Timestamp
            { wch: 12 }, // Date
            { wch: 14 }, // Time
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
        const filename = `auth_events_full_${appName}_${timestamp}.xlsx`;

        return {
            success: true,
            data: {
                buffer,
                filename,
                count: events.length
            }
        };
    } catch (error) {
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Export events to Excel - Simple format with basic details
export async function exportSimpleEventsToExcel(
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
                timeZone: 'Asia/Manila',
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
            }),
            'Time': event.createdAt.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Manila',
                hour: 'numeric',
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
            { wch: 14 }, // Time
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
        const filename = `auth_events_simple_${appName}_${timestamp}.xlsx`;

        return {
            success: true,
            data: {
                buffer,
                filename,
                count: events.length
            }
        };
    } catch (error) {
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Export events to Excel in User Activity format (grouped by user with session created/removed)
export async function exportUserActivityToExcel(
    filters: EventFilters & { applicationId: string }
): Promise<ActionResult<{ buffer: Buffer; filename: string; count: number }>> {
    try {
        const { applicationId, ...otherFilters } = filters;

        if (!applicationId) {
            return { success: false, error: 'Application ID is required for export' };
        }

        // Build the where clause with all filters
        const where = buildWhereClause({ applicationId, ...otherFilters });

        // Only add session event type filter if no specific eventType filter is applied
        // This ensures user's eventType filter is respected
        const sessionEventTypes = ['session.created', 'session.ended', 'session.removed', 'session.revoked'];
        const finalWhere = otherFilters.eventType
            ? where // User specified an event type, use their filter
            : { ...where, eventType: { in: sessionEventTypes } }; // Default to session events only

        // Limit export to 10,000 records for performance
        const events = await prisma.authEvent.findMany({
            where: finalWhere,
            include: eventInclude,
            orderBy: { createdAt: 'asc' },
            take: 10000
        });

        if (events.length === 0) {
            return { success: false, error: 'No session events to export' };
        }

        // Group events by user
        const userEventsMap = new Map<string, {
            userName: string;
            events: typeof events;
        }>();

        for (const event of events) {
            const userId = event.userId || 'unknown';
            const userName = event.user?.firstName && event.user?.lastName
                ? `${event.user.firstName} ${event.user.lastName}`.trim()
                : event.user?.firstName || event.user?.lastName || event.user?.authUserId || 'Unknown User';

            if (!userEventsMap.has(userId)) {
                userEventsMap.set(userId, { userName, events: [] });
            }
            userEventsMap.get(userId)!.events.push(event);
        }

        // Create workbook
        const wb = XLSX.utils.book_new();
        const wsData: (string | null)[][] = [];
        let totalRows = 0;

        // Process each user
        for (const [, userData] of userEventsMap) {
            // Add user header
            wsData.push([`UserName: ${userData.userName}`]);
            wsData.push(['Date', 'Session Created', 'Session Removed']);

            // Group events by date
            const dateEventsMap = new Map<string, { created: string | null; removed: string | null }>();

            for (const event of userData.events) {
                const dateKey = event.createdAt.toLocaleDateString('en-US', {
                    timeZone: 'Asia/Manila',
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                });

                if (!dateEventsMap.has(dateKey)) {
                    dateEventsMap.set(dateKey, { created: null, removed: null });
                }

                const timeStr = event.createdAt.toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Manila',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });

                const dateEntry = dateEventsMap.get(dateKey)!;
                if (event.eventType === 'session.created') {
                    dateEntry.created = timeStr;
                } else if (['session.ended', 'session.removed', 'session.revoked'].includes(event.eventType)) {
                    dateEntry.removed = timeStr;
                }
            }

            // Add date rows
            for (const [date, times] of dateEventsMap) {
                wsData.push([date, times.created || '', times.removed || '']);
                totalRows++;
            }

            // Add empty row between users
            wsData.push([]);
        }

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Auto-size columns
        ws['!cols'] = [
            { wch: 15 }, // Date
            { wch: 18 }, // Session Created
            { wch: 18 }, // Session Removed
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'User Activity');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Get application name for filename
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: { name: true }
        });

        const appName = application?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `user_activity_${appName}_${timestamp}.xlsx`;

        return {
            success: true,
            data: {
                buffer,
                filename,
                count: totalRows
            }
        };
    } catch (error) {
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Get applications for filter dropdown (cached wrapper)
export async function getApplicationsForFilter(): Promise<ActionResult<{ id: string; name: string }[]>> {
    try {
        const applications = await getApplicationsForFilterCached();
        return { success: true, data: applications };
    } catch {
        return { success: false, error: 'Failed to fetch applications' };
    }
}

export interface UserFilterOption {
    id: string;
    authUserId: string;
    firstName: string | null;
    lastName: string | null;
}

// Get users for filter dropdown (legacy wrapper with limit)
export async function getUsersForFilter(): Promise<ActionResult<UserFilterOption[]>> {
    return searchUsersForFilter('', 20);
}

// Search users for autocomplete combo box with query filter and limit
export async function searchUsersForFilter(
    query?: string,
    limit: number = 20
): Promise<ActionResult<UserFilterOption[]>> {
    try {
        const trimmedQuery = query?.trim() || '';
        
        const where: Record<string, unknown> = {};
        if (trimmedQuery) {
            where.OR = [
                { firstName: { contains: trimmedQuery, mode: 'insensitive' } },
                { lastName: { contains: trimmedQuery, mode: 'insensitive' } },
                { authUserId: { contains: trimmedQuery, mode: 'insensitive' } },
            ];
        }

        const users = await prisma.user.findMany({
            where,
            select: { id: true, authUserId: true, firstName: true, lastName: true },
            orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
            take: Math.min(Math.max(1, limit), 50),
        });

        return { success: true, data: users };
    } catch (error) {
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Get single user by ID for filter initial state
export async function getUserByIdForFilter(
    id: string
): Promise<ActionResult<UserFilterOption | null>> {
    try {
        if (!id) return { success: true, data: null };
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, authUserId: true, firstName: true, lastName: true }
        });
        return { success: true, data: user };
    } catch (error) {
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

// Get available event types (cached wrapper)
export async function getEventTypes(): Promise<ActionResult<string[]>> {
    try {
        const types = await getEventTypesCached();
        return { success: true, data: types };
    } catch {
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
        return { success: false, error: getPrismaErrorMessage(error) };
    }
}

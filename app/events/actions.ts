'use server';

import { PrismaClient } from '@/app/generated/prisma';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function getEvents(searchParams?: {
    applicationId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}) {
    try {
        const {
            applicationId,
            eventType,
            startDate,
            endDate,
            limit = 50,
            offset = 0
        } = searchParams || {};

        const where: Record<string, unknown> = {};

        if (applicationId) {
            where.applicationId = applicationId;
        }

        if (eventType) {
            where.eventType = eventType;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
            }
            if (endDate) {
                (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
            }
        }

        const [events, total] = await Promise.all([
            prisma.authEvent.findMany({
                where,
                include: {
                    application: {
                        select: { id: true, name: true }
                    },
                    user: {
                        select: { id: true, authUserId: true, firstName: true, lastName: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.authEvent.count({ where })
        ]);

        return {
            success: true,
            events,
            total,
            hasMore: offset + limit < total
        };
    } catch (error) {
        console.error('Error fetching events:', error);
        return { success: false, error: 'Failed to fetch events' };
    }
}

export async function getEventStats(searchParams?: {
    applicationId?: string;
    startDate?: string;
    endDate?: string;
}) {
    try {
        const { applicationId, startDate, endDate } = searchParams || {};

        const where: Record<string, unknown> = {};

        if (applicationId) {
            where.applicationId = applicationId;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
            }
            if (endDate) {
                (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
            }
        }

        const [totalEvents, eventsByType, recentActivity] = await Promise.all([
            prisma.authEvent.count({ where }),

            prisma.authEvent.groupBy({
                by: ['eventType'],
                where,
                _count: { eventType: true },
                orderBy: { _count: { eventType: 'desc' } }
            }),

            prisma.authEvent.findMany({
                where,
                include: {
                    application: {
                        select: { id: true, name: true }
                    },
                    user: {
                        select: { id: true, authUserId: true, firstName: true, lastName: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);

        return {
            success: true,
            stats: {
                totalEvents,
                eventsByType: eventsByType.map((item: { eventType: string; _count: { eventType: number } }) => ({
                    type: item.eventType,
                    count: item._count.eventType
                })),
                recentActivity
            }
        };
    } catch (error) {
        console.error('Error fetching event stats:', error);
        return { success: false, error: 'Failed to fetch event statistics' };
    }
}

export async function exportEventsToExcel(searchParams: {
    applicationId: string;
    startDate?: string;
    endDate?: string;
}) {
    try {
        const { applicationId, startDate, endDate } = searchParams;

        if (!applicationId) {
            return { success: false, error: 'Application ID is required' };
        }

        const where: Record<string, unknown> = {
            applicationId
        };

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
            }
            if (endDate) {
                (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
            }
        }

        const events = await prisma.authEvent.findMany({
            where,
            include: {
                application: {
                    select: { id: true, name: true }
                },
                user: {
                    select: { id: true, authUserId: true, firstName: true, lastName: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform data for Excel
        const excelData = events.map(event => ({
            'Event ID': event.id,
            'Event Type': event.eventType,
            'User ID': event.userId,
            'User Name': event.user?.firstName && event.user?.lastName
                ? `${event.user.firstName} ${event.user.lastName}`
                : event.user?.authUserId || 'Unknown User',
            'Application': event.application.name,
            'Timestamp': event.createdAt.toISOString(),
            'Date': event.createdAt.toLocaleDateString(),
            'Time': event.createdAt.toLocaleTimeString(),
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Auto-size columns
        const colWidths = [
            { wch: 36 }, // Event ID
            { wch: 15 }, // Event Type
            { wch: 36 }, // User ID
            { wch: 30 }, // User Name
            { wch: 20 }, // Application
            { wch: 20 }, // Timestamp
            { wch: 12 }, // Date
            { wch: 12 }, // Time
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Events');

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Get application name for filename
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: { name: true }
        });

        const appName = application?.name || 'Unknown';
        const dateRange = startDate && endDate
            ? `_${startDate}_to_${endDate}`
            : startDate
                ? `_from_${startDate}`
                : endDate
                    ? `_to_${endDate}`
                    : '';

        const filename = `auth_events_${appName.replace(/\s+/g, '_')}${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`;

        return {
            success: true,
            buffer,
            filename,
            count: events.length
        };
    } catch (error) {
        console.error('Error exporting events to Excel:', error);
        return { success: false, error: 'Failed to export events' };
    }
}


export async function getApplicationsForFilter() {
    try {
        const applications = await prisma.application.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });

        return { success: true, applications };
    } catch (error) {
        console.error('Error fetching applications:', error);
        return { success: false, error: 'Failed to fetch applications' };
    }
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEvents, getEventStats, getApplicationsForFilter } from './actions';
import Link from 'next/link';

interface Application {
    id: string;
    name: string;
}

interface AuthEvent {
    id: string;
    eventType: string;
    userId: string;
    applicationId: string;
    createdAt: Date;
    application: { id: string; name: string };
    user: { id: string; authUserId: string; firstName: string | null; lastName: string | null } | null;
}

interface EventStats {
    totalEvents: number;
    eventsByType: { type: string; count: number }[];
    recentActivity: AuthEvent[];
}

export default function EventsPage() {
    const [events, setEvents] = useState<AuthEvent[]>([]);
    const [stats, setStats] = useState<EventStats | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [selectedApplication, setSelectedApplication] = useState('');
    const [selectedEventType, setSelectedEventType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const eventTypes = [
        'session.created',
        'session.ended',
        'user.created',
        'user.updated'
    ];

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadEvents();
    }, [selectedApplication, selectedEventType, startDate, endDate, currentPage]);

    const loadInitialData = async () => {
        try {
            const [appsResult, statsResult] = await Promise.all([
                getApplicationsForFilter(),
                getEventStats()
            ]);

            if (appsResult.success && appsResult.applications) {
                setApplications(appsResult.applications);
            }

            if (statsResult.success && statsResult.stats) {
                setStats(statsResult.stats);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getEvents({
                applicationId: selectedApplication || undefined,
                eventType: selectedEventType || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                limit: 50,
                offset: (currentPage - 1) * 50
            });

            if (result.success && result.events && result.hasMore !== undefined) {
                setEvents(result.events);
                setHasMore(result.hasMore);
            } else {
                setError(result.error || 'Failed to load events');
            }
        } catch (error) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    }, [selectedApplication, selectedEventType, startDate, endDate, currentPage]);

    const clearFilters = () => {
        setSelectedApplication('');
        setSelectedEventType('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const handleExport = async () => {
        if (!selectedApplication) return;

        try {
            const params = new URLSearchParams({
                applicationId: selectedApplication,
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            });

            const response = await fetch(`/api/export/events?${params.toString()}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'events.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to export events');
            }
        } catch (error) {
            setError('Network error occurred during export');
        }
    };

    const getEventTypeColor = (eventType: string) => {
        switch (eventType) {
            case 'session.created': return 'bg-green-100 text-green-800';
            case 'session.ended': return 'bg-red-100 text-red-800';
            case 'user.created': return 'bg-blue-100 text-blue-800';
            case 'user.updated': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatUserName = (user: AuthEvent['user']) => {
        if (!user) return 'Unknown User';
        if (user.firstName || user.lastName) {
            return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
        return user.authUserId;
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Event Monitoring</h1>
                <Link
                    href="/applications"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    ← Back to Applications
                </Link>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Events</h3>
                        <p className="text-3xl font-bold text-blue-600">{stats.totalEvents.toLocaleString()}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Events</h3>
                        <p className="text-3xl font-bold text-green-600">
                            {stats.eventsByType
                                .filter(e => e.type.includes('session'))
                                .reduce((sum, e) => sum + e.count, 0)
                                .toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">User Events</h3>
                        <p className="text-3xl font-bold text-purple-600">
                            {stats.eventsByType
                                .filter(e => e.type.includes('user'))
                                .reduce((sum, e) => sum + e.count, 0)
                                .toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Today</h3>
                        <p className="text-3xl font-bold text-orange-600">
                            {stats.recentActivity.filter(e =>
                                new Date(e.createdAt).toDateString() === new Date().toDateString()
                            ).length}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Application
                        </label>
                        <select
                            value={selectedApplication}
                            onChange={(e) => setSelectedApplication(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Applications</option>
                            {applications.map(app => (
                                <option key={app.id} value={app.id}>{app.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Type
                        </label>
                        <select
                            value={selectedEventType}
                            onChange={(e) => setSelectedEventType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            {eventTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-end">
                        <div className="flex gap-2">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            >
                                Clear Filters
                            </button>
                            {selectedApplication && (
                                <button
                                    onClick={handleExport}
                                    disabled={loading}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm"
                                >
                                    {loading ? 'Exporting...' : 'Export to Excel'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Recent Events</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading events...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-600">
                        {error}
                    </div>
                ) : events.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No events found matching the current filters.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Event Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Application
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {events.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.eventType)}`}>
                                                    {event.eventType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatUserName(event.user)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {event.application.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(event.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                            <div className="text-sm text-gray-700">
                                Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, (currentPage - 1) * 50 + events.length)} events
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={!hasMore}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
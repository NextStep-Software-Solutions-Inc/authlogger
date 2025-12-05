'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  LogIn,
  LogOut,
  Calendar,
  Download,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { getEvents, getEventStats, getApplicationsForFilter, getUsersForFilter } from './actions';
import { AppLayout } from '../components/layout/AppLayout';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Input,
  Badge,
  StatCard,
  EmptyState,
  SkeletonStats,
  SkeletonTable,
  useToast,
} from '../components/ui';
import { EventsByTypeChart } from '../components/charts/EventCharts';
import { useDebounce } from '../lib/hooks';
import { cn, getEventTypeColor, formatDateTime, getRelativeTime, formatNumber } from '../lib/utils';

interface Application {
  id: string;
  name: string;
}

interface User {
  id: string;
  authUserId: string;
  firstName: string | null;
  lastName: string | null;
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

function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Filter states - initialized from URL params
  const [selectedApplication, setSelectedApplication] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const toast = useToast();
  const pageSize = 20;

  // Initialize filters from URL params on mount
  useEffect(() => {
    const app = searchParams.get('app') || '';
    const eventType = searchParams.get('eventType') || '';
    const user = searchParams.get('user') || '';
    const start = searchParams.get('startDate') || '';
    const end = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);

    setSelectedApplication(app);
    setSelectedEventType(eventType);
    setSelectedUser(user);
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(page);
    setIsInitialized(true);

    // Show filters panel if any filter is active
    if (app || eventType || user || start || end) {
      setShowFilters(true);
    }
  }, []);

  // Update URL when filters change
  const updateUrlParams = useCallback((params: Record<string, string | number>) => {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '' && value !== 1) {
        url.searchParams.set(key, String(value));
      } else {
        url.searchParams.delete(key);
      }
    });

    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Sync filters to URL
  useEffect(() => {
    if (!isInitialized) return;

    updateUrlParams({
      app: selectedApplication,
      eventType: selectedEventType,
      user: selectedUser,
      startDate: startDate,
      endDate: endDate,
      page: currentPage,
    });
  }, [selectedApplication, selectedEventType, selectedUser, startDate, endDate, currentPage, isInitialized, updateUrlParams]);

  // Close export menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const eventTypes = [
    { value: 'session.created', label: 'Session Created' },
    { value: 'session.ended', label: 'Session Ended' },
    { value: 'session.revoked', label: 'Session Revoked' },
    { value: 'session.removed', label: 'Session Removed' },
    { value: 'user.created', label: 'User Created' },
    { value: 'user.updated', label: 'User Updated' },
  ];

  const loadInitialData = useCallback(async () => {
    try {
      setStatsLoading(true);
      const [appsResult, usersResult, statsResult] = await Promise.all([
        getApplicationsForFilter(),
        getUsersForFilter(),
        getEventStats(),
      ]);

      if (appsResult.success && appsResult.data) {
        setApplications(appsResult.data);
      }

      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEvents(
        {
          applicationId: selectedApplication || undefined,
          eventType: selectedEventType || undefined,
          userId: selectedUser || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        {
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
        }
      );

      if (result.success && result.data) {
        setEvents(result.data.events);
        setTotalEvents(result.data.total || 0);
      } else {
        toast.error('Failed to load events');
      }
    } catch {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedApplication, selectedEventType, selectedUser, startDate, endDate, currentPage]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (isInitialized) {
      loadEvents();
    }
  }, [loadEvents, isInitialized]);

  const clearFilters = () => {
    setSelectedApplication('');
    setSelectedEventType('');
    setSelectedUser('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setCurrentPage(1);
    // Clear URL params
    router.replace('/events', { scroll: false });
  };

  const handleExport = async (exportType: 'full' | 'simple' | 'user-activity') => {
    setShowExportMenu(false);

    if (!selectedApplication) {
      toast.warning('Please select an application to export');
      return;
    }

    // Check if any filter is applied
    const hasFilters = selectedUser || selectedEventType || startDate || endDate;
    if (!hasFilters) {
      toast.warning('Please apply at least one filter (User, Event Type, or Date range) before exporting');
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams({
        applicationId: selectedApplication,
        exportType,
        ...(selectedUser && { userId: selectedUser }),
        ...(selectedEventType && { eventType: selectedEventType }),
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
        toast.success('Export completed successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to export events');
      }
    } catch {
      toast.error('Network error occurred during export');
    } finally {
      setExporting(false);
    }
  };

  const formatUserName = (user: AuthEvent['user']) => {
    if (!user) return 'Unknown User';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.authUserId.slice(0, 8) + '...';
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('session.created')) return LogIn;
    if (eventType.includes('session')) return LogOut;
    return Users;
  };

  const totalPages = Math.ceil(totalEvents / pageSize);
  const hasActiveFilters = selectedApplication || selectedEventType || selectedUser || startDate || endDate;

  // Calculate stats
  const sessionEvents = useMemo(() => {
    if (!stats) return 0;
    return stats.eventsByType
      .filter(e => e.type.includes('session'))
      .reduce((sum, e) => sum + e.count, 0);
  }, [stats]);

  const userEvents = useMemo(() => {
    if (!stats) return 0;
    return stats.eventsByType
      .filter(e => e.type.includes('user'))
      .reduce((sum, e) => sum + e.count, 0);
  }, [stats]);

  const todayEvents = useMemo(() => {
    if (!stats) return 0;
    const today = new Date().toDateString();
    return stats.recentActivity.filter(e =>
      new Date(e.createdAt).toDateString() === today
    ).length;
  }, [stats]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              Event Monitoring
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 dark:text-gray-400 mt-1"
            >
              Track and analyze authentication events in real-time
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3"
          >
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />}
              onClick={() => {
                loadEvents();
                loadInitialData();
              }}
              disabled={loading}
            >
              Refresh
            </Button>
            <div className="relative" ref={exportMenuRef}>
              <Button
                variant="success"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => setShowExportMenu(!showExportMenu)}
                isLoading={exporting}
              >
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <button
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
                    onClick={() => handleExport('full')}
                  >
                    <div className="font-medium">Full Export</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">All columns including IDs & timestamps</div>
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
                    onClick={() => handleExport('simple')}
                  >
                    <div className="font-medium">Simple Export</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Basic info: User, Event, Date, Time</div>
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors border-t border-gray-200 dark:border-gray-700"
                    onClick={() => handleExport('user-activity')}
                  >
                    <div className="font-medium">User Activity</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Grouped by user & date</div>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Statistics Cards */}
        {statsLoading ? (
          <SkeletonStats className="mb-8" />
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Events"
              value={formatNumber(stats.totalEvents)}
              icon={Activity}
              gradient="from-violet-500 to-purple-500"
              delay={0}
            />
            <StatCard
              title="Session Events"
              value={formatNumber(sessionEvents)}
              icon={LogIn}
              gradient="from-emerald-500 to-teal-500"
              delay={0.1}
            />
            <StatCard
              title="User Events"
              value={formatNumber(userEvents)}
              icon={Users}
              gradient="from-blue-500 to-indigo-500"
              delay={0.2}
            />
            <StatCard
              title="Active Today"
              value={todayEvents}
              icon={TrendingUp}
              gradient="from-orange-500 to-amber-500"
              delay={0.3}
            />
          </div>
        ) : null}

        {/* Charts Section */}
        {stats && stats.eventsByType.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Events by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <EventsByTypeChart data={stats.eventsByType} />
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((event) => {
                    const colors = getEventTypeColor(event.eventType);
                    const Icon = getEventIcon(event.eventType);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className={cn('p-2 rounded-lg', colors.bg)}>
                          <Icon className={cn('w-4 h-4', colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {formatUserName(event.user)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {event.eventType} • {event.application.name}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {getRelativeTime(event.createdAt)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card variant="glass" className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Quick filters */}
              <div className="flex-1 min-w-[200px] max-w-xs">
                <Select
                  value={selectedApplication}
                  onChange={(e) => {
                    setSelectedApplication(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={applications.map(app => ({ value: app.id, label: app.name }))}
                  placeholder="All Applications"
                />
              </div>
              <div className="flex-1 min-w-[200px] max-w-xs">
                <Select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={users.map(user => ({
                    value: user.id,
                    label: user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : user.firstName || user.lastName || user.authUserId.slice(0, 12) + '...'
                  }))}
                  placeholder="All Users"
                />
              </div>
              <div className="flex-1 min-w-[200px] max-w-xs">
                <Select
                  value={selectedEventType}
                  onChange={(e) => {
                    setSelectedEventType(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={eventTypes}
                  placeholder="All Event Types"
                />
              </div>

              {/* Toggle advanced filters */}
              <Button
                variant={showFilters ? 'primary' : 'ghost'}
                size="sm"
                leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'More'} Filters
              </Button>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<X className="w-4 h-4" />}
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Advanced filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <Input
                      type="date"
                      label="Start Date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      leftIcon={<Calendar className="w-4 h-4" />}
                    />
                    <Input
                      type="date"
                      label="End Date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      leftIcon={<Calendar className="w-4 h-4" />}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Events</CardTitle>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatNumber(totalEvents)} total events
            </span>
          </CardHeader>

          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={5} columns={6} />
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-12 h-12" />}
              title="No events found"
              description={hasActiveFilters
                ? "Try adjusting your filters to see more events."
                : "Events will appear here when users authenticate in your applications."
              }
              action={
                hasActiveFilters && (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )
              }
              className="py-16"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Application
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time Ago
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    <AnimatePresence mode="popLayout">
                      {events.map((event, index) => {
                        const colors = getEventTypeColor(event.eventType);
                        const Icon = getEventIcon(event.eventType);
                        return (
                          <motion.tr
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn('p-2 rounded-lg', colors.bg)}>
                                  <Icon className={cn('w-4 h-4', colors.text)} />
                                </div>
                                <Badge
                                  variant={
                                    event.eventType.includes('created') ? 'success' :
                                      event.eventType.includes('ended') || event.eventType.includes('revoked') ? 'danger' :
                                        'default'
                                  }
                                  size="sm"
                                >
                                  {event.eventType}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatUserName(event.user)}
                                </p>
                                {event.user && (
                                  <p className="text-xs text-gray-500 dark:text-gray-300 truncate max-w-[200px]">
                                    {event.user.authUserId}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {event.application.name}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {event.createdAt.toLocaleDateString('en-US', {
                                  timeZone: 'Asia/Manila',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {event.createdAt.toLocaleTimeString('en-US', {
                                  timeZone: 'Asia/Manila',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                                <Clock className="w-4 h-4" />
                                <span title={formatDateTime(event.createdAt)}>
                                  {getRelativeTime(event.createdAt)}
                                </span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalEvents)} of {formatNumber(totalEvents)} events
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                            currentPage === pageNum
                              ? 'bg-violet-500 text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

// Wrapper component with Suspense boundary for useSearchParams
function EventsPageWrapper() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </AppLayout>
    }>
      <EventsPage />
    </Suspense>
  );
}

export default EventsPageWrapper;

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        timeZone: 'Asia/Manila',
        ...options,
    });
}

/**
 * Format a date to include time
 */
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

/**
 * Format a number with locale string
 */
export function formatNumber(num: number): string {
    return num.toLocaleString('en-US');
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(d);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Generate a random gradient for backgrounds
 */
export function getGradient(index: number): string {
    const gradients = [
        'from-violet-500 to-purple-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-amber-500',
        'from-pink-500 to-rose-500',
        'from-indigo-500 to-blue-500',
    ];
    return gradients[index % gradients.length];
}

/**
 * Get event type color classes
 */
export function getEventTypeColor(eventType: string): {
    bg: string;
    text: string;
    dot: string;
    gradient: string;
} {
    const colors: Record<string, { bg: string; text: string; dot: string; gradient: string }> = {
        'session.created': {
            bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            dot: 'bg-emerald-500',
            gradient: 'from-emerald-500 to-teal-500',
        },
        'session.ended': {
            bg: 'bg-rose-500/10 dark:bg-rose-500/20',
            text: 'text-rose-600 dark:text-rose-400',
            dot: 'bg-rose-500',
            gradient: 'from-rose-500 to-pink-500',
        },
        'session.revoked': {
            bg: 'bg-amber-500/10 dark:bg-amber-500/20',
            text: 'text-amber-600 dark:text-amber-400',
            dot: 'bg-amber-500',
            gradient: 'from-amber-500 to-orange-500',
        },
        'session.removed': {
            bg: 'bg-orange-500/10 dark:bg-orange-500/20',
            text: 'text-orange-600 dark:text-orange-400',
            dot: 'bg-orange-500',
            gradient: 'from-orange-500 to-red-500',
        },
        'user.created': {
            bg: 'bg-blue-500/10 dark:bg-blue-500/20',
            text: 'text-blue-600 dark:text-blue-400',
            dot: 'bg-blue-500',
            gradient: 'from-blue-500 to-indigo-500',
        },
        'user.updated': {
            bg: 'bg-violet-500/10 dark:bg-violet-500/20',
            text: 'text-violet-600 dark:text-violet-400',
            dot: 'bg-violet-500',
            gradient: 'from-violet-500 to-purple-500',
        },
    };

    return colors[eventType] || {
        bg: 'bg-gray-500/10 dark:bg-gray-500/20',
        text: 'text-gray-600 dark:text-gray-400',
        dot: 'bg-gray-500',
        gradient: 'from-gray-500 to-slate-500',
    };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

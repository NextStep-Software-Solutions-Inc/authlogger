'use client';

import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
    const baseClass = cn(
        'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
        'bg-[length:200%_100%]',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-xl',
        variant === 'text' && 'rounded-md h-4',
        className
    );

    return (
        <motion.div
            className={baseClass}
            style={{ width, height }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
    );
}

interface SkeletonCardProps {
    className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
    return (
        <div className={cn('p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800', className)}>
            <div className="flex items-start gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-3/4 h-5" />
                    <Skeleton variant="text" className="w-1/2 h-4" />
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <Skeleton variant="text" className="w-full" />
                <Skeleton variant="text" className="w-full" />
                <Skeleton variant="text" className="w-2/3" />
            </div>
        </div>
    );
}

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
    return (
        <div className={cn('overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800', className)}>
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} variant="text" className="flex-1 h-4" />
                    ))}
                </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="px-6 py-4 flex gap-4">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <Skeleton key={colIndex} variant="text" className="flex-1 h-4" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

interface SkeletonStatsProps {
    count?: number;
    className?: string;
}

export function SkeletonStats({ count = 4, className }: SkeletonStatsProps) {
    return (
        <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="text" className="w-24 h-4" />
                    </div>
                    <Skeleton variant="text" className="w-20 h-8" />
                    <Skeleton variant="text" className="w-32 h-3 mt-2" />
                </div>
            ))}
        </div>
    );
}

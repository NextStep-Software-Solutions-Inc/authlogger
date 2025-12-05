'use client';

import { motion, Variants } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    gradient?: string;
    delay?: number;
    className?: string;
}

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

const iconVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { scale: 1, rotate: 0 },
};

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    gradient = 'from-violet-500 to-purple-500',
    delay = 0,
    className,
}: StatCardProps) {
    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={cn(
                'relative overflow-hidden rounded-2xl p-6',
                'bg-white dark:bg-[#1a1d24]',
                'border border-gray-200 dark:border-gray-700/60',
                'shadow-sm hover:shadow-xl transition-shadow duration-300',
                className
            )}
        >
            {/* Background gradient accent */}
            <div
                className={cn(
                    'absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10',
                    `bg-gradient-to-br ${gradient}`
                )}
            />

            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <motion.div
                        variants={iconVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5, delay: delay + 0.1, type: 'spring' }}
                        className={cn(
                            'p-3 rounded-xl',
                            `bg-gradient-to-br ${gradient}`,
                            'shadow-lg'
                        )}
                        style={{
                            boxShadow: `0 8px 24px -8px ${gradient.includes('violet') ? 'rgba(139, 92, 246, 0.4)' : 'rgba(0, 0, 0, 0.2)'}`,
                        }}
                    >
                        <Icon className="w-5 h-5 text-white" />
                    </motion.div>

                    {trend && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: delay + 0.2 }}
                            className={cn(
                                'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                                trend.isPositive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            )}
                        >
                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                        </motion.div>
                    )}
                </div>

                <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: delay + 0.15 }}
                    className="text-sm font-medium text-gray-600 dark:text-gray-300"
                >
                    {title}
                </motion.h3>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
                    className="text-3xl font-bold text-gray-900 dark:text-white mt-1"
                >
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </motion.p>

                {subtitle && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: delay + 0.25 }}
                        className="text-sm text-gray-600 dark:text-gray-300 mt-1"
                    >
                        {subtitle}
                    </motion.p>
                )}
            </div>
        </motion.div>
    );
}

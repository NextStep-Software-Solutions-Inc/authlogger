'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  AppWindow,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Menu,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { useThemeStore } from '@/app/lib/store';
import { useMounted, useMediaQuery } from '@/app/lib/hooks';
import { cn } from '@/app/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/applications', label: 'Applications', icon: AppWindow },
  { href: '/events', label: 'Events', icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const mounted = useMounted();
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useThemeStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!mounted) return null;

  const isCollapsed = isMobile ? false : sidebarCollapsed;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && !sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-600/50 shadow-lg md:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 280,
          x: isMobile && sidebarCollapsed ? -280 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed left-0 top-0 h-screen z-50',
          'bg-white/95 dark:bg-[#151821]/95 backdrop-blur-xl',
          'border-r border-gray-200/80 dark:border-gray-700/50',
          'flex flex-col',
          isMobile && 'w-[280px]'
        )}
      >
        {/* Logo */}
        <div className={cn('p-6 flex items-center', isCollapsed && 'justify-center')}>
          <Link href="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25"
            >
              <Activity className="w-5 h-5 text-white" />
            </motion.div>
            {!isCollapsed && (
              <span className="font-bold text-xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                AuthLogger
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                      'relative overflow-hidden group',
                      isActive
                        ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                      isCollapsed && 'justify-center px-3'
                    )}
                  >
                    {isActive && (
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 rounded-xl"
                      />
                    )}
                    <Icon className={cn('w-5 h-5 relative z-10 shrink-0', isActive && 'text-violet-500')} />
                    {!isCollapsed && (
                      <span className="font-medium relative z-10 whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Theme toggle */}
        <div className={cn('px-3 py-4 border-t border-gray-200/80 dark:border-gray-700/50', isCollapsed && 'flex justify-center')}>
          <div className={cn('flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/50', isCollapsed && 'flex-col')}>
            {[
              { value: 'light' as const, icon: Sun },
              { value: 'system' as const, icon: Monitor },
              { value: 'dark' as const, icon: Moon },
            ].map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  theme === value
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-500'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* User section */}
        <div className={cn('px-4 py-4 border-t border-gray-200/80 dark:border-gray-700/50', isCollapsed && 'flex justify-center')}>
          <div className="flex items-center gap-3">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10',
                },
              }}
            />
            {!isCollapsed && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Account
              </span>
            )}
          </div>
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-600/50 shadow-sm items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </motion.aside>
    </>
  );
}

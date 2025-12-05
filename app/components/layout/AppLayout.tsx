'use client';

import { motion } from 'framer-motion';
import { Sidebar } from '@/app/components/layout/Sidebar';
import { useThemeStore } from '@/app/lib/store';
import { useMounted, useMediaQuery } from '@/app/lib/hooks';
import { cn } from '@/app/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useThemeStore();
  const mounted = useMounted();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse h-screen w-full bg-gray-100 dark:bg-gray-900" />
      </div>
    );
  }

  const mainMargin = isMobile ? 'ml-0' : sidebarCollapsed ? 'ml-20' : 'ml-[280px]';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: isMobile ? 0 : sidebarCollapsed ? 80 : 280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'min-h-screen transition-all duration-300',
          isMobile && 'pt-16'
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  );
}

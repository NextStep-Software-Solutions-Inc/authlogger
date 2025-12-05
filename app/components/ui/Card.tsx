'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/app/lib/utils';

interface CardProps {
  variant?: 'default' | 'glass' | 'gradient' | 'elevated' | 'bordered';
  hover?: boolean;
  animate?: boolean;
  gradient?: string;
  children?: React.ReactNode;
  className?: string;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const variantStyles = {
  default: `
    bg-white dark:bg-[#1a1d24] 
    border border-gray-200 dark:border-gray-700/60
    shadow-sm
  `,
  glass: `
    bg-white/70 dark:bg-[#1a1d24]/80 
    backdrop-blur-xl 
    border border-white/20 dark:border-gray-600/40
    shadow-xl shadow-black/5
  `,
  gradient: `
    bg-gradient-to-br 
    border-0
    shadow-xl
  `,
  elevated: `
    bg-white dark:bg-[#1a1d24] 
    border border-gray-100 dark:border-gray-700/60
    shadow-xl shadow-black/5 dark:shadow-black/20
  `,
  bordered: `
    bg-transparent 
    border-2 border-gray-200 dark:border-gray-600
  `,
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      hover = true,
      animate = true,
      gradient,
      children,
    },
    ref
  ) => {
    const baseClassName = cn(
      'rounded-2xl overflow-hidden',
      'transition-shadow duration-300',
      hover && 'hover:shadow-lg dark:hover:shadow-black/30',
      variantStyles[variant],
      variant === 'gradient' && (gradient || 'from-violet-500/10 to-purple-500/10'),
      className
    );

    if (animate) {
      return (
        <motion.div
          ref={ref}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.3 }}
          whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
          className={baseClassName}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClassName}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-b border-gray-100 dark:border-gray-800', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-lg font-semibold text-gray-900 dark:text-white',
        className
      )}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500 dark:text-gray-300 mt-1', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50',
        className
      )}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

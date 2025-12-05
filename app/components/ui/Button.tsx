'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';

type ButtonVariant = 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: `
    bg-white dark:bg-gray-800 
    text-gray-900 dark:text-gray-100 
    border border-gray-200 dark:border-gray-700
    hover:bg-gray-50 dark:hover:bg-gray-700
    shadow-sm hover:shadow
  `,
  primary: `
    bg-gradient-to-r from-blue-600 to-indigo-600 
    hover:from-blue-700 hover:to-indigo-700
    text-white 
    shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
    border-0
  `,
  secondary: `
    bg-gray-100 dark:bg-gray-800 
    text-gray-900 dark:text-gray-100 
    hover:bg-gray-200 dark:hover:bg-gray-700
    border border-gray-200 dark:border-gray-700
  `,
  ghost: `
    bg-transparent 
    text-gray-600 dark:text-gray-300 
    hover:bg-gray-100 dark:hover:bg-gray-800
    hover:text-gray-900 dark:hover:text-gray-100
  `,
  danger: `
    bg-gradient-to-r from-red-500 to-rose-500 
    hover:from-red-600 hover:to-rose-600
    text-white 
    shadow-lg shadow-red-500/25 hover:shadow-red-500/40
    border-0
  `,
  success: `
    bg-gradient-to-r from-emerald-500 to-teal-500 
    hover:from-emerald-600 hover:to-teal-600
    text-white 
    shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
    border-0
  `,
  gradient: `
    bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 
    hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700
    text-white 
    shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40
    border-0
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
  icon: 'p-2 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="flex-shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

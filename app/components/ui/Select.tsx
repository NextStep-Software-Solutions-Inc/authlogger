'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl appearance-none',
              'text-gray-900 dark:text-white',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'transition-all duration-200',
              'focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400',
              'focus:ring-2 focus:ring-indigo-500/10',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900',
              'pr-10',
              error && 'border-red-500 dark:border-red-400 focus:border-red-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-gray-400">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {(error || hint) && (
          <p
            className={cn(
              'text-xs mt-1.5',
              error && 'text-red-500',
              hint && !error && 'text-gray-500 dark:text-gray-300'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

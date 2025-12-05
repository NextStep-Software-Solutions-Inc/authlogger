'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type = 'text',
            label,
            error,
            success,
            hint,
            leftIcon,
            rightIcon,
            disabled,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const [isFocused, setIsFocused] = useState(false);

        const isPassword = type === 'password';
        const inputType = isPassword && showPassword ? 'text' : type;

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {leftIcon}
                        </div>
                    )}
                    <motion.div
                        animate={{
                            boxShadow: isFocused
                                ? '0 0 0 3px rgba(99, 102, 241, 0.1)'
                                : '0 0 0 0px rgba(99, 102, 241, 0)',
                        }}
                        className="rounded-xl"
                    >
                        <input
                            ref={ref}
                            type={inputType}
                            disabled={disabled}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className={cn(
                                'w-full px-4 py-2.5 rounded-xl',
                                'text-gray-900 dark:text-white',
                                'bg-white dark:bg-[#1a1d24]',
                                'border border-gray-200 dark:border-gray-600',
                                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                                'transition-all duration-200',
                                'focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400',
                                'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900',
                                leftIcon && 'pl-10',
                                (rightIcon || isPassword || error || success) && 'pr-10',
                                error && 'border-red-500 dark:border-red-400 focus:border-red-500',
                                success && 'border-emerald-500 dark:border-emerald-400 focus:border-emerald-500',
                                className
                            )}
                            {...props}
                        />
                    </motion.div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {isPassword && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        )}
                        {error && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {success && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        {!error && !success && !isPassword && rightIcon}
                    </div>
                </div>
                <AnimatePresence>
                    {(error || success || hint) && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className={cn(
                                'text-xs mt-1.5',
                                error && 'text-red-500',
                                success && 'text-emerald-500',
                                hint && !error && !success && 'text-gray-500 dark:text-gray-300'
                            )}
                        >
                            {error || success || hint}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, hint, disabled, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                        {label}
                    </label>
                )}
                <motion.div
                    animate={{
                        boxShadow: isFocused
                            ? '0 0 0 3px rgba(99, 102, 241, 0.1)'
                            : '0 0 0 0px rgba(99, 102, 241, 0)',
                    }}
                    className="rounded-xl"
                >
                    <textarea
                        ref={ref}
                        disabled={disabled}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={cn(
                            'w-full px-4 py-2.5 rounded-xl resize-none',
                            'text-gray-900 dark:text-white',
                            'bg-white dark:bg-[#1a1d24]',
                            'border border-gray-200 dark:border-gray-600',
                            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                            'transition-all duration-200',
                            'focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900',
                            error && 'border-red-500 dark:border-red-400 focus:border-red-500',
                            className
                        )}
                        {...props}
                    />
                </motion.div>
                <AnimatePresence>
                    {(error || hint) && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className={cn(
                                'text-xs mt-1.5',
                                error && 'text-red-500',
                                hint && !error && 'text-gray-500 dark:text-gray-300'
                            )}
                        >
                            {error || hint}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

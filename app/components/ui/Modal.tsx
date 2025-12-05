'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    className?: string;
}

const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
};

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    className,
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) {
                onClose();
            }
        },
        [closeOnEscape, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscape]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleOverlayClick}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={cn(
                            'relative w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
                            'border border-gray-200 dark:border-gray-800',
                            'max-h-[90vh] overflow-hidden flex flex-col',
                            sizeStyles[size],
                            className
                        )}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                                <div>
                                    {title && (
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {title}
                                        </h2>
                                    )}
                                    {description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 -m-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-auto px-6 py-4">{children}</div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}: ConfirmModalProps) {
    const confirmButtonStyles = {
        danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white',
        warning: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
        info: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
            <div className="flex gap-3 mt-6">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={cn(
                        'flex-1 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50',
                        confirmButtonStyles[variant]
                    )}
                >
                    {isLoading ? 'Loading...' : confirmText}
                </button>
            </div>
        </Modal>
    );
}

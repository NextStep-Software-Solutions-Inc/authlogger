'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, Toast as ToastType } from '@/app/lib/store';
import { cn } from '@/app/lib/utils';

const toastIcons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const toastStyles = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-amber-500 text-white',
};

interface ToastItemProps {
    toast: ToastType;
    onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const Icon = toastIcons[toast.type];

    useEffect(() => {
        const duration = toast.duration || 5000;
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
            className={cn(
                'flex items-start gap-3 p-4 rounded-xl shadow-lg max-w-sm w-full',
                'backdrop-blur-xl',
                toastStyles[toast.type]
            )}
        >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{toast.title}</p>
                {toast.message && (
                    <p className="text-sm opacity-90 mt-0.5">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    const handleRemove = useCallback(
        (id: string) => {
            removeToast(id);
        },
        [removeToast]
    );

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={handleRemove} />
                ))}
            </AnimatePresence>
        </div>
    );
}

// Hook for easy toast usage
export function useToast() {
    const { addToast } = useToastStore();

    return {
        success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
        error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
        info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
        warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    };
}

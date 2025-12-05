'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Theme store
interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'authlogger-theme',
    }
  )
);

// Toast store
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

// Global loading state
interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  loadingMessage: '',
  setLoading: (isLoading, loadingMessage = '') => set({ isLoading, loadingMessage }),
}));

// Filter presets store
interface FilterPreset {
  id: string;
  name: string;
  filters: {
    applicationId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface FilterPresetsState {
  presets: FilterPreset[];
  addPreset: (preset: Omit<FilterPreset, 'id'>) => void;
  removePreset: (id: string) => void;
  updatePreset: (id: string, preset: Partial<FilterPreset>) => void;
}

export const useFilterPresetsStore = create<FilterPresetsState>()(
  persist(
    (set) => ({
      presets: [],
      addPreset: (preset) =>
        set((state) => ({
          presets: [
            ...state.presets,
            { ...preset, id: `preset-${Date.now()}` },
          ],
        })),
      removePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),
      updatePreset: (id, preset) =>
        set((state) => ({
          presets: state.presets.map((p) => (p.id === id ? { ...p, ...preset } : p)),
        })),
    }),
    {
      name: 'authlogger-filter-presets',
    }
  )
);

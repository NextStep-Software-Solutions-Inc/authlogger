'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder = 'Select options...',
  label,
  className,
}: MultiSelectProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        const portalEl = document.getElementById('multiselect-portal');
        if (portalEl && portalEl.contains(target)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const opt = options.find((o) => o.value === value[0]);
      return opt ? opt.label : placeholder;
    }
    return `${value.length} Selected`;
  };

  return (
    <div className={cn('w-full relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl text-sm flex items-center justify-between text-left',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'transition-all duration-200',
          'focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400',
          'focus:ring-2 focus:ring-indigo-500/10'
        )}
      >
        <span
          className={cn(
            'truncate mr-2',
            value.length === 0
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white font-medium'
          )}
        >
          {getDisplayText()}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {value.length > 0 && (
            <span
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
              title="Clear all"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </div>
      </button>

      {mounted && isOpen && createPortal(
        <div
          id="multiselect-portal"
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            zIndex: 9999,
          }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto py-1.5 animate-in fade-in-50 zoom-in-95"
        >
          {options.length > 0 && (
            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {value.length === options.length ? 'Deselect All' : 'Select All'}
              </button>
              {value.length > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {value.length} / {options.length} selected
                </span>
              )}
            </div>
          )}

          {options.length > 0 ? (
            options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors',
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                  )}
                >
                  <span className="truncate pr-2">{option.label}</span>
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
              No options available
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

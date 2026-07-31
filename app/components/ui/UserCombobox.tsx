'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { User as UserIcon, X, Check, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useDebounce } from '@/app/lib/hooks';
import { searchUsersForFilter, getUserByIdForFilter, UserFilterOption } from '@/app/events/actions';

interface UserComboboxProps {
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function UserCombobox({
  value,
  onChange,
  placeholder = 'All Users',
  label,
  className,
}: UserComboboxProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<UserFilterOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserFilterOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // SSR hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute fixed position for portal dropdown
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

  // Update position on scroll/resize when open
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

  // Fetch single user details when value changes (e.g. URL load or reset)
  useEffect(() => {
    let isMounted = true;
    if (value) {
      if (selectedUser?.id !== value) {
        getUserByIdForFilter(value).then((res) => {
          if (isMounted && res.success && res.data) {
            setSelectedUser(res.data);
          }
        });
      }
    } else {
      setSelectedUser(null);
      setSearchQuery('');
    }
    return () => {
      isMounted = false;
    };
  }, [value, selectedUser?.id]);

  // Load users when opened or when debounced search query changes
  const fetchUsers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await searchUsersForFilter(query, 20);
      if (res.success && res.data) {
        setOptions(res.data);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers(debouncedSearch);
    }
  }, [isOpen, debouncedSearch, fetchUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        // Also check if target is inside the portaled dropdown
        const portalEl = document.getElementById('user-combobox-portal');
        if (portalEl && portalEl.contains(target)) {
          return;
        }
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user: UserFilterOption | null) => {
    if (user) {
      setSelectedUser(user);
      onChange(user.id);
    } else {
      setSelectedUser(null);
      onChange('');
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const getUserDisplayName = (user: UserFilterOption) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.authUserId.length > 16 ? `${user.authUserId.slice(0, 16)}...` : user.authUserId;
  };

  const displayInputValue = isOpen
    ? searchQuery
    : selectedUser
    ? getUserDisplayName(selectedUser)
    : '';

  return (
    <div className={cn('w-full relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          ) : (
            <UserIcon className="w-4 h-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={displayInputValue}
          placeholder={selectedUser ? getUserDisplayName(selectedUser) : placeholder}
          onFocus={() => {
            updatePosition();
            setIsOpen(true);
            if (selectedUser) {
              setSearchQuery('');
            }
          }}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) {
              updatePosition();
              setIsOpen(true);
            }
          }}
          className={cn(
            'w-full pl-9 pr-16 py-2.5 rounded-xl text-sm',
            'text-gray-900 dark:text-white',
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'transition-all duration-200',
            'focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400',
            'focus:ring-2 focus:ring-indigo-500/10',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500'
          )}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {(value || searchQuery) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!isOpen) updatePosition();
              setIsOpen(!isOpen);
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')} />
          </button>
        </div>
      </div>

      {mounted && isOpen && createPortal(
        <div
          id="user-combobox-portal"
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            zIndex: 9999,
          }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto py-1.5 animate-in fade-in-50 zoom-in-95"
        >
          {/* Default clear / All users option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              'w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors',
              !value
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            )}
          >
            <span>All Users</span>
            {!value && <Check className="w-4 h-4 text-indigo-500" />}
          </button>

          {options.length > 0 ? (
            options.map((user) => {
              const isSelected = value === user.id;
              const name = getUserDisplayName(user);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors',
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate text-gray-900 dark:text-white font-medium">{name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate font-mono">
                      {user.authUserId}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                </button>
              );
            })
          ) : !loading ? (
            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
              No users found
            </div>
          ) : null}
        </div>,
        document.body
      )}
    </div>
  );
}

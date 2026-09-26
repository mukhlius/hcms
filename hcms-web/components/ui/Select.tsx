import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Search, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  options?: SelectOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  native?: boolean;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      options,
      children,
      id,
      name,
      value,
      defaultValue,
      disabled,
      required,
      placeholder,
      searchable,
      searchPlaceholder = 'Cari opsi...',
      native = false,
      onChange,
      onBlur,
      onFocus,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);

    // Parse options from props.options OR React.Children (<option> elements)
    const parsedOptions = useMemo(() => {
      if (options && options.length > 0) {
        return options.map((opt) => ({
          value: String(opt.value),
          label: opt.label,
          disabled: opt.disabled,
        }));
      }

      const items: Array<{ value: string; label: string; disabled?: boolean }> = [];
      const extractFromChildren = (nodes: React.ReactNode) => {
        React.Children.forEach(nodes, (child) => {
          if (!React.isValidElement(child)) return;

          if (child.type === 'option') {
            const childProps = child.props as any;
            const val = childProps.value !== undefined ? String(childProps.value) : '';
            let lbl = '';
            if (typeof childProps.children === 'string' || typeof childProps.children === 'number') {
              lbl = String(childProps.children);
            } else if (Array.isArray(childProps.children)) {
              lbl = childProps.children
                .map((c: any) => (typeof c === 'string' || typeof c === 'number' ? c : ''))
                .join('');
            } else {
              lbl = val;
            }
            items.push({
              value: val,
              label: lbl || val,
              disabled: childProps.disabled,
            });
          } else if (child.props && (child.props as any).children) {
            extractFromChildren((child.props as any).children);
          }
        });
      };

      extractFromChildren(children);
      return items;
    }, [options, children]);

    // Track active value (controlled vs uncontrolled)
    const isControlled = value !== undefined;
    const [internalVal, setInternalVal] = useState<string>(
      defaultValue !== undefined ? String(defaultValue) : ''
    );
    const currentValue = isControlled ? (value !== null && value !== undefined ? String(value) : '') : internalVal;

    // Dropdown state
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [openUpward, setOpenUpward] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);

    // Selected option metadata
    const selectedOption = useMemo(() => {
      return parsedOptions.find((opt) => String(opt.value) === String(currentValue));
    }, [parsedOptions, currentValue]);

    // Automatically enable search if more than 7 options
    const shouldShowSearch = searchable !== undefined ? searchable : parsedOptions.length > 7;

    // Filtered options based on search query
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return parsedOptions;
      const q = searchQuery.toLowerCase().trim();
      return parsedOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.value.toLowerCase().includes(q)
      );
    }, [parsedOptions, searchQuery]);

    // Handle open / close toggle and bounds calculation
    const toggleDropdown = () => {
      if (disabled) return;
      if (!isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If space below is less than 260px and space above is larger, open upward
        if (spaceBelow < 260 && rect.top > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
      setIsOpen(!isOpen);
      setSearchQuery('');
      setHighlightedIndex(-1);
    };

    // Close on click outside
    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleOutsideClick);
      }
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }, [isOpen]);

    // Focus search input when opened
    useEffect(() => {
      if (isOpen && shouldShowSearch) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 40);
        return () => clearTimeout(timer);
      }
    }, [isOpen, shouldShowSearch]);

    // Select an option
    const handleSelectOption = (optVal: string) => {
      if (!isControlled) {
        setInternalVal(optVal);
      }

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = optVal;
      }

      if (onChange) {
        const syntheticEvent = {
          target: {
            value: optVal,
            name: name || '',
            id: selectId,
          },
          currentTarget: {
            value: optVal,
            name: name || '',
            id: selectId,
          },
          bubbles: true,
          cancelable: true,
          defaultPrevented: false,
          eventPhase: 3,
          isTrusted: true,
          preventDefault: () => {},
          isDefaultPrevented: () => false,
          stopPropagation: () => {},
          isPropagationStopped: () => false,
          persist: () => {},
          timeStamp: Date.now(),
          type: 'change',
        } as unknown as React.ChangeEvent<HTMLSelectElement>;

        onChange(syntheticEvent);
      }

      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleDropdown();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev + 1;
          return next >= filteredOptions.length ? 0 : next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? filteredOptions.length - 1 : next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const target = filteredOptions[highlightedIndex];
          if (!target.disabled) {
            handleSelectOption(target.value);
          }
        }
      }
    };

    // If native select is explicitly requested
    if (native) {
      return (
        <div className="w-full space-y-1.5">
          {label && (
            <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {label} {required && <span className="text-rose-500">*</span>}
            </label>
          )}
          <div className="relative flex items-center group">
            {leftIcon && (
              <div className="pointer-events-none absolute left-3 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                {leftIcon}
              </div>
            )}
            <select
              id={selectId}
              ref={ref}
              name={name}
              value={value}
              defaultValue={defaultValue}
              disabled={disabled}
              required={required}
              onChange={onChange}
              className={cn(
                'flex h-10 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 pr-9 text-sm font-normal text-slate-900 dark:text-slate-100 shadow-2xs cursor-pointer',
                'hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/40 dark:hover:bg-slate-900/60',
                'focus:border-[var(--primary-color,#2563eb)] focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring,#3b82f6)]/20',
                'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-600',
                'transition-all duration-150',
                leftIcon ? 'pl-9' : '',
                error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
                className
              )}
              {...props}
            >
              {options
                ? options.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))
                : children}
            </select>
            <div className="pointer-events-none absolute right-3 flex items-center text-slate-400 group-hover:text-slate-600 transition-colors">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          {error ? (
            <p className="text-xs text-rose-600 animate-in fade-in duration-150">{error}</p>
          ) : helperText ? (
            <p className="text-xs text-slate-500">{helperText}</p>
          ) : null}
        </div>
      );
    }

    // Determine trigger display text
    const displayLabel = selectedOption
      ? selectedOption.label
      : placeholder || (parsedOptions[0]?.value === '' ? parsedOptions[0]?.label : '-- Pilih --');

    const isPlaceholderDisplayed = !selectedOption || selectedOption.value === '';

    return (
      <div ref={containerRef} className="w-full space-y-1.5 relative">
        {label && (
          <label
            htmlFor={selectId ? `${selectId}-btn` : undefined}
            onClick={toggleDropdown}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        {/* Hidden native select for full form/validation/ref compatibility */}
        <select
          ref={(node) => {
            hiddenSelectRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
            }
          }}
          id={selectId}
          name={name}
          value={currentValue}
          disabled={disabled}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none absolute -bottom-px left-0 h-0 w-0 opacity-0"
          onChange={() => {}}
        >
          {parsedOptions.map((opt, i) => (
            <option key={`${opt.value}-${i}`} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Modern Trigger Button */}
        <div className="relative flex items-center group">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors z-10">
              {leftIcon}
            </div>
          )}

          <button
            type="button"
            id={selectId ? `${selectId}-btn` : undefined}
            disabled={disabled}
            onClick={toggleDropdown}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-left shadow-2xs transition-all duration-150 cursor-pointer select-none',
              'hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/50',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              isOpen && 'ring-2 ring-blue-500/25 border-blue-500 bg-white dark:bg-slate-950',
              disabled && 'cursor-not-allowed opacity-60 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              leftIcon ? 'pl-9' : '',
              className
            )}
          >
            <span
              className={cn(
                'truncate pr-2',
                isPlaceholderDisplayed
                  ? 'text-slate-400 dark:text-slate-500 font-normal'
                  : 'text-slate-900 dark:text-slate-100 font-medium'
              )}
            >
              {displayLabel}
            </span>

            <div className="flex items-center gap-1 shrink-0 ml-1.5">
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 transition-transform duration-200',
                  isOpen && 'rotate-180 text-blue-600 dark:text-blue-400',
                  'group-hover:text-slate-600 dark:group-hover:text-slate-300'
                )}
              />
            </div>
          </button>
        </div>

        {/* Custom Modern Floating Popover */}
        {isOpen && (
          <div
            className={cn(
              'absolute z-50 left-0 right-0 w-full min-w-[220px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/50 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150',
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            )}
          >
            {/* Search Input Filter */}
            {shouldShowSearch && (
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                        handleKeyDown(e);
                      } else if (e.key === 'Escape') {
                        setIsOpen(false);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div
              role="listbox"
              className="max-h-60 overflow-y-auto p-1.5 space-y-0.5"
            >
              {filteredOptions.length === 0 ? (
                <div className="py-5 px-3 text-center">
                  <AlertCircle className="h-5 w-5 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Tidak ada opsi ditemukan
                  </p>
                  {searchQuery && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      Tidak ada yang cocok dengan &quot;{searchQuery}&quot;
                    </p>
                  )}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(currentValue);
                  const isHighlighted = idx === highlightedIndex;
                  const isPlaceholder = opt.value === '';

                  return (
                    <div
                      key={`${opt.value}-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!opt.disabled) {
                          handleSelectOption(opt.value);
                        }
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'group relative flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all select-none',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : isHighlighted
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                        opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                        isPlaceholder && 'italic text-slate-400 dark:text-slate-500'
                      )}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && (
                        <span className="shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 dark:bg-blue-500 text-white ml-2 shadow-xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Error / Helper text */}
        {error ? (
          <p className="text-xs text-rose-600 animate-in fade-in duration-150">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

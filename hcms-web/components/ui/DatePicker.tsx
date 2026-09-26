'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  CalendarCheck2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  className?: string;
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  align?: 'left' | 'right' | 'auto';
}

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ags',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

type ViewMode = 'days' | 'months' | 'years';

export const DatePicker: React.FC<DatePickerProps> = ({
  value = '',
  onChange,
  name,
  placeholder = 'Pilih tanggal...',
  disabled = false,
  required = false,
  minDate,
  maxDate,
  className,
  id,
  label,
  helperText,
  error,
  align = 'auto',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [popoverPlacement, setPopoverPlacement] = useState<{
    horizontal: 'left' | 'right';
    vertical: 'bottom' | 'top';
  }>({ horizontal: 'left', vertical: 'bottom' });

  // Text input value for manual typing
  const [inputValue, setInputValue] = useState('');

  // Parse initial selected date
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const clean = value.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }, [value]);

  // Sync text input with value
  useEffect(() => {
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      setInputValue(`${d}/${m}/${y}`);
    } else {
      setInputValue('');
    }
  }, [selectedDate]);

  // View state for navigating calendar months
  const [viewYear, setViewYear] = useState<number>(() => {
    if (selectedDate) return selectedDate.getFullYear();
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (selectedDate) return selectedDate.getMonth();
    return new Date().getMonth();
  });

  // Decade starting year for 'years' view mode (groups of 12)
  const [decadeStart, setDecadeStart] = useState<number>(() => {
    const yr = selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();
    return Math.floor(yr / 12) * 12;
  });

  // Sync view when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
      setDecadeStart(Math.floor(selectedDate.getFullYear() / 12) * 12);
    }
  }, [selectedDate]);

  // Calculate popover positioning on open
  const updatePlacement = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let h: 'left' | 'right' = 'left';
    if (align === 'right') {
      h = 'right';
    } else if (align === 'left') {
      h = 'left';
    } else {
      // Auto: if near right edge (popover width ~ 320px)
      if (rect.left + 330 > windowWidth && rect.right >= 330) {
        h = 'right';
      } else {
        h = 'left';
      }
    }

    let v: 'bottom' | 'top' = 'bottom';
    // If not enough room below (need ~360px), flip upwards if top has room
    if (windowHeight - rect.bottom < 380 && rect.top > 380) {
      v = 'top';
    } else {
      v = 'bottom';
    }

    setPopoverPlacement({ horizontal: h, vertical: v });
  }, [align]);

  useEffect(() => {
    if (isOpen) {
      updatePlacement();
      window.addEventListener('resize', updatePlacement);
      window.addEventListener('scroll', updatePlacement, true);
    }
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [isOpen, updatePlacement]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Format date helper: YYYY-MM-DD
  const formatIsoDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Friendly Indonesian string
  const displayString = useMemo(() => {
    if (!selectedDate) return '';
    const day = selectedDate.getDate();
    const month = MONTH_NAMES_ID[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${day} ${month} ${year}`;
  }, [selectedDate]);

  // Generate calendar days for current viewMonth & viewYear
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      date: Date;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
      dayNumber: number;
    }[] = [];

    const todayStr = formatIsoDate(new Date());
    const selectedStr = selectedDate ? formatIsoDate(selectedDate) : '';

    // Previous month padding
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
      const iso = formatIsoDate(prevDate);
      const isDisabled = (!!minDate && iso < minDate) || (!!maxDate && iso > maxDate);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isSelected: iso === selectedStr,
        isToday: iso === todayStr,
        isDisabled,
        dayNumber: prevDate.getDate(),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const currDate = new Date(viewYear, viewMonth, day);
      const iso = formatIsoDate(currDate);
      const isDisabled = (!!minDate && iso < minDate) || (!!maxDate && iso > maxDate);
      days.push({
        date: currDate,
        isCurrentMonth: true,
        isSelected: iso === selectedStr,
        isToday: iso === todayStr,
        isDisabled,
        dayNumber: day,
      });
    }

    // Next month padding to complete 42 cells (6 rows) or 35 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(viewYear, viewMonth + 1, day);
      const iso = formatIsoDate(nextDate);
      const isDisabled = (!!minDate && iso < minDate) || (!!maxDate && iso > maxDate);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isSelected: iso === selectedStr,
        isToday: iso === todayStr,
        isDisabled,
        dayNumber: day,
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDate, minDate, maxDate]);

  // Handlers
  const handleSelectDate = (date: Date) => {
    const isoString = formatIsoDate(date);
    onChange?.(isoString);
    setIsOpen(false);
    setViewMode('days');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    setInputValue('');
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setViewYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setViewYear((prev) => prev + 1);
  };

  const handlePrevDecade = () => {
    setDecadeStart((prev) => prev - 12);
  };

  const handleNextDecade = () => {
    setDecadeStart((prev) => prev + 12);
  };

  const handlePickToday = () => {
    const now = new Date();
    handleSelectDate(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // Direct typing handler (support DD/MM/YYYY or YYYY-MM-DD)
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);

    // Format DD/MM/YYYY
    const ddmmyyyyMatch = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (ddmmyyyyMatch) {
      const d = parseInt(ddmmyyyyMatch[1], 10);
      const m = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const y = parseInt(ddmmyyyyMatch[3], 10);
      const dateObj = new Date(y, m, d);
      if (
        !isNaN(dateObj.getTime()) &&
        dateObj.getFullYear() === y &&
        dateObj.getMonth() === m &&
        dateObj.getDate() === d
      ) {
        const iso = formatIsoDate(dateObj);
        onChange?.(iso);
        setViewYear(y);
        setViewMonth(m);
      }
      return;
    }

    // Format YYYY-MM-DD
    const yyyymmddMatch = text.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
    if (yyyymmddMatch) {
      const y = parseInt(yyyymmddMatch[1], 10);
      const m = parseInt(yyyymmddMatch[2], 10) - 1;
      const d = parseInt(yyyymmddMatch[3], 10);
      const dateObj = new Date(y, m, d);
      if (
        !isNaN(dateObj.getTime()) &&
        dateObj.getFullYear() === y &&
        dateObj.getMonth() === m &&
        dateObj.getDate() === d
      ) {
        const iso = formatIsoDate(dateObj);
        onChange?.(iso);
        setViewYear(y);
        setViewMonth(m);
      }
      return;
    }

    if (text === '') {
      onChange?.('');
    }
  };

  // Years array for Decade selector
  const yearsInDecade = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i < 12; i++) {
      list.push(decadeStart + i);
    }
    return list;
  }, [decadeStart]);

  // Quick preset decades for jumping quickly (especially birth years)
  const quickDecades = [
    { label: '2020-an', start: 2020 },
    { label: '2010-an', start: 2010 },
    { label: '2000-an', start: 2000 },
    { label: '1990-an', start: 1990 },
    { label: '1980-an', start: 1980 },
    { label: '1970-an', start: 1970 },
  ];

  return (
    <div ref={containerRef} className={cn('relative w-full', label && 'space-y-1.5')}>
      {/* Label if provided */}
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Hidden input for HTML form validation compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          id={id}
        />
      )}

      {/* Input / Trigger Control */}
      <div
        className={cn(
          'group relative h-10 w-full rounded-xl border text-sm transition-all flex items-center',
          'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100',
          'hover:border-slate-300 dark:hover:border-slate-700',
          'focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 dark:focus-within:border-blue-500',
          error && 'border-rose-500 focus-within:border-rose-500 focus-within:ring-rose-500/20',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900',
          isOpen && 'ring-2 ring-blue-500/20 border-blue-500 dark:border-blue-500 shadow-sm',
          className
        )}
      >
        {/* Left Calendar Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              setViewMode('days');
            }
          }}
          className="pl-3.5 pr-2 py-2 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors focus:outline-none"
          title="Buka Kalender"
        >
          <CalendarIcon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              selectedDate
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 dark:text-slate-500'
            )}
          />
        </button>

        {/* Text Input for Typing OR displaying formatted date */}
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={isOpen ? inputValue : displayString || inputValue}
          placeholder={placeholder}
          onFocus={() => {
            if (!disabled) {
              updatePlacement();
              setIsOpen(true);
            }
          }}
          onChange={handleManualInputChange}
          className={cn(
            'w-full bg-transparent py-2 text-sm font-medium outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
            disabled && 'cursor-not-allowed text-slate-500'
          )}
        />

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 pr-2.5">
          {/* Quick Clear Button */}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Hapus tanggal"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Toggle Calendar Arrow Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => !prev);
                setViewMode('days');
              }
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Helper text or Error message */}
      {error ? (
        <p className="text-xs text-rose-600 animate-in fade-in duration-150">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}

      {/* Floating Modern Calendar Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={cn(
            'absolute z-50 w-[310px] sm:w-[330px] rounded-2xl p-4 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-150',
            popoverPlacement.horizontal === 'right' ? 'right-0' : 'left-0',
            popoverPlacement.vertical === 'top'
              ? 'bottom-full mb-2'
              : 'top-full mt-2'
          )}
          style={{ minWidth: '300px' }}
        >
          {/* =================================================================
              HEADER: Navigation & View Mode Switcher
             ================================================================= */}
          <div className="flex items-center justify-between gap-1 pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
            {/* View Mode: DAYS */}
            {viewMode === 'days' && (
              <>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handlePrevYear}
                    className="h-8 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Mundur 1 Tahun"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="h-8 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Bulan Sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>

                {/* Center Title: Click to switch to Month or Year mode */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('months')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {MONTH_NAMES_ID[viewMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDecadeStart(Math.floor(viewYear / 12) * 12);
                      setViewMode('years');
                    }}
                    className="px-2 py-1 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {viewYear}
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="h-8 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Bulan Berikutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextYear}
                    className="h-8 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Maju 1 Tahun"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* View Mode: MONTHS */}
            {viewMode === 'months' && (
              <>
                <button
                  type="button"
                  onClick={handlePrevYear}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Pilih Bulan:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDecadeStart(Math.floor(viewYear / 12) * 12);
                      setViewMode('years');
                    }}
                    className="px-2 py-1 rounded-lg text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {viewYear}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleNextYear}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* View Mode: YEARS */}
            {viewMode === 'years' && (
              <>
                <button
                  type="button"
                  onClick={handlePrevDecade}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="12 Tahun Sebelumnya"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {decadeStart} - {decadeStart + 11}
                </span>
                <button
                  type="button"
                  onClick={handleNextDecade}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="12 Tahun Berikutnya"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* =================================================================
              BODY CONTENT BASED ON VIEW MODE
             ================================================================= */}

          {/* 1. DAYS VIEW */}
          {viewMode === 'days' && (
            <>
              {/* Days of Week Row */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {DAY_NAMES_ID.map((dayName, idx) => (
                  <span
                    key={dayName}
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider py-1 select-none',
                      idx === 0
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={item.isDisabled}
                      onClick={() => !item.isDisabled && handleSelectDate(item.date)}
                      className={cn(
                        'relative h-8 w-full rounded-xl flex items-center justify-center text-xs font-medium transition-all select-none',
                        // Selected Day Styling
                        item.isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/25 scale-105 z-10'
                          : item.isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400'
                          : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40',
                        // Today Styling
                        item.isToday && !item.isSelected && 'ring-1 ring-blue-500/80 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30',
                        // Disabled
                        item.isDisabled && 'opacity-25 cursor-not-allowed hover:bg-transparent text-slate-300 dark:text-slate-700'
                      )}
                    >
                      <span>{item.dayNumber}</span>
                      {item.isToday && !item.isSelected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* 2. MONTHS VIEW */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {MONTH_NAMES_SHORT.map((mShort, idx) => {
                const isSelected = selectedDate && selectedDate.getMonth() === idx && selectedDate.getFullYear() === viewYear;
                const isCurrent = viewMonth === idx;
                return (
                  <button
                    key={mShort}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx);
                      setViewMode('days');
                    }}
                    className={cn(
                      'h-10 rounded-xl text-xs font-semibold transition-all select-none',
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md'
                        : isCurrent
                        ? 'border border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {MONTH_NAMES_ID[idx]}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. YEARS VIEW */}
          {viewMode === 'years' && (
            <div className="space-y-3">
              {/* Quick Decades Navigation Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {quickDecades.map((dec) => (
                  <button
                    key={dec.start}
                    type="button"
                    onClick={() => setDecadeStart(dec.start)}
                    className={cn(
                      'px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors',
                      decadeStart === dec.start
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    {dec.label}
                  </button>
                ))}
              </div>

              {/* 12 Years Grid */}
              <div className="grid grid-cols-3 gap-2 py-1">
                {yearsInDecade.map((yr) => {
                  const isSelected = selectedDate && selectedDate.getFullYear() === yr;
                  const isCurrent = new Date().getFullYear() === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setViewYear(yr);
                        setViewMode('months');
                      }}
                      className={cn(
                        'h-10 rounded-xl text-xs font-mono font-bold transition-all select-none',
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : yr === viewYear
                          ? 'border border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                          : isCurrent
                          ? 'ring-1 ring-slate-300 dark:ring-slate-700 text-slate-800 dark:text-slate-200'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              FOOTER: Shortcuts & Quick Actions
             ================================================================= */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handlePickToday}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>Hari Ini</span>
            </button>

            {viewMode !== 'days' ? (
              <button
                type="button"
                onClick={() => setViewMode('days')}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                Kembali ke Kalender
              </button>
            ) : selectedDate ? (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[170px] text-right">
                {displayString}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

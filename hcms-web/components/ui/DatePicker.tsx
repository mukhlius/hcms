'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarCheck2,
  Clock
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

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial selected date (or null)
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }, [value]);

  // View state for navigating calendar months
  const [viewYear, setViewYear] = useState<number>(() => {
    if (selectedDate) return selectedDate.getFullYear();
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (selectedDate) return selectedDate.getMonth();
    return new Date().getMonth();
  });

  // Sync view when value changes from outside
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  // Close popover when clicking outside
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Year choices (from 1940 up to 2040)
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    const currentYear = new Date().getFullYear();
    const start = Math.min(1940, currentYear - 70);
    const end = Math.max(2045, currentYear + 20);
    for (let y = end; y >= start; y--) {
      years.push(y);
    }
    return years;
  }, []);

  // Format date helper: YYYY-MM-DD
  const formatIsoDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Friendly Indonesian string for trigger display
  const displayString = useMemo(() => {
    if (!selectedDate) return '';
    const day = selectedDate.getDate();
    const month = MONTH_NAMES_ID[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${day} ${month} ${year}`;
  }, [selectedDate]);

  // Full formatted preview string (e.g. "Sabtu, 26 September 2026")
  const fullDisplayString = useMemo(() => {
    if (!selectedDate) return '';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(selectedDate);
    } catch {
      return displayString;
    }
  }, [selectedDate, displayString]);

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

    // Next month padding to complete 42 cells (6 rows * 7) or 35 cells
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
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
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

  const handlePickToday = () => {
    const now = new Date();
    handleSelectDate(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  return (
    <div ref={containerRef} className="relative w-full">
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

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'group relative h-10 w-full rounded-xl border px-3.5 py-2 text-sm text-left font-normal transition-all outline-none select-none flex items-center justify-between',
          'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100',
          'hover:border-slate-300 dark:hover:border-slate-700',
          'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/20 dark:focus:border-blue-500',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900',
          isOpen && 'ring-2 ring-blue-500/20 border-blue-500 dark:border-blue-500 shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              selectedDate
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
            )}
          />
          {selectedDate ? (
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {displayString}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          {/* Quick Clear Button */}
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus tanggal"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}

          {/* Status Dot if filled */}
          {selectedDate && (
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
          )}
        </div>
      </button>

      {/* Floating Modern Calendar Popover */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 top-full mt-2 w-[310px] sm:w-[330px] rounded-2xl p-4 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-150"
          style={{ minWidth: '300px' }}
        >
          {/* Header: Month & Year Selector + Prev/Next Buttons */}
          <div className="flex items-center justify-between gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-2 py-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {MONTH_NAMES_ID.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-2 py-0.5 text-xs font-semibold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of Week Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
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

          {/* Footer Shortcuts & Date Preview */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handlePickToday}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>Hari Ini</span>
            </button>

            {selectedDate && (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[170px] text-right">
                {displayString}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

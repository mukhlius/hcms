'use client';

import React, { useId, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  badgeColor?: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
  size?: 'sm' | 'md';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  layoutId,
  size = 'md',
}) => {
  const autoId = useId();
  const activeIndicatorId = layoutId || `tabs-indicator-${autoId}`;

  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = navRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    window.addEventListener('resize', checkScroll);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, tabs]);

  // Gentle auto-scroll to active tab when it changes
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement | null;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = navRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.6, 200);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 300);
  };

  return (
    <div className={cn('relative border-b border-slate-200/90 group/tabs', className)}>
      {/* Scroll Left Button */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-6 pl-0.5 bg-gradient-to-r from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 dark:to-transparent pointer-events-none"
          >
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-all cursor-pointer active:scale-95"
              aria-label="Geser tab ke kiri"
              title="Geser tab ke kiri"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Right Button */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-6 pr-0.5 bg-gradient-to-l from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 dark:to-transparent pointer-events-none"
          >
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-all cursor-pointer active:scale-95"
              aria-label="Geser tab ke kanan"
              title="Geser tab ke kanan"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs List */}
      <nav
        ref={navRef}
        onScroll={checkScroll}
        className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none scroll-smooth py-1 px-0.5"
        aria-label="Tabs"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'group relative inline-flex items-center justify-center gap-2 font-medium transition-all whitespace-nowrap cursor-pointer rounded-lg select-none',
                size === 'sm'
                  ? 'px-3 py-1.5 text-xs h-8'
                  : 'px-3.5 py-2 text-xs sm:text-sm h-9 sm:h-9.5',
                isActive
                  ? 'text-[var(--primary-color,#2563eb)] font-semibold bg-blue-50/70 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/70'
              )}
            >
              {tab.icon && (
                <span
                  className={cn(
                    'transition-colors shrink-0 flex items-center justify-center',
                    isActive ? 'text-[var(--primary-color,#2563eb)] dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  )}
                >
                  {tab.icon}
                </span>
              )}
              <span className="leading-none">{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold transition-colors leading-none',
                    tab.badgeColor
                      ? tab.badgeColor
                      : isActive
                      ? 'bg-[var(--primary-light,#eff6ff)] text-[var(--primary-color,#2563eb)] ring-1 ring-[var(--primary-border,#bfdbfe)] dark:bg-blue-900/60 dark:text-blue-300 dark:ring-blue-800'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700'
                  )}
                >
                  {tab.count}
                </span>
              )}

              {/* Animated Sliding Underline Indicator */}
              {isActive && (
                <motion.div
                  layoutId={activeIndicatorId}
                  className="absolute bottom-0.5 left-2.5 right-2.5 h-[2px] bg-[var(--primary-color,#2563eb)] rounded-full shadow-[0_1px_6px_var(--primary-ring,rgba(37,99,235,0.45))] dark:bg-blue-500"
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

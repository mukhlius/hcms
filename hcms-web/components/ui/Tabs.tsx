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
            className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-5 pl-0.5 bg-gradient-to-r from-white via-white/95 to-transparent pointer-events-none"
          >
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer active:scale-95"
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
            className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-5 pr-0.5 bg-gradient-to-l from-white via-white/95 to-transparent pointer-events-none"
          >
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer active:scale-95"
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
        className="-mb-px flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none scroll-smooth"
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
                'group relative inline-flex items-center gap-2 font-medium transition-colors whitespace-nowrap cursor-pointer rounded-t-lg select-none',
                size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm',
                isActive
                  ? 'text-[var(--primary-color,#2563eb)] font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              )}
            >
              {tab.icon && (
                <span
                  className={cn(
                    'transition-colors shrink-0',
                    isActive ? 'text-[var(--primary-color,#2563eb)]' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                >
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold transition-colors',
                    tab.badgeColor
                      ? tab.badgeColor
                      : isActive
                      ? 'bg-[var(--primary-light,#eff6ff)] text-[var(--primary-color,#2563eb)] ring-1 ring-[var(--primary-border,#bfdbfe)]'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70'
                  )}
                >
                  {tab.count}
                </span>
              )}

              {/* Animated Sliding Underline Indicator */}
              {isActive && (
                <motion.div
                  layoutId={activeIndicatorId}
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--primary-color,#2563eb)] rounded-full shadow-[0_1px_6px_var(--primary-ring,rgba(37,99,235,0.45))]"
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

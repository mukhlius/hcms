'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface SortableHeaderProps {
  label?: string;
  children?: React.ReactNode;
  field: string;
  currentField: string | null;
  sortOrder?: 'asc' | 'desc';
  currentOrder?: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  children,
  field,
  currentField,
  sortOrder,
  currentOrder,
  onSort,
  className = '',
  align = 'left',
}) => {
  const isActive = currentField === field;
  const effectiveOrder = currentOrder || sortOrder || 'asc';
  const content = children || label;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      style={{
        color: isActive ? 'var(--primary-color, #2563eb)' : undefined,
      }}
      className={`group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
        isActive ? '' : 'text-slate-600 hover:text-[var(--primary-color,#2563eb)]'
      } ${
        align === 'right' ? 'justify-end ml-auto' : align === 'center' ? 'justify-center mx-auto' : 'justify-start'
      } ${className}`}
    >
      <span>{content}</span>
      {isActive ? (
        effectiveOrder === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--primary-color, #2563eb)' }} />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--primary-color, #2563eb)' }} />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-[var(--primary-color,#2563eb)] opacity-60 group-hover:opacity-100 shrink-0" />
      )}
    </button>
  );
};

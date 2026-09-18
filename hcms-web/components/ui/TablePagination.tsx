'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from './Button';

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  perPage,
  totalItems,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100],
  itemLabel = 'data',
  className = '',
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 text-xs text-slate-500 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <span>
          Menampilkan <span className="font-semibold text-slate-700">{startItem}-{endItem}</span> dari{' '}
          <span className="font-semibold text-slate-700">{totalItems}</span> {itemLabel}
        </span>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-800">
          <span className="text-slate-500">Tampilkan:</span>
          <div className="relative flex items-center group">
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="h-7.5 appearance-none rounded-md border border-slate-200 bg-white pl-2.5 pr-6 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
            >
              {perPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} baris
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Sebelumnya
        </Button>
        <span className="font-semibold text-slate-700 px-1">
          Halaman {currentPage} dari {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
};

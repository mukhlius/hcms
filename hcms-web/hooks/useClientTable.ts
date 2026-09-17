import { useState, useMemo } from 'react';

export interface UseClientTableOptions<T> {
  defaultSortField?: string;
  defaultSortOrder?: 'asc' | 'desc';
  defaultPerPage?: number;
  customSortFn?: (a: T, b: T, field: string, order: 'asc' | 'desc') => number;
}

export function useClientTable<T>(
  data: T[],
  options?: UseClientTableOptions<T>
) {
  const [sortField, setSortField] = useState<string | null>(options?.defaultSortField || null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options?.defaultSortOrder || 'asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(options?.defaultPerPage || 10);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a: any, b: any) => {
      if (options?.customSortFn) {
        return options.customSortFn(a, b, sortField, sortOrder);
      }
      // Support nested paths like 'organization_unit.name'
      const getNestedVal = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
      };

      const aVal = getNestedVal(a, sortField);
      const bVal = getNestedVal(b, sortField);

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison =
        typeof aVal === 'string'
          ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
          : aVal > bVal
          ? 1
          : -1;

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder, options]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / perPage));

  // If current page is beyond totalPages (e.g. data filtered down), clamp it
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validCurrentPage - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [sortedData, validCurrentPage, perPage]);

  return {
    sortField,
    sortOrder,
    handleSort,
    currentPage: validCurrentPage,
    setCurrentPage,
    perPage,
    handlePerPageChange,
    totalPages,
    totalItems: sortedData.length,
    paginatedData,
  };
}

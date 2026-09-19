'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  RefreshCw, 
  Users, 
  Building2, 
  MapPin, 
  Network, 
  Briefcase, 
  FolderTree,
  Split,
  FileCheck,
  Stethoscope,
  Clock, 
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Shield,
  X
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { toast, confirmDialog } from '@/stores/alertStore';
import { 
  recycleBinService, 
  RecycleBinEntity, 
  TrashSummary, 
  TrashItem 
} from '@/services/recycleBinService';

export default function RecycleBinPage() {
  const [selectedEntity, setSelectedEntity] = useState<RecycleBinEntity>('users');
  const [items, setItems] = useState<TrashItem[]>([]);
  const [summary, setSummary] = useState<TrashSummary>({
    users: 0,
    companies: 0,
    sites: 0,
    departments: 0,
    sections: 0,
    positions: 0,
    'employment-types': 0,
    'benefit-plafonds': 0,
    units: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortField, setSortField] = useState<string | null>('deleted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState<boolean>(false);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Fetch summary counts
  const loadSummary = useCallback(async () => {
    try {
      const res = await recycleBinService.getSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load trash summary:', err);
    }
  }, []);

  // Fetch items for selected entity
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await recycleBinService.getItems(selectedEntity, {
        search: search.trim() || undefined,
        page,
        per_page: perPage,
      });

      if (res.success && res.data) {
        setItems(res.data.data || []);
        setPagination({
          current_page: res.data.current_page || 1,
          last_page: res.data.last_page || 1,
          per_page: res.data.per_page || perPage,
          total: res.data.total || 0,
        });
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load trashed items:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEntity, search, page, perPage]);

  const sortedItems = React.useMemo(() => {
    if (!sortField) return items;
    return [...items].sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'code') {
        aVal = a.code || a.username || a.id;
        bVal = b.code || b.username || b.id;
      } else if (sortField === 'name') {
        aVal = a.name || a.title;
        bVal = b.name || b.title;
      }
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, sortField, sortOrder]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Handle Tab Change
  const handleEntityChange = (id: string) => {
    setSelectedEntity(id as RecycleBinEntity);
    setSelectedIds([]);
    setSearch('');
    setPage(1);
  };

  // Selection handlers
  const currentPageIds = items.map((i) => i.id);
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  // Bulk restore handler
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    const entityLabel = getEntityLabel(selectedEntity);

    const confirmed = await confirmDialog({
      title: `Pulihkan ${selectedIds.length} Data ${entityLabel}`,
      message: `Apakah Anda yakin ingin memulihkan ${selectedIds.length} data ${entityLabel.toLowerCase()} yang ditandai kembali ke data aktif sistem?`,
      confirmText: `Ya, Pulihkan (${selectedIds.length}) Data`,
      cancelText: 'Batal',
      variant: 'primary',
    });

    if (!confirmed) return;

    try {
      setIsBulkLoading(true);
      const res = await recycleBinService.bulkRestore(selectedEntity, selectedIds);
      toast.success(
        res.message || `${selectedIds.length} data berhasil dipulihkan ke status aktif.`,
        'Pemulihan Masal Berhasil'
      );
      setSelectedIds([]);
      await Promise.all([loadSummary(), loadItems()]);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal memulihkan data terpilih.',
        'Gagal Memulihkan Masal'
      );
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Bulk force delete handler
  const handleBulkForceDelete = async () => {
    if (selectedIds.length === 0) return;
    const entityLabel = getEntityLabel(selectedEntity);

    const confirmed = await confirmDialog({
      title: `Hapus Permanen ${selectedIds.length} Data ${entityLabel}`,
      message: `PERINGATAN: Anda akan menghapus ${selectedIds.length} data ${entityLabel.toLowerCase()} secara permanen dari database. Tindakan ini TIDAK DAPAT DIBATALKAN. Apakah Anda yakin?`,
      confirmText: `Hapus Permanen (${selectedIds.length}) Data`,
      cancelText: 'Batalkan',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setIsBulkLoading(true);
      const res = await recycleBinService.bulkForceDelete(selectedEntity, selectedIds);
      toast.success(
        res.message || `${selectedIds.length} data telah dihapus secara permanen.`,
        'Hapus Masal Berhasil'
      );
      setSelectedIds([]);
      await Promise.all([loadSummary(), loadItems()]);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal menghapus data terpilih secara permanen.',
        'Gagal Hapus Masal'
      );
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Restore item handler
  const handleRestore = async (item: TrashItem) => {
    const itemName = item.name || item.title || item.code || `ID #${item.id}`;
    const entityLabel = getEntityLabel(selectedEntity);

    const confirmed = await confirmDialog({
      title: `Pulihkan ${entityLabel}`,
      message: `Apakah Anda yakin ingin memulihkan "${itemName}" kembali ke data aktif sistem? Data akan segera dapat digunakan kembali oleh operasional.`,
      confirmText: 'Ya, Pulihkan Data',
      cancelText: 'Batal',
      variant: 'primary',
    });

    if (!confirmed) return;

    try {
      setActionLoadingId(item.id);
      await recycleBinService.restoreItem(selectedEntity, item.id);
      toast.success(`Data "${itemName}" berhasil dipulihkan ke status aktif.`, 'Data Dipulihkan');
      await Promise.all([loadSummary(), loadItems()]);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal memulihkan data. Silakan coba kembali.',
        'Gagal Memulihkan'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Force delete item handler
  const handleForceDelete = async (item: TrashItem) => {
    const itemName = item.name || item.title || item.code || `ID #${item.id}`;
    const entityLabel = getEntityLabel(selectedEntity);

    const confirmed = await confirmDialog({
      title: `Hapus Permanen ${entityLabel}`,
      message: `PERINGATAN: Anda akan menghapus "${itemName}" secara permanen dari database. Tindakan ini TIDAK DAPAT DIBATALKAN dan seluruh riwayat terkait akan dibersihkan. Apakah Anda yakin?`,
      confirmText: 'Hapus Secara Permanen',
      cancelText: 'Batalkan',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setActionLoadingId(item.id);
      await recycleBinService.forceDeleteItem(selectedEntity, item.id);
      toast.success(`Data "${itemName}" telah dihapus secara permanen dari database.`, 'Hapus Permanen Berhasil');
      await Promise.all([loadSummary(), loadItems()]);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal menghapus data permanen.',
        'Gagal Hapus Permanen'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const getEntityLabel = (entity: RecycleBinEntity): string => {
    switch (entity) {
      case 'users': return 'Pengguna & Personel';
      case 'companies': return 'Perusahaan';
      case 'sites': return 'Site Tambang';
      case 'departments': return 'Departemen';
      case 'sections': return 'Seksi Lapangan';
      case 'positions': return 'Jabatan & Posisi';
      case 'employment-types': return 'Hubungan Kerja';
      case 'benefit-plafonds': return 'Plafon Benefit';
      case 'units': return 'Unit Organisasi (Legacy)';
      default: return 'Data';
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'users',
      label: 'Pengguna',
      icon: <Users className="h-4 w-4 shrink-0" />,
      count: summary.users || 0,
      badgeColor: (summary.users || 0) > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'companies',
      label: 'Perusahaan',
      icon: <Building2 className="h-4 w-4 shrink-0" />,
      count: summary.companies || 0,
      badgeColor: (summary.companies || 0) > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'sites',
      label: 'Site Tambang',
      icon: <MapPin className="h-4 w-4 shrink-0" />,
      count: summary.sites || 0,
      badgeColor: (summary.sites || 0) > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'departments',
      label: 'Departemen',
      icon: <FolderTree className="h-4 w-4 shrink-0" />,
      count: summary.departments || 0,
      badgeColor: (summary.departments || 0) > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'sections',
      label: 'Seksi',
      icon: <Split className="h-4 w-4 shrink-0" />,
      count: summary.sections || 0,
      badgeColor: (summary.sections || 0) > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'positions',
      label: 'Jabatan & Posisi',
      icon: <Briefcase className="h-4 w-4 shrink-0" />,
      count: summary.positions || 0,
      badgeColor: (summary.positions || 0) > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'employment-types',
      label: 'Hubungan Kerja',
      icon: <FileCheck className="h-4 w-4 shrink-0" />,
      count: summary['employment-types'] || 0,
      badgeColor: (summary['employment-types'] || 0) > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'benefit-plafonds',
      label: 'Plafon Benefit',
      icon: <Stethoscope className="h-4 w-4 shrink-0" />,
      count: summary['benefit-plafonds'] || 0,
      badgeColor: (summary['benefit-plafonds'] || 0) > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
  ];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const totalTrashedAll = Object.values(summary).reduce<number>((acc, curr) => (acc || 0) + (curr || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Tempat Sampah & Pemulihan Data"
        subtitle="Pusat pemulihan (restore) dan tata kelola data yang ter-soft delete pada aplikasi HCMS Enterprise."
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Konfigurasi' },
          { label: 'Tempat Sampah' },
        ]}
        icon={<Trash2 className="h-6 w-6 text-rose-600" />}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline-block">Total terhapus:</span>
            <Badge variant={totalTrashedAll > 0 ? 'warning' : 'outline'} className="font-semibold text-xs px-2.5 py-1">
              {totalTrashedAll} Entri Terhapus
            </Badge>
          </div>
        }
      />

      {/* Info Banner */}
      <div className="flex items-start gap-3.5 p-4 rounded-xl border border-amber-200/80 bg-amber-50/60 text-amber-900 text-sm dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-200">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">Kebijakan Retensi & Pemulihan Data</p>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
            Data yang berada di tempat sampah tidak lagi aktif dalam transaksi harian atau laporan operasional. 
            Anda dapat memulihkan entri kembali ke sistem kapan saja, atau menghapusnya secara permanen untuk mematuhi regulasi privasi data.
          </p>
        </div>
      </div>

      {/* Modern Navigation Tabs with Animated Sliding Underline */}
      <div className="border-b border-slate-200/90 bg-white rounded-t-xl px-3 pt-1 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <Tabs
          tabs={tabs}
          activeTab={selectedEntity}
          onChange={handleEntityChange}
          layoutId="recycle-bin-tabs"
          className="border-b-0"
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-slate-200/80 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={`Cari dalam ${getEntityLabel(selectedEntity).toLowerCase()}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-9 text-xs h-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => {
              loadSummary();
              loadItems();
            }}
            isLoading={loading}
          >
            Segarkan
          </Button>
        </div>
      </Card>

      {/* Selection / Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl shadow-xs dark:bg-blue-950/30 dark:border-blue-800/60 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5.5 px-2 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-2xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              data {getEntityLabel(selectedEntity).toLowerCase()} ditandai
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
              onClick={() => setSelectedIds([])}
            >
              Batal tandai
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-white text-blue-700 border-blue-300 hover:bg-blue-50 dark:bg-slate-800 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40"
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              disabled={isBulkLoading}
              isLoading={isBulkLoading}
              onClick={handleBulkRestore}
            >
              Pulihkan Terpilih ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="h-8 text-xs shadow-2xs"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              disabled={isBulkLoading}
              isLoading={isBulkLoading}
              onClick={handleBulkForceDelete}
            >
              Hapus Permanen Terpilih ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Trashed Data Table */}
      <Card className="p-0 overflow-hidden border-slate-200/80 shadow-xs dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="w-10 px-3 py-3.5 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer dark:border-slate-700 dark:bg-slate-800"
                    checked={isAllCurrentPageSelected}
                    ref={(el) => {
                      if (el) {
                        const hasSome = items.some((i) => selectedIds.includes(i.id));
                        el.indeterminate = hasSome && !isAllCurrentPageSelected;
                      }
                    }}
                    onChange={handleSelectAllCurrentPage}
                    aria-label="Pilih semua baris"
                  />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Kode / Identitas" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama / Judul" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 font-semibold">Asosiasi / Organisasi</th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Waktu Penghapusan" field="deleted_at" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center font-semibold">Status</th>
                <th className="px-5 py-3.5 pr-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="w-10 px-3 py-3.5 text-center"><Skeleton className="h-4 w-4 mx-auto" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-5 py-3.5 pr-4 text-right"><Skeleton className="h-7 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <Trash2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tempat Sampah Bersih
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                      {search
                        ? 'Tidak ada data terhapus yang cocok dengan pencarian Anda.'
                        : `Tidak ada data ${getEntityLabel(selectedEntity).toLowerCase()} yang sedang berada dalam status terhapus.`}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const isActionLoading = actionLoadingId === item.id;
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        isSelected
                          ? 'bg-blue-50/60 hover:bg-blue-50/80 dark:bg-blue-950/40 dark:hover:bg-blue-950/60'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer dark:border-slate-700 dark:bg-slate-800"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          aria-label={`Pilih ${item.name || item.code || item.id}`}
                        />
                      </td>

                      {/* Identitas / Kode */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          {item.code || item.username || (item.benefit_type ? `${item.benefit_type}` : `#${item.id}`)}
                        </span>
                      </td>

                      {/* Nama / Judul */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedEntity === 'benefit-plafonds'
                            ? (item.description || item.category_name || item.lens_type || item.benefit_type || '-')
                            : (item.name || item.title || '-')}
                        </div>
                        {item.email && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.email}</div>
                        )}
                        {item.short_title && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.short_title}</div>
                        )}
                        {selectedEntity === 'benefit-plafonds' && item.amount !== undefined && item.amount !== null && (
                          <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Nominal: {Number(item.amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                          </div>
                        )}
                      </td>

                      {/* Asosiasi / Organisasi */}
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                        {selectedEntity === 'users' && (
                          <div className="space-y-1">
                            {item.roles && item.roles.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.roles.map((r: any) => (
                                  <Badge key={r.id} variant="outline" className="text-[10px] py-0 px-1.5">
                                    {r.display_name || r.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                            <div className="text-slate-500 dark:text-slate-400">
                              {[item.company?.name, item.site?.name, item.department?.name].filter(Boolean).join(' • ') || '-'}
                            </div>
                          </div>
                        )}

                        {selectedEntity === 'companies' && (
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.legal_name || item.name}</span>
                            {item.country && <span className="text-slate-400 ml-1.5">({item.country})</span>}
                          </div>
                        )}

                        {selectedEntity === 'sites' && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Perusahaan: </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.company?.name || '-'}</span>
                          </div>
                        )}

                        {selectedEntity === 'departments' && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Perusahaan / Site: </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {[item.company?.name, item.site?.name].filter(Boolean).join(' • ') || '-'}
                            </span>
                            {item.leader?.name && (
                              <div className="text-slate-400 text-[11px] mt-0.5">Pimpinan: {item.leader.name}</div>
                            )}
                          </div>
                        )}

                        {selectedEntity === 'sections' && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Departemen: </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.department?.name || '-'}</span>
                            {item.leader?.name && (
                              <div className="text-slate-400 text-[11px] mt-0.5">Pimpinan: {item.leader.name}</div>
                            )}
                          </div>
                        )}

                        {selectedEntity === 'positions' && (
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{item.department?.name || '-'}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              {[item.job_level?.name, item.company?.name].filter(Boolean).join(' • ')}
                            </div>
                          </div>
                        )}

                        {selectedEntity === 'employment-types' && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Sifat Kerja: </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {item.is_permanent ? 'Tetap (PKWTT)' : 'Kontrak (PKWT)'}
                            </span>
                            {item.description && (
                              <div className="text-slate-400 text-[11px] mt-0.5 truncate max-w-xs">{item.description}</div>
                            )}
                          </div>
                        )}

                        {selectedEntity === 'benefit-plafonds' && (
                          <div className="space-y-0.5">
                            {(item.salary_grade || item.salaryGrade) && (
                              <div>
                                <span className="text-slate-500 dark:text-slate-400">Golongan: </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {(item.salary_grade || item.salaryGrade)?.code} - {(item.salary_grade || item.salaryGrade)?.name}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                {item.period_type || 'TAHUNAN'}
                              </Badge>
                              {item.marital_category && (
                                <span className="text-slate-500 dark:text-slate-400 text-[11px]">({item.marital_category})</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Waktu Penghapusan */}
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(item.deleted_at)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant="danger" className="text-[11px] font-semibold">
                          TERHAPUS
                        </Badge>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            title="Pulihkan Data"
                            disabled={isActionLoading}
                            isLoading={isActionLoading}
                            onClick={() => handleRestore(item)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30"
                            title="Hapus Permanen"
                            disabled={isActionLoading}
                            onClick={() => handleForceDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <TablePagination
          currentPage={pagination.current_page}
          totalPages={pagination.last_page}
          perPage={perPage}
          totalItems={pagination.total}
          itemLabel={`data ${getEntityLabel(selectedEntity).toLowerCase()}`}
          onPageChange={(p) => setPage(p)}
          onPerPageChange={(pp) => {
            setPerPage(pp);
            setPage(1);
          }}
        />
      </Card>
    </div>
  );
}

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
  Clock, 
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Shield
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
    units: 0,
    positions: 0,
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
    setSearch('');
    setPage(1);
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
      case 'units': return 'Departemen & Unit';
      case 'positions': return 'Jabatan & Posisi';
      default: return 'Data';
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'users',
      label: 'Pengguna & Personel',
      icon: <Users className="h-4 w-4 shrink-0" />,
      count: summary.users,
      badgeColor: summary.users > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'companies',
      label: 'Perusahaan',
      icon: <Building2 className="h-4 w-4 shrink-0" />,
      count: summary.companies,
      badgeColor: summary.companies > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'sites',
      label: 'Site Tambang',
      icon: <MapPin className="h-4 w-4 shrink-0" />,
      count: summary.sites,
      badgeColor: summary.sites > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'units',
      label: 'Departemen & Unit',
      icon: <Network className="h-4 w-4 shrink-0" />,
      count: summary.units,
      badgeColor: summary.units > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
    },
    {
      id: 'positions',
      label: 'Jabatan & Posisi',
      icon: <Briefcase className="h-4 w-4 shrink-0" />,
      count: summary.positions,
      badgeColor: summary.positions > 0 ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : undefined,
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

  const totalTrashedAll = Object.values(summary).reduce((acc, curr) => acc + curr, 0);

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
      <div className="flex items-start gap-3.5 p-4 rounded-xl border border-amber-200/80 bg-amber-50/60 text-amber-900 text-sm">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">Kebijakan Retensi & Pemulihan Data</p>
          <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
            Data yang berada di tempat sampah tidak lagi aktif dalam transaksi harian atau laporan operasional. 
            Anda dapat memulihkan entri kembali ke sistem kapan saja, atau menghapusnya secara permanen untuk mematuhi regulasi privasi data.
          </p>
        </div>
      </div>

      {/* Modern Navigation Tabs with Animated Sliding Underline */}
      <div className="border-b border-slate-200/90 bg-white rounded-t-xl px-3 pt-1 shadow-xs">
        <Tabs
          tabs={tabs}
          activeTab={selectedEntity}
          onChange={handleEntityChange}
          layoutId="recycle-bin-tabs"
          className="border-b-0"
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder={`Cari dalam ${getEntityLabel(selectedEntity).toLowerCase()}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
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

      {/* Trashed Data Table */}
      <Card className="overflow-hidden shadow-xs border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">
                  <SortableHeader label="Identitas / Kode" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-6 py-3.5">
                  <SortableHeader label="Nama / Judul" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-6 py-3.5">Asosiasi / Organisasi</th>
                <th className="px-6 py-3.5">
                  <SortableHeader label="Waktu Penghapusan" field="deleted_at" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-white">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-36 ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                      <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                    </div>
                    <p className="text-base font-semibold text-slate-800">
                      Tempat Sampah Bersih
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Tidak ada data {getEntityLabel(selectedEntity).toLowerCase()} yang sedang berada dalam status terhapus.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const isActionLoading = actionLoadingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Identitas / Kode */}
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">
                        {item.code || item.username || `#${item.id}`}
                      </td>

                      {/* Nama / Judul */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {item.name || item.title || '-'}
                        </div>
                        {item.email && (
                          <div className="text-xs text-slate-500 mt-0.5">{item.email}</div>
                        )}
                        {item.short_title && (
                          <div className="text-xs text-slate-500 mt-0.5">{item.short_title}</div>
                        )}
                      </td>

                      {/* Asosiasi / Organisasi */}
                      <td className="px-6 py-4 text-xs text-slate-600">
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
                            <div className="text-slate-500">
                              {[item.company?.name, item.site?.name, item.department?.name].filter(Boolean).join(' • ') || '-'}
                            </div>
                          </div>
                        )}

                        {selectedEntity === 'companies' && (
                          <div>
                            <span className="font-medium">{item.legal_name || item.name}</span>
                            {item.country && <span className="text-slate-400 ml-1.5">({item.country})</span>}
                          </div>
                        )}

                        {selectedEntity === 'sites' && (
                          <div>
                            <span className="text-slate-500">Perusahaan: </span>
                            <span className="font-medium">{item.company?.name || '-'}</span>
                          </div>
                        )}

                        {selectedEntity === 'units' && (
                          <div>
                            <Badge variant="outline" className="text-[10px] uppercase mr-1.5">
                              {item.unit_type || 'UNIT'}
                            </Badge>
                            <span className="text-slate-600">{item.site?.name || item.company?.name || '-'}</span>
                          </div>
                        )}

                        {selectedEntity === 'positions' && (
                          <div>
                            <span className="text-slate-500">Unit: </span>
                            <span className="font-medium">{item.organization_unit?.name || '-'}</span>
                          </div>
                        )}
                      </td>

                      {/* Waktu Penghapusan */}
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(item.deleted_at)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant="danger" className="text-[11px] font-semibold">
                          TERHAPUS
                        </Badge>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-xs h-8 px-2.5"
                            leftIcon={<RotateCcw className="h-3.5 w-3.5 text-blue-600" />}
                            disabled={isActionLoading}
                            isLoading={isActionLoading}
                            onClick={() => handleRestore(item)}
                          >
                            Pulihkan
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="text-xs h-8 px-2.5"
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                            disabled={isActionLoading}
                            onClick={() => handleForceDelete(item)}
                          >
                            Hapus Permanen
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

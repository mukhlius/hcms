'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  BookOpen, 
  GraduationCap, 
  Heart, 
  Droplet, 
  Landmark, 
  FileText,
  Trash2,
  Edit,
  Shirt,
  Ruler,
  Footprints,
  Clock,
  Sun,
  Moon,
  RotateCw,
  CalendarRange
} from 'lucide-react';
import { ReferenceItem, ShiftItem, WorkScheduleItem } from '@/types';
import { referenceDataService, scheduleMasterService } from '@/services/masterDataService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { useClientTable } from '@/hooks/useClientTable';
import { toast, confirmDialog } from '@/stores/alertStore';

const categories: TabItem[] = [
  { id: 'RELIGION', label: 'Agama', icon: <BookOpen className="h-4 w-4 shrink-0" /> },
  { id: 'EDUCATION', label: 'Pendidikan', icon: <GraduationCap className="h-4 w-4 shrink-0" /> },
  { id: 'MARITAL_STATUS', label: 'Status Nikah', icon: <Heart className="h-4 w-4 shrink-0" /> },
  { id: 'BLOOD_TYPE', label: 'Golongan Darah', icon: <Droplet className="h-4 w-4 shrink-0" /> },
  { id: 'UNIFORM_SIZE', label: 'Ukuran Seragam', icon: <Shirt className="h-4 w-4 shrink-0" /> },
  { id: 'PANTS_SIZE', label: 'Ukuran Celana', icon: <Ruler className="h-4 w-4 shrink-0" /> },
  { id: 'SHOE_SIZE', label: 'Ukuran Sepatu', icon: <Footprints className="h-4 w-4 shrink-0" /> },
  { id: 'SHIFTS', label: 'Pola Shift Kerja', icon: <Clock className="h-4 w-4 shrink-0" /> },
  { id: 'ROSTERS', label: 'Roster Tambang', icon: <CalendarRange className="h-4 w-4 shrink-0" /> },
  { id: 'BANK', label: 'Bank Payroll', icon: <Landmark className="h-4 w-4 shrink-0" /> },
  { id: 'DOCUMENTS', label: 'Jenis Dokumen', icon: <FileText className="h-4 w-4 shrink-0" /> },
];

function ReferencesContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'RELIGION';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialTab);
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [rosters, setRosters] = useState<WorkScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modals & Submitting state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [isEditShiftModalOpen, setIsEditShiftModalOpen] = useState<boolean>(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState<boolean>(false);
  const [isEditRosterModalOpen, setIsEditRosterModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Standard Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'PERSONAL',
    required: false,
    expiry_required: false,
    status: 'ACTIVE',
  });

  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    category: 'PERSONAL',
    required: false,
    expiry_required: false,
    status: 'ACTIVE',
  });

  // Shift Form states
  const [shiftForm, setShiftForm] = useState({
    code: '',
    name: '',
    start_time: '06:00',
    end_time: '18:00',
    break_start: '12:00',
    break_end: '13:00',
    cross_day: false,
    grace_period_minutes: 15,
    status: 'ACTIVE' as const,
  });

  const [editShiftForm, setEditShiftForm] = useState({
    id: 0,
    code: '',
    name: '',
    start_time: '06:00',
    end_time: '18:00',
    break_start: '12:00',
    break_end: '13:00',
    cross_day: false,
    grace_period_minutes: 15,
    status: 'ACTIVE' as const,
  });

  // Roster Form states
  const [rosterForm, setRosterForm] = useState({
    code: '',
    name: '',
    pattern_type: 'ROSTER' as const,
    cycle_days: 21,
    days_on: 14,
    days_off: 7,
    status: 'ACTIVE' as const,
  });

  const [editRosterForm, setEditRosterForm] = useState({
    id: 0,
    code: '',
    name: '',
    pattern_type: 'ROSTER' as const,
    cycle_days: 21,
    days_on: 14,
    days_off: 7,
    status: 'ACTIVE' as const,
  });

  // Sync tab with URL if changed
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && categories.some(c => c.id === tabParam)) {
      setSelectedCategory(tabParam);
    }
  }, [searchParams]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (selectedCategory === 'DOCUMENTS') {
        const res = await referenceDataService.getDocumentTypes();
        const dataList = res.success && Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        setItems(dataList);
      } else if (selectedCategory === 'SHIFTS') {
        const res = await scheduleMasterService.getShifts();
        if (res.success && res.data) {
          setShifts(res.data);
        }
      } else if (selectedCategory === 'ROSTERS') {
        const res = await scheduleMasterService.getWorkSchedules();
        if (res.success && res.data) {
          setRosters(res.data);
        }
      } else {
        const res = await referenceDataService.getStandard(selectedCategory);
        const dataList = res.success && Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        setItems(dataList);
      }
    } catch (err) {
      console.error('Failed to load reference data:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Standard Create handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (selectedCategory === 'DOCUMENTS') {
        await referenceDataService.createDocumentType({
          code: formData.code,
          name: formData.name,
          category: formData.category,
          required: formData.required,
          expiry_required: formData.expiry_required,
          status: formData.status,
        });
      } else {
        await referenceDataService.createStandard({
          category: selectedCategory,
          code: formData.code,
          name: formData.name,
          status: formData.status,
        });
      }
      setIsModalOpen(false);
      setFormData({
        code: '',
        name: '',
        category: 'PERSONAL',
        required: false,
        expiry_required: false,
        status: 'ACTIVE',
      });
      toast.success(
        selectedCategory === 'DOCUMENTS'
          ? `Jenis dokumen "${formData.name}" berhasil ditambahkan.`
          : `Data referensi "${formData.name}" berhasil ditambahkan.`,
        'Berhasil Menambahkan'
      );
      await loadData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal membuat referensi.',
        'Gagal Menyimpan'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Standard Edit handler
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEditFormData({
      code: item.code || '',
      name: item.name || '',
      category: item.category || 'PERSONAL',
      required: Boolean(item.required),
      expiry_required: Boolean(item.expiry_required),
      status: item.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSubmitting(true);
      if (selectedCategory === 'DOCUMENTS') {
        await referenceDataService.updateDocumentType(editingItem.id, {
          code: editFormData.code,
          name: editFormData.name,
          category: editFormData.category,
          required: editFormData.required,
          expiry_required: editFormData.expiry_required,
          status: editFormData.status,
        });
      } else {
        await referenceDataService.updateStandard(editingItem.id, {
          code: editFormData.code,
          name: editFormData.name,
          status: editFormData.status,
        });
      }
      setIsEditModalOpen(false);
      setEditingItem(null);
      toast.success(
        selectedCategory === 'DOCUMENTS'
          ? `Jenis dokumen "${editFormData.name}" berhasil diperbarui.`
          : `Data referensi "${editFormData.name}" berhasil diperbarui.`,
        'Berhasil Diperbarui'
      );
      await loadData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal memperbarui data referensi.',
        'Gagal Memperbarui'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: any) => {
    const isDoc = selectedCategory === 'DOCUMENTS';
    const label = isDoc ? 'jenis dokumen' : 'referensi';

    const confirmed = await confirmDialog({
      title: `Hapus ${isDoc ? 'Jenis Dokumen' : 'Data Referensi'}`,
      message: `Apakah Anda yakin ingin menghapus ${label} "${item.name}" (${item.code})? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Data',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      if (isDoc) {
        await referenceDataService.deleteDocumentType(item.id);
      } else {
        await referenceDataService.deleteStandard(item.id);
      }
      toast.success(
        `${label.charAt(0).toUpperCase() + label.slice(1)} "${item.name}" berhasil dihapus.`,
        'Berhasil Dihapus'
      );
      await loadData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || `Gagal menghapus ${label}.`,
        'Gagal Menghapus'
      );
    }
  };

  // Shift Handlers
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await scheduleMasterService.createShift(shiftForm);
      setIsShiftModalOpen(false);
      setShiftForm({
        code: '',
        name: '',
        start_time: '06:00',
        end_time: '18:00',
        break_start: '12:00',
        break_end: '13:00',
        cross_day: false,
        grace_period_minutes: 15,
        status: 'ACTIVE',
      });
      toast.success(`Master shift "${shiftForm.name}" berhasil dibuat.`, 'Berhasil Menambahkan');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat master shift.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditShift = (shift: ShiftItem) => {
    setEditShiftForm({
      id: shift.id,
      code: shift.code,
      name: shift.name,
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      break_start: shift.break_start ? shift.break_start.slice(0, 5) : '',
      break_end: shift.break_end ? shift.break_end.slice(0, 5) : '',
      cross_day: Boolean(shift.cross_day),
      grace_period_minutes: shift.grace_period_minutes || 0,
      status: (shift.status as any) || 'ACTIVE',
    });
    setIsEditShiftModalOpen(true);
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await scheduleMasterService.updateShift(editShiftForm.id, editShiftForm);
      setIsEditShiftModalOpen(false);
      toast.success(`Master shift "${editShiftForm.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui shift.', 'Gagal Memperbarui');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShift = async (shift: ShiftItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Master Shift',
      message: `Apakah Anda yakin ingin menghapus master shift "${shift.name}" (${shift.code})? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Shift',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await scheduleMasterService.deleteShift(shift.id);
      toast.success(`Shift kerja "${shift.name}" berhasil dihapus.`, 'Berhasil Dihapus');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus shift kerja.', 'Gagal Menghapus');
    }
  };

  // Roster Handlers
  const handleCreateRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await scheduleMasterService.createWorkSchedule({
        ...rosterForm,
        type: rosterForm.pattern_type,
      } as any);
      setIsRosterModalOpen(false);
      setRosterForm({
        code: '',
        name: '',
        pattern_type: 'ROSTER',
        cycle_days: 21,
        days_on: 14,
        days_off: 7,
        status: 'ACTIVE',
      });
      toast.success(`Pola roster "${rosterForm.name}" berhasil dibuat.`, 'Berhasil Menambahkan');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat pola roster.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditRoster = (roster: WorkScheduleItem) => {
    setEditRosterForm({
      id: roster.id,
      code: roster.code,
      name: roster.name,
      pattern_type: (roster.pattern_type as any) || 'ROSTER',
      cycle_days: roster.cycle_days,
      days_on: roster.days_on,
      days_off: roster.days_off,
      status: (roster.status as any) || 'ACTIVE',
    });
    setIsEditRosterModalOpen(true);
  };

  const handleUpdateRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await scheduleMasterService.updateWorkSchedule(editRosterForm.id, {
        code: editRosterForm.code,
        name: editRosterForm.name,
        type: editRosterForm.pattern_type,
        cycle_days: Number(editRosterForm.cycle_days),
        days_on: Number(editRosterForm.days_on),
        days_off: Number(editRosterForm.days_off),
        status: editRosterForm.status,
      } as any);
      setIsEditRosterModalOpen(false);
      toast.success(`Pola roster "${editRosterForm.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui roster.', 'Gagal Memperbarui');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoster = async (roster: WorkScheduleItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Pola Roster',
      message: `Apakah Anda yakin ingin menghapus pola roster "${roster.name}" (${roster.code})? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Roster',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await scheduleMasterService.deleteWorkSchedule(roster.id);
      toast.success(`Pola roster "${roster.name}" berhasil dihapus.`, 'Berhasil Dihapus');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pola roster.', 'Gagal Menghapus');
    }
  };

  const activeCategoryLabel = categories.find(c => c.id === selectedCategory)?.label || 'Referensi';

  // Filtered lists
  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = safeItems.filter(it => 
    !search || 
    it.code?.toLowerCase().includes(search.toLowerCase()) || 
    it.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredShifts = shifts.filter(s =>
    !search ||
    s.code?.toLowerCase().includes(search.toLowerCase()) ||
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRosters = rosters.filter(r =>
    !search ||
    r.code?.toLowerCase().includes(search.toLowerCase()) ||
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  const {
    sortField: shiftSortField,
    sortOrder: shiftSortOrder,
    handleSort: handleShiftSort,
    currentPage: shiftPage,
    setCurrentPage: setShiftPage,
    perPage: shiftPerPage,
    handlePerPageChange: handleShiftPerPageChange,
    totalPages: shiftTotalPages,
    totalItems: shiftTotalItems,
    paginatedData: paginatedShifts,
  } = useClientTable(filteredShifts, { defaultSortField: 'code', defaultPerPage: 10 });

  const {
    sortField: rosterSortField,
    sortOrder: rosterSortOrder,
    handleSort: handleRosterSort,
    currentPage: rosterPage,
    setCurrentPage: setRosterPage,
    perPage: rosterPerPage,
    handlePerPageChange: handleRosterPerPageChange,
    totalPages: rosterTotalPages,
    totalItems: rosterTotalItems,
    paginatedData: paginatedRosters,
  } = useClientTable(filteredRosters, { defaultSortField: 'code', defaultPerPage: 10 });

  const {
    sortField: itemSortField,
    sortOrder: itemSortOrder,
    handleSort: handleItemSort,
    currentPage: itemPage,
    setCurrentPage: setItemPage,
    perPage: itemPerPage,
    handlePerPageChange: handleItemPerPageChange,
    totalPages: itemTotalPages,
    totalItems: itemTotalItems,
    paginatedData: paginatedItems,
  } = useClientTable(filteredItems, { defaultSortField: 'code', defaultPerPage: 10 });

  const handleOpenAdd = () => {
    if (selectedCategory === 'SHIFTS') {
      setIsShiftModalOpen(true);
    } else if (selectedCategory === 'ROSTERS') {
      setIsRosterModalOpen(true);
    } else {
      setFormData({
        code: '',
        name: '',
        category: 'PERSONAL',
        required: false,
        expiry_required: false,
        status: 'ACTIVE',
      });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Referensi Standar"
        subtitle="Authoritative source untuk data agama, pendidikan, status keluarga, ukuran APD, pola shift & roster kerja tambang, bank payroll, dan jenis dokumen kependudukan."
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Data Master HCMS', href: '/admin/master-data' },
          { label: 'Referensi Standar' },
        ]}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleOpenAdd}
          >
            {selectedCategory === 'DOCUMENTS' && 'Tambah Jenis Dokumen'}
            {selectedCategory === 'SHIFTS' && 'Tambah Master Shift'}
            {selectedCategory === 'ROSTERS' && 'Tambah Pola Roster'}
            {!['DOCUMENTS', 'SHIFTS', 'ROSTERS'].includes(selectedCategory) && `Tambah Entri ${activeCategoryLabel}`}
          </Button>
        }
      />

      {/* 2. Tab Menu: Modern Navigation Tabs with Animated Sliding Underline */}
      <div className="border border-slate-200/90 bg-white rounded-xl px-2 pt-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Tabs
          tabs={categories}
          activeTab={selectedCategory}
          onChange={setSelectedCategory}
          layoutId="references-page-tabs"
          className="border-b-0"
        />
      </div>

      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder={`Cari dalam ${activeCategoryLabel.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />} 
          onClick={loadData} 
          isLoading={loading}
        >
          Segarkan
        </Button>
      </Card>

      {/* VIEW 1: SHIFTS */}
      {selectedCategory === 'SHIFTS' && (
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Tidak ada data shift kerja ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">
                      <SortableHeader field="code" currentField={shiftSortField} currentOrder={shiftSortOrder} onSort={handleShiftSort}>
                        Kode
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5">
                      <SortableHeader field="name" currentField={shiftSortField} currentOrder={shiftSortOrder} onSort={handleShiftSort}>
                        Nama Shift
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5">
                      <SortableHeader field="start_time" currentField={shiftSortField} currentOrder={shiftSortOrder} onSort={handleShiftSort}>
                        Jam Kerja (Mulai - Selesai)
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5">Waktu Istirahat</th>
                    <th className="px-4 py-3.5 text-center">
                      <SortableHeader field="cross_day" currentField={shiftSortField} currentOrder={shiftSortOrder} onSort={handleShiftSort} align="center">
                        Lintas Malam
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5 text-center">
                      <SortableHeader field="grace_period_minutes" currentField={shiftSortField} currentOrder={shiftSortOrder} onSort={handleShiftSort} align="center">
                        Toleransi
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5 text-center">
                      <SortableHeader field="status" currentField={shiftSortField} currentOrder={shiftSortOrder} onSort={handleShiftSort} align="center">
                        Status
                      </SortableHeader>
                    </th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedShifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{s.code}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          {s.cross_day ? <Moon className="h-4 w-4 text-indigo-600 shrink-0" /> : <Sun className="h-4 w-4 text-amber-500 shrink-0" />}
                          {s.name}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-blue-700">
                        {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono">
                        {s.break_start ? `${s.break_start.slice(0, 5)} - ${s.break_end?.slice(0, 5)}` : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {s.cross_day ? (
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                            Ya (Cross-Day)
                          </Badge>
                        ) : (
                          <span className="text-slate-400">Tidak</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {s.grace_period_minutes} Menit
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditShift(s)}
                            title="Edit Shift"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteShift(s)}
                            title="Hapus Shift"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                currentPage={shiftPage}
                totalPages={shiftTotalPages}
                perPage={shiftPerPage}
                totalItems={shiftTotalItems}
                itemLabel="shift"
                onPageChange={setShiftPage}
                onPerPageChange={handleShiftPerPageChange}
              />
            </div>
          )}
        </Card>
      )}

      {/* VIEW 2: ROSTERS */}
      {selectedCategory === 'ROSTERS' && (
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredRosters.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Tidak ada pola siklus roster ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">
                      <SortableHeader field="code" currentField={rosterSortField} currentOrder={rosterSortOrder} onSort={handleRosterSort}>
                        Kode
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5">
                      <SortableHeader field="name" currentField={rosterSortField} currentOrder={rosterSortOrder} onSort={handleRosterSort}>
                        Pola Siklus Roster
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5">
                      <SortableHeader field="pattern_type" currentField={rosterSortField} currentOrder={rosterSortOrder} onSort={handleRosterSort}>
                        Tipe Pola
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5 text-center">
                      <SortableHeader field="days_on" currentField={rosterSortField} currentOrder={rosterSortOrder} onSort={handleRosterSort} align="center">
                        Hari Kerja (ON)
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5 text-center">
                      <SortableHeader field="days_off" currentField={rosterSortField} currentOrder={rosterSortOrder} onSort={handleRosterSort} align="center">
                        Hari Libur (OFF)
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5 text-center">
                      <SortableHeader field="cycle_days" currentField={rosterSortField} currentOrder={rosterSortOrder} onSort={handleRosterSort} align="center">
                        Total Siklus
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5 text-center">
                      <SortableHeader field="status" currentField={rosterSortField} currentOrder={rosterSortOrder} onSort={handleRosterSort} align="center">
                        Status
                      </SortableHeader>
                    </th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRosters.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{r.code}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <RotateCw className="h-4 w-4 text-emerald-600 shrink-0" />
                          {r.name}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <Badge variant="outline">{r.pattern_type || 'ROSTER'}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-600">
                        {r.days_on} Hari
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-amber-600">
                        {r.days_off} Hari
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-blue-700">
                        {r.cycle_days} Hari
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={r.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditRoster(r)}
                            title="Edit Roster"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoster(r)}
                            title="Hapus Roster"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                currentPage={rosterPage}
                totalPages={rosterTotalPages}
                perPage={rosterPerPage}
                totalItems={rosterTotalItems}
                itemLabel="pola roster"
                onPageChange={setRosterPage}
                onPerPageChange={handleRosterPerPageChange}
              />
            </div>
          )}
        </Card>
      )}

      {/* VIEW 3: STANDARD REFERENCES & DOCUMENTS */}
      {!['SHIFTS', 'ROSTERS'].includes(selectedCategory) && (
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Tidak ada data {activeCategoryLabel.toLowerCase()} yang sesuai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">
                      <SortableHeader field="code" currentField={itemSortField} currentOrder={itemSortOrder} onSort={handleItemSort}>
                        Kode
                      </SortableHeader>
                    </th>
                    <th className="px-4 py-3.5">
                      <SortableHeader field="name" currentField={itemSortField} currentOrder={itemSortOrder} onSort={handleItemSort}>
                        Nama Referensi
                      </SortableHeader>
                    </th>
                    {selectedCategory === 'DOCUMENTS' && (
                      <>
                        <th className="px-4 py-3.5">
                          <SortableHeader field="category" currentField={itemSortField} currentOrder={itemSortOrder} onSort={handleItemSort}>
                            Kategori
                          </SortableHeader>
                        </th>
                        <th className="px-4 py-3.5 text-center">
                          <SortableHeader field="required" currentField={itemSortField} currentOrder={itemSortOrder} onSort={handleItemSort} align="center">
                            Wajib
                          </SortableHeader>
                        </th>
                        <th className="px-4 py-3.5 text-center">
                          <SortableHeader field="expiry_required" currentField={itemSortField} currentOrder={itemSortOrder} onSort={handleItemSort} align="center">
                            Expired Req.
                          </SortableHeader>
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3.5 text-center">
                      <SortableHeader field="status" currentField={itemSortField} currentOrder={itemSortOrder} onSort={handleItemSort} align="center">
                        Status
                      </SortableHeader>
                    </th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{item.code}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{item.name}</td>
                      {selectedCategory === 'DOCUMENTS' && (
                        <>
                          <td className="px-4 py-3.5">
                            <Badge variant="outline">{(item as any).category || 'PERSONAL'}</Badge>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {(item as any).required ? (
                              <Badge variant="danger" className="text-[10px]">Wajib</Badge>
                            ) : (
                              <span className="text-slate-400">Opsional</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {(item as any).expiry_required ? (
                              <Badge variant="warning" className="text-[10px]">Ya</Badge>
                            ) : (
                              <span className="text-slate-400">Tidak</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Data"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            title="Hapus Data"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                currentPage={itemPage}
                totalPages={itemTotalPages}
                perPage={itemPerPage}
                totalItems={itemTotalItems}
                itemLabel={activeCategoryLabel.toLowerCase()}
                onPageChange={setItemPage}
                onPerPageChange={handleItemPerPageChange}
              />
            </div>
          )}
        </Card>
      )}

      {/* MODAL: Tambah Referensi Standar / Dokumen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory === 'DOCUMENTS' ? 'Tambah Jenis Dokumen Baru' : `Tambah Entri ${activeCategoryLabel}`}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Kode Unik"
            placeholder="Contoh: S, 32, 42, REL-01"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label="Nama Deskriptif Referensi"
            placeholder="Contoh: Ukuran M (Medium), Ukuran 32, dll"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          {selectedCategory === 'DOCUMENTS' && (
            <>
              <Select
                label="Kategori Dokumen"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="PERSONAL">Personal / Kependudukan</option>
                <option value="LEGAL">Legalitas & Ketenagakerjaan</option>
                <option value="CERTIFICATION">Sertifikasi & Lisensi Tambang</option>
                <option value="MEDICAL">Medis & Kesehatan Kerja</option>
              </Select>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Dokumen Wajib (Mandatory untuk Personel)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.expiry_required}
                    onChange={(e) => setFormData({ ...formData, expiry_required: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Memiliki Tanggal Kedaluwarsa / Masa Berlaku</span>
                </label>
              </div>
            </>
          )}

          <Select
            label="Status Referensi"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="ACTIVE">Aktif (ACTIVE)</option>
            <option value="INACTIVE">Non-Aktif (INACTIVE)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              Simpan Referensi
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Referensi Standar / Dokumen */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        title={`Edit Data: ${editingItem?.name || activeCategoryLabel}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Kode Unik"
            value={editFormData.code}
            onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
            required
          />
          <Input
            label="Nama Deskriptif Referensi"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          {selectedCategory === 'DOCUMENTS' && (
            <>
              <Select
                label="Kategori Dokumen"
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              >
                <option value="PERSONAL">Personal / Kependudukan</option>
                <option value="LEGAL">Legalitas & Ketenagakerjaan</option>
                <option value="CERTIFICATION">Sertifikasi & Lisensi Tambang</option>
                <option value="MEDICAL">Medis & Kesehatan Kerja</option>
              </Select>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.required}
                    onChange={(e) => setEditFormData({ ...editFormData, required: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Dokumen Wajib (Mandatory)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.expiry_required}
                    onChange={(e) => setEditFormData({ ...editFormData, expiry_required: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Memiliki Masa Berlaku</span>
                </label>
              </div>
            </>
          )}

          <Select
            label="Status Referensi"
            value={editFormData.status}
            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
          >
            <option value="ACTIVE">Aktif (ACTIVE)</option>
            <option value="INACTIVE">Non-Aktif (INACTIVE)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              Perbarui Data
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Tambah Master Shift */}
      <Modal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        title="Tambah Master Shift Kerja Baru"
        description="Konfigurasi parameter jam kerja operasional lapangan dan toleransi absensi"
      >
        <form onSubmit={handleCreateShift} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Shift"
              placeholder="Contoh: DS-12"
              value={shiftForm.code}
              onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
              required
            />
            <Input
              label="Nama Shift"
              placeholder="Contoh: Day Shift 12 Jam"
              value={shiftForm.name}
              onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jam Mulai"
              type="time"
              value={shiftForm.start_time}
              onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
              required
            />
            <Input
              label="Jam Selesai"
              type="time"
              value={shiftForm.end_time}
              onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Istirahat Mulai (Opsional)"
              type="time"
              value={shiftForm.break_start}
              onChange={(e) => setShiftForm({ ...shiftForm, break_start: e.target.value })}
            />
            <Input
              label="Istirahat Selesai (Opsional)"
              type="time"
              value={shiftForm.break_end}
              onChange={(e) => setShiftForm({ ...shiftForm, break_end: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Toleransi Terlambat (Menit)"
              type="number"
              value={shiftForm.grace_period_minutes}
              onChange={(e) => setShiftForm({ ...shiftForm, grace_period_minutes: parseInt(e.target.value) || 0 })}
            />
            <div className="flex flex-col justify-end pb-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shiftForm.cross_day}
                  onChange={(e) => setShiftForm({ ...shiftForm, cross_day: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Lintas Tengah Malam (Cross-Day)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsShiftModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              Simpan Master Shift
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Master Shift */}
      <Modal
        isOpen={isEditShiftModalOpen}
        onClose={() => setIsEditShiftModalOpen(false)}
        title={`Edit Shift: ${editShiftForm.name}`}
      >
        <form onSubmit={handleUpdateShift} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Shift"
              value={editShiftForm.code}
              onChange={(e) => setEditShiftForm({ ...editShiftForm, code: e.target.value })}
              required
            />
            <Input
              label="Nama Shift"
              value={editShiftForm.name}
              onChange={(e) => setEditShiftForm({ ...editShiftForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jam Mulai"
              type="time"
              value={editShiftForm.start_time}
              onChange={(e) => setEditShiftForm({ ...editShiftForm, start_time: e.target.value })}
              required
            />
            <Input
              label="Jam Selesai"
              type="time"
              value={editShiftForm.end_time}
              onChange={(e) => setEditShiftForm({ ...editShiftForm, end_time: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Istirahat Mulai"
              type="time"
              value={editShiftForm.break_start}
              onChange={(e) => setEditShiftForm({ ...editShiftForm, break_start: e.target.value })}
            />
            <Input
              label="Istirahat Selesai"
              type="time"
              value={editShiftForm.break_end}
              onChange={(e) => setEditShiftForm({ ...editShiftForm, break_end: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Toleransi Terlambat (Menit)"
              type="number"
              value={editShiftForm.grace_period_minutes}
              onChange={(e) => setEditShiftForm({ ...editShiftForm, grace_period_minutes: parseInt(e.target.value) || 0 })}
            />
            <div className="flex flex-col justify-end pb-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editShiftForm.cross_day}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, cross_day: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Lintas Tengah Malam (Cross-Day)</span>
              </label>
            </div>
          </div>

          <Select
            label="Status"
            value={editShiftForm.status}
            onChange={(e) => setEditShiftForm({ ...editShiftForm, status: e.target.value as any })}
          >
            <option value="ACTIVE">Aktif (ACTIVE)</option>
            <option value="INACTIVE">Non-Aktif (INACTIVE)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditShiftModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              Perbarui Shift
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Tambah Pola Roster */}
      <Modal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        title="Tambah Pola Roster Tambang Baru"
        description="Definisikan siklus hari kerja (ON) dan hari istirahat/libur (OFF)"
      >
        <form onSubmit={handleCreateRoster} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Roster"
              placeholder="Contoh: R-14-7"
              value={rosterForm.code}
              onChange={(e) => setRosterForm({ ...rosterForm, code: e.target.value })}
              required
            />
            <Input
              label="Nama Pola Roster"
              placeholder="Contoh: Roster Tambang 14 ON / 7 OFF"
              value={rosterForm.name}
              onChange={(e) => setRosterForm({ ...rosterForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Hari Kerja (ON)"
              type="number"
              min="1"
              value={rosterForm.days_on}
              onChange={(e) => {
                const on = parseInt(e.target.value) || 0;
                setRosterForm({ ...rosterForm, days_on: on, cycle_days: on + rosterForm.days_off });
              }}
              required
            />
            <Input
              label="Hari Libur (OFF)"
              type="number"
              min="0"
              value={rosterForm.days_off}
              onChange={(e) => {
                const off = parseInt(e.target.value) || 0;
                setRosterForm({ ...rosterForm, days_off: off, cycle_days: rosterForm.days_on + off });
              }}
              required
            />
            <Input
              label="Total Siklus (Hari)"
              type="number"
              value={rosterForm.cycle_days}
              readOnly
              className="bg-slate-50 font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsRosterModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              Simpan Pola Roster
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Pola Roster */}
      <Modal
        isOpen={isEditRosterModalOpen}
        onClose={() => setIsEditRosterModalOpen(false)}
        title={`Edit Roster: ${editRosterForm.name}`}
      >
        <form onSubmit={handleUpdateRoster} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Roster"
              value={editRosterForm.code}
              onChange={(e) => setEditRosterForm({ ...editRosterForm, code: e.target.value })}
              required
            />
            <Input
              label="Nama Pola Roster"
              value={editRosterForm.name}
              onChange={(e) => setEditRosterForm({ ...editRosterForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Hari Kerja (ON)"
              type="number"
              min="1"
              value={editRosterForm.days_on}
              onChange={(e) => {
                const on = parseInt(e.target.value) || 0;
                setEditRosterForm({ ...editRosterForm, days_on: on, cycle_days: on + editRosterForm.days_off });
              }}
              required
            />
            <Input
              label="Hari Libur (OFF)"
              type="number"
              min="0"
              value={editRosterForm.days_off}
              onChange={(e) => {
                const off = parseInt(e.target.value) || 0;
                setEditRosterForm({ ...editRosterForm, days_off: off, cycle_days: editRosterForm.days_on + off });
              }}
              required
            />
            <Input
              label="Total Siklus (Hari)"
              type="number"
              value={editRosterForm.cycle_days}
              readOnly
              className="bg-slate-50 font-bold"
            />
          </div>

          <Select
            label="Status"
            value={editRosterForm.status}
            onChange={(e) => setEditRosterForm({ ...editRosterForm, status: e.target.value as any })}
          >
            <option value="ACTIVE">Aktif (ACTIVE)</option>
            <option value="INACTIVE">Non-Aktif (INACTIVE)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditRosterModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              Perbarui Pola Roster
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function ReferencesPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <ReferencesContent />
    </Suspense>
  );
}

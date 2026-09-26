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
} from 'lucide-react';
import { ReferenceItem } from '@/types';
import { referenceDataService } from '@/services/masterDataService';
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
import { StatusMenikahTab } from '@/components/organization/tabs/StatusMenikahTab';

const categories: TabItem[] = [
  { id: 'RELIGION', label: 'Agama', icon: <BookOpen className="h-4 w-4 shrink-0" /> },
  { id: 'EDUCATION', label: 'Pendidikan', icon: <GraduationCap className="h-4 w-4 shrink-0" /> },
  { id: 'MARITAL_STATUS', label: 'Status Menikah', icon: <Heart className="h-4 w-4 shrink-0" /> },
  { id: 'BLOOD_TYPE', label: 'Golongan Darah', icon: <Droplet className="h-4 w-4 shrink-0" /> },
  { id: 'UNIFORM_SIZE', label: 'Ukuran Seragam', icon: <Shirt className="h-4 w-4 shrink-0" /> },
  { id: 'PANTS_SIZE', label: 'Ukuran Celana', icon: <Ruler className="h-4 w-4 shrink-0" /> },
  { id: 'SHOE_SIZE', label: 'Ukuran Sepatu', icon: <Footprints className="h-4 w-4 shrink-0" /> },
  { id: 'BANK', label: 'Bank Payroll', icon: <Landmark className="h-4 w-4 shrink-0" /> },
  { id: 'DOCUMENTS', label: 'Jenis Dokumen', icon: <FileText className="h-4 w-4 shrink-0" /> },
];

function ReferencesContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'RELIGION';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialTab);
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [maritalCreateTrigger, setMaritalCreateTrigger] = useState<number>(0);

  // Modals & Submitting state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
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

  const activeCategoryLabel = categories.find(c => c.id === selectedCategory)?.label || 'Referensi';

  // Filtered lists
  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = safeItems.filter(it => 
    !search || 
    it.code?.toLowerCase().includes(search.toLowerCase()) || 
    it.name?.toLowerCase().includes(search.toLowerCase())
  );

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
    setFormData({
      code: '',
      name: '',
      category: 'PERSONAL',
      required: false,
      expiry_required: false,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Referensi Standar"
        subtitle="Authoritative source untuk data agama, pendidikan, status keluarga, ukuran APD, bank payroll, dan jenis dokumen kependudukan."
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Data Master HCMS', href: '/admin/master-data' },
          { label: 'Referensi Standar' },
        ]}
        actions={
          selectedCategory === 'MARITAL_STATUS' ? (
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setMaritalCreateTrigger((prev) => prev + 1)}
            >
              Tambah Status Menikah
            </Button>
          ) : (
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenAdd}
            >
              {selectedCategory === 'DOCUMENTS' ? 'Tambah Jenis Dokumen' : `Tambah Entri ${activeCategoryLabel}`}
            </Button>
          )
        }
      />

      {/* 2. Tab Menu: Modern Navigation Tabs with Animated Sliding Underline */}
      <div className="border border-slate-200/90 bg-white rounded-xl p-1.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Tabs
          tabs={categories}
          activeTab={selectedCategory}
          onChange={setSelectedCategory}
          layoutId="references-page-tabs"
          className="border-b-0"
        />
      </div>

      {/* Action Toolbar */}
      {selectedCategory !== 'MARITAL_STATUS' && (
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
      )}

      {/* VIEW 1: STATUS MENIKAH (MARITAL STATUS) */}
      {selectedCategory === 'MARITAL_STATUS' && (
        <StatusMenikahTab onRefreshAll={loadData} createTrigger={maritalCreateTrigger} />
      )}

      {/* VIEW 2: STANDARD REFERENCES & DOCUMENTS */}
      {selectedCategory !== 'MARITAL_STATUS' && (
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

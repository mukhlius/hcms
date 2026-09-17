'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Settings2, 
  FolderPlus,
  CheckCircle2
} from 'lucide-react';
import { customMasterService } from '@/services/masterDataService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast, confirmDialog } from '@/stores/alertStore';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { useClientTable } from '@/hooks/useClientTable';

export default function CustomMasterPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isValueModalOpen, setIsValueModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Forms
  const [catForm, setCatForm] = useState({ code: '', name: '', description: '' });
  const [valForm, setValForm] = useState({ code: '', name: '', order: 0 });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customMasterService.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
        if (res.data.length > 0 && !selectedCategory) {
          const detailRes = await customMasterService.getCategory(res.data[0].id);
          if (detailRes.success) setSelectedCategory(detailRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load custom master categories:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSelectCategory = async (cat: any) => {
    try {
      const res = await customMasterService.getCategory(cat.id);
      if (res.success && res.data) {
        setSelectedCategory(res.data);
      }
    } catch (err) {
      console.error('Failed to load category detail:', err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await customMasterService.createCategory(catForm);
      setIsCategoryModalOpen(false);
      setCatForm({ code: '', name: '', description: '' });
      toast.success(`Kategori master "${catForm.name}" berhasil dibuat.`, 'Berhasil Disimpan');
      await loadCategories();
      if (res.success && res.data) {
        handleSelectCategory(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat kategori kustom.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    try {
      setSubmitting(true);
      await customMasterService.createValue(selectedCategory.id, valForm);
      setIsValueModalOpen(false);
      setValForm({ code: '', name: '', order: 0 });
      toast.success(`Nilai "${valForm.name}" berhasil ditambahkan ke kategori ${selectedCategory.name}.`, 'Berhasil Ditambahkan');
      handleSelectCategory(selectedCategory);
      await loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan nilai kustom.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteValue = async (valueId: number) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Nilai Master Kustom',
      message: 'Apakah Anda yakin ingin menghapus nilai master kustom ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus Nilai',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await customMasterService.deleteValue(valueId);
      toast.success('Nilai master kustom berhasil dihapus.', 'Berhasil Dihapus');
      if (selectedCategory) {
        handleSelectCategory(selectedCategory);
      }
      await loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus nilai kustom.', 'Gagal Menghapus');
    }
  };

  const categoryValues = (selectedCategory?.values || []) as any[];
  const {
    sortField,
    sortOrder,
    handleSort,
    currentPage,
    setCurrentPage,
    perPage,
    handlePerPageChange,
    totalPages,
    totalItems,
    paginatedData: paginatedValues,
  } = useClientTable(categoryValues, { defaultSortField: 'order', defaultPerPage: 10 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Master Data Framework"
        subtitle="Kelola kategori data referensi kustom tanpa perlu merubah kode program (misal: ukuran wearpack, ukuran helm, spesifikasi alat)."
        icon={<Layers className="h-6 w-6 text-indigo-600" />}
        action={
          <Button onClick={() => setIsCategoryModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Tambah Kategori Kustom
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Categories List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Kategori Master</span>
              <span className="text-xs font-mono text-slate-400">{categories.length} Kategori</span>
            </div>

            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada kategori kustom.</p>
            ) : (
              <div className="space-y-1.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategory?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-xs'
                          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{cat.name}</span>
                        <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {cat.values_count ?? 0} nilai
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{cat.code}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Values Table (8 cols) */}
        <div className="lg:col-span-8">
          {selectedCategory ? (
            <Card className="p-5 border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCategory.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Kode Kategori: {selectedCategory.code}</p>
                </div>
                <Button size="sm" onClick={() => setIsValueModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Nilai
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-20">
                        <SortableHeader field="order" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                          Urutan
                        </SortableHeader>
                      </th>
                      <th className="py-2.5 px-3">
                        <SortableHeader field="code" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                          Kode Nilai
                        </SortableHeader>
                      </th>
                      <th className="py-2.5 px-3">
                        <SortableHeader field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                          Nama Nilai
                        </SortableHeader>
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        <SortableHeader field="status" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                          Status
                        </SortableHeader>
                      </th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!selectedCategory.values || selectedCategory.values.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada nilai terdaftar untuk kategori ini.
                        </td>
                      </tr>
                    ) : (
                      paginatedValues.map((v: any) => (
                        <tr key={v.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">{v.order}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{v.code}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{v.name}</td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant={v.status === 'ACTIVE' ? 'success' : 'secondary'}>
                              {v.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteValue(v.id)}
                              title="Hapus Nilai"
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {selectedCategory.values && selectedCategory.values.length > 0 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  perPage={perPage}
                  totalItems={totalItems}
                  itemLabel="nilai master"
                  onPageChange={setCurrentPage}
                  onPerPageChange={handlePerPageChange}
                />
              )}
            </Card>
          ) : (
            <Card className="p-12 text-center text-slate-400">
              <Settings2 className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Pilih salah satu kategori master di sebelah kiri</p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Create Category */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Tambah Kategori Master Kustom"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Kode Kategori (Unik)"
            placeholder="Contoh: SAFETY-HELMET-COLOR"
            value={catForm.code}
            onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
            required
          />
          <Input
            label="Nama Kategori"
            placeholder="Contoh: Warna Helm Keselamatan Tambang"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
          />
          <Input
            label="Deskripsi / Catatan"
            placeholder="Keterangan penggunaan master ini"
            value={catForm.description}
            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              Simpan Kategori
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Value */}
      <Modal
        isOpen={isValueModalOpen}
        onClose={() => setIsValueModalOpen(false)}
        title={`Tambah Nilai: ${selectedCategory?.name}`}
      >
        <form onSubmit={handleCreateValue} className="space-y-4">
          <Input
            label="Kode Nilai"
            placeholder="Contoh: PUTIH"
            value={valForm.code}
            onChange={(e) => setValForm({ ...valForm, code: e.target.value })}
            required
          />
          <Input
            label="Nama Deskriptif"
            placeholder="Contoh: Putih (Staff & Tamu VIP)"
            value={valForm.name}
            onChange={(e) => setValForm({ ...valForm, name: e.target.value })}
            required
          />
          <Input
            label="Nomor Urutan Tampilan"
            type="number"
            value={valForm.order}
            onChange={(e) => setValForm({ ...valForm, order: parseInt(e.target.value) || 0 })}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsValueModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              Simpan Nilai
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

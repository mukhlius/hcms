'use client';

import React, { useState } from 'react';
import { 
  FolderTree, 
  Network, 
  Plus, 
  RefreshCw,
  Building2
} from 'lucide-react';
import { OrganizationUnitNode, MasterCompany, OrgUnitType } from '@/types';
import { organizationUnitService } from '@/services/masterDataService';
import { OrganizationTree } from '@/components/organization/OrganizationTree';
import { OrganizationUnitDetail } from '@/components/organization/OrganizationUnitDetail';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast, confirmDialog } from '@/stores/alertStore';

interface OrgTreeTabProps {
  treeData: OrganizationUnitNode[];
  flatUnits: OrganizationUnitNode[];
  companies: MasterCompany[];
  selectedCompanyId: string;
  loading: boolean;
  onRefresh: () => void;
}

export const OrgTreeTab: React.FC<OrgTreeTabProps> = ({
  treeData,
  flatUnits,
  companies,
  selectedCompanyId,
  loading,
  onRefresh,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<OrganizationUnitNode | null>(
    treeData.length > 0 ? treeData[0] : null
  );

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [moveSubmitting, setMoveSubmitting] = useState<boolean>(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    company_id: selectedCompanyId || (companies[0]?.id ? String(companies[0].id) : ''),
    parent_id: '',
    type: 'DEPARTMENT' as OrgUnitType,
    code: '',
    name: '',
    description: '',
    effective_from: '',
  });
  const [selectedNewParentId, setSelectedNewParentId] = useState<string>('');

  const handleOpenCreate = (parent?: OrganizationUnitNode) => {
    setModalMode('create');
    setFormData({
      id: 0,
      company_id: selectedCompanyId || (companies[0]?.id ? String(companies[0].id) : ''),
      parent_id: parent ? String(parent.id) : '',
      type: parent ? 'DEPARTMENT' : 'BUSINESS_UNIT',
      code: '',
      name: '',
      description: '',
      effective_from: new Date().toISOString().split('T')[0],
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (unit: OrganizationUnitNode) => {
    setModalMode('edit');
    setFormData({
      id: unit.id,
      company_id: String(unit.company_id),
      parent_id: unit.parent_id ? String(unit.parent_id) : '',
      type: unit.type,
      code: unit.code,
      name: unit.name,
      description: unit.description || '',
      effective_from: unit.effective_from || '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenMove = (unit: OrganizationUnitNode) => {
    setSelectedUnit(unit);
    setSelectedNewParentId(unit.parent_id ? String(unit.parent_id) : '');
    setMoveError(null);
    setIsMoveModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const payload: any = {
        company_id: parseInt(formData.company_id),
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
        type: formData.type,
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        effective_from: formData.effective_from || null,
      };

      if (modalMode === 'create') {
        const res = await organizationUnitService.createUnit(payload);
        if (res.success && res.data) {
          setIsFormModalOpen(false);
          onRefresh();
          setSelectedUnit(res.data);
        }
      } else {
        const res = await organizationUnitService.updateUnit(formData.id, payload);
        if (res.success && res.data) {
          setIsFormModalOpen(false);
          onRefresh();
          setSelectedUnit(res.data);
          toast.success(`Unit organisasi "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan unit organisasi.', 'Gagal Menyimpan');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleExecuteMove = async () => {
    if (!selectedUnit) return;

    const confirmed = await confirmDialog({
      title: 'Pindahkan Unit Organisasi',
      message: `Apakah Anda yakin ingin memindahkan unit "${selectedUnit.name}" ke hierarki induk yang dipilih? Seluruh sub-unit dan relasi di bawahnya akan ikut berpindah.`,
      confirmText: 'Ya, Pindahkan Unit',
      cancelText: 'Batal',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      setMoveSubmitting(true);
      setMoveError(null);
      const newParent = selectedNewParentId ? parseInt(selectedNewParentId) : null;
      await organizationUnitService.moveUnit(selectedUnit.id, newParent);
      setIsMoveModalOpen(false);
      toast.success(`Unit organisasi "${selectedUnit.name}" berhasil dipindahkan ke induk baru.`, 'Berhasil Dipindahkan');
      onRefresh();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.parent_id?.[0] || 'Gagal memindahkan unit organisasi.';
      setMoveError(errorMsg);
      toast.error(errorMsg, 'Gagal Memindahkan');
    } finally {
      setMoveSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Visualisasi pohon hierarki bagan struktur organisasi dari holding perusahaan hingga seksi kerja.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} isLoading={loading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Segarkan Pohon
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => handleOpenCreate()}>
            Tambah Unit Root
          </Button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Organization Tree (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="p-4 min-h-[580px] shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4.5 w-4.5 text-blue-600" />
                <span className="font-bold text-sm text-slate-800">Hierarki Visual Pohon</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {treeData.length} Root
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-5/6" />
                <Skeleton className="h-8 w-4/6" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[640px] pr-1">
                <OrganizationTree
                  nodes={treeData}
                  selectedUnit={selectedUnit}
                  onSelectUnit={(unit) => setSelectedUnit(unit)}
                  onAddChild={(parent) => handleOpenCreate(parent)}
                  onMoveUnit={(unit) => handleOpenMove(unit)}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Organization Unit Detail (7 cols) */}
        <div className="lg:col-span-7">
          {selectedUnit ? (
            <OrganizationUnitDetail
              unitId={selectedUnit.id}
              onEditUnit={handleOpenEdit}
              onAddChild={handleOpenCreate}
              onMoveUnit={handleOpenMove}
              onUnitUpdated={onRefresh}
            />
          ) : (
            <Card className="p-12 text-center text-slate-400 shadow-xs">
              <Network className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-600">Pilih salah satu unit di pohon organisasi sebelah kiri</p>
              <p className="text-xs text-slate-400 mt-1">Detail struktur, pimpinan, posisi jabatan, dan audit trail akan ditampilkan di sini.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Create / Edit Unit */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Unit Organisasi' : 'Edit Unit Organisasi'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Perusahaan"
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              options={companies.map(c => ({ value: String(c.id), label: `${c.code} - ${c.name}` }))}
              required
            />
            <Select
              label="Tipe Organisasi"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as OrgUnitType })}
              options={[
                { value: 'BUSINESS_UNIT', label: 'Business Unit / Direktorat' },
                { value: 'DIVISION', label: 'Divisi (Division)' },
                { value: 'DEPARTMENT', label: 'Departemen (Department)' },
                { value: 'SECTION', label: 'Seksi Kerja (Section)' },
                { value: 'SUB_SECTION', label: 'Sub-Seksi (Sub Section)' },
                { value: 'OTHER', label: 'Lainnya' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Kode Unit"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Contoh: ENG, PROD, HR"
              required
              disabled={modalMode === 'edit'}
            />
            <Select
              label="Unit Induk (Parent)"
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              options={[
                { value: '', label: '-- Tanpa Induk (Root) --' },
                ...flatUnits
                  .filter(u => u.id !== formData.id)
                  .map(u => ({ value: String(u.id), label: `${u.code} - ${u.name} (${u.type})` }))
              ]}
            />
          </div>

          <Input
            label="Nama Unit Organisasi"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Mining Engineering Department"
            required
          />

          <Input
            label="Deskripsi / Catatan"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tujuan atau cakupan operasional unit..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={formSubmitting}>
              {modalMode === 'create' ? 'Simpan Unit' : 'Perbarui Unit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Move Unit */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title={`Pindah Induk Hierarki: ${selectedUnit?.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Pilih unit induk baru untuk memindahkan <strong className="text-slate-800">{selectedUnit?.name}</strong> beserta seluruh sub-unit dan jabatannya ke cabang lain.
          </p>

          {moveError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {moveError}
            </div>
          )}

          <Select
            label="Pilih Unit Induk Baru"
            value={selectedNewParentId}
            onChange={(e) => setSelectedNewParentId(e.target.value)}
            options={[
              { value: '', label: '-- Jadikan Root (Tanpa Induk) --' },
              ...flatUnits
                .filter(u => u.id !== selectedUnit?.id)
                .map(u => ({ value: String(u.id), label: `${u.code} - ${u.name} (${u.type})` }))
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsMoveModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleExecuteMove} isLoading={moveSubmitting}>
              Pindahkan Unit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

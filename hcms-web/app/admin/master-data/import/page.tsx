'use client';

import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileCheck,
  Table,
  Check,
  Database
} from 'lucide-react';
import { importExportService } from '@/services/masterDataService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

const steps = [
  { step: 1, title: 'Unggah Berkas', desc: 'Pilih file CSV' },
  { step: 2, title: 'Pemetaan Kolom', desc: 'Cocokkan atribut' },
  { step: 3, title: 'Pratinjau Data', desc: 'Periksa baris data' },
  { step: 4, title: 'Validasi Sistem', desc: 'Verifikasi integritas' },
  { step: 5, title: 'Laporan Error', desc: 'Tinjau kesalahan' },
  { step: 6, title: 'Eksekusi Impor', desc: 'Transaksi database' },
  { step: 7, title: 'Selesai', desc: 'Hasil & audit trail' },
];

export default function MasterImportPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedEntity, setSelectedEntity] = useState<string>('companies');
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    code: '',
    name: '',
  });

  // Validation results
  const [validationResult, setValidationResult] = useState<{
    is_valid: boolean;
    total: number;
    valid_count: number;
    error_count: number;
    errors: Array<{ row: number; field: string; value: any; message: string }>;
    valid_data: any[];
  } | null>(null);

  // Execution result
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported_count: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Upload and Inspect
  const handleFileUpload = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await importExportService.uploadAndInspect(file);
      if (res.success && res.data) {
        setHeaders(res.data.headers);
        setSampleRows(res.data.sample_rows);
        setAllRows(res.data.all_rows);

        // Auto-match common header names
        const autoMap: Record<string, string> = {};
        res.data.headers.forEach(h => {
          const lower = h.toLowerCase().trim();
          if (lower.includes('kode') || lower === 'code') autoMap['code'] = h;
          if (lower.includes('nama') || lower === 'name') autoMap['name'] = h;
          if (lower.includes('legal') || lower === 'legal_name') autoMap['legal_name'] = h;
          if (lower.includes('npwp') || lower === 'tax_identifier') autoMap['tax_identifier'] = h;
        });
        setColumnMapping(prev => ({ ...prev, ...autoMap }));
        setCurrentStep(2);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal memproses berkas CSV.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Validate Data
  const handleValidate = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await importExportService.validateImport({
        entity: selectedEntity,
        headers,
        rows: allRows,
        mapping: columnMapping,
      });

      if (res.success && res.data) {
        setValidationResult(res.data);
        if (res.data.error_count > 0) {
          setCurrentStep(5); // Go to Error Review
        } else {
          setCurrentStep(6); // Go directly to Confirmation
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Validasi data gagal dijalankan.');
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Execute Import in DB Transaction
  const handleExecuteImport = async () => {
    if (!validationResult || !validationResult.valid_data) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await importExportService.executeImport({
        entity: selectedEntity,
        data: validationResult.valid_data,
        strategy: 'STRICT',
      });

      if (res.success && res.data) {
        setImportResult(res.data);
        setCurrentStep(7);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Eksekusi transaksi impor gagal.');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFile(null);
    setHeaders([]);
    setSampleRows([]);
    setAllRows([]);
    setValidationResult(null);
    setImportResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wisaya Impor Data Master (Universal CSV Pipeline)"
        subtitle="Alur impor 7-tahap berstandar enterprise dengan validasi skema, pencegahan formula injection, error reporting, dan transaksi database atomik."
        icon={<UploadCloud className="h-6 w-6 text-emerald-600" />}
      />

      {/* Stepper Progress Bar */}
      <Card className="p-4 border-slate-200">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div key={s.step} className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : isCurrent 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : s.step}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>{s.title}</p>
                    <p className="text-[10px] text-slate-400">{s.desc}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="h-0.5 w-6 sm:w-12 bg-slate-200 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Upload File */}
      {currentStep === 1 && (
        <Card className="p-8 border-slate-200 text-center space-y-5">
          <div className="max-w-md mx-auto space-y-4">
            <Select
              label="Pilih Target Entitas Master"
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              options={[
                { value: 'companies', label: 'Perusahaan (Company)' },
                { value: 'sites', label: 'Site Tambang & Fasilitas' },
                { value: 'organization-units', label: 'Unit Organisasi' },
                { value: 'positions', label: 'Posisi Jabatan' },
                { value: 'grades', label: 'Grade / Level' },
                { value: 'job-families', label: 'Rumpun Jabatan (Job Family)' },
                { value: 'jobs', label: 'Jabatan (Job)' },
                { value: 'work-locations', label: 'Lokasi Kerja' },
                { value: 'cost-centers', label: 'Pusat Biaya (Cost Center)' },
              ]}
            />

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-blue-500 transition-colors bg-slate-50/50">
              <UploadCloud className="h-12 w-12 mx-auto text-slate-400 mb-3" />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <span className="font-bold text-sm text-blue-600 hover:text-blue-700">Pilih berkas CSV</span>
                <span className="text-xs text-slate-500 block mt-1">Format .csv maksimal 5 MB</span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>

              {file && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <Button
              className="w-full"
              disabled={!file}
              onClick={handleFileUpload}
              isLoading={loading}
            >
              Lanjutkan ke Pemetaan Kolom <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Map Columns */}
      {currentStep === 2 && (
        <Card className="p-6 border-slate-200 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Petakan Kolom Berkas ke Kolom Database</h3>
            <p className="text-xs text-slate-500">Cocokkan kolom header yang ditemukan dalam berkas CSV dengan atribut entitas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Kode Unik (Wajib)</label>
              <Select
                value={columnMapping.code || ''}
                onChange={(e) => setColumnMapping({ ...columnMapping, code: e.target.value })}
                options={[
                  { value: '', label: '-- Pilih Kolom CSV --' },
                  ...headers.map(h => ({ value: h, label: h }))
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nama / Judul (Wajib)</label>
              <Select
                value={columnMapping.name || ''}
                onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                options={[
                  { value: '', label: '-- Pilih Kolom CSV --' },
                  ...headers.map(h => ({ value: h, label: h }))
                ]}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
            </Button>
            <Button
              disabled={!columnMapping.code || !columnMapping.name}
              onClick={() => setCurrentStep(3)}
            >
              Lihat Pratinjau Data <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Preview Data */}
      {currentStep === 3 && (
        <Card className="p-6 border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pratinjau Sampel Data (5 Baris Pertama)</h3>
              <p className="text-xs text-slate-500">Total ditemukan {allRows.length} baris data dalam berkas.</p>
            </div>
            <Badge variant="primary">{allRows.length} Baris Terdeteksi</Badge>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  {headers.map((h, i) => (
                    <th key={i} className="py-2.5 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sampleRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 text-slate-400 font-mono">{rIdx + 1}</td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-slate-800 font-medium">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Ubah Pemetaan
            </Button>
            <Button onClick={handleValidate} isLoading={loading}>
              Jalankan Validasi Sistem <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Review Errors */}
      {currentStep === 5 && validationResult && (
        <Card className="p-6 border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Tinjauan Kesalahan Validasi Data
              </h3>
              <p className="text-xs text-slate-500">Ditemukan {validationResult.error_count} kesalahan format/integritas baris.</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="danger">{validationResult.error_count} Gagal</Badge>
              <Badge variant="success">{validationResult.valid_count} Lolos</Badge>
            </div>
          </div>

          <div className="overflow-x-auto border border-red-200 rounded-lg max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-red-50 text-red-800 font-semibold border-b border-red-200">
                <tr>
                  <th className="py-2.5 px-3 w-16">Baris</th>
                  <th className="py-2.5 px-3">Kolom / Atribut</th>
                  <th className="py-2.5 px-3">Nilai yang Diterima</th>
                  <th className="py-2.5 px-3">Pesan Kesalahan Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {validationResult.errors.map((err, i) => (
                  <tr key={i} className="hover:bg-red-50/50">
                    <td className="py-2 px-3 font-mono font-bold text-red-700">#{err.row}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{err.field}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{String(err.value || '-')}</td>
                    <td className="py-2 px-3 text-red-600 font-medium">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={resetWizard}>
              Unggah Ulang Berkas yang Telah Diperbaiki
            </Button>
            {validationResult.valid_count > 0 && (
              <Button onClick={() => setCurrentStep(6)}>
                Lanjutkan Baris yang Valid Saja ({validationResult.valid_count} Baris) <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Step 6: Execute Confirmation */}
      {currentStep === 6 && validationResult && (
        <Card className="p-8 border-slate-200 text-center space-y-5">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mx-auto">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Eksekusi Impor Database</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data akan dimasukkan ke dalam basis data dengan transaksi atomik dan dicatat dalam audit trail.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Entitas:</span>
                <span className="font-bold text-slate-800 uppercase">{selectedEntity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Baris Valid:</span>
                <span className="font-bold text-emerald-700">{validationResult.valid_count} Baris</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Strategi Transaksi:</span>
                <span className="font-bold text-blue-700">Atomic Safe Commit</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="w-1/2" onClick={() => setCurrentStep(3)}>
                Batal
              </Button>
              <Button className="w-1/2" onClick={handleExecuteImport} isLoading={loading}>
                Mulai Impor Sekarang
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 7: Final Result */}
      {currentStep === 7 && importResult && (
        <Card className="p-8 border-slate-200 text-center space-y-5">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Proses Impor Berhasil Selesai!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sebanyak <span className="font-bold text-emerald-700">{importResult.imported_count} baris data</span> telah berhasil diintegrasikan ke dalam sistem dan siap digunakan.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={resetWizard}>
                Impor Berkas Lainnya
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

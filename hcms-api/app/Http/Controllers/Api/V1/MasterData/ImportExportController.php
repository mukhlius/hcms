<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\BenefitPlafond;
use App\Models\CostCenter;
use App\Models\EmploymentType;
use App\Models\Grade;
use App\Models\JobFamily;
use App\Models\OrganizationCompany;
use App\Models\OrganizationDepartment;
use App\Models\OrganizationJob;
use App\Models\OrganizationSection;
use App\Models\OrganizationSite;
use App\Models\OrganizationUnit;
use App\Models\Position;
use App\Models\SalaryGrade;
use App\Models\Shift;
use App\Models\StandardReference;
use App\Models\User;
use App\Models\WorkLocation;
use App\Models\WorkSchedule;
use App\Services\MasterExportService;
use App\Services\MasterImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportExportController extends BaseApiController
{
    protected array $entityModelMap = [
        'companies' => OrganizationCompany::class,
        'sites' => OrganizationSite::class,
        'departments' => OrganizationDepartment::class,
        'sections' => OrganizationSection::class,
        'organization-units' => OrganizationUnit::class,
        'positions' => Position::class,
        'salary-grades' => SalaryGrade::class, // Golongan
        'grades' => Grade::class,              // Level Jabatan
        'levels' => Grade::class,              // Alias Level Jabatan
        'employment-types' => EmploymentType::class,
        'work-locations' => StandardReference::class, // Area Kerja
        'work-areas' => StandardReference::class,
        'poh' => StandardReference::class,
        'marital-statuses' => StandardReference::class,
        'plafon-pengobatan' => BenefitPlafond::class,
        'plafon-kacamata' => BenefitPlafond::class,
        'plafon-persalinan' => BenefitPlafond::class,
        'tunjangan-lapangan' => BenefitPlafond::class,
        'uang-perdin' => BenefitPlafond::class,
        'bantuan-lumpsum' => BenefitPlafond::class,
        'bantuan-komunikasi' => BenefitPlafond::class,
        'bantuan-perumahan' => BenefitPlafond::class,
        'job-families' => JobFamily::class,
        'jobs' => OrganizationJob::class,
        'cost-centers' => CostCenter::class,
        'shifts' => Shift::class,
        'work-schedules' => WorkSchedule::class,
        'users' => User::class,
    ];

    public function __construct(
        protected MasterImportService $importService,
        protected MasterExportService $exportService
    ) {}

    /**
     * Step 1, 2, 3: Upload and inspect CSV file.
     */
    public function uploadAndInspect(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'], // max 5MB
        ]);

        $file = $request->file('file');
        $result = $this->importService->parseFile($file);

        return $this->successResponse($result, 'Berkas berhasil diunggah dan dianalisis.');
    }

    /**
     * Step 4, 5: Validate mapped rows against entity rules.
     */
    public function validateImport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entity' => ['required', 'string', 'in:' . implode(',', array_keys($this->entityModelMap))],
            'headers' => ['required', 'array'],
            'rows' => ['required', 'array'],
            'mapping' => ['required', 'array'],
        ]);

        $entity = $validated['entity'];
        $rules = match ($entity) {
            'companies' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'sites' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'departments' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'company_code' => ['nullable', 'string', 'max:100'],
                'site_code' => ['nullable', 'string', 'max:100'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'sections' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'company_code' => ['nullable', 'string', 'max:100'],
                'department_code' => ['nullable', 'string', 'max:100'],
                'site_code' => ['nullable', 'string', 'max:100'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'positions' => [
                'code' => ['required', 'string', 'max:50'],
                'title' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'salary-grades' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'grades', 'levels' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'level' => ['required'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'employment-types' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'work-locations', 'work-areas' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'poh' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'marital-statuses' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'category' => ['required', 'string', 'max:50'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'plafon-pengobatan', 'plafon-persalinan' => [
                'salary_grade_code' => ['required', 'string', 'max:50'],
                'marital_category' => ['required', 'string', 'max:50'],
                'amount' => ['required', 'numeric', 'min:0'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'plafon-kacamata' => [
                'lens_type' => ['required', 'string', 'max:100'],
                'frame_amount' => ['required', 'numeric', 'min:0'],
                'lens_amount' => ['required', 'numeric', 'min:0'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'tunjangan-lapangan', 'bantuan-lumpsum', 'bantuan-komunikasi', 'bantuan-perumahan' => [
                'salary_grade_code' => ['required', 'string', 'max:50'],
                'category_name' => ['nullable', 'string', 'max:100'],
                'amount' => ['required', 'numeric', 'min:0'],
                'period_type' => ['nullable', 'string', 'max:50'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'uang-perdin' => [
                'salary_grade_code' => ['required', 'string', 'max:50'],
                'zone_name' => ['nullable', 'string', 'max:100'],
                'category_name' => ['nullable', 'string', 'max:100'],
                'amount' => ['required', 'numeric', 'min:0'],
                'period_type' => ['nullable', 'string', 'max:50'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'shifts' => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            'users' => [
                'username' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'email' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
            default => [
                'code' => ['required', 'string', 'max:50'],
                'name' => ['required', 'string', 'max:150'],
                'status' => ['nullable', 'string', 'max:50'],
            ],
        };

        $result = $this->importService->validateRows(
            $validated['headers'],
            $validated['rows'],
            $validated['mapping'],
            $rules
        );

        return $this->successResponse($result, 'Validasi data impor selesai.');
    }

    /**
     * Step 6, 7: Final execution in DB transaction.
     */
    public function executeImport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entity' => ['required', 'string', 'in:' . implode(',', array_keys($this->entityModelMap))],
            'data' => ['required', 'array', 'min:1'],
            'strategy' => ['nullable', 'string', 'in:STRICT,PARTIAL'],
        ]);

        $modelClass = $this->entityModelMap[$validated['entity']];
        $result = $this->importService->executeImport(
            $modelClass,
            $validated['data'],
            strtoupper($validated['entity']),
            $validated['strategy'] ?? 'STRICT'
        );

        return $this->successResponse($result, "Berhasil mengimpor {$result['imported_count']} baris data.");
    }

    /**
     * Universal CSV exporter matching Modal Tambah fields with audit logging.
     */
    public function export(Request $request, string $entity): StreamedResponse|JsonResponse
    {
        if (!isset($this->entityModelMap[$entity])) {
            return $this->errorResponse('Entitas ekspor tidak ditemukan.', 404);
        }

        $modelClass = $this->entityModelMap[$entity];
        $filename = "export_{$entity}_" . date('Ymd_His') . ".csv";

        $headers = match ($entity) {
            'companies' => ['Kode Perusahaan', 'Nama Singkat', 'Nama Perusahaan', 'NPWP', 'Alamat', 'Status', 'Tanggal Dibuat'],
            'sites' => ['Perusahaan Induk', 'Kode Site', 'Nama Singkat', 'Nama Lengkap Site', 'Alamat', 'Status', 'Tanggal Dibuat'],
            'departments' => ['Perusahaan Induk', 'Site Operasional', 'Kode Departemen', 'Nama Departemen', 'Deskripsi', 'Status', 'Tanggal Dibuat'],
            'sections' => ['Perusahaan Induk', 'Departemen Induk', 'Site Tambang/Fasilitas', 'Kode Seksi', 'Nama Seksi', 'Deskripsi', 'Status', 'Tanggal Dibuat'],
            'positions' => ['Site Tambang', 'Departemen', 'Section (Seksi)', 'Level/Grade', 'Kode Posisi', 'Nama Posisi', 'Atasan Langsung', 'MPP', 'Status', 'Tanggal Dibuat'],
            'salary-grades' => ['Kode Golongan', 'Nama Golongan', 'Status', 'Tanggal Dibuat'],
            'grades', 'levels' => ['Kode Level', 'Level', 'Pangkat', 'Nama Level Jabatan', 'Deskripsi', 'Status', 'Tanggal Dibuat'],
            'employment-types' => ['Kode Hubungan Kerja', 'Nama Hubungan Kerja', 'Sifat Hubungan', 'Deskripsi', 'Status', 'Tanggal Dibuat'],
            'work-locations', 'work-areas' => ['Kode Area', 'Nama Area Kerja', 'Fungsi / Keterangan', 'Risiko K3', 'Status', 'Tanggal Dibuat'],
            'poh' => ['Kode POH', 'Nama POH', 'Bandara Tujuan', 'Hari Perjalanan Cuti', 'Status', 'Tanggal Dibuat'],
            'marital-statuses' => ['Kode Status', 'Nama Status', 'Kategori', 'Status', 'Tanggal Dibuat'],
            'plafon-pengobatan' => ['Kode Golongan', 'Nama Golongan', 'Kategori Pernikahan', 'Nominal Plafon', 'Periode', 'Ketentuan / Cakupan', 'Status', 'Tanggal Dibuat'],
            'plafon-kacamata' => ['Kriteria Lensa', 'Bantuan Frame', 'Bantuan Lensa', 'Total Plafon', 'Periode', 'Ketentuan / Keterangan', 'Status', 'Tanggal Dibuat'],
            'plafon-persalinan' => ['Kode Golongan', 'Nama Golongan', 'Kategori Pernikahan', 'Nominal Plafon', 'Periode', 'Ketentuan / Cakupan', 'Status', 'Tanggal Dibuat'],
            'tunjangan-lapangan' => ['Kode Golongan', 'Nama Golongan', 'Kategori Penempatan', 'Nominal Tunjangan', 'Periode', 'Ketentuan / Keterangan', 'Status', 'Tanggal Dibuat'],
            'uang-perdin' => ['Kode Golongan', 'Nama Golongan', 'Zona / Wilayah', 'Komponen Perdin', 'Nominal Per Hari', 'Periode', 'Ketentuan / Keterangan', 'Status', 'Tanggal Dibuat'],
            'bantuan-lumpsum' => ['Kode Golongan', 'Nama Golongan', 'Jenis Bantuan Lumpsum', 'Besaran Bantuan', 'Periode', 'Ketentuan / Syarat', 'Status', 'Tanggal Dibuat'],
            'bantuan-komunikasi' => ['Kode Golongan', 'Nama Golongan', 'Kategori Komunikasi', 'Nominal Bantuan', 'Periode', 'Ketentuan / Fasilitas', 'Status', 'Tanggal Dibuat'],
            'bantuan-perumahan' => ['Kode Golongan', 'Nama Golongan', 'Kategori Perumahan', 'Nominal Bantuan', 'Periode', 'Ketentuan / Keterangan', 'Status', 'Tanggal Dibuat'],
            'shifts' => ['Kode Shift', 'Nama Shift', 'Jam Masuk', 'Jam Pulang', 'Istirahat (Menit)', 'Status', 'Tanggal Dibuat'],
            'users' => ['Username', 'Nama Lengkap', 'Email', 'Status Akun', 'Cakupan Akses', 'Tanggal Dibuat'],
            default => ['Kode', 'Nama', 'Status', 'Tanggal Dibuat'],
        };

        $generator = function () use ($modelClass, $entity) {
            $query = match ($entity) {
                'work-locations', 'work-areas' => StandardReference::where('category', 'WORK_AREA')->orderBy('code'),
                'poh' => StandardReference::where('category', 'POH')->orderBy('code'),
                'marital-statuses' => StandardReference::where('category', 'MARITAL_STATUS')->orderBy('code'),
                'plafon-pengobatan' => BenefitPlafond::with('salaryGrade')->where('benefit_type', 'PENGOBATAN')->orderBy('id'),
                'plafon-kacamata' => BenefitPlafond::where('benefit_type', 'KACAMATA')->orderBy('id'),
                'plafon-persalinan' => BenefitPlafond::with('salaryGrade')->where('benefit_type', 'PERSALINAN')->orderBy('id'),
                'tunjangan-lapangan' => BenefitPlafond::with('salaryGrade')->where('benefit_type', 'TUNJANGAN_LAPANGAN')->orderBy('id'),
                'uang-perdin' => BenefitPlafond::with('salaryGrade')->where('benefit_type', 'UANG_PERDIN')->orderBy('id'),
                'bantuan-lumpsum' => BenefitPlafond::with('salaryGrade')->where('benefit_type', 'BANTUAN_LUMPSUM')->orderBy('id'),
                'bantuan-komunikasi' => BenefitPlafond::with('salaryGrade')->where('benefit_type', 'BANTUAN_KOMUNIKASI')->orderBy('id'),
                'bantuan-perumahan' => BenefitPlafond::with('salaryGrade')->where('benefit_type', 'BANTUAN_PERUMAHAN')->orderBy('id'),
                'departments' => OrganizationDepartment::with(['company', 'site'])->orderBy('code'),
                'sections' => OrganizationSection::with(['company', 'department', 'site'])->orderBy('code'),
                'sites' => OrganizationSite::with('company')->orderBy('code'),
                'positions' => Position::with(['site', 'department', 'section', 'grade', 'reportsTo'])->orderBy('code'),
                'salary-grades' => SalaryGrade::orderBy('code'),
                'grades', 'levels' => Grade::orderBy('level'),
                default => $modelClass::query(),
            };

            foreach ($query->cursor() as $item) {
                yield match ($entity) {
                    'companies' => [
                        $item->code ?? '',
                        $item->short_name ?? '',
                        $item->name ?? '',
                        $item->tax_identifier ?? '',
                        $item->address ?? '',
                        $item->status ?? ($item->is_active ? 'ACTIVE' : 'INACTIVE'),
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'sites' => [
                        $item->company?->code ?? '',
                        $item->code ?? '',
                        $item->short_name ?? '',
                        $item->name ?? '',
                        $item->address ?? '',
                        $item->status ?? ($item->is_active ? 'ACTIVE' : 'INACTIVE'),
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'departments' => [
                        $item->company?->code ?? '',
                        $item->site?->code ?? '',
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'sections' => [
                        $item->company?->code ?? '',
                        $item->department?->code ?? '',
                        $item->site?->code ?? '',
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'positions' => [
                        $item->site?->code ?? '',
                        $item->department?->code ?? '',
                        $item->section?->code ?? '',
                        $item->grade?->code ?? '',
                        $item->code ?? '',
                        $item->title ?? '',
                        $item->reportsTo?->code ?? '',
                        (string) ($item->approved_headcount ?? 1),
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'salary-grades' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'grades', 'levels' => [
                        $item->code ?? '',
                        (string) ($item->level ?? 1),
                        $item->pangkat ?? 'Staff',
                        $item->name ?? '',
                        $item->description ?? '',
                        $item->status ?? ($item->is_active ? 'ACTIVE' : 'INACTIVE'),
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'employment-types' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->is_permanent ? 'Tetap (PKWTT)' : 'Waktu Tertentu',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'work-locations', 'work-areas' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->metadata['description'] ?? '',
                        $item->metadata['risk_level'] ?? 'SEDANG',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'poh' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->metadata['destination_airport'] ?? '',
                        (string) ($item->metadata['additional_travel_days'] ?? 0),
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'marital-statuses' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->metadata['category'] ?? ($item->name && str_contains(strtolower($item->name), 'belum') ? 'Tidak Menikah' : 'Menikah'),
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'plafon-pengobatan' => [
                        $item->salaryGrade?->code ?? '',
                        $item->salaryGrade?->name ?? '',
                        $item->marital_category ?? 'SEMUA',
                        (string) ($item->amount ?? 0),
                        $item->period_type ?? 'TAHUNAN',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'plafon-kacamata' => [
                        $item->lens_type ?? '',
                        (string) ($item->frame_amount ?? 0),
                        (string) ($item->lens_amount ?? 0),
                        (string) ($item->amount ?? 0),
                        $item->period_type ?? '2_TAHUNAN',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'plafon-persalinan' => [
                        $item->salaryGrade?->code ?? '',
                        $item->salaryGrade?->name ?? '',
                        $item->marital_category ?? 'SEMUA',
                        (string) ($item->amount ?? 0),
                        $item->period_type ?? 'PER_KASUS',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'tunjangan-lapangan' => [
                        $item->salaryGrade?->code ?? '',
                        $item->salaryGrade?->name ?? '',
                        $item->category_name ?? '',
                        (string) ($item->amount ?? 0),
                        $item->period_type ?? 'BULANAN',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'uang-perdin' => [
                        $item->salaryGrade?->code ?? '',
                        $item->salaryGrade?->name ?? '',
                        $item->zone_name ?? '',
                        $item->category_name ?? '',
                        (string) ($item->amount ?? 0),
                        $item->period_type ?? 'HARIAN',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'bantuan-lumpsum' => [
                        $item->salaryGrade?->code ?? '',
                        $item->salaryGrade?->name ?? '',
                        $item->category_name ?? '',
                        (string) ($item->amount ?? 0),
                        $item->period_type ?? 'PER_KASUS',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'bantuan-komunikasi' => [
                        $item->salaryGrade?->code ?? '',
                        $item->salaryGrade?->name ?? '',
                        $item->category_name ?? '',
                        (string) ($item->amount ?? 0),
                        $item->period_type ?? 'BULANAN',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'bantuan-perumahan' => [
                        $item->salaryGrade?->code ?? '',
                        $item->salaryGrade?->name ?? '',
                        $item->category_name ?? '',
                        (string) ($item->amount ?? 0),
                        $item->period_type ?? 'BULANAN',
                        $item->description ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'shifts' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->start_time ?? '',
                        $item->end_time ?? '',
                        (string) ($item->break_minutes ?? 60),
                        $item->status ?? ($item->is_active ? 'ACTIVE' : 'INACTIVE'),
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'users' => [
                        $item->username ?? '',
                        $item->name ?? '',
                        $item->email ?? '',
                        $item->status ?? 'ACTIVE',
                        $item->data_scope ?? 'SELF',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    default => [
                        $item->code ?? '',
                        $item->name ?? $item->title ?? '',
                        $item->status ?? ($item->is_active ? 'ACTIVE' : 'INACTIVE'),
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                };
            }
        };

        return $this->exportService->exportCsv(
            $filename,
            $headers,
            $generator(),
            strtoupper($entity)
        );
    }

    /**
     * Download Official Starter CSV Template with Sample Rows strictly matching Modal Tambah.
     */
    public function downloadTemplate(Request $request, string $entity): StreamedResponse|JsonResponse
    {
        $templates = [
            'companies' => [
                'headers' => ['code', 'name', 'short_name', 'tax_identifier', 'address', 'status'],
                'samples' => [
                    ['CMN-CORP', 'PT Coal Mining Nusantara', 'CMN', '01.234.567.8-012.000', 'Gedung Mining Tower Lt. 15, Jl. TB Simatupang, Jakarta', 'ACTIVE'],
                    ['HRS-MINE', 'PT Hasnur Riung Sinergi', 'HRS', '02.987.654.3-098.000', 'Jl. Jenderal Sudirman No. 45, Balikpapan', 'ACTIVE'],
                ],
            ],
            'sites' => [
                'headers' => ['company_code', 'code', 'short_name', 'name', 'address', 'status'],
                'samples' => [
                    ['CMN-CORP', 'SITE-SGT', 'SGT', 'Mining Site Sangatta', 'Jl. Poros Sangatta-Bengalon KM 12, Kutai Timur', 'ACTIVE'],
                    ['CMN-CORP', 'SITE-BGL', 'BGL', 'Mining Site Bengalon', 'Kawasan Pelabuhan Muat Bengalon, Kutai Timur', 'ACTIVE'],
                ],
            ],
            'departments' => [
                'headers' => ['company_code', 'site_code', 'code', 'name', 'description', 'status'],
                'samples' => [
                    ['HRS', 'HAGM', 'ENG', 'Engineering', 'Departemen perencanaan tambang, geoteknik, dan survei pit', 'ACTIVE'],
                    ['HRS', 'HAGM', 'OPR', 'Operation', 'Departemen operasional penambangan pit batubara', 'ACTIVE'],
                ],
            ],
            'sections' => [
                'headers' => ['company_code', 'department_code', 'site_code', 'code', 'name', 'description', 'status'],
                'samples' => [
                    ['HRS', 'ENG', 'HAGM', 'DIV-ENG-02', 'Short Term Mine Plan', 'Seksi perencanaan tambang jangka pendek mingguan/bulanan', 'ACTIVE'],
                    ['HRS', 'OPR', 'HAGM', 'DIV-OPR-01', 'Manajemen Operasional', 'Seksi manajemen operasional penambangan site', 'ACTIVE'],
                ],
            ],
            'positions' => [
                'headers' => ['site_code', 'department_code', 'section_code', 'grade_code', 'code', 'title', 'reports_to_code', 'approved_headcount', 'status'],
                'samples' => [
                    ['SITE-SGT', 'ENG', 'SEC-MINE-PLAN', 'LVL-04', 'POS-ENG-SPV', 'Mine Planning Supervisor', '', '2', 'ACTIVE'],
                    ['SITE-SGT', 'PROD', 'SEC-HAUL-01', 'LVL-01', 'POS-OPR-HAUL', 'Hauling Heavy Truck Operator', 'POS-ENG-SPV', '15', 'ACTIVE'],
                ],
            ],
            'salary-grades' => [
                'headers' => ['code', 'name', 'status'],
                'samples' => [
                    ['GOL-1A', 'Golongan 1A - Operator', 'ACTIVE'],
                    ['GOL-2A', 'Golongan 2A - Senior Operator', 'ACTIVE'],
                    ['GOL-4A', 'Golongan 4A - Supervisor', 'ACTIVE'],
                ],
            ],
            'grades' => [
                'headers' => ['code', 'level', 'pangkat', 'name', 'description', 'status'],
                'samples' => [
                    ['LVL-01', '1', 'Staff', 'Direktur / General Manager', 'Pimpinan eksekutif operasional tertinggi site', 'ACTIVE'],
                    ['LVL-04', '4', 'Staff', 'Supervisor Lapangan', 'Pengawas keselamatan pit dan formasi regu', 'ACTIVE'],
                    ['LVL-05', '5', 'Non Staff', 'Senior Operator Alat Berat', 'Operator excavator, dozer, dan grader bersertifikat', 'ACTIVE'],
                ],
            ],
            'levels' => [
                'headers' => ['code', 'level', 'pangkat', 'name', 'description', 'status'],
                'samples' => [
                    ['LVL-01', '1', 'Staff', 'Direktur / General Manager', 'Pimpinan eksekutif operasional tertinggi site', 'ACTIVE'],
                    ['LVL-04', '4', 'Staff', 'Supervisor Lapangan', 'Pengawas keselamatan pit dan formasi regu', 'ACTIVE'],
                    ['LVL-05', '5', 'Non Staff', 'Senior Operator Alat Berat', 'Operator excavator, dozer, dan grader bersertifikat', 'ACTIVE'],
                ],
            ],
            'employment-types' => [
                'headers' => ['code', 'name', 'is_permanent', 'description', 'status'],
                'samples' => [
                    ['PKWTT', 'Perjanjian Kerja Waktu Tidak Tertentu', '1', 'Karyawan tetap tanpa batas waktu', 'ACTIVE'],
                    ['PKWT', 'Perjanjian Kerja Waktu Tertentu', '0', 'Karyawan kontrak masa kerja tertentu', 'ACTIVE'],
                    ['PROBATION', 'Masa Percobaan (Probation)', '0', 'Karyawan masa percobaan 3 bulan', 'ACTIVE'],
                ],
            ],
            'work-locations' => [
                'headers' => ['code', 'name', 'description', 'risk_level', 'status'],
                'samples' => [
                    ['WA-PIT', 'Pit Penambangan Aktif', 'Area penambangan batubara dan loading overburden', 'TINGGI', 'ACTIVE'],
                    ['WA-WRK', 'Workshop Central Alat Berat', 'Area servis berkala dan overhaul alat tambang', 'SEDANG', 'ACTIVE'],
                    ['WA-OFF', 'Main Office Site', 'Gedung kantor administrasi dan manajemen site', 'RENDAH', 'ACTIVE'],
                ],
            ],
            'work-areas' => [
                'headers' => ['code', 'name', 'description', 'risk_level', 'status'],
                'samples' => [
                    ['WA-PIT', 'Pit Penambangan Aktif', 'Area penambangan batubara dan loading overburden', 'TINGGI', 'ACTIVE'],
                    ['WA-WRK', 'Workshop Central Alat Berat', 'Area servis berkala dan overhaul alat tambang', 'SEDANG', 'ACTIVE'],
                    ['WA-OFF', 'Main Office Site', 'Gedung kantor administrasi dan manajemen site', 'RENDAH', 'ACTIVE'],
                ],
            ],
            'poh' => [
                'headers' => ['code', 'name', 'destination_airport', 'additional_travel_days', 'status'],
                'samples' => [
                    ['POH-CGK', 'Jakarta', 'Bandar Udara Internasional Soekarno-Hatta (CGK)', '2', 'ACTIVE'],
                    ['POH-BPN', 'Balikpapan', 'Bandar Udara Internasional Sultan Aji Muhammad Sulaiman Sepinggan (BPN)', '1', 'ACTIVE'],
                    ['POH-SUB', 'Surabaya', 'Bandar Udara Internasional Juanda (SUB)', '2', 'ACTIVE'],
                ],
            ],
            'marital-statuses' => [
                'headers' => ['code', 'name', 'category', 'status'],
                'samples' => [
                    ['K0', 'Menikah Tanpa Tanggungan (K/0)', 'Menikah', 'ACTIVE'],
                    ['K1', 'Menikah 1 Tanggungan (K/1)', 'Menikah', 'ACTIVE'],
                    ['TK0', 'Tidak Menikah Tanpa Tanggungan (TK/0)', 'Tidak Menikah', 'ACTIVE'],
                ],
            ],
            'plafon-pengobatan' => [
                'headers' => ['salary_grade_code', 'marital_category', 'amount', 'period_type', 'description', 'status'],
                'samples' => [
                    ['GOL-1A', 'Menikah', '10000000', 'TAHUNAN', 'Plafon rawat jalan & inap tahunan (Karyawan + Keluarga)', 'ACTIVE'],
                    ['GOL-1A', 'Tidak Menikah', '5000000', 'TAHUNAN', 'Plafon rawat jalan & inap tahunan (Karyawan Lajang)', 'ACTIVE'],
                    ['GOL-4A', 'Menikah', '25000000', 'TAHUNAN', 'Plafon rawat jalan & inap tahunan (Karyawan + Keluarga)', 'ACTIVE'],
                ],
            ],
            'plafon-kacamata' => [
                'headers' => ['lens_type', 'frame_amount', 'lens_amount', 'period_type', 'description', 'status'],
                'samples' => [
                    ['Monofokus', '600000', '400000', '2_TAHUNAN', 'Lensa fokus tunggal (plus/minus)', 'ACTIVE'],
                    ['Monofokus Silindris', '600000', '600000', '2_TAHUNAN', 'Lensa fokus tunggal dengan silinder', 'ACTIVE'],
                    ['Progresif', '1000000', '1200000', '2_TAHUNAN', 'Lensa progresif multividang tanpa garis batas', 'ACTIVE'],
                ],
            ],
            'plafon-persalinan' => [
                'headers' => ['salary_grade_code', 'marital_category', 'amount', 'period_type', 'description', 'status'],
                'samples' => [
                    ['GOL-1A', 'Menikah', '8000000', 'PER_KASUS', 'Biaya persalinan normal maupun caesar per kelahiran', 'ACTIVE'],
                    ['GOL-4A', 'Menikah', '15000000', 'PER_KASUS', 'Biaya persalinan normal maupun caesar per kelahiran', 'ACTIVE'],
                ],
            ],
            'tunjangan-lapangan' => [
                'headers' => ['salary_grade_code', 'category_name', 'amount', 'period_type', 'description', 'status'],
                'samples' => [
                    ['GOL-1A', 'Pit Tambang & Operasional Front', '1500000', 'BULANAN', 'Penempatan pit tambang & hauling road', 'ACTIVE'],
                    ['GOL-4A', 'Pit Tambang & Operasional Front', '3500000', 'BULANAN', 'Penempatan pit tambang & hauling road', 'ACTIVE'],
                ],
            ],
            'uang-perdin' => [
                'headers' => ['salary_grade_code', 'zone_name', 'category_name', 'amount', 'period_type', 'description', 'status'],
                'samples' => [
                    ['GOL-1A', 'Luar Kota / Antar Provinsi', 'Uang Saku Harian', '300000', 'HARIAN', 'Perjalanan dinas luar provinsi/HO', 'ACTIVE'],
                    ['GOL-4A', 'Luar Kota / Antar Provinsi', 'Uang Saku Harian', '600000', 'HARIAN', 'Perjalanan dinas luar provinsi/HO', 'ACTIVE'],
                ],
            ],
            'bantuan-lumpsum' => [
                'headers' => ['salary_grade_code', 'category_name', 'amount', 'period_type', 'description', 'status'],
                'samples' => [
                    ['GOL-1A', 'Relokasi Site Tambang', '7500000', 'PER_KASUS', 'Bantuan lumpsum relokasi domisili karyawan ke site', 'ACTIVE'],
                    ['GOL-4A', 'Relokasi Site Tambang', '15000000', 'PER_KASUS', 'Bantuan lumpsum relokasi domisili karyawan ke site', 'ACTIVE'],
                ],
            ],
            'bantuan-komunikasi' => [
                'headers' => ['salary_grade_code', 'category_name', 'amount', 'period_type', 'description', 'status'],
                'samples' => [
                    ['GOL-1A', 'Paket Data & Komunikasi Lapangan', '250000', 'BULANAN', 'Voucher / penggantian pulsa & kuota data', 'ACTIVE'],
                    ['GOL-4A', 'Paket Data & Komunikasi Lapangan', '500000', 'BULANAN', 'Voucher / penggantian pulsa & kuota data', 'ACTIVE'],
                ],
            ],
            'bantuan-perumahan' => [
                'headers' => ['salary_grade_code', 'category_name', 'amount', 'period_type', 'description', 'status'],
                'samples' => [
                    ['GOL-1A', 'Tunjangan Perumahan Mandiri', '750000', 'BULANAN', 'Bantuan sewa tempat tinggal di luar fasilitas mess perusahaan', 'ACTIVE'],
                    ['GOL-4A', 'Tunjangan Perumahan Mandiri', '3500000', 'BULANAN', 'Bantuan sewa tempat tinggal di luar fasilitas mess perusahaan', 'ACTIVE'],
                ],
            ],
            'shifts' => [
                'headers' => ['code', 'name', 'start_time', 'end_time', 'break_minutes', 'status'],
                'samples' => [
                    ['SHIFT-DS', 'Day Shift Tambang', '06:00', '18:00', '60', 'ACTIVE'],
                    ['SHIFT-NS', 'Night Shift Tambang', '18:00', '06:00', '60', 'ACTIVE'],
                ],
            ],
            'users' => [
                'headers' => ['username', 'name', 'email', 'status', 'data_scope'],
                'samples' => [
                    ['joko.susanto', 'Joko Susanto', 'joko.susanto@cmn.mining.local', 'ACTIVE', 'SELF'],
                    ['budi.santoso', 'Budi Santoso', 'budi.santoso@cmn.mining.local', 'ACTIVE', 'SUBORDINATES'],
                ],
            ],
        ];

        if (!isset($templates[$entity])) {
            return $this->errorResponse('Template untuk entitas ini belum tersedia.', 404);
        }

        $template = $templates[$entity];
        $filename = "template_impor_{$entity}.csv";

        $responseHeaders = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($template) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for seamless Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, $template['headers']);

            foreach ($template['samples'] as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $responseHeaders);
    }

    /**
     * Get recent Import & Export Activity Logs from Audit Trail.
     */
    public function history(Request $request): JsonResponse
    {
        $logs = AuditLog::with('actor:id,name,username')
            ->whereIn('action', ['IMPORT', 'EXPORT'])
            ->orderByDesc('created_at')
            ->limit(30)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'module' => $log->module,
                    'actor' => $log->actor?->name ?? 'Administrator',
                    'username' => $log->actor?->username ?? 'admin',
                    'filename' => $log->new_values['filename'] ?? ($log->module . '.csv'),
                    'imported_count' => $log->new_values['imported_count'] ?? null,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                    'time_ago' => $log->created_at->diffForHumans(),
                ];
            });

        return $this->successResponse($logs, 'Riwayat impor dan ekspor berhasil dimuat.');
    }
}

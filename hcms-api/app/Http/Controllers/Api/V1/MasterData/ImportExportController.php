<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\CostCenter;
use App\Models\Grade;
use App\Models\JobFamily;
use App\Models\OrganizationCompany;
use App\Models\OrganizationJob;
use App\Models\OrganizationSite;
use App\Models\OrganizationUnit;
use App\Models\Position;
use App\Models\SalaryGrade;
use App\Models\Shift;
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
        'organization-units' => OrganizationUnit::class,
        'positions' => Position::class,
        'grades' => Grade::class,
        'salary-grades' => SalaryGrade::class,
        'job-families' => JobFamily::class,
        'jobs' => OrganizationJob::class,
        'work-locations' => WorkLocation::class,
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

        $rules = [
            'code' => ['required', 'string'],
            'name' => ['required', 'string'],
        ];

        if ($validated['entity'] === 'positions') {
            $rules = [
                'code' => ['required', 'string'],
                'title' => ['required', 'string'],
                'approved_headcount' => ['required', 'integer', 'min:1'],
            ];
        } elseif ($validated['entity'] === 'users') {
            $rules = [
                'username' => ['required', 'string'],
                'name' => ['required', 'string'],
                'email' => ['required', 'string'],
            ];
        }

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
     * Universal CSV exporter with audit logging.
     */
    public function export(Request $request, string $entity): StreamedResponse|JsonResponse
    {
        if (!isset($this->entityModelMap[$entity])) {
            return $this->errorResponse('Entitas ekspor tidak ditemukan.', 404);
        }

        $modelClass = $this->entityModelMap[$entity];
        $filename = "export_{$entity}_" . date('Ymd_His') . ".csv";

        $headers = match ($entity) {
            'companies' => ['Kode', 'Nama Perusahaan', 'Nama Legal', 'Nama Pendek', 'NPWP', 'Timezone', 'Status', 'Tanggal Dibuat'],
            'sites' => ['Kode Site', 'Nama Site', 'Nama Pendek', 'Tipe Site', 'Lokasi', 'Provinsi', 'Kota', 'Timezone', 'Status'],
            'organization-units' => ['Kode Unit', 'Nama Unit', 'Tipe Unit', 'Status', 'Tanggal Dibuat'],
            'positions' => ['Kode Posisi', 'Nama Posisi / Jabatan', 'Kuota Formasi', 'Status Aktif', 'Dibekukan', 'Tanggal Dibuat'],
            'grades' => ['Kode Grade', 'Nama Grade', 'Level', 'Status'],
            'salary-grades' => ['Kode Skala', 'Nama Skala Gaji', 'Gaji Pokok Min', 'Gaji Pokok Mid', 'Gaji Pokok Max'],
            'job-families' => ['Kode Rumpun', 'Nama Rumpun Jabatan', 'Deskripsi'],
            'jobs' => ['Kode Pekerjaan', 'Nama Pekerjaan', 'Deskripsi'],
            'work-locations' => ['Kode Lokasi', 'Nama Lokasi', 'Tipe Area', 'Status'],
            'cost-centers' => ['Kode Cost Center', 'Nama Cost Center', 'Deskripsi'],
            'shifts' => ['Kode Shift', 'Nama Shift', 'Jam Masuk', 'Jam Pulang', 'Istirahat (Menit)', 'Status'],
            'work-schedules' => ['Kode Jadwal', 'Nama Jadwal Kerja', 'Tipe Pola', 'Hari Kerja', 'Hari Libur'],
            'users' => ['Username', 'Nama Lengkap', 'Email', 'Status Akun', 'Cakupan Akses', 'Tanggal Bergabung'],
            default => ['Kode', 'Nama', 'Status', 'Tanggal Dibuat'],
        };

        $generator = function () use ($modelClass, $entity) {
            $items = $modelClass::cursor();
            foreach ($items as $item) {
                yield match ($entity) {
                    'companies' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->legal_name ?? '',
                        $item->short_name ?? '',
                        $item->tax_identifier ?? '',
                        $item->timezone ?? 'Asia/Makassar',
                        $item->is_active ? 'ACTIVE' : 'INACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'sites' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->short_name ?? '',
                        $item->site_type ?? 'MINING_SITE',
                        $item->location ?? '',
                        $item->province ?? '',
                        $item->city ?? '',
                        $item->timezone ?? 'Asia/Makassar',
                        $item->is_active ? 'ACTIVE' : 'INACTIVE',
                    ],
                    'organization-units' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->unit_type ?? '',
                        $item->is_active ? 'ACTIVE' : 'INACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'positions' => [
                        $item->code ?? '',
                        $item->title ?? '',
                        (string) ($item->approved_headcount ?? 1),
                        $item->is_active ? 'ACTIVE' : 'INACTIVE',
                        $item->is_frozen ? 'FROZEN' : 'ACTIVE',
                        $item->created_at ? $item->created_at->format('Y-m-d H:i') : '',
                    ],
                    'grades' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        (string) ($item->level ?? ''),
                        $item->is_active ? 'ACTIVE' : 'INACTIVE',
                    ],
                    'salary-grades' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        (string) ($item->min_salary ?? 0),
                        (string) ($item->mid_salary ?? 0),
                        (string) ($item->max_salary ?? 0),
                    ],
                    'job-families' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->description ?? '',
                    ],
                    'jobs' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->description ?? '',
                    ],
                    'work-locations' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->location_type ?? '',
                        $item->is_active ? 'ACTIVE' : 'INACTIVE',
                    ],
                    'cost-centers' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->description ?? '',
                    ],
                    'shifts' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->start_time ?? '',
                        $item->end_time ?? '',
                        (string) ($item->break_minutes ?? 60),
                        $item->is_active ? 'ACTIVE' : 'INACTIVE',
                    ],
                    'work-schedules' => [
                        $item->code ?? '',
                        $item->name ?? '',
                        $item->pattern_type ?? '',
                        (string) ($item->work_days ?? 0),
                        (string) ($item->off_days ?? 0),
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
                        $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : '',
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
     * Download Official Starter CSV Template with Sample Rows.
     */
    public function downloadTemplate(Request $request, string $entity): StreamedResponse|JsonResponse
    {
        $templates = [
            'companies' => [
                'headers' => ['code', 'name', 'legal_name', 'short_name', 'tax_identifier', 'timezone', 'description'],
                'samples' => [
                    ['CMN-CORP', 'PT Coal Mining Nusantara', 'PT Coal Mining Nusantara Tbk', 'CMN', '01.234.567.8-012.000', 'Asia/Makassar', 'Holding perusahaan pertambangan batubara terintegrasi'],
                    ['HRS-MINE', 'PT Hasnur Riung Sinergi', 'PT Hasnur Riung Sinergi Contractor', 'HRS', '02.987.654.3-098.000', 'Asia/Makassar', 'Kontraktor jasa penambangan pit Sangatta'],
                ],
            ],
            'sites' => [
                'headers' => ['code', 'name', 'short_name', 'site_type', 'location', 'province', 'city', 'timezone'],
                'samples' => [
                    ['SITE-SGT', 'Sangatta Coal Mine', 'SGT', 'MINING_SITE', 'Sangatta, Kutai Timur', 'Kalimantan Timur', 'Kutai Timur', 'Asia/Makassar'],
                    ['SITE-BGL', 'Bengalon East Pit', 'BGL', 'MINING_SITE', 'Bengalon, Kutai Timur', 'Kalimantan Timur', 'Kutai Timur', 'Asia/Makassar'],
                ],
            ],
            'organization-units' => [
                'headers' => ['code', 'name', 'unit_type', 'description'],
                'samples' => [
                    ['HCGA-SGT', 'Human Capital & General Affairs', 'DEPARTMENT', 'Departemen HCGA Operasional Site Sangatta'],
                    ['MINE-OPS-SGT', 'Mining Operations & Fleet', 'DEPARTMENT', 'Departemen Operasi Tambang dan Armada Berat'],
                ],
            ],
            'positions' => [
                'headers' => ['code', 'title', 'approved_headcount', 'job_type', 'critical_level'],
                'samples' => [
                    ['POS-HC-SPV', 'HC Operations Supervisor', '2', 'PERMANENT', 'CORE'],
                    ['POS-EXC-OPR', 'Excavator Heavy Operator', '15', 'PERMANENT', 'OPERATIONAL'],
                ],
            ],
            'grades' => [
                'headers' => ['code', 'name', 'level', 'description'],
                'samples' => [
                    ['GR-01', 'Operator Pratama', '1', 'Tingkat dasar operator alat berat tambang'],
                    ['GR-04', 'Supervisor Lapangan', '4', 'Pengawas shift dan keselamatan pit'],
                ],
            ],
            'salary-grades' => [
                'headers' => ['code', 'name', 'min_salary', 'mid_salary', 'max_salary'],
                'samples' => [
                    ['SG-OPR-01', 'Skala Operator Non-Staff', '5500000', '6800000', '8200000'],
                    ['SG-SPV-01', 'Skala Supervisor Staff', '9500000', '12500000', '16000000'],
                ],
            ],
            'job-families' => [
                'headers' => ['code', 'name', 'description'],
                'samples' => [
                    ['JF-MINE-OPS', 'Mining Operations', 'Operasi penambangan, penggalian, dan pengupasan overburden'],
                    ['JF-MAINT', 'Plant & Maintenance', 'Pemeliharaan dan perbaikan armada alat berat tambang'],
                ],
            ],
            'jobs' => [
                'headers' => ['code', 'name', 'description'],
                'samples' => [
                    ['JOB-OPR-HAUL', 'Hauling Truck Operator', 'Pengemudi dump truck batubara kapasitas 100T'],
                    ['JOB-OPR-DOZER', 'Track Bulldozer Operator', 'Operator alat berat perataan dan ripping tanah penutup'],
                ],
            ],
            'cost-centers' => [
                'headers' => ['code', 'name', 'description'],
                'samples' => [
                    ['CC-PROD-PIT1', 'Produksi Overburden Pit 1', 'Biaya operasional alat gali muat dan angkut Pit 1'],
                    ['CC-HC-GEN', 'Administrasi Umum HCGA Site', 'Biaya operasional personel dan fasilitas mess'],
                ],
            ],
            'work-locations' => [
                'headers' => ['code', 'name', 'location_type', 'description'],
                'samples' => [
                    ['LOC-PIT-NORTH', 'Pit Sangatta North Front', 'PIT_MINE', 'Area aktif penambangan batubara pit utara'],
                    ['LOC-WORKSHOP-A', 'Central Workshop Alat Berat', 'WORKSHOP', 'Fasilitas perawatan dan overhaul alat berat'],
                ],
            ],
            'shifts' => [
                'headers' => ['code', 'name', 'start_time', 'end_time', 'break_minutes', 'is_active'],
                'samples' => [
                    ['SHIFT-DS', 'Day Shift Tambang', '06:00', '18:00', '60', '1'],
                    ['SHIFT-NS', 'Night Shift Tambang', '18:00', '06:00', '60', '1'],
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

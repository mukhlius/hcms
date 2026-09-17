<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\CostCenter;
use App\Models\Grade;
use App\Models\JobFamily;
use App\Models\OrganizationCompany;
use App\Models\OrganizationJob;
use App\Models\OrganizationSite;
use App\Models\OrganizationUnit;
use App\Models\Position;
use App\Models\WorkLocation;
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
        'job-families' => JobFamily::class,
        'jobs' => OrganizationJob::class,
        'work-locations' => WorkLocation::class,
        'cost-centers' => CostCenter::class,
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

        $headers = ['Kode', 'Nama', 'Status', 'Tanggal Dibuat'];
        $generator = function () use ($modelClass) {
            $items = $modelClass::cursor();
            foreach ($items as $item) {
                yield [
                    $item->code ?? '',
                    $item->name ?? $item->title ?? '',
                    $item->status ?? ($item->is_active ? 'ACTIVE' : 'INACTIVE'),
                    $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : '',
                ];
            }
        };

        return $this->exportService->exportCsv(
            $filename,
            $headers,
            $generator(),
            strtoupper($entity)
        );
    }
}

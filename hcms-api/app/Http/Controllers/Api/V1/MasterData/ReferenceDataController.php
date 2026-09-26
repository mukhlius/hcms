<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\DocumentType;
use App\Models\GeographicReference;
use App\Models\LeaveType;
use App\Models\OvertimeType;
use App\Models\RecruitmentSource;
use App\Models\RelationshipType;
use App\Models\StandardReference;
use App\Models\TerminationReason;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ReferenceDataController extends BaseApiController
{
    // ================= GEOGRAPHIC =================
    public function geographic(Request $request): JsonResponse
    {
        $type = $request->query('type');
        $parentId = $request->query('parent_id');

        $cacheKey = "geo_ref_{$type}_{$parentId}";
        $data = Cache::remember($cacheKey, 3600, function () use ($type, $parentId) {
            $query = GeographicReference::query();
            if ($type) {
                $query->where('type', $type);
            }
            if ($parentId) {
                $query->where('parent_id', $parentId);
            }
            return $query->orderBy('name')->get()->toArray();
        });

        return $this->successResponse($data, 'Data referensi wilayah berhasil diambil.');
    }

    // ================= STANDARD REFERENCES (AGAMA, PENDIDIKAN, BANK, DLL) =================
    public function standard(Request $request): JsonResponse
    {
        $category = $request->query('category');
        $status = $request->query('status'); // 'ACTIVE', 'INACTIVE', or null for all
        $cacheKey = "std_ref_{$category}_{$status}";

        $data = Cache::remember($cacheKey, 3600, function () use ($category, $status) {
            $query = StandardReference::query();
            if (!empty($status)) {
                $query->where('status', $status);
            }
            if (!empty($category)) {
                $query->where('category', $category);
            }
            return $query->orderBy('name')->get()->toArray();
        });

        return $this->successResponse($data, 'Data referensi standar berhasil diambil.');
    }

    public static function clearStandardCache(?string $category = null): void
    {
        $statuses = ['', 'ACTIVE', 'INACTIVE'];
        $categories = $category ? [$category] : ['RELIGION', 'EDUCATION', 'MARITAL_STATUS', 'BLOOD_TYPE', 'BANK', 'UNIFORM_SIZE', 'PANTS_SIZE', 'SHOE_SIZE', 'POH', 'WORK_AREA', ''];

        foreach ($categories as $cat) {
            foreach ($statuses as $st) {
                Cache::forget("std_ref_{$cat}_{$st}");
                Cache::forget("std_ref_{$cat}");
                Cache::forget("std_ref__{$st}");
            }
        }
        Cache::forget("std_ref_");
    }

    public function storeStandard(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'in:RELIGION,EDUCATION,MARITAL_STATUS,BLOOD_TYPE,BANK,UNIFORM_SIZE,PANTS_SIZE,SHOE_SIZE,POH,WORK_AREA'],
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'metadata' => ['nullable', 'array'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = StandardReference::create($validated);
        self::clearStandardCache($item->category);

        AuditService::log('CREATE', 'STANDARD_REFERENCE', StandardReference::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Referensi standar berhasil dibuat.');
    }

    public function updateStandard(Request $request, StandardReference $standard): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'metadata' => ['nullable', 'array'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $standard->toArray();
        $standard->update($validated);

        self::clearStandardCache($standard->category);

        AuditService::log('UPDATE', 'STANDARD_REFERENCE', StandardReference::class, (string)$standard->id, oldValues: $old, newValues: $standard->toArray());

        return $this->successResponse($standard, 'Referensi standar berhasil diperbarui.');
    }

    public function destroyStandard(StandardReference $standard): JsonResponse
    {
        $old = $standard->toArray();
        $category = $standard->category;
        $standard->delete();

        self::clearStandardCache($category);

        AuditService::log('DELETE', 'STANDARD_REFERENCE', StandardReference::class, (string)$standard->id, oldValues: $old);

        return $this->successResponse(null, 'Referensi standar berhasil dihapus.');
    }

    // ================= DOCUMENT TYPES =================
    public function documentTypes(Request $request): JsonResponse
    {
        $docs = DocumentType::orderBy('name')->get();
        return $this->successResponse($docs, 'Data jenis dokumen berhasil diambil.');
    }

    public function storeDocumentType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:document_types,code'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:50'],
            'required' => ['nullable', 'boolean'],
            'expiry_required' => ['nullable', 'boolean'],
            'employee_required' => ['nullable', 'boolean'],
            'verification_required' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $doc = DocumentType::create($validated);
        AuditService::log('CREATE', 'DOCUMENT_TYPE', DocumentType::class, (string)$doc->id, newValues: $doc->toArray());

        return $this->createdResponse($doc, 'Jenis dokumen berhasil dibuat.');
    }

    public function updateDocumentType(Request $request, DocumentType $documentType): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', 'unique:document_types,code,' . $documentType->id],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:50'],
            'required' => ['nullable', 'boolean'],
            'expiry_required' => ['nullable', 'boolean'],
            'employee_required' => ['nullable', 'boolean'],
            'verification_required' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $documentType->toArray();
        $documentType->update($validated);
        AuditService::log('UPDATE', 'DOCUMENT_TYPE', DocumentType::class, (string)$documentType->id, oldValues: $old, newValues: $documentType->toArray());

        return $this->successResponse($documentType, 'Jenis dokumen berhasil diperbarui.');
    }

    public function destroyDocumentType(DocumentType $documentType): JsonResponse
    {
        $old = $documentType->toArray();
        $documentType->delete();
        AuditService::log('DELETE', 'DOCUMENT_TYPE', DocumentType::class, (string)$documentType->id, oldValues: $old);

        return $this->successResponse(null, 'Jenis dokumen berhasil dihapus.');
    }

    // ================= RELATIONSHIP TYPES =================
    public function relationshipTypes(Request $request): JsonResponse
    {
        $rels = RelationshipType::orderBy('name')->get();
        return $this->successResponse($rels, 'Data tipe relasi keluarga berhasil diambil.');
    }

    // ================= TERMINATION REASONS =================
    public function terminationReasons(Request $request): JsonResponse
    {
        $reasons = TerminationReason::orderBy('name')->get();
        return $this->successResponse($reasons, 'Data alasan terminasi berhasil diambil.');
    }

    // ================= LEAVE TYPES =================
    public function leaveTypes(Request $request): JsonResponse
    {
        $leaves = LeaveType::orderBy('name')->get();
        return $this->successResponse($leaves, 'Data jenis cuti & izin berhasil diambil.');
    }

    // ================= OVERTIME TYPES =================
    public function overtimeTypes(Request $request): JsonResponse
    {
        $ots = OvertimeType::orderBy('name')->get();
        return $this->successResponse($ots, 'Data jenis lembur berhasil diambil.');
    }

    // ================= RECRUITMENT SOURCES =================
    public function recruitmentSources(Request $request): JsonResponse
    {
        $sources = RecruitmentSource::orderBy('name')->get();
        return $this->successResponse($sources, 'Data sumber rekrutmen berhasil diambil.');
    }
}

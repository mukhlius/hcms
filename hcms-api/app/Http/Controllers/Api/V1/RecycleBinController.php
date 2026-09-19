<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\OrganizationCompany;
use App\Models\OrganizationSite;
use App\Models\OrganizationDepartment;
use App\Models\OrganizationSection;
use App\Models\OrganizationUnit;
use App\Models\Position;
use App\Models\EmploymentType;
use App\Models\BenefitPlafond;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecycleBinController extends BaseApiController
{
    /**
     * Map of supported entities, their model classes, and relations/search config.
     */
    protected array $entityMap = [
        'users' => [
            'model' => User::class,
            'label' => 'Pengguna & Personel',
            'with' => ['roles', 'site', 'department', 'company'],
            'search_fields' => ['name', 'username', 'email'],
            'code_field' => 'username',
            'name_field' => 'name',
            'type_label' => 'Pengguna',
        ],
        'companies' => [
            'model' => OrganizationCompany::class,
            'label' => 'Perusahaan',
            'with' => [],
            'search_fields' => ['name', 'code', 'legal_name'],
            'code_field' => 'code',
            'name_field' => 'name',
            'type_label' => 'Perusahaan',
        ],
        'sites' => [
            'model' => OrganizationSite::class,
            'label' => 'Site Tambang',
            'with' => ['company'],
            'search_fields' => ['name', 'code'],
            'code_field' => 'code',
            'name_field' => 'name',
            'type_label' => 'Site Tambang',
        ],
        'departments' => [
            'model' => OrganizationDepartment::class,
            'label' => 'Departemen',
            'with' => ['company', 'site', 'leader'],
            'search_fields' => ['name', 'code', 'description'],
            'code_field' => 'code',
            'name_field' => 'name',
            'type_label' => 'Departemen',
        ],
        'sections' => [
            'model' => OrganizationSection::class,
            'label' => 'Seksi Lapangan',
            'with' => ['company', 'site', 'department', 'leader'],
            'search_fields' => ['name', 'code', 'description'],
            'code_field' => 'code',
            'name_field' => 'name',
            'type_label' => 'Seksi Lapangan',
        ],
        'positions' => [
            'model' => Position::class,
            'label' => 'Jabatan & Posisi',
            'with' => ['site', 'department', 'section', 'grade'],
            'search_fields' => ['title', 'code'],
            'code_field' => 'code',
            'name_field' => 'title',
            'type_label' => 'Jabatan & Posisi',
        ],
        'employment-types' => [
            'model' => EmploymentType::class,
            'label' => 'Hubungan Kerja',
            'with' => [],
            'search_fields' => ['name', 'code', 'description'],
            'code_field' => 'code',
            'name_field' => 'name',
            'type_label' => 'Hubungan Kerja',
        ],
        'benefit-plafonds' => [
            'model' => BenefitPlafond::class,
            'label' => 'Plafon Benefit',
            'with' => ['salaryGrade'],
            'search_fields' => ['benefit_type', 'lens_type', 'category_name', 'zone_name', 'description'],
            'code_field' => 'benefit_type',
            'name_field' => 'benefit_type',
            'type_label' => 'Plafon Benefit',
        ],
        'units' => [
            'model' => OrganizationUnit::class,
            'label' => 'Unit Organisasi (Legacy)',
            'with' => ['company', 'site', 'parent'],
            'search_fields' => ['name', 'code'],
            'code_field' => 'code',
            'name_field' => 'name',
            'type_label' => 'Unit Organisasi',
        ],
    ];

    /**
     * Get summary counts of soft-deleted items across all supported entities.
     */
    public function summary(): JsonResponse
    {
        $counts = [];
        foreach ($this->entityMap as $key => $config) {
            /** @var \Illuminate\Database\Eloquent\Model $modelClass */
            $modelClass = $config['model'];
            $counts[$key] = $modelClass::onlyTrashed()->count();
        }

        return $this->successResponse($counts, 'Ringkasan tempat sampah berhasil diambil.');
    }

    /**
     * Get paginated soft-deleted items for a specific entity.
     */
    public function index(string $entity, Request $request): JsonResponse
    {
        if (!isset($this->entityMap[$entity])) {
            return $this->errorResponse("Entitas '{$entity}' tidak didukung dalam tempat sampah.", 'INVALID_ENTITY', null, 404);
        }

        $config = $this->entityMap[$entity];
        $modelClass = $config['model'];

        $query = $modelClass::onlyTrashed();

        if (!empty($config['with'])) {
            $query->with($config['with']);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search, $config) {
                foreach ($config['search_fields'] as $index => $field) {
                    if ($index === 0) {
                        $q->where($field, 'like', "%{$search}%");
                    } else {
                        $q->orWhere($field, 'like', "%{$search}%");
                    }
                }
            });
        }

        $query->orderBy('deleted_at', 'desc');

        $perPage = (int)$request->input('per_page', 15);
        $paginated = $query->paginate($perPage);

        return $this->successResponse($paginated, "Data terhapus entitas {$config['label']} berhasil diambil.");
    }

    /**
     * Restore a soft-deleted item.
     */
    public function restore(string $entity, int|string $id): JsonResponse
    {
        if (!isset($this->entityMap[$entity])) {
            return $this->errorResponse("Entitas '{$entity}' tidak didukung.", 'INVALID_ENTITY', null, 404);
        }

        $config = $this->entityMap[$entity];
        $modelClass = $config['model'];

        $item = $modelClass::onlyTrashed()->find($id);
        if (!$item) {
            return $this->errorResponse("Data tidak ditemukan di tempat sampah.", 'NOT_FOUND', null, 404);
        }

        DB::transaction(function () use ($item, $config, $modelClass, $id) {
            $item->restore();

            AuditService::log(
                action: 'RESTORE',
                module: 'RECYCLE_BIN',
                entityType: $modelClass,
                entityId: (string)$id,
                oldValues: null,
                newValues: $item->fresh()->toArray()
            );
        });

        return $this->successResponse($item, "Data '{$config['label']}' berhasil dipulihkan.");
    }

    /**
     * Force delete a soft-deleted item permanently.
     */
    public function forceDelete(string $entity, int|string $id): JsonResponse
    {
        if (!isset($this->entityMap[$entity])) {
            return $this->errorResponse("Entitas '{$entity}' tidak didukung.", 'INVALID_ENTITY', null, 404);
        }

        $config = $this->entityMap[$entity];
        $modelClass = $config['model'];

        $item = $modelClass::onlyTrashed()->find($id);
        if (!$item) {
            return $this->errorResponse("Data tidak ditemukan di tempat sampah.", 'NOT_FOUND', null, 404);
        }

        // Prevent permanently deleting super admin
        if ($entity === 'users' && method_exists($item, 'hasRole') && $item->hasRole('SUPER_ADMIN')) {
            return $this->errorResponse('Super Administrator sistem tidak dapat dihapus secara permanen.', 'FORBIDDEN_ACTION', null, 403);
        }

        $oldValues = $item->toArray();

        DB::transaction(function () use ($item, $config, $modelClass, $id, $oldValues) {
            $item->forceDelete();

            AuditService::log(
                action: 'FORCE_DELETE',
                module: 'RECYCLE_BIN',
                entityType: $modelClass,
                entityId: (string)$id,
                oldValues: $oldValues,
                newValues: null
            );
        });

        return $this->successResponse(null, "Data '{$config['label']}' berhasil dihapus secara permanen.");
    }

    /**
     * Restore multiple soft-deleted items in bulk.
     */
    public function bulkRestore(string $entity, Request $request): JsonResponse
    {
        if (!isset($this->entityMap[$entity])) {
            return $this->errorResponse("Entitas '{$entity}' tidak didukung.", 'INVALID_ENTITY', null, 404);
        }

        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required'],
        ]);

        $config = $this->entityMap[$entity];
        $modelClass = $config['model'];
        $ids = $request->input('ids');

        $items = $modelClass::onlyTrashed()->whereIn('id', $ids)->get();

        if ($items->isEmpty()) {
            return $this->errorResponse("Tidak ada data yang ditemukan di tempat sampah untuk dipulihkan.", 'NOT_FOUND', null, 404);
        }

        $restoredCount = 0;
        DB::transaction(function () use ($items, $modelClass, &$restoredCount) {
            foreach ($items as $item) {
                $item->restore();
                $restoredCount++;

                AuditService::log(
                    action: 'RESTORE',
                    module: 'RECYCLE_BIN',
                    entityType: $modelClass,
                    entityId: (string)$item->id,
                    oldValues: null,
                    newValues: $item->fresh()->toArray()
                );
            }
        });

        return $this->successResponse([
            'restored_count' => $restoredCount,
        ], "{$restoredCount} data {$config['label']} berhasil dipulihkan.");
    }

    /**
     * Permanently delete multiple soft-deleted items in bulk.
     */
    public function bulkForceDelete(string $entity, Request $request): JsonResponse
    {
        if (!isset($this->entityMap[$entity])) {
            return $this->errorResponse("Entitas '{$entity}' tidak didukung.", 'INVALID_ENTITY', null, 404);
        }

        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required'],
        ]);

        $config = $this->entityMap[$entity];
        $modelClass = $config['model'];
        $ids = $request->input('ids');

        $items = $modelClass::onlyTrashed()->whereIn('id', $ids)->get();

        if ($items->isEmpty()) {
            return $this->errorResponse("Tidak ada data yang ditemukan di tempat sampah untuk dihapus permanen.", 'NOT_FOUND', null, 404);
        }

        $deletedCount = 0;
        DB::transaction(function () use ($items, $modelClass, $entity, &$deletedCount) {
            foreach ($items as $item) {
                // Prevent permanently deleting super admin
                if ($entity === 'users' && method_exists($item, 'hasRole') && $item->hasRole('SUPER_ADMIN')) {
                    continue;
                }

                $oldValues = $item->toArray();
                $item->forceDelete();
                $deletedCount++;

                AuditService::log(
                    action: 'FORCE_DELETE',
                    module: 'RECYCLE_BIN',
                    entityType: $modelClass,
                    entityId: (string)$item->id,
                    oldValues: $oldValues,
                    newValues: null
                );
            }
        });

        return $this->successResponse([
            'deleted_count' => $deletedCount,
        ], "{$deletedCount} data {$config['label']} berhasil dihapus secara permanen.");
    }
}

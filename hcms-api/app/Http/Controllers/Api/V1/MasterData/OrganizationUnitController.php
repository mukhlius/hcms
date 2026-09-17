<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\OrganizationUnit;
use App\Services\AuditService;
use App\Services\HierarchyValidator;
use App\Services\OrganizationTreeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganizationUnitController extends BaseApiController
{
    public function __construct(
        protected OrganizationTreeService $treeService
    ) {}

    public function tree(Request $request): JsonResponse
    {
        $companyId = $request->query('company_id') ? (int)$request->query('company_id') : null;
        $status = $request->query('status');

        $tree = $this->treeService->getTree($companyId, $status);

        return $this->successResponse($tree, 'Pohon struktur organisasi berhasil diambil.');
    }

    public function index(Request $request): JsonResponse
    {
        $query = OrganizationUnit::with(['parent:id,code,name,type', 'company:id,code,name', 'site:id,code,name', 'leader:id,name,email'])
            ->withCount(['children', 'positions']);

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->query('company_id'));
        }

        if ($request->filled('site_id')) {
            $query->where('site_id', $request->query('site_id'));
        }

        if ($request->filled('parent_id')) {
            $query->where('parent_id', $request->query('parent_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 20), 100);
        $units = $query->orderBy('name')->paginate($perPage);

        return $this->successResponse($units, 'Daftar unit organisasi berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:organization_companies,id'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'parent_id' => ['nullable', 'exists:organization_units,id'],
            'type' => ['required', 'string', 'in:BUSINESS_UNIT,DIVISION,DEPARTMENT,SECTION,SUB_SECTION,OTHER'],
            'code' => ['required', 'string', 'max:50', 'unique:organization_units,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'leader_user_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $unit = DB::transaction(function () use ($validated) {
            $validated['status'] = $validated['status'] ?? 'ACTIVE';

            $unit = OrganizationUnit::create($validated);

            AuditService::log(
                action: 'CREATE',
                module: 'ORGANIZATION_UNIT',
                entityType: OrganizationUnit::class,
                entityId: (string)$unit->id,
                newValues: $unit->toArray()
            );

            return $unit;
        });

        return $this->createdResponse($unit->load(['parent', 'company']), 'Unit organisasi berhasil dibuat.');
    }

    public function show(OrganizationUnit $unit): JsonResponse
    {
        $unit->load(['parent', 'company', 'site', 'leader:id,name,email', 'children', 'positions.grade']);
        $breadcrumbs = $this->treeService->getBreadcrumbs($unit);

        $auditLogs = AuditLog::where('entity_type', OrganizationUnit::class)
            ->where('entity_id', (string)$unit->id)
            ->with('actor:id,name,email')
            ->latest()
            ->take(15)
            ->get();

        return $this->successResponse([
            'unit' => $unit,
            'breadcrumbs' => $breadcrumbs,
            'audit_trail' => $auditLogs,
        ], 'Detail unit organisasi berhasil diambil.');
    }

    public function update(Request $request, OrganizationUnit $unit): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:organization_companies,id'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'parent_id' => ['nullable', 'exists:organization_units,id'],
            'type' => ['required', 'string', 'in:BUSINESS_UNIT,DIVISION,DEPARTMENT,SECTION,SUB_SECTION,OTHER'],
            'code' => ['required', 'string', 'max:50', "unique:organization_units,code,{$unit->id}"],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'leader_user_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        if (isset($validated['parent_id']) && $validated['parent_id'] != $unit->parent_id) {
            HierarchyValidator::validateUnitParent($unit->id, $validated['parent_id']);
        }

        $oldValues = $unit->toArray();

        $unit = DB::transaction(function () use ($unit, $validated, $oldValues) {
            $unit->update($validated);

            AuditService::log(
                action: 'UPDATE',
                module: 'ORGANIZATION_UNIT',
                entityType: OrganizationUnit::class,
                entityId: (string)$unit->id,
                oldValues: $oldValues,
                newValues: $unit->fresh()->toArray()
            );

            return $unit;
        });

        return $this->successResponse($unit->load(['parent', 'company']), 'Unit organisasi berhasil diperbarui.');
    }

    public function move(Request $request, OrganizationUnit $unit): JsonResponse
    {
        $validated = $request->validate([
            'new_parent_id' => ['nullable', 'exists:organization_units,id'],
        ]);

        $newParentId = $validated['new_parent_id'] ?? null;
        HierarchyValidator::validateUnitParent($unit->id, $newParentId);

        $oldParentId = $unit->parent_id;

        DB::transaction(function () use ($unit, $newParentId, $oldParentId) {
            $unit->update(['parent_id' => $newParentId]);

            AuditService::log(
                action: 'MOVE',
                module: 'ORGANIZATION_UNIT',
                entityType: OrganizationUnit::class,
                entityId: (string)$unit->id,
                oldValues: ['parent_id' => $oldParentId],
                newValues: ['parent_id' => $newParentId]
            );
        });

        return $this->successResponse($unit->fresh()->load('parent'), 'Unit organisasi berhasil dipindahkan dalam hierarki.');
    }

    public function activate(OrganizationUnit $unit): JsonResponse
    {
        $old = $unit->toArray();
        $unit->update(['status' => 'ACTIVE']);

        AuditService::log(
            action: 'ACTIVATE',
            module: 'ORGANIZATION_UNIT',
            entityType: OrganizationUnit::class,
            entityId: (string)$unit->id,
            oldValues: $old,
            newValues: $unit->fresh()->toArray()
        );

        return $this->successResponse($unit, 'Unit organisasi berhasil diaktifkan.');
    }

    public function deactivate(OrganizationUnit $unit): JsonResponse
    {
        $activeChildrenCount = $unit->children()->where('status', 'ACTIVE')->count();
        if ($activeChildrenCount > 0) {
            return $this->errorResponse("Unit tidak dapat dinonaktifkan karena memiliki {$activeChildrenCount} subunit aktif.", 422);
        }

        $activePositionsCount = $unit->positions()->where('status', 'ACTIVE')->count();
        if ($activePositionsCount > 0) {
            return $this->errorResponse("Unit tidak dapat dinonaktifkan karena memiliki {$activePositionsCount} posisi jabatan aktif.", 422);
        }

        $old = $unit->toArray();
        $unit->update(['status' => 'INACTIVE']);

        AuditService::log(
            action: 'DEACTIVATE',
            module: 'ORGANIZATION_UNIT',
            entityType: OrganizationUnit::class,
            entityId: (string)$unit->id,
            oldValues: $old,
            newValues: $unit->fresh()->toArray()
        );

        return $this->successResponse($unit, 'Unit organisasi berhasil dinonaktifkan.');
    }

    public function destroy(OrganizationUnit $unit): JsonResponse
    {
        $childrenCount = $unit->children()->count();
        if ($childrenCount > 0) {
            return $this->errorResponse("Unit tidak dapat dihapus karena memiliki {$childrenCount} subunit.", 422);
        }

        $positionsCount = $unit->positions()->count();
        if ($positionsCount > 0) {
            return $this->errorResponse("Unit tidak dapat dihapus karena memiliki {$positionsCount} posisi jabatan terkait.", 422);
        }

        $oldValues = $unit->toArray();

        DB::transaction(function () use ($unit, $oldValues) {
            $unit->delete();

            AuditService::log(
                action: 'DELETE',
                module: 'ORGANIZATION_UNIT',
                entityType: OrganizationUnit::class,
                entityId: (string)$unit->id,
                oldValues: $oldValues
            );
        });

        return $this->successResponse(null, 'Unit organisasi berhasil dihapus.');
    }
}

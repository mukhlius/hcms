<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\OrganizationDepartment;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepartmentController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = OrganizationDepartment::with([
            'company:id,code,name',
            'site:id,code,name',
            'leader:id,name,email',
        ])->withCount(['sections', 'users']);

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->query('company_id'));
        }

        if ($request->filled('site_id')) {
            $query->where('site_id', $request->query('site_id'));
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

        $perPage = min((int)$request->query('per_page', 20), 500);
        $departments = $query->orderBy('name')->paginate($perPage);

        return $this->successResponse($departments, 'Daftar departemen berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:organization_companies,id'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'code' => ['required', 'string', 'max:50', 'unique:organization_departments,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'leader_user_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $department = DB::transaction(function () use ($validated) {
            $validated['status'] = $validated['status'] ?? 'ACTIVE';
            $validated['is_active'] = $validated['status'] === 'ACTIVE';

            $dept = OrganizationDepartment::create($validated);

            AuditService::log(
                action: 'CREATE',
                module: 'ORGANIZATION_DEPARTMENT',
                entityType: OrganizationDepartment::class,
                entityId: (string)$dept->id,
                newValues: $dept->toArray()
            );

            return $dept;
        });

        return $this->createdResponse(
            $department->load(['company:id,code,name', 'site:id,code,name', 'leader:id,name']),
            'Departemen berhasil ditambahkan.'
        );
    }

    public function show(OrganizationDepartment $department): JsonResponse
    {
        $department->load([
            'company:id,code,name',
            'site:id,code,name',
            'leader:id,name,email',
            'sections:id,department_id,code,name,status',
        ])->loadCount(['sections', 'users']);

        $auditTrail = AuditLog::where('entity_type', OrganizationDepartment::class)
            ->where('entity_id', $department->id)
            ->with('user:id,name,email')
            ->latest()
            ->take(10)
            ->get();

        return $this->successResponse([
            'department' => $department,
            'audit_trail' => $auditTrail,
        ], 'Detail departemen berhasil diambil.');
    }

    public function update(Request $request, OrganizationDepartment $department): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['sometimes', 'required', 'exists:organization_companies,id'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'code' => ['sometimes', 'required', 'string', 'max:50', "unique:organization_departments,code,{$department->id}"],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'leader_user_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $oldValues = $department->toArray();

        DB::transaction(function () use ($department, $validated, $oldValues) {
            if (isset($validated['status'])) {
                $validated['is_active'] = $validated['status'] === 'ACTIVE';
            }
            $department->update($validated);

            AuditService::log(
                action: 'UPDATE',
                module: 'ORGANIZATION_DEPARTMENT',
                entityType: OrganizationDepartment::class,
                entityId: (string)$department->id,
                oldValues: $oldValues,
                newValues: $department->getChanges()
            );
        });

        return $this->successResponse(
            $department->fresh(['company:id,code,name', 'site:id,code,name', 'leader:id,name']),
            'Departemen berhasil diperbarui.'
        );
    }

    public function destroy(OrganizationDepartment $department): JsonResponse
    {
        // Prevent deletion if it has sections
        if ($department->sections()->exists()) {
            return $this->errorResponse('Tidak dapat menghapus departemen yang masih memiliki data seksi (section).', 422);
        }

        $old = $department->toArray();

        $department->delete();

        AuditService::log(
            action: 'DELETE',
            module: 'ORGANIZATION_DEPARTMENT',
            entityType: OrganizationDepartment::class,
            entityId: (string)$department->id,
            oldValues: $old
        );

        return $this->successResponse(null, 'Departemen berhasil dihapus.');
    }

    public function activate(OrganizationDepartment $department): JsonResponse
    {
        $department->update(['status' => 'ACTIVE', 'is_active' => true]);

        AuditService::log(
            action: 'ACTIVATE',
            module: 'ORGANIZATION_DEPARTMENT',
            entityType: OrganizationDepartment::class,
            entityId: (string)$department->id
        );

        return $this->successResponse($department, 'Departemen berhasil diaktifkan.');
    }

    public function deactivate(OrganizationDepartment $department): JsonResponse
    {
        $department->update(['status' => 'INACTIVE', 'is_active' => false]);

        AuditService::log(
            action: 'DEACTIVATE',
            module: 'ORGANIZATION_DEPARTMENT',
            entityType: OrganizationDepartment::class,
            entityId: (string)$department->id
        );

        return $this->successResponse($department, 'Departemen berhasil dinonaktifkan.');
    }
}

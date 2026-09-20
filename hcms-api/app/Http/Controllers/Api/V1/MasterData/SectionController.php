<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\OrganizationSection;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SectionController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = OrganizationSection::with([
            'department:id,code,name,site_id',
            'company:id,code,name',
            'site:id,code,name',
            'leader:id,name,email',
        ])->withCount(['users', 'positions']);

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

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
        $sections = $query->orderBy('name')->paginate($perPage);

        return $this->successResponse($sections, 'Daftar seksi (section) berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:organization_companies,id'],
            'department_id' => ['required', 'exists:organization_departments,id'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'code' => ['required', 'string', 'max:50', 'unique:organization_sections,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'leader_user_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $section = DB::transaction(function () use ($validated) {
            $validated['status'] = $validated['status'] ?? 'ACTIVE';

            $sec = OrganizationSection::create($validated);

            AuditService::log(
                action: 'CREATE',
                module: 'ORGANIZATION_SECTION',
                entityType: OrganizationSection::class,
                entityId: (string)$sec->id,
                newValues: $sec->toArray()
            );

            return $sec;
        });

        return $this->createdResponse(
            $section->load(['department:id,code,name,site_id', 'company:id,code,name', 'site:id,code,name', 'leader:id,name']),
            'Seksi (section) berhasil ditambahkan.'
        );
    }

    public function show(OrganizationSection $section): JsonResponse
    {
        $section->load([
            'department:id,code,name,site_id',
            'company:id,code,name',
            'site:id,code,name',
            'leader:id,name,email',
        ])->loadCount(['users']);

        $auditTrail = AuditLog::where('entity_type', OrganizationSection::class)
            ->where('entity_id', $section->id)
            ->with('user:id,name,email')
            ->latest()
            ->take(10)
            ->get();

        return $this->successResponse([
            'section' => $section,
            'audit_trail' => $auditTrail,
        ], 'Detail seksi berhasil diambil.');
    }

    public function update(Request $request, OrganizationSection $section): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['sometimes', 'required', 'exists:organization_companies,id'],
            'department_id' => ['sometimes', 'required', 'exists:organization_departments,id'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'code' => ['sometimes', 'required', 'string', 'max:50', "unique:organization_sections,code,{$section->id}"],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'leader_user_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $oldValues = $section->toArray();

        DB::transaction(function () use ($section, $validated, $oldValues) {
            $section->update($validated);

            AuditService::log(
                action: 'UPDATE',
                module: 'ORGANIZATION_SECTION',
                entityType: OrganizationSection::class,
                entityId: (string)$section->id,
                oldValues: $oldValues,
                newValues: $section->getChanges()
            );
        });

        return $this->successResponse(
            $section->fresh(['department:id,code,name,site_id', 'company:id,code,name', 'site:id,code,name', 'leader:id,name']),
            'Seksi berhasil diperbarui.'
        );
    }

    public function destroy(OrganizationSection $section): JsonResponse
    {
        $old = $section->toArray();

        $section->delete();

        AuditService::log(
            action: 'DELETE',
            module: 'ORGANIZATION_SECTION',
            entityType: OrganizationSection::class,
            entityId: (string)$section->id,
            oldValues: $old
        );

        return $this->successResponse(null, 'Seksi berhasil dihapus.');
    }

    public function activate(OrganizationSection $section): JsonResponse
    {
        $section->update(['status' => 'ACTIVE']);

        AuditService::log(
            action: 'ACTIVATE',
            module: 'ORGANIZATION_SECTION',
            entityType: OrganizationSection::class,
            entityId: (string)$section->id
        );

        return $this->successResponse($section, 'Seksi berhasil diaktifkan.');
    }

    public function deactivate(OrganizationSection $section): JsonResponse
    {
        $section->update(['status' => 'INACTIVE']);

        AuditService::log(
            action: 'DEACTIVATE',
            module: 'ORGANIZATION_SECTION',
            entityType: OrganizationSection::class,
            entityId: (string)$section->id
        );

        return $this->successResponse($section, 'Seksi berhasil dinonaktifkan.');
    }
}

<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\OrganizationSite;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiteController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = OrganizationSite::with(['company:id,code,name'])->withCount(['workLocations']);

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->query('company_id'));
        }

        if ($request->filled('site_type')) {
            $query->where('site_type', $request->query('site_type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('short_name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 15), 100);
        $sites = $query->latest()->paginate($perPage);

        return $this->successResponse($sites, 'Daftar site berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:organization_companies,id'],
            'code' => ['required', 'string', 'max:50', 'unique:organization_sites,code'],
            'name' => ['required', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:50'],
            'site_type' => ['nullable', 'string', 'in:MINING_SITE,HEAD_OFFICE,BRANCH_OFFICE,WAREHOUSE,REMOTE_CAMP,PROJECT_SITE'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'country' => ['nullable', 'string', 'max:10'],
            'province' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $site = DB::transaction(function () use ($validated) {
            $validated['status'] = $validated['status'] ?? 'ACTIVE';
            $validated['is_active'] = $validated['status'] === 'ACTIVE';

            $site = OrganizationSite::create($validated);

            AuditService::log(
                action: 'CREATE',
                module: 'SITE_MANAGEMENT',
                entityType: OrganizationSite::class,
                entityId: (string)$site->id,
                newValues: $site->toArray()
            );

            return $site;
        });

        return $this->createdResponse($site->load('company'), 'Site berhasil dibuat.');
    }

    public function show(OrganizationSite $site): JsonResponse
    {
        $site->load(['company', 'workLocations']);
        $auditLogs = AuditLog::where('entity_type', OrganizationSite::class)
            ->where('entity_id', (string)$site->id)
            ->with('actor:id,name,email')
            ->latest()
            ->take(15)
            ->get();

        return $this->successResponse([
            'site' => $site,
            'audit_trail' => $auditLogs,
        ], 'Detail site berhasil diambil.');
    }

    public function update(Request $request, OrganizationSite $site): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:organization_companies,id'],
            'code' => ['required', 'string', 'max:50', "unique:organization_sites,code,{$site->id}"],
            'name' => ['required', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:50'],
            'site_type' => ['nullable', 'string', 'in:MINING_SITE,HEAD_OFFICE,BRANCH_OFFICE,WAREHOUSE,REMOTE_CAMP,PROJECT_SITE'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'country' => ['nullable', 'string', 'max:10'],
            'province' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $oldValues = $site->toArray();

        $site = DB::transaction(function () use ($site, $validated, $oldValues) {
            if (isset($validated['status'])) {
                $validated['is_active'] = $validated['status'] === 'ACTIVE';
            }

            $site->update($validated);

            AuditService::log(
                action: 'UPDATE',
                module: 'SITE_MANAGEMENT',
                entityType: OrganizationSite::class,
                entityId: (string)$site->id,
                oldValues: $oldValues,
                newValues: $site->fresh()->toArray()
            );

            return $site;
        });

        return $this->successResponse($site->load('company'), 'Site berhasil diperbarui.');
    }

    public function activate(OrganizationSite $site): JsonResponse
    {
        $old = $site->toArray();
        $site->update(['status' => 'ACTIVE', 'is_active' => true]);

        AuditService::log(
            action: 'ACTIVATE',
            module: 'SITE_MANAGEMENT',
            entityType: OrganizationSite::class,
            entityId: (string)$site->id,
            oldValues: $old,
            newValues: $site->fresh()->toArray()
        );

        return $this->successResponse($site, 'Site berhasil diaktifkan.');
    }

    public function deactivate(OrganizationSite $site): JsonResponse
    {
        $activeLocations = $site->workLocations()->where('status', 'ACTIVE')->count();
        if ($activeLocations > 0) {
            return $this->errorResponse("Site tidak dapat dinonaktifkan karena masih memiliki {$activeLocations} lokasi kerja aktif.", 422);
        }

        $old = $site->toArray();
        $site->update(['status' => 'INACTIVE', 'is_active' => false]);

        AuditService::log(
            action: 'DEACTIVATE',
            module: 'SITE_MANAGEMENT',
            entityType: OrganizationSite::class,
            entityId: (string)$site->id,
            oldValues: $old,
            newValues: $site->fresh()->toArray()
        );

        return $this->successResponse($site, 'Site berhasil dinonaktifkan.');
    }

    public function destroy(OrganizationSite $site): JsonResponse
    {
        $locationsCount = $site->workLocations()->count();
        if ($locationsCount > 0) {
            return $this->errorResponse("Site tidak dapat dihapus karena masih memiliki {$locationsCount} lokasi kerja terkait.", 'INTEGRITY_VIOLATION', null, 422);
        }

        $departmentsCount = $site->departments()->count();
        if ($departmentsCount > 0) {
            return $this->errorResponse("Site tidak dapat dihapus karena masih memiliki {$departmentsCount} departemen terkait.", 'INTEGRITY_VIOLATION', null, 422);
        }

        $old = $site->toArray();
        $site->delete();

        AuditService::log(
            action: 'DELETE',
            module: 'SITE_MANAGEMENT',
            entityType: OrganizationSite::class,
            entityId: (string)$site->id,
            oldValues: $old
        );

        return $this->successResponse(null, 'Site berhasil dihapus.');
    }
}

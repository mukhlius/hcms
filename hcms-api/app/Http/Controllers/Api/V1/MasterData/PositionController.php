<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\Position;
use App\Services\AuditService;
use App\Services\HierarchyValidator;
use App\Services\PositionControlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PositionController extends BaseApiController
{
    public function __construct(
        protected PositionControlService $positionControlService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Position::with([
            'site:id,code,name',
            'department:id,code,name',
            'section:id,code,name',
            'organizationUnit:id,code,name,type',
            'job:id,code,name',
            'jobFamily:id,code,name',
            'grade:id,code,name,level',
            'reportsTo:id,code,title',
            'workLocation:id,code,name',
            'costCenter:id,code,name',
        ]);

        if ($request->filled('site_id')) {
            $query->where('site_id', $request->query('site_id'));
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->query('section_id'));
        }

        if ($request->filled('organization_unit_id')) {
            $query->where('organization_unit_id', $request->query('organization_unit_id'));
        }

        if ($request->filled('company_id')) {
            $companyId = $request->query('company_id');
            $query->where(function ($q) use ($companyId) {
                $q->whereHas('department', function ($dq) use ($companyId) {
                    $dq->where('company_id', $companyId);
                })->orWhereHas('site', function ($sq) use ($companyId) {
                    $sq->where('company_id', $companyId);
                })->orWhereHas('organizationUnit', function ($uq) use ($companyId) {
                    $uq->where('company_id', $companyId);
                });
            });
        }

        if ($request->filled('grade_id')) {
            $query->where('grade_id', $request->query('grade_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('is_frozen')) {
            $query->where('is_frozen', filter_var($request->query('is_frozen'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('short_title', 'like', "%{$search}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 20), 500);
        $positions = $query->latest()->paginate($perPage);

        return $this->successResponse($positions, 'Daftar posisi jabatan berhasil diambil.');
    }

    public function summary(Request $request): JsonResponse
    {
        $orgUnitId = $request->query('organization_unit_id') ? (int)$request->query('organization_unit_id') : null;
        $summary = $this->positionControlService->getHeadcountSummary($orgUnitId);

        return $this->successResponse($summary, 'Ringkasan headcount berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:positions,code'],
            'title' => ['required', 'string', 'max:255'],
            'short_title' => ['nullable', 'string', 'max:50'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'department_id' => ['nullable', 'exists:organization_departments,id'],
            'section_id' => ['nullable', 'exists:organization_sections,id'],
            'organization_unit_id' => ['nullable', 'exists:organization_units,id'],
            'job_id' => ['nullable', 'exists:organization_jobs,id'],
            'job_family_id' => ['nullable', 'exists:job_families,id'],
            'grade_id' => ['nullable', 'exists:grades,id'],
            'reports_to_position_id' => ['nullable', 'exists:positions,id'],
            'location_id' => ['nullable', 'exists:work_locations,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'approved_headcount' => ['required', 'integer', 'min:1'],
            'current_headcount' => ['nullable', 'integer', 'min:0'],
            'is_frozen' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $position = DB::transaction(function () use ($validated) {
            $validated['status'] = $validated['status'] ?? 'ACTIVE';
            $validated['current_headcount'] = $validated['current_headcount'] ?? 0;
            $validated['is_frozen'] = $validated['is_frozen'] ?? false;

            $position = Position::create($validated);

            AuditService::log(
                action: 'CREATE',
                module: 'POSITION_MANAGEMENT',
                entityType: Position::class,
                entityId: (string)$position->id,
                newValues: $position->toArray()
            );

            return $position;
        });

        return $this->createdResponse(
            $position->load(['organizationUnit', 'job', 'grade', 'reportsTo']),
            'Posisi jabatan berhasil dibuat.'
        );
    }

    public function show(Position $position): JsonResponse
    {
        $position->load([
            'organizationUnit',
            'job',
            'jobFamily',
            'grade',
            'reportsTo',
            'subordinates',
            'workLocation',
            'costCenter',
        ]);

        $auditLogs = AuditLog::where('entity_type', Position::class)
            ->where('entity_id', (string)$position->id)
            ->with('actor:id,name,email')
            ->latest()
            ->take(15)
            ->get();

        return $this->successResponse([
            'position' => $position,
            'audit_trail' => $auditLogs,
        ], 'Detail posisi jabatan berhasil diambil.');
    }

    public function update(Request $request, Position $position): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', "unique:positions,code,{$position->id}"],
            'title' => ['required', 'string', 'max:255'],
            'short_title' => ['nullable', 'string', 'max:50'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'department_id' => ['nullable', 'exists:organization_departments,id'],
            'section_id' => ['nullable', 'exists:organization_sections,id'],
            'organization_unit_id' => ['nullable', 'exists:organization_units,id'],
            'job_id' => ['nullable', 'exists:organization_jobs,id'],
            'job_family_id' => ['nullable', 'exists:job_families,id'],
            'grade_id' => ['nullable', 'exists:grades,id'],
            'reports_to_position_id' => ['nullable', 'exists:positions,id'],
            'location_id' => ['nullable', 'exists:work_locations,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'approved_headcount' => ['required', 'integer', 'min:1'],
            'current_headcount' => ['nullable', 'integer', 'min:0'],
            'is_frozen' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        if (isset($validated['reports_to_position_id']) && $validated['reports_to_position_id'] != $position->reports_to_position_id) {
            HierarchyValidator::validatePositionReportsTo($position->id, $validated['reports_to_position_id']);
        }

        $oldValues = $position->toArray();

        $position = DB::transaction(function () use ($position, $validated, $oldValues) {
            $position->update($validated);

            AuditService::log(
                action: 'UPDATE',
                module: 'POSITION_MANAGEMENT',
                entityType: Position::class,
                entityId: (string)$position->id,
                oldValues: $oldValues,
                newValues: $position->fresh()->toArray()
            );

            return $position;
        });

        return $this->successResponse(
            $position->load(['organizationUnit', 'job', 'grade', 'reportsTo']),
            'Posisi jabatan berhasil diperbarui.'
        );
    }

    public function toggleFreeze(Position $position): JsonResponse
    {
        $newState = !$position->is_frozen;
        $oldState = $position->is_frozen;

        $position->update(['is_frozen' => $newState]);

        AuditService::log(
            action: $newState ? 'FREEZE' : 'UNFREEZE',
            module: 'POSITION_MANAGEMENT',
            entityType: Position::class,
            entityId: (string)$position->id,
            oldValues: ['is_frozen' => $oldState],
            newValues: ['is_frozen' => $newState]
        );

        $msg = $newState ? 'Posisi jabatan berhasil dibekukan (frozen).' : 'Pembekuan posisi jabatan berhasil dibuka (unfrozen).';
        return $this->successResponse($position, $msg);
    }

    public function activate(Position $position): JsonResponse
    {
        $old = $position->toArray();
        $position->update(['status' => 'ACTIVE']);

        AuditService::log(
            action: 'ACTIVATE',
            module: 'POSITION_MANAGEMENT',
            entityType: Position::class,
            entityId: (string)$position->id,
            oldValues: $old,
            newValues: $position->fresh()->toArray()
        );

        return $this->successResponse($position, 'Posisi jabatan berhasil diaktifkan.');
    }

    public function deactivate(Position $position): JsonResponse
    {
        $this->positionControlService->validateSafeRemoval($position);

        $old = $position->toArray();
        $position->update(['status' => 'INACTIVE']);

        AuditService::log(
            action: 'DEACTIVATE',
            module: 'POSITION_MANAGEMENT',
            entityType: Position::class,
            entityId: (string)$position->id,
            oldValues: $old,
            newValues: $position->fresh()->toArray()
        );

        return $this->successResponse($position, 'Posisi jabatan berhasil dinonaktifkan.');
    }

    public function destroy(Position $position): JsonResponse
    {
        $this->positionControlService->validateSafeRemoval($position);

        $old = $position->toArray();
        $position->delete();

        AuditService::log(
            action: 'DELETE',
            module: 'POSITION_MANAGEMENT',
            entityType: Position::class,
            entityId: (string)$position->id,
            oldValues: $old
        );

        return $this->successResponse(null, 'Posisi jabatan berhasil dihapus.');
    }
}

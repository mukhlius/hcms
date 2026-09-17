<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\ContractType;
use App\Models\EmployeeGroup;
use App\Models\EmployeeSubGroup;
use App\Models\EmploymentStatus;
use App\Models\EmploymentType;
use App\Models\WorkerCategory;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmploymentMasterController extends BaseApiController
{
    // ================= EMPLOYMENT TYPES =================
    public function employmentTypes(Request $request): JsonResponse
    {
        $types = EmploymentType::orderBy('name')->get();
        return $this->successResponse($types, 'Data jenis ketenagakerjaan berhasil diambil.');
    }

    public function storeEmploymentType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:employment_types,code'],
            'name' => ['required', 'string', 'max:255'],
            'is_permanent' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = EmploymentType::create($validated);
        AuditService::log('CREATE', 'EMPLOYMENT_TYPE', EmploymentType::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Jenis ketenagakerjaan berhasil dibuat.');
    }

    // ================= EMPLOYMENT STATUSES =================
    public function employmentStatuses(Request $request): JsonResponse
    {
        $statuses = EmploymentStatus::orderBy('name')->get();
        return $this->successResponse($statuses, 'Data status kepegawaian berhasil diambil.');
    }

    public function storeEmploymentStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:employment_statuses,code'],
            'name' => ['required', 'string', 'max:255'],
            'is_active_payroll' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = EmploymentStatus::create($validated);
        AuditService::log('CREATE', 'EMPLOYMENT_STATUS', EmploymentStatus::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Status kepegawaian berhasil dibuat.');
    }

    // ================= WORKER CATEGORIES =================
    public function workerCategories(Request $request): JsonResponse
    {
        $cats = WorkerCategory::orderBy('name')->get();
        return $this->successResponse($cats, 'Data kategori pekerja berhasil diambil.');
    }

    public function storeWorkerCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:worker_categories,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = WorkerCategory::create($validated);
        AuditService::log('CREATE', 'WORKER_CATEGORY', WorkerCategory::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Kategori pekerja berhasil dibuat.');
    }

    // ================= EMPLOYEE GROUPS =================
    public function employeeGroups(Request $request): JsonResponse
    {
        $groups = EmployeeGroup::with('subGroups')->orderBy('name')->get();
        return $this->successResponse($groups, 'Data grup karyawan berhasil diambil.');
    }

    public function storeEmployeeGroup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:employee_groups,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = EmployeeGroup::create($validated);
        AuditService::log('CREATE', 'EMPLOYEE_GROUP', EmployeeGroup::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Grup karyawan berhasil dibuat.');
    }

    public function storeEmployeeSubGroup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_group_id' => ['required', 'exists:employee_groups,id'],
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = EmployeeSubGroup::create($validated);
        AuditService::log('CREATE', 'EMPLOYEE_SUB_GROUP', EmployeeSubGroup::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Sub-grup karyawan berhasil dibuat.');
    }

    // ================= CONTRACT TYPES =================
    public function contractTypes(Request $request): JsonResponse
    {
        $types = ContractType::orderBy('name')->get();
        return $this->successResponse($types, 'Data jenis kontrak kerja berhasil diambil.');
    }

    public function storeContractType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:contract_types,code'],
            'name' => ['required', 'string', 'max:255'],
            'requires_end_date' => ['nullable', 'boolean'],
            'max_duration_months' => ['nullable', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = ContractType::create($validated);
        AuditService::log('CREATE', 'CONTRACT_TYPE', ContractType::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Jenis kontrak berhasil dibuat.');
    }
}

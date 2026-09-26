<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\CostCenter;
use App\Models\Grade;
use App\Models\JobFamily;
use App\Models\OrganizationJob;
use App\Models\SalaryGrade;
use App\Models\WorkLocation;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobAndGradeController extends BaseApiController
{
    // ================= JOB FAMILIES =================
    public function jobFamilies(Request $request): JsonResponse
    {
        $query = JobFamily::withCount('jobs');
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where('code', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%");
        }
        return $this->successResponse($query->latest()->get(), 'Data rumpun jabatan berhasil diambil.');
    }

    public function storeJobFamily(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:job_families,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = JobFamily::create($validated);
        AuditService::log('CREATE', 'JOB_FAMILY', JobFamily::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Rumpun jabatan berhasil dibuat.');
    }

    // ================= JOBS =================
    public function jobs(Request $request): JsonResponse
    {
        $query = OrganizationJob::with('jobFamily:id,code,name');
        if ($request->filled('job_family_id')) {
            $query->where('job_family_id', $request->query('job_family_id'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where('code', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%");
        }
        return $this->successResponse($query->latest()->get(), 'Data jabatan berhasil diambil.');
    }

    public function storeJob(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'job_family_id' => ['nullable', 'exists:job_families,id'],
            'code' => ['required', 'string', 'max:50', 'unique:organization_jobs,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = OrganizationJob::create($validated);
        AuditService::log('CREATE', 'JOB', OrganizationJob::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item->load('jobFamily'), 'Jabatan berhasil dibuat.');
    }

    // ================= GRADES =================
    public function grades(Request $request): JsonResponse
    {
        $query = Grade::with('defaultRole:id,name,display_name,data_scope')->orderBy('level');
        if ($request->filled('pangkat')) {
            $query->where('pangkat', $request->query('pangkat'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                  ->orWhere('name', 'like', "%{$s}%")
                  ->orWhere('pangkat', 'like', "%{$s}%");
            });
        }
        return $this->successResponse($query->get(), 'Data grade/level berhasil diambil.');
    }

    public function storeGrade(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:grades,code'],
            'name' => ['required', 'string', 'max:255'],
            'level' => ['required', 'integer', 'min:1'],
            'pangkat' => ['nullable', 'string', 'in:Staff,Non Staff,STAFF,NON_STAFF'],
            'default_role_id' => ['nullable', 'exists:roles,id'],
            'min_salary' => ['nullable', 'numeric', 'min:0'],
            'max_salary' => ['nullable', 'numeric', 'gte:min_salary'],
            'field_duty_duration_days' => ['nullable', 'integer', 'min:0'],
            'field_leave_duration_days' => ['nullable', 'integer', 'min:0'],
            'field_allowance' => ['nullable', 'numeric', 'min:0'],
            'leave_lumpsum_allowance' => ['nullable', 'numeric', 'min:0'],
            'business_trip_allowance_daily' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (isset($validated['pangkat'])) {
            $validated['pangkat'] = in_array(strtoupper($validated['pangkat']), ['NON STAFF', 'NON_STAFF']) ? 'Non Staff' : 'Staff';
        } else {
            $validated['pangkat'] = 'Staff';
        }

        $validated['status'] = $validated['status'] ?? 'ACTIVE';

        $item = Grade::create($validated);
        AuditService::log('CREATE', 'GRADE', Grade::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item->load('defaultRole:id,name,display_name,data_scope'), 'Level jabatan berhasil dibuat.');
    }

    public function updateGrade(Request $request, Grade $grade): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', 'unique:grades,code,' . $grade->id],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'level' => ['sometimes', 'required', 'integer', 'min:1'],
            'pangkat' => ['nullable', 'string', 'in:Staff,Non Staff,STAFF,NON_STAFF'],
            'default_role_id' => ['nullable', 'exists:roles,id'],
            'min_salary' => ['nullable', 'numeric', 'min:0'],
            'max_salary' => ['nullable', 'numeric', 'gte:min_salary'],
            'field_duty_duration_days' => ['nullable', 'integer', 'min:0'],
            'field_leave_duration_days' => ['nullable', 'integer', 'min:0'],
            'field_allowance' => ['nullable', 'numeric', 'min:0'],
            'leave_lumpsum_allowance' => ['nullable', 'numeric', 'min:0'],
            'business_trip_allowance_daily' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (isset($validated['pangkat'])) {
            $validated['pangkat'] = in_array(strtoupper($validated['pangkat']), ['NON STAFF', 'NON_STAFF']) ? 'Non Staff' : 'Staff';
        }

        $old = $grade->toArray();
        $grade->update($validated);
        AuditService::log('UPDATE', 'GRADE', Grade::class, (string)$grade->id, oldValues: $old, newValues: $grade->fresh()->toArray());

        return $this->successResponse($grade->load('defaultRole:id,name,display_name,data_scope'), 'Level jabatan berhasil diperbarui.');
    }

    public function destroyGrade(Grade $grade): JsonResponse
    {
        $old = $grade->toArray();
        $grade->delete();
        AuditService::log('DELETE', 'GRADE', Grade::class, (string)$grade->id, oldValues: $old);

        return $this->successResponse(null, 'Level jabatan berhasil dihapus.');
    }

    // ================= WORK LOCATIONS =================
    public function workLocations(Request $request): JsonResponse
    {
        $query = WorkLocation::with('site:id,code,name');
        if ($request->filled('site_id')) {
            $query->where('site_id', $request->query('site_id'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where('code', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%");
        }
        return $this->successResponse($query->latest()->get(), 'Data lokasi kerja berhasil diambil.');
    }

    public function storeWorkLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site_id' => ['required', 'exists:organization_sites,id'],
            'code' => ['required', 'string', 'max:50', 'unique:work_locations,code'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = WorkLocation::create($validated);
        AuditService::log('CREATE', 'WORK_LOCATION', WorkLocation::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item->load('site'), 'Lokasi kerja berhasil dibuat.');
    }

    // ================= COST CENTERS =================
    public function costCenters(Request $request): JsonResponse
    {
        $query = CostCenter::with('company:id,code,name');
        if ($request->filled('company_id')) {
            $query->where('company_id', $request->query('company_id'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where('code', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%");
        }
        return $this->successResponse($query->latest()->get(), 'Data pusat biaya (cost center) berhasil diambil.');
    }

    public function storeCostCenter(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:organization_companies,id'],
            'code' => ['required', 'string', 'max:50', 'unique:cost_centers,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $item = CostCenter::create($validated);
        AuditService::log('CREATE', 'COST_CENTER', CostCenter::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item->load('company'), 'Pusat biaya berhasil dibuat.');
    }

    // ================= SALARY GRADES (GOLONGAN / GRADE) =================
    public function salaryGrades(Request $request): JsonResponse
    {
        $query = SalaryGrade::with('level:id,code,name,level');
        if ($request->filled('level_id')) {
            $query->where('level_id', $request->query('level_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                  ->orWhere('name', 'like', "%{$s}%");
            });
        }
        return $this->successResponse($query->orderBy('code')->get(), 'Data golongan / grade berhasil diambil.');
    }

    public function storeSalaryGrade(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:salary_grades,code'],
            'name' => ['required', 'string', 'max:255'],
            'jenjang' => ['nullable', 'string', 'max:100'],
            'housing_allowance' => ['nullable', 'numeric', 'min:0'],
            'level_id' => ['nullable', 'exists:grades,id'],
            'min_salary' => ['nullable', 'numeric', 'min:0'],
            'mid_salary' => ['nullable', 'numeric', 'min:0'],
            'max_salary' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (!isset($validated['mid_salary']) && isset($validated['min_salary']) && isset($validated['max_salary'])) {
            $validated['mid_salary'] = ($validated['min_salary'] + $validated['max_salary']) / 2;
        }

        $item = SalaryGrade::create($validated);
        AuditService::log('CREATE', 'SALARY_GRADE', SalaryGrade::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item->load('level'), 'Golongan / Grade berhasil dibuat.');
    }

    public function updateSalaryGrade(Request $request, SalaryGrade $salaryGrade): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', 'unique:salary_grades,code,' . $salaryGrade->id],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'jenjang' => ['nullable', 'string', 'max:100'],
            'housing_allowance' => ['nullable', 'numeric', 'min:0'],
            'level_id' => ['nullable', 'exists:grades,id'],
            'min_salary' => ['nullable', 'numeric', 'min:0'],
            'mid_salary' => ['nullable', 'numeric', 'min:0'],
            'max_salary' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (!isset($validated['mid_salary']) && isset($validated['min_salary']) && isset($validated['max_salary'])) {
            $validated['mid_salary'] = ($validated['min_salary'] + $validated['max_salary']) / 2;
        }

        $old = $salaryGrade->toArray();
        $salaryGrade->update($validated);
        AuditService::log('UPDATE', 'SALARY_GRADE', SalaryGrade::class, (string)$salaryGrade->id, oldValues: $old, newValues: $salaryGrade->toArray());

        return $this->successResponse($salaryGrade->load('level'), 'Golongan / Grade berhasil diperbarui.');
    }

    public function destroySalaryGrade(SalaryGrade $salaryGrade): JsonResponse
    {
        $old = $salaryGrade->toArray();
        $salaryGrade->delete();
        AuditService::log('DELETE', 'SALARY_GRADE', SalaryGrade::class, (string)$salaryGrade->id, oldValues: $old);

        return $this->successResponse(null, 'Golongan / Grade berhasil dihapus.');
    }
}

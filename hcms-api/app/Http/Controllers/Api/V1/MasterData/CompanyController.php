<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\BenefitPlafond;
use App\Models\EmploymentType;
use App\Models\Grade;
use App\Models\OrganizationCompany;
use App\Models\OrganizationDepartment;
use App\Models\OrganizationSection;
use App\Models\OrganizationSite;
use App\Models\OrganizationUnit;
use App\Models\Position;
use App\Models\MasterJenjang;
use App\Models\SalaryGrade;
use App\Models\SalaryGradeJenjang;
use App\Models\StandardReference;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanyController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = OrganizationCompany::withCount(['sites', 'organizationUnits']);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('short_name', 'like', "%{$search}%")
                    ->orWhere('tax_identifier', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $perPage = min((int)$request->query('per_page', 15), 100);
        $companies = $query->latest()->paginate($perPage);

        return $this->successResponse($companies, 'Daftar perusahaan berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:organization_companies,code'],
            'name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'tax_identifier' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'country' => ['nullable', 'string', 'max:10'],
            'currency' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $company = DB::transaction(function () use ($validated) {
            $validated['status'] = $validated['status'] ?? 'ACTIVE';
            $validated['is_active'] = $validated['status'] === 'ACTIVE';

            $company = OrganizationCompany::create($validated);

            AuditService::log(
                action: 'CREATE',
                module: 'COMPANY_MANAGEMENT',
                entityType: OrganizationCompany::class,
                entityId: (string)$company->id,
                newValues: $company->toArray()
            );

            return $company;
        });

        return $this->createdResponse($company, 'Perusahaan berhasil dibuat.');
    }

    public function show(OrganizationCompany $company): JsonResponse
    {
        $company->load(['sites', 'organizationUnits']);
        $auditLogs = AuditLog::where('entity_type', OrganizationCompany::class)
            ->where('entity_id', (string)$company->id)
            ->with('actor:id,name,email')
            ->latest()
            ->take(15)
            ->get();

        return $this->successResponse([
            'company' => $company,
            'audit_trail' => $auditLogs,
        ], 'Detail perusahaan berhasil diambil.');
    }

    public function update(Request $request, OrganizationCompany $company): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', "unique:organization_companies,code,{$company->id}"],
            'name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'tax_identifier' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'country' => ['nullable', 'string', 'max:10'],
            'currency' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $oldValues = $company->toArray();

        $company = DB::transaction(function () use ($company, $validated, $oldValues) {
            if (isset($validated['status'])) {
                $validated['is_active'] = $validated['status'] === 'ACTIVE';
            }

            $company->update($validated);

            AuditService::log(
                action: 'UPDATE',
                module: 'COMPANY_MANAGEMENT',
                entityType: OrganizationCompany::class,
                entityId: (string)$company->id,
                oldValues: $oldValues,
                newValues: $company->fresh()->toArray()
            );

            return $company;
        });

        return $this->successResponse($company, 'Perusahaan berhasil diperbarui.');
    }

    public function activate(OrganizationCompany $company): JsonResponse
    {
        $old = $company->toArray();
        $company->update(['status' => 'ACTIVE', 'is_active' => true]);

        AuditService::log(
            action: 'ACTIVATE',
            module: 'COMPANY_MANAGEMENT',
            entityType: OrganizationCompany::class,
            entityId: (string)$company->id,
            oldValues: $old,
            newValues: $company->fresh()->toArray()
        );

        return $this->successResponse($company, 'Perusahaan berhasil diaktifkan.');
    }

    public function deactivate(OrganizationCompany $company): JsonResponse
    {
        $activeSitesCount = $company->sites()->where('status', 'ACTIVE')->count();
        if ($activeSitesCount > 0) {
            return $this->errorResponse("Perusahaan tidak dapat dinonaktifkan karena masih memiliki {$activeSitesCount} site aktif.", 422);
        }

        $old = $company->toArray();
        $company->update(['status' => 'INACTIVE', 'is_active' => false]);

        AuditService::log(
            action: 'DEACTIVATE',
            module: 'COMPANY_MANAGEMENT',
            entityType: OrganizationCompany::class,
            entityId: (string)$company->id,
            oldValues: $old,
            newValues: $company->fresh()->toArray()
        );

        return $this->successResponse($company, 'Perusahaan berhasil dinonaktifkan.');
    }

    public function destroy(OrganizationCompany $company): JsonResponse
    {
        $sitesCount = $company->sites()->count();
        if ($sitesCount > 0) {
            return $this->errorResponse("Perusahaan tidak dapat dihapus karena masih memiliki {$sitesCount} site tambang terkait.", 'INTEGRITY_VIOLATION', null, 422);
        }

        $unitsCount = $company->organizationUnits()->count();
        if ($unitsCount > 0) {
            return $this->errorResponse("Perusahaan tidak dapat dihapus karena masih memiliki {$unitsCount} unit organisasi terkait.", 'INTEGRITY_VIOLATION', null, 422);
        }

        $old = $company->toArray();
        $company->delete();

        AuditService::log(
            action: 'DELETE',
            module: 'COMPANY_MANAGEMENT',
            entityType: OrganizationCompany::class,
            entityId: (string)$company->id,
            oldValues: $old
        );

        return $this->successResponse(null, 'Perusahaan berhasil dihapus.');
    }

    /**
     * Hitungan ringkasan master data organisasi secara cepat untuk badge counter tab.
     */
    public function overviewCounts(Request $request): JsonResponse
    {
        $companyId = $request->query('company_id');
        $siteId = $request->query('site_id');

        $siteQuery = OrganizationSite::query();
        if ($companyId) {
            $siteQuery->where('company_id', $companyId);
        }

        $deptQuery = OrganizationDepartment::query();
        if ($companyId) {
            $deptQuery->where('company_id', $companyId);
        }
        if ($siteId) {
            $deptQuery->where('site_id', $siteId);
        }

        $secQuery = OrganizationSection::query();
        if ($companyId) {
            $secQuery->where('company_id', $companyId);
        }
        if ($siteId) {
            $secQuery->where('site_id', $siteId);
        }

        $counts = [
            'companies' => OrganizationCompany::count(),
            'sites' => $siteQuery->count(),
            'departments' => $deptQuery->count(),
            'sections' => $secQuery->count(),
            'positions' => Position::count(),
            'grades' => Grade::count(),
            'salary_grades' => SalaryGrade::count(),
            'jenjang' => SalaryGradeJenjang::count(),
            'master_jenjang' => MasterJenjang::count(),
            'poh' => StandardReference::where('category', 'POH')->where('status', 'ACTIVE')->count(),
            'work_area' => StandardReference::where('category', 'WORK_AREA')->where('status', 'ACTIVE')->count(),
            'employment_types' => EmploymentType::count(),
            'marital_statuses' => StandardReference::where('category', 'MARITAL_STATUS')->where('status', 'ACTIVE')->count(),
            'plafond_pengobatan' => BenefitPlafond::where('benefit_type', 'PENGOBATAN')->where('status', 'ACTIVE')->count(),
            'plafond_kacamata' => BenefitPlafond::where('benefit_type', 'KACAMATA')->where('status', 'ACTIVE')->count(),
            'plafond_persalinan' => BenefitPlafond::where('benefit_type', 'PERSALINAN')->where('status', 'ACTIVE')->count(),
            'tunjangan_lapangan' => BenefitPlafond::where('benefit_type', 'TUNJANGAN_LAPANGAN')->where('status', 'ACTIVE')->count(),
            'uang_perdin' => BenefitPlafond::where('benefit_type', 'UANG_PERDIN')->where('status', 'ACTIVE')->count(),
            'bantuan_lumpsum' => BenefitPlafond::where('benefit_type', 'BANTUAN_LUMPSUM')->where('status', 'ACTIVE')->count(),
            'bantuan_komunikasi' => BenefitPlafond::where('benefit_type', 'BANTUAN_KOMUNIKASI')->where('status', 'ACTIVE')->count(),
            'bantuan_perumahan' => BenefitPlafond::where('benefit_type', 'BANTUAN_PERUMAHAN')->where('status', 'ACTIVE')->count(),
            'roster_kerja' => \App\Models\LevelWorkRoster::count(),
            'pola_shift' => \App\Models\Shift::count(),
            'waktu_kerja' => \App\Models\PositionWorkTime::count(),
            'kalender_libur' => \App\Models\PublicHoliday::count(),
            'durasi_paid_leave' => \App\Models\PaidLeavePolicy::count(),
            'durasi_sp' => \App\Models\WarningLetterDuration::count(),
            'jenis_phk' => \App\Models\TerminationType::count(),
            'jenis_resign' => \App\Models\ResignationType::count(),
        ];

        return $this->successResponse($counts, 'Ringkasan hitungan master data berhasil diambil.');
    }
}

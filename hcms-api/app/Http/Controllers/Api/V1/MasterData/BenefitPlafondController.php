<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\BenefitPlafond;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BenefitPlafondController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = BenefitPlafond::with(['salaryGrade', 'maritalStatus']);

        if ($request->filled('benefit_type')) {
            $query->where('benefit_type', strtoupper($request->query('benefit_type')));
        }

        $salaryGradeId = $request->query('salary_grade_id') ?? $request->query('grade_id');
        if (!empty($salaryGradeId)) {
            $query->where('salary_grade_id', $salaryGradeId);
        }

        if ($request->filled('marital_category')) {
            $cat = $request->query('marital_category');
            if ($cat !== 'ALL') {
                $query->where('marital_category', $cat);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->whereHas('salaryGrade', function ($gq) use ($s) {
                    $gq->where('name', 'like', "%{$s}%")
                       ->orWhere('code', 'like', "%{$s}%")
                       ->orWhere('pangkat', 'like', "%{$s}%");
                })->orWhere('description', 'like', "%{$s}%")
                  ->orWhere('marital_category', 'like', "%{$s}%");
            });
        }

        // Join with salary_grades to order by code hierarchy
        $query->join('salary_grades', 'benefit_plafonds.salary_grade_id', '=', 'salary_grades.id')
              ->select('benefit_plafonds.*')
              ->orderBy('salary_grades.code', 'asc')
              ->orderBy('benefit_plafonds.marital_category', 'asc');

        if ($request->has('per_page')) {
            $perPage = (int)$request->query('per_page', 15);
            $items = $query->paginate($perPage);
        } else {
            $items = $query->get();
        }

        return $this->successResponse($items, 'Data plafon manfaat berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        // Support both salary_grade_id and grade_id from client
        if (!$request->has('salary_grade_id') && $request->has('grade_id')) {
            $request->merge(['salary_grade_id' => $request->input('grade_id')]);
        }

        $validated = $request->validate([
            'benefit_type' => ['required', 'string', 'in:PENGOBATAN,KACAMATA,PERSALINAN'],
            'salary_grade_id' => ['required', 'exists:salary_grades,id'],
            'marital_category' => ['required', 'string', 'in:Menikah,Tidak Menikah,SEMUA'],
            'marital_status_id' => ['nullable', 'exists:standard_references,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'period_type' => ['required', 'string', 'in:TAHUNAN,PER_KASUS,2_TAHUNAN,SEUMUR_HIDUP'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = BenefitPlafond::create($validated);
        $item->load(['salaryGrade', 'maritalStatus']);

        AuditService::log('CREATE', 'BENEFIT_PLAFOND', BenefitPlafond::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Plafon manfaat berhasil ditambahkan.');
    }

    public function show(BenefitPlafond $benefitPlafond): JsonResponse
    {
        $benefitPlafond->load(['salaryGrade', 'maritalStatus']);
        return $this->successResponse($benefitPlafond, 'Detail plafon manfaat berhasil diambil.');
    }

    public function update(Request $request, BenefitPlafond $benefitPlafond): JsonResponse
    {
        if (!$request->has('salary_grade_id') && $request->has('grade_id')) {
            $request->merge(['salary_grade_id' => $request->input('grade_id')]);
        }

        $validated = $request->validate([
            'benefit_type' => ['sometimes', 'required', 'string', 'in:PENGOBATAN,KACAMATA,PERSALINAN'],
            'salary_grade_id' => ['sometimes', 'required', 'exists:salary_grades,id'],
            'marital_category' => ['sometimes', 'required', 'string', 'in:Menikah,Tidak Menikah,SEMUA'],
            'marital_status_id' => ['nullable', 'exists:standard_references,id'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'period_type' => ['sometimes', 'required', 'string', 'in:TAHUNAN,PER_KASUS,2_TAHUNAN,SEUMUR_HIDUP'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $oldValues = $benefitPlafond->toArray();
        $benefitPlafond->update($validated);
        $benefitPlafond->load(['salaryGrade', 'maritalStatus']);

        AuditService::log('UPDATE', 'BENEFIT_PLAFOND', BenefitPlafond::class, (string)$benefitPlafond->id, oldValues: $oldValues, newValues: $benefitPlafond->fresh()->toArray());

        return $this->successResponse($benefitPlafond->fresh(), 'Plafon manfaat berhasil diperbarui.');
    }

    public function destroy(BenefitPlafond $benefitPlafond): JsonResponse
    {
        $old = $benefitPlafond->toArray();
        $benefitPlafond->delete();

        AuditService::log('DELETE', 'BENEFIT_PLAFOND', BenefitPlafond::class, (string)$benefitPlafond->id, oldValues: $old);

        return $this->successResponse(null, 'Plafon manfaat berhasil dihapus.');
    }

    public function activate(BenefitPlafond $benefitPlafond): JsonResponse
    {
        $old = $benefitPlafond->toArray();
        $benefitPlafond->update(['status' => 'ACTIVE']);

        AuditService::log('ACTIVATE', 'BENEFIT_PLAFOND', BenefitPlafond::class, (string)$benefitPlafond->id, oldValues: $old, newValues: $benefitPlafond->fresh()->toArray());

        return $this->successResponse($benefitPlafond->fresh(), 'Plafon manfaat berhasil diaktifkan.');
    }

    public function deactivate(BenefitPlafond $benefitPlafond): JsonResponse
    {
        $old = $benefitPlafond->toArray();
        $benefitPlafond->update(['status' => 'INACTIVE']);

        AuditService::log('DEACTIVATE', 'BENEFIT_PLAFOND', BenefitPlafond::class, (string)$benefitPlafond->id, oldValues: $old, newValues: $benefitPlafond->fresh()->toArray());

        return $this->successResponse($benefitPlafond->fresh(), 'Plafon manfaat berhasil dinonaktifkan.');
    }
}

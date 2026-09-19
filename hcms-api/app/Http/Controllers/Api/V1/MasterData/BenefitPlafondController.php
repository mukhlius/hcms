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
        $query = BenefitPlafond::with(['salaryGrade', 'grade', 'maritalStatus']);

        if ($request->filled('benefit_type')) {
            $query->where('benefit_type', strtoupper($request->query('benefit_type')));
        }

        if ($request->filled('grade_id')) {
            $query->where('grade_id', $request->query('grade_id'));
        }

        if ($request->filled('salary_grade_id')) {
            $query->where('salary_grade_id', $request->query('salary_grade_id'));
        }

        if ($request->filled('marital_category')) {
            $cat = $request->query('marital_category');
            if ($cat !== 'ALL') {
                $query->where('marital_category', $cat);
            }
        }

        if ($request->filled('lens_type')) {
            $query->where('lens_type', $request->query('lens_type'));
        }

        if ($request->filled('category_name')) {
            $catName = $request->query('category_name');
            if ($catName !== 'ALL') {
                $query->where('category_name', $catName);
            }
        }

        if ($request->filled('zone_name')) {
            $zn = $request->query('zone_name');
            if ($zn !== 'ALL') {
                $query->where('zone_name', $zn);
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
                       ->orWhere('code', 'like', "%{$s}%");
                })->orWhereHas('grade', function ($gq) use ($s) {
                    $gq->where('name', 'like', "%{$s}%")
                       ->orWhere('code', 'like', "%{$s}%")
                       ->orWhere('pangkat', 'like', "%{$s}%");
                })->orWhere('description', 'like', "%{$s}%")
                  ->orWhere('marital_category', 'like', "%{$s}%")
                  ->orWhere('lens_type', 'like', "%{$s}%")
                  ->orWhere('category_name', 'like', "%{$s}%")
                  ->orWhere('zone_name', 'like', "%{$s}%");
            });
        }

        // Left join with salary_grades and grades
        $query->leftJoin('salary_grades', 'benefit_plafonds.salary_grade_id', '=', 'salary_grades.id')
              ->leftJoin('grades', 'benefit_plafonds.grade_id', '=', 'grades.id')
              ->select('benefit_plafonds.*')
              ->orderByRaw('COALESCE(grades.level, salary_grades.code, benefit_plafonds.lens_type, "") ASC')
              ->orderBy('benefit_plafonds.category_name', 'asc')
              ->orderBy('benefit_plafonds.zone_name', 'asc')
              ->orderBy('benefit_plafonds.marital_category', 'asc')
              ->orderBy('benefit_plafonds.id', 'asc');

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
        $benefitType = strtoupper($request->input('benefit_type', ''));
        $isKacamata = $benefitType === 'KACAMATA';
        $isTunjanganLapangan = $benefitType === 'TUNJANGAN_LAPANGAN';
        $isMedical = in_array($benefitType, ['PENGOBATAN', 'PERSALINAN']);

        // Support level_id as grade_id for Tunjangan Lapangan
        if ($isTunjanganLapangan) {
            if (!$request->has('grade_id') && $request->has('level_id')) {
                $request->merge(['grade_id' => $request->input('level_id')]);
            }
        } else {
            // Support both salary_grade_id and grade_id for salary grade based benefits
            if (!$request->has('salary_grade_id') && $request->has('grade_id')) {
                $request->merge(['salary_grade_id' => $request->input('grade_id')]);
            }
        }

        $rules = [
            'benefit_type' => ['required', 'string', 'in:PENGOBATAN,KACAMATA,PERSALINAN,TUNJANGAN_LAPANGAN,UANG_PERDIN,BANTUAN_LUMPSUM,BANTUAN_KOMUNIKASI,BANTUAN_PERUMAHAN'],
            'period_type' => ['required', 'string', 'in:HARIAN,BULANAN,TAHUNAN,PER_KASUS,2_TAHUNAN,SEUMUR_HIDUP'],
            'category_name' => ['nullable', 'string', 'max:100'],
            'zone_name' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ];

        if ($isKacamata) {
            $rules['lens_type'] = ['required', 'string', 'max:100'];
            $rules['frame_amount'] = ['required', 'numeric', 'min:0'];
            $rules['lens_amount'] = ['required', 'numeric', 'min:0'];
            $rules['amount'] = ['nullable', 'numeric', 'min:0'];
            $rules['salary_grade_id'] = ['nullable', 'exists:salary_grades,id'];
            $rules['grade_id'] = ['nullable', 'exists:grades,id'];
            $rules['marital_category'] = ['nullable', 'string'];
            $rules['marital_status_id'] = ['nullable', 'exists:standard_references,id'];
        } elseif ($isTunjanganLapangan) {
            $rules['grade_id'] = ['required', 'exists:grades,id'];
            $rules['salary_grade_id'] = ['nullable'];
            $rules['category_name'] = ['nullable', 'string', 'max:100'];
            $rules['amount'] = ['required', 'numeric', 'min:0'];
            $rules['marital_category'] = ['nullable', 'string'];
            $rules['marital_status_id'] = ['nullable', 'exists:standard_references,id'];
            $rules['lens_type'] = ['nullable', 'string'];
            $rules['frame_amount'] = ['nullable', 'numeric'];
            $rules['lens_amount'] = ['nullable', 'numeric'];
        } else {
            $rules['salary_grade_id'] = ['required', 'exists:salary_grades,id'];
            $rules['grade_id'] = ['nullable'];
            $rules['marital_category'] = [$isMedical ? 'required' : 'nullable', 'string', 'in:Menikah,Tidak Menikah,SEMUA'];
            $rules['marital_status_id'] = ['nullable', 'exists:standard_references,id'];
            $rules['amount'] = ['required', 'numeric', 'min:0'];
            $rules['lens_type'] = ['nullable', 'string'];
            $rules['frame_amount'] = ['nullable', 'numeric'];
            $rules['lens_amount'] = ['nullable', 'numeric'];
        }

        $validated = $request->validate($rules);

        if ($isKacamata) {
            $validated['marital_category'] = $validated['marital_category'] ?? 'SEMUA';
            $validated['amount'] = (float)($validated['frame_amount'] ?? 0) + (float)($validated['lens_amount'] ?? 0);
        } else {
            $validated['marital_category'] = $validated['marital_category'] ?? 'SEMUA';
        }

        $item = BenefitPlafond::create($validated);
        $item->load(['salaryGrade', 'grade', 'maritalStatus']);

        AuditService::log('CREATE', 'BENEFIT_PLAFOND', BenefitPlafond::class, (string)$item->id, newValues: $item->toArray());

        return $this->successResponse($item, 'Plafon manfaat berhasil ditambahkan.', 201);
    }

    public function show(BenefitPlafond $benefitPlafond): JsonResponse
    {
        $benefitPlafond->load(['salaryGrade', 'grade', 'maritalStatus']);
        return $this->successResponse($benefitPlafond, 'Detail plafon manfaat berhasil diambil.');
    }

    public function update(Request $request, BenefitPlafond $benefitPlafond): JsonResponse
    {
        $benefitType = strtoupper($request->input('benefit_type', $benefitPlafond->benefit_type));
        $isKacamata = $benefitType === 'KACAMATA';
        $isTunjanganLapangan = $benefitType === 'TUNJANGAN_LAPANGAN';
        $isMedical = in_array($benefitType, ['PENGOBATAN', 'PERSALINAN']);

        if ($isTunjanganLapangan) {
            if (!$request->has('grade_id') && $request->has('level_id')) {
                $request->merge(['grade_id' => $request->input('level_id')]);
            }
        } else {
            if (!$request->has('salary_grade_id') && $request->has('grade_id')) {
                $request->merge(['salary_grade_id' => $request->input('grade_id')]);
            }
        }

        $rules = [
            'benefit_type' => ['sometimes', 'required', 'string', 'in:PENGOBATAN,KACAMATA,PERSALINAN,TUNJANGAN_LAPANGAN,UANG_PERDIN,BANTUAN_LUMPSUM,BANTUAN_KOMUNIKASI,BANTUAN_PERUMAHAN'],
            'period_type' => ['sometimes', 'required', 'string', 'in:HARIAN,BULANAN,TAHUNAN,PER_KASUS,2_TAHUNAN,SEUMUR_HIDUP'],
            'category_name' => ['nullable', 'string', 'max:100'],
            'zone_name' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ];

        if ($isKacamata) {
            $rules['lens_type'] = ['sometimes', 'required', 'string', 'max:100'];
            $rules['frame_amount'] = ['sometimes', 'required', 'numeric', 'min:0'];
            $rules['lens_amount'] = ['sometimes', 'required', 'numeric', 'min:0'];
            $rules['amount'] = ['nullable', 'numeric', 'min:0'];
            $rules['salary_grade_id'] = ['nullable', 'exists:salary_grades,id'];
            $rules['grade_id'] = ['nullable', 'exists:grades,id'];
            $rules['marital_category'] = ['nullable', 'string'];
            $rules['marital_status_id'] = ['nullable', 'exists:standard_references,id'];
        } elseif ($isTunjanganLapangan) {
            $rules['grade_id'] = ['sometimes', 'required', 'exists:grades,id'];
            $rules['salary_grade_id'] = ['nullable'];
            $rules['category_name'] = ['nullable', 'string', 'max:100'];
            $rules['amount'] = ['sometimes', 'required', 'numeric', 'min:0'];
            $rules['marital_category'] = ['nullable', 'string'];
            $rules['marital_status_id'] = ['nullable', 'exists:standard_references,id'];
            $rules['lens_type'] = ['nullable', 'string'];
            $rules['frame_amount'] = ['nullable', 'numeric'];
            $rules['lens_amount'] = ['nullable', 'numeric'];
        } else {
            $rules['salary_grade_id'] = ['sometimes', 'required', 'exists:salary_grades,id'];
            $rules['grade_id'] = ['nullable'];
            $rules['marital_category'] = ['nullable', 'string', 'in:Menikah,Tidak Menikah,SEMUA'];
            $rules['marital_status_id'] = ['nullable', 'exists:standard_references,id'];
            $rules['amount'] = ['sometimes', 'required', 'numeric', 'min:0'];
            $rules['lens_type'] = ['nullable', 'string'];
            $rules['frame_amount'] = ['nullable', 'numeric'];
            $rules['lens_amount'] = ['nullable', 'numeric'];
        }

        $validated = $request->validate($rules);

        if ($isKacamata) {
            $frame = array_key_exists('frame_amount', $validated) ? (float)$validated['frame_amount'] : (float)$benefitPlafond->frame_amount;
            $lens = array_key_exists('lens_amount', $validated) ? (float)$validated['lens_amount'] : (float)$benefitPlafond->lens_amount;
            $validated['amount'] = $frame + $lens;
        }

        $oldValues = $benefitPlafond->toArray();
        $benefitPlafond->update($validated);
        $benefitPlafond->load(['salaryGrade', 'grade', 'maritalStatus']);

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

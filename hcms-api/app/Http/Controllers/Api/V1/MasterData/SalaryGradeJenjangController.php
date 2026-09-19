<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\SalaryGradeJenjang;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SalaryGradeJenjangController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = SalaryGradeJenjang::with([
            'salaryGrade:id,code,name',
            'grade:id,code,name,pangkat,level',
            'masterJenjang:id,code,name',
        ]);

        if ($request->filled('salary_grade_id')) {
            $query->where('salary_grade_id', $request->query('salary_grade_id'));
        }

        if ($request->filled('grade_id')) {
            $query->where('grade_id', $request->query('grade_id'));
        }

        if ($request->filled('master_jenjang_id')) {
            $query->where('master_jenjang_id', $request->query('master_jenjang_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $s = trim($request->query('search'));
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhereHas('masterJenjang', function ($mjq) use ($s) {
                      $mjq->where('name', 'like', "%{$s}%")
                          ->orWhere('code', 'like', "%{$s}%");
                  })
                  ->orWhereHas('salaryGrade', function ($sq) use ($s) {
                      $sq->where('code', 'like', "%{$s}%")
                         ->orWhere('name', 'like', "%{$s}%");
                  })
                  ->orWhereHas('grade', function ($gq) use ($s) {
                      $gq->where('code', 'like', "%{$s}%")
                         ->orWhere('name', 'like', "%{$s}%")
                         ->orWhere('pangkat', 'like', "%{$s}%");
                  });
            });
        }

        // Join to sort by salary_grade code then name
        $items = $query->join('salary_grades', 'salary_grade_jenjang.salary_grade_id', '=', 'salary_grades.id')
            ->select('salary_grade_jenjang.*')
            ->orderBy('salary_grades.code', 'asc')
            ->orderBy('salary_grade_jenjang.name', 'asc')
            ->get();

        return $this->successResponse($items, 'Data jenjang jabatan berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'salary_grade_id' => ['required', 'exists:salary_grades,id'],
            'grade_id' => ['required', 'exists:grades,id'],
            'master_jenjang_id' => ['nullable', 'exists:master_jenjangs,id'],
            'name' => ['required_without:master_jenjang_id', 'nullable', 'string', 'max:150'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (!empty($validated['master_jenjang_id'])) {
            $master = \App\Models\MasterJenjang::find($validated['master_jenjang_id']);
            if ($master) {
                $validated['name'] = $master->name;
            }
        } elseif (!empty($validated['name'])) {
            // Find or create master jenjang by name
            $master = \App\Models\MasterJenjang::firstOrCreate(
                ['name' => trim($validated['name'])],
                [
                    'code' => 'JNJ-' . str_pad((string)(\App\Models\MasterJenjang::withTrashed()->count() + 1), 3, '0', STR_PAD_LEFT),
                    'status' => 'ACTIVE',
                ]
            );
            $validated['master_jenjang_id'] = $master->id;
        }

        // 1. Cek kombinasi unik salary_grade_id dan grade_id
        $exists = SalaryGradeJenjang::where('salary_grade_id', $validated['salary_grade_id'])
            ->where('grade_id', $validated['grade_id'])
            ->exists();

        if ($exists) {
            return $this->errorResponse('Kombinasi Golongan dan Level Jabatan ini sudah terdaftar sebagai jenjang.', 422);
        }

        // 2. Batasan maksimal 4 jenjang dalam 1 golongan
        $currentCount = SalaryGradeJenjang::where('salary_grade_id', $validated['salary_grade_id'])->count();
        if ($currentCount >= 4) {
            return $this->errorResponse('Maksimal 4 jenjang dalam 1 golongan yang sama.', 422);
        }

        $validated['status'] = $validated['status'] ?? 'ACTIVE';

        $item = SalaryGradeJenjang::create($validated);
        AuditService::log('CREATE', 'SALARY_GRADE_JENJANG', SalaryGradeJenjang::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse(
            $item->load(['salaryGrade:id,code,name', 'grade:id,code,name,pangkat,level', 'masterJenjang:id,code,name']),
            'Jenjang jabatan berhasil ditambahkan.'
        );
    }

    public function show(SalaryGradeJenjang $jenjang): JsonResponse
    {
        return $this->successResponse(
            $jenjang->load(['salaryGrade:id,code,name', 'grade:id,code,name,pangkat,level', 'masterJenjang:id,code,name']),
            'Detail jenjang jabatan berhasil diambil.'
        );
    }

    public function update(Request $request, SalaryGradeJenjang $jenjang): JsonResponse
    {
        $validated = $request->validate([
            'salary_grade_id' => ['sometimes', 'required', 'exists:salary_grades,id'],
            'grade_id' => ['sometimes', 'required', 'exists:grades,id'],
            'master_jenjang_id' => ['nullable', 'exists:master_jenjangs,id'],
            'name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (array_key_exists('master_jenjang_id', $validated) && !empty($validated['master_jenjang_id'])) {
            $master = \App\Models\MasterJenjang::find($validated['master_jenjang_id']);
            if ($master) {
                $validated['name'] = $master->name;
            }
        } elseif (isset($validated['name']) && !empty($validated['name'])) {
            $master = \App\Models\MasterJenjang::firstOrCreate(
                ['name' => trim($validated['name'])],
                [
                    'code' => 'JNJ-' . str_pad((string)(\App\Models\MasterJenjang::withTrashed()->count() + 1), 3, '0', STR_PAD_LEFT),
                    'status' => 'ACTIVE',
                ]
            );
            $validated['master_jenjang_id'] = $master->id;
        }

        $salaryGradeId = $validated['salary_grade_id'] ?? $jenjang->salary_grade_id;
        $gradeId = $validated['grade_id'] ?? $jenjang->grade_id;

        // Cek kombinasi unik jika ada perubahan
        $duplicate = SalaryGradeJenjang::where('salary_grade_id', $salaryGradeId)
            ->where('grade_id', $gradeId)
            ->where('id', '!=', $jenjang->id)
            ->exists();

        if ($duplicate) {
            return $this->errorResponse('Kombinasi Golongan dan Level Jabatan ini sudah terdaftar pada jenjang lain.', 422);
        }

        $old = $jenjang->toArray();
        $jenjang->update($validated);
        AuditService::log('UPDATE', 'SALARY_GRADE_JENJANG', SalaryGradeJenjang::class, (string)$jenjang->id, oldValues: $old, newValues: $jenjang->toArray());

        return $this->successResponse(
            $jenjang->load(['salaryGrade:id,code,name', 'grade:id,code,name,pangkat,level', 'masterJenjang:id,code,name']),
            'Jenjang jabatan berhasil diperbarui.'
        );
    }

    public function destroy(SalaryGradeJenjang $jenjang): JsonResponse
    {
        $old = $jenjang->toArray();
        $jenjang->delete();
        AuditService::log('DELETE', 'SALARY_GRADE_JENJANG', SalaryGradeJenjang::class, (string)$jenjang->id, oldValues: $old);

        return $this->successResponse(null, 'Jenjang jabatan berhasil dihapus.');
    }
}

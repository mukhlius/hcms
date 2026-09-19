<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\MasterJenjang;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MasterJenjangController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = MasterJenjang::query();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $s = trim($request->query('search'));
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $items = $query->orderBy('name', 'asc')->get();

        return $this->successResponse($items, 'Daftar master jenjang berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:50', 'unique:master_jenjangs,code'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = MasterJenjang::generateCode();
        } else {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $validated['status'] = $validated['status'] ?? 'ACTIVE';

        $item = MasterJenjang::create($validated);
        AuditService::log('CREATE', 'MASTER_JENJANG', MasterJenjang::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Master jenjang berhasil ditambahkan.');
    }

    public function show(MasterJenjang $masterJenjang): JsonResponse
    {
        return $this->successResponse($masterJenjang, 'Detail master jenjang berhasil diambil.');
    }

    public function update(Request $request, MasterJenjang $masterJenjang): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('master_jenjangs', 'code')->ignore($masterJenjang->id)],
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $old = $masterJenjang->toArray();
        $masterJenjang->update($validated);

        // If name changed, optionally sync to salary_grade_jenjang where master_jenjang_id matches
        if (isset($validated['name']) && $validated['name'] !== $old['name']) {
            \App\Models\SalaryGradeJenjang::where('master_jenjang_id', $masterJenjang->id)
                ->update(['name' => $validated['name']]);
        }

        AuditService::log('UPDATE', 'MASTER_JENJANG', MasterJenjang::class, (string)$masterJenjang->id, oldValues: $old, newValues: $masterJenjang->toArray());

        return $this->successResponse($masterJenjang, 'Master jenjang berhasil diperbarui.');
    }

    public function destroy(MasterJenjang $masterJenjang): JsonResponse
    {
        // Check if used by salary_grade_jenjang
        $usageCount = $masterJenjang->salaryGradeJenjangs()->count();
        if ($usageCount > 0) {
            return $this->errorResponse("Master jenjang '{$masterJenjang->name}' sedang digunakan pada {$usageCount} pemetaan jenjang jabatan dan tidak dapat dihapus.", 422);
        }

        $old = $masterJenjang->toArray();
        $masterJenjang->delete();
        AuditService::log('DELETE', 'MASTER_JENJANG', MasterJenjang::class, (string)$masterJenjang->id, oldValues: $old);

        return $this->successResponse(null, 'Master jenjang berhasil dihapus.');
    }
}

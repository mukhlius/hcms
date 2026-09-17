<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\CustomMasterCategory;
use App\Models\CustomMasterValue;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomMasterController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $categories = CustomMasterCategory::withCount('values')->orderBy('name')->get();
        return $this->successResponse($categories, 'Daftar kategori data master kustom berhasil diambil.');
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:custom_master_categories,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = CustomMasterCategory::create($validated);
        AuditService::log('CREATE', 'CUSTOM_MASTER_CATEGORY', CustomMasterCategory::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Kategori master kustom berhasil dibuat.');
    }

    public function showCategory(CustomMasterCategory $category): JsonResponse
    {
        return $this->successResponse($category->load('values'), 'Detail kategori master kustom berhasil diambil.');
    }

    public function storeValue(Request $request, CustomMasterCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $validated['category_id'] = $category->id;
        $item = CustomMasterValue::create($validated);

        AuditService::log('CREATE', 'CUSTOM_MASTER_VALUE', CustomMasterValue::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Nilai master kustom berhasil ditambahkan.');
    }

    public function updateValue(Request $request, CustomMasterValue $value): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $value->toArray();
        $value->update($validated);

        AuditService::log('UPDATE', 'CUSTOM_MASTER_VALUE', CustomMasterValue::class, (string)$value->id, oldValues: $old, newValues: $value->fresh()->toArray());

        return $this->successResponse($value, 'Nilai master kustom berhasil diperbarui.');
    }

    public function deleteValue(CustomMasterValue $value): JsonResponse
    {
        $old = $value->toArray();
        $value->delete();

        AuditService::log('DELETE', 'CUSTOM_MASTER_VALUE', CustomMasterValue::class, (string)$value->id, oldValues: $old);

        return $this->successResponse(null, 'Nilai master kustom berhasil dihapus.');
    }
}

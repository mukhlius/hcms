<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DataScope;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $roles = Role::withCount(['permissions', 'users'])->get();

        return $this->successResponse($roles, 'Data peran berhasil dimuat');
    }

    public function show(Role $role): JsonResponse
    {
        $role->load('permissions');

        return $this->successResponse($role, 'Rincian peran berhasil dimuat');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|alpha_dash|max:50|unique:roles,name',
            'display_name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'data_scope' => ['required', Rule::enum(DataScope::class)],
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => strtoupper($validated['name']),
            'display_name' => $validated['display_name'],
            'description' => $validated['description'] ?? null,
            'data_scope' => $validated['data_scope'],
            'is_system' => false,
        ]);

        if (!empty($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        return $this->successResponse($role->load('permissions'), 'Peran baru berhasil dibuat', [], 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'display_name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'data_scope' => ['sometimes', 'required', Rule::enum(DataScope::class)],
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role->update([
            'display_name' => $validated['display_name'] ?? $role->display_name,
            'description' => $validated['description'] ?? $role->description,
            'data_scope' => $validated['data_scope'] ?? $role->data_scope,
        ]);

        if (isset($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        return $this->successResponse($role->load('permissions'), 'Peran berhasil diperbarui');
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->is_system) {
            return $this->errorResponse('Peran sistem bawaan tidak dapat dihapus.', 'SYSTEM_ROLE_PROTECTED', null, 403);
        }

        if ($role->users()->count() > 0) {
            return $this->errorResponse('Tidak dapat menghapus peran yang masih memiliki pengguna aktif.', 'ROLE_IN_USE', null, 422);
        }

        $role->delete();

        return $this->successResponse(null, 'Peran berhasil dihapus');
    }
}

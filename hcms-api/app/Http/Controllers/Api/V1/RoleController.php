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
        $roles = Role::withCount(['permissions', 'users'])
            ->with(['grades:id,code,name,level,pangkat,default_role_id'])
            ->get();

        return $this->successResponse($roles, 'Data peran berhasil dimuat');
    }

    public function show(Role $role): JsonResponse
    {
        $role->load(['permissions', 'grades:id,code,name,level,pangkat,default_role_id']);

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
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
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

        if (isset($validated['grade_ids'])) {
            \App\Models\Grade::whereIn('id', $validated['grade_ids'])->update(['default_role_id' => $role->id]);
        }

        return $this->successResponse(
            $role->load(['permissions', 'grades:id,code,name,level,pangkat,default_role_id']),
            'Peran baru berhasil dibuat',
            [],
            201
        );
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'display_name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'data_scope' => ['sometimes', 'required', Rule::enum(DataScope::class)],
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'exists:permissions,id',
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
        ]);

        $role->update([
            'display_name' => $validated['display_name'] ?? $role->display_name,
            'description' => $validated['description'] ?? $role->description,
            'data_scope' => $validated['data_scope'] ?? $role->data_scope,
        ]);

        if (isset($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        if (isset($validated['grade_ids'])) {
            // Lepas grade yang sebelumnya terhubung ke role ini tetapi tidak dipilih lagi
            \App\Models\Grade::where('default_role_id', $role->id)
                ->whereNotIn('id', $validated['grade_ids'])
                ->update(['default_role_id' => null]);

            // Hubungkan grade yang dipilih ke role ini
            if (!empty($validated['grade_ids'])) {
                \App\Models\Grade::whereIn('id', $validated['grade_ids'])->update(['default_role_id' => $role->id]);
            }
        }

        return $this->successResponse(
            $role->load(['permissions', 'grades:id,code,name,level,pangkat,default_role_id']),
            'Peran berhasil diperbarui'
        );
    }

    public function destroy(Role $role): JsonResponse
    {
        if (strtoupper($role->name) === 'SUPER_ADMIN' || $role->id === 1) {
            return $this->errorResponse('Peran Super Administrator adalah peran sistem utama dan tidak dapat dihapus.', 'SYSTEM_ROLE_PROTECTED', null, 403);
        }

        // Lepaskan grade yang terhubung
        \App\Models\Grade::where('default_role_id', $role->id)->update(['default_role_id' => null]);

        // Detach related permissions and users
        $role->permissions()->detach();
        $role->users()->detach();

        $role->delete();

        return $this->successResponse(null, 'Peran berhasil dihapus');
    }

    public function syncEmployees(\App\Services\RoleAssignmentService $roleAssignmentService): JsonResponse
    {
        $result = $roleAssignmentService->syncAllEmployeesRoles();

        return $this->successResponse(
            $result,
            "Sinkronisasi peran berhasil dilakukan untuk {$result['synced_count']} pengguna karyawan."
        );
    }
}

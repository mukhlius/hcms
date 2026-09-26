<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Grade;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RoleAssignmentService
{
    /**
     * Daftar nama peran standar berbasis level jabatan
     */
    public const LEVEL_ROLE_NAMES = [
        'SITE_MANAGEMENT',
        'DEPARTMENT_HEAD',
        'SECTION_HEAD',
        'GROUP_LEADER',
        'STAFF_OFFICER',
        'EMPLOYEE',
    ];

    /**
     * Sinkronisasikan peran pengguna untuk satu karyawan berdasarkan level jabatannya.
     * Peran khusus (seperti SUPER_ADMIN atau peran fungsional kustom) akan dipertahankan.
     */
    public function syncEmployeeRole(Employee $employee): ?Role
    {
        if (!$employee->user_id) {
            return null;
        }

        $user = $employee->user ?? User::find($employee->user_id);
        if (!$user) {
            return null;
        }

        // Tentukan grade: pertama dari employee->grade_id, fallback ke employee->position->grade_id
        $grade = null;
        if ($employee->grade_id) {
            $grade = $employee->grade ?? Grade::find($employee->grade_id);
        }
        if (!$grade && $employee->position_id) {
            $position = $employee->position ?? \App\Models\Position::with('grade')->find($employee->position_id);
            $grade = $position?->grade;
        }

        if (!$grade || !$grade->default_role_id) {
            return null;
        }

        $targetRole = Role::find($grade->default_role_id);
        if (!$targetRole) {
            return null;
        }

        DB::transaction(function () use ($user, $targetRole) {
            // Ambil ID semua peran bawaan level jabatan
            $allLevelRoleIds = Role::whereIn('name', self::LEVEL_ROLE_NAMES)->pluck('id')->toArray();

            // Ambil peran user saat ini
            $currentUserRoleIds = $user->roles()->pluck('roles.id')->toArray();

            // Pisahkan peran custom/khusus (di luar level jabatan) agar tetap dipertahankan
            $customRoleIds = array_diff($currentUserRoleIds, $allLevelRoleIds);

            // Tambahkan peran target baru
            $newRoleIds = array_unique(array_merge($customRoleIds, [$targetRole->id]));

            $user->roles()->sync($newRoleIds);
        });

        return $targetRole;
    }

    /**
     * Sinkronisasikan peran untuk seluruh karyawan yang telah memiliki akun login.
     * Mengembalikan data statistik keberhasilan sinkronisasi.
     */
    public function syncAllEmployeesRoles(): array
    {
        $employees = Employee::whereNotNull('user_id')
            ->with(['user.roles', 'grade', 'position.grade'])
            ->get();

        $syncedCount = 0;
        $skippedCount = 0;
        $summary = [];

        foreach ($employees as $emp) {
            $assignedRole = $this->syncEmployeeRole($emp);
            if ($assignedRole) {
                $syncedCount++;
                $summary[] = [
                    'employee_id' => $emp->id,
                    'nrp' => $emp->nrp,
                    'name' => $emp->name,
                    'grade' => $emp->grade?->name ?? $emp->position?->grade?->name ?? '-',
                    'assigned_role' => $assignedRole->display_name,
                ];
            } else {
                $skippedCount++;
            }
        }

        return [
            'total_evaluated' => $employees->count(),
            'synced_count' => $syncedCount,
            'skipped_count' => $skippedCount,
            'summary' => $summary,
        ];
    }
}

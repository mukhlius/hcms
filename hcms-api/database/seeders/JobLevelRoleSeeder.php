<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JobLevelRoleSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Role Definitions for Job Levels
            $roleConfigs = [
                'SITE_MANAGEMENT' => [
                    'display_name' => 'Manajemen Site (Pimpinan Unit)',
                    'description' => 'Wewenang pimpinan site (Project Manager / Deputy) dengan kendali manajerial site tambang',
                    'data_scope' => 'SITE',
                    'is_system' => false,
                    'permissions' => [
                        'admin.access',
                        'users.view',
                        'employees.view', 'employees.export', 'employees.approve',
                        'organization.view', 'organizations.view', 'position.view',
                        'company-documents.view', 'company-documents.download',
                        'audit.view',
                        'workflow.view', 'workflow.execute',
                        'approvals.view', 'approvals.execute',
                        'mss.view', 'mss.team', 'mss.attendance', 'mss.roster', 'mss.performance',
                        'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.claims', 'ess.payslip', 'ess.documents',
                    ],
                ],
                'DEPARTMENT_HEAD' => [
                    'display_name' => 'Kepala Departemen (Dept Head)',
                    'description' => 'Otoritas pimpinan departemen untuk pengawasan operasional dan persetujuan alur kerja se-departemen',
                    'data_scope' => 'DEPARTMENT',
                    'is_system' => false,
                    'permissions' => [
                        'admin.access',
                        'users.view',
                        'employees.view',
                        'organization.view', 'position.view',
                        'company-documents.view', 'company-documents.download',
                        'workflow.view', 'workflow.execute',
                        'approvals.view', 'approvals.execute',
                        'mss.view', 'mss.team', 'mss.attendance', 'mss.roster', 'mss.performance',
                        'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.claims', 'ess.payslip', 'ess.documents',
                    ],
                ],
                'SECTION_HEAD' => [
                    'display_name' => 'Kepala Seksi (Section Head)',
                    'description' => 'Otoritas supervisi tingkat seksi/divisi kerja dan pengesahan berjenjang pengajuan bawahan',
                    'data_scope' => 'SUBORDINATES',
                    'is_system' => false,
                    'permissions' => [
                        'company-documents.view', 'company-documents.download',
                        'workflow.view', 'workflow.execute',
                        'approvals.view', 'approvals.execute',
                        'mss.view', 'mss.team', 'mss.attendance', 'mss.roster', 'mss.performance',
                        'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.claims', 'ess.payslip', 'ess.documents',
                    ],
                ],
                'GROUP_LEADER' => [
                    'display_name' => 'Pengawas Lapangan (Group Leader)',
                    'description' => 'Pengawas lini pertama lapangan (pit supervisor/foreman) dengan akses presensi & roster bawahan langsung',
                    'data_scope' => 'SUBORDINATES',
                    'is_system' => false,
                    'permissions' => [
                        'company-documents.view', 'company-documents.download',
                        'workflow.view', 'workflow.execute',
                        'approvals.view', 'approvals.execute',
                        'mss.view', 'mss.team', 'mss.attendance', 'mss.roster',
                        'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.claims', 'ess.payslip', 'ess.documents',
                    ],
                ],
                'STAFF_OFFICER' => [
                    'display_name' => 'Staf Operasional (Officer)',
                    'description' => 'Staf fungsional profesional operasional dan administrasi spesifik kantor/lapangan',
                    'data_scope' => 'SELF',
                    'is_system' => false,
                    'permissions' => [
                        'company-documents.view', 'company-documents.download',
                        'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.claims', 'ess.payslip', 'ess.documents',
                    ],
                ],
                'EMPLOYEE' => [
                    'display_name' => 'Karyawan Pelaksana (Non-Staf)',
                    'description' => 'Karyawan operasional mandiri (operator, mekanik, helper, security, admin pendukung) dengan akses ESS',
                    'data_scope' => 'SELF',
                    'is_system' => false,
                    'permissions' => [
                        'company-documents.view', 'company-documents.download',
                        'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.claims', 'ess.payslip', 'ess.documents',
                    ],
                ],
            ];

            $createdRoles = [];
            foreach ($roleConfigs as $roleName => $cfg) {
                $role = Role::updateOrCreate(
                    ['name' => $roleName],
                    [
                        'display_name' => $cfg['display_name'],
                        'description' => $cfg['description'],
                        'data_scope' => $cfg['data_scope'],
                        'is_system' => $cfg['is_system'],
                    ]
                );

                $permissionIds = Permission::whereIn('name', $cfg['permissions'])->pluck('id')->toArray();
                $role->permissions()->sync($permissionIds);
                $createdRoles[$roleName] = $role;
            }

            // 2. Hubungkan Grade ke Default Role
            // Level 1: Project Manager (PM) -> SITE_MANAGEMENT
            // Level 2: Deputy Project Manager (DPM) -> SITE_MANAGEMENT
            // Level 3: Department Head (DH) -> DEPARTMENT_HEAD
            // Level 4: Section Head (SH) -> SECTION_HEAD
            // Level 5: Group Leader (GL) -> GROUP_LEADER
            // Level 6: Officer (OFF) -> STAFF_OFFICER
            // Level 7: Non Staff (ADM, SEC, OPT, MEC, NS, HEL, DSP, FGDP) -> EMPLOYEE

            $levelRoleMap = [
                1 => 'SITE_MANAGEMENT',
                2 => 'SITE_MANAGEMENT',
                3 => 'DEPARTMENT_HEAD',
                4 => 'SECTION_HEAD',
                5 => 'GROUP_LEADER',
                6 => 'STAFF_OFFICER',
                7 => 'EMPLOYEE',
            ];

            $grades = Grade::all();
            foreach ($grades as $grade) {
                $roleKey = $levelRoleMap[$grade->level] ?? 'EMPLOYEE';
                if (isset($createdRoles[$roleKey])) {
                    $grade->update([
                        'default_role_id' => $createdRoles[$roleKey]->id,
                    ]);
                }
            }
        });
    }
}

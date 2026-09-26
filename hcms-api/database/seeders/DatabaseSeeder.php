<?php

namespace Database\Seeders;

use App\Models\OrganizationCompany;
use App\Models\OrganizationDepartment;
use App\Models\OrganizationSite;
use App\Models\PasswordHistory;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Organization Hierarchy Foundation
        $company = OrganizationCompany::create([
            'code' => 'CMN-CORP',
            'name' => 'PT Coal Mining Nusantara',
            'is_active' => true,
        ]);

        $siteSgt = OrganizationSite::create([
            'company_id' => $company->id,
            'code' => 'SGT-NORTH',
            'name' => 'Site Sangatta North',
            'location' => 'East Kutai, East Kalimantan',
            'is_active' => true,
        ]);

        $siteBgl = OrganizationSite::create([
            'company_id' => $company->id,
            'code' => 'BGL-EAST',
            'name' => 'Site Bengalon East',
            'location' => 'East Kutai, East Kalimantan',
            'is_active' => true,
        ]);

        $siteMlk = OrganizationSite::create([
            'company_id' => $company->id,
            'code' => 'MLK-WEST',
            'name' => 'Site Melak Pit',
            'location' => 'West Kutai, East Kalimantan',
            'is_active' => true,
        ]);

        $deptHcga = OrganizationDepartment::create([
            'site_id' => $siteSgt->id,
            'code' => 'HCGA-SGT',
            'name' => 'Human Capital & General Affairs',
            'is_active' => true,
        ]);

        $deptOps = OrganizationDepartment::create([
            'site_id' => $siteSgt->id,
            'code' => 'MINE-OPS-SGT',
            'name' => 'Mining Operations & Heavy Equipment',
            'is_active' => true,
        ]);

        $deptHse = OrganizationDepartment::create([
            'site_id' => $siteSgt->id,
            'code' => 'HSE-SGT',
            'name' => 'Health, Safety & Environment',
            'is_active' => true,
        ]);

        // 2. Granular Permissions
        $permissionDefs = [
            // users
            ['name' => 'users.view', 'display_name' => 'View Users', 'group' => 'users'],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'group' => 'users'],
            ['name' => 'users.update', 'display_name' => 'Update Users', 'group' => 'users'],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'group' => 'users'],
            ['name' => 'users.approve', 'display_name' => 'Approve User Changes', 'group' => 'users'],
            ['name' => 'users.reject', 'display_name' => 'Reject User Changes', 'group' => 'users'],
            ['name' => 'users.verify', 'display_name' => 'Verify User Identity', 'group' => 'users'],
            ['name' => 'users.export', 'display_name' => 'Export Users Data', 'group' => 'users'],
            ['name' => 'users.import', 'display_name' => 'Import Users Data', 'group' => 'users'],
            ['name' => 'users.print', 'display_name' => 'Print User Records', 'group' => 'users'],
            ['name' => 'users.download', 'display_name' => 'Download User Files', 'group' => 'users'],
            ['name' => 'users.upload', 'display_name' => 'Upload User Files', 'group' => 'users'],
            ['name' => 'users.execute', 'display_name' => 'Execute User Commands', 'group' => 'users'],

            // roles
            ['name' => 'roles.view', 'display_name' => 'View Roles', 'group' => 'roles'],
            ['name' => 'roles.create', 'display_name' => 'Create Roles', 'group' => 'roles'],
            ['name' => 'roles.update', 'display_name' => 'Update Roles', 'group' => 'roles'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Roles', 'group' => 'roles'],

            // permissions
            ['name' => 'permissions.view', 'display_name' => 'View Permissions', 'group' => 'permissions'],
            ['name' => 'permissions.assign', 'display_name' => 'Assign Permissions', 'group' => 'permissions'],

            // security
            ['name' => 'security.view', 'display_name' => 'View Security Events', 'group' => 'security'],
            ['name' => 'security.manage', 'display_name' => 'Manage Security Policies', 'group' => 'security'],

            // sessions
            ['name' => 'sessions.view', 'display_name' => 'View Active Sessions', 'group' => 'sessions'],
            ['name' => 'sessions.revoke', 'display_name' => 'Revoke User Sessions', 'group' => 'sessions'],

            // audit
            ['name' => 'audit.view', 'display_name' => 'View Audit Trail', 'group' => 'audit'],
            ['name' => 'audit.export', 'display_name' => 'Export Audit Logs', 'group' => 'audit'],

            // settings
            ['name' => 'settings.view', 'display_name' => 'View System Settings', 'group' => 'settings'],
            ['name' => 'settings.update', 'display_name' => 'Update System Settings', 'group' => 'settings'],

            // workflow
            ['name' => 'workflow.view', 'display_name' => 'View Workflows', 'group' => 'workflow'],
            ['name' => 'workflow.create', 'display_name' => 'Create Workflows', 'group' => 'workflow'],
            ['name' => 'workflow.update', 'display_name' => 'Update Workflows', 'group' => 'workflow'],
            ['name' => 'workflow.execute', 'display_name' => 'Execute Workflow Approvals', 'group' => 'workflow'],
        ];

        $allPermissionModels = [];
        foreach ($permissionDefs as $perm) {
            $allPermissionModels[$perm['name']] = Permission::create($perm);
        }

        // 3. Default Enterprise Roles (Only Super Administrator)
        $superAdminRole = Role::create([
            'name' => 'SUPER_ADMIN',
            'display_name' => 'Super Administrator',
            'description' => 'Unrestricted global enterprise system authority',
            'data_scope' => 'GLOBAL',
            'is_system' => true,
        ]);
        $superAdminRole->permissions()->sync(array_values(array_map(fn($p) => $p->id, $allPermissionModels)));

        // 4. Default System Settings
        $settings = [
            // Password Policy
            ['category' => 'PASSWORD_POLICY', 'key' => 'password_min_length', 'value' => '8', 'type' => 'integer', 'label' => 'Minimum Length', 'description' => 'Minimum characters required for user passwords.'],
            ['category' => 'PASSWORD_POLICY', 'key' => 'password_require_uppercase', 'value' => '1', 'type' => 'boolean', 'label' => 'Require Uppercase', 'description' => 'Password must contain at least one uppercase letter.'],
            ['category' => 'PASSWORD_POLICY', 'key' => 'password_require_lowercase', 'value' => '1', 'type' => 'boolean', 'label' => 'Require Lowercase', 'description' => 'Password must contain at least one lowercase letter.'],
            ['category' => 'PASSWORD_POLICY', 'key' => 'password_require_number', 'value' => '1', 'type' => 'boolean', 'label' => 'Require Number', 'description' => 'Password must contain at least one number.'],
            ['category' => 'PASSWORD_POLICY', 'key' => 'password_require_special', 'value' => '1', 'type' => 'boolean', 'label' => 'Require Special Character', 'description' => 'Password must contain special symbols like @, #, $, %, etc.'],
            ['category' => 'PASSWORD_POLICY', 'key' => 'password_history_limit', 'value' => '5', 'type' => 'integer', 'label' => 'Password History Limit', 'description' => 'Number of previous passwords that cannot be reused.'],

            // Security & Authentication
            ['category' => 'SECURITY', 'key' => 'account_lock_threshold', 'value' => '5', 'type' => 'integer', 'label' => 'Account Lock Threshold', 'description' => 'Number of consecutive failed attempts before locking the account.'],
            ['category' => 'SECURITY', 'key' => 'account_lock_duration_minutes', 'value' => '15', 'type' => 'integer', 'label' => 'Lock Duration (Minutes)', 'description' => 'How long a locked user must wait before auto-unlocking.'],
            ['category' => 'AUTHENTICATION', 'key' => 'login_rate_limit_max_attempts', 'value' => '5', 'type' => 'integer', 'label' => 'Rate Limit Max Attempts', 'description' => 'Max attempts per minute on login endpoint per IP/identifier.'],
            ['category' => 'SESSION', 'key' => 'session_idle_timeout_minutes', 'value' => '120', 'type' => 'integer', 'label' => 'Session Timeout (Minutes)', 'description' => 'Idle minutes before an active session is automatically expired.'],
            ['category' => 'GENERAL', 'key' => 'app_timezone', 'value' => 'Asia/Makassar', 'type' => 'string', 'label' => 'System Timezone', 'description' => 'Default operational timezone (WITA for East Kalimantan mining).'],
            ['category' => 'GENERAL', 'key' => 'app_locale', 'value' => 'en', 'type' => 'string', 'label' => 'Default Language', 'description' => 'Primary interface localization language.'],
        ];

        foreach ($settings as $setting) {
            SystemSetting::create($setting);
        }

        // 5. Generic Workflow Definition Foundation
        $leaveWorkflow = WorkflowDefinition::create([
            'code' => 'EMPLOYEE_LEAVE_APPROVAL',
            'name' => 'Annual & Roster Leave Approval',
            'description' => 'Multi-step approval workflow for mining roster leaves',
            'module' => 'attendance',
            'is_active' => true,
            'version' => 1,
        ]);

        WorkflowStep::create([
            'workflow_definition_id' => $leaveWorkflow->id,
            'step_order' => 1,
            'name' => 'Shift Supervisor Endorsement',
            'approver_type' => 'SUPERVISOR',
            'is_required' => true,
        ]);

        WorkflowStep::create([
            'workflow_definition_id' => $leaveWorkflow->id,
            'step_order' => 2,
            'name' => 'Department Superintendent Approval',
            'approver_type' => 'MANAGER',
            'is_required' => true,
        ]);

        WorkflowStep::create([
            'workflow_definition_id' => $leaveWorkflow->id,
            'step_order' => 3,
            'name' => 'Site HC Operations Verification',
            'approver_type' => 'HC_MANAGER',
            'is_required' => true,
        ]);

        // 6. Enterprise Seed Users
        $defaultPassword = Hash::make('Password@123');

        // Super Admin
        $admin = User::create([
            'uuid' => (string) Str::uuid(),
            'username' => 'admin',
            'name' => 'Super Administrator',
            'email' => 'admin@cmn.mining.local',
            'password' => $defaultPassword,
            'status' => 'ACTIVE',
            'company_id' => $company->id,
            'site_id' => $siteSgt->id,
            'department_id' => $deptHcga->id,
            'force_password_change' => false,
            'password_changed_at' => now(),
        ]);
        $admin->roles()->attach($superAdminRole->id);
        PasswordHistory::create(['user_id' => $admin->id, 'password_hash' => $defaultPassword]);

        // HC Admin
        $hcAdmin = User::create([
            'uuid' => (string) Str::uuid(),
            'username' => 'hc_admin',
            'name' => 'Dewi Sartika (HC Corp)',
            'email' => 'hc.admin@cmn.mining.local',
            'password' => $defaultPassword,
            'status' => 'ACTIVE',
            'company_id' => $company->id,
            'site_id' => $siteSgt->id,
            'department_id' => $deptHcga->id,
            'force_password_change' => false,
            'password_changed_at' => now(),
        ]);
        PasswordHistory::create(['user_id' => $hcAdmin->id, 'password_hash' => $defaultPassword]);

        // HC Manager Sangatta
        $hcManager = User::create([
            'uuid' => (string) Str::uuid(),
            'username' => 'hc_sgt',
            'name' => 'Bambang Trihatmodjo (HC Manager)',
            'email' => 'hc.sgt@cmn.mining.local',
            'password' => $defaultPassword,
            'status' => 'ACTIVE',
            'company_id' => $company->id,
            'site_id' => $siteSgt->id,
            'department_id' => $deptHcga->id,
            'force_password_change' => false,
            'password_changed_at' => now(),
        ]);
        PasswordHistory::create(['user_id' => $hcManager->id, 'password_hash' => $defaultPassword]);

        // Mining Operations Supervisor
        $spvOps = User::create([
            'uuid' => (string) Str::uuid(),
            'username' => 'spv_ops',
            'name' => 'Agus Pratama (Pit Supervisor)',
            'email' => 'spv.ops@cmn.mining.local',
            'password' => $defaultPassword,
            'status' => 'ACTIVE',
            'company_id' => $company->id,
            'site_id' => $siteSgt->id,
            'department_id' => $deptOps->id,
            'force_password_change' => false,
            'password_changed_at' => now(),
        ]);
        PasswordHistory::create(['user_id' => $spvOps->id, 'password_hash' => $defaultPassword]);

        // Employee Demo
        $employee = User::create([
            'uuid' => (string) Str::uuid(),
            'username' => 'employee_demo',
            'name' => 'Rian Kurniawan (Heavy Equipment Operator)',
            'email' => 'employee@cmn.mining.local',
            'password' => $defaultPassword,
            'status' => 'ACTIVE',
            'company_id' => $company->id,
            'site_id' => $siteSgt->id,
            'department_id' => $deptOps->id,
            'force_password_change' => false,
            'password_changed_at' => now(),
        ]);
        PasswordHistory::create(['user_id' => $employee->id, 'password_hash' => $defaultPassword]);
    }
}

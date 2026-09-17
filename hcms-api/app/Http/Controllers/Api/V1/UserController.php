<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\SecurityEventType;
use App\Enums\SecuritySeverity;
use App\Enums\UserStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\LoginHistory;
use App\Models\Role;
use App\Models\SecurityEvent;
use App\Models\User;
use App\Models\UserSession;
use App\Services\AuditService;
use App\Services\PasswordPolicyService;
use App\Services\ScopeResolverService;
use App\Services\SecurityEventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $query = User::query()->with(['roles', 'site', 'department', 'company']);

        // Enforce organizational data scope
        ScopeResolverService::applyUserScope($query, $currentUser);

        // Filters
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($role = $request->input('role')) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        if ($siteId = $request->input('site_id')) {
            $query->where('site_id', $siteId);
        }

        if ($departmentId = $request->input('department_id')) {
            $query->where('department_id', $departmentId);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowedSorts = ['id', 'name', 'username', 'email', 'status', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $query->paginate($perPage);

        $data = $paginated->getCollection()->map(function ($user) {
            return [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'failed_login_attempts' => $user->failed_login_attempts,
                'locked_until' => $user->locked_until?->toIso8601String(),
                'force_password_change' => $user->force_password_change,
                'roles' => $user->roles->map(fn($r) => ['id' => $r->id, 'name' => $r->name, 'display_name' => $r->display_name]),
                'company' => $user->company ? ['id' => $user->company->id, 'name' => $user->company->name] : null,
                'site' => $user->site ? ['id' => $user->site->id, 'name' => $user->site->name] : null,
                'department' => $user->department ? ['id' => $user->department->id, 'name' => $user->department->name] : null,
                'created_at' => $user->created_at->toIso8601String(),
            ];
        });

        return $this->successResponse($data, 'Data pengguna berhasil dimuat', [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $user->load(['roles.permissions', 'directPermissions', 'company', 'site', 'department']);

        // 8 deep sections
        $sessions = UserSession::where('user_id', $user->id)->latest()->take(10)->get();
        $loginHistories = LoginHistory::where('user_id', $user->id)->latest()->take(10)->get();
        $securityEvents = SecurityEvent::where('user_id', $user->id)->orWhere('actor_id', $user->id)->latest()->take(10)->get();
        $auditLogs = AuditLog::where('entity_type', User::class)->where('entity_id', (string) $user->id)->latest()->take(10)->get();

        $detail = [
            'identity' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'company' => $user->company,
                'site' => $user->site,
                'department' => $user->department,
            ],
            'account' => [
                'status' => $user->status,
                'failed_login_attempts' => $user->failed_login_attempts,
                'locked_until' => $user->locked_until?->toIso8601String(),
                'password_changed_at' => $user->password_changed_at?->toIso8601String(),
                'force_password_change' => $user->force_password_change,
                'created_at' => $user->created_at->toIso8601String(),
            ],
            'roles' => $user->roles,
            'permissions' => [
                'effective' => $user->getAllPermissions(),
                'direct' => $user->directPermissions,
            ],
            'sessions' => $sessions,
            'login_history' => $loginHistories,
            'security_events' => $securityEvents,
            'audit_trail' => $auditLogs,
        ];

        return $this->successResponse($detail, 'Rincian pengguna berhasil dimuat');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|alpha_dash|max:50|unique:users,username',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'status' => ['nullable', Rule::enum(UserStatus::class)],
            'company_id' => 'nullable|exists:organization_companies,id',
            'site_id' => 'nullable|exists:organization_sites,id',
            'department_id' => 'nullable|exists:organization_departments,id',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:roles,id',
            'force_password_change' => 'nullable|boolean',
        ]);

        $violations = PasswordPolicyService::validate($validated['password']);
        if (!empty($violations)) {
            return $this->errorResponse('Password policy violation', 'PASSWORD_POLICY_VIOLATION', $violations, 422);
        }

        $user = DB::transaction(function () use ($validated, $request) {
            $hashed = Hash::make($validated['password']);

            $user = User::create([
                'username' => $validated['username'],
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $hashed,
                'status' => $validated['status'] ?? 'ACTIVE',
                'company_id' => $validated['company_id'] ?? null,
                'site_id' => $validated['site_id'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'force_password_change' => $validated['force_password_change'] ?? true,
                'password_changed_at' => now(),
            ]);

            PasswordPolicyService::recordHistory($user, $hashed);

            if (!empty($validated['role_ids'])) {
                $user->roles()->sync($validated['role_ids']);
            }

            return $user;
        });

        return $this->successResponse($user->load('roles'), 'Pengguna baru berhasil ditambahkan', [], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'status' => ['sometimes', 'required', Rule::enum(UserStatus::class)],
            'company_id' => 'nullable|exists:organization_companies,id',
            'site_id' => 'nullable|exists:organization_sites,id',
            'department_id' => 'nullable|exists:organization_departments,id',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:roles,id',
            'force_password_change' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($user, $validated) {
            $user->update([
                'name' => $validated['name'] ?? $user->name,
                'email' => $validated['email'] ?? $user->email,
                'status' => $validated['status'] ?? $user->status,
                'company_id' => array_key_exists('company_id', $validated) ? $validated['company_id'] : $user->company_id,
                'site_id' => array_key_exists('site_id', $validated) ? $validated['site_id'] : $user->site_id,
                'department_id' => array_key_exists('department_id', $validated) ? $validated['department_id'] : $user->department_id,
                'force_password_change' => $validated['force_password_change'] ?? $user->force_password_change,
            ]);

            if (isset($validated['role_ids'])) {
                $user->roles()->sync($validated['role_ids']);
            }
        });

        return $this->successResponse($user->load('roles'), 'Profil pengguna berhasil diperbarui');
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->hasRole('SUPER_ADMIN')) {
            return $this->errorResponse('Super Administrator sistem tidak dapat dihapus.', 'FORBIDDEN_ACTION', null, 403);
        }

        $user->delete();

        return $this->successResponse(null, 'Pengguna berhasil dihapus');
    }

    public function unlock(User $user): JsonResponse
    {
        $user->update([
            'status' => 'ACTIVE',
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        SecurityEventService::log(
            eventType: SecurityEventType::ACCOUNT_UNLOCKED->value,
            severity: SecuritySeverity::INFO->value,
            userId: $user->id
        );

        return $this->successResponse(null, 'Kunci akun pengguna berhasil dibuka');
    }

    public function resetUserPassword(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $violations = PasswordPolicyService::validate($request->input('password'), $user);
        if (!empty($violations)) {
            return $this->errorResponse('Pelanggaran kebijakan password', 'PASSWORD_POLICY_VIOLATION', $violations, 422);
        }

        $hashed = Hash::make($request->input('password'));
        $user->update([
            'password' => $hashed,
            'password_changed_at' => now(),
            'force_password_change' => true,
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        PasswordPolicyService::recordHistory($user, $hashed);

        // Revoke user tokens
        $user->tokens()->delete();
        UserSession::where('user_id', $user->id)->update(['revoked_at' => now()]);

        SecurityEventService::log(
            eventType: SecurityEventType::PASSWORD_CHANGED->value,
            severity: SecuritySeverity::WARNING->value,
            userId: $user->id,
            metadata: ['initiated_by' => 'ADMIN']
        );

        return $this->successResponse(null, 'Password telah diatur ulang dan seluruh sesi aktif diputus.');
    }

    public function revokeSessions(User $user): JsonResponse
    {
        $user->tokens()->delete();
        UserSession::where('user_id', $user->id)->update(['revoked_at' => now()]);

        SecurityEventService::log(
            eventType: SecurityEventType::SESSION_REVOKED->value,
            severity: SecuritySeverity::WARNING->value,
            userId: $user->id,
            metadata: ['scope' => 'ALL_SESSIONS', 'initiated_by' => 'ADMIN']
        );

        return $this->successResponse(null, 'Seluruh sesi aktif pengguna berhasil dicabut.');
    }
}

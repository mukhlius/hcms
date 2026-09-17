<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\SecurityEventType;
use App\Enums\SecuritySeverity;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\LoginHistory;
use App\Models\PasswordHistory;
use App\Models\User;
use App\Models\UserSession;
use App\Services\AuditService;
use App\Services\PasswordPolicyService;
use App\Services\SecurityEventService;
use App\Services\SystemSettingService;
use App\Support\RequestContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends BaseApiController
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'remember_me' => 'nullable|boolean',
        ]);

        $identifier = $request->input('username');
        $user = User::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        $ip = $request->ip() ?? '127.0.0.1';
        $userAgent = $request->userAgent() ?? 'Unknown';

        // Check if user exists and is locked
        if ($user && $user->isLocked()) {
            LoginHistory::create([
                'user_id' => $user->id,
                'identifier' => $identifier,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'status' => 'LOCKED',
                'failure_reason' => 'Account is currently locked due to failed attempts or administrative action',
                'logged_in_at' => now(),
            ]);

            return $this->errorResponse(
                'Akun Anda saat ini terkunci. Silakan hubungi Administrator HC.',
                'ACCOUNT_LOCKED',
                null,
                423
            );
        }

        $throttleKey = Str::transliterate(Str::lower($request->input('username')) . '|' . $request->ip());
        $maxAttempts = (int) SystemSettingService::get('login_rate_limit_max_attempts', 5);

        if (RateLimiter::tooManyAttempts($throttleKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return $this->errorResponse(
                "Terlalu banyak percobaan masuk. Silakan coba kembali dalam {$seconds} detik.",
                'TOO_MANY_ATTEMPTS',
                ['retry_after' => $seconds],
                429
            );
        }

        // Check if user is suspended or inactive
        if ($user && in_array($user->status, ['INACTIVE', 'SUSPENDED', 'PENDING'])) {
            return $this->errorResponse(
                "Akun Anda berstatus {$user->status}. Silakan hubungi Operasional HC.",
                'ACCOUNT_DISABLED',
                null,
                403
            );
        }

        // Check password validity
        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            if ($user) {
                $user->increment('failed_login_attempts');
                $lockThreshold = (int) SystemSettingService::get('account_lock_threshold', 5);

                if ($user->failed_login_attempts >= $lockThreshold) {
                    $lockMinutes = (int) SystemSettingService::get('account_lock_duration_minutes', 15);
                    $user->update([
                        'status' => 'LOCKED',
                        'locked_until' => now()->addMinutes($lockMinutes),
                    ]);

                    SecurityEventService::log(
                        eventType: SecurityEventType::ACCOUNT_LOCKED->value,
                        severity: SecuritySeverity::HIGH->value,
                        userId: $user->id,
                        metadata: ['reason' => "Melebihi {$lockThreshold} percobaan gagal", 'ip' => $ip]
                    );
                }

                SecurityEventService::log(
                    eventType: SecurityEventType::LOGIN_FAILED->value,
                    severity: SecuritySeverity::WARNING->value,
                    userId: $user->id,
                    metadata: ['identifier' => $identifier, 'ip' => $ip]
                );
            }

            LoginHistory::create([
                'user_id' => $user?->id,
                'identifier' => $identifier,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'status' => 'FAILED',
                'failure_reason' => 'Kredensial tidak valid',
                'logged_in_at' => now(),
            ]);

            return $this->errorResponse(
                'Kredensial login (username atau password) tidak valid.',
                'INVALID_CREDENTIALS',
                null,
                401
            );
        }

        // Successful Authentication
        RateLimiter::clear($throttleKey);

        $user->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        $tokenName = 'auth_token_' . now()->timestamp;
        $token = $user->createToken($tokenName)->plainTextToken;

        // Create UserSession record
        $sessionId = (string) Str::uuid();
        $session = UserSession::create([
            'id' => $sessionId,
            'user_id' => $user->id,
            'token_id' => explode('|', $token)[0] ?? null,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'device' => $this->detectDevice($userAgent),
            'browser' => $this->detectBrowser($userAgent),
            'operating_system' => $this->detectOS($userAgent),
            'last_activity_at' => now(),
        ]);

        LoginHistory::create([
            'user_id' => $user->id,
            'identifier' => $identifier,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'device' => $session->device,
            'browser' => $session->browser,
            'operating_system' => $session->operating_system,
            'status' => 'SUCCESS',
            'logged_in_at' => now(),
        ]);

        SecurityEventService::log(
            eventType: SecurityEventType::LOGIN_SUCCESS->value,
            severity: SecuritySeverity::INFO->value,
            userId: $user->id,
            metadata: ['session_id' => $sessionId, 'ip' => $ip]
        );

        AuditService::log(
            action: 'LOGIN',
            module: 'auth',
            entityType: User::class,
            entityId: (string) $user->id,
            actorId: $user->id
        );

        return $this->successResponse([
            'token' => $token,
            'session_id' => $sessionId,
            'user' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'force_password_change' => $user->force_password_change,
                'data_scope' => $user->getDataScope(),
                'roles' => $user->roles->pluck('name'),
                'permissions' => $user->getAllPermissions(),
            ]
        ], 'Autentikasi berhasil.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles', 'company', 'site', 'department']);

        return $this->successResponse([
            'id' => $user->id,
            'uuid' => $user->uuid,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'force_password_change' => $user->force_password_change,
            'data_scope' => $user->getDataScope(),
            'company' => $user->company?->name,
            'site' => $user->site?->name,
            'department' => $user->department?->name,
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getAllPermissions(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke current Sanctum token
        $request->user()->currentAccessToken()->delete();

        // Update active session record
        UserSession::where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->latest('last_activity_at')
            ->first()
            ?->update(['revoked_at' => now()]);

        AuditService::log(
            action: 'LOGOUT',
            module: 'auth',
            entityType: User::class,
            entityId: (string) $user->id,
            actorId: $user->id
        );

        return $this->successResponse(null, 'Berhasil keluar dari sesi.');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return $this->errorResponse('Password saat ini tidak sesuai.', 'INVALID_PASSWORD', null, 422);
        }

        $newPassword = $request->input('new_password');

        $violations = PasswordPolicyService::validate($newPassword, $user);
        if (!empty($violations)) {
            return $this->errorResponse('Password tidak memenuhi ketentuan kebijakan keamanan perusahaan.', 'PASSWORD_POLICY_VIOLATION', $violations, 422);
        }

        $hashed = Hash::make($newPassword);
        $user->update([
            'password' => $hashed,
            'password_changed_at' => now(),
            'force_password_change' => false,
        ]);

        PasswordPolicyService::recordHistory($user, $hashed);

        SecurityEventService::log(
            eventType: SecurityEventType::PASSWORD_CHANGED->value,
            severity: SecuritySeverity::INFO->value,
            userId: $user->id
        );

        AuditService::log(
            action: 'UPDATE',
            module: 'auth',
            entityType: User::class,
            entityId: (string) $user->id,
            newValues: ['password_changed_at' => now()->toIso8601String()],
            actorId: $user->id
        );

        return $this->successResponse(null, 'Password berhasil diperbarui.');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->input('email'))->first();

        if ($user) {
            $token = Str::random(64);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => Hash::make($token), 'created_at' => now()]
            );

            SecurityEventService::log(
                eventType: SecurityEventType::PASSWORD_RESET_REQUESTED->value,
                severity: SecuritySeverity::INFO->value,
                userId: $user->id,
                metadata: ['email' => $user->email]
            );
        }

        // Generic response to prevent user enumeration
        return $this->successResponse(
            null,
            'Jika alamat email Anda terdaftar di HCMS, instruksi pemulihan password akan dikirimkan.'
        );
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->input('email'))
            ->first();

        if (!$record || !Hash::check($request->input('token'), $record->token)) {
            return $this->errorResponse('Token pemulihan password tidak valid atau telah kedaluwarsa.', 'INVALID_TOKEN', null, 422);
        }

        // Check if token expired (e.g., 60 minutes)
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            return $this->errorResponse('Token pemulihan password telah kedaluwarsa.', 'EXPIRED_TOKEN', null, 422);
        }

        $user = User::where('email', $request->input('email'))->firstOrFail();

        $violations = PasswordPolicyService::validate($request->input('password'), $user);
        if (!empty($violations)) {
            return $this->errorResponse('Pelanggaran kebijakan password', 'PASSWORD_POLICY_VIOLATION', $violations, 422);
        }

        $hashed = Hash::make($request->input('password'));
        $user->update([
            'password' => $hashed,
            'password_changed_at' => now(),
            'force_password_change' => false,
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'status' => 'ACTIVE',
        ]);

        PasswordPolicyService::recordHistory($user, $hashed);
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        SecurityEventService::log(
            eventType: SecurityEventType::PASSWORD_RESET_COMPLETED->value,
            severity: SecuritySeverity::INFO->value,
            userId: $user->id
        );

        return $this->successResponse(null, 'Password berhasil diatur ulang. Anda sekarang dapat masuk.');
    }

    private function detectBrowser(string $userAgent): string
    {
        if (str_contains($userAgent, 'Edg')) return 'Microsoft Edge';
        if (str_contains($userAgent, 'Chrome')) return 'Google Chrome';
        if (str_contains($userAgent, 'Firefox')) return 'Mozilla Firefox';
        if (str_contains($userAgent, 'Safari')) return 'Apple Safari';
        return 'Other Browser';
    }

    private function detectOS(string $userAgent): string
    {
        if (str_contains($userAgent, 'Windows')) return 'Windows';
        if (str_contains($userAgent, 'Macintosh')) return 'macOS';
        if (str_contains($userAgent, 'Linux')) return 'Linux';
        if (str_contains($userAgent, 'Android')) return 'Android';
        if (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) return 'iOS';
        return 'Unknown OS';
    }

    private function detectDevice(string $userAgent): string
    {
        if (str_contains($userAgent, 'Mobile') || str_contains($userAgent, 'Android') || str_contains($userAgent, 'iPhone')) {
            return 'Mobile Device';
        }
        if (str_contains($userAgent, 'iPad') || str_contains($userAgent, 'Tablet')) {
            return 'Tablet Device';
        }
        return 'Desktop Workstation';
    }
}

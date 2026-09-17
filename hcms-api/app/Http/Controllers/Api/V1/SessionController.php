<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\SecurityEventType;
use App\Enums\SecuritySeverity;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\UserSession;
use App\Services\AuditService;
use App\Services\SecurityEventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = UserSession::with('user');

        if (!$user->hasPermission('sessions.view')) {
            $query->where('user_id', $user->id);
        } elseif ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->boolean('active_only', true)) {
            $query->whereNull('revoked_at');
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
        $sortBy = $request->input('sort_by');
        $sortOrder = strtolower($request->input('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

        if ($sortBy && in_array($sortBy, ['ip_address', 'last_activity_at', 'created_at', 'device', 'browser'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->latest('last_activity_at');
        }

        $sessions = $query->paginate($perPage);

        return $this->successResponse($sessions, 'Data sesi berhasil dimuat');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $session = UserSession::findOrFail($id);
        $currentUser = $request->user();

        // Must own session or have permission
        if ($session->user_id !== $currentUser->id && !$currentUser->hasPermission('sessions.revoke')) {
            return $this->errorResponse('Tidak berwenang untuk mencabut sesi ini.', 'FORBIDDEN', null, 403);
        }

        $session->update(['revoked_at' => now()]);

        SecurityEventService::log(
            eventType: SecurityEventType::SESSION_REVOKED->value,
            severity: SecuritySeverity::WARNING->value,
            userId: $session->user_id,
            metadata: ['session_id' => $session->id]
        );

        AuditService::log(
            action: 'DELETE',
            module: 'sessions',
            entityType: UserSession::class,
            entityId: $session->id,
            actorId: $currentUser->id
        );

        return $this->successResponse(null, 'Sesi berhasil dicabut');
    }

    public function revokeOtherSessions(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $currentTokenId = $currentUser->currentAccessToken()?->id;

        $revokedCount = UserSession::where('user_id', $currentUser->id)
            ->whereNull('revoked_at')
            ->when($currentTokenId, function ($q) use ($currentTokenId) {
                $q->where('token_id', '!=', (string) $currentTokenId);
            })
            ->update(['revoked_at' => now()]);

        // Revoke Sanctum tokens other than current
        $currentUser->tokens()->where('id', '!=', $currentTokenId)->delete();

        return $this->successResponse(['revoked_count' => $revokedCount], 'Seluruh sesi lain berhasil dicabut');
    }
}

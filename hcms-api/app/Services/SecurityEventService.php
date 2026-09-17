<?php

namespace App\Services;

use App\Models\SecurityEvent;
use App\Support\RequestContext;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class SecurityEventService
{
    public static function log(
        string $eventType,
        string $severity = 'INFO',
        ?int $userId = null,
        ?int $actorId = null,
        ?array $metadata = null
    ): SecurityEvent {
        $actorId = $actorId ?? Auth::id();

        return SecurityEvent::create([
            'user_id' => $userId,
            'actor_id' => $actorId,
            'event_type' => $eventType,
            'severity' => $severity,
            'ip_address' => Request::ip() ?? '127.0.0.1',
            'user_agent' => Request::userAgent() ?? 'System',
            'metadata' => $metadata,
            'request_id' => RequestContext::getRequestId(),
        ]);
    }
}

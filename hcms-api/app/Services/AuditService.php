<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Support\Redaction;
use App\Support\RequestContext;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    public static function log(
        string $action,
        string $module,
        ?string $entityType = null,
        ?string $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $actorId = null
    ): AuditLog {
        $actorId = $actorId ?? Auth::id();

        return AuditLog::create([
            'actor_id' => $actorId,
            'action' => $action,
            'module' => $module,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues ? Redaction::clean($oldValues) : null,
            'new_values' => $newValues ? Redaction::clean($newValues) : null,
            'ip_address' => Request::ip() ?? '127.0.0.1',
            'user_agent' => Request::userAgent() ?? 'System',
            'request_id' => RequestContext::getRequestId(),
        ]);
    }
}

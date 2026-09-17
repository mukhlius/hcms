<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('actor');

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        if ($module = $request->input('module')) {
            $query->where('module', $module);
        }

        if ($actorId = $request->input('actor_id')) {
            $query->where('actor_id', $actorId);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('entity_id', 'like', "%{$search}%")
                  ->orWhere('request_id', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
        $sortBy = $request->input('sort_by');
        $sortOrder = strtolower($request->input('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

        if ($sortBy && in_array($sortBy, ['action', 'module', 'created_at', 'ip_address', 'entity_type', 'entity_id'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->latest();
        }

        $logs = $query->paginate($perPage);

        return $this->successResponse($logs, 'Audit logs retrieved successfully');
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        return $this->successResponse($auditLog->load('actor'), 'Audit log details');
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\SecurityEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityEventController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = SecurityEvent::with(['user', 'actor']);

        if ($eventType = $request->input('event_type')) {
            $query->where('event_type', $eventType);
        }

        if ($severity = $request->input('severity')) {
            $query->where('severity', $severity);
        }

        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
        $sortBy = $request->input('sort_by');
        $sortOrder = strtolower($request->input('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

        if ($sortBy && in_array($sortBy, ['event_type', 'severity', 'created_at', 'ip_address'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->latest();
        }

        $events = $query->paginate($perPage);

        return $this->successResponse($events, 'Security events retrieved successfully');
    }

    public function stats(): JsonResponse
    {
        $stats = SecurityEvent::selectRaw('severity, count(*) as count')
            ->groupBy('severity')
            ->pluck('count', 'severity');

        return $this->successResponse($stats, 'Security event statistics');
    }
}

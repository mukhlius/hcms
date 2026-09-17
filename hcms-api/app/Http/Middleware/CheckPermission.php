<?php

namespace App\Http\Middleware;

use App\Support\RequestContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user || !$user->hasPermission($permission)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda tidak memiliki izin wewenang yang diperlukan.',
                'code' => 'FORBIDDEN',
                'required_permission' => $permission,
                'request_id' => RequestContext::getRequestId(),
            ], 403);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use App\Support\RequestContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        $allPermissions = [];
        foreach ($permissions as $perm) {
            foreach (explode('|', $perm) as $single) {
                $trimmed = trim($single);
                if ($trimmed !== '') {
                    $allPermissions[] = $trimmed;
                }
            }
        }

        if (!$user || !$user->hasAnyPermission($allPermissions)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda tidak memiliki izin wewenang yang diperlukan.',
                'code' => 'FORBIDDEN',
                'required_permission' => implode(' | ', $allPermissions),
                'request_id' => RequestContext::getRequestId(),
            ], 403);
        }

        return $next($request);
    }
}

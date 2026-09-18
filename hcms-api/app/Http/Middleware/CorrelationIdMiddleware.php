<?php

namespace App\Http\Middleware;

use App\Support\RequestContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class CorrelationIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $t0 = microtime(true);
        $requestId = $request->header('X-Request-ID') ?: (string) Str::uuid();
        RequestContext::setRequestId($requestId);

        if (!$request->bearerToken() && ($token = $request->query('token') ?? $request->query('auth_token'))) {
            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        $response = $next($request);

        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }
}

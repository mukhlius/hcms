<?php

use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\CorrelationIdMiddleware;
use App\Http\Middleware\SecurityHeadersMiddleware;
use App\Support\RequestContext;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(CorrelationIdMiddleware::class);
        $middleware->append(SecurityHeadersMiddleware::class);

        $middleware->alias([
            'permission' => CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data yang diberikan tidak valid.',
                    'code' => 'VALIDATION_ERROR',
                    'errors' => $e->errors(),
                    'request_id' => RequestContext::getRequestId(),
                ], 422);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sesi tidak terautentikasi atau telah berakhir.',
                    'code' => 'UNAUTHENTICATED',
                    'errors' => (object) [],
                    'request_id' => RequestContext::getRequestId(),
                ], 401);
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sumber daya tidak ditemukan.',
                    'code' => 'RESOURCE_NOT_FOUND',
                    'errors' => (object) [],
                    'request_id' => RequestContext::getRequestId(),
                ], 404);
            }
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $statusCode = $e instanceof HttpException ? $e->getStatusCode() : 500;
                $message = config('app.debug') ? $e->getMessage() : 'Terjadi kendala pada sistem. Silakan hubungi dukungan teknis.';

                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'code' => 'SERVER_ERROR',
                    'errors' => config('app.debug') ? ['exception' => get_class($e), 'line' => $e->getLine()] : (object) [],
                    'request_id' => RequestContext::getRequestId(),
                ], $statusCode);
            }
        });
    })->create();

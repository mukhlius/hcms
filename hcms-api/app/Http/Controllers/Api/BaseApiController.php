<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\RequestContext;
use Illuminate\Http\JsonResponse;

abstract class BaseApiController extends Controller
{
    protected function successResponse(
        mixed $data = null,
        string $message = 'Permintaan berhasil diproses',
        array|int $meta = [],
        int $statusCode = 200
    ): JsonResponse {
        if (is_int($meta)) {
            $statusCode = $meta;
            $meta = [];
        }

        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data ?? (object) [],
            'meta' => $meta ?: (object) [],
            'request_id' => RequestContext::getRequestId(),
        ];

        return response()->json($response, $statusCode);
    }

    protected function createdResponse(
        mixed $data = null,
        string $message = 'Data berhasil dibuat',
        array $meta = []
    ): JsonResponse {
        return $this->successResponse($data, $message, $meta, 201);
    }

    protected function errorResponse(
        string $message,
        string $code = 'BAD_REQUEST',
        mixed $errors = null,
        int $statusCode = 400
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
            'code' => $code,
            'errors' => $errors ?? (object) [],
            'request_id' => RequestContext::getRequestId(),
        ];

        return response()->json($response, $statusCode);
    }
}

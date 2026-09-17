<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;

class PermissionController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $permissions = Permission::all()->groupBy('group');

        return $this->successResponse($permissions, 'Permissions retrieved successfully');
    }
}

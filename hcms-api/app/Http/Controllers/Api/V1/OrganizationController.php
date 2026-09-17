<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\OrganizationCompany;
use App\Models\OrganizationDepartment;
use App\Models\OrganizationSite;
use Illuminate\Http\JsonResponse;

class OrganizationController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $companies = OrganizationCompany::where('is_active', true)->get();
        $sites = OrganizationSite::where('is_active', true)->get();
        $departments = OrganizationDepartment::where('is_active', true)->get();

        return $this->successResponse([
            'companies' => $companies,
            'sites' => $sites,
            'departments' => $departments,
        ], 'Organization metadata retrieved');
    }
}

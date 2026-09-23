<?php

namespace App\Services;

use App\Models\OrganizationCompany;
use App\Models\OrganizationDepartment;
use App\Models\OrganizationSection;
use App\Models\OrganizationSite;
use App\Models\OrganizationUnit;
use App\Models\Position;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrganizationSyncService
{
    /**
     * Synchronize all companies, sites, departments, and sections into organization_units,
     * and update positions.organization_unit_id.
     */
    public function syncAll(): array
    {
        return DB::transaction(function () {
            // Unlink positions temporarily before clearing
            Position::query()->update(['organization_unit_id' => null]);
            OrganizationUnit::query()->forceDelete();

            $companyUnitMap = []; // company_id => unit_id
            $siteUnitMap = [];    // site_id => unit_id
            $deptUnitMap = [];    // dept_id => unit_id
            $secUnitMap = [];     // sec_id => unit_id

            // 1. Sync Companies as Root BUSINESS_UNIT
            $companies = OrganizationCompany::all();
            foreach ($companies as $comp) {
                $compCode = "COMP-{$comp->code}";
                $unit = OrganizationUnit::create([
                    'company_id' => $comp->id,
                    'site_id' => null,
                    'parent_id' => null,
                    'type' => 'BUSINESS_UNIT',
                    'code' => $compCode,
                    'name' => $comp->name,
                    'description' => $comp->description,
                    'status' => $comp->status ?? 'ACTIVE',
                    'effective_from' => $comp->effective_from,
                    'effective_to' => $comp->effective_to,
                ]);
                $companyUnitMap[$comp->id] = $unit->id;
            }

            // 2. Sync Sites as DIVISION under Company
            $sites = OrganizationSite::all();
            foreach ($sites as $site) {
                $parentId = $companyUnitMap[$site->company_id] ?? null;
                $siteCode = "SITE-{$site->code}";
                $unit = OrganizationUnit::create([
                    'company_id' => $site->company_id,
                    'site_id' => $site->id,
                    'parent_id' => $parentId,
                    'type' => 'DIVISION',
                    'code' => $siteCode,
                    'name' => $site->name,
                    'description' => $site->description,
                    'status' => $site->status ?? 'ACTIVE',
                    'effective_from' => $site->effective_from,
                    'effective_to' => $site->effective_to,
                ]);
                $siteUnitMap[$site->id] = $unit->id;
            }

            // 3. Sync Departments as DEPARTMENT under Site or Company
            $departments = OrganizationDepartment::all();
            foreach ($departments as $dept) {
                $parentId = null;
                if ($dept->site_id && isset($siteUnitMap[$dept->site_id])) {
                    $parentId = $siteUnitMap[$dept->site_id];
                } elseif ($dept->company_id && isset($companyUnitMap[$dept->company_id])) {
                    $parentId = $companyUnitMap[$dept->company_id];
                }

                $deptCode = $dept->code;
                $unit = OrganizationUnit::create([
                    'company_id' => $dept->company_id,
                    'site_id' => $dept->site_id,
                    'parent_id' => $parentId,
                    'type' => 'DEPARTMENT',
                    'code' => $deptCode,
                    'name' => $dept->name,
                    'description' => $dept->description,
                    'leader_user_id' => $dept->leader_user_id,
                    'status' => $dept->status ?? 'ACTIVE',
                ]);
                $deptUnitMap[$dept->id] = $unit->id;
            }

            // 4. Sync Sections as SECTION under Department
            $sections = OrganizationSection::all();
            $usedCodes = OrganizationUnit::pluck('code')->all();

            foreach ($sections as $sec) {
                $parentId = $deptUnitMap[$sec->department_id] ?? null;
                $secCode = $sec->code;
                if (in_array($secCode, $usedCodes)) {
                    $secCode = "SEC-{$sec->code}";
                }
                $usedCodes[] = $secCode;

                $unit = OrganizationUnit::create([
                    'company_id' => $sec->company_id,
                    'site_id' => $sec->site_id,
                    'parent_id' => $parentId,
                    'type' => 'SECTION',
                    'code' => $secCode,
                    'name' => $sec->name,
                    'description' => $sec->description,
                    'leader_user_id' => $sec->leader_user_id,
                    'status' => $sec->status ?? 'ACTIVE',
                ]);
                $secUnitMap[$sec->id] = $unit->id;
            }

            // 5. Link Positions to OrganizationUnit
            $updatedPositions = 0;
            $positions = Position::all();
            foreach ($positions as $pos) {
                $targetUnitId = null;
                if ($pos->section_id && isset($secUnitMap[$pos->section_id])) {
                    $targetUnitId = $secUnitMap[$pos->section_id];
                } elseif ($pos->department_id && isset($deptUnitMap[$pos->department_id])) {
                    $targetUnitId = $deptUnitMap[$pos->department_id];
                } elseif ($pos->site_id && isset($siteUnitMap[$pos->site_id])) {
                    $targetUnitId = $siteUnitMap[$pos->site_id];
                }

                if ($targetUnitId) {
                    $pos->updateQuietly(['organization_unit_id' => $targetUnitId]);
                    $updatedPositions++;
                }
            }

            return [
                'companies' => count($companyUnitMap),
                'sites' => count($siteUnitMap),
                'departments' => count($deptUnitMap),
                'sections' => count($secUnitMap),
                'positions_linked' => $updatedPositions,
                'total_units' => OrganizationUnit::count(),
            ];
        });
    }

    /**
     * Sync single Department
     */
    public function syncDepartment(OrganizationDepartment $dept): ?OrganizationUnit
    {
        try {
            $parentId = null;
            if ($dept->site_id) {
                $siteUnit = OrganizationUnit::where('site_id', $dept->site_id)
                    ->where('type', 'DIVISION')
                    ->first();
                $parentId = $siteUnit?->id;
            }
            if (!$parentId && $dept->company_id) {
                $compUnit = OrganizationUnit::where('company_id', $dept->company_id)
                    ->where('type', 'BUSINESS_UNIT')
                    ->first();
                $parentId = $compUnit?->id;
            }

            return OrganizationUnit::updateOrCreate(
                [
                    'company_id' => $dept->company_id,
                    'code' => $dept->code,
                ],
                [
                    'site_id' => $dept->site_id,
                    'parent_id' => $parentId,
                    'type' => 'DEPARTMENT',
                    'name' => $dept->name,
                    'description' => $dept->description,
                    'leader_user_id' => $dept->leader_user_id,
                    'status' => $dept->status ?? 'ACTIVE',
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Failed to sync department to organization_unit: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete department unit
     */
    public function deleteDepartment(OrganizationDepartment $dept): void
    {
        try {
            OrganizationUnit::where('company_id', $dept->company_id)
                ->where('code', $dept->code)
                ->where('type', 'DEPARTMENT')
                ->delete();
        } catch (\Throwable $e) {
            Log::error('Failed to delete department organization_unit: ' . $e->getMessage());
        }
    }

    /**
     * Sync single Section
     */
    public function syncSection(OrganizationSection $sec): ?OrganizationUnit
    {
        try {
            $parentUnit = null;
            if ($sec->department_id) {
                $dept = OrganizationDepartment::find($sec->department_id);
                if ($dept) {
                    $parentUnit = OrganizationUnit::where('company_id', $dept->company_id)
                        ->where('code', $dept->code)
                        ->where('type', 'DEPARTMENT')
                        ->first();
                }
            }

            $secCode = $sec->code;
            $conflict = OrganizationUnit::where('code', $secCode)->where('type', '!=', 'SECTION')->exists();
            if ($conflict) {
                $secCode = "SEC-{$sec->code}";
            }

            return OrganizationUnit::updateOrCreate(
                [
                    'company_id' => $sec->company_id,
                    'code' => $secCode,
                ],
                [
                    'site_id' => $sec->site_id,
                    'parent_id' => $parentUnit?->id,
                    'type' => 'SECTION',
                    'name' => $sec->name,
                    'description' => $sec->description,
                    'leader_user_id' => $sec->leader_user_id,
                    'status' => $sec->status ?? 'ACTIVE',
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Failed to sync section to organization_unit: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete section unit
     */
    public function deleteSection(OrganizationSection $sec): void
    {
        try {
            OrganizationUnit::where('company_id', $sec->company_id)
                ->where(function ($q) use ($sec) {
                    $q->where('code', $sec->code)->orWhere('code', "SEC-{$sec->code}");
                })
                ->where('type', 'SECTION')
                ->delete();
        } catch (\Throwable $e) {
            Log::error('Failed to delete section organization_unit: ' . $e->getMessage());
        }
    }

    /**
     * Resolve and assign organization_unit_id for a Position model
     */
    public function resolvePositionUnit(Position $position): void
    {
        if ($position->section_id) {
            $sec = OrganizationSection::find($position->section_id);
            if ($sec) {
                $secUnit = OrganizationUnit::where(function ($q) use ($sec) {
                    $q->where('code', $sec->code)->orWhere('code', "SEC-{$sec->code}");
                })->where('type', 'SECTION')->first();

                if ($secUnit) {
                    $position->organization_unit_id = $secUnit->id;
                    return;
                }
            }
        }

        if ($position->department_id) {
            $dept = OrganizationDepartment::find($position->department_id);
            if ($dept) {
                $deptUnit = OrganizationUnit::where('code', $dept->code)->where('type', 'DEPARTMENT')->first();
                if ($deptUnit) {
                    $position->organization_unit_id = $deptUnit->id;
                    return;
                }
            }
        }
    }
}

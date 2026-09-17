<?php

namespace App\Services;

use App\Models\OrganizationUnit;

class OrganizationTreeService
{
    /**
     * Build nested organization unit tree for a company or overall organization.
     */
    public function getTree(?int $companyId = null, ?string $status = null): array
    {
        $query = OrganizationUnit::with(['leader:id,name,email', 'site:id,code,name', 'company:id,code,name'])
            ->withCount(['children', 'positions']);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $allUnits = $query->orderBy('name')->get();

        return $this->buildNestedTree($allUnits);
    }

    /**
     * Recursively build nested tree array from flat collection.
     */
    protected function buildNestedTree($units, $parentId = null): array
    {
        $branch = [];

        foreach ($units as $unit) {
            if ($unit->parent_id == $parentId) {
                $children = $this->buildNestedTree($units, $unit->id);
                $node = $unit->toArray();
                $node['children'] = $children;
                $branch[] = $node;
            }
        }

        return $branch;
    }

    /**
     * Get path/breadcrumbs from root to specific unit.
     */
    public function getBreadcrumbs(OrganizationUnit $unit): array
    {
        $crumbs = [];
        $current = $unit;

        while ($current) {
            array_unshift($crumbs, [
                'id' => $current->id,
                'name' => $current->name,
                'code' => $current->code,
                'type' => $current->type,
            ]);
            $current = $current->parent;
        }

        return $crumbs;
    }
}

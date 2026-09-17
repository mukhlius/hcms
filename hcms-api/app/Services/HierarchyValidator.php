<?php

namespace App\Services;

use App\Models\OrganizationUnit;
use App\Models\Position;
use Illuminate\Validation\ValidationException;

class HierarchyValidator
{
    /**
     * Validate that assigning $newParentId as parent of $unitId does not introduce a circular reference.
     *
     * @throws ValidationException
     */
    public static function validateUnitParent(int $unitId, ?int $newParentId): void
    {
        if ($newParentId === null) {
            return;
        }

        if ($unitId === $newParentId) {
            throw ValidationException::withMessages([
                'parent_id' => ['Unit organisasi tidak dapat menjadi induk bagi dirinya sendiri.'],
            ]);
        }

        $descendants = self::getUnitDescendantIds($unitId);
        if (in_array($newParentId, $descendants)) {
            throw ValidationException::withMessages([
                'parent_id' => ['Unit induk tidak valid karena akan menyebabkan hierarki melingkar (circular reference).'],
            ]);
        }
    }

    /**
     * Recursively retrieve all descendant IDs of an organization unit.
     */
    public static function getUnitDescendantIds(int $unitId): array
    {
        $descendants = [];
        $childrenIds = OrganizationUnit::where('parent_id', $unitId)->pluck('id')->toArray();

        foreach ($childrenIds as $childId) {
            $descendants[] = $childId;
            $descendants = array_merge($descendants, self::getUnitDescendantIds($childId));
        }

        return array_unique($descendants);
    }

    /**
     * Validate that assigning $newReportsToId as supervisor of $positionId does not introduce circular reporting.
     *
     * @throws ValidationException
     */
    public static function validatePositionReportsTo(int $positionId, ?int $newReportsToId): void
    {
        if ($newReportsToId === null) {
            return;
        }

        if ($positionId === $newReportsToId) {
            throw ValidationException::withMessages([
                'reports_to_position_id' => ['Posisi jabatan tidak dapat melapor ke dirinya sendiri.'],
            ]);
        }

        $subordinates = self::getPositionSubordinateIds($positionId);
        if (in_array($newReportsToId, $subordinates)) {
            throw ValidationException::withMessages([
                'reports_to_position_id' => ['Atasan tidak valid karena akan menyebabkan jalur pelaporan melingkar (circular reporting line).'],
            ]);
        }
    }

    /**
     * Recursively retrieve all subordinate position IDs for a position.
     */
    public static function getPositionSubordinateIds(int $positionId): array
    {
        $subordinates = [];
        $directReports = Position::where('reports_to_position_id', $positionId)->pluck('id')->toArray();

        foreach ($directReports as $reportId) {
            $subordinates[] = $reportId;
            $subordinates = array_merge($subordinates, self::getPositionSubordinateIds($reportId));
        }

        return array_unique($subordinates);
    }
}

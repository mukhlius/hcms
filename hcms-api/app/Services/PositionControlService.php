<?php

namespace App\Services;

use App\Models\Position;
use Illuminate\Validation\ValidationException;

class PositionControlService
{
    /**
     * Get aggregate headcount summary metrics.
     */
    public function getHeadcountSummary(?int $organizationUnitId = null): array
    {
        $query = Position::query();

        if ($organizationUnitId) {
            $query->where('organization_unit_id', $organizationUnitId);
        }

        $totalApproved = (int)$query->sum('approved_headcount');
        $totalCurrent = (int)$query->sum('current_headcount');
        $frozenPositions = (int)(clone $query)->where('is_frozen', true)->count();
        $vacancies = max(0, $totalApproved - $totalCurrent);

        return [
            'total_positions' => $query->count(),
            'approved_headcount' => $totalApproved,
            'current_headcount' => $totalCurrent,
            'vacant_headcount' => $vacancies,
            'frozen_positions' => $frozenPositions,
            'occupancy_rate' => $totalApproved > 0 ? round(($totalCurrent / $totalApproved) * 100, 1) : 0,
        ];
    }

    /**
     * Validate whether a position can be safely deactivated or removed.
     *
     * @throws ValidationException
     */
    public function validateSafeRemoval(Position $position): void
    {
        if ($position->current_headcount > 0) {
            throw ValidationException::withMessages([
                'position' => ['Posisi ini memiliki ' . $position->current_headcount . ' pemangku jabatan aktif dan tidak dapat dihapus.'],
            ]);
        }

        if ($position->subordinates()->count() > 0) {
            throw ValidationException::withMessages([
                'position' => ['Posisi ini masih memiliki bawahan langsung yang melapor ke jabatan ini. Alihkan bawahan terlebih dahulu.'],
            ]);
        }
    }
}

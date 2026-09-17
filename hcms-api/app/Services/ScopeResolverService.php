<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ScopeResolverService
{
    public static function applyUserScope(Builder $query, User $user): Builder
    {
        // SUPER_ADMIN has global scope
        if ($user->hasRole('SUPER_ADMIN')) {
            return $query;
        }

        $scope = $user->getDataScope();

        return match ($scope) {
            'GLOBAL' => $query,
            'COMPANY' => $user->company_id ? $query->where('company_id', $user->company_id) : $query->where('id', $user->id),
            'SITE' => $user->site_id ? $query->where('site_id', $user->site_id) : $query->where('id', $user->id),
            'DEPARTMENT' => $user->department_id ? $query->where('department_id', $user->department_id) : $query->where('id', $user->id),
            'SUBORDINATES', 'SELF' => $query->where('id', $user->id),
            default => $query->where('id', $user->id),
        };
    }
}

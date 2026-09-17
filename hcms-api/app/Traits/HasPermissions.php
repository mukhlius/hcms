<?php

namespace App\Traits;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

trait HasPermissions
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')
            ->withPivot('is_granted')
            ->withTimestamps();
    }

    public function hasPermission(string $permissionName): bool
    {
        // 1. Super Admin always has full access
        if ($this->hasRole('SUPER_ADMIN')) {
            return true;
        }

        // 2. Check direct user permission override
        $direct = $this->directPermissions()->where('name', $permissionName)->first();
        if ($direct !== null) {
            return (bool) $direct->pivot->is_granted;
        }

        // 3. Check role permissions
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissionName) {
                $query->where('name', $permissionName);
            })
            ->exists();
    }

    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    public function hasRole(string $roleName): bool
    {
        return $this->roles->contains('name', $roleName);
    }

    public function getAllPermissions(): array
    {
        $rolePermissions = $this->roles()
            ->with('permissions')
            ->get()
            ->pluck('permissions')
            ->flatten()
            ->pluck('name')
            ->unique();

        $directGranted = $this->directPermissions()
            ->wherePivot('is_granted', true)
            ->pluck('name');

        $directRevoked = $this->directPermissions()
            ->wherePivot('is_granted', false)
            ->pluck('name');

        return $rolePermissions
            ->merge($directGranted)
            ->diff($directRevoked)
            ->values()
            ->all();
    }

    public function getDataScope(): string
    {
        $hierarchy = [
            'GLOBAL' => 6,
            'COMPANY' => 5,
            'SITE' => 4,
            'DEPARTMENT' => 3,
            'SUBORDINATES' => 2,
            'SELF' => 1,
        ];

        $highestRank = 0;
        $highestScope = 'SELF';

        foreach ($this->roles as $role) {
            $scope = $role->data_scope ?? 'SELF';
            $rank = $hierarchy[$scope] ?? 1;
            if ($rank > $highestRank) {
                $highestRank = $rank;
                $highestScope = $scope;
            }
        }

        return $highestScope;
    }
}

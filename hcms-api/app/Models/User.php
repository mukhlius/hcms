<?php

namespace App\Models;

use App\Traits\Auditable;
use App\Traits\HasPermissions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasPermissions, Auditable;

    protected string $auditModule = 'users';

    protected $fillable = [
        'uuid',
        'username',
        'name',
        'email',
        'password',
        'status',
        'failed_login_attempts',
        'locked_until',
        'password_changed_at',
        'force_password_change',
        'mfa_enabled',
        'mfa_secret',
        'company_id',
        'site_id',
        'department_id',
        'section_id',
        'position_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'mfa_secret',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'locked_until' => 'datetime',
            'password_changed_at' => 'datetime',
            'force_password_change' => 'boolean',
            'mfa_enabled' => 'boolean',
            'password' => 'hashed',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function ($user) {
            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }
        });
    }

    public function isLocked(): bool
    {
        if ($this->status === 'LOCKED') {
            return true;
        }
        if ($this->locked_until && $this->locked_until->isFuture()) {
            return true;
        }
        return false;
    }

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE' && !$this->isLocked();
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(OrganizationCompany::class, 'company_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(OrganizationSite::class, 'site_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(OrganizationDepartment::class, 'department_id');
    }

    public function userSessions(): HasMany
    {
        return $this->hasMany(UserSession::class);
    }

    public function loginHistories(): HasMany
    {
        return $this->hasMany(LoginHistory::class);
    }

    public function securityEvents(): HasMany
    {
        return $this->hasMany(SecurityEvent::class);
    }

    public function passwordHistories(): HasMany
    {
        return $this->hasMany(PasswordHistory::class);
    }
}

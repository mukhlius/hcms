<?php

namespace App\Traits;

use App\Services\AuditService;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            AuditService::log(
                action: 'CREATE',
                module: $model->getAuditModule(),
                entityType: get_class($model),
                entityId: (string) $model->getKey(),
                oldValues: null,
                newValues: $model->getAttributes()
            );
        });

        static::updated(function ($model) {
            $old = array_intersect_key($model->getOriginal(), $model->getDirty());
            $new = $model->getDirty();

            AuditService::log(
                action: 'UPDATE',
                module: $model->getAuditModule(),
                entityType: get_class($model),
                entityId: (string) $model->getKey(),
                oldValues: $old,
                newValues: $new
            );
        });

        static::deleted(function ($model) {
            AuditService::log(
                action: 'DELETE',
                module: $model->getAuditModule(),
                entityType: get_class($model),
                entityId: (string) $model->getKey(),
                oldValues: $model->getOriginal(),
                newValues: null
            );
        });
    }

    public function getAuditModule(): string
    {
        return property_exists($this, 'auditModule') ? $this->auditModule : 'core';
    }
}

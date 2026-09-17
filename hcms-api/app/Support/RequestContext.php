<?php

namespace App\Support;

use Illuminate\Support\Str;

class RequestContext
{
    protected static ?string $requestId = null;

    public static function setRequestId(string $id): void
    {
        self::$requestId = $id;
    }

    public static function getRequestId(): string
    {
        if (!self::$requestId) {
            self::$requestId = (string) Str::uuid();
        }
        return self::$requestId;
    }
}

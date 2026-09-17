<?php

namespace App\Support;

class Redaction
{
    protected static array $sensitiveKeys = [
        'password',
        'password_confirmation',
        'token',
        'access_token',
        'refresh_token',
        'secret',
        'mfa_secret',
        'api_key',
        'remember_token',
        'cookie',
        'session_id',
    ];

    public static function clean(mixed $data): mixed
    {
        if (is_array($data)) {
            $cleaned = [];
            foreach ($data as $key => $value) {
                if (is_string($key) && self::isSensitiveKey($key)) {
                    $cleaned[$key] = '[REDACTED]';
                } else {
                    $cleaned[$key] = self::clean($value);
                }
            }
            return $cleaned;
        }

        return $data;
    }

    protected static function isSensitiveKey(string $key): bool
    {
        $normalized = strtolower($key);
        foreach (self::$sensitiveKeys as $sensitive) {
            if (str_contains($normalized, $sensitive)) {
                return true;
            }
        }
        return false;
    }
}

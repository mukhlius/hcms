<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

class SystemSettingService
{
    const CACHE_KEY = 'hcms_system_settings_array';
    const CACHE_TTL = 3600; // 1 hour

    public static function get(string $key, mixed $default = null): mixed
    {
        try {
            $settings = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
                $all = SystemSetting::all();
                $map = [];
                foreach ($all as $item) {
                    $map[$item->key] = $item->cast_value;
                }
                return $map;
            });

            if (is_array($settings) && array_key_exists($key, $settings)) {
                return $settings[$key];
            }
        } catch (\Throwable $e) {
            // In case of cache serialization issue, safely query DB directly
            $setting = SystemSetting::where('key', $key)->first();
            if ($setting) {
                return $setting->cast_value;
            }
        }

        return $default;
    }

    public static function set(string $key, mixed $value, ?int $userId = null): SystemSetting
    {
        $setting = SystemSetting::where('key', $key)->firstOrFail();
        
        $setting->value = is_array($value) ? json_encode($value) : (string) $value;
        if ($userId) {
            $setting->updated_by = $userId;
        }
        $setting->save();

        self::clearCache();

        return $setting;
    }

    public static function allByCategory(?string $category = null): array
    {
        $query = SystemSetting::query();
        if ($category) {
            $query->where('category', $category);
        }
        return $query->get()->toArray();
    }

    public static function clearCache(): void
    {
        try {
            Cache::forget(self::CACHE_KEY);
            Cache::forget('hcms_system_settings');
        } catch (\Throwable) {
            // Ignore cache forget errors
        }
    }
}

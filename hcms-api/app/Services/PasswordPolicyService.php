<?php

namespace App\Services;

use App\Models\PasswordHistory;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PasswordPolicyService
{
    public static function validate(string $password, ?User $user = null): array
    {
        $errors = [];

        $minLength = (int) SystemSettingService::get('password_min_length', 8);
        $requireUpper = (bool) SystemSettingService::get('password_require_uppercase', true);
        $requireLower = (bool) SystemSettingService::get('password_require_lowercase', true);
        $requireNumber = (bool) SystemSettingService::get('password_require_number', true);
        $requireSpecial = (bool) SystemSettingService::get('password_require_special', true);

        if (strlen($password) < $minLength) {
            $errors[] = "Panjang password minimal {$minLength} karakter.";
        }
        if ($requireUpper && !preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password harus mengandung setidaknya satu huruf besar (kapital).';
        }
        if ($requireLower && !preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password harus mengandung setidaknya satu huruf kecil.';
        }
        if ($requireNumber && !preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password harus mengandung setidaknya satu angka.';
        }
        if ($requireSpecial && !preg_match('/[!@#$%^&*(),.?":{}|<>_\-]/', $password)) {
            $errors[] = 'Password harus mengandung setidaknya satu karakter khusus/simbol.';
        }

        if ($user && self::isPasswordReused($user, $password)) {
            $historyLimit = (int) SystemSettingService::get('password_history_limit', 5);
            $errors[] = "Anda tidak dapat menggunakan kembali {$historyLimit} password terakhir Anda.";
        }

        return $errors;
    }

    public static function isPasswordReused(User $user, string $newPassword): bool
    {
        $historyLimit = (int) SystemSettingService::get('password_history_limit', 5);
        if ($historyLimit <= 0) {
            return false;
        }

        $histories = PasswordHistory::where('user_id', $user->id)
            ->latest('created_at')
            ->take($historyLimit)
            ->get();

        foreach ($histories as $history) {
            if (Hash::check($newPassword, $history->password_hash)) {
                return true;
            }
        }

        return false;
    }

    public static function recordHistory(User $user, string $hashedPassword): void
    {
        PasswordHistory::create([
            'user_id' => $user->id,
            'password_hash' => $hashedPassword,
            'created_at' => now(),
        ]);
    }
}

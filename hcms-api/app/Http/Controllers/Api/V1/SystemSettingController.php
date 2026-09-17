<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\SystemSetting;
use App\Services\AuditService;
use App\Services\SystemSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SystemSettingController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $category = $request->input('category');
        $settings = SystemSetting::query()
            ->when($category, fn($q) => $q->where('category', $category))
            ->get();

        return $this->successResponse($settings, 'Pengaturan sistem berhasil dimuat');
    }

    /**
     * Endpoint publik untuk memuat pengaturan yang ditandai is_public (misal: app_icon, app_name, company_name)
     * Dapat diakses tanpa autentikasi (guest) untuk halaman login atau inisialisasi branding.
     */
    public function publicSettings(): JsonResponse
    {
        $settings = SystemSetting::where('is_public', true)->get();
        $map = [];
        foreach ($settings as $s) {
            $map[$s->key] = $s->cast_value;
        }

        return $this->successResponse($map, 'Pengaturan publik berhasil dimuat');
    }

    public function updateBatch(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|exists:system_settings,key',
            'settings.*.value' => 'nullable',
        ]);

        $updated = [];
        $userId = $request->user()->id;

        foreach ($request->input('settings') as $item) {
            $setting = SystemSetting::where('key', $item['key'])->first();
            $oldValue = $setting->value;
            $newValue = is_array($item['value']) ? json_encode($item['value']) : (string) $item['value'];

            if ($oldValue !== $newValue) {
                $setting->value = $newValue;
                $setting->updated_by = $userId;
                $setting->save();

                AuditService::log(
                    action: 'UPDATE',
                    module: 'settings',
                    entityType: SystemSetting::class,
                    entityId: (string) $setting->id,
                    oldValues: ['key' => $setting->key, 'value' => $oldValue],
                    newValues: ['key' => $setting->key, 'value' => $newValue],
                    actorId: $userId
                );
            }

            $updated[] = $setting;
        }

        SystemSettingService::clearCache();

        return $this->successResponse($updated, 'Pengaturan sistem berhasil diperbarui');
    }

    /**
     * Unggah berkas ikon aplikasi dan simpan URL-nya ke system_settings.
     */
    public function uploadAppIcon(Request $request): JsonResponse
    {
        $request->validate([
            'icon' => 'required|file|mimes:png,jpg,jpeg,svg,webp,ico|max:2048',
        ]);

        $file = $request->file('icon');
        $setting = SystemSetting::firstOrNew(['key' => 'app_icon']);

        // Hapus file lama jika ada di disk public
        if ($setting->value && str_contains($setting->value, '/storage/branding/')) {
            $parsed = parse_url($setting->value, PHP_URL_PATH);
            if ($parsed) {
                $relative = preg_replace('#^.*?/storage/#', '', $parsed);
                if ($relative && Storage::disk('public')->exists($relative)) {
                    Storage::disk('public')->delete($relative);
                }
            }
        }

        $extension = $file->getClientOriginalExtension() ?: 'png';
        $filename = 'app_icon_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
        $path = $file->storeAs('branding', $filename, 'public');
        $url = asset('storage/' . $path);

        $oldVal = $setting->value;
        $setting->category = 'GENERAL';
        $setting->value = $url;
        $setting->type = 'string';
        $setting->label = 'Ikon Aplikasi';
        $setting->description = 'Ikon / Logo resmi aplikasi yang ditampilkan di header portal dan halaman login.';
        $setting->is_public = true;
        $setting->updated_by = $request->user()->id;
        $setting->save();

        SystemSettingService::clearCache();

        AuditService::log(
            action: 'UPLOAD_ICON',
            module: 'settings',
            entityType: SystemSetting::class,
            entityId: (string) $setting->id,
            oldValues: ['app_icon' => $oldVal],
            newValues: ['app_icon' => $url],
            actorId: $request->user()->id
        );

        return $this->successResponse([
            'url' => $url,
            'setting' => $setting,
        ], 'Ikon aplikasi berhasil diunggah.');
    }

    /**
     * Hapus berkas ikon aplikasi dan kembalikan nilai setting ke null (default icon).
     */
    public function removeAppIcon(Request $request): JsonResponse
    {
        $setting = SystemSetting::where('key', 'app_icon')->first();
        if ($setting && $setting->value) {
            $parsed = parse_url($setting->value, PHP_URL_PATH);
            if ($parsed) {
                $relative = preg_replace('#^.*?/storage/#', '', $parsed);
                if ($relative && Storage::disk('public')->exists($relative)) {
                    Storage::disk('public')->delete($relative);
                }
            }

            $oldVal = $setting->value;
            $setting->value = null;
            $setting->updated_by = $request->user()->id;
            $setting->save();

            SystemSettingService::clearCache();

            AuditService::log(
                action: 'DELETE_ICON',
                module: 'settings',
                entityType: SystemSetting::class,
                entityId: (string) $setting->id,
                oldValues: ['app_icon' => $oldVal],
                newValues: ['app_icon' => null],
                actorId: $request->user()->id
            );
        }

        return $this->successResponse(null, 'Ikon aplikasi berhasil dihapus dan dikembalikan ke bawaan sistem.');
    }
}

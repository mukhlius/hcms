<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\SystemSetting;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $brandingSettings = [
            [
                'category' => 'GENERAL',
                'key' => 'app_icon',
                'value' => null,
                'type' => 'string',
                'label' => 'Ikon Aplikasi',
                'description' => 'Ikon / Logo resmi aplikasi yang ditampilkan di header portal dan halaman login.',
                'is_public' => true,
            ],
            [
                'category' => 'GENERAL',
                'key' => 'app_name',
                'value' => 'HCMS ENTERPRISE',
                'type' => 'string',
                'label' => 'Nama Aplikasi',
                'description' => 'Nama merek aplikasi HCMS.',
                'is_public' => true,
            ],
            [
                'category' => 'GENERAL',
                'key' => 'company_name',
                'value' => 'PT Coal Mining Nusantara',
                'type' => 'string',
                'label' => 'Nama Perusahaan',
                'description' => 'Nama institusi/perusahaan pemilik sistem.',
                'is_public' => true,
            ],
        ];

        foreach ($brandingSettings as $setting) {
            SystemSetting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        SystemSetting::whereIn('key', ['app_icon', 'app_name', 'company_name'])->delete();
    }
};

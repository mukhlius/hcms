<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Assign site_id to departments that have site_id = null
        // Find default site (HAGM or first site)
        $defaultSiteId = DB::table('organization_sites')->where('code', 'HAGM')->value('id')
            ?? DB::table('organization_sites')->value('id');

        if ($defaultSiteId) {
            DB::table('organization_departments')
                ->whereNull('site_id')
                ->update(['site_id' => $defaultSiteId]);
        }

        // 2. Fix department_id in organization_sections based on code prefix
        $departments = DB::table('organization_departments')->pluck('id', 'code')->toArray();

        $sections = DB::table('organization_sections')->get();

        foreach ($sections as $sec) {
            $deptCode = null;
            if (preg_match('/^DIV-([A-Z]+)-/i', $sec->code, $matches)) {
                $deptCode = strtoupper($matches[1]);
            } elseif ($sec->code === 'HRS') {
                $deptCode = 'TDC';
            }

            if ($deptCode && isset($departments[$deptCode])) {
                $targetDeptId = $departments[$deptCode];
                DB::table('organization_sections')
                    ->where('id', $sec->id)
                    ->update([
                        'department_id' => $targetDeptId,
                        'site_id' => $sec->site_id ?? $defaultSiteId,
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    public function down(): void
    {
        // Reversible if needed
    }
};

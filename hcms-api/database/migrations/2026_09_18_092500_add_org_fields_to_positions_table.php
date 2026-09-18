<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $table->unsignedBigInteger('organization_unit_id')->nullable()->change();
            $table->foreignId('site_id')->nullable()->after('short_title')->constrained('organization_sites')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->after('site_id')->constrained('organization_departments')->nullOnDelete();
            $table->foreignId('section_id')->nullable()->after('department_id')->constrained('organization_sections')->nullOnDelete();
        });

        // Migrate existing positions data from organization_units mapping
        $positions = DB::table('positions')->whereNotNull('organization_unit_id')->get();

        foreach ($positions as $pos) {
            $unit = DB::table('organization_units')->where('id', $pos->organization_unit_id)->first();
            if ($unit) {
                if (in_array($unit->type, ['SECTION', 'SUB_SECTION', 'OTHER'])) {
                    // Match section by code
                    $section = DB::table('organization_sections')->where('code', $unit->code)->first();
                    if ($section) {
                        DB::table('positions')->where('id', $pos->id)->update([
                            'section_id' => $section->id,
                            'department_id' => $section->department_id,
                            'site_id' => $section->site_id ?? $unit->site_id,
                        ]);
                    }
                } else {
                    // Match department by code
                    $dept = DB::table('organization_departments')->where('code', $unit->code)->first();
                    if ($dept) {
                        DB::table('positions')->where('id', $pos->id)->update([
                            'department_id' => $dept->id,
                            'site_id' => $dept->site_id ?? $unit->site_id,
                        ]);
                    }
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $table->dropForeign(['site_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['section_id']);
            $table->dropColumn(['site_id', 'department_id', 'section_id']);
        });
    }
};

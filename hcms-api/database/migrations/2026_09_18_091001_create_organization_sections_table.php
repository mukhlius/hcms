<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('organization_companies')->cascadeOnDelete();
            $table->foreignId('site_id')->nullable()->constrained('organization_sites')->nullOnDelete();
            $table->foreignId('department_id')->constrained('organization_departments')->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('leader_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        // Migrate existing department units from organization_units
        if (Schema::hasTable('organization_units')) {
            $deptUnits = DB::table('organization_units')
                ->whereIn('type', ['DEPARTMENT', 'DIVISION', 'BUSINESS_UNIT'])
                ->get();

            $unitToDeptIdMap = [];

            foreach ($deptUnits as $dept) {
                // Insert or update in organization_departments
                $existing = DB::table('organization_departments')->where('code', $dept->code)->first();
                if ($existing) {
                    DB::table('organization_departments')->where('id', $existing->id)->update([
                        'company_id' => $dept->company_id,
                        'site_id' => $dept->site_id,
                        'name' => $dept->name,
                        'description' => $dept->description,
                        'leader_user_id' => $dept->leader_user_id,
                        'status' => $dept->status ?? 'ACTIVE',
                        'updated_at' => now(),
                    ]);
                    $unitToDeptIdMap[$dept->id] = $existing->id;
                } else {
                    $newId = DB::table('organization_departments')->insertGetId([
                        'company_id' => $dept->company_id,
                        'site_id' => $dept->site_id,
                        'code' => $dept->code,
                        'name' => $dept->name,
                        'description' => $dept->description,
                        'leader_user_id' => $dept->leader_user_id,
                        'status' => $dept->status ?? 'ACTIVE',
                        'is_active' => ($dept->status ?? 'ACTIVE') === 'ACTIVE',
                        'created_at' => $dept->created_at ?? now(),
                        'updated_at' => $dept->updated_at ?? now(),
                    ]);
                    $unitToDeptIdMap[$dept->id] = $newId;
                }
            }

            // Migrate existing section units from organization_units
            $sectionUnits = DB::table('organization_units')
                ->whereIn('type', ['SECTION', 'SUB_SECTION', 'OTHER'])
                ->get();

            $defaultDeptId = DB::table('organization_departments')->value('id');

            foreach ($sectionUnits as $sec) {
                $targetDeptId = $unitToDeptIdMap[$sec->parent_id] ?? $defaultDeptId;

                if ($targetDeptId) {
                    DB::table('organization_sections')->insertOrIgnore([
                        'company_id' => $sec->company_id,
                        'site_id' => $sec->site_id,
                        'department_id' => $targetDeptId,
                        'code' => $sec->code,
                        'name' => $sec->name,
                        'description' => $sec->description,
                        'leader_user_id' => $sec->leader_user_id,
                        'status' => $sec->status ?? 'ACTIVE',
                        'created_at' => $sec->created_at ?? now(),
                        'updated_at' => $sec->updated_at ?? now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_sections');
    }
};

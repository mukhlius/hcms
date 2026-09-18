<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employment_types', function (Blueprint $table) {
            if (!Schema::hasColumn('employment_types', 'is_permanent')) {
                $table->boolean('is_permanent')->default(false)->after('name');
            }
            if (!Schema::hasColumn('employment_types', 'deleted_at')) {
                $table->softDeletes()->after('status');
            }
        });

        // Set PKWTT as permanent by default
        DB::table('employment_types')
            ->where('code', 'PKWTT')
            ->update(['is_permanent' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employment_types', function (Blueprint $table) {
            if (Schema::hasColumn('employment_types', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
            if (Schema::hasColumn('employment_types', 'is_permanent')) {
                $table->dropColumn('is_permanent');
            }
        });
    }
};

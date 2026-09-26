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
        Schema::table('employee_families', function (Blueprint $table) {
            $table->string('bpjs_kesehatan_no', 50)->nullable()->after('id_card_number');
            $table->string('insurance_no', 50)->nullable()->after('bpjs_kesehatan_no');
        });

        // Sinkronkan data lama dari health_provider_no ke bpjs_kesehatan_no jika ada
        DB::table('employee_families')
            ->whereNull('bpjs_kesehatan_no')
            ->whereNotNull('health_provider_no')
            ->update([
                'bpjs_kesehatan_no' => DB::raw('health_provider_no'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_families', function (Blueprint $table) {
            $table->dropColumn(['bpjs_kesehatan_no', 'insurance_no']);
        });
    }
};

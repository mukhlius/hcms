<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('position_work_times', function (Blueprint $table) {
            $table->unsignedSmallInteger('late_tolerance_minutes')->default(0)->after('end_time')
                ->comment('Toleransi keterlambatan masuk dalam menit');
            $table->unsignedSmallInteger('early_out_tolerance_minutes')->default(0)->after('late_tolerance_minutes')
                ->comment('Toleransi pulang lebih awal dalam menit');
            $table->string('shift_type', 20)->nullable()->after('shift_id')
                ->comment('Jenis shift: DAY / NIGHT / CUSTOM');
        });
    }

    public function down(): void
    {
        Schema::table('position_work_times', function (Blueprint $table) {
            $table->dropColumn(['late_tolerance_minutes', 'early_out_tolerance_minutes', 'shift_type']);
        });
    }
};

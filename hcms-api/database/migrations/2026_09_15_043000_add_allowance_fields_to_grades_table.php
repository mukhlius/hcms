<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->decimal('field_allowance', 15, 2)->nullable()->after('field_leave_duration_days');
            $table->decimal('leave_lumpsum_allowance', 15, 2)->nullable()->after('field_allowance');
            $table->decimal('business_trip_allowance_daily', 15, 2)->nullable()->after('leave_lumpsum_allowance');
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropColumn([
                'field_allowance',
                'leave_lumpsum_allowance',
                'business_trip_allowance_daily',
            ]);
        });
    }
};

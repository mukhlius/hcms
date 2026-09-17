<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->unsignedInteger('field_duty_duration_days')->nullable()->after('max_salary');
            $table->unsignedInteger('field_leave_duration_days')->nullable()->after('field_duty_duration_days');
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropColumn(['field_duty_duration_days', 'field_leave_duration_days']);
        });
    }
};

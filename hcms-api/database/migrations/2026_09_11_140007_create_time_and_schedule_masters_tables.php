<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->time('start_time');
            $table->time('end_time');
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            $table->boolean('cross_day')->default(false);
            $table->unsignedInteger('grace_period_minutes')->default(0);
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('work_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('pattern_type', ['ROSTER', 'FIXED', 'ROTATING'])->default('ROSTER')->index();
            $table->unsignedInteger('days_on')->default(14);
            $table->unsignedInteger('days_off')->default(7);
            $table->unsignedInteger('cycle_days')->default(21);
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('holiday_calendars', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->unsignedSmallInteger('year')->index();
            $table->enum('scope', ['GLOBAL', 'COMPANY', 'SITE'])->default('COMPANY')->index();
            $table->foreignId('company_id')->nullable()->constrained('organization_companies')->nullOnDelete();
            $table->foreignId('site_id')->nullable()->constrained('organization_sites')->nullOnDelete();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('holiday_calendar_id')->constrained('holiday_calendars')->cascadeOnDelete();
            $table->string('name');
            $table->date('holiday_date')->index();
            $table->boolean('is_recurring')->default(false);
            $table->timestamps();
        });

        Schema::create('work_calendars', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('company_id')->nullable()->constrained('organization_companies')->nullOnDelete();
            $table->foreignId('site_id')->nullable()->constrained('organization_sites')->nullOnDelete();
            $table->foreignId('work_schedule_id')->constrained('work_schedules')->cascadeOnDelete();
            $table->foreignId('holiday_calendar_id')->nullable()->constrained('holiday_calendars')->nullOnDelete();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_calendars');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('holiday_calendars');
        Schema::dropIfExists('work_schedules');
        Schema::dropIfExists('shifts');
    }
};

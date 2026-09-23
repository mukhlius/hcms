<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Roster Kerja Berdasarkan Level Jabatan
        Schema::create('level_work_rosters', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('level')->index(); // 1 (PM) s/d 7 (Operator/Non Staff)
            $table->foreignId('grade_id')->nullable()->constrained('grades')->nullOnDelete();
            $table->foreignId('work_schedule_id')->nullable()->constrained('work_schedules')->nullOnDelete();
            $table->string('roster_name');
            $table->unsignedInteger('days_on')->default(14);
            $table->unsignedInteger('days_off')->default(7);
            $table->enum('poh_type', ['ALL', 'LOKAL', 'NON_LOKAL'])->default('ALL')->index();
            $table->unsignedInteger('travel_days')->default(0);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Waktu Kerja Berdasarkan Position
        Schema::create('position_work_times', function (Blueprint $table) {
            $table->id();
            $table->foreignId('position_id')->constrained('positions')->cascadeOnDelete();
            $table->foreignId('shift_id')->nullable()->constrained('shifts')->nullOnDelete();
            $table->foreignId('work_schedule_id')->nullable()->constrained('work_schedules')->nullOnDelete();
            $table->enum('work_type', ['SHIFT', 'NON_SHIFT', 'FLEXIBLE'])->default('SHIFT')->index();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->decimal('daily_hours', 4, 2)->default(8.00);
            $table->unsignedInteger('weekly_days')->default(6);
            $table->unsignedInteger('break_minutes')->default(60);
            $table->boolean('is_overtime_eligible')->default(true);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Kalender Tanggal Merah
        Schema::create('public_holidays', function (Blueprint $table) {
            $table->id();
            $table->date('holiday_date')->index();
            $table->string('name');
            $table->enum('type', ['HARI_LIBUR_NASIONAL', 'CUTI_BERSAMA', 'LIBUR_KHUSUS_SITE'])->default('HARI_LIBUR_NASIONAL')->index();
            $table->unsignedSmallInteger('year')->index();
            $table->boolean('is_recurring')->default(false);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Durasi Paid Leave
        Schema::create('paid_leave_policies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->enum('category', ['ANNUAL', 'MATERNITY', 'FAMILY_EVENT', 'RELIGIOUS', 'MEDICAL', 'OTHER'])->default('FAMILY_EVENT')->index();
            $table->unsignedInteger('duration_days')->default(1);
            $table->enum('duration_unit', ['HARI_KERJA', 'HARI_KALENDER', 'BULAN'])->default('HARI_KERJA');
            $table->boolean('requires_document')->default(false);
            $table->string('required_document_name')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        // 5. Durasi SP
        Schema::create('warning_letter_durations', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->enum('level', ['TEGURAN', 'SP_1', 'SP_2', 'SP_3'])->default('SP_1')->index();
            $table->string('name');
            $table->unsignedInteger('duration_months')->default(6);
            $table->string('validity_unit', 20)->default('BULAN');
            $table->text('consequence_description')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        // 6. Jenis PHK
        Schema::create('termination_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->string('legal_basis')->nullable();
            $table->decimal('pesangon_multiplier', 4, 2)->default(1.00);
            $table->decimal('pmtk_multiplier', 4, 2)->default(1.00);
            $table->boolean('entitled_to_uph')->default(true);
            $table->boolean('entitled_to_uang_pisah')->default(false);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        // 7. Jenis Resign
        Schema::create('resignation_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->unsignedInteger('notice_period_days')->default(30);
            $table->boolean('requires_clearance')->default(true);
            $table->boolean('entitled_to_uang_pisah')->default(true);
            $table->boolean('entitled_to_sisa_cuti')->default(true);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resignation_types');
        Schema::dropIfExists('termination_types');
        Schema::dropIfExists('warning_letter_durations');
        Schema::dropIfExists('paid_leave_policies');
        Schema::dropIfExists('public_holidays');
        Schema::dropIfExists('position_work_times');
        Schema::dropIfExists('level_work_rosters');
    }
};

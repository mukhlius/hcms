<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->string('short_title', 50)->nullable();
            $table->foreignId('organization_unit_id')->constrained('organization_units')->cascadeOnDelete();
            $table->foreignId('job_id')->nullable()->constrained('organization_jobs')->nullOnDelete();
            $table->foreignId('job_family_id')->nullable()->constrained('job_families')->nullOnDelete();
            $table->foreignId('grade_id')->nullable()->constrained('grades')->nullOnDelete();
            $table->foreignId('reports_to_position_id')->nullable()->constrained('positions')->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained('work_locations')->nullOnDelete();
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers')->nullOnDelete();
            $table->unsignedInteger('approved_headcount')->default(1);
            $table->unsignedInteger('current_headcount')->default(0);
            $table->boolean('is_frozen')->default(false);
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};

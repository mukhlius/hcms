<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('benefit_plafonds', function (Blueprint $table) {
            $table->id();
            $table->string('benefit_type', 50)->index(); // PENGOBATAN, KACAMATA, PERSALINAN
            $table->foreignId('salary_grade_id')->constrained('salary_grades')->cascadeOnDelete();
            $table->string('marital_category', 50)->default('SEMUA'); // Menikah, Tidak Menikah, SEMUA
            $table->foreignId('marital_status_id')->nullable()->constrained('standard_references')->nullOnDelete();
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('period_type', 50)->default('TAHUNAN'); // TAHUNAN, PER_KASUS, 2_TAHUNAN, SEUMUR_HIDUP
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['benefit_type', 'salary_grade_id', 'marital_category'], 'benefit_salary_grade_marital_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('benefit_plafonds');
    }
};

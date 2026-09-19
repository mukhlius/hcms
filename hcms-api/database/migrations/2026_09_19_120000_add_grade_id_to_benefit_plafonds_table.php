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
        Schema::table('benefit_plafonds', function (Blueprint $table) {
            $table->foreignId('grade_id')
                ->nullable()
                ->after('salary_grade_id')
                ->constrained('grades')
                ->nullOnDelete();

            $table->index(['benefit_type', 'grade_id'], 'benefit_type_grade_id_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('benefit_plafonds', function (Blueprint $table) {
            $table->dropForeign(['grade_id']);
            $table->dropIndex('benefit_type_grade_id_idx');
            $table->dropColumn('grade_id');
        });
    }
};

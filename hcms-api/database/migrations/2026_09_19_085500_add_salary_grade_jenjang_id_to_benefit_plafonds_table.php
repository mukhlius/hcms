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
            $table->foreignId('salary_grade_jenjang_id')
                ->nullable()
                ->after('grade_id')
                ->constrained('salary_grade_jenjang')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('benefit_plafonds', function (Blueprint $table) {
            $table->dropConstrainedForeignId('salary_grade_jenjang_id');
        });
    }
};

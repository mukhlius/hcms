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
            $table->foreignId('master_jenjang_id')
                ->nullable()
                ->after('salary_grade_jenjang_id')
                ->constrained('master_jenjangs')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('benefit_plafonds', function (Blueprint $table) {
            $table->dropConstrainedForeignId('master_jenjang_id');
        });
    }
};

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
        // 1. Create master_jenjangs table
        Schema::create('master_jenjangs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Add master_jenjang_id to salary_grade_jenjang table
        Schema::table('salary_grade_jenjang', function (Blueprint $table) {
            $table->foreignId('master_jenjang_id')
                ->nullable()
                ->after('grade_id')
                ->constrained('master_jenjangs')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_grade_jenjang', function (Blueprint $table) {
            $table->dropConstrainedForeignId('master_jenjang_id');
        });

        Schema::dropIfExists('master_jenjangs');
    }
};

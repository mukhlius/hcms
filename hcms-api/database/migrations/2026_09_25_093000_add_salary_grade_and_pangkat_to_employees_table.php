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
        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('salary_grade_id')->nullable()->after('grade_id')->constrained('salary_grades')->nullOnDelete();
            $table->string('pangkat', 30)->nullable()->after('salary_grade_id'); // Staff, Non Staff
        });

        Schema::table('employee_career_histories', function (Blueprint $table) {
            $table->foreignId('salary_grade_id')->nullable()->after('grade_id')->constrained('salary_grades')->nullOnDelete();
            $table->string('golongan_snapshot', 50)->nullable()->after('grade_name_snapshot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_career_histories', function (Blueprint $table) {
            $table->dropForeign(['salary_grade_id']);
            $table->dropColumn(['salary_grade_id', 'golongan_snapshot']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['salary_grade_id']);
            $table->dropColumn(['salary_grade_id', 'pangkat']);
        });
    }
};

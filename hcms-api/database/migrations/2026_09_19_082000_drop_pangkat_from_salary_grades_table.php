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
        Schema::table('salary_grades', function (Blueprint $table) {
            if (Schema::hasColumn('salary_grades', 'pangkat')) {
                $table->dropColumn('pangkat');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_grades', function (Blueprint $table) {
            if (!Schema::hasColumn('salary_grades', 'pangkat')) {
                $table->string('pangkat', 20)->default('Staff')->after('name')->index();
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_grade_jenjang', function (Blueprint $table) {
            if (Schema::hasColumn('salary_grade_jenjang', 'order_index')) {
                $table->dropColumn('order_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('salary_grade_jenjang', function (Blueprint $table) {
            if (!Schema::hasColumn('salary_grade_jenjang', 'order_index')) {
                $table->unsignedTinyInteger('order_index')->default(1)->after('name');
            }
        });
    }
};

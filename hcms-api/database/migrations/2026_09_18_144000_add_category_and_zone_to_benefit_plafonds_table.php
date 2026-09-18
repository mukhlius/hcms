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
            $table->string('category_name', 100)->nullable()->after('amount')->index();
            $table->string('zone_name', 100)->nullable()->after('category_name')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('benefit_plafonds', function (Blueprint $table) {
            $table->dropIndex(['category_name']);
            $table->dropIndex(['zone_name']);
            $table->dropColumn(['category_name', 'zone_name']);
        });
    }
};

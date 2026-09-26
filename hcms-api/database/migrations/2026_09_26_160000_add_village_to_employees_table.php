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
            $table->string('ktp_village', 100)->nullable()->after('ktp_district');
            $table->string('residential_village', 100)->nullable()->after('residential_district');
            $table->string('mailing_village', 100)->nullable()->after('mailing_district');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['ktp_village', 'residential_village', 'mailing_village']);
        });
    }
};

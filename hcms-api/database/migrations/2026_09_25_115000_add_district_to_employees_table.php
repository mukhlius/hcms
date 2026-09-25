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
            $table->string('ktp_district', 100)->nullable()->after('ktp_city');
            $table->string('residential_district', 100)->nullable()->after('residential_city');
            $table->string('mailing_district', 100)->nullable()->after('mailing_city');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['ktp_district', 'residential_district', 'mailing_district']);
        });
    }
};

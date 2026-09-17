<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organization_companies', function (Blueprint $table) {
            $table->string('legal_name')->nullable()->after('name');
            $table->string('short_name', 50)->nullable()->after('legal_name');
            $table->text('description')->nullable()->after('short_name');
            $table->string('tax_identifier', 50)->nullable()->after('description');
            $table->string('country', 10)->default('ID')->after('tax_identifier');
            $table->string('currency', 10)->default('IDR')->after('country');
            $table->string('timezone', 50)->default('Asia/Makassar')->after('currency');
            $table->string('status', 20)->default('ACTIVE')->index()->after('timezone');
            $table->date('effective_from')->nullable()->after('status');
            $table->date('effective_to')->nullable()->after('effective_from');
            $table->softDeletes()->after('updated_at');
        });

        Schema::table('organization_sites', function (Blueprint $table) {
            $table->string('short_name', 50)->nullable()->after('name');
            $table->string('site_type', 30)->default('MINING_SITE')->after('short_name');
            $table->text('description')->nullable()->after('site_type');
            $table->text('address')->nullable()->after('location');
            $table->string('country', 10)->default('ID')->after('address');
            $table->string('province', 100)->nullable()->after('country');
            $table->string('city', 100)->nullable()->after('province');
            $table->string('district', 100)->nullable()->after('city');
            $table->string('postal_code', 20)->nullable()->after('district');
            $table->decimal('latitude', 10, 7)->nullable()->after('postal_code');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('timezone', 50)->default('Asia/Makassar')->after('longitude');
            $table->string('status', 20)->default('ACTIVE')->index()->after('timezone');
            $table->date('effective_from')->nullable()->after('status');
            $table->date('effective_to')->nullable()->after('effective_from');
            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('organization_sites', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn([
                'short_name', 'site_type', 'description', 'address', 'country',
                'province', 'city', 'district', 'postal_code', 'latitude',
                'longitude', 'timezone', 'status', 'effective_from', 'effective_to'
            ]);
        });

        Schema::table('organization_companies', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn([
                'legal_name', 'short_name', 'description', 'tax_identifier',
                'country', 'currency', 'timezone', 'status', 'effective_from', 'effective_to'
            ]);
        });
    }
};

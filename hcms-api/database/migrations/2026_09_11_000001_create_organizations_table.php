<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_companies', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('organization_sites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('organization_companies')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('organization_departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->nullable()->constrained('organization_sites')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_departments');
        Schema::dropIfExists('organization_sites');
        Schema::dropIfExists('organization_companies');
    }
};

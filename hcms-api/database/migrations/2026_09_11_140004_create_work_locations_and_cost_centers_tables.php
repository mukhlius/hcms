<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('organization_companies')->cascadeOnDelete();
            $table->foreignId('site_id')->nullable()->constrained('organization_sites')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('type', ['PIT', 'WORKSHOP', 'WAREHOUSE', 'OFFICE', 'PORT', 'CAMP', 'OTHER'])->default('OFFICE')->index();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('cost_centers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('organization_companies')->cascadeOnDelete();
            $table->foreignId('organization_unit_id')->nullable()->constrained('organization_units')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cost_centers');
        Schema::dropIfExists('work_locations');
    }
};

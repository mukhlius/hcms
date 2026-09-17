<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('category', 50)->default('PERSONAL')->index();
            $table->boolean('required')->default(false);
            $table->boolean('expiry_required')->default(false);
            $table->boolean('employee_required')->default(false);
            $table->boolean('verification_required')->default(false);
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('relationship_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('termination_reasons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('category', [
                'RESIGNATION', 'CONTRACT_END', 'RETIREMENT', 'PERFORMANCE', 
                'DISCIPLINARY', 'REDUNDANCY', 'SITE_CLOSURE', 'DEATH', 'OTHER'
            ])->default('RESIGNATION')->index();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('category', 50)->default('ANNUAL')->index();
            $table->boolean('paid')->default(true);
            $table->boolean('requires_document')->default(false);
            $table->boolean('requires_approval')->default(true);
            $table->boolean('requires_medical_document')->default(false);
            $table->string('duration_type', 20)->default('DAYS');
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('overtime_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->decimal('rate_multiplier', 4, 2)->default(1.50);
            $table->string('category', 50)->default('REGULAR')->index();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('recruitment_sources', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruitment_sources');
        Schema::dropIfExists('overtime_types');
        Schema::dropIfExists('leave_types');
        Schema::dropIfExists('termination_reasons');
        Schema::dropIfExists('relationship_types');
        Schema::dropIfExists('document_types');
    }
};

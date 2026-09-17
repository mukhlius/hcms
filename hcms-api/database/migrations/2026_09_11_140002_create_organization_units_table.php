<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('organization_companies')->cascadeOnDelete();
            $table->foreignId('site_id')->nullable()->constrained('organization_sites')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('organization_units')->nullOnDelete();
            $table->enum('type', ['BUSINESS_UNIT', 'DIVISION', 'DEPARTMENT', 'SECTION', 'SUB_SECTION', 'OTHER'])->default('DEPARTMENT')->index();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('leader_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_units');
    }
};

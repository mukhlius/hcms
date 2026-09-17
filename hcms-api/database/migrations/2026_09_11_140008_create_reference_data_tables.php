<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geographic_references', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['COUNTRY', 'PROVINCE', 'CITY', 'DISTRICT', 'VILLAGE'])->index();
            $table->foreignId('parent_id')->nullable()->constrained('geographic_references')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('postal_code', 20)->nullable();
            $table->timestamps();
        });

        Schema::create('standard_references', function (Blueprint $table) {
            $table->id();
            $table->enum('category', ['RELIGION', 'EDUCATION', 'MARITAL_STATUS', 'BLOOD_TYPE', 'CURRENCY', 'BANK'])->index();
            $table->string('code')->index();
            $table->string('name');
            $table->json('metadata')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();

            $table->unique(['category', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('standard_references');
        Schema::dropIfExists('geographic_references');
    }
};

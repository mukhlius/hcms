<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_master_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('custom_master_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('custom_master_categories')->cascadeOnDelete();
            $table->string('code');
            $table->string('name');
            $table->unsignedInteger('order')->default(0);
            $table->json('metadata')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();

            $table->unique(['category_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_master_values');
        Schema::dropIfExists('custom_master_categories');
    }
};

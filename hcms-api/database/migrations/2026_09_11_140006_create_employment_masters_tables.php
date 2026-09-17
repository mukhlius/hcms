<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employment_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('employment_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('worker_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('employee_groups', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('employee_sub_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_group_id')->constrained('employee_groups')->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        Schema::create('contract_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_types');
        Schema::dropIfExists('employee_sub_groups');
        Schema::dropIfExists('employee_groups');
        Schema::dropIfExists('worker_categories');
        Schema::dropIfExists('employment_statuses');
        Schema::dropIfExists('employment_types');
    }
};

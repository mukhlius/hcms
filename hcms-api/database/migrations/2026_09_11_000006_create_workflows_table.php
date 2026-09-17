<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g. LEAVE_REQUEST, PROMOTION, USER_ONBOARDING
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('module')->index();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
        });

        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_definition_id')->constrained('workflow_definitions')->cascadeOnDelete();
            $table->unsignedInteger('step_order');
            $table->string('name');
            $table->string('approver_type'); // ROLE, MANAGER, SPECIFIC_USER, SCOPE_HEAD
            $table->string('approver_target')->nullable(); // Role name or scope indicator
            $table->boolean('is_required')->default(true);
            $table->timestamps();

            $table->unique(['workflow_definition_id', 'step_order']);
        });

        Schema::create('workflow_instances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_definition_id')->constrained('workflow_definitions')->cascadeOnDelete();
            $table->string('entity_type'); // Model class
            $table->string('entity_id');
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('current_step')->default(1);
            $table->enum('status', ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])->default('PENDING')->index();
            $table->timestamps();
        });

        Schema::create('workflow_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_instance_id')->constrained('workflow_instances')->cascadeOnDelete();
            $table->foreignId('workflow_step_id')->nullable()->constrained('workflow_steps')->nullOnDelete();
            $table->foreignId('actor_id')->constrained('users')->cascadeOnDelete();
            $table->enum('action', ['SUBMIT', 'APPROVE', 'REJECT', 'RETURN', 'CANCEL'])->index();
            $table->text('comments')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_actions');
        Schema::dropIfExists('workflow_instances');
        Schema::dropIfExists('workflow_steps');
        Schema::dropIfExists('workflow_definitions');
    }
};

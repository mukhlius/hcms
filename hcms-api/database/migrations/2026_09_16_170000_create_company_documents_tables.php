<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Main Company Documents Table
        Schema::create('company_documents', function (Blueprint $table) {
            $table->id();
            $table->string('document_number', 100)->index();
            $table->string('title', 255);
            $table->enum('category', ['REGULATION', 'POLICY_SOP', 'INTERNAL_MEMO', 'FORM_TEMPLATE'])->default('INTERNAL_MEMO')->index();
            $table->text('description')->nullable();
            $table->string('file_path', 255);
            $table->string('file_name', 255);
            $table->unsignedInteger('file_size')->default(0); // in bytes
            $table->string('mime_type', 100)->default('application/pdf');
            $table->string('version', 20)->default('1.0');
            $table->date('effective_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->boolean('is_acknowledgment_required')->default(false);
            $table->enum('audience_type', ['ALL', 'DEPARTMENT', 'SECTION', 'POSITION'])->default('ALL')->index();
            $table->enum('status', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])->default('PUBLISHED')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 2. Document Target Audiences (Specific Departments, Sections, or Positions)
        Schema::create('company_document_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_document_id')->constrained('company_documents')->cascadeOnDelete();
            $table->enum('target_type', ['DEPARTMENT', 'SECTION', 'POSITION'])->index();
            $table->unsignedBigInteger('target_id')->index(); // organization_units.id or positions.id
            $table->string('target_name', 255)->nullable(); // cached name for display
            $table->timestamps();

            $table->unique(['company_document_id', 'target_type', 'target_id'], 'doc_target_unique');
        });

        // 3. Document Reads / Acknowledgments History per Employee
        Schema::create('company_document_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_document_id')->constrained('company_documents')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('read_at')->useCurrent();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();

            $table->unique(['company_document_id', 'user_id'], 'doc_read_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_document_reads');
        Schema::dropIfExists('company_document_targets');
        Schema::dropIfExists('company_documents');
    }
};

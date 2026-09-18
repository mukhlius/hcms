<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organization_departments', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('id')->constrained('organization_companies')->cascadeOnDelete();
            $table->text('description')->nullable()->after('name');
            $table->foreignId('leader_user_id')->nullable()->after('description')->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('ACTIVE')->after('leader_user_id')->index();
            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('organization_departments', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropForeign(['leader_user_id']);
            $table->dropColumn(['company_id', 'description', 'leader_user_id', 'status', 'deleted_at']);
        });
    }
};

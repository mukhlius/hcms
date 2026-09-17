<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->string('pangkat', 20)->default('Staff')->after('level')->index();
        });

        // Set default Pangkat for existing mining grade levels
        // Level 1 & 2: Non Staff (Operator, Helper, Technician)
        // Level 3 s/d 8: Staff (Foreman, Supervisor, Superintendent, Manager, GM, Director)
        DB::table('grades')->whereIn('level', [1, 2])->update(['pangkat' => 'Non Staff']);
        DB::table('grades')->where('level', '>=', 3)->update(['pangkat' => 'Staff']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropColumn('pangkat');
        });
    }
};

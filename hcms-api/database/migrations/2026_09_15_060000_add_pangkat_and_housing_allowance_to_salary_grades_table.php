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
        Schema::table('salary_grades', function (Blueprint $table) {
            $table->string('pangkat', 20)->default('Staff')->after('name')->index();
            $table->decimal('housing_allowance', 15, 2)->default(0)->after('pangkat');
        });

        // Seed initial values for mining housing allowance and rank
        $housingRates = [
            'GOL-1A' => ['pangkat' => 'Non Staff', 'housing_allowance' => 750000],
            'GOL-1B' => ['pangkat' => 'Non Staff', 'housing_allowance' => 1000000],
            'GOL-2A' => ['pangkat' => 'Non Staff', 'housing_allowance' => 1250000],
            'GOL-2B' => ['pangkat' => 'Non Staff', 'housing_allowance' => 1500000],
            'GOL-3A' => ['pangkat' => 'Staff', 'housing_allowance' => 2000000],
            'GOL-3B' => ['pangkat' => 'Staff', 'housing_allowance' => 2500000],
            'GOL-4A' => ['pangkat' => 'Staff', 'housing_allowance' => 3500000],
            'GOL-5A' => ['pangkat' => 'Staff', 'housing_allowance' => 5000000],
            'GOL-6A' => ['pangkat' => 'Staff', 'housing_allowance' => 7500000],
            'GOL-7A' => ['pangkat' => 'Staff', 'housing_allowance' => 10000000],
            'GOL-8A' => ['pangkat' => 'Staff', 'housing_allowance' => 15000000],
        ];

        foreach ($housingRates as $code => $data) {
            DB::table('salary_grades')->where('code', $code)->update($data);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_grades', function (Blueprint $table) {
            $table->dropColumn(['pangkat', 'housing_allowance']);
        });
    }
};

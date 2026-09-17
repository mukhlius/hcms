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
        Schema::table('standard_references', function (Blueprint $table) {
            $table->string('category', 50)->change();
        });

        $now = now();
        $initialData = [
            // Ukuran Seragam (Wearpack / Baju Kerja)
            ['category' => 'UNIFORM_SIZE', 'code' => 'S', 'name' => 'Ukuran S (Small)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'UNIFORM_SIZE', 'code' => 'M', 'name' => 'Ukuran M (Medium)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'UNIFORM_SIZE', 'code' => 'L', 'name' => 'Ukuran L (Large)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'UNIFORM_SIZE', 'code' => 'XL', 'name' => 'Ukuran XL (Extra Large)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'UNIFORM_SIZE', 'code' => '2XL', 'name' => 'Ukuran 2XL (Double Extra Large)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'UNIFORM_SIZE', 'code' => '3XL', 'name' => 'Ukuran 3XL (Triple Extra Large)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'UNIFORM_SIZE', 'code' => '4XL', 'name' => 'Ukuran 4XL (Jumbo)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],

            // Ukuran Celana
            ['category' => 'PANTS_SIZE', 'code' => '28', 'name' => 'Ukuran 28 (Lingkar Pinggang ~71 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'PANTS_SIZE', 'code' => '29', 'name' => 'Ukuran 29 (Lingkar Pinggang ~74 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'PANTS_SIZE', 'code' => '30', 'name' => 'Ukuran 30 (Lingkar Pinggang ~76 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'PANTS_SIZE', 'code' => '31', 'name' => 'Ukuran 31 (Lingkar Pinggang ~79 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'PANTS_SIZE', 'code' => '32', 'name' => 'Ukuran 32 (Lingkar Pinggang ~81 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'PANTS_SIZE', 'code' => '33', 'name' => 'Ukuran 33 (Lingkar Pinggang ~84 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'PANTS_SIZE', 'code' => '34', 'name' => 'Ukuran 34 (Lingkar Pinggang ~86 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'PANTS_SIZE', 'code' => '36', 'name' => 'Ukuran 36 (Lingkar Pinggang ~91 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'PANTS_SIZE', 'code' => '38', 'name' => 'Ukuran 38 (Lingkar Pinggang ~97 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'PANTS_SIZE', 'code' => '40', 'name' => 'Ukuran 40 (Lingkar Pinggang ~102 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],

            // Ukuran Sepatu (Safety Boots Tambang)
            ['category' => 'SHOE_SIZE', 'code' => '38', 'name' => 'Ukuran 38 (EUR 38 / 24 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'SHOE_SIZE', 'code' => '39', 'name' => 'Ukuran 39 (EUR 39 / 24.5 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'SHOE_SIZE', 'code' => '40', 'name' => 'Ukuran 40 (EUR 40 / 25 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'SHOE_SIZE', 'code' => '41', 'name' => 'Ukuran 41 (EUR 41 / 26 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'SHOE_SIZE', 'code' => '42', 'name' => 'Ukuran 42 (EUR 42 / 26.5 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'SHOE_SIZE', 'code' => '43', 'name' => 'Ukuran 43 (EUR 43 / 27.5 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'SHOE_SIZE', 'code' => '44', 'name' => 'Ukuran 44 (EUR 44 / 28 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'SHOE_SIZE', 'code' => '45', 'name' => 'Ukuran 45 (EUR 45 / 29 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
            ['category' => 'SHOE_SIZE', 'code' => '46', 'name' => 'Ukuran 46 (EUR 46 / 29.5 cm)', 'status' => 'ACTIVE', 'created_at' => $now, 'updated_at' => $now],
        ];

        foreach ($initialData as $data) {
            DB::table('standard_references')->updateOrInsert(
                ['category' => $data['category'], 'code' => $data['code']],
                $data
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('standard_references')->whereIn('category', ['UNIFORM_SIZE', 'PANTS_SIZE', 'SHOE_SIZE'])->delete();

        Schema::table('standard_references', function (Blueprint $table) {
            $table->enum('category', ['RELIGION', 'EDUCATION', 'MARITAL_STATUS', 'BLOOD_TYPE', 'CURRENCY', 'BANK'])->change();
        });
    }
};

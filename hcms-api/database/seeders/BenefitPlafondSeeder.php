<?php

namespace Database\Seeders;

use App\Models\BenefitPlafond;
use App\Models\Grade;
use Illuminate\Database\Seeder;

class BenefitPlafondSeeder extends Seeder
{
    public function run(): void
    {
        $grades = Grade::orderBy('level')->get();

        $pengobatan = [
            1 => ['M' => 150000000, 'TM' => 75000000],
            2 => ['M' => 100000000, 'TM' => 50000000],
            3 => ['M' => 60000000, 'TM' => 30000000],
            4 => ['M' => 40000000, 'TM' => 20000000],
            5 => ['M' => 25000000, 'TM' => 12500000],
            6 => ['M' => 18000000, 'TM' => 9000000],
            7 => ['M' => 14000000, 'TM' => 7000000],
            8 => ['M' => 10000000, 'TM' => 5000000],
        ];

        $kacamata = [
            1 => ['M' => 6000000, 'TM' => 3000000],
            2 => ['M' => 5000000, 'TM' => 2500000],
            3 => ['M' => 4000000, 'TM' => 2000000],
            4 => ['M' => 3000000, 'TM' => 1500000],
            5 => ['M' => 2500000, 'TM' => 1250000],
            6 => ['M' => 2000000, 'TM' => 1000000],
            7 => ['M' => 1500000, 'TM' => 800000],
            8 => ['M' => 1200000, 'TM' => 600000],
        ];

        $persalinan = [
            1 => ['M' => 35000000, 'TM' => 0],
            2 => ['M' => 28000000, 'TM' => 0],
            3 => ['M' => 22000000, 'TM' => 0],
            4 => ['M' => 18000000, 'TM' => 0],
            5 => ['M' => 15000000, 'TM' => 0],
            6 => ['M' => 12000000, 'TM' => 0],
            7 => ['M' => 10000000, 'TM' => 0],
            8 => ['M' => 8000000, 'TM' => 0],
        ];

        foreach ($grades as $g) {
            $lvl = $g->level;

            // Pengobatan
            if (isset($pengobatan[$lvl])) {
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'PENGOBATAN', 'grade_id' => $g->id, 'marital_category' => 'Menikah'],
                    ['amount' => $pengobatan[$lvl]['M'], 'period_type' => 'TAHUNAN', 'description' => 'Plafon rawat jalan & inap tahunan (Karyawan + Keluarga)', 'status' => 'ACTIVE']
                );
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'PENGOBATAN', 'grade_id' => $g->id, 'marital_category' => 'Tidak Menikah'],
                    ['amount' => $pengobatan[$lvl]['TM'], 'period_type' => 'TAHUNAN', 'description' => 'Plafon rawat jalan & inap tahunan (Karyawan Lajang)', 'status' => 'ACTIVE']
                );
            }

            // Kacamata
            if (isset($kacamata[$lvl])) {
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'KACAMATA', 'grade_id' => $g->id, 'marital_category' => 'Menikah'],
                    ['amount' => $kacamata[$lvl]['M'], 'period_type' => '2_TAHUNAN', 'description' => 'Plafon lensa & frame per 2 tahun (Karyawan + Pasangan)', 'status' => 'ACTIVE']
                );
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'KACAMATA', 'grade_id' => $g->id, 'marital_category' => 'Tidak Menikah'],
                    ['amount' => $kacamata[$lvl]['TM'], 'period_type' => '2_TAHUNAN', 'description' => 'Plafon lensa & frame per 2 tahun (Karyawan)', 'status' => 'ACTIVE']
                );
            }

            // Persalinan
            if (isset($persalinan[$lvl])) {
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'PERSALINAN', 'grade_id' => $g->id, 'marital_category' => 'Menikah'],
                    ['amount' => $persalinan[$lvl]['M'], 'period_type' => 'PER_KASUS', 'description' => 'Plafon biaya persalinan normal maupun caesar per kehamilan/kelahiran', 'status' => 'ACTIVE']
                );
            }
        }
    }
}

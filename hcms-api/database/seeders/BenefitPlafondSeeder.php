<?php

namespace Database\Seeders;

use App\Models\BenefitPlafond;
use App\Models\SalaryGrade;
use Illuminate\Database\Seeder;

class BenefitPlafondSeeder extends Seeder
{
    public function run(): void
    {
        $salaryGrades = SalaryGrade::orderBy('code')->get();

        // Ceilings keyed by Salary Grade (Golongan) code
        $pengobatan = [
            'GOL-8A' => ['M' => 150000000, 'TM' => 75000000],
            'GOL-7A' => ['M' => 100000000, 'TM' => 50000000],
            'GOL-6A' => ['M' => 60000000,  'TM' => 30000000],
            'GOL-5A' => ['M' => 40000000,  'TM' => 20000000],
            'GOL-4A' => ['M' => 25000000,  'TM' => 12500000],
            'GOL-3B' => ['M' => 20000000,  'TM' => 10000000],
            'GOL-3A' => ['M' => 18000000,  'TM' => 9000000],
            'GOL-2B' => ['M' => 16000000,  'TM' => 8000000],
            'GOL-2A' => ['M' => 14000000,  'TM' => 7000000],
            'GOL-1B' => ['M' => 12000000,  'TM' => 6000000],
            'GOL-1A' => ['M' => 10000000,  'TM' => 5000000],
        ];

        $kacamata = [
            'GOL-8A' => ['M' => 6000000, 'TM' => 3000000],
            'GOL-7A' => ['M' => 5000000, 'TM' => 2500000],
            'GOL-6A' => ['M' => 4000000, 'TM' => 2000000],
            'GOL-5A' => ['M' => 3000000, 'TM' => 1500000],
            'GOL-4A' => ['M' => 2500000, 'TM' => 1250000],
            'GOL-3B' => ['M' => 2200000, 'TM' => 1100000],
            'GOL-3A' => ['M' => 2000000, 'TM' => 1000000],
            'GOL-2B' => ['M' => 1800000, 'TM' => 900000],
            'GOL-2A' => ['M' => 1500000, 'TM' => 800000],
            'GOL-1B' => ['M' => 1300000, 'TM' => 700000],
            'GOL-1A' => ['M' => 1200000, 'TM' => 600000],
        ];

        $persalinan = [
            'GOL-8A' => ['M' => 35000000, 'TM' => 0],
            'GOL-7A' => ['M' => 28000000, 'TM' => 0],
            'GOL-6A' => ['M' => 22000000, 'TM' => 0],
            'GOL-5A' => ['M' => 18000000, 'TM' => 0],
            'GOL-4A' => ['M' => 15000000, 'TM' => 0],
            'GOL-3B' => ['M' => 13500000, 'TM' => 0],
            'GOL-3A' => ['M' => 12000000, 'TM' => 0],
            'GOL-2B' => ['M' => 11000000, 'TM' => 0],
            'GOL-2A' => ['M' => 10000000, 'TM' => 0],
            'GOL-1B' => ['M' => 9000000,  'TM' => 0],
            'GOL-1A' => ['M' => 8000000,  'TM' => 0],
        ];

        foreach ($salaryGrades as $sg) {
            $code = $sg->code;

            // 1. Pengobatan
            if (isset($pengobatan[$code])) {
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'PENGOBATAN', 'salary_grade_id' => $sg->id, 'marital_category' => 'Menikah'],
                    ['amount' => $pengobatan[$code]['M'], 'period_type' => 'TAHUNAN', 'description' => 'Plafon rawat jalan & inap tahunan (Karyawan + Keluarga)', 'status' => 'ACTIVE']
                );
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'PENGOBATAN', 'salary_grade_id' => $sg->id, 'marital_category' => 'Tidak Menikah'],
                    ['amount' => $pengobatan[$code]['TM'], 'period_type' => 'TAHUNAN', 'description' => 'Plafon rawat jalan & inap tahunan (Karyawan Lajang)', 'status' => 'ACTIVE']
                );
            }

            // 2. Kacamata
            if (isset($kacamata[$code])) {
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'KACAMATA', 'salary_grade_id' => $sg->id, 'marital_category' => 'Menikah'],
                    ['amount' => $kacamata[$code]['M'], 'period_type' => '2_TAHUNAN', 'description' => 'Plafon lensa & frame per 2 tahun (Karyawan + Pasangan)', 'status' => 'ACTIVE']
                );
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'KACAMATA', 'salary_grade_id' => $sg->id, 'marital_category' => 'Tidak Menikah'],
                    ['amount' => $kacamata[$code]['TM'], 'period_type' => '2_TAHUNAN', 'description' => 'Plafon lensa & frame per 2 tahun (Karyawan)', 'status' => 'ACTIVE']
                );
            }

            // 3. Persalinan
            if (isset($persalinan[$code])) {
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'PERSALINAN', 'salary_grade_id' => $sg->id, 'marital_category' => 'Menikah'],
                    ['amount' => $persalinan[$code]['M'], 'period_type' => 'PER_KASUS', 'description' => 'Plafon biaya persalinan normal maupun caesar per kehamilan/kelahiran', 'status' => 'ACTIVE']
                );
            }
        }
    }
}

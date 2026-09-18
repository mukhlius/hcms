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

        // Clear previous Kacamata records to replace with criteria-based ones
        BenefitPlafond::where('benefit_type', 'KACAMATA')->delete();

        $kacamataCriteria = [
            [
                'lens_type' => 'Monofokus',
                'frame_amount' => 600000,
                'lens_amount' => 400000,
                'description' => 'Lensa fokus tunggal (plus/minus) untuk rabun dekat atau jauh',
            ],
            [
                'lens_type' => 'Monofokus Silindris',
                'frame_amount' => 600000,
                'lens_amount' => 600000,
                'description' => 'Lensa fokus tunggal disertai koreksi silinder (astigmatisme)',
            ],
            [
                'lens_type' => 'Bifokus',
                'frame_amount' => 800000,
                'lens_amount' => 700000,
                'description' => 'Lensa dua titik fokus (baca & jauh) dengan garis batas',
            ],
            [
                'lens_type' => 'Bifokus Silindris',
                'frame_amount' => 800000,
                'lens_amount' => 950000,
                'description' => 'Lensa dua titik fokus disertai koreksi silinder',
            ],
            [
                'lens_type' => 'Progresif',
                'frame_amount' => 1000000,
                'lens_amount' => 1200000,
                'description' => 'Lensa multividang tanpa garis pembatas untuk jarak dekat, menengah & jauh',
            ],
            [
                'lens_type' => 'Progresif Silindris',
                'frame_amount' => 1000000,
                'lens_amount' => 1500000,
                'description' => 'Lensa progresif premium tanpa garis pembatas disertai koreksi silinder',
            ],
        ];

        foreach ($kacamataCriteria as $k) {
            $totalAmount = $k['frame_amount'] + $k['lens_amount'];
            BenefitPlafond::create([
                'benefit_type' => 'KACAMATA',
                'salary_grade_id' => null,
                'lens_type' => $k['lens_type'],
                'frame_amount' => $k['frame_amount'],
                'lens_amount' => $k['lens_amount'],
                'amount' => $totalAmount,
                'marital_category' => 'SEMUA',
                'period_type' => '2_TAHUNAN',
                'description' => $k['description'],
                'status' => 'ACTIVE',
            ]);
        }

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

            // 2. Persalinan
            if (isset($persalinan[$code])) {
                BenefitPlafond::updateOrCreate(
                    ['benefit_type' => 'PERSALINAN', 'salary_grade_id' => $sg->id, 'marital_category' => 'Menikah'],
                    ['amount' => $persalinan[$code]['M'], 'period_type' => 'PER_KASUS', 'description' => 'Plafon biaya persalinan normal maupun caesar per kehamilan/kelahiran', 'status' => 'ACTIVE']
                );
            }

            // 3. Tunjangan Lapangan
            $tunjanganRate = match ($code) {
                'GOL-8A', 'GOL-7A' => 3500000,
                'GOL-6A', 'GOL-5A' => 2800000,
                'GOL-4A', 'GOL-3B' => 2200000,
                'GOL-3A', 'GOL-2B' => 1800000,
                default => 1500000,
            };
            BenefitPlafond::updateOrCreate(
                ['benefit_type' => 'TUNJANGAN_LAPANGAN', 'salary_grade_id' => $sg->id, 'category_name' => 'Pit Tambang & Operasional Front'],
                [
                    'amount' => $tunjanganRate,
                    'period_type' => 'BULANAN',
                    'description' => 'Tunjangan penempatan kerja lapangan pit tambang aktif dan jalan hauling batubara',
                    'status' => 'ACTIVE',
                ]
            );

            // 4. Uang Perdin (Perjalanan Dinas)
            $perdinLuarKota = match ($code) {
                'GOL-8A', 'GOL-7A' => 600000,
                'GOL-6A', 'GOL-5A' => 450000,
                'GOL-4A', 'GOL-3B' => 350000,
                default => 250000,
            };
            BenefitPlafond::updateOrCreate(
                ['benefit_type' => 'UANG_PERDIN', 'salary_grade_id' => $sg->id, 'zone_name' => 'Luar Kota / Antar Provinsi', 'category_name' => 'Uang Saku Harian'],
                [
                    'amount' => $perdinLuarKota,
                    'period_type' => 'HARIAN',
                    'description' => 'Uang saku perjalanan dinas luar wilayah penugasan resmi perusahaan',
                    'status' => 'ACTIVE',
                ]
            );
            BenefitPlafond::updateOrCreate(
                ['benefit_type' => 'UANG_PERDIN', 'salary_grade_id' => $sg->id, 'zone_name' => 'Antar Site Tambang', 'category_name' => 'Uang Saku Harian'],
                [
                    'amount' => (int)($perdinLuarKota * 0.7),
                    'period_type' => 'HARIAN',
                    'description' => 'Uang saku dinas lintas project site tambang internal perusahaan',
                    'status' => 'ACTIVE',
                ]
            );

            // 5. Bantuan Lumpsum
            $lumpsumRelokasi = match ($code) {
                'GOL-8A', 'GOL-7A' => 8000000,
                'GOL-6A', 'GOL-5A' => 6000000,
                'GOL-4A', 'GOL-3B' => 4500000,
                default => 3000000,
            };
            BenefitPlafond::updateOrCreate(
                ['benefit_type' => 'BANTUAN_LUMPSUM', 'salary_grade_id' => $sg->id, 'category_name' => 'Relokasi Site Tambang'],
                [
                    'amount' => $lumpsumRelokasi,
                    'period_type' => 'PER_KASUS',
                    'description' => 'Bantuan biaya relokasi dan akomodasi pindah tugas pertama/mutasi ke site tambang baru',
                    'status' => 'ACTIVE',
                ]
            );

            // 6. Bantuan Komunikasi
            $komunikasiRate = match ($code) {
                'GOL-8A', 'GOL-7A' => 750000,
                'GOL-6A', 'GOL-5A' => 500000,
                'GOL-4A', 'GOL-3B' => 350000,
                default => 200000,
            };
            BenefitPlafond::updateOrCreate(
                ['benefit_type' => 'BANTUAN_KOMUNIKASI', 'salary_grade_id' => $sg->id, 'category_name' => 'Paket Data & Komunikasi Lapangan'],
                [
                    'amount' => $komunikasiRate,
                    'period_type' => 'BULANAN',
                    'description' => 'Bantuan voucher paket data dan koordinasi operasional tim lapangan/manajemen',
                    'status' => 'ACTIVE',
                ]
            );

            // 7. Bantuan Perumahan
            $housingRate = $sg->housing_allowance > 0 ? (int)$sg->housing_allowance : match ($code) {
                'GOL-8A' => 15000000,
                'GOL-7A' => 10000000,
                'GOL-6A' => 7500000,
                'GOL-5A' => 5000000,
                'GOL-4A' => 3500000,
                'GOL-3B' => 2500000,
                'GOL-3A' => 2000000,
                'GOL-2B' => 1500000,
                'GOL-2A' => 1250000,
                'GOL-1B' => 1000000,
                default => 750000,
            };
            BenefitPlafond::updateOrCreate(
                ['benefit_type' => 'BANTUAN_PERUMAHAN', 'salary_grade_id' => $sg->id, 'category_name' => 'Tunjangan Perumahan Mandiri'],
                [
                    'amount' => $housingRate,
                    'period_type' => 'BULANAN',
                    'description' => 'Bantuan sewa tempat tinggal atau tunjangan perumahan mandiri di luar fasilitas mess perusahaan',
                    'status' => 'ACTIVE',
                ]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\LevelWorkRoster;
use App\Models\PaidLeavePolicy;
use App\Models\Position;
use App\Models\PositionWorkTime;
use App\Models\PublicHoliday;
use App\Models\ResignationType;
use App\Models\Shift;
use App\Models\TerminationType;
use App\Models\WarningLetterDuration;
use App\Models\WorkSchedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrgReferenceExtensionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Level Work Rosters
        $roster14_7 = WorkSchedule::where('code', 'ROSTER-14-7')->first();
        $roster5_2 = WorkSchedule::where('code', 'OFFICE-5-2')->first();

        // Create 70:14 roster if not exists
        $roster70_14 = WorkSchedule::firstOrCreate(
            ['code' => 'ROSTER-70-14'],
            [
                'name' => 'Roster Lapangan Operator (70 ON / 14 OFF)',
                'pattern_type' => 'ROSTER',
                'days_on' => 70,
                'days_off' => 14,
                'cycle_days' => 84,
                'status' => 'ACTIVE',
            ]
        );

        $roster10_2 = WorkSchedule::firstOrCreate(
            ['code' => 'ROSTER-10-2'],
            [
                'name' => 'Roster Semi-Site Pimpinan (10 ON / 2 OFF)',
                'pattern_type' => 'ROSTER',
                'days_on' => 10,
                'days_off' => 2,
                'cycle_days' => 12,
                'status' => 'ACTIVE',
            ]
        );

        $levelRosters = [
            [
                'level' => 1,
                'roster_name' => 'Roster Office 5:2 (Head Office / General Management)',
                'work_schedule_id' => $roster5_2?->id,
                'days_on' => 5,
                'days_off' => 2,
                'poh_type' => 'ALL',
                'travel_days' => 0,
                'description' => 'Jadwal kerja kantor pusat / manajemen puncak level 1.',
            ],
            [
                'level' => 2,
                'roster_name' => 'Roster Semi-Site 10:2 (Deputy Project Manager)',
                'work_schedule_id' => $roster10_2?->id,
                'days_on' => 10,
                'days_off' => 2,
                'poh_type' => 'ALL',
                'travel_days' => 1,
                'description' => 'Pola kerja 10 hari onsite dan 2 hari istirahat pimpinan site.',
            ],
            [
                'level' => 3,
                'roster_name' => 'Roster Department Head 10:2',
                'work_schedule_id' => $roster10_2?->id,
                'days_on' => 10,
                'days_off' => 2,
                'poh_type' => 'ALL',
                'travel_days' => 1,
                'description' => 'Pola rotasi kerja 10 hari dinas dan 2 hari libur kepala departemen.',
            ],
            [
                'level' => 4,
                'roster_name' => 'Roster Operasional 14:7 (Section Head Non-Lokal)',
                'work_schedule_id' => $roster14_7?->id,
                'days_on' => 14,
                'days_off' => 7,
                'poh_type' => 'NON_LOKAL',
                'travel_days' => 2,
                'description' => 'Pola rotasi standar tambang 14 hari kerja dan 7 hari cuti lapangan.',
            ],
            [
                'level' => 5,
                'roster_name' => 'Roster Operasional 14:7 (Group Leader / Supervisor)',
                'work_schedule_id' => $roster14_7?->id,
                'days_on' => 14,
                'days_off' => 7,
                'poh_type' => 'NON_LOKAL',
                'travel_days' => 2,
                'description' => 'Pola rotasi 14 ON / 7 OFF untuk pengawas lapangan tambang.',
            ],
            [
                'level' => 6,
                'roster_name' => 'Roster Staff 14:7 (Officer / Spesialis Non-Lokal)',
                'work_schedule_id' => $roster14_7?->id,
                'days_on' => 14,
                'days_off' => 7,
                'poh_type' => 'NON_LOKAL',
                'travel_days' => 2,
                'description' => 'Pola kerja staf teknis 14 hari kerja aktif dan 7 hari istirahat.',
            ],
            [
                'level' => 7,
                'roster_name' => 'Roster Lapangan 70:14 (Operator & Mekanik Non-Lokal)',
                'work_schedule_id' => $roster70_14?->id,
                'days_on' => 70,
                'days_off' => 14,
                'poh_type' => 'NON_LOKAL',
                'travel_days' => 2,
                'description' => 'Pola rotasi kerja lapangan 10 pekan kerja dan 2 pekan cuti roster.',
            ],
            [
                'level' => 7,
                'roster_name' => 'Roster Reguler 6:1 (Karyawan Harian Lokal)',
                'work_schedule_id' => null,
                'days_on' => 6,
                'days_off' => 1,
                'poh_type' => 'LOKAL',
                'travel_days' => 0,
                'description' => 'Pola kerja 6 hari kerja dan 1 hari libur mingguan tenaga kerja lokal.',
            ],
        ];

        foreach ($levelRosters as $lr) {
            LevelWorkRoster::firstOrCreate(
                ['level' => $lr['level'], 'roster_name' => $lr['roster_name']],
                $lr + ['status' => 'ACTIVE']
            );
        }

        // 2. Seed Position Work Times (Assign for sample positions)
        $dayShift = Shift::where('code', 'SHIFT-DAY-12H')->first();
        $nightShift = Shift::where('code', 'SHIFT-NIGHT-12H')->first();

        $allPositions = Position::take(25)->get();
        foreach ($allPositions as $pos) {
            $isField = str_contains(strtolower($pos->title), 'operator')
                || str_contains(strtolower($pos->title), 'driver')
                || str_contains(strtolower($pos->title), 'foreman')
                || str_contains(strtolower($pos->title), 'mechanic')
                || str_contains(strtolower($pos->title), 'production');

            PositionWorkTime::firstOrCreate(
                ['position_id' => $pos->id],
                [
                    'shift_id' => $isField ? $dayShift?->id : null,
                    'work_schedule_id' => $isField ? $roster14_7?->id : $roster5_2?->id,
                    'work_type' => $isField ? 'SHIFT' : 'NON_SHIFT',
                    'start_time' => $isField ? '06:00:00' : '07:00:00',
                    'end_time' => $isField ? '18:00:00' : '16:00:00',
                    'daily_hours' => $isField ? 12.00 : 8.00,
                    'weekly_days' => $isField ? 6 : 5,
                    'break_minutes' => 60,
                    'is_overtime_eligible' => $isField,
                    'description' => $isField ? 'Shift operasional 12 jam tambang berbayar lembur.' : 'Jam kerja normal kantor 8 jam per hari.',
                    'status' => 'ACTIVE',
                ]
            );
        }

        // 3. Seed Public Holidays 2026
        $holidays = [
            ['holiday_date' => '2026-01-01', 'name' => 'Tahun Baru 2026 Masehi', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-01-16', 'name' => "Isra Mi'raj Nabi Muhammad SAW", 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-02-17', 'name' => 'Tahun Baru Imlek 2577 Kongzili', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-03-20', 'name' => 'Hari Raya Idul Fitri 1447 H (Hari Pertama)', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-03-21', 'name' => 'Hari Raya Idul Fitri 1447 H (Hari Kedua)', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-03-22', 'name' => 'Hari Suci Nyepi Tahun Baru Saka 1948', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-03-23', 'name' => 'Cuti Bersama Hari Raya Idul Fitri', 'type' => 'CUTI_BERSAMA', 'year' => 2026],
            ['holiday_date' => '2026-03-24', 'name' => 'Cuti Bersama Hari Raya Idul Fitri', 'type' => 'CUTI_BERSAMA', 'year' => 2026],
            ['holiday_date' => '2026-04-03', 'name' => 'Wafat Yesus Kristus (Jumat Agung)', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-05-01', 'name' => 'Hari Buruh Internasional', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-05-14', 'name' => 'Kenaikan Yesus Kristus', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-05-27', 'name' => 'Hari Raya Idul Adha 1447 H', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-05-31', 'name' => 'Hari Raya Waisak 2570 BE', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-06-01', 'name' => 'Hari Lahir Pancasila', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-06-16', 'name' => 'Tahun Baru Islam 1448 Hijriah', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-08-17', 'name' => 'Hari Kemerdekaan Republik Indonesia ke-81', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-08-25', 'name' => 'Maulid Nabi Muhammad SAW', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-12-25', 'name' => 'Hari Raya Natal', 'type' => 'HARI_LIBUR_NASIONAL', 'year' => 2026],
            ['holiday_date' => '2026-12-26', 'name' => 'Cuti Bersama Hari Raya Natal', 'type' => 'CUTI_BERSAMA', 'year' => 2026],
        ];

        foreach ($holidays as $h) {
            PublicHoliday::firstOrCreate(
                ['holiday_date' => $h['holiday_date']],
                $h + ['status' => 'ACTIVE', 'is_recurring' => false]
            );
        }

        // 4. Seed Paid Leave Policies
        $paidLeaves = [
            [
                'code' => 'PL-ANNUAL',
                'name' => 'Cuti Tahunan',
                'category' => 'ANNUAL',
                'duration_days' => 12,
                'duration_unit' => 'HARI_KERJA',
                'requires_document' => false,
                'description' => 'Hak cuti tahunan berbayar karyawan setelah 12 bulan masa kerja.',
            ],
            [
                'code' => 'PL-MATERNITY',
                'name' => 'Cuti Melahirkan (Maternity Leave)',
                'category' => 'MATERNITY',
                'duration_days' => 90,
                'duration_unit' => 'HARI_KALENDER',
                'requires_document' => true,
                'required_document_name' => 'Surat Keterangan Dokter Kandungan / Bidan',
                'description' => 'Cuti persalinan pekerja perempuan selama 3 bulan kalender berbayar penuh.',
            ],
            [
                'code' => 'PL-MISCARRIAGE',
                'name' => 'Cuti Keguguran Kandungan',
                'category' => 'MATERNITY',
                'duration_days' => 45,
                'duration_unit' => 'HARI_KALENDER',
                'requires_document' => true,
                'required_document_name' => 'Surat Keterangan Dokter Kandungan',
                'description' => 'Istirahat keguguran kandungan 1.5 bulan kalender berbayar.',
            ],
            [
                'code' => 'PL-MARRIAGE',
                'name' => 'Cuti Menikah Karyawan',
                'category' => 'FAMILY_EVENT',
                'duration_days' => 3,
                'duration_unit' => 'HARI_KERJA',
                'requires_document' => true,
                'required_document_name' => 'Surat Undangan Pernikahan / Buku Nikah',
                'description' => 'Cuti acara perkawinan pekerja sendiri sebanyak 3 hari kerja.',
            ],
            [
                'code' => 'PL-CHILD-MARRIAGE',
                'name' => 'Cuti Menikahkan Anak',
                'category' => 'FAMILY_EVENT',
                'duration_days' => 2,
                'duration_unit' => 'HARI_KERJA',
                'requires_document' => true,
                'required_document_name' => 'Buku Nikah / Undangan',
                'description' => 'Cuti pekerja yang melangsungkan pernikahan anaknya.',
            ],
            [
                'code' => 'PL-PATERNITY',
                'name' => 'Cuti Istri Melahirkan / Keguguran',
                'category' => 'FAMILY_EVENT',
                'duration_days' => 2,
                'duration_unit' => 'HARI_KERJA',
                'requires_document' => true,
                'required_document_name' => 'Surat Keterangan Kelahiran Rumah Sakit',
                'description' => 'Pendampingan suami saat istri melahirkan atau keguguran.',
            ],
            [
                'code' => 'PL-BEREAVEMENT-INTI',
                'name' => 'Cuti Duka Cita (Keluarga Inti Meninggal)',
                'category' => 'FAMILY_EVENT',
                'duration_days' => 2,
                'duration_unit' => 'HARI_KERJA',
                'requires_document' => true,
                'required_document_name' => 'Surat Kematian RT/Kelurahan/RS',
                'description' => 'Suami/Istri, Orang Tua, Mertua, atau Anak kandung meninggal dunia.',
            ],
            [
                'code' => 'PL-BEREAVEMENT-SERUMAH',
                'name' => 'Cuti Duka Cita (Anggota Keluarga Serumah Meninggal)',
                'category' => 'FAMILY_EVENT',
                'duration_days' => 1,
                'duration_unit' => 'HARI_KERJA',
                'requires_document' => true,
                'required_document_name' => 'Kartu Keluarga & Surat Kematian',
                'description' => 'Anggota keluarga yang tercatat dalam satu Kartu Keluarga meninggal dunia.',
            ],
            [
                'code' => 'PL-CHILD-CIRCUM',
                'name' => 'Cuti Khitanan / Pembaptisan Anak',
                'category' => 'FAMILY_EVENT',
                'duration_days' => 2,
                'duration_unit' => 'HARI_KERJA',
                'requires_document' => true,
                'required_document_name' => 'Surat Keterangan Khitan / Sertifikat Baptis',
                'description' => 'Cuti untuk menghadiri khitanan atau baptis anak kandung.',
            ],
            [
                'code' => 'PL-HAJJ',
                'name' => 'Cuti Ibadah Haji (Pertama Kali)',
                'category' => 'RELIGIOUS',
                'duration_days' => 40,
                'duration_unit' => 'HARI_KALENDER',
                'requires_document' => true,
                'required_document_name' => 'SPPH Kemenag / Bukti Pelunasan Haji',
                'description' => 'Cuti menunaikan ibadah haji pertama kali sesuai ketentuan ketenagakerjaan.',
            ],
        ];

        foreach ($paidLeaves as $pl) {
            PaidLeavePolicy::firstOrCreate(
                ['code' => $pl['code']],
                $pl + ['status' => 'ACTIVE']
            );
        }

        // 5. Seed Warning Letter Durations
        $warningLetters = [
            [
                'code' => 'SP-TEGURAN',
                'level' => 'TEGURAN',
                'name' => 'Surat Teguran Tertulis',
                'duration_months' => 3,
                'validity_unit' => 'BULAN',
                'consequence_description' => 'Pemberian catatan pembinaan dan pembatasan pertimbangan penugasan khusus.',
                'description' => 'Diberikan pada pelanggaran ringan disiplin kerja.',
            ],
            [
                'code' => 'SP-01',
                'level' => 'SP_1',
                'name' => 'Surat Peringatan Pertama (SP I)',
                'duration_months' => 6,
                'validity_unit' => 'BULAN',
                'consequence_description' => 'Penundaan kenaikan jenjang & evaluasi KPI selama masa aktif 6 bulan.',
                'description' => 'Sanksi pelanggaran tata tertib kerja tingkat pertama (PP 35/2021).',
            ],
            [
                'code' => 'SP-02',
                'level' => 'SP_2',
                'name' => 'Surat Peringatan Kedua (SP II)',
                'duration_months' => 6,
                'validity_unit' => 'BULAN',
                'consequence_description' => 'Penundaan kenaikan level jabatan dan peninjauan insentif operasional bulanan.',
                'description' => 'Sanksi lanjutan jika mengulang pelanggaran dalam masa SP I.',
            ],
            [
                'code' => 'SP-03',
                'level' => 'SP_3',
                'name' => 'Surat Peringatan Ketiga (SP III / Terakhir)',
                'duration_months' => 6,
                'validity_unit' => 'BULAN',
                'consequence_description' => 'Peringatan tahap akhir. Pelanggaran berikutnya berakibat Pemutusan Hubungan Kerja (PHK).',
                'description' => 'Peringatan keras terakhir sebelum pemutusan hubungan kerja.',
            ],
        ];

        foreach ($warningLetters as $wl) {
            WarningLetterDuration::firstOrCreate(
                ['code' => $wl['code']],
                $wl + ['status' => 'ACTIVE']
            );
        }

        // 6. Seed Termination Types
        $terminations = [
            [
                'code' => 'PHK-EFISIENSI',
                'name' => 'PHK Karena Efisiensi / Perampingan Organisasi',
                'legal_basis' => 'PP 35/2021 Pasal 43 ayat (1)',
                'pesangon_multiplier' => 1.00,
                'pmtk_multiplier' => 1.00,
                'entitled_to_uph' => true,
                'entitled_to_uang_pisah' => false,
                'description' => 'Perampingan organisasi bukan karena perusahaan merugi.',
            ],
            [
                'code' => 'PHK-MERUGI',
                'name' => 'PHK Karena Perusahaan Mengalami Kerugian / Tutup',
                'legal_basis' => 'PP 35/2021 Pasal 44 ayat (1)',
                'pesangon_multiplier' => 0.50,
                'pmtk_multiplier' => 1.00,
                'entitled_to_uph' => true,
                'entitled_to_uang_pisah' => false,
                'description' => 'Perusahaan tutup akibat merugi terus-menerus selama 2 tahun atau force majeure.',
            ],
            [
                'code' => 'PHK-SP3',
                'name' => 'PHK Karena Pelanggaran Perjanjian Kerja (SP III)',
                'legal_basis' => 'PP 35/2021 Pasal 52 ayat (1)',
                'pesangon_multiplier' => 0.50,
                'pmtk_multiplier' => 1.00,
                'entitled_to_uph' => true,
                'entitled_to_uang_pisah' => false,
                'description' => 'Pekerja melakukan pelanggaran setelah diberikan SP I, II, dan III.',
            ],
            [
                'code' => 'PHK-PELANGGARAN-BERAT',
                'name' => 'PHK Pelanggaran Sangat Berat / Mendesak',
                'legal_basis' => 'PP 35/2021 Pasal 52 ayat (2)',
                'pesangon_multiplier' => 0.00,
                'pmtk_multiplier' => 0.00,
                'entitled_to_uph' => true,
                'entitled_to_uang_pisah' => true,
                'description' => 'Pencurian, penipuan, penganiayaan, atau tindak pidana lainnya di lingkungan kerja.',
            ],
            [
                'code' => 'PHK-PENSIUN',
                'name' => 'PHK Memasuki Usia Pensiun Normal',
                'legal_basis' => 'PP 35/2021 Pasal 56',
                'pesangon_multiplier' => 1.75,
                'pmtk_multiplier' => 1.00,
                'entitled_to_uph' => true,
                'entitled_to_uang_pisah' => false,
                'description' => 'Pekerja telah mencapai usia pensiun sesuai peraturan perusahaan.',
            ],
            [
                'code' => 'PHK-MEDIS',
                'name' => 'PHK Karena Sakit Berkepanjangan / Cacat Medis Permanen',
                'legal_basis' => 'PP 35/2021 Pasal 55',
                'pesangon_multiplier' => 2.00,
                'pmtk_multiplier' => 1.00,
                'entitled_to_uph' => true,
                'entitled_to_uang_pisah' => false,
                'description' => 'Sakit lebih dari 12 bulan terus menerus atau cacat total akibat kecelakaan kerja.',
            ],
            [
                'code' => 'PHK-MENINGGAL',
                'name' => 'PHK Karena Karyawan Meninggal Dunia',
                'legal_basis' => 'PP 35/2021 Pasal 57',
                'pesangon_multiplier' => 2.00,
                'pmtk_multiplier' => 1.00,
                'entitled_to_uph' => true,
                'entitled_to_uang_pisah' => false,
                'description' => 'Kompensasi dibayarkan penuh kepada ahli waris pekerja yang sah.',
            ],
            [
                'code' => 'PHK-MANGKIR',
                'name' => 'PHK Karena Mangkir 5 Hari Kerja Berturut-turut',
                'legal_basis' => 'PP 35/2021 Pasal 52 ayat (1)',
                'pesangon_multiplier' => 0.00,
                'pmtk_multiplier' => 0.00,
                'entitled_to_uph' => true,
                'entitled_to_uang_pisah' => true,
                'description' => 'Mangkir tanpa keterangan sah dan telah dipanggil patut tertulis 2 kali.',
            ],
        ];

        foreach ($terminations as $tm) {
            TerminationType::firstOrCreate(
                ['code' => $tm['code']],
                $tm + ['status' => 'ACTIVE']
            );
        }

        // 7. Seed Resignation Types
        $resignations = [
            [
                'code' => 'RSG-NORMAL',
                'name' => 'Resign Standar (One Month Notice)',
                'notice_period_days' => 30,
                'requires_clearance' => true,
                'entitled_to_uang_pisah' => true,
                'entitled_to_sisa_cuti' => true,
                'description' => 'Pengunduran diri sukarela dengan pemberitahuan tertulis minimal 30 hari sebelumnya.',
            ],
            [
                'code' => 'RSG-EXPRESS',
                'name' => 'Resign Mendesak / Dipercepat',
                'notice_period_days' => 7,
                'requires_clearance' => true,
                'entitled_to_uang_pisah' => true,
                'entitled_to_sisa_cuti' => true,
                'description' => 'Pengunduran diri dengan kesepakatan percepatan serah terima tugas.',
            ],
            [
                'code' => 'RSG-HEALTH',
                'name' => 'Resign Karena Alasan Kesehatan Pribadi',
                'notice_period_days' => 14,
                'requires_clearance' => true,
                'entitled_to_uang_pisah' => true,
                'entitled_to_sisa_cuti' => true,
                'description' => 'Pengunduran diri atas anjuran medis atau keterbatasan fisik bertugas di site.',
            ],
            [
                'code' => 'RSG-STUDY',
                'name' => 'Resign Melanjutkan Pendidikan / Beasiswa',
                'notice_period_days' => 30,
                'requires_clearance' => true,
                'entitled_to_uang_pisah' => true,
                'entitled_to_sisa_cuti' => true,
                'description' => 'Pengunduran diri untuk melanjutkan studi sarjana / magister mandiri.',
            ],
            [
                'code' => 'RSG-FAMILY',
                'name' => 'Resign Karena Mengikuti Domisili Keluarga',
                'notice_period_days' => 30,
                'requires_clearance' => true,
                'entitled_to_uang_pisah' => true,
                'entitled_to_sisa_cuti' => true,
                'description' => 'Pindah domisili mengikuti penugasan pasangan atau mengurus orang tua.',
            ],
        ];

        foreach ($resignations as $rsg) {
            ResignationType::firstOrCreate(
                ['code' => $rsg['code']],
                $rsg + ['status' => 'ACTIVE']
            );
        }
    }
}

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
        Schema::create('salary_grades', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->foreignId('level_id')->nullable()->constrained('grades')->nullOnDelete();
            $table->decimal('min_salary', 15, 2)->default(0);
            $table->decimal('mid_salary', 15, 2)->default(0);
            $table->decimal('max_salary', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();
        });

        // Seed Initial Golongan / Grade Data mapped to Level Jabatan (1..8)
        $grades = DB::table('grades')->get()->keyBy('level');

        $initialSalaryGrades = [
            [
                'code' => 'GOL-1A',
                'name' => 'Golongan 1A - Operator Junior / Non-Staff',
                'level' => 1,
                'min_salary' => 5500000,
                'mid_salary' => 6750000,
                'max_salary' => 8000000,
                'description' => 'Golongan awal untuk posisi operator magang / entry level mining crew.',
            ],
            [
                'code' => 'GOL-1B',
                'name' => 'Golongan 1B - Operator Madya / Junior Staff',
                'level' => 1,
                'min_salary' => 6500000,
                'mid_salary' => 7750000,
                'max_salary' => 9000000,
                'description' => 'Golongan untuk operator bersertifikasi penuh dan staf administratif awal.',
            ],
            [
                'code' => 'GOL-2A',
                'name' => 'Golongan 2A - Senior Operator / Technician',
                'level' => 2,
                'min_salary' => 8000000,
                'mid_salary' => 9500000,
                'max_salary' => 11000000,
                'description' => 'Golongan untuk teknisi senior alat berat dan operator berpengalaman.',
            ],
            [
                'code' => 'GOL-2B',
                'name' => 'Golongan 2B - Senior Specialist / Lead Tech',
                'level' => 2,
                'min_salary' => 9500000,
                'mid_salary' => 11250000,
                'max_salary' => 13000000,
                'description' => 'Golongan untuk spesialis teknis tambang, surveyor, dan analis lab.',
            ],
            [
                'code' => 'GOL-3A',
                'name' => 'Golongan 3A - Junior Foreman / Engineer',
                'level' => 3,
                'min_salary' => 12000000,
                'mid_salary' => 14000000,
                'max_salary' => 16000000,
                'description' => 'Golongan pengawas lapangan pit / plant tingkat pratama.',
            ],
            [
                'code' => 'GOL-3B',
                'name' => 'Golongan 3B - Senior Foreman / Lead Engineer',
                'level' => 3,
                'min_salary' => 14000000,
                'mid_salary' => 16000000,
                'max_salary' => 18000000,
                'description' => 'Golongan mandor utama lapangan dan engineer perencana tambang.',
            ],
            [
                'code' => 'GOL-4A',
                'name' => 'Golongan 4A - Supervisor Pit / Plant / Office',
                'level' => 4,
                'min_salary' => 16000000,
                'mid_salary' => 20000000,
                'max_salary' => 24000000,
                'description' => 'Golongan supervisor operasional bertanggung jawab atas 1 regu / seksi.',
            ],
            [
                'code' => 'GOL-5A',
                'name' => 'Golongan 5A - Superintendent Lapangan / Staf',
                'level' => 5,
                'min_salary' => 22000000,
                'mid_salary' => 28500000,
                'max_salary' => 35000000,
                'description' => 'Golongan kepala bagian / pengawas utama area kerja pertambangan.',
            ],
            [
                'code' => 'GOL-6A',
                'name' => 'Golongan 6A - Manager Departemen',
                'level' => 6,
                'min_salary' => 32000000,
                'mid_salary' => 41000000,
                'max_salary' => 50000000,
                'description' => 'Golongan pimpinan departemen operasional / penunjang di site maupun head office.',
            ],
            [
                'code' => 'GOL-7A',
                'name' => 'Golongan 7A - General Manager',
                'level' => 7,
                'min_salary' => 48000000,
                'mid_salary' => 61500000,
                'max_salary' => 75000000,
                'description' => 'Golongan pimpinan operasional site tambang / KTT (Kepala Teknik Tambang).',
            ],
            [
                'code' => 'GOL-8A',
                'name' => 'Golongan 8A - Director / C-Level Executive',
                'level' => 8,
                'min_salary' => 70000000,
                'mid_salary' => 95000000,
                'max_salary' => 120000000,
                'description' => 'Golongan jajaran direksi dan manajemen eksekutif tertinggi perusahaan.',
            ],
        ];

        $now = now();
        foreach ($initialSalaryGrades as $row) {
            $levelId = isset($grades[$row['level']]) ? $grades[$row['level']]->id : null;
            DB::table('salary_grades')->insert([
                'code' => $row['code'],
                'name' => $row['name'],
                'level_id' => $levelId,
                'min_salary' => $row['min_salary'],
                'mid_salary' => $row['mid_salary'],
                'max_salary' => $row['max_salary'],
                'description' => $row['description'],
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_grades');
    }
};

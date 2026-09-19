<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_grade_jenjang', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salary_grade_id')->constrained('salary_grades')->cascadeOnDelete();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->string('name', 150);
            $table->unsignedTinyInteger('order_index')->default(1);
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->timestamps();

            $table->unique(['salary_grade_id', 'grade_id'], 'salary_grade_jenjang_unique');
        });

        // Seed initial examples for 4B if records exist
        $grade4B = DB::table('salary_grades')->where('code', '4B')->first();
        if ($grade4B) {
            $gl = DB::table('grades')->where('code', 'GL')->first();
            $sh = DB::table('grades')->where('code', 'SH')->first();
            $off = DB::table('grades')->where('code', 'OFF')->first();

            $now = now();
            $rows = [];
            if ($gl) {
                $rows[] = [
                    'salary_grade_id' => $grade4B->id,
                    'grade_id' => $gl->id,
                    'name' => 'Senior Group Leader',
                    'order_index' => 1,
                    'status' => 'ACTIVE',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if ($sh) {
                $rows[] = [
                    'salary_grade_id' => $grade4B->id,
                    'grade_id' => $sh->id,
                    'name' => 'Junior Supervisor',
                    'order_index' => 2,
                    'status' => 'ACTIVE',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if ($off) {
                $rows[] = [
                    'salary_grade_id' => $grade4B->id,
                    'grade_id' => $off->id,
                    'name' => 'Senior Officer',
                    'order_index' => 3,
                    'status' => 'ACTIVE',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($rows)) {
                DB::table('salary_grade_jenjang')->insert($rows);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_grade_jenjang');
    }
};

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
        // 1. Temporary rename existing codes to prevent unique constraint conflict
        $existing = DB::table('grades')->get();
        foreach ($existing as $g) {
            DB::table('grades')->where('id', $g->id)->update([
                'code' => 'TMP-' . $g->id . '-' . $g->code,
            ]);
        }

        // 2. Set Level 1 as the highest level (Director / C-Level) and descending
        $mapping = [
            'Director / C-Level' => [
                'code' => 'LVL-01',
                'level' => 1,
                'pangkat' => 'Staff',
                'field_duty_duration_days' => 10,
                'field_leave_duration_days' => 5,
                'field_allowance' => 12500000,
                'leave_lumpsum_allowance' => 7000000,
                'business_trip_allowance_daily' => 1000000,
            ],
            'General Manager' => [
                'code' => 'LVL-02',
                'level' => 2,
                'pangkat' => 'Staff',
                'field_duty_duration_days' => 14,
                'field_leave_duration_days' => 7,
                'field_allowance' => 10000000,
                'leave_lumpsum_allowance' => 5500000,
                'business_trip_allowance_daily' => 850000,
            ],
            'Manager' => [
                'code' => 'LVL-03',
                'level' => 3,
                'pangkat' => 'Staff',
                'field_duty_duration_days' => 14,
                'field_leave_duration_days' => 7,
                'field_allowance' => 8000000,
                'leave_lumpsum_allowance' => 4500000,
                'business_trip_allowance_daily' => 700000,
            ],
            'Superintendent' => [
                'code' => 'LVL-04',
                'level' => 4,
                'pangkat' => 'Staff',
                'field_duty_duration_days' => 28,
                'field_leave_duration_days' => 14,
                'field_allowance' => 6500000,
                'leave_lumpsum_allowance' => 3750000,
                'business_trip_allowance_daily' => 550000,
            ],
            'Supervisor' => [
                'code' => 'LVL-05',
                'level' => 5,
                'pangkat' => 'Staff',
                'field_duty_duration_days' => 28,
                'field_leave_duration_days' => 14,
                'field_allowance' => 5500000,
                'leave_lumpsum_allowance' => 3000000,
                'business_trip_allowance_daily' => 450000,
            ],
            'Foreman / Lead Engineer' => [
                'code' => 'LVL-06',
                'level' => 6,
                'pangkat' => 'Staff',
                'field_duty_duration_days' => 42,
                'field_leave_duration_days' => 14,
                'field_allowance' => 4500000,
                'leave_lumpsum_allowance' => 2500000,
                'business_trip_allowance_daily' => 375000,
            ],
            'Senior Operator / Specialist' => [
                'code' => 'LVL-07',
                'level' => 7,
                'pangkat' => 'Non Staff',
                'field_duty_duration_days' => 56,
                'field_leave_duration_days' => 14,
                'field_allowance' => 3750000,
                'leave_lumpsum_allowance' => 2000000,
                'business_trip_allowance_daily' => 300000,
            ],
            'Operator / Junior Staff' => [
                'code' => 'LVL-08',
                'level' => 8,
                'pangkat' => 'Non Staff',
                'field_duty_duration_days' => 70,
                'field_leave_duration_days' => 14,
                'field_allowance' => 3000000,
                'leave_lumpsum_allowance' => 1500000,
                'business_trip_allowance_daily' => 250000,
            ],
        ];

        foreach ($mapping as $name => $data) {
            DB::table('grades')->where('name', $name)->update($data);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to old numbering if rolled back
        $reverseMapping = [
            'Operator / Junior Staff' => ['code' => 'G01', 'level' => 1],
            'Senior Operator / Specialist' => ['code' => 'G02', 'level' => 2],
            'Foreman / Lead Engineer' => ['code' => 'G03', 'level' => 3],
            'Supervisor' => ['code' => 'G04', 'level' => 4],
            'Superintendent' => ['code' => 'G05', 'level' => 5],
            'Manager' => ['code' => 'G06', 'level' => 6],
            'General Manager' => ['code' => 'G07', 'level' => 7],
            'Director / C-Level' => ['code' => 'G08', 'level' => 8],
        ];

        foreach ($reverseMapping as $name => $data) {
            DB::table('grades')->where('name', $name)->update($data);
        }
    }
};

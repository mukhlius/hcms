<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AuditLog;
use App\Models\LevelWorkRoster;
use App\Models\PaidLeavePolicy;
use App\Models\PositionWorkTime;
use App\Models\PublicHoliday;
use App\Models\ResignationType;
use App\Models\TerminationType;
use App\Models\WarningLetterDuration;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrgReferenceExtensionController extends BaseApiController
{
    // ================= 1. ROSTER KERJA LEVEL JABATAN =================
    public function indexLevelRosters(Request $request): JsonResponse
    {
        $query = LevelWorkRoster::with(['grade:id,code,name,level', 'workSchedule:id,code,name']);

        if ($request->filled('level')) {
            $query->where('level', $request->query('level'));
        }
        if ($request->filled('poh_type')) {
            $query->where('poh_type', $request->query('poh_type'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('roster_name', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 20), 500);
        $data = $query->orderBy('level')->paginate($perPage);

        return $this->successResponse($data, 'Data roster kerja level jabatan berhasil diambil.');
    }

    public function storeLevelRoster(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'level' => ['nullable', 'integer', 'min:1', 'max:10'],
            'grade_id' => ['nullable', 'exists:grades,id'],
            'work_schedule_id' => ['nullable', 'exists:work_schedules,id'],
            'roster_name' => ['required', 'string', 'max:255'],
            'days_on' => ['required', 'integer', 'min:1'],
            'days_off' => ['required', 'integer', 'min:1'],
            'poh_type' => ['nullable', 'string', 'in:ALL,LOKAL,NON_LOKAL'],
            'travel_days' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (!empty($validated['grade_id'])) {
            $grade = Grade::find($validated['grade_id']);
            if ($grade) {
                $validated['level'] = $grade->level;
            }
        } elseif (!empty($validated['level'])) {
            $grade = Grade::where('level', $validated['level'])->first();
            if ($grade) {
                $validated['grade_id'] = $grade->id;
            }
        } else {
            $validated['level'] = 1;
        }

        $item = LevelWorkRoster::create($validated);
        AuditService::log('CREATE', 'LEVEL_WORK_ROSTER', LevelWorkRoster::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item->load(['grade', 'workSchedule']), 'Roster kerja level berhasil ditambahkan.');
    }

    public function updateLevelRoster(Request $request, LevelWorkRoster $roster): JsonResponse
    {
        $validated = $request->validate([
            'level' => ['nullable', 'integer', 'min:1', 'max:10'],
            'grade_id' => ['nullable', 'exists:grades,id'],
            'work_schedule_id' => ['nullable', 'exists:work_schedules,id'],
            'roster_name' => ['sometimes', 'required', 'string', 'max:255'],
            'days_on' => ['sometimes', 'required', 'integer', 'min:1'],
            'days_off' => ['sometimes', 'required', 'integer', 'min:1'],
            'poh_type' => ['nullable', 'string', 'in:ALL,LOKAL,NON_LOKAL'],
            'travel_days' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (!empty($validated['grade_id'])) {
            $grade = Grade::find($validated['grade_id']);
            if ($grade) {
                $validated['level'] = $grade->level;
            }
        } elseif (!empty($validated['level']) && empty($validated['grade_id'])) {
            $grade = Grade::where('level', $validated['level'])->first();
            if ($grade) {
                $validated['grade_id'] = $grade->id;
            }
        }

        $old = $roster->toArray();
        $roster->update($validated);
        AuditService::log('UPDATE', 'LEVEL_WORK_ROSTER', LevelWorkRoster::class, (string)$roster->id, oldValues: $old, newValues: $roster->toArray());

        return $this->successResponse($roster->load(['grade', 'workSchedule']), 'Roster kerja level berhasil diperbarui.');
    }

    public function destroyLevelRoster(LevelWorkRoster $roster): JsonResponse
    {
        $old = $roster->toArray();
        $roster->delete();
        AuditService::log('DELETE', 'LEVEL_WORK_ROSTER', LevelWorkRoster::class, (string)$roster->id, oldValues: $old);

        return $this->successResponse(null, 'Roster kerja level berhasil dihapus.');
    }

    // ================= 2. WAKTU KERJA BERDASARKAN POSITION =================
    public function indexPositionWorkTimes(Request $request): JsonResponse
    {
        $query = PositionWorkTime::with([
            'position.department:id,code,name',
            'position.section:id,code,name',
            'position.grade:id,code,name,level',
            'shift:id,code,name,start_time,end_time',
            'workSchedule:id,code,name',
        ]);

        if ($request->filled('work_type')) {
            $query->where('work_type', $request->query('work_type'));
        }
        if ($request->filled('position_id')) {
            $query->where('position_id', $request->query('position_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->whereHas('position', function ($pq) use ($s) {
                $pq->where('code', 'like', "%{$s}%")
                    ->orWhere('title', 'like', "%{$s}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 20), 500);
        $data = $query->latest()->paginate($perPage);

        return $this->successResponse($data, 'Data waktu kerja berdasarkan posisi berhasil diambil.');
    }

    public function storePositionWorkTime(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'position_id' => ['required', 'exists:positions,id'],
            'shift_id' => ['nullable', 'exists:shifts,id'],
            'shift_type' => ['nullable', 'string', 'in:DAY,NIGHT,CUSTOM'],
            'work_schedule_id' => ['nullable', 'exists:work_schedules,id'],
            'work_type' => ['nullable', 'string', 'in:SHIFT,NON_SHIFT,FLEXIBLE'],
            'start_time' => ['nullable', 'date_format:H:i,H:i:s'],
            'end_time' => ['nullable', 'date_format:H:i,H:i:s'],
            'late_tolerance_minutes' => ['nullable', 'integer', 'min:0'],
            'early_out_tolerance_minutes' => ['nullable', 'integer', 'min:0'],
            'daily_hours' => ['nullable', 'numeric', 'min:1', 'max:24'],
            'weekly_days' => ['nullable', 'integer', 'min:1', 'max:7'],
            'break_minutes' => ['nullable', 'integer', 'min:0'],
            'is_overtime_eligible' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $validated['work_type'] = $validated['work_type'] ?? 'SHIFT';
        $validated['daily_hours'] = $validated['daily_hours'] ?? 8.00;
        $validated['weekly_days'] = $validated['weekly_days'] ?? 5;
        $validated['break_minutes'] = $validated['break_minutes'] ?? 60;

        $item = PositionWorkTime::create($validated);
        AuditService::log('CREATE', 'POSITION_WORK_TIME', PositionWorkTime::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item->load(['position.department', 'shift']), 'Waktu kerja posisi berhasil ditambahkan.');
    }

    public function updatePositionWorkTime(Request $request, PositionWorkTime $workTime): JsonResponse
    {
        $validated = $request->validate([
            'position_id' => ['sometimes', 'required', 'exists:positions,id'],
            'shift_id' => ['nullable', 'exists:shifts,id'],
            'shift_type' => ['nullable', 'string', 'in:DAY,NIGHT,CUSTOM'],
            'work_schedule_id' => ['nullable', 'exists:work_schedules,id'],
            'work_type' => ['nullable', 'string', 'in:SHIFT,NON_SHIFT,FLEXIBLE'],
            'start_time' => ['nullable', 'date_format:H:i,H:i:s'],
            'end_time' => ['nullable', 'date_format:H:i:s,H:i'],
            'late_tolerance_minutes' => ['nullable', 'integer', 'min:0'],
            'early_out_tolerance_minutes' => ['nullable', 'integer', 'min:0'],
            'daily_hours' => ['nullable', 'numeric', 'min:1', 'max:24'],
            'weekly_days' => ['nullable', 'integer', 'min:1', 'max:7'],
            'break_minutes' => ['nullable', 'integer', 'min:0'],
            'is_overtime_eligible' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $workTime->toArray();
        $workTime->update($validated);
        AuditService::log('UPDATE', 'POSITION_WORK_TIME', PositionWorkTime::class, (string)$workTime->id, oldValues: $old, newValues: $workTime->toArray());

        return $this->successResponse($workTime->load(['position.department', 'shift']), 'Waktu kerja posisi berhasil diperbarui.');
    }

    public function destroyPositionWorkTime(PositionWorkTime $workTime): JsonResponse
    {
        $old = $workTime->toArray();
        $workTime->delete();
        AuditService::log('DELETE', 'POSITION_WORK_TIME', PositionWorkTime::class, (string)$workTime->id, oldValues: $old);

        return $this->successResponse(null, 'Waktu kerja posisi berhasil dihapus.');
    }

    // ================= 3. KALENDER TANGGAL MERAH =================
    public function indexPublicHolidays(Request $request): JsonResponse
    {
        $query = PublicHoliday::query();

        if ($request->filled('year')) {
            $query->where('year', $request->query('year'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 30), 500);
        $data = $query->orderBy('holiday_date')->paginate($perPage);

        return $this->successResponse($data, 'Data kalender tanggal merah berhasil diambil.');
    }

    public function storePublicHoliday(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'holiday_date' => ['required', 'date'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:HARI_LIBUR_NASIONAL,CUTI_BERSAMA,LIBUR_KHUSUS_SITE'],
            'year' => ['nullable', 'integer'],
            'is_recurring' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (empty($validated['year'])) {
            $validated['year'] = (int)date('Y', strtotime($validated['holiday_date']));
        }

        $item = PublicHoliday::create($validated);
        AuditService::log('CREATE', 'PUBLIC_HOLIDAY', PublicHoliday::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Hari libur berhasil ditambahkan ke kalender.');
    }

    public function updatePublicHoliday(Request $request, PublicHoliday $holiday): JsonResponse
    {
        $validated = $request->validate([
            'holiday_date' => ['sometimes', 'required', 'date'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'in:HARI_LIBUR_NASIONAL,CUTI_BERSAMA,LIBUR_KHUSUS_SITE'],
            'year' => ['nullable', 'integer'],
            'is_recurring' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        if (isset($validated['holiday_date']) && empty($validated['year'])) {
            $validated['year'] = (int)date('Y', strtotime($validated['holiday_date']));
        }

        $old = $holiday->toArray();
        $holiday->update($validated);
        AuditService::log('UPDATE', 'PUBLIC_HOLIDAY', PublicHoliday::class, (string)$holiday->id, oldValues: $old, newValues: $holiday->toArray());

        return $this->successResponse($holiday, 'Hari libur berhasil diperbarui.');
    }

    public function destroyPublicHoliday(PublicHoliday $holiday): JsonResponse
    {
        $old = $holiday->toArray();
        $holiday->delete();
        AuditService::log('DELETE', 'PUBLIC_HOLIDAY', PublicHoliday::class, (string)$holiday->id, oldValues: $old);

        return $this->successResponse(null, 'Hari libur berhasil dihapus.');
    }

    // ================= 4. DURASI PAID LEAVE =================
    public function indexPaidLeavePolicies(Request $request): JsonResponse
    {
        $query = PaidLeavePolicy::query();

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                    ->orWhere('name', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 20), 500);
        $data = $query->orderBy('name')->paginate($perPage);

        return $this->successResponse($data, 'Data kebijakan durasi cuti berbayar berhasil diambil.');
    }

    public function storePaidLeavePolicy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:paid_leave_policies,code'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:ANNUAL,MATERNITY,FAMILY_EVENT,RELIGIOUS,MEDICAL,OTHER'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'duration_unit' => ['required', 'string', 'in:HARI_KERJA,HARI_KALENDER,BULAN'],
            'requires_document' => ['nullable', 'boolean'],
            'required_document_name' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = PaidLeavePolicy::create($validated);
        AuditService::log('CREATE', 'PAID_LEAVE_POLICY', PaidLeavePolicy::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Kebijakan cuti berbayar berhasil dibuat.');
    }

    public function updatePaidLeavePolicy(Request $request, PaidLeavePolicy $policy): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', "unique:paid_leave_policies,code,{$policy->id}"],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'required', 'string', 'in:ANNUAL,MATERNITY,FAMILY_EVENT,RELIGIOUS,MEDICAL,OTHER'],
            'duration_days' => ['sometimes', 'required', 'integer', 'min:1'],
            'duration_unit' => ['sometimes', 'required', 'string', 'in:HARI_KERJA,HARI_KALENDER,BULAN'],
            'requires_document' => ['nullable', 'boolean'],
            'required_document_name' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $policy->toArray();
        $policy->update($validated);
        AuditService::log('UPDATE', 'PAID_LEAVE_POLICY', PaidLeavePolicy::class, (string)$policy->id, oldValues: $old, newValues: $policy->toArray());

        return $this->successResponse($policy, 'Kebijakan cuti berbayar berhasil diperbarui.');
    }

    public function destroyPaidLeavePolicy(PaidLeavePolicy $policy): JsonResponse
    {
        $old = $policy->toArray();
        $policy->delete();
        AuditService::log('DELETE', 'PAID_LEAVE_POLICY', PaidLeavePolicy::class, (string)$policy->id, oldValues: $old);

        return $this->successResponse(null, 'Kebijakan cuti berbayar berhasil dihapus.');
    }

    // ================= 5. DURASI SP =================
    public function indexWarningLetterDurations(Request $request): JsonResponse
    {
        $query = WarningLetterDuration::query();

        if ($request->filled('level')) {
            $query->where('level', $request->query('level'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                    ->orWhere('name', 'like', "%{$s}%")
                    ->orWhere('consequence_description', 'like', "%{$s}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 20), 500);
        $data = $query->orderBy('level')->paginate($perPage);

        return $this->successResponse($data, 'Data durasi dan masa berlaku SP berhasil diambil.');
    }

    public function storeWarningLetterDuration(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:warning_letter_durations,code'],
            'level' => ['required', 'string', 'in:TEGURAN,SP_1,SP_2,SP_3'],
            'name' => ['required', 'string', 'max:255'],
            'duration_months' => ['required', 'integer', 'min:1'],
            'validity_unit' => ['nullable', 'string'],
            'consequence_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = WarningLetterDuration::create($validated);
        AuditService::log('CREATE', 'WARNING_LETTER_DURATION', WarningLetterDuration::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Durasi Surat Peringatan (SP) berhasil dibuat.');
    }

    public function updateWarningLetterDuration(Request $request, WarningLetterDuration $sp): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', "unique:warning_letter_durations,code,{$sp->id}"],
            'level' => ['sometimes', 'required', 'string', 'in:TEGURAN,SP_1,SP_2,SP_3'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'duration_months' => ['sometimes', 'required', 'integer', 'min:1'],
            'validity_unit' => ['nullable', 'string'],
            'consequence_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $sp->toArray();
        $sp->update($validated);
        AuditService::log('UPDATE', 'WARNING_LETTER_DURATION', WarningLetterDuration::class, (string)$sp->id, oldValues: $old, newValues: $sp->toArray());

        return $this->successResponse($sp, 'Durasi Surat Peringatan (SP) berhasil diperbarui.');
    }

    public function destroyWarningLetterDuration(WarningLetterDuration $sp): JsonResponse
    {
        $old = $sp->toArray();
        $sp->delete();
        AuditService::log('DELETE', 'WARNING_LETTER_DURATION', WarningLetterDuration::class, (string)$sp->id, oldValues: $old);

        return $this->successResponse(null, 'Durasi Surat Peringatan (SP) berhasil dihapus.');
    }

    // ================= 6. JENIS PHK =================
    public function indexTerminationTypes(Request $request): JsonResponse
    {
        $query = TerminationType::query();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                    ->orWhere('name', 'like', "%{$s}%")
                    ->orWhere('legal_basis', 'like', "%{$s}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 20), 500);
        $data = $query->orderBy('name')->paginate($perPage);

        return $this->successResponse($data, 'Data master jenis PHK berhasil diambil.');
    }

    public function storeTerminationType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:termination_types,code'],
            'name' => ['required', 'string', 'max:255'],
            'legal_basis' => ['nullable', 'string', 'max:255'],
            'pesangon_multiplier' => ['required', 'numeric', 'min:0'],
            'pmtk_multiplier' => ['required', 'numeric', 'min:0'],
            'entitled_to_uph' => ['nullable', 'boolean'],
            'entitled_to_uang_pisah' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = TerminationType::create($validated);
        AuditService::log('CREATE', 'TERMINATION_TYPE', TerminationType::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Jenis PHK berhasil dibuat.');
    }

    public function updateTerminationType(Request $request, TerminationType $type): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', "unique:termination_types,code,{$type->id}"],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'legal_basis' => ['nullable', 'string', 'max:255'],
            'pesangon_multiplier' => ['sometimes', 'required', 'numeric', 'min:0'],
            'pmtk_multiplier' => ['sometimes', 'required', 'numeric', 'min:0'],
            'entitled_to_uph' => ['nullable', 'boolean'],
            'entitled_to_uang_pisah' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $type->toArray();
        $type->update($validated);
        AuditService::log('UPDATE', 'TERMINATION_TYPE', TerminationType::class, (string)$type->id, oldValues: $old, newValues: $type->toArray());

        return $this->successResponse($type, 'Jenis PHK berhasil diperbarui.');
    }

    public function destroyTerminationType(TerminationType $type): JsonResponse
    {
        $old = $type->toArray();
        $type->delete();
        AuditService::log('DELETE', 'TERMINATION_TYPE', TerminationType::class, (string)$type->id, oldValues: $old);

        return $this->successResponse(null, 'Jenis PHK berhasil dihapus.');
    }

    // ================= 7. JENIS RESIGN =================
    public function indexResignationTypes(Request $request): JsonResponse
    {
        $query = ResignationType::query();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                    ->orWhere('name', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 20), 500);
        $data = $query->orderBy('name')->paginate($perPage);

        return $this->successResponse($data, 'Data master jenis resign berhasil diambil.');
    }

    public function storeResignationType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:resignation_types,code'],
            'name' => ['required', 'string', 'max:255'],
            'notice_period_days' => ['required', 'integer', 'min:0'],
            'requires_clearance' => ['nullable', 'boolean'],
            'entitled_to_uang_pisah' => ['nullable', 'boolean'],
            'entitled_to_sisa_cuti' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = ResignationType::create($validated);
        AuditService::log('CREATE', 'RESIGNATION_TYPE', ResignationType::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Jenis resign berhasil dibuat.');
    }

    public function updateResignationType(Request $request, ResignationType $type): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', "unique:resignation_types,code,{$type->id}"],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'notice_period_days' => ['sometimes', 'required', 'integer', 'min:0'],
            'requires_clearance' => ['nullable', 'boolean'],
            'entitled_to_uang_pisah' => ['nullable', 'boolean'],
            'entitled_to_sisa_cuti' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $type->toArray();
        $type->update($validated);
        AuditService::log('UPDATE', 'RESIGNATION_TYPE', ResignationType::class, (string)$type->id, oldValues: $old, newValues: $type->toArray());

        return $this->successResponse($type, 'Jenis resign berhasil diperbarui.');
    }

    public function destroyResignationType(ResignationType $type): JsonResponse
    {
        $old = $type->toArray();
        $type->delete();
        AuditService::log('DELETE', 'RESIGNATION_TYPE', ResignationType::class, (string)$type->id, oldValues: $old);

        return $this->successResponse(null, 'Jenis resign berhasil dihapus.');
    }
}

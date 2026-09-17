<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Holiday;
use App\Models\HolidayCalendar;
use App\Models\Shift;
use App\Models\WorkCalendar;
use App\Models\WorkSchedule;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleMasterController extends BaseApiController
{
    // ================= SHIFTS =================
    public function shifts(Request $request): JsonResponse
    {
        $shifts = Shift::orderBy('name')->get();
        return $this->successResponse($shifts, 'Data shift kerja berhasil diambil.');
    }

    public function storeShift(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:shifts,code'],
            'name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'end_time' => ['required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'break_start' => ['nullable', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'break_end' => ['nullable', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'cross_day' => ['nullable', 'boolean'],
            'grace_period_minutes' => ['nullable', 'integer', 'min:0'],
            'working_hours' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = Shift::create($validated);
        AuditService::log('CREATE', 'SHIFT', Shift::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Shift kerja berhasil dibuat.');
    }

    public function updateShift(Request $request, Shift $shift): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', 'unique:shifts,code,' . $shift->id],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'start_time' => ['sometimes', 'required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'end_time' => ['sometimes', 'required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'break_start' => ['nullable', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'break_end' => ['nullable', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'cross_day' => ['nullable', 'boolean'],
            'grace_period_minutes' => ['nullable', 'integer', 'min:0'],
            'working_hours' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $shift->toArray();
        $shift->update($validated);
        AuditService::log('UPDATE', 'SHIFT', Shift::class, (string)$shift->id, oldValues: $old, newValues: $shift->fresh()->toArray());

        return $this->successResponse($shift, 'Shift kerja berhasil diperbarui.');
    }

    public function destroyShift(Shift $shift): JsonResponse
    {
        $old = $shift->toArray();
        $shift->delete();

        AuditService::log('DELETE', 'SHIFT', Shift::class, (string)$shift->id, oldValues: $old);

        return $this->successResponse(null, 'Shift kerja berhasil dihapus.');
    }

    // ================= WORK SCHEDULES (ROSTERS) =================
    public function workSchedules(Request $request): JsonResponse
    {
        $schedules = WorkSchedule::orderBy('name')->get();
        return $this->successResponse($schedules, 'Data jadwal & pola kerja (roster) berhasil diambil.');
    }

    public function storeWorkSchedule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:work_schedules,code'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string'],
            'cycle_days' => ['required', 'integer', 'min:1'],
            'days_on' => ['required', 'integer', 'min:1'],
            'days_off' => ['required', 'integer', 'min:0'],
            'pattern_details' => ['nullable', 'array'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = WorkSchedule::create($validated);
        AuditService::log('CREATE', 'WORK_SCHEDULE', WorkSchedule::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Pola jadwal kerja berhasil dibuat.');
    }

    public function updateWorkSchedule(Request $request, WorkSchedule $workSchedule): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', 'unique:work_schedules,code,' . $workSchedule->id],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string'],
            'cycle_days' => ['sometimes', 'required', 'integer', 'min:1'],
            'days_on' => ['sometimes', 'required', 'integer', 'min:1'],
            'days_off' => ['sometimes', 'required', 'integer', 'min:0'],
            'pattern_details' => ['nullable', 'array'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $workSchedule->toArray();
        $workSchedule->update($validated);
        AuditService::log('UPDATE', 'WORK_SCHEDULE', WorkSchedule::class, (string)$workSchedule->id, oldValues: $old, newValues: $workSchedule->fresh()->toArray());

        return $this->successResponse($workSchedule, 'Pola jadwal kerja berhasil diperbarui.');
    }

    public function destroyWorkSchedule(WorkSchedule $workSchedule): JsonResponse
    {
        $old = $workSchedule->toArray();
        $workSchedule->delete();

        AuditService::log('DELETE', 'WORK_SCHEDULE', WorkSchedule::class, (string)$workSchedule->id, oldValues: $old);

        return $this->successResponse(null, 'Pola jadwal kerja berhasil dihapus.');
    }

    // ================= HOLIDAY CALENDARS =================
    public function holidayCalendars(Request $request): JsonResponse
    {
        $year = $request->query('year', date('Y'));
        $calendars = HolidayCalendar::with('holidays')->where('year', $year)->get();
        return $this->successResponse($calendars, 'Data kalender libur berhasil diambil.');
    }

    public function storeHolidayCalendar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:holiday_calendars,code'],
            'name' => ['required', 'string', 'max:255'],
            'year' => ['required', 'integer', 'min:2020', 'max:2099'],
            'scope' => ['required', 'string', 'in:GLOBAL,COMPANY,SITE,DEPARTMENT'],
            'company_id' => ['nullable', 'exists:organization_companies,id'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
        ]);

        $item = HolidayCalendar::create($validated);
        AuditService::log('CREATE', 'HOLIDAY_CALENDAR', HolidayCalendar::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Kalender libur berhasil dibuat.');
    }

    public function storeHoliday(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'holiday_calendar_id' => ['required', 'exists:holiday_calendars,id'],
            'name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'type' => ['required', 'string', 'in:NATIONAL,COMPANY,SITE,SPECIAL'],
            'is_recurring' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $item = Holiday::create($validated);
        AuditService::log('CREATE', 'HOLIDAY', Holiday::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Hari libur berhasil ditambahkan.');
    }

    // ================= WORK CALENDARS =================
    public function workCalendars(Request $request): JsonResponse
    {
        $calendars = WorkCalendar::with([
            'company:id,code,name',
            'site:id,code,name',
            'employeeGroup:id,code,name',
            'workSchedule:id,code,name',
            'shift:id,code,name,start_time,end_time',
            'holidayCalendar:id,code,name',
        ])->get();

        return $this->successResponse($calendars, 'Data kalender kerja berhasil diambil.');
    }

    public function storeWorkCalendar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['nullable', 'exists:organization_companies,id'],
            'site_id' => ['nullable', 'exists:organization_sites,id'],
            'employee_group_id' => ['nullable', 'exists:employee_groups,id'],
            'work_schedule_id' => ['nullable', 'exists:work_schedules,id'],
            'shift_id' => ['nullable', 'exists:shifts,id'],
            'holiday_calendar_id' => ['nullable', 'exists:holiday_calendars,id'],
            'code' => ['required', 'string', 'max:50', 'unique:work_calendars,code'],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:ACTIVE,INACTIVE'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $item = WorkCalendar::create($validated);
        AuditService::log('CREATE', 'WORK_CALENDAR', WorkCalendar::class, (string)$item->id, newValues: $item->toArray());

        return $this->createdResponse($item, 'Kalender kerja berhasil dibuat.');
    }
}

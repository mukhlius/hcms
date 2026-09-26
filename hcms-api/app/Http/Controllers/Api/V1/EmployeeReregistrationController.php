<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Employee;
use App\Models\EmployeeReregistration;
use App\Services\EmployeeService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class EmployeeReregistrationController extends BaseApiController
{
    protected EmployeeService $employeeService;

    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    /**
     * Resolve employee record for current authenticated user
     */
    private function resolveCurrentEmployee(Request $request): ?Employee
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            $employee = Employee::where('nrp', $user->username)
                ->orWhere('email_company', $user->email)
                ->orWhere('email_personal', $user->email)
                ->first();
        }

        // Fallback untuk Super Admin / Dev
        if (!$employee && $user->roles()->where('name', 'SUPER_ADMIN')->exists()) {
            $employee = Employee::first();
        }

        if ($employee && !$employee->user_id && $employee->nrp === $user->username) {
            $employee->update(['user_id' => $user->id]);
        }

        return $employee;
    }

    /**
     * ESS: Ambil data awal profil karyawan & status pengajuan aktif saat ini
     */
    public function myCurrent(Request $request): JsonResponse
    {
        $employee = $this->resolveCurrentEmployee($request);
        if (!$employee) {
            return $this->errorResponse('Data profil karyawan tidak ditemukan untuk akun ini.', 'NOT_FOUND', null, 404);
        }

        $detail = $this->employeeService->getEmployeeDetail($employee->id);

        // Ambil tiket pengajuan terakhir yang masih PENDING
        $pendingTicket = EmployeeReregistration::with(['reviewer:id,name,username'])
            ->where('employee_id', $employee->id)
            ->where('status', EmployeeReregistration::STATUS_PENDING)
            ->latest()
            ->first();

        // Ambil pengajuan terakhir apapun statusnya
        $latestTicket = EmployeeReregistration::with(['reviewer:id,name,username'])
            ->where('employee_id', $employee->id)
            ->latest()
            ->first();

        $stats = [
            'total' => EmployeeReregistration::where('employee_id', $employee->id)->count(),
            'pending' => EmployeeReregistration::where('employee_id', $employee->id)->where('status', EmployeeReregistration::STATUS_PENDING)->count(),
            'approved' => EmployeeReregistration::where('employee_id', $employee->id)->where('status', EmployeeReregistration::STATUS_APPROVED)->count(),
            'rejected' => EmployeeReregistration::where('employee_id', $employee->id)->where('status', EmployeeReregistration::STATUS_REJECTED)->count(),
        ];

        return $this->successResponse([
            'employee' => $detail,
            'pending_ticket' => $pendingTicket,
            'latest_ticket' => $latestTicket,
            'stats' => $stats,
        ], 'Data registrasi ulang mandiri berhasil dimuat');
    }

    /**
     * ESS: Ambil riwayat pengajuan registrasi ulang karyawan yang login
     */
    public function myHistory(Request $request): JsonResponse
    {
        $employee = $this->resolveCurrentEmployee($request);
        if (!$employee) {
            return $this->errorResponse('Data profil karyawan tidak ditemukan.', 'NOT_FOUND', null, 404);
        }

        $history = EmployeeReregistration::with(['reviewer:id,name,username'])
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 10));

        return $this->successResponse($history, 'Riwayat registrasi ulang mandiri berhasil dimuat');
    }

    /**
     * ESS: Ajukan registrasi ulang / pembaruan data mandiri
     */
    public function submit(Request $request): JsonResponse
    {
        $employee = $this->resolveCurrentEmployee($request);
        if (!$employee) {
            return $this->errorResponse('Data profil karyawan tidak ditemukan.', 'NOT_FOUND', null, 404);
        }

        // Cek apakah ada pengajuan PENDING yang belum diproses
        $existingPending = EmployeeReregistration::where('employee_id', $employee->id)
            ->where('status', EmployeeReregistration::STATUS_PENDING)
            ->first();

        if ($existingPending) {
            return $this->errorResponse(
                'Anda masih memiliki pengajuan registrasi ulang (' . $existingPending->ticket_number . ') yang berstatus Menunggu Persetujuan. Harap batalkan pengajuan sebelumnya jika ingin mengajukan kembali.',
                'PENDING_EXISTS',
                ['ticket_number' => $existingPending->ticket_number],
                422
            );
        }

        $validator = Validator::make($request->all(), [
            'submission_notes' => 'nullable|string|max:1000',
            'proposed_data' => 'required|array',
            'proposed_data.nickname' => 'nullable|string|max:50',
            'proposed_data.birth_place' => 'nullable|string|max:100',
            'proposed_data.birth_date' => 'nullable|date',
            'proposed_data.gender' => 'nullable|in:MALE,FEMALE',
            'proposed_data.religion' => 'nullable|string|max:30',
            'proposed_data.marital_status' => 'nullable|string|max:30',
            'proposed_data.marriage_date' => 'nullable|date',
            'proposed_data.id_card_number' => 'nullable|string|max:30',
            'proposed_data.tax_number' => 'nullable|string|max:30',
            'proposed_data.tax_status' => 'nullable|string|max:20',
            'proposed_data.bpjs_ketenagakerjaan' => 'nullable|string|max:40',
            'proposed_data.bpjs_kesehatan' => 'nullable|string|max:40',
            'proposed_data.insurance_admedika' => 'nullable|string|max:50',
            'proposed_data.email_personal' => 'nullable|email|max:100',
            'proposed_data.phone_mobile' => 'nullable|string|max:30',
            'proposed_data.phone_home' => 'nullable|string|max:30',
            'proposed_data.ktp_address' => 'nullable|string',
            'proposed_data.ktp_city' => 'nullable|string|max:100',
            'proposed_data.ktp_district' => 'nullable|string|max:100',
            'proposed_data.ktp_village' => 'nullable|string|max:100',
            'proposed_data.ktp_province' => 'nullable|string|max:100',
            'proposed_data.ktp_postal_code' => 'nullable|string|max:20',
            'proposed_data.residential_address' => 'nullable|string',
            'proposed_data.residential_city' => 'nullable|string|max:100',
            'proposed_data.residential_district' => 'nullable|string|max:100',
            'proposed_data.residential_village' => 'nullable|string|max:100',
            'proposed_data.residential_province' => 'nullable|string|max:100',
            'proposed_data.residential_postal_code' => 'nullable|string|max:20',
            'proposed_data.mailing_address' => 'nullable|string',
            'proposed_data.mailing_city' => 'nullable|string|max:100',
            'proposed_data.mailing_district' => 'nullable|string|max:100',
            'proposed_data.mailing_village' => 'nullable|string|max:100',
            'proposed_data.mailing_province' => 'nullable|string|max:100',
            'proposed_data.mailing_postal_code' => 'nullable|string|max:20',
            'proposed_data.families' => 'nullable|array',
            'proposed_data.educations' => 'nullable|array',
            'proposed_data.emergency_contacts' => 'nullable|array',
            'proposed_data.health_safety' => 'nullable|array',
            'proposed_data.bank_accounts' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validasi data registrasi ulang gagal.', 'VALIDATION_ERROR', $validator->errors(), 422);
        }

        // Ambil data asli terkini sebagai perbandingan snapshot baku
        $originalSnapshot = $this->employeeService->getEmployeeDetail($employee->id);

        // Filter proposed data agar tidak dapat memanipulasi data struktural / kepegawaian
        $disallowedFields = [
            'id', 'nrp', 'name', 'company_id', 'site_id', 'department_id', 'section_id',
            'position_id', 'grade_id', 'salary_grade_jenjang_id', 'employment_type_id',
            'poh', 'hire_date', 'probation_end_date', 'contract_end_date', 'employment_status',
            'user_id', 'created_at', 'updated_at', 'deleted_at'
        ];

        $cleanedProposed = $request->input('proposed_data');
        foreach ($disallowedFields as $field) {
            unset($cleanedProposed[$field]);
        }

        // Generate Ticket Number: REG-YYYYMMDD-XXXX
        $todayDate = Carbon::now()->format('Ymd');
        $randomSuffix = strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 5));
        $ticketNumber = "REG-{$todayDate}-{$randomSuffix}";

        $reregistration = EmployeeReregistration::create([
            'ticket_number' => $ticketNumber,
            'employee_id' => $employee->id,
            'submitted_by_user_id' => $request->user()->id,
            'status' => EmployeeReregistration::STATUS_PENDING,
            'submission_notes' => $request->input('submission_notes'),
            'original_data' => $originalSnapshot,
            'proposed_data' => $cleanedProposed,
        ]);

        return $this->createdResponse(
            $reregistration->load(['employee:id,nrp,name', 'submitter:id,name,username']),
            "Pengajuan registrasi ulang berhasil dikirim dengan Nomor Tiket {$ticketNumber}. Menunggu persetujuan HC / Verifikator."
        );
    }

    /**
     * ESS: Batalkan pengajuan registrasi ulang yang masih PENDING
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $employee = $this->resolveCurrentEmployee($request);
        if (!$employee) {
            return $this->errorResponse('Data profil karyawan tidak ditemukan.', 'NOT_FOUND', null, 404);
        }

        $reregistration = EmployeeReregistration::where('id', $id)
            ->where('employee_id', $employee->id)
            ->first();

        if (!$reregistration) {
            return $this->errorResponse('Tiket pengajuan registrasi ulang tidak ditemukan.', 'NOT_FOUND', null, 404);
        }

        if ($reregistration->status !== EmployeeReregistration::STATUS_PENDING) {
            return $this->errorResponse(
                "Pengajuan dengan status {$reregistration->status} tidak dapat dibatalkan.",
                'INVALID_STATUS',
                null,
                422
            );
        }

        $reregistration->delete();

        return $this->successResponse(null, "Pengajuan registrasi ulang ({$reregistration->ticket_number}) berhasil dibatalkan.");
    }

    // =========================================================================
    // ADMIN / HC APPROVAL & VERIFICATION ENDPOINTS
    // =========================================================================

    /**
     * Admin: Ringkasan statistik pengajuan
     */
    public function stats(Request $request): JsonResponse
    {
        $total = EmployeeReregistration::count();
        $pending = EmployeeReregistration::where('status', EmployeeReregistration::STATUS_PENDING)->count();
        $approved = EmployeeReregistration::where('status', EmployeeReregistration::STATUS_APPROVED)->count();
        $rejected = EmployeeReregistration::where('status', EmployeeReregistration::STATUS_REJECTED)->count();

        return $this->successResponse([
            'total' => $total,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
        ], 'Statistik pengajuan registrasi ulang berhasil dimuat');
    }

    /**
     * Admin: Daftar pengajuan registrasi ulang untuk verifikasi
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmployeeReregistration::with([
            'employee:id,nrp,name,gender,email_company,phone_mobile,position_id,department_id,site_id',
            'employee.position:id,title,code',
            'employee.department:id,name',
            'employee.site:id,name',
            'submitter:id,name,username',
            'reviewer:id,name,username',
        ]);

        // Filter status
        if ($request->has('status') && in_array(strtoupper($request->status), ['PENDING', 'APPROVED', 'REJECTED'])) {
            $query->where('status', strtoupper($request->status));
        }

        // Search tiket, nama, atau NRP karyawan
        if ($request->has('search') && !empty($request->search)) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($eq) use ($search) {
                        $eq->where('name', 'like', "%{$search}%")
                            ->orWhere('nrp', 'like', "%{$search}%");
                    });
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = (int) $request->input('per_page', 15);
        $results = $query->paginate($perPage);

        return $this->successResponse($results, 'Daftar pengajuan registrasi ulang berhasil dimuat');
    }

    /**
     * Admin: Detail verifikasi perbandingan (diff) pengajuan
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $reregistration = EmployeeReregistration::with([
            'employee.position',
            'employee.department',
            'employee.site',
            'employee.grade',
            'submitter:id,name,username,email',
            'reviewer:id,name,username,email',
        ])->find($id);

        if (!$reregistration) {
            return $this->errorResponse('Tiket pengajuan registrasi ulang tidak ditemukan.', 'NOT_FOUND', null, 404);
        }

        // Buat daftar perbedaan field untuk kemudahan inspeksi visual HC
        $differences = $this->calculateFieldDifferences(
            $reregistration->original_data ?? [],
            $reregistration->proposed_data ?? []
        );

        return $this->successResponse([
            'ticket' => $reregistration,
            'differences' => $differences,
        ], 'Detail verifikasi registrasi ulang berhasil dimuat');
    }

    /**
     * Admin: Setujui pengajuan registrasi ulang dan terapkan ke master karyawan
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $reregistration = EmployeeReregistration::with(['employee'])->find($id);
        if (!$reregistration) {
            return $this->errorResponse('Tiket pengajuan registrasi ulang tidak ditemukan.', 'NOT_FOUND', null, 404);
        }

        if ($reregistration->status !== EmployeeReregistration::STATUS_PENDING) {
            return $this->errorResponse(
                "Pengajuan ini telah diproses sebelumnya dengan status: {$reregistration->status}.",
                'ALREADY_PROCESSED',
                null,
                422
            );
        }

        $proposedData = $reregistration->proposed_data;
        if (empty($proposedData) || !is_array($proposedData)) {
            return $this->errorResponse('Data perubahan yang diajukan tidak valid.', 'INVALID_DATA', null, 422);
        }

        return DB::transaction(function () use ($reregistration, $proposedData, $request) {
            // Terapkan perubahan ke master data karyawan menggunakan EmployeeService
            $this->employeeService->updateEmployee($reregistration->employee_id, $proposedData);

            // Perbarui status tiket menjadi APPROVED
            $reregistration->update([
                'status' => EmployeeReregistration::STATUS_APPROVED,
                'review_notes' => $request->input('review_notes', 'Disetujui oleh HC / Administrator'),
                'reviewed_by_user_id' => $request->user()->id,
                'reviewed_at' => Carbon::now(),
            ]);

            return $this->successResponse(
                $reregistration->fresh(['employee', 'reviewer']),
                "Pengajuan registrasi ulang ({$reregistration->ticket_number}) BERHASIL DISETUJUI. Data master karyawan telah otomatis diperbarui."
            );
        });
    }

    /**
     * Admin: Tolak pengajuan registrasi ulang dengan alasan
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $reregistration = EmployeeReregistration::find($id);
        if (!$reregistration) {
            return $this->errorResponse('Tiket pengajuan registrasi ulang tidak ditemukan.', 'NOT_FOUND', null, 404);
        }

        if ($reregistration->status !== EmployeeReregistration::STATUS_PENDING) {
            return $this->errorResponse(
                "Pengajuan ini telah diproses sebelumnya dengan status: {$reregistration->status}.",
                'ALREADY_PROCESSED',
                null,
                422
            );
        }

        $validator = Validator::make($request->all(), [
            'review_notes' => 'required|string|min:5|max:1000',
        ], [
            'review_notes.required' => 'Wajib memberikan alasan atau catatan penolakan.',
            'review_notes.min' => 'Alasan penolakan minimal 5 karakter.',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validasi penolakan gagal.', 'VALIDATION_ERROR', $validator->errors(), 422);
        }

        $reregistration->update([
            'status' => EmployeeReregistration::STATUS_REJECTED,
            'review_notes' => $request->input('review_notes'),
            'reviewed_by_user_id' => $request->user()->id,
            'reviewed_at' => Carbon::now(),
        ]);

        return $this->successResponse(
            $reregistration->fresh(['employee', 'reviewer']),
            "Pengajuan registrasi ulang ({$reregistration->ticket_number}) TELAH DITOLAK dengan catatan yang disampaikan ke karyawan."
        );
    }

    /**
     * Hitung perbandingan field (diff) antara data lama dan data baru yang diajukan
     */
    private function calculateFieldDifferences(array $original, array $proposed): array
    {
        $fieldLabels = [
            'nickname' => 'Nama Panggilan',
            'birth_place' => 'Tempat Lahir',
            'birth_date' => 'Tanggal Lahir',
            'gender' => 'Jenis Kelamin',
            'religion' => 'Agama',
            'marital_status' => 'Status Pernikahan',
            'marriage_date' => 'Tanggal Pernikahan',
            'id_card_number' => 'NIK KTP',
            'tax_number' => 'NPWP',
            'tax_status' => 'Status Pajak PTKP',
            'bpjs_ketenagakerjaan' => 'No. BPJS Ketenagakerjaan',
            'bpjs_kesehatan' => 'No. BPJS Kesehatan',
            'insurance_admedika' => 'No. Asuransi Kesehatan',
            'email_personal' => 'Email Pribadi',
            'phone_mobile' => 'No. Handphone / WhatsApp',
            'phone_home' => 'No. Telepon Rumah',
            'ktp_address' => 'Alamat KTP (Jalan/RT/RW)',
            'ktp_city' => 'Kota/Kabupaten KTP',
            'ktp_district' => 'Kecamatan KTP',
            'ktp_village' => 'Kelurahan/Desa KTP',
            'ktp_province' => 'Provinsi KTP',
            'ktp_postal_code' => 'Kode Pos KTP',
            'residential_address' => 'Alamat Domisili',
            'residential_city' => 'Kota/Kabupaten Domisili',
            'residential_district' => 'Kecamatan Domisili',
            'residential_village' => 'Kelurahan/Desa Domisili',
            'residential_province' => 'Provinsi Domisili',
            'residential_postal_code' => 'Kode Pos Domisili',
            'mailing_address' => 'Alamat Surat',
            'mailing_city' => 'Kota Surat',
            'mailing_district' => 'Kecamatan Surat',
            'mailing_village' => 'Kelurahan Surat',
            'mailing_province' => 'Provinsi Surat',
            'mailing_postal_code' => 'Kode Pos Surat',
        ];

        $changedScalar = [];
        foreach ($fieldLabels as $field => $label) {
            if (array_key_exists($field, $proposed)) {
                $oldVal = $original[$field] ?? null;
                $newVal = $proposed[$field] ?? null;

                // Normalisasi string kosong vs null
                $normalizedOld = ($oldVal === '' || $oldVal === null) ? null : trim((string) $oldVal);
                $normalizedNew = ($newVal === '' || $newVal === null) ? null : trim((string) $newVal);

                if ($normalizedOld !== $normalizedNew) {
                    $changedScalar[] = [
                        'field' => $field,
                        'label' => $label,
                        'old_value' => $oldVal,
                        'new_value' => $newVal,
                    ];
                }
            }
        }

        return [
            'scalar_changes' => $changedScalar,
            'families_count_old' => count($original['families'] ?? []),
            'families_count_new' => count($proposed['families'] ?? []),
            'educations_count_old' => count($original['educations'] ?? []),
            'educations_count_new' => count($proposed['educations'] ?? []),
            'emergency_contacts_count_old' => count($original['emergency_contacts'] ?? []),
            'emergency_contacts_count_new' => count($proposed['emergency_contacts'] ?? []),
            'bank_accounts_count_old' => count($original['bank_accounts'] ?? []),
            'bank_accounts_count_new' => count($proposed['bank_accounts'] ?? []),
            'has_health_safety_change' => isset($proposed['health_safety']),
        ];
    }
}

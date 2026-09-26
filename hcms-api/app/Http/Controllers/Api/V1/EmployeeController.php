<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Services\EmployeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EmployeeController extends BaseApiController
{
    public function __construct(
        protected EmployeeService $employeeService
    ) {}

    /**
     * Tampilkan daftar karyawan berpaginasi dengan filter
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'search',
            'department_id',
            'site_id',
            'position_id',
            'grade_id',
            'employment_status',
            'employment_type_id',
            'gender',
        ]);

        $perPage = (int) $request->input('per_page', 15);
        $paginated = $this->employeeService->listEmployees($filters, $perPage);

        return $this->successResponse($paginated->items(), 'Daftar karyawan berhasil dimuat', [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    /**
     * Tampilkan detail lengkap profil karyawan
     */
    public function show(int $id): JsonResponse
    {
        try {
            $employee = $this->employeeService->getEmployeeDetail($id);
            return $this->successResponse($employee, 'Detail karyawan berhasil dimuat');
        } catch (\Exception $e) {
            return $this->errorResponse('Karyawan tidak ditemukan', 'NOT_FOUND', null, 404);
        }
    }

    /**
     * Registrasi karyawan baru
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nrp' => 'required|string|max:30|unique:employees,nrp',
            'name' => 'required|string|max:255',
            'nickname' => 'nullable|string|max:50',
            'gender' => ['required', Rule::in(['MALE', 'FEMALE'])],
            'birth_place' => 'nullable|string|max:100',
            'birth_date' => 'required|date',
            'religion' => 'nullable|string|max:30',
            'marital_status' => 'nullable|string|max:30',
            'marriage_date' => 'nullable|date',
            'id_card_number' => 'nullable|string|max:25',
            'tax_number' => 'nullable|string|max:30',
            'tax_status' => 'nullable|string|max:10',
            'bpjs_ketenagakerjaan' => 'nullable|string|max:30',
            'bpjs_kesehatan' => 'nullable|string|max:30',
            'insurance_admedika' => 'nullable|string|max:50',
            'email_company' => 'nullable|email|max:100',
            'email_personal' => 'nullable|email|max:100',
            'phone_mobile' => 'nullable|string|max:30',
            'phone_home' => 'nullable|string|max:30',
            'ktp_address' => 'nullable|string',
            'ktp_city' => 'nullable|string|max:100',
            'ktp_district' => 'nullable|string|max:100',
            'ktp_village' => 'nullable|string|max:100',
            'ktp_province' => 'nullable|string|max:100',
            'ktp_postal_code' => 'nullable|string|max:10',
            'residential_address' => 'nullable|string',
            'residential_city' => 'nullable|string|max:100',
            'residential_district' => 'nullable|string|max:100',
            'residential_village' => 'nullable|string|max:100',
            'residential_province' => 'nullable|string|max:100',
            'residential_postal_code' => 'nullable|string|max:10',
            'mailing_address' => 'nullable|string',
            'mailing_city' => 'nullable|string|max:100',
            'mailing_district' => 'nullable|string|max:100',
            'mailing_village' => 'nullable|string|max:100',
            'mailing_province' => 'nullable|string|max:100',
            'mailing_postal_code' => 'nullable|string|max:10',
            'company_id' => 'nullable|exists:organization_companies,id',
            'site_id' => 'nullable|exists:organization_sites,id',
            'department_id' => 'nullable|exists:organization_departments,id',
            'section_id' => 'nullable|exists:organization_sections,id',
            'position_id' => 'nullable|exists:positions,id',
            'grade_id' => 'nullable|exists:grades,id',
            'salary_grade_id' => 'nullable|exists:salary_grades,id',
            'salary_grade_jenjang_id' => 'nullable|exists:salary_grade_jenjang,id',
            'pangkat' => 'nullable|string|max:30',
            'employment_type_id' => 'nullable|exists:employment_types,id',
            'poh' => 'nullable|string|max:100',
            'work_area' => 'nullable|string|max:100',
            'hire_date' => 'required|date',
            'probation_end_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date',
            'employment_status' => 'nullable|string|max:30',
            'photo_url' => 'nullable|string',
            'notes' => 'nullable|string',

            // Data Relasional Opsional
            'families' => 'nullable|array',
            'families.*.relation_type' => 'required|string|in:SPOUSE,CHILD,FATHER,MOTHER,FATHER_IN_LAW,MOTHER_IN_LAW,OTHER',
            'families.*.name' => 'required|string|max:255',
            'families.*.id_card_number' => 'required|string|max:25',
            'families.*.birth_place' => 'required|string|max:100',
            'families.*.birth_date' => 'required|date',
            'families.*.gender' => 'nullable|string|in:MALE,FEMALE',
            'families.*.child_order' => 'nullable|integer',
            'families.*.bpjs_kesehatan_no' => 'nullable|string|max:50',
            'families.*.insurance_no' => 'nullable|string|max:50',
            'families.*.health_provider_no' => 'nullable|string|max:50',
            'families.*.is_covered_insurance' => 'nullable|boolean',
            'families.*.is_alive' => 'nullable|boolean',
            
            'educations' => 'nullable|array',
            'educations.*.level' => 'required|string',
            'educations.*.institution_name' => 'required|string',
            'educations.*.graduation_year' => 'nullable|integer',

            'emergency_contacts' => 'nullable|array',
            'emergency_contacts.*.name' => 'required|string',
            'emergency_contacts.*.relationship' => 'required|string',
            'emergency_contacts.*.phone_number' => 'required|string',

            'health_safety' => 'nullable|array',
            'bank_accounts' => 'nullable|array',
        ]);

        try {
            $employee = $this->employeeService->createEmployee($validated, $request->user()?->id);
            return $this->successResponse($employee, 'Data karyawan berhasil didaftarkan beserta akun pengguna', [], 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Gagal mendaftarkan karyawan: ' . $e->getMessage(), 'CREATE_FAILED', null, 500);
        }
    }

    /**
     * Perbarui data profil karyawan
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'nrp' => ['sometimes', 'required', 'string', 'max:30', Rule::unique('employees')->ignore($employee->id)],
            'name' => 'sometimes|required|string|max:255',
            'nickname' => 'nullable|string|max:50',
            'gender' => ['sometimes', 'required', Rule::in(['MALE', 'FEMALE'])],
            'birth_place' => 'nullable|string|max:100',
            'birth_date' => 'sometimes|required|date',
            'religion' => 'nullable|string|max:30',
            'marital_status' => 'nullable|string|max:30',
            'marriage_date' => 'nullable|date',
            'id_card_number' => 'nullable|string|max:25',
            'tax_number' => 'nullable|string|max:30',
            'tax_status' => 'nullable|string|max:10',
            'bpjs_ketenagakerjaan' => 'nullable|string|max:30',
            'bpjs_kesehatan' => 'nullable|string|max:30',
            'insurance_admedika' => 'nullable|string|max:50',
            'email_company' => 'nullable|email|max:100',
            'email_personal' => 'nullable|email|max:100',
            'phone_mobile' => 'nullable|string|max:30',
            'phone_home' => 'nullable|string|max:30',
            'ktp_address' => 'nullable|string',
            'ktp_city' => 'nullable|string|max:100',
            'ktp_district' => 'nullable|string|max:100',
            'ktp_village' => 'nullable|string|max:100',
            'ktp_province' => 'nullable|string|max:100',
            'ktp_postal_code' => 'nullable|string|max:10',
            'residential_address' => 'nullable|string',
            'residential_city' => 'nullable|string|max:100',
            'residential_district' => 'nullable|string|max:100',
            'residential_village' => 'nullable|string|max:100',
            'residential_province' => 'nullable|string|max:100',
            'residential_postal_code' => 'nullable|string|max:10',
            'mailing_address' => 'nullable|string',
            'mailing_city' => 'nullable|string|max:100',
            'mailing_district' => 'nullable|string|max:100',
            'mailing_village' => 'nullable|string|max:100',
            'mailing_province' => 'nullable|string|max:100',
            'mailing_postal_code' => 'nullable|string|max:10',
            'company_id' => 'nullable|exists:organization_companies,id',
            'site_id' => 'nullable|exists:organization_sites,id',
            'department_id' => 'nullable|exists:organization_departments,id',
            'section_id' => 'nullable|exists:organization_sections,id',
            'position_id' => 'nullable|exists:positions,id',
            'grade_id' => 'nullable|exists:grades,id',
            'salary_grade_id' => 'nullable|exists:salary_grades,id',
            'salary_grade_jenjang_id' => 'nullable|exists:salary_grade_jenjang,id',
            'pangkat' => 'nullable|string|max:30',
            'employment_type_id' => 'nullable|exists:employment_types,id',
            'poh' => 'nullable|string|max:100',
            'work_area' => 'nullable|string|max:100',
            'hire_date' => 'sometimes|required|date',
            'probation_end_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date',
            'employment_status' => 'nullable|string|max:30',
            'photo_url' => 'nullable|string',
            'notes' => 'nullable|string',
            'health_safety' => 'nullable|array',
            'families' => 'nullable|array',
            'families.*.id' => 'nullable|integer',
            'families.*.relation_type' => 'required|string|in:SPOUSE,CHILD,FATHER,MOTHER,FATHER_IN_LAW,MOTHER_IN_LAW,OTHER',
            'families.*.name' => 'required|string|max:255',
            'families.*.id_card_number' => 'required|string|max:25',
            'families.*.birth_place' => 'required|string|max:100',
            'families.*.birth_date' => 'required|date',
            'families.*.gender' => 'nullable|string|in:MALE,FEMALE',
            'families.*.child_order' => 'nullable|integer',
            'families.*.bpjs_kesehatan_no' => 'nullable|string|max:50',
            'families.*.insurance_no' => 'nullable|string|max:50',
            'families.*.health_provider_no' => 'nullable|string|max:50',
            'families.*.is_covered_insurance' => 'nullable|boolean',
            'families.*.is_alive' => 'nullable|boolean',
            'educations' => 'nullable|array',
            'emergency_contacts' => 'nullable|array',
            'bank_accounts' => 'nullable|array',
        ]);

        try {
            $updatedEmployee = $this->employeeService->updateEmployee($employee->id, $validated);
            return $this->successResponse($updatedEmployee, 'Data karyawan berhasil diperbarui');
        } catch (\Exception $e) {
            return $this->errorResponse('Gagal memperbarui karyawan: ' . $e->getMessage(), 'UPDATE_FAILED', null, 500);
        }
    }

    /**
     * Hapus karyawan (soft delete)
     */
    public function destroy(int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $employee->delete();

        // Nonaktifkan user terkait jika ada
        if ($employee->user) {
            $employee->user->update(['status' => 'INACTIVE']);
            $employee->user->tokens()->delete();
        }

        return $this->successResponse(null, 'Karyawan berhasil dinonaktifkan / dipindahkan ke tempat sampah');
    }

    /**
     * Mutasi / Promosi / Rotasi Karir dengan Snapshot Baku
     */
    public function recordMovement(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'movement_type' => 'required|string|max:30', // PROMOTION, ROTATION, MUTATION_SITE, DEMOTION, STATUS_CHANGE, TERMINATION
            'letter_number' => 'nullable|string|max:100',
            'letter_date' => 'nullable|date',
            'effective_date' => 'required|date',
            'company_id' => 'nullable|exists:organization_companies,id',
            'site_id' => 'nullable|exists:organization_sites,id',
            'department_id' => 'nullable|exists:organization_departments,id',
            'section_id' => 'nullable|exists:organization_sections,id',
            'position_id' => 'nullable|exists:positions,id',
            'grade_id' => 'nullable|exists:grades,id',
            'salary_grade_id' => 'nullable|exists:salary_grades,id',
            'salary_grade_jenjang_id' => 'nullable|exists:salary_grade_jenjang,id',
            'pangkat' => 'nullable|string|max:30',
            'employment_type_id' => 'nullable|exists:employment_types,id',
            'poh' => 'nullable|string|max:100',
            'work_area' => 'nullable|string|max:100',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
            'sk_file_url' => 'nullable|string',
        ]);

        try {
            $careerHistory = $this->employeeService->recordCareerMovement($id, $validated, $request->user()?->id);
            return $this->successResponse($careerHistory, 'Perubahan karir / mutasi jabatan berhasil direkam');
        } catch (\Exception $e) {
            return $this->errorResponse('Gagal mencatat mutasi karir: ' . $e->getMessage(), 'MOVEMENT_FAILED', null, 500);
        }
    }

    /**
     * Toggle status aktif / nonaktif karyawan & putus sesi instan
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED'])],
            'reason' => 'nullable|string',
        ]);

        try {
            $employee = $this->employeeService->toggleEmployeeStatus($id, $validated['status'], $validated['reason'] ?? null);
            return $this->successResponse($employee, 'Status kepegawaian berhasil diubah');
        } catch (\Exception $e) {
            return $this->errorResponse('Gagal mengubah status: ' . $e->getMessage(), 'STATUS_FAILED', null, 500);
        }
    }

    /**
     * Reset password karyawan oleh Admin HR
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'nullable|string|min:6',
        ]);

        try {
            $res = $this->employeeService->resetEmployeePassword($id, $validated['password'] ?? null);
            return $this->successResponse($res, 'Password karyawan berhasil di-reset');
        } catch (\Exception $e) {
            return $this->errorResponse('Gagal me-reset password: ' . $e->getMessage(), 'RESET_FAILED', null, 400);
        }
    }

    /**
     * Ambil daftar dokumen karyawan
     */
    public function getDocuments(int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $docs = EmployeeDocument::with('documentType')
            ->where('employee_id', $employee->id)
            ->latest('id')
            ->get();

        return $this->successResponse($docs, 'Daftar dokumen karyawan berhasil dimuat');
    }

    /**
     * Unggah dokumen karyawan berdasarkan jenis dokumen standar
     */
    public function uploadDocument(Request $request, int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'document_type_id' => 'required|exists:document_types,id',
            'file' => 'required|file|max:20480|mimes:pdf,jpg,jpeg,png,webp,doc,docx',
            'document_number' => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $mimeType = $file->getMimeType() ?? 'application/octet-stream';

        // Simpan file ke disk public
        $storedPath = $file->store("employee_documents/{$employee->id}", 'public');

        // Cek apakah sudah ada dokumen bertipe sama sebelumnya untuk karyawan ini
        $existing = EmployeeDocument::where('employee_id', $employee->id)
            ->where('document_type_id', $validated['document_type_id'])
            ->first();

        if ($existing) {
            // Hapus file lama jika ada
            if ($existing->file_path && Storage::disk('public')->exists($existing->file_path)) {
                Storage::disk('public')->delete($existing->file_path);
            }

            $existing->update([
                'document_number' => $validated['document_number'] ?? $existing->document_number,
                'file_path' => $storedPath,
                'file_name' => $originalName,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'expiry_date' => $validated['expiry_date'] ?? $existing->expiry_date,
                'status' => 'VALID',
                'notes' => $validated['notes'] ?? $existing->notes,
            ]);

            $doc = $existing->fresh(['documentType']);
        } else {
            $doc = EmployeeDocument::create([
                'employee_id' => $employee->id,
                'document_type_id' => $validated['document_type_id'],
                'document_number' => $validated['document_number'] ?? null,
                'file_path' => $storedPath,
                'file_name' => $originalName,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'status' => 'VALID',
                'notes' => $validated['notes'] ?? null,
            ]);

            $doc->load('documentType');
        }

        return $this->successResponse($doc, 'Dokumen karyawan berhasil diunggah');
    }

    /**
     * Hapus dokumen karyawan
     */
    public function deleteDocument(int $id, int $documentId): JsonResponse
    {
        $doc = EmployeeDocument::where('employee_id', $id)
            ->where('id', $documentId)
            ->firstOrFail();

        if ($doc->file_path && Storage::disk('public')->exists($doc->file_path)) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $doc->delete();

        return $this->successResponse(null, 'Dokumen berhasil dihapus');
    }

    /**
     * Pratinjau dokumen karyawan
     */
    public function previewDocument(int $id, int $documentId): BinaryFileResponse
    {
        $doc = EmployeeDocument::where('employee_id', $id)
            ->where('id', $documentId)
            ->firstOrFail();

        $path = storage_path('app/public/' . $doc->file_path);
        if (!file_exists($path)) {
            abort(404, 'File dokumen tidak ditemukan di server.');
        }

        return response()->file($path, [
            'Content-Type' => $doc->mime_type ?? 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $doc->file_name . '"'
        ]);
    }

    /**
     * Unduh dokumen karyawan
     */
    public function downloadDocument(int $id, int $documentId): BinaryFileResponse
    {
        $doc = EmployeeDocument::where('employee_id', $id)
            ->where('id', $documentId)
            ->firstOrFail();

        $path = storage_path('app/public/' . $doc->file_path);
        if (!file_exists($path)) {
            abort(404, 'File dokumen tidak ditemukan di server.');
        }

        return response()->download($path, $doc->file_name);
    }

    /**
     * Cari record Employee untuk pengguna yang sedang login
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

        // Jika super admin dan belum ada employee terhubung, gunakan karyawan pertama sebagai representasi
        if (!$employee && $user->roles()->where('name', 'SUPER_ADMIN')->exists()) {
            $employee = Employee::first();
        }

        if ($employee && !$employee->user_id && $employee->nrp === $user->username) {
            $employee->update(['user_id' => $user->id]);
        }

        return $employee;
    }

    /**
     * Tampilkan profil lengkap karyawan yang sedang login (ESS)
     */
    public function myProfile(Request $request): JsonResponse
    {
        $employee = $this->resolveCurrentEmployee($request);
        if (!$employee) {
            return $this->errorResponse('Data profil karyawan tidak ditemukan untuk akun ini.', 'NOT_FOUND', null, 404);
        }

        $detail = $this->employeeService->getEmployeeDetail($employee->id);
        return $this->successResponse($detail, 'Profil karyawan berhasil dimuat');
    }

    /**
     * Unggah dokumen oleh karyawan yang sedang login (ESS)
     */
    public function uploadMyDocument(Request $request): JsonResponse
    {
        $employee = $this->resolveCurrentEmployee($request);
        if (!$employee) {
            return $this->errorResponse('Data profil karyawan tidak ditemukan.', 'NOT_FOUND', null, 404);
        }

        return $this->uploadDocument($request, $employee->id);
    }

    /**
     * Hapus dokumen oleh karyawan yang sedang login (ESS)
     */
    public function deleteMyDocument(Request $request, int $documentId): JsonResponse
    {
        $employee = $this->resolveCurrentEmployee($request);
        if (!$employee) {
            return $this->errorResponse('Data profil karyawan tidak ditemukan.', 'NOT_FOUND', null, 404);
        }

        return $this->deleteDocument($employee->id, $documentId);
    }

    /**
     * Pratinjau dokumen karyawan yang sedang login (ESS)
     */
    public function previewMyDocument(Request $request, int $documentId): BinaryFileResponse
    {
        $employee = $this->resolveCurrentEmployee($request);
        if (!$employee) {
            abort(404, 'Data profil karyawan tidak ditemukan.');
        }

        return $this->previewDocument($employee->id, $documentId);
    }

    /**
     * Unduh dokumen karyawan yang sedang login (ESS)
     */
    public function downloadMyDocument(Request $request, int $documentId): BinaryFileResponse
    {
        $employee = $this->resolveCurrentEmployee($request);
        if (!$employee) {
            abort(404, 'Data profil karyawan tidak ditemukan.');
        }

        return $this->downloadDocument($employee->id, $documentId);
    }
}

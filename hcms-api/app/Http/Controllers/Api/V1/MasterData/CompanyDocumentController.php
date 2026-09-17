<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\CompanyDocument;
use App\Models\CompanyDocumentTarget;
use App\Models\OrganizationUnit;
use App\Models\Position;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CompanyDocumentController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = CompanyDocument::with(['targets', 'creator:id,name,username'])
            ->withCount('reads');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        if ($request->filled('audience_type')) {
            $query->where('audience_type', $request->query('audience_type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $sortBy = $request->query('sort_by', 'id');
        $sortDir = strtolower($request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'document_number', 'title', 'category', 'effective_date', 'file_size', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->latest('id');
        }

        $perPage = min((int)$request->query('per_page', 15), 100);
        $documents = $query->paginate($perPage);

        $counts = [
            'ALL' => CompanyDocument::count(),
            'REGULATION' => CompanyDocument::where('category', 'REGULATION')->count(),
            'POLICY_SOP' => CompanyDocument::where('category', 'POLICY_SOP')->count(),
            'INTERNAL_MEMO' => CompanyDocument::where('category', 'INTERNAL_MEMO')->count(),
            'FORM_TEMPLATE' => CompanyDocument::where('category', 'FORM_TEMPLATE')->count(),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Daftar dokumen perusahaan berhasil dimuat.',
            'data' => $documents,
            'counts' => $counts,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_number' => ['required', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:REGULATION,POLICY_SOP,INTERNAL_MEMO,FORM_TEMPLATE'],
            'description' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx', 'max:20480'], // 20MB max
            'version' => ['nullable', 'string', 'max:20'],
            'effective_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:effective_date'],
            'is_acknowledgment_required' => ['nullable', 'boolean'],
            'audience_type' => ['required', 'string', 'in:ALL,DEPARTMENT,SECTION,POSITION'],
            'status' => ['nullable', 'string', 'in:DRAFT,PUBLISHED,ARCHIVED'],
            'targets' => ['nullable', 'array'],
            'targets.*.target_id' => ['required_with:targets', 'integer'],
            'targets.*.target_name' => ['nullable', 'string'],
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $mimeType = $file->getMimeType() ?? 'application/pdf';
        $storedPath = $file->store('company_documents', 'local');

        $document = DB::transaction(function () use ($validated, $storedPath, $fileName, $fileSize, $mimeType, $request) {
            $doc = CompanyDocument::create([
                'document_number' => $validated['document_number'],
                'title' => $validated['title'],
                'category' => $validated['category'],
                'description' => $validated['description'] ?? null,
                'file_path' => $storedPath,
                'file_name' => $fileName,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'version' => $validated['version'] ?? '1.0',
                'effective_date' => $validated['effective_date'] ?? now()->toDateString(),
                'expiry_date' => $validated['expiry_date'] ?? null,
                'is_acknowledgment_required' => $request->boolean('is_acknowledgment_required', false),
                'audience_type' => $validated['audience_type'],
                'status' => $validated['status'] ?? 'PUBLISHED',
                'created_by' => auth()->id(),
            ]);

            // Save target records if audience is not ALL
            if ($validated['audience_type'] !== 'ALL' && !empty($validated['targets'])) {
                foreach ($validated['targets'] as $target) {
                    CompanyDocumentTarget::create([
                        'company_document_id' => $doc->id,
                        'target_type' => $validated['audience_type'],
                        'target_id' => $target['target_id'],
                        'target_name' => $target['target_name'] ?? null,
                    ]);
                }
            }

            return $doc;
        });

        AuditService::log('CREATE', 'COMPANY_DOCUMENT', CompanyDocument::class, (string)$document->id, newValues: $document->toArray());

        $document->load('targets');
        return $this->createdResponse($document, 'Dokumen perusahaan berhasil diunggah.');
    }

    public function show(int $id): JsonResponse
    {
        $document = CompanyDocument::with(['targets', 'creator:id,name,username'])
            ->withCount('reads')
            ->findOrFail($id);

        return $this->successResponse($document, 'Detail dokumen perusahaan berhasil diambil.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $document = CompanyDocument::findOrFail($id);

        $validated = $request->validate([
            'document_number' => ['required', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:REGULATION,POLICY_SOP,INTERNAL_MEMO,FORM_TEMPLATE'],
            'description' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'mimes:pdf,doc,docx,xls,xlsx', 'max:20480'],
            'version' => ['nullable', 'string', 'max:20'],
            'effective_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:effective_date'],
            'is_acknowledgment_required' => ['nullable', 'boolean'],
            'audience_type' => ['required', 'string', 'in:ALL,DEPARTMENT,SECTION,POSITION'],
            'status' => ['nullable', 'string', 'in:DRAFT,PUBLISHED,ARCHIVED'],
            'targets' => ['nullable', 'array'],
            'targets.*.target_id' => ['required_with:targets', 'integer'],
            'targets.*.target_name' => ['nullable', 'string'],
        ]);

        $oldValues = $document->toArray();

        DB::transaction(function () use ($document, $validated, $request) {
            if ($request->hasFile('file')) {
                // Remove previous file
                if (Storage::disk('local')->exists($document->file_path)) {
                    Storage::disk('local')->delete($document->file_path);
                }
                $file = $request->file('file');
                $document->file_path = $file->store('company_documents', 'local');
                $document->file_name = $file->getClientOriginalName();
                $document->file_size = $file->getSize();
                $document->mime_type = $file->getMimeType() ?? 'application/pdf';
            }

            $document->document_number = $validated['document_number'];
            $document->title = $validated['title'];
            $document->category = $validated['category'];
            $document->description = $validated['description'] ?? null;
            $document->version = $validated['version'] ?? $document->version;
            $document->effective_date = $validated['effective_date'] ?? $document->effective_date;
            $document->expiry_date = $validated['expiry_date'] ?? null;
            $document->is_acknowledgment_required = $request->boolean('is_acknowledgment_required', false);
            $document->audience_type = $validated['audience_type'];
            $document->status = $validated['status'] ?? $document->status;
            $document->save();

            // Refresh targets
            CompanyDocumentTarget::where('company_document_id', $document->id)->delete();
            if ($validated['audience_type'] !== 'ALL' && !empty($validated['targets'])) {
                foreach ($validated['targets'] as $target) {
                    CompanyDocumentTarget::create([
                        'company_document_id' => $document->id,
                        'target_type' => $validated['audience_type'],
                        'target_id' => $target['target_id'],
                        'target_name' => $target['target_name'] ?? null,
                    ]);
                }
            }
        });

        AuditService::log('UPDATE', 'COMPANY_DOCUMENT', CompanyDocument::class, (string)$document->id, oldValues: $oldValues, newValues: $document->toArray());

        $document->load('targets');
        return $this->successResponse($document, 'Dokumen perusahaan berhasil diperbarui.');
    }

    public function destroy(int $id): JsonResponse
    {
        $document = CompanyDocument::findOrFail($id);
        $old = $document->toArray();

        if (Storage::disk('local')->exists($document->file_path)) {
            Storage::disk('local')->delete($document->file_path);
        }

        $document->delete();

        AuditService::log('DELETE', 'COMPANY_DOCUMENT', CompanyDocument::class, (string)$id, oldValues: $old);

        return $this->successResponse(null, 'Dokumen perusahaan berhasil dihapus.');
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $document = CompanyDocument::findOrFail($id);
        $old = $document->toArray();
        $document->status = $document->status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
        $document->save();

        AuditService::log('UPDATE_STATUS', 'COMPANY_DOCUMENT', CompanyDocument::class, (string)$id, oldValues: $old, newValues: $document->toArray());

        $statusText = $document->status === 'PUBLISHED' ? 'Diterbitkan' : 'Diarsipkan';
        return $this->successResponse($document, "Status dokumen berhasil diubah menjadi {$statusText}.");
    }

    public function download(int $id): BinaryFileResponse
    {
        $document = CompanyDocument::findOrFail($id);
        if (!Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File dokumen tidak ditemukan di server.');
        }

        $fullPath = Storage::disk('local')->path($document->file_path);

        return response()->download($fullPath, $document->file_name, [
            'Content-Type' => $document->mime_type,
        ]);
    }

    public function preview(int $id): BinaryFileResponse
    {
        $document = CompanyDocument::findOrFail($id);
        if (!Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File dokumen tidak ditemukan di server.');
        }

        $fullPath = Storage::disk('local')->path($document->file_path);

        return response()->file($fullPath, [
            'Content-Type' => $document->mime_type,
            'Content-Disposition' => 'inline; filename="' . $document->file_name . '"',
        ]);
    }
}

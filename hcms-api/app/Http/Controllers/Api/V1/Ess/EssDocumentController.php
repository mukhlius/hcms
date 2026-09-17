<?php

namespace App\Http\Controllers\Api\V1\Ess;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\CompanyDocument;
use App\Models\CompanyDocumentRead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EssDocumentController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $deptId = $user->department_id;
        $sectionId = $user->section_id;
        $positionId = $user->position_id;

        // Base query: Only PUBLISHED documents targeted to this user or ALL
        $query = CompanyDocument::where('status', 'PUBLISHED')
            ->where(function ($q) use ($deptId, $sectionId, $positionId) {
                $q->where('audience_type', 'ALL')
                    ->orWhereHas('targets', function ($tQuery) use ($deptId, $sectionId, $positionId) {
                        $tQuery->where(function ($sub) use ($deptId) {
                            if ($deptId) {
                                $sub->where('target_type', 'DEPARTMENT')->where('target_id', $deptId);
                            }
                        })->orWhere(function ($sub) use ($sectionId) {
                            if ($sectionId) {
                                $sub->where('target_type', 'SECTION')->where('target_id', $sectionId);
                            }
                        })->orWhere(function ($sub) use ($positionId) {
                            if ($positionId) {
                                $sub->where('target_type', 'POSITION')->where('target_id', $positionId);
                            }
                        });
                    });
            })
            ->with(['targets']);

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = min((int)$request->query('per_page', 12), 50);
        $documents = $query->latest('effective_date')->latest('id')->paginate($perPage);

        // Append user's personal read status
        $docIds = collect($documents->items())->pluck('id')->toArray();
        $userReads = CompanyDocumentRead::where('user_id', $user->id)
            ->whereIn('company_document_id', $docIds)
            ->get()
            ->keyBy('company_document_id');

        $documents->getCollection()->transform(function ($doc) use ($userReads) {
            $read = $userReads->get($doc->id);
            $doc->is_read = !is_null($read);
            $doc->read_at = $read?->read_at;
            $doc->acknowledged_at = $read?->acknowledged_at;
            return $doc;
        });

        // Compute summary counts per category
        $counts = [
            'ALL' => CompanyDocument::where('status', 'PUBLISHED')->count(),
            'REGULATION' => CompanyDocument::where('status', 'PUBLISHED')->where('category', 'REGULATION')->count(),
            'POLICY_SOP' => CompanyDocument::where('status', 'PUBLISHED')->where('category', 'POLICY_SOP')->count(),
            'INTERNAL_MEMO' => CompanyDocument::where('status', 'PUBLISHED')->where('category', 'INTERNAL_MEMO')->count(),
            'FORM_TEMPLATE' => CompanyDocument::where('status', 'PUBLISHED')->where('category', 'FORM_TEMPLATE')->count(),
        ];

        return $this->successResponse([
            'documents' => $documents,
            'counts' => $counts,
        ], 'Dokumen resmi perusahaan berhasil dimuat.');
    }

    public function show(int $id): JsonResponse
    {
        $user = auth()->user();
        $document = $this->findAuthorizedDocument($id, $user);

        // Record read
        CompanyDocumentRead::firstOrCreate(
            ['company_document_id' => $document->id, 'user_id' => $user->id],
            ['read_at' => now()]
        );

        $document->load('targets');
        return $this->successResponse($document, 'Detail dokumen berhasil diambil.');
    }

    public function preview(int $id): BinaryFileResponse
    {
        $user = auth()->user();
        $document = $this->findAuthorizedDocument($id, $user);

        if (!Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File dokumen tidak ditemukan di server.');
        }

        $fullPath = Storage::disk('local')->path($document->file_path);

        // Record read
        CompanyDocumentRead::firstOrCreate(
            ['company_document_id' => $document->id, 'user_id' => $user->id],
            ['read_at' => now()]
        );

        return response()->file($fullPath, [
            'Content-Type' => $document->mime_type,
            'Content-Disposition' => 'inline; filename="' . $document->file_name . '"',
        ]);
    }

    public function download(int $id): BinaryFileResponse
    {
        $user = auth()->user();
        $document = $this->findAuthorizedDocument($id, $user);

        if (!Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File dokumen tidak ditemukan di server.');
        }

        $fullPath = Storage::disk('local')->path($document->file_path);

        // Record read
        CompanyDocumentRead::firstOrCreate(
            ['company_document_id' => $document->id, 'user_id' => $user->id],
            ['read_at' => now()]
        );

        return response()->download($fullPath, $document->file_name, [
            'Content-Type' => $document->mime_type,
        ]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $user = auth()->user();
        $document = $this->findAuthorizedDocument($id, $user);

        $read = CompanyDocumentRead::updateOrCreate(
            ['company_document_id' => $document->id, 'user_id' => $user->id],
            ['read_at' => now(), 'acknowledged_at' => now()]
        );

        return $this->successResponse($read, 'Dokumen berhasil ditandai telah dibaca.');
    }

    private function findAuthorizedDocument(int $id, $user): CompanyDocument
    {
        $deptId = $user->department_id;
        $sectionId = $user->section_id;
        $positionId = $user->position_id;

        $doc = CompanyDocument::where('id', $id)
            ->where('status', 'PUBLISHED')
            ->where(function ($q) use ($deptId, $sectionId, $positionId) {
                $q->where('audience_type', 'ALL')
                    ->orWhereHas('targets', function ($tQuery) use ($deptId, $sectionId, $positionId) {
                        $tQuery->where(function ($sub) use ($deptId) {
                            if ($deptId) {
                                $sub->where('target_type', 'DEPARTMENT')->where('target_id', $deptId);
                            }
                        })->orWhere(function ($sub) use ($sectionId) {
                            if ($sectionId) {
                                $sub->where('target_type', 'SECTION')->where('target_id', $sectionId);
                            }
                        })->orWhere(function ($sub) use ($positionId) {
                            if ($positionId) {
                                $sub->where('target_type', 'POSITION')->where('target_id', $positionId);
                            }
                        });
                    });
            })
            ->first();

        if (!$doc) {
            abort(403, 'Anda tidak memiliki akses untuk melihat dokumen ini.');
        }

        return $doc;
    }
}

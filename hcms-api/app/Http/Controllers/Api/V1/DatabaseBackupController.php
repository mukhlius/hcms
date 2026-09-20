<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\AuditService;
use App\Services\DatabaseBackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DatabaseBackupController extends BaseApiController
{
    protected DatabaseBackupService $backupService;

    public function __construct(DatabaseBackupService $backupService)
    {
        $this->backupService = $backupService;
    }

    /**
     * Dapatkan daftar file backup dan statistik database
     */
    public function index(): JsonResponse
    {
        $backups = $this->backupService->getBackups();
        $dbInfo = $this->backupService->getDatabaseInfo();

        return $this->successResponse([
            'database' => $dbInfo,
            'backups' => $backups,
        ], 'Data riwayat backup database berhasil dimuat');
    }

    /**
     * Buat backup baru secara on-demand
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'note' => 'nullable|string|max:255',
        ]);

        try {
            $user = $request->user();
            $note = $request->input('note');
            $result = $this->backupService->createBackup($note);

            AuditService::log(
                action: 'CREATE',
                module: 'database_backup',
                entityType: 'DatabaseBackup',
                entityId: $result['filename'],
                oldValues: null,
                newValues: [
                    'filename' => $result['filename'],
                    'size_formatted' => $result['size_formatted'],
                    'engine' => $result['engine'],
                    'note' => $note,
                ],
                actorId: $user ? $user->id : null
            );

            return $this->successResponse($result, 'Cadangan database berhasil dibuat', 201);
        } catch (\Throwable $e) {
            return $this->errorResponse('Gagal membuat cadangan database: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Unduh file backup
     */
    public function download(Request $request, string $filename): BinaryFileResponse|JsonResponse
    {
        $filePath = $this->backupService->getBackupPath($filename);

        if (!$filePath) {
            return $this->errorResponse('File backup tidak ditemukan atau sudah dihapus.', 404);
        }

        $user = $request->user();
        AuditService::log(
            action: 'EXPORT',
            module: 'database_backup',
            entityType: 'DatabaseBackup',
            entityId: $filename,
            oldValues: null,
            newValues: ['action' => 'download_file'],
            actorId: $user ? $user->id : null
        );

        return response()->download($filePath, $filename, [
            'Content-Type' => 'application/sql',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Hapus file backup tertentu
     */
    public function destroy(Request $request, string $filename): JsonResponse
    {
        $filePath = $this->backupService->getBackupPath($filename);

        if (!$filePath) {
            return $this->errorResponse('File backup tidak ditemukan.', 404);
        }

        $deleted = $this->backupService->deleteBackup($filename);

        if (!$deleted) {
            return $this->errorResponse('Gagal menghapus file backup.', 500);
        }

        $user = $request->user();
        AuditService::log(
            action: 'DELETE',
            module: 'database_backup',
            entityType: 'DatabaseBackup',
            entityId: $filename,
            oldValues: ['filename' => $filename],
            newValues: null,
            actorId: $user ? $user->id : null
        );

        return $this->successResponse(null, "File backup {$filename} berhasil dihapus.");
    }
}

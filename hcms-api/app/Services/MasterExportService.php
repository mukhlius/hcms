<?php

namespace App\Services;

use Symfony\Component\HttpFoundation\StreamedResponse;

class MasterExportService
{
    /**
     * Stream CSV export with audit logging.
     */
    public function exportCsv(string $filename, array $headers, iterable $dataGenerator, string $moduleName): StreamedResponse
    {
        AuditService::log(
            action: 'EXPORT',
            module: $moduleName,
            newValues: ['filename' => $filename]
        );

        $responseHeaders = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($headers, $dataGenerator) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, $headers);

            foreach ($dataGenerator as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $responseHeaders);
    }
}

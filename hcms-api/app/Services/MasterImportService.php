<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class MasterImportService
{
    /**
     * Parse and inspect uploaded CSV file.
     */
    public function parseFile(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, ['csv', 'txt'])) {
            throw ValidationException::withMessages([
                'file' => ['Format file harus berupa CSV (.csv).'],
            ]);
        }

        $path = $file->getRealPath();
        $handle = fopen($path, 'r');
        if (!$handle) {
            throw ValidationException::withMessages([
                'file' => ['Gagal membaca isi berkas.'],
            ]);
        }

        $headers = [];
        $rows = [];
        $line = 0;

        while (($data = fgetcsv($handle, 4096, ',')) !== false) {
            // Formula injection prevention: sanitize strings starting with =, +, -, @
            $cleanData = array_map(function ($val) {
                $trimmed = trim((string)$val);
                if (str_starts_with($trimmed, '=') || str_starts_with($trimmed, '+') || str_starts_with($trimmed, '-') || str_starts_with($trimmed, '@')) {
                    return "'" . $trimmed;
                }
                return $trimmed;
            }, $data);

            if ($line === 0) {
                $headers = $cleanData;
            } else {
                if (count(array_filter($cleanData)) > 0) {
                    $rows[] = $cleanData;
                }
            }
            $line++;
        }

        fclose($handle);

        return [
            'headers' => $headers,
            'total_rows' => count($rows),
            'sample_rows' => array_slice($rows, 0, 5),
            'all_rows' => $rows,
        ];
    }

    /**
     * Validate rows against specified entity field rules.
     */
    public function validateRows(array $headers, array $rows, array $columnMapping, array $validationRules): array
    {
        $validRows = [];
        $errors = [];

        // Invert mapping: model_field => csv_column_index
        $fieldIndexMap = [];
        foreach ($columnMapping as $modelField => $csvHeader) {
            $idx = array_search($csvHeader, $headers);
            if ($idx !== false) {
                $fieldIndexMap[$modelField] = $idx;
            }
        }

        foreach ($rows as $index => $row) {
            $rowNum = $index + 2; // header is row 1
            $rowData = [];

            foreach ($fieldIndexMap as $modelField => $colIdx) {
                $rowData[$modelField] = $row[$colIdx] ?? null;
            }

            $validator = Validator::make($rowData, $validationRules);

            if ($validator->fails()) {
                foreach ($validator->errors()->getMessages() as $field => $messages) {
                    $errors[] = [
                        'row' => $rowNum,
                        'field' => $field,
                        'value' => $rowData[$field] ?? null,
                        'message' => implode(', ', $messages),
                    ];
                }
            } else {
                $validRows[] = $rowData;
            }
        }

        return [
            'is_valid' => count($errors) === 0,
            'total' => count($rows),
            'valid_count' => count($validRows),
            'error_count' => count($errors),
            'errors' => $errors,
            'valid_data' => $validRows,
        ];
    }

    /**
     * Execute batch import in DB transaction.
     */
    public function executeImport(string $modelClass, array $data, string $moduleName, string $strategy = 'STRICT'): array
    {
        return DB::transaction(function () use ($modelClass, $data, $moduleName) {
            $importedCount = 0;
            foreach ($data as $item) {
                $modelClass::updateOrCreate(
                    ['code' => $item['code']],
                    $item
                );
                $importedCount++;
            }

            AuditService::log(
                action: 'IMPORT',
                module: $moduleName,
                entityType: $modelClass,
                newValues: ['imported_count' => $importedCount]
            );

            return [
                'success' => true,
                'imported_count' => $importedCount,
            ];
        });
    }
}

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
            $defaultCompanyId = \App\Models\OrganizationCompany::value('id');

            foreach ($data as $item) {
                // Pre-process for OrganizationDepartment
                if ($modelClass === \App\Models\OrganizationDepartment::class) {
                    if (empty($item['company_id'])) {
                        if (!empty($item['company_code'])) {
                            $item['company_id'] = \App\Models\OrganizationCompany::where('code', $item['company_code'])->value('id') ?? $defaultCompanyId;
                            unset($item['company_code']);
                        } else {
                            $item['company_id'] = $defaultCompanyId;
                        }
                    }

                    if (!empty($item['site_code'])) {
                        $item['site_id'] = \App\Models\OrganizationSite::where('code', $item['site_code'])->value('id');
                        unset($item['site_code']);
                    }

                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }
                    $item['is_active'] = $item['status'] === 'ACTIVE';
                }

                // Pre-process for OrganizationSection
                if ($modelClass === \App\Models\OrganizationSection::class) {
                    if (!empty($item['department_code'])) {
                        $item['department_id'] = \App\Models\OrganizationDepartment::where('code', $item['department_code'])->value('id');
                        unset($item['department_code']);
                    }

                    if (empty($item['department_id'])) {
                        $item['department_id'] = \App\Models\OrganizationDepartment::value('id');
                    }

                    if (empty($item['company_id'])) {
                        if (!empty($item['company_code'])) {
                            $item['company_id'] = \App\Models\OrganizationCompany::where('code', $item['company_code'])->value('id') ?? $defaultCompanyId;
                            unset($item['company_code']);
                        } elseif (!empty($item['department_id'])) {
                            $item['company_id'] = \App\Models\OrganizationDepartment::where('id', $item['department_id'])->value('company_id') ?? $defaultCompanyId;
                        } else {
                            $item['company_id'] = $defaultCompanyId;
                        }
                    }

                    if (!empty($item['site_code'])) {
                        $item['site_id'] = \App\Models\OrganizationSite::where('code', $item['site_code'])->value('id');
                        unset($item['site_code']);
                    }

                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }
                }

                // Pre-process for Position
                if ($modelClass === \App\Models\Position::class) {
                    if (!empty($item['site_code'])) {
                        $item['site_id'] = \App\Models\OrganizationSite::where('code', $item['site_code'])->value('id');
                        unset($item['site_code']);
                    }

                    if (!empty($item['department_code'])) {
                        $item['department_id'] = \App\Models\OrganizationDepartment::where('code', $item['department_code'])->value('id');
                        unset($item['department_code']);
                    }

                    if (!empty($item['section_code'])) {
                        $item['section_id'] = \App\Models\OrganizationSection::where('code', $item['section_code'])->value('id');
                        unset($item['section_code']);
                    }

                    if (!empty($item['grade_code'])) {
                        $item['grade_id'] = \App\Models\Grade::where('code', $item['grade_code'])->value('id');
                        unset($item['grade_code']);
                    }

                    if (!empty($item['reports_to_code'])) {
                        $item['reports_to_position_id'] = \App\Models\Position::where('code', $item['reports_to_code'])->value('id');
                        unset($item['reports_to_code']);
                    }

                    if (empty($item['approved_headcount'])) {
                        $item['approved_headcount'] = 1;
                    } else {
                        $item['approved_headcount'] = (int) $item['approved_headcount'];
                    }

                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }
                }

                // Pre-process for OrganizationUnit
                if ($modelClass === \App\Models\OrganizationUnit::class) {
                    if (isset($item['unit_type']) && !isset($item['type'])) {
                        $item['type'] = strtoupper($item['unit_type']);
                        unset($item['unit_type']);
                    }

                    if (empty($item['company_id'])) {
                        if (!empty($item['company_code'])) {
                            $item['company_id'] = \App\Models\OrganizationCompany::where('code', $item['company_code'])->value('id') ?? $defaultCompanyId;
                            unset($item['company_code']);
                        } else {
                            $item['company_id'] = $defaultCompanyId;
                        }
                    }

                    if (!empty($item['parent_code'])) {
                        $item['parent_id'] = \App\Models\OrganizationUnit::where('code', $item['parent_code'])->value('id');
                        unset($item['parent_code']);
                    }

                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }
                }

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

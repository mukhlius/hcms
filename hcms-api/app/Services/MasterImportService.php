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

        // Auto-detect CSV delimiter (comma, semicolon, tab, pipe)
        $delimiters = [',', ';', "\t", '|'];
        $bestDelimiter = ',';
        $maxCols = 0;

        $sampleLines = [];
        for ($i = 0; $i < 5; $i++) {
            $line = fgets($handle);
            if ($line !== false && trim($line) !== '') {
                $sampleLines[] = preg_replace('/^\xEF\xBB\xBF/', '', $line);
            }
        }
        rewind($handle);

        foreach ($delimiters as $delim) {
            $colCounts = [];
            foreach ($sampleLines as $sLine) {
                $colCounts[] = count(str_getcsv($sLine, $delim));
            }
            if (!empty($colCounts)) {
                $avgCols = array_sum($colCounts) / count($colCounts);
                if ($avgCols > $maxCols) {
                    $maxCols = $avgCols;
                    $bestDelimiter = $delim;
                }
            }
        }

        $headers = [];
        $rows = [];
        $line = 0;

        while (($data = fgetcsv($handle, 4096, $bestDelimiter)) !== false) {
            // Formula injection prevention: sanitize strings starting with =, +, -, @
            $cleanData = array_map(function ($val) {
                $trimmed = trim((string)$val);
                if (str_starts_with($trimmed, '=') || str_starts_with($trimmed, '+') || str_starts_with($trimmed, '-') || str_starts_with($trimmed, '@')) {
                    return "'" . $trimmed;
                }
                return $trimmed;
            }, $data);

            if ($line === 0) {
                // Strip UTF-8 BOM from the first header element if present
                if (!empty($cleanData[0])) {
                    $cleanData[0] = preg_replace('/^\xEF\xBB\xBF/', '', $cleanData[0]);
                    $cleanData[0] = trim($cleanData[0]);
                }
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
                // Universal normalization of status to prevent varchar overflow
                if (!empty($item['status'])) {
                    $rawStatus = strtoupper(trim((string)$item['status']));
                    $item['status'] = in_array($rawStatus, ['INACTIVE', 'NONAKTIF', '0', 'FALSE', 'TIDAK']) ? 'INACTIVE' : 'ACTIVE';
                } else {
                    $item['status'] = 'ACTIVE';
                }
                $item['is_active'] = $item['status'] === 'ACTIVE';

                if (isset($item['code'])) {
                    $item['code'] = trim((string)$item['code']);
                }
                if (isset($item['name'])) {
                    $item['name'] = trim((string)$item['name']);
                }

                // 1. OrganizationCompany
                if ($modelClass === \App\Models\OrganizationCompany::class) {
                    \App\Models\OrganizationCompany::updateOrCreate(
                        ['code' => $item['code']],
                        $item
                    );
                    $importedCount++;
                    continue;
                }

                // 2. OrganizationSite
                if ($modelClass === \App\Models\OrganizationSite::class) {
                    if (empty($item['company_id'])) {
                        if (!empty($item['company_code'])) {
                            $item['company_id'] = \App\Models\OrganizationCompany::where('code', $item['company_code'])->value('id') ?? $defaultCompanyId;
                            unset($item['company_code']);
                        } else {
                            $item['company_id'] = $defaultCompanyId;
                        }
                    }

                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }
                    $item['is_active'] = $item['status'] === 'ACTIVE';

                    \App\Models\OrganizationSite::updateOrCreate(
                        ['code' => $item['code']],
                        $item
                    );
                    $importedCount++;
                    continue;
                }

                // 3. Pre-process for OrganizationDepartment
                if ($modelClass === \App\Models\OrganizationDepartment::class) {
                    if (empty($item['company_id'])) {
                        if (!empty($item['company_code'])) {
                            $rawComp = trim((string)$item['company_code']);
                            $item['company_id'] = \App\Models\OrganizationCompany::where('code', $rawComp)
                                ->orWhere('name', $rawComp)
                                ->orWhereRaw('LOWER(code) = ?', [strtolower($rawComp)])
                                ->value('id') ?? $defaultCompanyId;
                            unset($item['company_code']);
                        } else {
                            $item['company_id'] = $defaultCompanyId;
                        }
                    }

                    $siteIdentifier = $item['site_code'] ?? ($item['site_id'] ?? ($item['site'] ?? null));
                    $resolvedSiteId = $this->resolveSiteId($siteIdentifier, $item['company_id'] ?? null);
                    unset($item['site_code'], $item['site']);

                    if (!$resolvedSiteId) {
                        $resolvedSiteId = \App\Models\OrganizationSite::where('company_id', $item['company_id'] ?? $defaultCompanyId)->value('id')
                            ?? \App\Models\OrganizationSite::value('id');
                    }

                    $item['site_id'] = $resolvedSiteId;

                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }
                    $item['is_active'] = $item['status'] === 'ACTIVE';

                    \App\Models\OrganizationDepartment::updateOrCreate(
                        ['code' => $item['code']],
                        $item
                    );
                    $importedCount++;
                    continue;
                }

                // 4. Pre-process for OrganizationSection
                if ($modelClass === \App\Models\OrganizationSection::class) {
                    if (!empty($item['department_code'])) {
                        $rawDept = trim((string)$item['department_code']);
                        $item['department_id'] = \App\Models\OrganizationDepartment::where('code', $rawDept)
                            ->orWhere('name', $rawDept)
                            ->orWhereRaw('LOWER(code) = ?', [strtolower($rawDept)])
                            ->value('id');
                        unset($item['department_code']);
                    }

                    if (empty($item['department_id'])) {
                        $item['department_id'] = \App\Models\OrganizationDepartment::value('id');
                    }

                    if (empty($item['company_id'])) {
                        if (!empty($item['company_code'])) {
                            $rawComp = trim((string)$item['company_code']);
                            $item['company_id'] = \App\Models\OrganizationCompany::where('code', $rawComp)
                                ->orWhere('name', $rawComp)
                                ->orWhereRaw('LOWER(code) = ?', [strtolower($rawComp)])
                                ->value('id') ?? $defaultCompanyId;
                            unset($item['company_code']);
                        } elseif (!empty($item['department_id'])) {
                            $item['company_id'] = \App\Models\OrganizationDepartment::where('id', $item['department_id'])->value('company_id') ?? $defaultCompanyId;
                        } else {
                            $item['company_id'] = $defaultCompanyId;
                        }
                    }

                    // Resilient Site Resolution
                    $siteIdentifier = $item['site_code'] ?? ($item['site_id'] ?? ($item['site'] ?? null));
                    $resolvedSiteId = $this->resolveSiteId($siteIdentifier, $item['company_id'] ?? null);
                    unset($item['site_code'], $item['site']);

                    // Fallback 1: Follow department's site if department is assigned to a site
                    if (!$resolvedSiteId && !empty($item['department_id'])) {
                        $resolvedSiteId = \App\Models\OrganizationDepartment::where('id', $item['department_id'])->value('site_id');
                    }

                    // Fallback 2: Company site or system default site
                    if (!$resolvedSiteId) {
                        $resolvedSiteId = \App\Models\OrganizationSite::where('company_id', $item['company_id'] ?? $defaultCompanyId)->value('id')
                            ?? \App\Models\OrganizationSite::value('id');
                    }

                    $item['site_id'] = $resolvedSiteId;

                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }

                    \App\Models\OrganizationSection::updateOrCreate(
                        ['code' => $item['code']],
                        $item
                    );
                    $importedCount++;
                    continue;
                }

                // 5. Pre-process for Position
                if ($modelClass === \App\Models\Position::class) {
                    $siteIdentifier = $item['site_code'] ?? ($item['site_id'] ?? ($item['site'] ?? null));
                    $resolvedSiteId = $this->resolveSiteId($siteIdentifier);
                    unset($item['site_code'], $item['site']);

                    if (!empty($item['department_code'])) {
                        $rawDept = trim((string)$item['department_code']);
                        $item['department_id'] = \App\Models\OrganizationDepartment::where('code', $rawDept)
                            ->orWhere('name', $rawDept)
                            ->value('id');
                        unset($item['department_code']);
                    }

                    if (!empty($item['section_code'])) {
                        $rawSec = trim((string)$item['section_code']);
                        $item['section_id'] = \App\Models\OrganizationSection::where('code', $rawSec)
                            ->orWhere('name', $rawSec)
                            ->value('id');
                        unset($item['section_code']);
                    }

                    if (!$resolvedSiteId && !empty($item['section_id'])) {
                        $resolvedSiteId = \App\Models\OrganizationSection::where('id', $item['section_id'])->value('site_id');
                    }
                    if (!$resolvedSiteId && !empty($item['department_id'])) {
                        $resolvedSiteId = \App\Models\OrganizationDepartment::where('id', $item['department_id'])->value('site_id');
                    }
                    if (!$resolvedSiteId) {
                        $resolvedSiteId = \App\Models\OrganizationSite::value('id');
                    }
                    $item['site_id'] = $resolvedSiteId;

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

                    \App\Models\Position::updateOrCreate(
                        ['code' => $item['code']],
                        $item
                    );
                    $importedCount++;
                    continue;
                }

                // 6. SalaryGrade (Golongan)
                if ($modelClass === \App\Models\SalaryGrade::class) {
                    if (isset($item['housing_allowance'])) {
                        $item['housing_allowance'] = (float) $item['housing_allowance'];
                    }
                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }

                    \App\Models\SalaryGrade::updateOrCreate(
                        ['code' => $item['code']],
                        $item
                    );
                    $importedCount++;
                    continue;
                }

                // 7. Grade (Level Jabatan)
                if ($modelClass === \App\Models\Grade::class) {
                    if (isset($item['level'])) {
                        $item['level'] = (int) $item['level'];
                    }
                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }

                    \App\Models\Grade::updateOrCreate(
                        ['code' => $item['code']],
                        $item
                    );
                    $importedCount++;
                    continue;
                }

                // 8. EmploymentType (Hubungan Kerja)
                if ($modelClass === \App\Models\EmploymentType::class) {
                    if (isset($item['is_permanent'])) {
                        $val = strtolower((string)$item['is_permanent']);
                        $item['is_permanent'] = in_array($val, ['1', 'true', 'yes', 'ya', 'permanent', 'tetap']);
                    }
                    if (empty($item['status'])) {
                        $item['status'] = 'ACTIVE';
                    }

                    \App\Models\EmploymentType::updateOrCreate(
                        ['code' => $item['code']],
                        $item
                    );
                    $importedCount++;
                    continue;
                }

                // 9. StandardReference (Area Kerja, POH, Status Menikah)
                if ($modelClass === \App\Models\StandardReference::class) {
                    $category = match ($moduleName) {
                        'POH' => 'POH',
                        'MARITAL-STATUSES' => 'MARITAL_STATUS',
                        default => 'WORK_AREA',
                    };

                    $metadata = [];
                    if ($category === 'WORK_AREA') {
                        $metadata = [
                            'description' => $item['description'] ?? '',
                            'risk_level' => $item['risk_level'] ?? 'RENDAH',
                        ];
                    } elseif ($category === 'POH') {
                        $metadata = [
                            'destination_airport' => $item['destination_airport'] ?? '',
                            'additional_travel_days' => (int)($item['additional_travel_days'] ?? 0),
                        ];
                    } elseif ($category === 'MARITAL_STATUS') {
                        $metadata = [
                            'category' => $item['category'] ?? 'Tidak Menikah',
                        ];
                    }

                    \App\Models\StandardReference::updateOrCreate(
                        ['category' => $category, 'code' => $item['code']],
                        [
                            'category' => $category,
                            'code' => $item['code'],
                            'name' => $item['name'] ?? $item['code'],
                            'metadata' => $metadata,
                            'status' => $item['status'] ?? 'ACTIVE',
                        ]
                    );
                    $importedCount++;
                    continue;
                }

                // 10. BenefitPlafond (Plafon Pengobatan, Kacamata, Persalinan, Tunjangan Lapangan, Uang Perdin, Lumpsum, Komunikasi)
                if ($modelClass === \App\Models\BenefitPlafond::class) {
                    $benefitType = match ($moduleName) {
                        'PLAFON-PENGOBATAN' => 'PENGOBATAN',
                        'PLAFON-KACAMATA' => 'KACAMATA',
                        'PLAFON-PERSALINAN' => 'PERSALINAN',
                        'TUNJANGAN-LAPANGAN' => 'TUNJANGAN_LAPANGAN',
                        'UANG-PERDIN' => 'UANG_PERDIN',
                        'BANTUAN-LUMPSUM' => 'BANTUAN_LUMPSUM',
                        'BANTUAN-KOMUNIKASI' => 'BANTUAN_KOMUNIKASI',
                        'BANTUAN-PERUMAHAN' => 'BANTUAN_PERUMAHAN',
                        default => 'PENGOBATAN',
                    };

                    if ($benefitType === 'KACAMATA') {
                        $lensType = $item['lens_type'] ?? '';
                        $frameAmount = (float)($item['frame_amount'] ?? 0);
                        $lensAmount = (float)($item['lens_amount'] ?? 0);
                        $amount = $frameAmount + $lensAmount;

                        \App\Models\BenefitPlafond::updateOrCreate(
                            [
                                'benefit_type' => 'KACAMATA',
                                'lens_type' => $lensType,
                            ],
                            [
                                'benefit_type' => 'KACAMATA',
                                'salary_grade_id' => null,
                                'lens_type' => $lensType,
                                'frame_amount' => $frameAmount,
                                'lens_amount' => $lensAmount,
                                'amount' => $amount,
                                'marital_category' => 'SEMUA',
                                'period_type' => $item['period_type'] ?? '2_TAHUNAN',
                                'description' => $item['description'] ?? null,
                                'status' => $item['status'] ?? 'ACTIVE',
                            ]
                        );
                    } elseif ($benefitType === 'TUNJANGAN_LAPANGAN') {
                        $gradeId = null;
                        $gradeCode = $item['grade_code'] ?? $item['level_code'] ?? $item['job_level_code'] ?? $item['salary_grade_code'] ?? null;
                        if (!empty($gradeCode)) {
                            $gradeId = \App\Models\Grade::where('code', $gradeCode)->orWhere('name', $gradeCode)->value('id');
                        }
                        if (!$gradeId && !empty($item['grade_id'])) {
                            $gradeId = $item['grade_id'];
                        }
                        if (!$gradeId && !empty($item['level_id'])) {
                            $gradeId = $item['level_id'];
                        }

                        if (!$gradeId) {
                            $codeDisplay = $gradeCode ?? '(kosong)';
                            throw new \Exception("Level Jabatan '{$codeDisplay}' tidak ditemukan dalam master data Level / Grade. Pastikan menggunakan kode Level Jabatan yang valid (contoh: PM, DPM, DH, SH, GL, OFF, ADM, SEC, OPT, MEC).");
                        }

                        $amount = (float)($item['amount'] ?? 0);
                        $periodType = $item['period_type'] ?? 'BULANAN';

                        \App\Models\BenefitPlafond::updateOrCreate(
                            [
                                'benefit_type' => 'TUNJANGAN_LAPANGAN',
                                'grade_id' => $gradeId,
                            ],
                            [
                                'benefit_type' => 'TUNJANGAN_LAPANGAN',
                                'grade_id' => $gradeId,
                                'category_name' => null,
                                'amount' => $amount,
                                'marital_category' => 'SEMUA',
                                'period_type' => $periodType,
                                'description' => null,
                                'status' => $item['status'] ?? 'ACTIVE',
                            ]
                        );
                    } elseif (in_array($benefitType, ['UANG_PERDIN', 'BANTUAN_LUMPSUM', 'BANTUAN_KOMUNIKASI', 'BANTUAN_PERUMAHAN'])) {
                        $salaryGradeId = null;
                        if (!empty($item['salary_grade_code'])) {
                            $salaryGradeId = \App\Models\SalaryGrade::where('code', $item['salary_grade_code'])->value('id');
                        }
                        if (!$salaryGradeId && !empty($item['salary_grade_id'])) {
                            $salaryGradeId = $item['salary_grade_id'];
                        }

                        $categoryName = $item['category_name'] ?? null;
                        $zoneName = $item['zone_name'] ?? null;
                        $amount = (float)($item['amount'] ?? 0);
                        $defaultPeriod = match ($benefitType) {
                            'UANG_PERDIN' => 'HARIAN',
                            'BANTUAN_LUMPSUM' => 'PER_KASUS',
                            default => 'BULANAN',
                        };
                        $periodType = $item['period_type'] ?? $defaultPeriod;

                        \App\Models\BenefitPlafond::updateOrCreate(
                            [
                                'benefit_type' => $benefitType,
                                'salary_grade_id' => $salaryGradeId,
                                'category_name' => $categoryName,
                                'zone_name' => $zoneName,
                            ],
                            [
                                'benefit_type' => $benefitType,
                                'salary_grade_id' => $salaryGradeId,
                                'category_name' => $categoryName,
                                'zone_name' => $zoneName,
                                'amount' => $amount,
                                'marital_category' => 'SEMUA',
                                'period_type' => $periodType,
                                'description' => $item['description'] ?? null,
                                'status' => $item['status'] ?? 'ACTIVE',
                            ]
                        );
                    } elseif ($benefitType === 'PERSALINAN') {
                        $salaryGradeId = null;
                        if (!empty($item['salary_grade_code'])) {
                            $salaryGradeId = \App\Models\SalaryGrade::where('code', $item['salary_grade_code'])->value('id');
                        }
                        if (!$salaryGradeId && !empty($item['salary_grade_id'])) {
                            $salaryGradeId = $item['salary_grade_id'];
                        }

                        $categoryName = $item['category_name'] ?? null;
                        $amount = (float)($item['amount'] ?? 0);
                        $periodType = $item['period_type'] ?? 'PER_KASUS';

                        \App\Models\BenefitPlafond::updateOrCreate(
                            [
                                'benefit_type' => 'PERSALINAN',
                                'salary_grade_id' => $salaryGradeId,
                                'category_name' => $categoryName,
                            ],
                            [
                                'benefit_type' => 'PERSALINAN',
                                'salary_grade_id' => $salaryGradeId,
                                'category_name' => $categoryName,
                                'amount' => $amount,
                                'marital_category' => 'SEMUA',
                                'period_type' => $periodType,
                                'description' => $item['description'] ?? null,
                                'status' => $item['status'] ?? 'ACTIVE',
                            ]
                        );
                    } else {
                        $salaryGradeId = null;
                        if (!empty($item['salary_grade_code'])) {
                            $salaryGradeId = \App\Models\SalaryGrade::where('code', $item['salary_grade_code'])->value('id');
                        }
                        if (!$salaryGradeId && !empty($item['salary_grade_id'])) {
                            $salaryGradeId = $item['salary_grade_id'];
                        }

                        $maritalCategory = $item['marital_category'] ?? 'SEMUA';
                        $amount = (float)($item['amount'] ?? 0);
                        $periodType = $item['period_type'] ?? 'TAHUNAN';

                        \App\Models\BenefitPlafond::updateOrCreate(
                            [
                                'benefit_type' => $benefitType,
                                'salary_grade_id' => $salaryGradeId,
                                'marital_category' => $maritalCategory,
                            ],
                            [
                                'benefit_type' => $benefitType,
                                'salary_grade_id' => $salaryGradeId,
                                'marital_category' => $maritalCategory,
                                'amount' => $amount,
                                'period_type' => $periodType,
                                'description' => $item['description'] ?? null,
                                'status' => $item['status'] ?? 'ACTIVE',
                            ]
                        );
                    }
                    $importedCount++;
                    continue;
                }

                // 11. Pre-process for OrganizationUnit
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

                    \App\Models\OrganizationUnit::updateOrCreate(
                        ['code' => $item['code']],
                        $item
                    );
                    $importedCount++;
                    continue;
                }

                // 12. User
                if ($modelClass === \App\Models\User::class) {
                    $key = !empty($item['email']) ? ['email' => $item['email']] : ['username' => $item['username']];
                    \App\Models\User::updateOrCreate($key, $item);
                    $importedCount++;
                    continue;
                }

                // Generic Fallback
                $modelClass::updateOrCreate(
                    ['code' => $item['code'] ?? $item['id']],
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

    /**
     * Resilient site resolver by code, name, short_name, or ID.
     */
    protected function resolveSiteId(mixed $siteIdentifier, ?int $companyId = null): ?int
    {
        if (empty($siteIdentifier)) {
            return null;
        }

        $raw = trim((string)$siteIdentifier);
        if (empty($raw)) {
            return null;
        }

        // 1. Exact match by code
        $site = \App\Models\OrganizationSite::where('code', $raw)->first();
        if ($site) return $site->id;

        // 2. Case-insensitive match by code
        $site = \App\Models\OrganizationSite::whereRaw('LOWER(code) = ?', [strtolower($raw)])->first();
        if ($site) return $site->id;

        // 3. Exact match by name or short_name
        $site = \App\Models\OrganizationSite::where('name', $raw)
            ->orWhere('short_name', $raw)
            ->first();
        if ($site) return $site->id;

        // 4. Case-insensitive match by name or short_name
        $site = \App\Models\OrganizationSite::whereRaw('LOWER(name) = ?', [strtolower($raw)])
            ->orWhereRaw('LOWER(short_name) = ?', [strtolower($raw)])
            ->first();
        if ($site) return $site->id;

        // 5. Partial / contains match
        $site = \App\Models\OrganizationSite::where('name', 'like', "%{$raw}%")
            ->orWhere('code', 'like', "%{$raw}%")
            ->first();
        if ($site) return $site->id;

        // 6. Numeric ID check
        if (is_numeric($raw)) {
            $site = \App\Models\OrganizationSite::find((int)$raw);
            if ($site) return $site->id;
        }

        return null;
    }
}

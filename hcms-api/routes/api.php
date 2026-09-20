<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SecurityEventController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\SystemSettingController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\RecycleBinController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Public Authentication & Branding Endpoints
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    });
    Route::get('/public/settings', [SystemSettingController::class, 'publicSettings']);

    // Authenticated Endpoints (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {

        // Session & Current User
        Route::prefix('auth')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/change-password', [AuthController::class, 'changePassword']);
        });

        // Organization Metadata
        Route::get('/organizations', [OrganizationController::class, 'index']);

        // Notifications
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
            Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
        });

        // Administration Area (Permission Enforced)
        Route::prefix('admin')->group(function () {

            // Users Management
            Route::prefix('users')->group(function () {
                Route::get('/', [UserController::class, 'index'])->middleware('permission:users.view');
                Route::post('/', [UserController::class, 'store'])->middleware('permission:users.create');
                Route::get('/{user}', [UserController::class, 'show'])->middleware('permission:users.view');
                Route::put('/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
                Route::delete('/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete');
                Route::post('/{user}/unlock', [UserController::class, 'unlock'])->middleware('permission:users.update');
                Route::post('/{user}/reset-password', [UserController::class, 'resetUserPassword'])->middleware('permission:users.update');
                Route::post('/{user}/revoke-sessions', [UserController::class, 'revokeSessions'])->middleware('permission:sessions.revoke');
            });

            // Roles Management
            Route::prefix('roles')->group(function () {
                Route::get('/', [RoleController::class, 'index'])->middleware('permission:roles.view');
                Route::post('/', [RoleController::class, 'store'])->middleware('permission:roles.create');
                Route::get('/{role}', [RoleController::class, 'show'])->middleware('permission:roles.view');
                Route::put('/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
                Route::delete('/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete');
            });

            // Permissions
            Route::get('/permissions', [PermissionController::class, 'index'])->middleware('permission:permissions.view');

            // Sessions Management
            Route::prefix('sessions')->group(function () {
                Route::get('/', [SessionController::class, 'index'])->middleware('permission:sessions.view');
                Route::delete('/{id}', [SessionController::class, 'destroy'])->middleware('permission:sessions.revoke');
                Route::post('/revoke-others', [SessionController::class, 'revokeOtherSessions']);
            });

            // Security Events
            Route::prefix('security-events')->group(function () {
                Route::get('/', [SecurityEventController::class, 'index'])->middleware('permission:security.view');
                Route::get('/stats', [SecurityEventController::class, 'stats'])->middleware('permission:security.view');
            });

            // Audit Logs
            Route::prefix('audit-logs')->group(function () {
                Route::get('/', [AuditLogController::class, 'index'])->middleware('permission:audit.view');
                Route::get('/{auditLog}', [AuditLogController::class, 'show'])->middleware('permission:audit.view');
            });

            // System Settings
            Route::prefix('settings')->group(function () {
                Route::get('/', [SystemSettingController::class, 'index'])->middleware('permission:settings.view');
                Route::post('/batch', [SystemSettingController::class, 'updateBatch'])->middleware('permission:settings.update');
                Route::post('/upload-icon', [SystemSettingController::class, 'uploadAppIcon'])->middleware('permission:settings.update');
                Route::delete('/remove-icon', [SystemSettingController::class, 'removeAppIcon'])->middleware('permission:settings.update');
            });

            // Recycle Bin (Tempat Sampah & Pemulihan Data)
            Route::prefix('recycle-bin')->group(function () {
                Route::get('/summary', [RecycleBinController::class, 'summary']);
                Route::post('/{entity}/bulk-restore', [RecycleBinController::class, 'bulkRestore']);
                Route::post('/{entity}/bulk-force-delete', [RecycleBinController::class, 'bulkForceDelete']);
                Route::get('/{entity}', [RecycleBinController::class, 'index']);
                Route::post('/{entity}/{id}/restore', [RecycleBinController::class, 'restore']);
                Route::delete('/{entity}/{id}/force', [RecycleBinController::class, 'forceDelete']);
            });

            // ================= PHASE 2: MASTER DATA & ORGANIZATION =================
            Route::prefix('master-data')->group(function () {
                // Universal CSV Import & Export Pipeline
                Route::post('/import/upload', [\App\Http\Controllers\Api\V1\MasterData\ImportExportController::class, 'uploadAndInspect']);
                Route::post('/import/validate', [\App\Http\Controllers\Api\V1\MasterData\ImportExportController::class, 'validateImport']);
                Route::post('/import/execute', [\App\Http\Controllers\Api\V1\MasterData\ImportExportController::class, 'executeImport']);
                Route::get('/import/template/{entity}', [\App\Http\Controllers\Api\V1\MasterData\ImportExportController::class, 'downloadTemplate']);
                Route::get('/export/{entity}', [\App\Http\Controllers\Api\V1\MasterData\ImportExportController::class, 'export']);
                Route::get('/import-export/history', [\App\Http\Controllers\Api\V1\MasterData\ImportExportController::class, 'history']);
                Route::get('/overview-counts', [\App\Http\Controllers\Api\V1\MasterData\CompanyController::class, 'overviewCounts']);

                // Companies
                Route::prefix('companies')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\CompanyController::class, 'index']);
                    Route::post('/', [\App\Http\Controllers\Api\V1\MasterData\CompanyController::class, 'store']);
                    Route::get('/{company}', [\App\Http\Controllers\Api\V1\MasterData\CompanyController::class, 'show']);
                    Route::put('/{company}', [\App\Http\Controllers\Api\V1\MasterData\CompanyController::class, 'update']);
                    Route::delete('/{company}', [\App\Http\Controllers\Api\V1\MasterData\CompanyController::class, 'destroy']);
                    Route::patch('/{company}/activate', [\App\Http\Controllers\Api\V1\MasterData\CompanyController::class, 'activate']);
                    Route::patch('/{company}/deactivate', [\App\Http\Controllers\Api\V1\MasterData\CompanyController::class, 'deactivate']);
                });

                // Sites
                Route::prefix('sites')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\SiteController::class, 'index']);
                    Route::post('/', [\App\Http\Controllers\Api\V1\MasterData\SiteController::class, 'store']);
                    Route::get('/{site}', [\App\Http\Controllers\Api\V1\MasterData\SiteController::class, 'show']);
                    Route::put('/{site}', [\App\Http\Controllers\Api\V1\MasterData\SiteController::class, 'update']);
                    Route::delete('/{site}', [\App\Http\Controllers\Api\V1\MasterData\SiteController::class, 'destroy']);
                    Route::patch('/{site}/activate', [\App\Http\Controllers\Api\V1\MasterData\SiteController::class, 'activate']);
                    Route::patch('/{site}/deactivate', [\App\Http\Controllers\Api\V1\MasterData\SiteController::class, 'deactivate']);
                });

                // Departments
                Route::prefix('departments')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\DepartmentController::class, 'index']);
                    Route::post('/', [\App\Http\Controllers\Api\V1\MasterData\DepartmentController::class, 'store']);
                    Route::get('/{department}', [\App\Http\Controllers\Api\V1\MasterData\DepartmentController::class, 'show']);
                    Route::put('/{department}', [\App\Http\Controllers\Api\V1\MasterData\DepartmentController::class, 'update']);
                    Route::delete('/{department}', [\App\Http\Controllers\Api\V1\MasterData\DepartmentController::class, 'destroy']);
                    Route::patch('/{department}/activate', [\App\Http\Controllers\Api\V1\MasterData\DepartmentController::class, 'activate']);
                    Route::patch('/{department}/deactivate', [\App\Http\Controllers\Api\V1\MasterData\DepartmentController::class, 'deactivate']);
                });

                // Sections
                Route::prefix('sections')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\SectionController::class, 'index']);
                    Route::post('/', [\App\Http\Controllers\Api\V1\MasterData\SectionController::class, 'store']);
                    Route::get('/{section}', [\App\Http\Controllers\Api\V1\MasterData\SectionController::class, 'show']);
                    Route::put('/{section}', [\App\Http\Controllers\Api\V1\MasterData\SectionController::class, 'update']);
                    Route::delete('/{section}', [\App\Http\Controllers\Api\V1\MasterData\SectionController::class, 'destroy']);
                    Route::patch('/{section}/activate', [\App\Http\Controllers\Api\V1\MasterData\SectionController::class, 'activate']);
                    Route::patch('/{section}/deactivate', [\App\Http\Controllers\Api\V1\MasterData\SectionController::class, 'deactivate']);
                });

                // Organization Units & Visual Tree
                Route::prefix('organization-units')->group(function () {
                    Route::get('/tree', [\App\Http\Controllers\Api\V1\MasterData\OrganizationUnitController::class, 'tree']);
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\OrganizationUnitController::class, 'index']);
                    Route::post('/', [\App\Http\Controllers\Api\V1\MasterData\OrganizationUnitController::class, 'store']);
                    Route::get('/{unit}', [\App\Http\Controllers\Api\V1\MasterData\OrganizationUnitController::class, 'show']);
                    Route::put('/{unit}', [\App\Http\Controllers\Api\V1\MasterData\OrganizationUnitController::class, 'update']);
                    Route::post('/{unit}/move', [\App\Http\Controllers\Api\V1\MasterData\OrganizationUnitController::class, 'move']);
                    Route::delete('/{unit}', [\App\Http\Controllers\Api\V1\MasterData\OrganizationUnitController::class, 'destroy']);
                    Route::patch('/{unit}/activate', [\App\Http\Controllers\Api\V1\MasterData\OrganizationUnitController::class, 'activate']);
                    Route::patch('/{unit}/deactivate', [\App\Http\Controllers\Api\V1\MasterData\OrganizationUnitController::class, 'deactivate']);
                });

                // Positions & Headcount Control
                Route::prefix('positions')->group(function () {
                    Route::get('/summary', [\App\Http\Controllers\Api\V1\MasterData\PositionController::class, 'summary']);
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\PositionController::class, 'index']);
                    Route::post('/', [\App\Http\Controllers\Api\V1\MasterData\PositionController::class, 'store']);
                    Route::get('/{position}', [\App\Http\Controllers\Api\V1\MasterData\PositionController::class, 'show']);
                    Route::put('/{position}', [\App\Http\Controllers\Api\V1\MasterData\PositionController::class, 'update']);
                    Route::delete('/{position}', [\App\Http\Controllers\Api\V1\MasterData\PositionController::class, 'destroy']);
                    Route::patch('/{position}/freeze', [\App\Http\Controllers\Api\V1\MasterData\PositionController::class, 'toggleFreeze']);
                    Route::patch('/{position}/activate', [\App\Http\Controllers\Api\V1\MasterData\PositionController::class, 'activate']);
                    Route::patch('/{position}/deactivate', [\App\Http\Controllers\Api\V1\MasterData\PositionController::class, 'deactivate']);
                });

                // Job Families, Jobs, Grades, Work Locations, Cost Centers
                Route::get('/job-families', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'jobFamilies']);
                Route::post('/job-families', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'storeJobFamily']);
                Route::get('/jobs', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'jobs']);
                Route::post('/jobs', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'storeJob']);
                Route::get('/grades', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'grades']);
                Route::post('/grades', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'storeGrade']);
                Route::put('/grades/{grade}', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'updateGrade']);
                Route::delete('/grades/{grade}', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'destroyGrade']);
                Route::get('/salary-grades', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'salaryGrades']);
                Route::post('/salary-grades', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'storeSalaryGrade']);
                Route::put('/salary-grades/{salaryGrade}', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'updateSalaryGrade']);
                Route::delete('/salary-grades/{salaryGrade}', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'destroySalaryGrade']);
                Route::get('/jenjang', [\App\Http\Controllers\Api\V1\MasterData\SalaryGradeJenjangController::class, 'index']);
                Route::post('/jenjang', [\App\Http\Controllers\Api\V1\MasterData\SalaryGradeJenjangController::class, 'store']);
                Route::get('/jenjang/{jenjang}', [\App\Http\Controllers\Api\V1\MasterData\SalaryGradeJenjangController::class, 'show']);
                Route::put('/jenjang/{jenjang}', [\App\Http\Controllers\Api\V1\MasterData\SalaryGradeJenjangController::class, 'update']);
                Route::delete('/jenjang/{jenjang}', [\App\Http\Controllers\Api\V1\MasterData\SalaryGradeJenjangController::class, 'destroy']);
                Route::get('/master-jenjang', [\App\Http\Controllers\Api\V1\MasterData\MasterJenjangController::class, 'index']);
                Route::post('/master-jenjang', [\App\Http\Controllers\Api\V1\MasterData\MasterJenjangController::class, 'store']);
                Route::get('/master-jenjang/{masterJenjang}', [\App\Http\Controllers\Api\V1\MasterData\MasterJenjangController::class, 'show']);
                Route::put('/master-jenjang/{masterJenjang}', [\App\Http\Controllers\Api\V1\MasterData\MasterJenjangController::class, 'update']);
                Route::delete('/master-jenjang/{masterJenjang}', [\App\Http\Controllers\Api\V1\MasterData\MasterJenjangController::class, 'destroy']);
                Route::get('/work-locations', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'workLocations']);
                Route::post('/work-locations', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'storeWorkLocation']);
                Route::get('/cost-centers', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'costCenters']);
                Route::post('/cost-centers', [\App\Http\Controllers\Api\V1\MasterData\JobAndGradeController::class, 'storeCostCenter']);

                // Employment Masters
                Route::prefix('employment-types')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'employmentTypes']);
                    Route::post('/', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'storeEmploymentType']);
                    Route::get('/{employmentType}', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'showEmploymentType']);
                    Route::put('/{employmentType}', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'updateEmploymentType']);
                    Route::delete('/{employmentType}', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'destroyEmploymentType']);
                    Route::patch('/{employmentType}/activate', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'activateEmploymentType']);
                    Route::patch('/{employmentType}/deactivate', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'deactivateEmploymentType']);
                });
                Route::get('/employment-statuses', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'employmentStatuses']);
                Route::post('/employment-statuses', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'storeEmploymentStatus']);
                Route::get('/worker-categories', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'workerCategories']);
                Route::post('/worker-categories', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'storeWorkerCategory']);
                Route::get('/employee-groups', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'employeeGroups']);
                Route::post('/employee-groups', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'storeEmployeeGroup']);
                Route::post('/employee-sub-groups', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'storeEmployeeSubGroup']);
                Route::get('/contract-types', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'contractTypes']);
                Route::post('/contract-types', [\App\Http\Controllers\Api\V1\MasterData\EmploymentMasterController::class, 'storeContractType']);

                // Benefit Plafonds (Pengobatan, Kacamata, Persalinan)
                Route::prefix('benefit-plafonds')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\BenefitPlafondController::class, 'index']);
                    Route::post('/', [\App\Http\Controllers\Api\V1\MasterData\BenefitPlafondController::class, 'store']);
                    Route::get('/{benefitPlafond}', [\App\Http\Controllers\Api\V1\MasterData\BenefitPlafondController::class, 'show']);
                    Route::put('/{benefitPlafond}', [\App\Http\Controllers\Api\V1\MasterData\BenefitPlafondController::class, 'update']);
                    Route::delete('/{benefitPlafond}', [\App\Http\Controllers\Api\V1\MasterData\BenefitPlafondController::class, 'destroy']);
                    Route::patch('/{benefitPlafond}/activate', [\App\Http\Controllers\Api\V1\MasterData\BenefitPlafondController::class, 'activate']);
                    Route::patch('/{benefitPlafond}/deactivate', [\App\Http\Controllers\Api\V1\MasterData\BenefitPlafondController::class, 'deactivate']);
                });

                // Time & Schedules
                Route::get('/shifts', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'shifts']);
                Route::post('/shifts', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'storeShift']);
                Route::put('/shifts/{shift}', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'updateShift']);
                Route::delete('/shifts/{shift}', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'destroyShift']);
                Route::get('/work-schedules', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'workSchedules']);
                Route::post('/work-schedules', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'storeWorkSchedule']);
                Route::put('/work-schedules/{workSchedule}', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'updateWorkSchedule']);
                Route::delete('/work-schedules/{workSchedule}', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'destroyWorkSchedule']);
                Route::get('/holiday-calendars', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'holidayCalendars']);
                Route::post('/holiday-calendars', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'storeHolidayCalendar']);
                Route::post('/holidays', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'storeHoliday']);
                Route::get('/work-calendars', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'workCalendars']);
                Route::post('/work-calendars', [\App\Http\Controllers\Api\V1\MasterData\ScheduleMasterController::class, 'storeWorkCalendar']);

                // Reference Data
                Route::get('/geographic', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'geographic']);
                Route::get('/standard', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'standard']);
                Route::post('/standard', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'storeStandard']);
                Route::put('/standard/{standard}', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'updateStandard']);
                Route::delete('/standard/{standard}', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'destroyStandard']);
                Route::get('/document-types', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'documentTypes']);
                Route::post('/document-types', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'storeDocumentType']);
                Route::put('/document-types/{documentType}', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'updateDocumentType']);
                Route::delete('/document-types/{documentType}', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'destroyDocumentType']);
                Route::get('/relationship-types', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'relationshipTypes']);
                Route::get('/termination-reasons', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'terminationReasons']);
                Route::get('/leave-types', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'leaveTypes']);
                Route::get('/overtime-types', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'overtimeTypes']);
                Route::get('/recruitment-sources', [\App\Http\Controllers\Api\V1\MasterData\ReferenceDataController::class, 'recruitmentSources']);

                // Custom Master Data
                Route::prefix('custom')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\CustomMasterController::class, 'index']);
                    Route::post('/categories', [\App\Http\Controllers\Api\V1\MasterData\CustomMasterController::class, 'storeCategory']);
                    Route::get('/categories/{category}', [\App\Http\Controllers\Api\V1\MasterData\CustomMasterController::class, 'showCategory']);
                    Route::post('/categories/{category}/values', [\App\Http\Controllers\Api\V1\MasterData\CustomMasterController::class, 'storeValue']);
                    Route::put('/values/{value}', [\App\Http\Controllers\Api\V1\MasterData\CustomMasterController::class, 'updateValue']);
                    Route::delete('/values/{value}', [\App\Http\Controllers\Api\V1\MasterData\CustomMasterController::class, 'deleteValue']);
                });
                // Company Documents & Policy Hub
                Route::prefix('company-documents')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Api\V1\MasterData\CompanyDocumentController::class, 'index']);
                    Route::post('/', [\App\Http\Controllers\Api\V1\MasterData\CompanyDocumentController::class, 'store']);
                    Route::get('/{id}', [\App\Http\Controllers\Api\V1\MasterData\CompanyDocumentController::class, 'show']);
                    Route::match(['put', 'post'], '/{id}', [\App\Http\Controllers\Api\V1\MasterData\CompanyDocumentController::class, 'update']);
                    Route::delete('/{id}', [\App\Http\Controllers\Api\V1\MasterData\CompanyDocumentController::class, 'destroy']);
                    Route::patch('/{id}/toggle-status', [\App\Http\Controllers\Api\V1\MasterData\CompanyDocumentController::class, 'toggleStatus']);
                    Route::get('/{id}/download', [\App\Http\Controllers\Api\V1\MasterData\CompanyDocumentController::class, 'download']);
                    Route::get('/{id}/preview', [\App\Http\Controllers\Api\V1\MasterData\CompanyDocumentController::class, 'preview']);
                });
            });

        });

        // ESS (Employee Self-Service) Portal Endpoints
        Route::prefix('ess')->group(function () {
            Route::prefix('documents')->group(function () {
                Route::get('/', [\App\Http\Controllers\Api\V1\Ess\EssDocumentController::class, 'index']);
                Route::get('/{id}', [\App\Http\Controllers\Api\V1\Ess\EssDocumentController::class, 'show']);
                Route::get('/{id}/preview', [\App\Http\Controllers\Api\V1\Ess\EssDocumentController::class, 'preview']);
                Route::get('/{id}/download', [\App\Http\Controllers\Api\V1\Ess\EssDocumentController::class, 'download']);
                Route::post('/{id}/read', [\App\Http\Controllers\Api\V1\Ess\EssDocumentController::class, 'markAsRead']);
            });
        });

    });

});

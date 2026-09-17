<?php

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\Grade;
use App\Models\OrganizationCompany;
use App\Models\OrganizationSite;
use App\Models\OrganizationUnit;
use App\Models\Position;
use App\Models\User;
use App\Services\HierarchyValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MasterDataAndOrganizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $this->seed(\Database\Seeders\Phase2MasterDataSeeder::class);

        $this->admin = User::where('username', 'admin')->first();
    }

    public function test_can_list_companies(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/master-data/companies');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertNotEmpty($response->json('data.data'));
    }

    public function test_can_create_and_deactivate_company(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/master-data/companies', [
                'code' => 'TEST-CO',
                'name' => 'PT Test Mining Energy',
                'legal_name' => 'PT Test Mining Energy Tbk',
                'country' => 'ID',
                'currency' => 'IDR',
                'status' => 'ACTIVE',
            ]);

        $response->assertStatus(201);
        $companyId = $response->json('data.id');

        // Deactivate company
        $deactivateResponse = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/v1/admin/master-data/companies/{$companyId}/deactivate");

        $deactivateResponse->assertStatus(200);
        $this->assertEquals('INACTIVE', $deactivateResponse->json('data.status'));
    }

    public function test_organization_tree_endpoint_returns_nested_hierarchy(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/master-data/organization-units/tree');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $tree = $response->json('data');

        $this->assertIsArray($tree);
        $this->assertNotEmpty($tree);
        $this->assertArrayHasKey('children', $tree[0]);
    }

    public function test_circular_reference_is_prevented_on_unit_move(): void
    {
        $ops = OrganizationUnit::where('code', 'DIR-OPS')->first();
        $pit = OrganizationUnit::where('code', 'DIV-PIT')->first();

        // Attempt to move parent into child
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/master-data/organization-units/{$ops->id}/move", [
                'new_parent_id' => $pit->id,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['parent_id']);
    }

    public function test_position_control_calculates_vacancy_and_headcount(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/master-data/positions/summary');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertGreaterThan(0, $data['total_positions']);
        $this->assertGreaterThan(0, $data['approved_headcount']);
        $this->assertEquals(
            $data['approved_headcount'] - $data['current_headcount'],
            $data['vacant_headcount']
        );
    }

    public function test_position_freeze_toggle(): void
    {
        $pos = Position::first();
        $this->assertFalse((bool)$pos->is_frozen);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/v1/admin/master-data/positions/{$pos->id}/freeze");

        $response->assertStatus(200);
        $this->assertTrue((bool)$response->json('data.is_frozen'));

        // Toggle unfreeze
        $responseUnfreeze = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/v1/admin/master-data/positions/{$pos->id}/freeze");

        $responseUnfreeze->assertStatus(200);
        $this->assertFalse((bool)$responseUnfreeze->json('data.is_frozen'));
    }

    public function test_csv_import_pipeline(): void
    {
        $csvContent = "code,name\nNEW-CO-01,PT Nuansa Tambang\nNEW-CO-02,PT Borneo Coal";
        $file = UploadedFile::fake()->createWithContent('companies.csv', $csvContent);

        // 1. Upload and Inspect
        $uploadResp = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/master-data/import/upload', [
                'file' => $file,
            ]);

        $uploadResp->assertStatus(200);
        $headers = $uploadResp->json('data.headers');
        $rows = $uploadResp->json('data.all_rows');

        // 2. Validate Import
        $valResp = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/master-data/import/validate', [
                'entity' => 'companies',
                'headers' => $headers,
                'rows' => $rows,
                'mapping' => [
                    'code' => 'code',
                    'name' => 'name',
                ],
            ]);

        $valResp->assertStatus(200);
        $this->assertTrue($valResp->json('data.is_valid'));
        $validData = $valResp->json('data.valid_data');

        // 3. Execute Import
        $execResp = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/master-data/import/execute', [
                'entity' => 'companies',
                'data' => $validData,
            ]);

        $execResp->assertStatus(200);
        $this->assertEquals(2, $execResp->json('data.imported_count'));
        $this->assertDatabaseHas('organization_companies', ['code' => 'NEW-CO-01']);
    }

    public function test_csv_export_endpoint(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/v1/admin/master-data/export/companies');

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }
}

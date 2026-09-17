<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EnterpriseFoundationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_api_login_returns_token_and_request_id(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'Password@123',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('X-Request-ID');
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'token',
                'session_id',
                'user' => [
                    'id',
                    'username',
                    'roles',
                    'permissions',
                    'data_scope',
                ]
            ],
            'request_id',
        ]);
        $this->assertTrue($response->json('success'));
        $this->assertEquals('GLOBAL', $response->json('data.user.data_scope'));
    }

    public function test_api_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'success' => false,
            'code' => 'INVALID_CREDENTIALS',
        ]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/admin/users');

        $response->assertStatus(401);
        $response->assertJson([
            'success' => false,
            'code' => 'UNAUTHENTICATED',
        ]);
    }

    public function test_authenticated_admin_can_list_users(): void
    {
        $admin = User::where('username', 'admin')->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
            'meta' => ['current_page', 'last_page', 'total'],
            'request_id',
        ]);
    }

    public function test_unauthorized_permission_is_rejected(): void
    {
        $employee = User::where('username', 'employee_demo')->first();

        // Employee does not have roles.view or settings.update
        $response = $this->actingAs($employee, 'sanctum')
            ->getJson('/api/v1/admin/roles');

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'code' => 'FORBIDDEN',
        ]);
    }

    public function test_audit_log_records_user_creation_with_actor(): void
    {
        $admin = User::where('username', 'admin')->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'username' => 'test_engineer',
                'name' => 'Test Mining Engineer',
                'email' => 'engineer.test@cmn.mining.local',
                'password' => 'Password@123',
                'status' => 'ACTIVE',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'CREATE',
            'module' => 'users',
            'actor_id' => $admin->id,
        ]);
    }

    public function test_account_locks_after_repeated_failed_logins(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'username' => 'employee_demo',
                'password' => 'WrongPassword!',
            ]);
        }

        $user = User::where('username', 'employee_demo')->first();
        $this->assertEquals('LOCKED', $user->status);
        $this->assertNotNull($user->locked_until);

        // Attempting to login now should return 423 Account Locked
        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'employee_demo',
            'password' => 'Password@123',
        ]);
        $response->assertStatus(423);
        $response->assertJson(['code' => 'ACCOUNT_LOCKED']);
    }

    public function test_password_policy_rejects_weak_passwords(): void
    {
        $admin = User::where('username', 'admin')->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'username' => 'weak_user',
                'name' => 'Weak Password User',
                'email' => 'weak@cmn.mining.local',
                'password' => 'simplepassword', // length 14, but violates uppercase, number, special char
            ]);

        $response->assertStatus(422);
        $response->assertJson(['code' => 'PASSWORD_POLICY_VIOLATION']);
    }

    public function test_session_can_be_revoked(): void
    {
        $admin = User::where('username', 'admin')->first();

        // Login to obtain a session
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'Password@123',
        ]);
        $sessionId = $loginRes->json('data.session_id');

        $this->assertDatabaseHas('user_sessions', [
            'id' => $sessionId,
            'revoked_at' => null,
        ]);

        $delRes = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/sessions/{$sessionId}");

        $delRes->assertStatus(200);

        $this->assertDatabaseMissing('user_sessions', [
            'id' => $sessionId,
            'revoked_at' => null,
        ]);
    }
}

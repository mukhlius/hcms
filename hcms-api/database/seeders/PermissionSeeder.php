<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $permissionDefs = [
                // 1. Users Management
                ['name' => 'users.view', 'display_name' => 'Lihat Data Pengguna', 'group' => 'users', 'description' => 'Melihat daftar dan detail pengguna sistem'],
                ['name' => 'users.create', 'display_name' => 'Tambah Pengguna Baru', 'group' => 'users', 'description' => 'Membuat akun pengguna baru'],
                ['name' => 'users.update', 'display_name' => 'Ubah Data Pengguna', 'group' => 'users', 'description' => 'Memperbarui profil, status, dan data pengguna'],
                ['name' => 'users.delete', 'display_name' => 'Hapus Pengguna', 'group' => 'users', 'description' => 'Menghapus (soft delete) akun pengguna'],
                ['name' => 'users.approve', 'display_name' => 'Setujui Perubahan Pengguna', 'group' => 'users', 'description' => 'Menyetujui perubahan data sensitif pengguna'],
                ['name' => 'users.reject', 'display_name' => 'Tolak Perubahan Pengguna', 'group' => 'users', 'description' => 'Menolak pengajuan perubahan data pengguna'],
                ['name' => 'users.verify', 'display_name' => 'Verifikasi Identitas Pengguna', 'group' => 'users', 'description' => 'Memverifikasi dokumen dan identitas akun'],
                ['name' => 'users.export', 'display_name' => 'Ekspor Data Pengguna', 'group' => 'users', 'description' => 'Mengunduh laporan data pengguna (Excel/CSV)'],
                ['name' => 'users.import', 'display_name' => 'Impor Data Pengguna', 'group' => 'users', 'description' => 'Mengunggah dan mengimpor data pengguna massal'],
                ['name' => 'users.print', 'display_name' => 'Cetak Profil Pengguna', 'group' => 'users', 'description' => 'Mencetak berkas dan profil data pengguna'],
                ['name' => 'users.download', 'display_name' => 'Unduh Dokumen Pengguna', 'group' => 'users', 'description' => 'Mengunduh lampiran berkas akun pengguna'],
                ['name' => 'users.upload', 'display_name' => 'Unggah Dokumen Pengguna', 'group' => 'users', 'description' => 'Mengunggah berkas identitas akun pengguna'],
                ['name' => 'users.execute', 'display_name' => 'Eksekusi Aksi Khusus Pengguna', 'group' => 'users', 'description' => 'Menjalankan tindakan khusus seperti unlock atau force reset'],

                // 2. Employees (Personel & Pegawai)
                ['name' => 'employees.view', 'display_name' => 'Lihat Data Karyawan', 'group' => 'employees', 'description' => 'Melihat profil dan direktori data pegawai'],
                ['name' => 'employees.create', 'display_name' => 'Tambah Data Karyawan', 'group' => 'employees', 'description' => 'Mendaftarkan pegawai baru ke dalam sistem'],
                ['name' => 'employees.update', 'display_name' => 'Ubah Data Karyawan', 'group' => 'employees', 'description' => 'Memperbarui data personal, karir, dan penugasan pegawai'],
                ['name' => 'employees.delete', 'display_name' => 'Hapus Data Karyawan', 'group' => 'employees', 'description' => 'Menghapus data pegawai dari sistem'],
                ['name' => 'employees.approve', 'display_name' => 'Persetujuan Data Karyawan', 'group' => 'employees', 'description' => 'Menyetujui perubahan data profil pegawai'],
                ['name' => 'employees.export', 'display_name' => 'Ekspor Data Karyawan', 'group' => 'employees', 'description' => 'Mengekspor rekapitulasi data karyawan'],
                ['name' => 'employees.import', 'display_name' => 'Impor Data Karyawan', 'group' => 'employees', 'description' => 'Mengimpor data pegawai dari file eksternal'],

                // 3. Roles & Akses
                ['name' => 'roles.view', 'display_name' => 'Lihat Peran (Roles)', 'group' => 'roles', 'description' => 'Melihat daftar peran sistem dan hierarki hak akses'],
                ['name' => 'roles.create', 'display_name' => 'Tambah Peran Baru', 'group' => 'roles', 'description' => 'Membuat definisi peran hak akses baru'],
                ['name' => 'roles.update', 'display_name' => 'Ubah Peran', 'group' => 'roles', 'description' => 'Mengubah konfigurasi peran dan matriks izin'],
                ['name' => 'roles.delete', 'display_name' => 'Hapus Peran', 'group' => 'roles', 'description' => 'Menghapus definisi peran yang tidak digunakan'],

                // 4. Permissions
                ['name' => 'permissions.view', 'display_name' => 'Lihat Katalog Izin', 'group' => 'permissions', 'description' => 'Melihat seluruh katalog izin wewenang sistem'],
                ['name' => 'permissions.assign', 'display_name' => 'Tetapkan Izin ke Peran/User', 'group' => 'permissions', 'description' => 'Menetapkan dan mencabut izin wewenang'],

                // 5. Struktur Organisasi
                ['name' => 'organization.view', 'display_name' => 'Lihat Struktur Organisasi', 'group' => 'organization', 'description' => 'Melihat bagan organisasi, unit kerja, site, dan departemen'],
                ['name' => 'organization.create', 'display_name' => 'Tambah Unit Organisasi', 'group' => 'organization', 'description' => 'Membuat unit organisasi baru dalam bagan'],
                ['name' => 'organization.update', 'display_name' => 'Ubah Unit Organisasi', 'group' => 'organization', 'description' => 'Memperbarui nama dan hierarki unit organisasi'],
                ['name' => 'organization.delete', 'display_name' => 'Hapus Unit Organisasi', 'group' => 'organization', 'description' => 'Menghapus unit organisasi'],
                ['name' => 'organization.move', 'display_name' => 'Pindahkan Unit Organisasi', 'group' => 'organization', 'description' => 'Melakukan restrukturisasi dan memindahkan unit kerja'],
                ['name' => 'organizations.view', 'display_name' => 'Akses Menu Organisasi (Web)', 'group' => 'organization', 'description' => 'Membuka menu dan navigasi struktur organisasi di portal'],

                // 6. Jabatan & Posisi
                ['name' => 'position.view', 'display_name' => 'Lihat Posisi & Jabatan', 'group' => 'position', 'description' => 'Melihat daftar posisi jabatan dan headcount'],
                ['name' => 'position.create', 'display_name' => 'Tambah Posisi Jabatan', 'group' => 'position', 'description' => 'Mendefinisikan posisi jabatan baru'],
                ['name' => 'position.update', 'display_name' => 'Ubah Posisi Jabatan', 'group' => 'position', 'description' => 'Memperbarui spesifikasi dan kuota formasi posisi'],
                ['name' => 'position.delete', 'display_name' => 'Hapus Posisi Jabatan', 'group' => 'position', 'description' => 'Menghapus posisi jabatan dari struktur'],
                ['name' => 'position.freeze', 'display_name' => 'Bekukan/Aktifkan Formasi Posisi', 'group' => 'position', 'description' => 'Mengunci atau membuka formasi rekrutmen posisi'],

                // 7. Data Master HCMS
                ['name' => 'master-data.view', 'display_name' => 'Lihat Master Data', 'group' => 'master-data', 'description' => 'Melihat seluruh referensi master data HCMS'],
                ['name' => 'master-data.create', 'display_name' => 'Tambah Master Data', 'group' => 'master-data', 'description' => 'Menambahkan data referensi standar baru'],
                ['name' => 'master-data.update', 'display_name' => 'Ubah Master Data', 'group' => 'master-data', 'description' => 'Mengedit nilai dan kode referensi master data'],
                ['name' => 'master-data.delete', 'display_name' => 'Hapus Master Data', 'group' => 'master-data', 'description' => 'Menghapus referensi master data'],
                ['name' => 'master-data.import', 'display_name' => 'Impor Master Data', 'group' => 'master-data', 'description' => 'Melakukan impor massal master data dari spreadsheet'],
                ['name' => 'master-data.export', 'display_name' => 'Ekspor Master Data', 'group' => 'master-data', 'description' => 'Mengunduh referensi master data ke file'],

                // 8. Dokumen Perusahaan & Kebijakan
                ['name' => 'company-documents.view', 'display_name' => 'Lihat Dokumen Perusahaan', 'group' => 'company-documents', 'description' => 'Melihat daftar dokumen regulasi dan SOP perusahaan'],
                ['name' => 'company-documents.create', 'display_name' => 'Unggah Dokumen Perusahaan', 'group' => 'company-documents', 'description' => 'Mengunggah kebijakan atau surat edaran baru'],
                ['name' => 'company-documents.update', 'display_name' => 'Ubah Dokumen Perusahaan', 'group' => 'company-documents', 'description' => 'Memperbarui metadata dokumen perusahaan'],
                ['name' => 'company-documents.delete', 'display_name' => 'Hapus Dokumen Perusahaan', 'group' => 'company-documents', 'description' => 'Menghapus dokumen perusahaan dari portal'],
                ['name' => 'company-documents.download', 'display_name' => 'Unduh Dokumen Perusahaan', 'group' => 'company-documents', 'description' => 'Mengunduh salinan berkas dokumen perusahaan'],

                // 9. Tempat Sampah & Pemulihan (Recycle Bin)
                ['name' => 'recycle-bin.view', 'display_name' => 'Lihat Tempat Sampah', 'group' => 'recycle-bin', 'description' => 'Melihat daftar data yang terhapus sementara'],
                ['name' => 'recycle-bin.restore', 'display_name' => 'Pulihkan Data Terhapus', 'group' => 'recycle-bin', 'description' => 'Mengembalikan data dari tempat sampah'],
                ['name' => 'recycle-bin.force-delete', 'display_name' => 'Hapus Permanen Data', 'group' => 'recycle-bin', 'description' => 'Menghapus data secara permanen dari sistem'],

                // 10. Keamanan & Kebijakan Akses
                ['name' => 'security.view', 'display_name' => 'Lihat Event Keamanan', 'group' => 'security', 'description' => 'Melihat log percobaan login, anomali, dan ancaman keamanan'],
                ['name' => 'security.manage', 'display_name' => 'Kelola Kebijakan Keamanan', 'group' => 'security', 'description' => 'Mengonfigurasi parameter lockout dan keamanan'],

                // 11. Manajemen Sesi Pengguna
                ['name' => 'sessions.view', 'display_name' => 'Lihat Sesi Pengguna', 'group' => 'sessions', 'description' => 'Melihat daftar perangkat dan sesi pengguna yang sedang aktif'],
                ['name' => 'sessions.revoke', 'display_name' => 'Putus Sesi Aktif (Revoke)', 'group' => 'sessions', 'description' => 'Memutuskan sesi aktif pengguna dari jarak jauh'],

                // 12. Audit Trail
                ['name' => 'audit.view', 'display_name' => 'Lihat Audit Trail', 'group' => 'audit', 'description' => 'Melihat riwayat jejak audit setiap aktivitas pengguna'],
                ['name' => 'audit.export', 'display_name' => 'Ekspor Audit Trail', 'group' => 'audit', 'description' => 'Mengekspor laporan audit trail kepatuhan'],

                // 13. Pengaturan Sistem (Settings)
                ['name' => 'settings.view', 'display_name' => 'Lihat Pengaturan Sistem', 'group' => 'settings', 'description' => 'Melihat parameter konfigurasi sistem HCMS'],
                ['name' => 'settings.update', 'display_name' => 'Ubah Pengaturan Sistem', 'group' => 'settings', 'description' => 'Menyimpan konfigurasi branding, timezone, dan preferensi'],
                ['name' => 'admin.access', 'display_name' => 'Akses Administrator Console', 'group' => 'settings', 'description' => 'Izin wewenang untuk membuka dan mengakses Administrator Console'],

                // 14. Alur Kerja (Workflow)
                ['name' => 'workflow.view', 'display_name' => 'Lihat Definisi Workflow', 'group' => 'workflow', 'description' => 'Melihat diagram tahapan alur persetujuan'],
                ['name' => 'workflow.create', 'display_name' => 'Buat Alur Workflow', 'group' => 'workflow', 'description' => 'Mendefinisikan alur workflow persetujuan baru'],
                ['name' => 'workflow.update', 'display_name' => 'Ubah Alur Workflow', 'group' => 'workflow', 'description' => 'Memodifikasi urutan verifikasi approval'],
                ['name' => 'workflow.execute', 'display_name' => 'Eksekusi Persetujuan Workflow', 'group' => 'workflow', 'description' => 'Melakukan tindakan persetujuan atau penolakan tiket workflow'],

                // 15. Approvals (Persetujuan Manajerial)
                ['name' => 'approvals.view', 'display_name' => 'Lihat Daftar Antrean Persetujuan', 'group' => 'approvals', 'description' => 'Melihat antrean pengajuan cuti, lembur, dan izin bawahan'],
                ['name' => 'approvals.execute', 'display_name' => 'Proses Persetujuan Pengajuan', 'group' => 'approvals', 'description' => 'Menyetujui atau menolak permohonan bawahan'],

                // 16. Manager Self-Service (MSS)
                ['name' => 'mss.view', 'display_name' => 'Akses Portal Manajerial (MSS)', 'group' => 'mss', 'description' => 'Membuka portal manajemen bawahan dan tim kerja'],
                ['name' => 'mss.team', 'display_name' => 'Kelola Anggota Tim', 'group' => 'mss', 'description' => 'Melihat profil dan penugasan anggota tim bawahan'],
                ['name' => 'mss.attendance', 'display_name' => 'Pantau Presensi Tim', 'group' => 'mss', 'description' => 'Memonitor catatan absensi dan kehadiran bawahan langsung'],
                ['name' => 'mss.roster', 'display_name' => 'Kelola Roster Kerja Tim', 'group' => 'mss', 'description' => 'Mengatur jadwal roster lapangan tambang bagi tim'],
                ['name' => 'mss.performance', 'display_name' => 'Evaluasi Kinerja Tim', 'group' => 'mss', 'description' => 'Memberikan review evaluasi kinerja anggota tim'],

                // 17. Employee Self-Service (ESS)
                ['name' => 'ess.view', 'display_name' => 'Akses Portal Mandiri (ESS)', 'group' => 'ess', 'description' => 'Membuka menu portal mandiri karyawan'],
                ['name' => 'ess.attendance', 'display_name' => 'Akses Presensi Mandiri', 'group' => 'ess', 'description' => 'Melihat jadwal kerja dan riwayat absensi pribadi'],
                ['name' => 'ess.leave', 'display_name' => 'Pengajuan Cuti Mandiri', 'group' => 'ess', 'description' => 'Mengajukan dan memantau permohonan cuti tahunan/roster'],
                ['name' => 'ess.overtime', 'display_name' => 'Pengajuan Lembur Mandiri', 'group' => 'ess', 'description' => 'Mengajukan surat perintah lembur (SPL)'],
                ['name' => 'ess.claims', 'display_name' => 'Pengajuan Klaim & Reimburse', 'group' => 'ess', 'description' => 'Mengajukan klaim kesehatan dan perjalanan dinas'],
                ['name' => 'ess.payslip', 'display_name' => 'Akses Slip Gaji Mandiri', 'group' => 'ess', 'description' => 'Melihat dan mengunduh rincian slip gaji pribadi'],
                ['name' => 'ess.documents', 'display_name' => 'Akses Dokumen Karyawan', 'group' => 'ess', 'description' => 'Melihat dokumen dan sertifikasi kompetensi pribadi'],
            ];

            // 1. Simpan/Perbarui seluruh permission
            $allCreatedPermissions = [];
            foreach ($permissionDefs as $def) {
                $perm = Permission::updateOrCreate(
                    ['name' => $def['name']],
                    [
                        'display_name' => $def['display_name'],
                        'group' => $def['group'],
                        'description' => $def['description'],
                    ]
                );
                $allCreatedPermissions[$def['name']] = $perm->id;
            }

            $allPermissionIds = array_values($allCreatedPermissions);

            // 2. Perbarui Role SUPER_ADMIN (Mendapatkan 100% Seluruh Izin)
            $superAdmin = Role::whereIn('name', ['SUPER_ADMIN', 'super_admin'])->first();
            if ($superAdmin) {
                $superAdmin->permissions()->sync($allPermissionIds);
            }

            // 3. Perbarui Role HC_ADMIN
            $hcAdmin = Role::whereIn('name', ['HC_ADMIN', 'hc_admin'])->first();
            if ($hcAdmin) {
                $hcAdminPermissions = Permission::whereIn('group', [
                    'users', 'employees', 'roles', 'permissions', 'organization',
                    'position', 'master-data', 'company-documents', 'recycle-bin',
                    'security', 'sessions', 'audit', 'settings', 'workflow',
                    'approvals', 'mss', 'ess'
                ])->pluck('id')->toArray();
                $hcAdmin->permissions()->sync($hcAdminPermissions);
            }

            // 4. Perbarui Role HC_MANAGER (Site Level Management)
            $hcManager = Role::whereIn('name', ['HC_MANAGER', 'hc_manager'])->first();
            if ($hcManager) {
                $hcManagerPermissions = Permission::whereIn('name', [
                    'admin.access',
                    'users.view', 'users.create', 'users.update', 'users.approve', 'users.export',
                    'employees.view', 'employees.create', 'employees.update', 'employees.approve', 'employees.export',
                    'organization.view', 'organizations.view', 'position.view', 'master-data.view',
                    'company-documents.view', 'company-documents.download',
                    'audit.view', 'workflow.view', 'workflow.execute',
                    'approvals.view', 'approvals.execute', 'mss.view', 'mss.team', 'mss.attendance',
                    'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.documents'
                ])->pluck('id')->toArray();
                $hcManager->permissions()->sync($hcManagerPermissions);
            }

            // 5. Perbarui Role HC_OFFICER (Operations Officer)
            $hcOfficer = Role::whereIn('name', ['HC_OFFICER', 'hc_officer'])->first();
            if ($hcOfficer) {
                $hcOfficerPermissions = Permission::whereIn('name', [
                    'admin.access',
                    'users.view', 'users.create', 'users.update',
                    'employees.view', 'employees.create', 'employees.update',
                    'organization.view', 'organizations.view', 'position.view', 'master-data.view',
                    'company-documents.view', 'company-documents.download',
                    'workflow.view',
                    'ess.view', 'ess.attendance', 'ess.leave', 'ess.documents'
                ])->pluck('id')->toArray();
                $hcOfficer->permissions()->sync($hcOfficerPermissions);
            }

            // 6. Perbarui Role MANAGER (Department Manager)
            $manager = Role::whereIn('name', ['MANAGER', 'manager'])->first();
            if ($manager) {
                $managerPermissions = Permission::whereIn('name', [
                    'company-documents.view', 'company-documents.download',
                    'workflow.view', 'workflow.execute',
                    'approvals.view', 'approvals.execute',
                    'mss.view', 'mss.team', 'mss.attendance', 'mss.roster', 'mss.performance',
                    'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.claims', 'ess.payslip', 'ess.documents'
                ])->pluck('id')->toArray();
                $manager->permissions()->sync($managerPermissions);
            }

            // 7. Perbarui Role SUPERVISOR (Pit / Shift Supervisor)
            $supervisor = Role::whereIn('name', ['SUPERVISOR', 'supervisor'])->first();
            if ($supervisor) {
                $supervisorPermissions = Permission::whereIn('name', [
                    'company-documents.view', 'company-documents.download',
                    'workflow.view', 'workflow.execute',
                    'approvals.view', 'approvals.execute',
                    'mss.view', 'mss.team', 'mss.attendance', 'mss.roster',
                    'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.claims', 'ess.payslip', 'ess.documents'
                ])->pluck('id')->toArray();
                $supervisor->permissions()->sync($supervisorPermissions);
            }

            // 8. Perbarui Role EMPLOYEE (Self-Service)
            $employee = Role::whereIn('name', ['EMPLOYEE', 'employee'])->first();
            if ($employee) {
                $employeePermissions = Permission::whereIn('name', [
                    'company-documents.view', 'company-documents.download',
                    'ess.view', 'ess.attendance', 'ess.leave', 'ess.overtime', 'ess.claims', 'ess.payslip', 'ess.documents'
                ])->pluck('id')->toArray();
                $employee->permissions()->sync($employeePermissions);
            }

            // 9. Pastikan Akun Demo Lengkap
            $defaultPassword = \Illuminate\Support\Facades\Hash::make('Password@123');
            $mgrRole = Role::whereIn('name', ['MANAGER', 'manager'])->first();
            $mgr = \App\Models\User::firstOrCreate(
                ['username' => 'mgr_ops'],
                [
                    'uuid' => (string) \Illuminate\Support\Str::uuid(),
                    'name' => 'Hendra Wijaya (Operations Manager)',
                    'email' => 'mgr.ops@cmn.mining.local',
                    'password' => $defaultPassword,
                    'status' => 'ACTIVE',
                    'company_id' => \App\Models\OrganizationCompany::first()?->id,
                    'site_id' => \App\Models\OrganizationSite::first()?->id,
                    'department_id' => \App\Models\OrganizationDepartment::first()?->id,
                    'force_password_change' => false,
                ]
            );
            if ($mgrRole && !$mgr->roles->contains($mgrRole->id)) {
                $mgr->roles()->attach($mgrRole->id);
            }

            // Pastikan password akun demo standar
            \App\Models\User::whereIn('username', ['admin', 'hc_admin', 'hc_sgt', 'spv_ops', 'mgr_ops', 'employee_demo'])
                ->update(['status' => 'ACTIVE', 'password' => $defaultPassword, 'locked_until' => null, 'failed_login_attempts' => 0]);
        });
    }
}

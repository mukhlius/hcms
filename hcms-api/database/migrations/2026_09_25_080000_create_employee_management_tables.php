<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. TABEL UTAMA: employees
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Identitas Pokok & Registrasi
            $table->string('nrp', 30)->unique()->index();
            $table->string('name');
            $table->string('nickname', 50)->nullable();
            $table->enum('gender', ['MALE', 'FEMALE'])->default('MALE');
            $table->string('birth_place', 100)->nullable();
            $table->date('birth_date');
            $table->string('religion', 30)->nullable(); // ISLAM, KRISTEN, KATOLIK, HINDU, BUDDHA, KHONGHUCU
            $table->string('marital_status', 30)->default('SINGLE'); // SINGLE, MARRIED, WIDOW, WIDOWER
            $table->date('marriage_date')->nullable();
            
            // Dokumen Legal & Pajak
            $table->string('id_card_number', 25)->nullable()->index(); // NIK KTP
            $table->string('tax_number', 30)->nullable(); // NPWP
            $table->string('tax_status', 10)->nullable(); // Status Pajak PTKP (TK/0, K/0, K/1, K/2, K/3, dst.)
            
            // Asuransi & Jaminan Sosial
            $table->string('bpjs_ketenagakerjaan', 30)->nullable();
            $table->string('bpjs_kesehatan', 30)->nullable();
            $table->string('insurance_admedika', 50)->nullable();
            
            // Kontak
            $table->string('email_company', 100)->nullable();
            $table->string('email_personal', 100)->nullable();
            $table->string('phone_mobile', 30)->nullable();
            $table->string('phone_home', 30)->nullable();
            
            // Alamat Sesuai KTP (Legal)
            $table->text('ktp_address')->nullable();
            $table->string('ktp_city', 100)->nullable();
            $table->string('ktp_province', 100)->nullable();
            $table->string('ktp_postal_code', 10)->nullable();
            
            // Alamat Tinggal Saat Ini (Domisili)
            $table->text('residential_address')->nullable();
            $table->string('residential_city', 100)->nullable();
            $table->string('residential_province', 100)->nullable();
            $table->string('residential_postal_code', 10)->nullable();
            
            // Alamat Surat / Korespondensi
            $table->text('mailing_address')->nullable();
            $table->string('mailing_city', 100)->nullable();
            $table->string('mailing_province', 100)->nullable();
            $table->string('mailing_postal_code', 10)->nullable();
            
            // Penempatan & Struktur Organisasi
            $table->foreignId('company_id')->nullable()->constrained('organization_companies')->nullOnDelete();
            $table->foreignId('site_id')->nullable()->constrained('organization_sites')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('organization_departments')->nullOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('organization_sections')->nullOnDelete();
            $table->foreignId('position_id')->nullable()->constrained('positions')->nullOnDelete();
            $table->foreignId('grade_id')->nullable()->constrained('grades')->nullOnDelete();
            $table->foreignId('salary_grade_jenjang_id')->nullable()->constrained('salary_grade_jenjang')->nullOnDelete();
            $table->foreignId('employment_type_id')->nullable()->constrained('employment_types')->nullOnDelete();
            
            // Parameter Operasional Tambang & Hubungan Kerja
            $table->string('poh', 100)->nullable(); // Point of Hire (Jakarta, Balikpapan, Lokal Site, dll)
            $table->date('hire_date');
            $table->date('probation_end_date')->nullable();
            $table->date('contract_end_date')->nullable();
            $table->string('employment_status', 30)->default('ACTIVE')->index(); // ACTIVE, PROBATION, SUSPENDED, RESIGNED, TERMINATED
            
            // Profil Tambahan
            $table->text('photo_url')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. TABEL KELUARGA & TANGGUNGAN: employee_families
        Schema::create('employee_families', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->enum('relation_type', ['SPOUSE', 'CHILD', 'FATHER', 'MOTHER', 'FATHER_IN_LAW', 'MOTHER_IN_LAW', 'OTHER']);
            $table->unsignedInteger('child_order')->nullable(); // Urutan anak (1, 2, 3...) jika relation_type = CHILD
            $table->string('name');
            $table->enum('gender', ['MALE', 'FEMALE'])->nullable();
            $table->string('birth_place', 100)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('id_card_number', 25)->nullable(); // NIK KTP / KIA
            $table->string('health_provider_no', 50)->nullable(); // Nomor Asuransi / BPJS
            $table->boolean('is_covered_insurance')->default(true);
            $table->boolean('is_alive')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. TABEL RIWAYAT PENDIDIKAN: employee_educations
        Schema::create('employee_educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('level', 20); // SD, SMP, SMA, SMK, D1, D2, D3, D4, S1, S2, S3
            $table->string('institution_name'); // Nama Sekolah / Kampus
            $table->string('major', 100)->nullable(); // Jurusan
            $table->unsignedSmallInteger('graduation_year')->nullable();
            $table->decimal('gpa', 4, 2)->nullable(); // IPK / Nilai
            $table->boolean('is_highest')->default(false);
            $table->timestamps();
        });

        // 4. TABEL KONTAK DARURAT: employee_emergency_contacts
        Schema::create('employee_emergency_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('name');
            $table->string('relationship', 50); // Istri, Suami, Ayah, Ibu, Saudara, dll
            $table->string('phone_number', 30);
            $table->text('address')->nullable();
            $table->boolean('is_primary')->default(true);
            $table->timestamps();
        });

        // 5. TABEL DATA FISIK & APD TAMBANG: employee_health_safeties
        Schema::create('employee_health_safeties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->unique()->constrained('employees')->cascadeOnDelete();
            $table->string('blood_type', 5)->nullable(); // A, B, AB, O
            $table->string('rhesus', 5)->nullable(); // +, -
            $table->decimal('height_cm', 5, 2)->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->string('shirt_size', 10)->nullable(); // S, M, L, XL, XXL, XXXL
            $table->string('pants_size', 10)->nullable(); // 28, 30, 32, 34, dst
            $table->string('safety_shoe_size', 10)->nullable(); // 38, 39, 40, 41, 42, dst
            $table->string('coverall_size', 10)->nullable();
            $table->text('medical_notes')->nullable(); // Riwayat alergi obat, penyakit bawaan
            $table->timestamps();
        });

        // 6. TABEL REKENING BANK / PAYROLL: employee_bank_accounts
        Schema::create('employee_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('bank_name', 50); // BCA, MANDIRI, BRI, BNI, dll
            $table->string('account_number', 40);
            $table->string('account_holder'); // Atas Nama Rekening
            $table->boolean('is_payroll_primary')->default(true);
            $table->timestamps();
        });

        // 7. TABEL RIWAYAT KARIR & MUTASI (IMMUTABLE SNAPSHOT): employee_career_histories
        Schema::create('employee_career_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            
            // Parameter Gerakan Karir
            $table->string('movement_type', 30); // HIRE, PROMOTION, ROTATION, MUTATION_SITE, DEMOTION, STATUS_CHANGE, TERMINATION
            $table->string('letter_number')->nullable(); // No SK
            $table->date('letter_date')->nullable();
            $table->date('effective_date'); // TMT Berlaku
            $table->date('end_date')->nullable(); // Tanggal Berakhir
            $table->boolean('is_current')->default(false); // Posisi berjalan saat ini
            
            // Foreign Key Pelacak (Internal Reference)
            $table->foreignId('position_id')->nullable()->constrained('positions')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('organization_departments')->nullOnDelete();
            $table->foreignId('site_id')->nullable()->constrained('organization_sites')->nullOnDelete();
            $table->foreignId('grade_id')->nullable()->constrained('grades')->nullOnDelete();
            $table->foreignId('salary_grade_jenjang_id')->nullable()->constrained('salary_grade_jenjang')->nullOnDelete();
            $table->foreignId('employment_type_id')->nullable()->constrained('employment_types')->nullOnDelete();
            
            // SNAPSHOT BAKU (Tidak akan berubah meskipun master diubah/dihapus)
            $table->string('position_title_snapshot');
            $table->string('department_name_snapshot');
            $table->string('site_name_snapshot');
            $table->string('grade_name_snapshot')->nullable();
            $table->string('pangkat_snapshot')->nullable();
            $table->string('level_jenjang_snapshot')->nullable();
            $table->string('poh_snapshot')->nullable();
            $table->string('employment_type_snapshot')->nullable();
            
            // Catatan & Pengesahan
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->text('sk_file_url')->nullable();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_career_histories');
        Schema::dropIfExists('employee_bank_accounts');
        Schema::dropIfExists('employee_health_safeties');
        Schema::dropIfExists('employee_emergency_contacts');
        Schema::dropIfExists('employee_educations');
        Schema::dropIfExists('employee_families');
        Schema::dropIfExists('employees');
    }
};

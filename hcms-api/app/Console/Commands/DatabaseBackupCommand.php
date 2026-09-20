<?php

namespace App\Console\Commands;

use App\Services\DatabaseBackupService;
use Illuminate\Console\Command;

class DatabaseBackupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup 
                            {--keep=30 : Jumlah hari retensi file backup lama}
                            {--note= : Catatan tambahan untuk backup ini}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Melakukan snapshot backup database HCMS secara terjadwal atau manual';

    /**
     * Execute the console command.
     */
    public function handle(DatabaseBackupService $backupService): int
    {
        $this->info('Memulai proses backup database HCMS...');

        try {
            $note = $this->option('note');
            $result = $backupService->createBackup($note);

            $this->info("✓ Backup berhasil dibuat!");
            $this->table(
                ['Properti', 'Nilai'],
                [
                    ['File', $result['filename']],
                    ['Ukuran', $result['size_formatted']],
                    ['Engine', $result['engine']],
                    ['Waktu', $result['created_at']],
                ]
            );

            // Bersihkan file backup lama jika ada
            $keepDays = (int) $this->option('keep');
            if ($keepDays > 0) {
                $deleted = $backupService->cleanOldBackups($keepDays);
                if ($deleted > 0) {
                    $this->comment("Membersihkan {$deleted} file backup yang berusia lebih dari {$keepDays} hari.");
                }
            }

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Gagal melakukan backup database: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}

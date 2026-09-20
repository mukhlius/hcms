<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class DatabaseBackupService
{
    protected string $backupDir;

    public function __construct()
    {
        $this->backupDir = storage_path('app/backups');
        if (!File::exists($this->backupDir)) {
            File::makeDirectory($this->backupDir, 0755, true);
        }
    }

    /**
     * Dapatkan daftar semua file backup yang tersedia
     */
    public function getBackups(): array
    {
        if (!File::exists($this->backupDir)) {
            return [];
        }

        $files = File::files($this->backupDir);
        $backups = [];

        foreach ($files as $file) {
            $extension = strtolower($file->getExtension());
            if (!in_array($extension, ['sql', 'gz', 'zip'])) {
                continue;
            }

            $sizeBytes = $file->getSize();
            $backups[] = [
                'filename' => $file->getFilename(),
                'size_bytes' => $sizeBytes,
                'size_formatted' => $this->formatBytes($sizeBytes),
                'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
                'extension' => $extension,
            ];
        }

        // Urutkan dari yang terbaru
        usort($backups, function ($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        return $backups;
    }

    /**
     * Dapatkan informasi ringkas database dan backup
     */
    public function getDatabaseInfo(): array
    {
        $dbName = config('database.connections.mysql.database', env('DB_DATABASE', 'unknown'));
        $dbHost = config('database.connections.mysql.host', env('DB_HOST', '127.0.0.1'));
        $dbPort = config('database.connections.mysql.port', env('DB_PORT', '3306'));

        $totalTables = 0;
        $totalSizeMb = 0;

        try {
            $tableStats = DB::select("
                SELECT table_name AS `table`, 
                       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS `size_mb` 
                FROM information_schema.TABLES 
                WHERE table_schema = ?
            ", [$dbName]);

            $totalTables = count($tableStats);
            foreach ($tableStats as $stat) {
                $totalSizeMb += (float) ($stat->size_mb ?? 0);
            }
        } catch (\Throwable $e) {
            Log::warning('Gagal membaca statistik information_schema: ' . $e->getMessage());
        }

        $backups = $this->getBackups();
        $totalBackupSizeBytes = array_sum(array_column($backups, 'size_bytes'));

        return [
            'database_name' => $dbName,
            'database_host' => $dbHost,
            'database_port' => $dbPort,
            'total_tables' => $totalTables,
            'database_size_mb' => round($totalSizeMb, 2),
            'total_backups' => count($backups),
            'total_backup_size_formatted' => $this->formatBytes($totalBackupSizeBytes),
            'last_backup' => count($backups) > 0 ? $backups[0]['created_at'] : null,
        ];
    }

    /**
     * Buat file backup database baru
     */
    public function createBackup(?string $note = null): array
    {
        $dbName = config('database.connections.mysql.database', env('DB_DATABASE', 'hcms_v3_db'));
        $timestamp = date('Y-m-d_His');
        $filename = "backup-{$dbName}-{$timestamp}.sql";
        $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;

        $mysqldumpBinary = $this->findMysqldumpBinary();
        $engine = 'native_pdo';

        if ($mysqldumpBinary) {
            try {
                $this->runMysqldump($mysqldumpBinary, $filePath, $dbName);
                $engine = 'mysqldump';
            } catch (\Throwable $e) {
                Log::warning("mysqldump gagal, beralih ke Native PDO: " . $e->getMessage());
                $this->runNativePdoDump($filePath, $dbName);
                $engine = 'native_pdo (fallback)';
            }
        } else {
            $this->runNativePdoDump($filePath, $dbName);
            $engine = 'native_pdo';
        }

        if (!File::exists($filePath) || File::size($filePath) === 0) {
            throw new \Exception('Gagal membuat file cadangan database. File kosong atau tidak terbentuk.');
        }

        $fileSize = File::size($filePath);

        return [
            'success' => true,
            'filename' => $filename,
            'filepath' => $filePath,
            'size_bytes' => $fileSize,
            'size_formatted' => $this->formatBytes($fileSize),
            'created_at' => date('Y-m-d H:i:s'),
            'engine' => $engine,
            'note' => $note,
        ];
    }

    /**
     * Unduh file backup
     */
    public function getBackupPath(string $filename): ?string
    {
        // Cegah path traversal
        $sanitized = basename($filename);
        $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $sanitized;

        if (File::exists($filePath) && is_file($filePath)) {
            return $filePath;
        }

        return null;
    }

    /**
     * Hapus file backup
     */
    public function deleteBackup(string $filename): bool
    {
        $sanitized = basename($filename);
        $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $sanitized;

        if (File::exists($filePath)) {
            return File::delete($filePath);
        }

        return false;
    }

    /**
     * Bersihkan backup lama (rotasi retention)
     */
    public function cleanOldBackups(int $keepDays = 30): int
    {
        $backups = $this->getBackups();
        $deleted = 0;
        $thresholdTime = time() - ($keepDays * 86400);

        foreach ($backups as $backup) {
            $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $backup['filename'];
            if (File::exists($filePath) && filemtime($filePath) < $thresholdTime) {
                if (File::delete($filePath)) {
                    $deleted++;
                }
            }
        }

        return $deleted;
    }

    /**
     * Deteksi lokasi mysqldump di server / Laragon / system PATH
     */
    protected function findMysqldumpBinary(): ?string
    {
        // 1. Cek dari konfigurasi .env
        $customPath = env('DB_DUMP_PATH');
        if ($customPath && File::exists($customPath)) {
            return $customPath;
        }

        // 2. Cek lokasi standar Laragon di Windows
        $laragonGlob = glob('C:\\laragon\\bin\\mysql\\*\\bin\\mysqldump.exe');
        if (!empty($laragonGlob) && File::exists($laragonGlob[0])) {
            return $laragonGlob[0];
        }

        // 3. Cek lokasi standar XAMPP di Windows
        if (File::exists('C:\\xampp\\mysql\\bin\\mysqldump.exe')) {
            return 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
        }

        // 4. Cek PATH sistem
        $command = PHP_OS_FAMILY === 'Windows' ? 'where mysqldump' : 'which mysqldump';
        $output = @shell_exec($command);
        if ($output) {
            $lines = explode("\n", trim($output));
            if (!empty($lines[0]) && File::exists(trim($lines[0]))) {
                return trim($lines[0]);
            }
        }

        return null;
    }

    /**
     * Eksekusi mysqldump via Process
     */
    protected function runMysqldump(string $binary, string $targetFile, string $dbName): void
    {
        $host = config('database.connections.mysql.host', '127.0.0.1');
        $port = config('database.connections.mysql.port', '3306');
        $username = config('database.connections.mysql.username', 'root');
        $password = config('database.connections.mysql.password', '');

        $cmd = [
            $binary,
            "--host={$host}",
            "--port={$port}",
            "--user={$username}",
            '--single-transaction',
            '--quick',
            '--skip-lock-tables',
            '--routines',
            '--triggers',
            '--add-drop-table',
        ];

        if (!empty($password)) {
            $cmd[] = "--password={$password}";
        }

        $cmd[] = $dbName;

        // Redirect output ke file
        $process = new Process($cmd);
        $process->setTimeout(300); // 5 menit

        $handle = fopen($targetFile, 'w');
        if (!$handle) {
            throw new \Exception("Tidak dapat membuka file target untuk penulisan: {$targetFile}");
        }

        $process->run(function ($type, $buffer) use ($handle) {
            if ($type === Process::OUT) {
                fwrite($handle, $buffer);
            }
        });

        fclose($handle);

        if (!$process->isSuccessful()) {
            if (File::exists($targetFile)) {
                File::delete($targetFile);
            }
            throw new \Exception('mysqldump process failed: ' . $process->getErrorOutput());
        }
    }

    /**
     * Native PHP PDO Dump sebagai fallback 100% andal
     */
    protected function runNativePdoDump(string $targetFile, string $dbName): void
    {
        $handle = fopen($targetFile, 'w');
        if (!$handle) {
            throw new \Exception("Tidak dapat membuka file target untuk penulisan: {$targetFile}");
        }

        // Header SQL
        fwrite($handle, "-- ========================================================\n");
        fwrite($handle, "-- HCMS Database Snapshot\n");
        fwrite($handle, "-- Database: `{$dbName}`\n");
        fwrite($handle, "-- Generated At: " . date('Y-m-d H:i:s') . "\n");
        fwrite($handle, "-- Engine: HCMS Native PDO Dump Generator\n");
        fwrite($handle, "-- ========================================================\n\n");
        fwrite($handle, "SET NAMES utf8mb4;\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 0;\n");
        fwrite($handle, "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n");
        fwrite($handle, "SET AUTOCOMMIT = 0;\n");
        fwrite($handle, "START TRANSACTION;\n\n");

        // Dapatkan semua nama tabel
        $tables = DB::select("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        $tableKey = 'Tables_in_' . $dbName;

        foreach ($tables as $tableRow) {
            $tableName = $tableRow->$tableKey ?? current((array) $tableRow);

            fwrite($handle, "\n-- --------------------------------------------------------\n");
            fwrite($handle, "-- Table structure for table `{$tableName}`\n");
            fwrite($handle, "-- --------------------------------------------------------\n");
            fwrite($handle, "DROP TABLE IF EXISTS `{$tableName}`;\n");

            // Dapatkan skema CREATE TABLE
            $createResult = DB::select("SHOW CREATE TABLE `{$tableName}`");
            if (!empty($createResult)) {
                $createSql = $createResult[0]->{'Create Table'} ?? current((array) $createResult[0]);
                fwrite($handle, $createSql . ";\n\n");
            }

            // Dump data baris tabel
            fwrite($handle, "-- Dumping data for table `{$tableName}`\n");

            $pdo = DB::getPdo();
            $query = $pdo->query("SELECT * FROM `{$tableName}`");

            $batchSize = 250;
            $batch = [];

            while ($row = $query->fetch(\PDO::FETCH_ASSOC)) {
                $values = [];
                foreach ($row as $val) {
                    if ($val === null) {
                        $values[] = 'NULL';
                    } elseif (is_numeric($val) && !is_string($val)) {
                        $values[] = $val;
                    } else {
                        $values[] = $pdo->quote($val);
                    }
                }
                $batch[] = '(' . implode(', ', $values) . ')';

                if (count($batch) >= $batchSize) {
                    fwrite($handle, "INSERT INTO `{$tableName}` VALUES \n" . implode(",\n", $batch) . ";\n");
                    $batch = [];
                }
            }

            if (!empty($batch)) {
                fwrite($handle, "INSERT INTO `{$tableName}` VALUES \n" . implode(",\n", $batch) . ";\n");
            }

            fwrite($handle, "\n");
        }

        fwrite($handle, "COMMIT;\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 1;\n");
        fwrite($handle, "-- Dump completed on " . date('Y-m-d H:i:s') . "\n");

        fclose($handle);
    }

    /**
     * Format byte ke string yang mudah dibaca (KB, MB, GB)
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

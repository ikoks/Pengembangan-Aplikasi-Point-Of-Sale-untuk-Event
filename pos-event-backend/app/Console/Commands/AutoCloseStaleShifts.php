<?php

namespace App\Console\Commands;

use App\Models\ShiftOperatorLog;
use App\Models\ShiftSession;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Command: app:auto-close-stale-shifts
 *
 * [POS-A-04] Menutup otomatis shift yang terbengkalai (stale/gantung).
 *
 * Definisi "shift terbengkalai":
 *   Shift dengan status OPEN atau ON_BREAK yang waktu_mulai-nya
 *   sebelum hari ini (H-1 atau lebih tua). Ini mengindikasikan
 *   shift yang tidak ditutup dengan benar sebelum kasir pulang.
 *
 * Dijadwalkan setiap hari pukul 03:00 pagi via Laravel Scheduler.
 * Pada jam itu semua event sudah selesai dan tidak ada transaksi baru.
 *
 * Apa yang dilakukan:
 *   1. Query semua shift OPEN/ON_BREAK dengan waktu_mulai < hari ini (midnight).
 *   2. Untuk tiap shift: update status → CLOSED, isi waktu_selesai.
 *   3. Insert log ke shift_operator_logs dengan aksi 'auto_closed'.
 *   4. Tulis summary ke Laravel Log (storage/logs/laravel.log).
 *
 * Kenapa selisih_uang = 0?
 *   Auto-close terjadi tanpa rekonsiliasi fisik (tidak ada kasir).
 *   Admin akan melihat shift ini di Web Admin dan bisa rekonsiliasi manual.
 *
 * Usage manual:
 *   php artisan app:auto-close-stale-shifts
 *   php artisan app:auto-close-stale-shifts --dry-run
 */
class AutoCloseStaleShifts extends Command
{
    /**
     * Signature command artisan.
     *
     * @var string
     */
    protected $signature = 'app:auto-close-stale-shifts
                            {--dry-run : Tampilkan shift yang akan ditutup tanpa benar-benar menutupnya}';

    /**
     * Deskripsi command yang muncul di `php artisan list`.
     *
     * @var string
     */
    protected $description = 'Menutup otomatis shift OPEN/ON_BREAK yang terbengkalai (tidak ditutup sebelum tengah malam).';

    /**
     * Jalankan command.
     */
    public function handle(): int
    {
        $isDryRun   = $this->option('dry-run');
        $waktuBatas = now()->startOfDay(); // Midnight hari ini (00:00:00)

        $this->info('[' . now()->toDateTimeString() . '] Auto-close stale shifts dimulai.');

        if ($isDryRun) {
            $this->warn('DRY-RUN MODE — tidak ada perubahan yang disimpan ke database.');
        }

        // ─────────────────────────────────────────────────────────────────────
        // Query semua shift gantung: OPEN/ON_BREAK dengan waktu_mulai < hari ini
        // ─────────────────────────────────────────────────────────────────────
        $staleShifts = ShiftSession::query()
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->where('waktu_mulai', '<', $waktuBatas)
            ->with(['user', 'cabang'])
            ->get();

        if ($staleShifts->isEmpty()) {
            $this->info('Tidak ada shift terbengkalai. Semua shift sudah tertutup dengan benar.');
            Log::info('[AutoCloseStaleShifts] Tidak ada shift terbengkalai ditemukan.', [
                'dijalankan_pada' => now()->toDateTimeString(),
            ]);
            return self::SUCCESS;
        }

        $this->info("Ditemukan {$staleShifts->count()} shift terbengkalai:");

        // Tampilkan tabel ringkasan shift yang akan ditutup
        $this->table(
            ['ID Shift', 'Kasir', 'Cabang', 'Status', 'Waktu Mulai'],
            $staleShifts->map(fn ($shift) => [
                substr($shift->id_shift, 0, 8) . '...',
                $shift->user?->username ?? '-',
                $shift->cabang?->nama_cabang ?? '-',
                $shift->status_shift,
                $shift->waktu_mulai?->format('Y-m-d H:i:s') ?? '-',
            ])->toArray()
        );

        if ($isDryRun) {
            $this->warn("DRY-RUN: {$staleShifts->count()} shift AKAN ditutup jika dijalankan tanpa --dry-run.");
            return self::SUCCESS;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Proses penutupan setiap shift dalam transaksi terpisah
        // ─────────────────────────────────────────────────────────────────────
        $berhasil = 0;
        $gagal    = 0;

        foreach ($staleShifts as $shift) {
            try {
                DB::transaction(function () use ($shift): void {
                    $shift->update([
                        'status_shift'     => 'CLOSED',
                        'waktu_selesai'    => now(),
                        'id_user_aktif'    => null,
                        // selisih_uang = 0 karena tidak ada rekonsiliasi fisik
                        // Admin akan follow-up secara manual di Web Admin
                        'selisih_uang'     => 0,
                    ]);

                    ShiftOperatorLog::create([
                        'id_shift'       => $shift->id_shift,
                        // id_user diisi dengan pemilik shift (kasir yang membuka)
                        'id_user'        => $shift->id_user,
                        'aksi'           => 'auto_closed',
                        'waktu_kejadian' => now(),
                        'catatan'        => sprintf(
                            'Shift ditutup otomatis oleh sistem (cron 03:00). ' .
                            'Waktu mulai: %s. Alasan: shift tidak ditutup sebelum tengah malam.',
                            $shift->waktu_mulai?->format('Y-m-d H:i:s') ?? 'unknown'
                        ),
                    ]);
                });

                $berhasil++;
                $this->line("Closed: {$shift->id_shift} (kasir: {$shift->user?->username})");

            } catch (\Throwable $e) {
                $gagal++;
                $this->error("Gagal: {$shift->id_shift} — {$e->getMessage()}");
                Log::error('[AutoCloseStaleShifts] Gagal menutup shift.', [
                    'id_shift' => $shift->id_shift,
                    'error'    => $e->getMessage(),
                ]);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Summary log
        // ─────────────────────────────────────────────────────────────────────
        $summary = [
            'dijalankan_pada' => now()->toDateTimeString(),
            'total_ditemukan' => $staleShifts->count(),
            'berhasil_ditutup' => $berhasil,
            'gagal'            => $gagal,
        ];

        Log::info('[AutoCloseStaleShifts] Selesai.', $summary);

        $this->newLine();
        $this->info("Selesai. Berhasil: {$berhasil} | Gagal: {$gagal}");

        return $gagal > 0 ? self::FAILURE : self::SUCCESS;
    }
}

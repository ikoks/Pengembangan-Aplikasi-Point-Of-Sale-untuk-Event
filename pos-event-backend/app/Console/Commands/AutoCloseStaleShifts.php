<?php

namespace App\Console\Commands;

use App\Models\ShiftOperatorLog;
use App\Models\ShiftSession;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// Command Auto Close Shift Terbengkalai (Cron 03:00)
class AutoCloseStaleShifts extends Command
{
    protected $signature = 'app:auto-close-stale-shifts
                            {--dry-run : Tampilkan shift yang akan ditutup}';

    protected $description = 'Menutup otomatis shift OPEN/ON_BREAK yang terbengkalai.';

    public function handle(): int
    {
        $isDryRun   = $this->option('dry-run');
        $waktuBatas = now()->startOfDay();

        $this->info('[' . now()->toDateTimeString() . '] Auto-close stale shifts dimulai.');

        if ($isDryRun) {
            $this->warn('DRY-RUN MODE — tidak ada perubahan yang disimpan ke database.');
        }

        $staleShifts = ShiftSession::query()
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->where('waktu_mulai', '<', $waktuBatas)
            ->with(['user', 'cabang'])
            ->get();

        if ($staleShifts->isEmpty()) {
            $this->info('Tidak ada shift terbengkalai.');
            Log::info('[AutoCloseStaleShifts] Tidak ada shift terbengkalai.');
            return self::SUCCESS;
        }

        $this->info("Ditemukan {$staleShifts->count()} shift terbengkalai:");

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
            $this->warn("DRY-RUN: {$staleShifts->count()} shift AKAN ditutup.");
            return self::SUCCESS;
        }

        $berhasil = 0;
        $gagal    = 0;

        foreach ($staleShifts as $shift) {
            try {
                DB::transaction(function () use ($shift): void {
                    $shift->update([
                        'status_shift'  => 'CLOSED',
                        'waktu_selesai' => now(),
                        'id_user_aktif' => null,
                        'selisih_uang'  => 0,
                    ]);

                    ShiftOperatorLog::create([
                        'id_shift'       => $shift->id_shift,
                        'id_user'        => $shift->id_user,
                        'aksi'           => 'auto_closed',
                        'waktu_kejadian' => now(),
                        'catatan'        => 'Shift ditutup otomatis oleh sistem (cron 03:00).',
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

        Log::info('[AutoCloseStaleShifts] Selesai.', [
            'total' => $staleShifts->count(),
            'berhasil' => $berhasil,
            'gagal' => $gagal,
        ]);

        $this->info("Selesai. Berhasil: {$berhasil} | Gagal: {$gagal}");
        return $gagal > 0 ? self::FAILURE : self::SUCCESS;
    }
}

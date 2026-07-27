<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\BreakShiftRequest;
use App\Http\Requests\Api\V1\CloseShiftRequest;
use App\Http\Requests\Api\V1\ResumeShiftRequest;
use App\Http\Requests\Api\V1\SwitchOperatorRequest;
use App\Http\Requests\V1\OpenShiftRequest;
use App\Http\Resources\ShiftSessionResource;
use App\Models\ShiftOperatorLog;
use App\Models\ShiftSession;
use App\Models\UserModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * ShiftSessionController — POS-A-02 & POS-A-03 (Sprint 2)
 *
 * Mengelola siklus hidup sesi kerja kasir: dari pembukaan (opening)
 * hingga penutupan (closing), termasuk pencatatan log audit setiap transisi.
 *
 * Hak Akses: Kasir & Admin terautentikasi Sanctum (auth:sanctum).
 *
 * Transisi status yang valid:
 *   OPEN <-> ON_BREAK → CLOSED
 *
 * Pemilik shift vs Operator aktif:
 *   - `id_user`       : Kasir yang membuka shift (tidak berubah sepanjang shift).
 *   - `id_user_aktif` : Kasir yang sedang memegang terminal (bisa berganti via switch).
 */
class ShiftSessionController extends Controller
{
    /**
     * [POS-A-02] Membuka sesi shift kerja kasir baru.
     * Endpoint: POST /api/v1/shift/open
     *
     * Logika:
     *   1. Cek shift aktif milik kasir (OPEN/ON_BREAK) → jika ada tolak 422.
     *   2. Buat record shift baru status OPEN + log 'open'.
     *   3. Return shift data + relasi lengkap.
     */
    public function open(OpenShiftRequest $request): JsonResponse
    {
        /** @var UserModel $kasir */
        $kasir = $request->user();

        // Periksa apakah kasir masih memiliki shift aktif
        $shiftAktif = ShiftSession::where('id_user', $kasir->id_user)
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->first();

        if ($shiftAktif !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir masih memiliki sesi shift yang aktif! Tutup shift sebelumnya terlebih dahulu.',
                'data'    => [
                    'id_shift'    => $shiftAktif->id_shift,
                    'status_shift' => $shiftAktif->status_shift,
                    'waktu_mulai' => $shiftAktif->waktu_mulai?->toIso8601String(),
                ],
            ], 422);
        }

        $shiftBaru = DB::transaction(function () use ($kasir, $request): ShiftSession {
            $modalAwal = (float) $request->validated()['modal_awal'];

            $shift = ShiftSession::create([
                'id_user'       => $kasir->id_user,
                'id_user_aktif' => $kasir->id_user,
                'id_cabang'     => $request->validated()['id_cabang'],
                'id_sales'      => $request->validated()['id_sales'],
                'waktu_mulai'   => now(),
                'modal_awal'    => $modalAwal,
                'status_shift'  => 'OPEN',
            ]);

            ShiftOperatorLog::create([
                'id_shift'       => $shift->id_shift,
                'id_user'        => $kasir->id_user,
                'aksi'           => 'open',
                'waktu_kejadian' => now(),
                'catatan'        => sprintf(
                    'Opening shift kasir berhasil dengan modal awal Rp %s.',
                    number_format($modalAwal, 0, ',', '.')
                ),
            ]);

            return $shift;
        });

        $shiftBaru->load(['user', 'userAktif', 'cabang', 'salesMode', 'operatorLogs']);

        return response()->json([
            'success' => true,
            'message' => 'Sesi shift berhasil dibuka. Selamat berjualan!',
            'data'    => new ShiftSessionResource($shiftBaru),
        ], 201);
    }

    /**
     * [POS-A-02] Menjeda shift aktif — status → ON_BREAK, id_user_aktif → NULL.
     * Endpoint: POST /api/v1/shift/break
     */
    public function break(BreakShiftRequest $request): JsonResponse
    {
        /** @var UserModel $kasir */
        $kasir = $request->user();

        $shift = DB::transaction(function () use ($kasir, $request): ?ShiftSession {
            $shift = $this->ownerShiftQuery($kasir->id_user)
                ->where('status_shift', 'OPEN')
                ->lockForUpdate()
                ->first();

            if ($shift === null) {
                return null;
            }

            $shift->update([
                'status_shift'  => 'ON_BREAK',
                'id_user_aktif' => null,
            ]);

            ShiftOperatorLog::create([
                'id_shift'       => $shift->id_shift,
                'id_user'        => $kasir->id_user,
                'aksi'           => 'break',
                'waktu_kejadian' => now(),
                'catatan'        => $request->validated('catatan')
                    ?? 'Kasir memulai jeda istirahat (ON_BREAK).',
            ]);

            return $shift;
        });

        if ($shift === null) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada sesi shift aktif yang sedang berjalan (OPEN)!',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesi shift berhasil di-jeda (ON_BREAK).',
            'data'    => new ShiftSessionResource($shift->fresh()),
        ]);
    }

    /**
     * [POS-A-02] Melanjutkan shift dari ON_BREAK — status → OPEN, id_user_aktif diisi.
     * Endpoint: POST /api/v1/shift/resume
     */
    public function resume(ResumeShiftRequest $request): JsonResponse
    {
        /** @var UserModel $kasir */
        $kasir = $request->user();

        $shift = DB::transaction(function () use ($kasir, $request): ?ShiftSession {
            $shift = $this->ownerShiftQuery($kasir->id_user)
                ->where('status_shift', 'ON_BREAK')
                ->lockForUpdate()
                ->first();

            if ($shift === null) {
                return null;
            }

            $shift->update([
                'status_shift'  => 'OPEN',
                'id_user_aktif' => $kasir->id_user,
            ]);

            ShiftOperatorLog::create([
                'id_shift'       => $shift->id_shift,
                'id_user'        => $kasir->id_user,
                'aksi'           => 'resume',
                'waktu_kejadian' => now(),
                'catatan'        => $request->validated('catatan')
                    ?? 'Kasir kembali dari istirahat dan melanjutkan shift.',
            ]);

            return $shift;
        });

        if ($shift === null) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada sesi shift berstatus ON_BREAK untuk dilanjutkan!',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesi shift berhasil dilanjutkan (OPEN).',
            'data'    => new ShiftSessionResource($shift->fresh()),
        ]);
    }

    /**
     * [POS-A-02] Mengalihkan operator aktif tanpa menutup shift.
     * Endpoint: POST /api/v1/shift/switch
     *
     * Perbedaan dengan close: id_user (pemilik laci) TIDAK berubah.
     * Hanya id_user_aktif yang diganti ke kasir pengganti.
     * Dilog ke shift_operator_logs dengan aksi 'switch'.
     */
    public function switchOperator(SwitchOperatorRequest $request): JsonResponse
    {
        /** @var UserModel $kasirUtama */
        $kasirUtama        = $request->user();
        $usernamePengganti = $request->validated('username_pengganti');

        $shift = DB::transaction(function () use ($kasirUtama, $usernamePengganti): ?ShiftSession {
            $shift = $this->ownerShiftQuery($kasirUtama->id_user)
                ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
                ->lockForUpdate()
                ->first();

            if ($shift === null) {
                return null;
            }

            $pengganti = UserModel::query()
                ->where('username', $usernamePengganti)
                ->firstOrFail();

            $shift->update([
                'id_user_aktif' => $pengganti->id_user,
                'status_shift'  => 'OPEN',
            ]);

            ShiftOperatorLog::create([
                'id_shift'       => $shift->id_shift,
                'id_user'        => $kasirUtama->id_user,
                'aksi'           => 'switch',
                'waktu_kejadian' => now(),
                'catatan'        => 'Pergantian operator aktif ke: ' . $usernamePengganti,
            ]);

            return $shift;
        });

        if ($shift === null) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada sesi shift aktif yang dapat dialihkan!',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Operator aktif berhasil dialihkan ke ' . $usernamePengganti . '.',
            'data'    => new ShiftSessionResource($shift->fresh()),
        ]);
    }

    /**
     * [POS-A-03] Menutup shift secara SILENT — revoke token + response bersih.
     * Endpoint: POST /api/v1/shift/close
     *
     * Logika bisnis (sesuai PRD v1.1-Sprint2 § 2.4):
     *   1. Ambil shift aktif (OPEN/ON_BREAK) milik kasir → lock.
     *   2. Hitung total omzet digital (tunai + non-tunai).
     *   3. Hitung ekspektasi uang fisik = modal_awal + total_tunai.
     *   4. Hitung selisih_uang = uang_fisik_akhir - ekspektasi.
     *   5. Simpan hasil rekonsiliasi ke shift_session → status CLOSED.
     *   6. Log aksi 'closed' ke shift_operator_logs.
     *   7. REVOKE semua Sanctum token milik kasir (direct logout di HP).
     *   8. Return response bersih: { success: true, message } TANPA angka selisih.
     *
     * Kenapa tanpa selisih di response?
     *   Mobile menerima response ini → langsung redirect ke halaman login.
     *   Selisih hanya dilihat Admin di Web Admin dashboard.
     */
    public function close(CloseShiftRequest $request): JsonResponse
    {
        /** @var UserModel $kasir */
        $kasir           = $request->user();
        $uangFisikAkhir  = (float) $request->validated('uang_fisik_akhir');

        $berhasil = DB::transaction(function () use ($kasir, $uangFisikAkhir): bool {
            $shift = $this->ownerShiftQuery($kasir->id_user)
                ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
                ->lockForUpdate()
                ->first();

            if ($shift === null) {
                return false;
            }

            // ─────────────────────────────────────────────
            // Kalkulasi rekonsiliasi kas (silent — tidak masuk response)
            // ─────────────────────────────────────────────
            $transaksiSuccess = $shift->transaksis()->where('status', 'Success');

            $totalTunai = (float) (clone $transaksiSuccess)
                ->whereHas('metodePembayaran', fn ($q) => $q->where('kategori_metode', 'Tunai'))
                ->sum('total');

            $totalNonTunai = (float) (clone $transaksiSuccess)
                ->whereHas('metodePembayaran', fn ($q) => $q->where('kategori_metode', '!=', 'Tunai'))
                ->sum('total');

            $modalAwal            = (float) $shift->modal_awal;
            $ekspektasiUangFisik  = $modalAwal + $totalTunai;
            $selisihUang          = $uangFisikAkhir - $ekspektasiUangFisik;

            // ─────────────────────────────────────────────
            // Update shift → CLOSED (semua angka disimpan di DB, TIDAK di response)
            // ─────────────────────────────────────────────
            $shift->update([
                'waktu_selesai'    => now(),
                'uang_fisik_akhir' => $uangFisikAkhir,
                'selisih_uang'     => $selisihUang,
                'status_shift'     => 'CLOSED',
                'id_user_aktif'    => null,
            ]);

            // Log aksi closing
            ShiftOperatorLog::create([
                'id_shift'       => $shift->id_shift,
                'id_user'        => $kasir->id_user,
                'aksi'           => 'closed',
                'waktu_kejadian' => now(),
                'catatan'        => sprintf(
                    'Closing shift. Total omzet: Rp %s (Tunai: %s | Non-Tunai: %s). Selisih: Rp %s.',
                    number_format($totalTunai + $totalNonTunai, 0, ',', '.'),
                    number_format($totalTunai, 0, ',', '.'),
                    number_format($totalNonTunai, 0, ',', '.'),
                    number_format($selisihUang, 0, ',', '.')
                ),
            ]);

            // ─────────────────────────────────────────────
            // [POS-A-03] REVOKE semua Sanctum token kasir
            // Ini yang memicu direct logout di aplikasi HP Kasir.
            // HP menerima 401 Unauthorized pada request berikutnya
            // atau response closing ini, lalu redirect ke halaman login.
            // ─────────────────────────────────────────────
            $kasir->tokens()->delete();

            return true;
        });

        if (! $berhasil) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada sesi shift aktif untuk ditutup!',
            ], 422);
        }

        // Response bersih — TANPA angka selisih, omzet, atau nominal apapun.
        // Mobile membaca 'success: true' → redirect ke halaman login.
        return response()->json([
            'success' => true,
            'message' => 'Shift berhasil ditutup. Silakan logout.',
        ]);
    }

    /**
     * Query builder untuk shift yang dimiliki user sebagai pemilik laci/shift.
     */
    private function ownerShiftQuery(string $userId): Builder
    {
        return ShiftSession::query()->where('id_user', $userId);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\OpenShiftRequest;
use App\Http\Resources\ShiftSessionResource;
use App\Models\ShiftOperatorLog;
use App\Models\ShiftSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * ShiftSessionController — POS-5A (API Pembukaan Sesi Shift Kasir)
 *
 * Mengelola siklus hidup sesi kerja kasir: dari pembukaan (opening)
 * hingga penutupan (closing), termasuk pencatatan log audit setiap transisi.
 *
 * Hak Akses untuk Hari ke-3 (POS-5A):
 *   - POST /shift/open → Kasir & Admin terautentikasi Sanctum
 *
 * Sesi shift yang akan diimplementasikan di hari berikutnya (POS-5B, 5C):
 *   - POST /shift/break   → Kasir memulai jeda
 *   - POST /shift/resume  → Kasir melanjutkan dari jeda
 *   - POST /shift/close   → Kasir menutup shift & rekonsiliasi uang
 *   - POST /shift/switch  → Pergantian operator kasir
 */
class ShiftSessionController extends Controller
{
    /**
     * Membuka sesi shift kerja kasir baru (POS-5A).
     * Endpoint: POST /api/v1/shift/open
     * Middleware: auth:sanctum
     *
     * LOGIKA BISNIS (sesuai Use Case III.2.3 SDD):
     * ─────────────────────────────────────────────
     * 1. Identifikasi kasir dari Bearer Token yang aktif.
     * 2. Periksa apakah kasir ini MASIH memiliki shift yang sedang terbuka
     *    (status OPEN atau ON_BREAK). Satu kasir hanya boleh memiliki
     *    satu shift aktif pada satu waktu.
     * 3. Jika masih ada shift aktif → Tolak dengan HTTP 422 + pesan deskriptif.
     * 4. Jika tidak ada shift aktif:
     *    a. Buat record shift_session baru dengan status 'OPEN'.
     *    b. Buat log audit awal di shift_operator_logs dengan aksi 'open'.
     *    c. Seluruh operasi di-wrap dalam database transaction untuk atomicity.
     * 5. Kembalikan data shift yang baru dibuat beserta relasi lengkapnya.
     *
     * @param  OpenShiftRequest $request  Input yang sudah divalidasi.
     */
    public function open(OpenShiftRequest $request): JsonResponse
    {
        /** @var \App\Models\UserModel $kasir */
        $kasir = $request->user();

        // =====================================================================
        // LANGKAH 1: Periksa apakah kasir masih memiliki shift aktif
        // Status yang dianggap "aktif" adalah OPEN atau ON_BREAK.
        // =====================================================================
        $shiftAktif = ShiftSession::where('id_user', $kasir->id_user)
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->first();

        if ($shiftAktif !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir masih memiliki sesi shift yang aktif! Tutup shift sebelumnya terlebih dahulu sebelum membuka shift baru.',
                'data'    => [
                    'id_shift'     => $shiftAktif->id_shift,
                    'status_shift' => $shiftAktif->status_shift,
                    'waktu_mulai'  => $shiftAktif->waktu_mulai?->toIso8601String(),
                ],
            ], 422); // 422 Unprocessable Entity sesuai spesifikasi
        }

        // =====================================================================
        // LANGKAH 2: Buat shift baru + log audit dalam satu atomic transaction.
        // Jika salah satu INSERT gagal, keduanya di-rollback agar tidak ada
        // record shift "orphan" tanpa log audit pembukaannya.
        // =====================================================================
        $shiftBaru = DB::transaction(function () use ($kasir, $request): ShiftSession {

            $modalAwal = (float) $request->validated()['modal_awal'];

            // 2a. Buat record sesi shift baru
            $shift = ShiftSession::create([
                'id_user'       => $kasir->id_user,   // Kasir pembuat shift
                'id_user_aktif' => $kasir->id_user,   // Kasir yang langsung aktif (sama saat opening)
                'id_cabang'     => $request->validated()['id_cabang'],
                'id_sales'      => $request->validated()['id_sales'],
                'waktu_mulai'   => now(),              // Sekarang, timezone Asia/Jakarta
                'modal_awal'    => $modalAwal,
                'status_shift'  => 'OPEN',
                // waktu_selesai, uang_fisik_akhir, selisih_uang → diisi saat CLOSING (POS-5C)
            ]);

            // 2b. Buat log audit awal dengan keterangan modal yang disetup
            ShiftOperatorLog::create([
                'id_shift'       => $shift->id_shift,
                'id_user'        => $kasir->id_user,
                'aksi'           => 'open',
                'waktu_kejadian' => now(),
                'catatan'        => sprintf(
                    'Opening shift kasir berhasil disetup dengan modal awal Rp %s.',
                    number_format($modalAwal, 0, ',', '.')
                ),
            ]);

            return $shift;
        });

        // =====================================================================
        // LANGKAH 3: Muat relasi untuk response yang informatif
        // =====================================================================
        $shiftBaru->load(['user', 'userAktif', 'cabang', 'salesMode', 'operatorLogs']);

        return response()->json([
            'success' => true,
            'message' => 'Sesi shift berhasil dibuka. Selamat berjualan!',
            'data'    => new ShiftSessionResource($shiftBaru),
        ], 201);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\Transaksi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * OtpController — POS-A-06 (Sprint 2)
 *
 * Mengelola permintaan dan pengecekan kode OTP untuk otorisasi
 * void transaksi yang sudah berstatus 'Success'.
 *
 * Alur OTP:
 *   1. Kasir tap "Minta OTP Void" di HP → POST /api/v1/otp/request-void
 *   2. Server generate kode 6 digit → simpan di otp_codes (TTL 1 menit)
 *   3. Admin buka Web Admin → lihat kode aktif di dashboard
 *   4. Admin bacakan kode ke Kasir → Kasir input di HP
 *   5. Kasir submit POST /api/v1/checkout/{id}/void dengan kode_otp
 *   6. Server validasi → void diproses → kode dipakai (used_at diisi)
 */
class OtpController extends Controller
{
    /**
     * [POS-A-06] Kasir request kode OTP untuk void transaksi 'Success'.
     * Endpoint: POST /api/v1/otp/request-void
     *
     * Logika:
     *   1. Validasi id_transaksi ada & berstatus 'Success'.
     *   2. Invalidasi OTP lama (belum dipakai) untuk transaksi ini.
     *   3. Generate kode 6 digit baru.
     *   4. Simpan ke otp_codes dengan expires_at = now + 1 menit.
     *   5. Return sukses (Admin lihat kode di Web Admin dashboard).
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function requestVoid(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_transaksi' => [
                'required',
                'string',
                'size:36',
                'exists:transaksi,id_transaksi',
            ],
        ]);

        $transaksi = Transaksi::where('id_transaksi', $validated['id_transaksi'])->firstOrFail();

        // Hanya transaksi berstatus 'Success' yang bisa di-void dengan OTP
        if ($transaksi->status !== 'Success') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya transaksi berstatus "Success" yang memerlukan OTP Admin untuk di-void.',
                'data'    => ['status_transaksi' => $transaksi->status],
            ], 422);
        }

        $otp = DB::transaction(function () use ($transaksi): OtpCode {
            // Invalidasi semua OTP lama yang belum dipakai untuk transaksi ini
            // (mencegah multiple OTP aktif untuk satu transaksi)
            OtpCode::where('id_transaksi', $transaksi->id_transaksi)
                ->whereNull('used_at')
                ->update(['used_at' => now()]); // Mark sebagai "dipakai/expired manual"

            // Generate kode 6 digit numerik (mudah dibacakan Admin)
            $kode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            return OtpCode::create([
                'id_otp'       => (string) Str::uuid(),
                'id_transaksi' => $transaksi->id_transaksi,
                'kode'         => $kode,
                'expires_at'   => now()->addMinute(), // TTL: 1 menit
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Kode OTP berhasil dibuat. Admin dapat melihat kode di Web Admin dashboard.',
            'data'    => [
                'id_transaksi'  => $transaksi->id_transaksi,
                'expires_at'    => $otp->expires_at->toIso8601String(),
                'ttl_detik'     => 60,
                // Kode OTP TIDAK dikembalikan ke Kasir di sini.
                // Kasir harus mendapatkan kode dari Admin secara verbal.
                // Ini mencegah Kasir mem-bypass kebutuhan otorisasi Admin.
            ],
        ]);
    }
}

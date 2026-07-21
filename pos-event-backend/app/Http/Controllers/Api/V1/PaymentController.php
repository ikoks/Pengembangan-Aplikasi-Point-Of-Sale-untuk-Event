<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\GenerateQrisRequest;
use App\Http\Resources\DetailPembayaranResource;
use App\Models\DetailPembayaranNonTunai;
use App\Models\Transaksi;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * PaymentController
 *
 * Controller yang mengelola seluruh lifecycle pembayaran non-tunai QRIS
 * melalui integrasi Midtrans Core API.
 *
 * Endpoint yang dikelola:
 *   POST /api/v1/payment/qris              → Generate QR Code QRIS dinamis (POS-10A)
 *   POST /api/v1/payment/webhook           → Terima callback dari Midtrans (POS-11)
 *   GET  /api/v1/payment/status/{id}       → Polling status transaksi oleh kasir
 *
 * Arsitektur:
 *   Controller ini tipis (thin controller) — logika bisnis dan komunikasi Midtrans
 *   didelegasikan ke MidtransService yang di-inject melalui constructor.
 *
 * Referensi: SDD Bab V, SRS 4.3, Tiket JIRA POS-10A & POS-11
 */
class PaymentController extends Controller
{
    /**
     * Service Midtrans yang di-inject via Laravel IoC Container.
     * Semua komunikasi dengan Midtrans API dilakukan melalui service ini.
     */
    private MidtransService $midtransService;

    /**
     * Inisialisasi Controller dengan dependency injection MidtransService.
     *
     * @param MidtransService $midtransService  Service layer Midtrans.
     */
    public function __construct(MidtransService $midtransService)
    {
        $this->midtransService = $midtransService;
    }

    // =========================================================================
    // ENDPOINT 1: POST /api/v1/payment/qris
    // JIRA: POS-10A — Request QRIS Dinamis
    // Middleware: auth:sanctum
    // =========================================================================

    /**
     * Generate QR Code QRIS Dinamis untuk transaksi yang diberikan.
     *
     * Alur Bisnis Lengkap (sesuai SDD Bab V.2):
     * ─────────────────────────────────────────
     * 1. Validasi input: `id_transaksi` via GenerateQrisRequest.
     * 2. Ambil data Transaksi dari DB, pastikan status masih 'Draft' atau 'Pending'.
     * 3. Panggil MidtransService@generateQris → kirim charge request ke Midtrans Core API.
     * 4. Simpan/Upsert record ke tabel `detail_pembayaran_non_tunai`:
     *    - payment_gateway_id = transaction_id dari Midtrans
     *    - qr_string_data     = URL/QR string dari Midtrans
     *    - status_api         = 'PENDING'
     *    - waktu_kedaluwarsa  = now() + 15 menit
     * 5. Update status Transaksi dari 'Draft' → 'Pending'.
     * 6. Return HTTP 200 dengan data QR Code yang dibutuhkan HP kasir.
     *
     * HTTP Status Codes:
     *   200 OK              → QR berhasil di-generate
     *   404 Not Found       → Transaksi tidak ditemukan (handled oleh findOrFail)
     *   409 Conflict        → Transaksi status tidak valid (bukan Draft/Pending)
     *   422 Unprocessable   → Validasi input gagal
     *   502 Bad Gateway     → Gagal berkomunikasi dengan Midtrans
     *   500 Server Error    → Error internal yang tidak terduga
     *
     * @param  GenerateQrisRequest $request  Input yang sudah divalidasi.
     * @return JsonResponse
     */
    public function generateQris(GenerateQrisRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // =====================================================================
        // LANGKAH 1: Ambil data Transaksi dari database
        // =====================================================================
        // Menggunakan `findOrFail` — jika tidak ada, Laravel otomatis lempar
        // ModelNotFoundException yang diterjemahkan menjadi HTTP 404.
        // =====================================================================
        /** @var Transaksi $transaksi */
        $transaksi = Transaksi::where('id_transaksi', $validated['id_transaksi'])
            ->firstOrFail();

        // =====================================================================
        // LANGKAH 2: Validasi status transaksi
        // =====================================================================
        // QRIS hanya boleh di-generate untuk transaksi dengan status 'Draft' atau 'Pending'.
        // Status lain (Success, Void, Cancelled) tidak boleh di-charge ulang ke Midtrans.
        // =====================================================================
        $statusYangDiizinkan = ['Draft', 'Pending'];

        if (!in_array($transaksi->status, $statusYangDiizinkan, true)) {
            return response()->json([
                'success' => false,
                'message' => "Transaksi dengan status '{$transaksi->status}' tidak dapat di-charge. "
                    . 'QR hanya dapat di-generate untuk transaksi berstatus Draft atau Pending.',
                'data'    => null,
            ], 409); // 409 Conflict
        }

        // =====================================================================
        // LANGKAH 3: Panggil MidtransService untuk generate QRIS
        // =====================================================================
        try {
            $chargeResult = $this->midtransService->generateQris($transaksi);
        } catch (RuntimeException $e) {
            Log::error('[PaymentController@generateQris] Gagal generate QRIS dari Midtrans.', [
                'id_transaksi' => $transaksi->id_transaksi,
                'error'        => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke payment gateway. Silakan coba kembali dalam beberapa saat.',
                'error'   => $e->getMessage(),
                'data'    => null,
            ], 502); // 502 Bad Gateway — upstream error
        }

        // =====================================================================
        // LANGKAH 4 & 5: Simpan data charge + Update status (dalam 1 DB Transaction)
        // =====================================================================
        // Menggunakan DB::transaction agar atomic: jika salah satu gagal,
        // keduanya di-rollback (tidak ada data inkonsisten di DB).
        // =====================================================================
        $detailPembayaran = DB::transaction(function () use ($transaksi, $chargeResult): DetailPembayaranNonTunai {

            // ------------------------------------------------------------------
            // LANGKAH 4: Upsert record detail_pembayaran_non_tunai
            // ------------------------------------------------------------------
            // Menggunakan updateOrCreate untuk idempoten:
            //   - Jika record belum ada → INSERT baru
            //   - Jika record sudah ada (retry) → UPDATE dengan data terbaru
            // ------------------------------------------------------------------
            $detail = DetailPembayaranNonTunai::updateOrCreate(
                // Kriteria pencarian (where clause)
                ['id_transaksi' => $transaksi->id_transaksi],

                // Nilai yang akan di-set (insert atau update)
                [
                    'payment_gateway_id' => $chargeResult['transaction_id'],
                    'qr_string_data'     => $chargeResult['qr_string'],
                    'status_api'         => 'PENDING',
                    'waktu_kedaluwarsa'  => now()->addMinutes(config('midtrans.qris_expiry_minutes', 15)),
                ]
            );

            // ------------------------------------------------------------------
            // LANGKAH 5: Update status Transaksi dari 'Draft' → 'Pending'
            // ------------------------------------------------------------------
            // Status 'Pending' menandakan bahwa QR sudah di-generate dan
            // transaksi sedang menunggu konfirmasi pembayaran dari customer.
            // ------------------------------------------------------------------
            $transaksi->update(['status' => 'Pending']);

            return $detail;
        });

        // =====================================================================
        // LANGKAH 6: Return response sukses dengan data QR
        // =====================================================================
        return response()->json([
            'success' => true,
            'message' => 'QR Code QRIS berhasil di-generate. Silakan scan menggunakan aplikasi e-wallet.',
            'data'    => new DetailPembayaranResource($detailPembayaran),
        ], 200);
    }

    // =========================================================================
    // ENDPOINT 2: POST /api/v1/payment/webhook
    // JIRA: POS-11 — Midtrans Webhook Callback Receiver
    // Middleware: NONE (Public endpoint, dikecualikan dari CSRF)
    // =========================================================================

    /**
     * Menerima dan memproses notifikasi webhook dari Midtrans.
     *
     * Endpoint ini bersifat PUBLIK (tanpa auth:sanctum) karena dipanggil oleh
     * server Midtrans secara otomatis saat status pembayaran berubah.
     * Keamanan dijamin melalui verifikasi Signature Key SHA-512.
     *
     * Alur Bisnis Lengkap (sesuai SDD Bab V.3):
     * ─────────────────────────────────────────
     * 1. Terima payload JSON dari Midtrans.
     * 2. Verifikasi Signature Key → jika tidak valid, reject dengan HTTP 403.
     * 3. Ekstrak order_id (= id_transaksi), transaction_status, fraud_status.
     * 4. Dalam DB::transaction atomic:
     *    a. Cari Transaksi & DetailPembayaranNonTunai terkait.
     *    b. Simpan raw payload ke `raw_callback_payload` (untuk audit).
     *    c. Mapping status Midtrans → status internal sistem:
     *       settlement/capture → SETTLEMENT + Success
     *       expire             → EXPIRED + Cancelled
     *       deny/cancel        → DENIED + Cancelled
     * 5. Return HTTP 200 OK (Midtrans akan retry jika tidak menerima 200).
     *
     * PENTING: Selalu kembalikan HTTP 200 jika webhook berhasil diproses,
     * bahkan untuk status yang mengakibatkan pembatalan. Midtrans hanya
     * retry jika tidak menerima 200.
     *
     * @param  Request $request  Raw HTTP request dari Midtrans.
     * @return JsonResponse
     */
    public function webhook(Request $request): JsonResponse
    {
        // =====================================================================
        // LANGKAH 1: Terima payload JSON
        // =====================================================================
        $payload = $request->all();

        Log::info('[PaymentController@webhook] Webhook Midtrans diterima.', [
            'order_id'          => $payload['order_id'] ?? 'N/A',
            'transaction_status' => $payload['transaction_status'] ?? 'N/A',
            'ip'                => $request->ip(),
        ]);

        // =====================================================================
        // LANGKAH 2: Verifikasi Signature Key
        // =====================================================================
        // Jika signature tidak valid, kemungkinan besar ini adalah request palsu.
        // Kembalikan HTTP 403 dan log peringatan keamanan.
        // =====================================================================
        if (!$this->midtransService->verifySignatureKey($payload)) {
            Log::warning('[PaymentController@webhook] Signature Key INVALID — request ditolak!', [
                'order_id' => $payload['order_id'] ?? 'N/A',
                'ip'       => $request->ip(),
                'payload'  => $payload,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid Signature Key.',
            ], 403);
        }

        // =====================================================================
        // LANGKAH 3: Ekstrak data kritis dari payload webhook
        // =====================================================================
        // order_id di Midtrans = id_transaksi UUID v4 yang kita set saat charge.
        $orderId           = $payload['order_id'] ?? '';
        $transactionStatus = strtolower($payload['transaction_status'] ?? '');
        $fraudStatus       = strtolower($payload['fraud_status'] ?? 'accept');

        // Validasi: pastikan order_id tidak kosong
        if (empty($orderId)) {
            Log::error('[PaymentController@webhook] Payload webhook tidak memiliki order_id.', [
                'payload' => $payload,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Payload tidak valid: order_id tidak ditemukan.',
            ], 400);
        }

        // =====================================================================
        // LANGKAH 4: Atomic Update menggunakan DB Transaction
        // =====================================================================
        try {
            DB::transaction(function () use ($orderId, $transactionStatus, $fraudStatus, $payload): void {

                // --------------------------------------------------------------
                // 4a. Cari Transaksi berdasarkan order_id (= id_transaksi)
                // --------------------------------------------------------------
                /** @var Transaksi|null $transaksi */
                $transaksi = Transaksi::where('id_transaksi', $orderId)
                    ->lockForUpdate() // Pessimistic locking untuk mencegah race condition
                    ->first();

                if ($transaksi === null) {
                    // Transaksi tidak ditemukan — log warning tapi tetap return 200
                    // agar Midtrans tidak terus-menerus retry
                    Log::warning('[PaymentController@webhook] Transaksi tidak ditemukan.', [
                        'order_id' => $orderId,
                    ]);
                    return; // Exit dari closure, DB::transaction akan commit kosong
                }

                // --------------------------------------------------------------
                // 4b. Cari DetailPembayaranNonTunai terkait
                // --------------------------------------------------------------
                /** @var DetailPembayaranNonTunai|null $detail */
                $detail = DetailPembayaranNonTunai::where('id_transaksi', $orderId)
                    ->lockForUpdate()
                    ->first();

                if ($detail === null) {
                    Log::warning('[PaymentController@webhook] Detail pembayaran non tunai tidak ditemukan.', [
                        'order_id' => $orderId,
                    ]);
                    return;
                }

                // --------------------------------------------------------------
                // 4c. Simpan raw payload mentah untuk keperluan audit & debugging
                // --------------------------------------------------------------
                $detail->update(['raw_callback_payload' => $payload]);

                // --------------------------------------------------------------
                // 4d. Mapping status Midtrans → status internal POS
                // --------------------------------------------------------------
                // Referensi status Midtrans:
                //   settlement → Pembayaran berhasil dikonfirmasi (QRIS, transfer, dll)
                //   capture    → Pembayaran kartu kredit berhasil
                //   pending    → Menunggu pembayaran (tidak ada perubahan)
                //   expire     → Waktu pembayaran habis
                //   deny       → Ditolak oleh bank/acquirer
                //   cancel     → Dibatalkan oleh merchant atau customer
                //   refund     → Dana dikembalikan (handled terpisah)
                // --------------------------------------------------------------

                if ($transactionStatus === 'settlement' || $transactionStatus === 'capture') {
                    // ----------------------------------------------------------
                    // PEMBAYARAN BERHASIL ✓
                    // ----------------------------------------------------------
                    // Untuk 'capture' (kartu kredit), tambahkan pengecekan fraud_status.
                    // Untuk 'settlement' (QRIS/transfer), fraud_status selalu 'accept'.
                    // ----------------------------------------------------------
                    if ($transactionStatus === 'capture' && $fraudStatus !== 'accept') {
                        // Kartu kredit terindikasi fraud — tolak
                        $detail->update(['status_api' => 'DENIED']);
                        $transaksi->update(['status' => 'Cancelled']);

                        Log::warning('[PaymentController@webhook] Capture ditolak karena fraud.', [
                            'order_id'     => $orderId,
                            'fraud_status' => $fraudStatus,
                        ]);
                        return;
                    }

                    // Pembayaran berhasil → update ke SETTLEMENT + Success
                    $detail->update(['status_api' => 'SETTLEMENT']);
                    $transaksi->update(['status' => 'Success']);

                    Log::info('[PaymentController@webhook] ✓ Pembayaran BERHASIL — Transaksi SUCCESS.', [
                        'order_id'           => $orderId,
                        'transaction_status' => $transactionStatus,
                    ]);

                } elseif ($transactionStatus === 'expire') {
                    // ----------------------------------------------------------
                    // QR CODE KADALUWARSA ✗
                    // ----------------------------------------------------------
                    $detail->update(['status_api' => 'EXPIRED']);
                    $transaksi->update(['status' => 'Cancelled']);

                    Log::info('[PaymentController@webhook] QR Code EXPIRED — Transaksi CANCELLED.', [
                        'order_id' => $orderId,
                    ]);

                } elseif ($transactionStatus === 'deny' || $transactionStatus === 'cancel') {
                    // ----------------------------------------------------------
                    // PEMBAYARAN DITOLAK / DIBATALKAN ✗
                    // ----------------------------------------------------------
                    $detail->update(['status_api' => 'DENIED']);
                    $transaksi->update(['status' => 'Cancelled']);

                    Log::info('[PaymentController@webhook] Pembayaran DITOLAK/DIBATALKAN — Transaksi CANCELLED.', [
                        'order_id'           => $orderId,
                        'transaction_status' => $transactionStatus,
                    ]);

                } elseif ($transactionStatus === 'pending') {
                    // ----------------------------------------------------------
                    // STATUS PENDING — Tidak ada perubahan, QR masih aktif
                    // ----------------------------------------------------------
                    Log::info('[PaymentController@webhook] Status masih PENDING — tidak ada perubahan.', [
                        'order_id' => $orderId,
                    ]);

                } else {
                    // ----------------------------------------------------------
                    // Status tidak dikenal — log untuk investigasi
                    // ----------------------------------------------------------
                    Log::warning('[PaymentController@webhook] Status Midtrans tidak dikenal.', [
                        'order_id'           => $orderId,
                        'transaction_status' => $transactionStatus,
                    ]);
                }
            });

        } catch (Throwable $e) {
            // Jika terjadi error DB atau error tak terduga, log dan return 500
            // agar Midtrans bisa retry di lain waktu.
            Log::error('[PaymentController@webhook] Error saat memproses webhook.', [
                'order_id' => $orderId,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi error internal saat memproses webhook.',
            ], 500);
        }

        // =====================================================================
        // LANGKAH 5: Return HTTP 200 OK (wajib agar Midtrans tidak retry)
        // =====================================================================
        return response()->json([
            'status'  => 'success',
            'message' => 'Webhook processed successfully.',
        ], 200);
    }

    // =========================================================================
    // ENDPOINT 3: GET /api/v1/payment/status/{id_transaksi}
    // Polling status transaksi dari HP Kasir
    // Middleware: auth:sanctum
    // =========================================================================

    /**
     * Mengecek status terkini transaksi (polling endpoint untuk HP Kasir).
     *
     * HP Kasir perlu melakukan polling endpoint ini setelah menampilkan QR Code
     * untuk mengetahui apakah customer sudah melakukan pembayaran. Setelah
     * Midtrans mengirim webhook dan status berubah menjadi 'Success', kasir
     * akan mendapat konfirmasi dan bisa mencetak struk.
     *
     * Response mencakup:
     *   - Status transaksi header (Draft/Pending/Success/Cancelled)
     *   - Status API pembayaran non-tunai (PENDING/SETTLEMENT/EXPIRED/DENIED)
     *   - Sisa waktu kadaluwarsa QR Code
     *
     * Rekomendasi interval polling: setiap 3–5 detik dari HP Kasir.
     *
     * @param  string  $id_transaksi  UUID transaksi dari path parameter.
     * @return JsonResponse
     */
    public function cekStatus(string $id_transaksi): JsonResponse
    {
        // =====================================================================
        // Ambil Transaksi beserta detail pembayaran non-tunai
        // =====================================================================
        /** @var Transaksi|null $transaksi */
        $transaksi = Transaksi::where('id_transaksi', $id_transaksi)
            ->with(['detailPembayaranNonTunai'])
            ->first();

        if ($transaksi === null) {
            return response()->json([
                'success' => false,
                'message' => "Transaksi dengan ID '{$id_transaksi}' tidak ditemukan.",
                'data'    => null,
            ], 404);
        }

        /** @var DetailPembayaranNonTunai|null $detail */
        $detail = $transaksi->detailPembayaranNonTunai;

        // =====================================================================
        // Build response dengan informasi status lengkap
        // =====================================================================
        return response()->json([
            'success' => true,
            'message' => 'Data status transaksi berhasil diambil.',
            'data'    => [
                // Status header transaksi
                'id_transaksi'   => $transaksi->id_transaksi,
                'status'         => $transaksi->status,
                'total'          => (float) $transaksi->total,

                // Status pembayaran non-tunai (null untuk transaksi tunai)
                'pembayaran'     => $detail ? [
                    'payment_gateway_id' => $detail->payment_gateway_id,
                    'status_api'         => $detail->status_api,
                    'waktu_kedaluwarsa'  => $detail->waktu_kedaluwarsa?->toIso8601String(),

                    // Sisa waktu dalam detik (negatif = sudah expired)
                    'sisa_detik'         => $detail->waktu_kedaluwarsa
                        ? (int) now()->diffInSeconds($detail->waktu_kedaluwarsa, false)
                        : null,

                    // Flag kemudahan untuk UI kasir
                    'sudah_dibayar'      => $detail->status_api === 'SETTLEMENT',
                    'sudah_expired'      => $detail->status_api === 'EXPIRED'
                        || ($detail->waktu_kedaluwarsa && now()->isAfter($detail->waktu_kedaluwarsa)),
                ] : null,
            ],
        ], 200);
    }
}

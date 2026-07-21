<?php

namespace App\Services;

use App\Models\Transaksi;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * MidtransService
 *
 * Service class tunggal yang mengekapsulasi seluruh logika komunikasi
 * dengan Midtrans Core API (Sandbox / Production) serta mekanisme verifikasi
 * keamanan Signature Key untuk webhook callback.
 *
 * Arsitektur: Service Pattern — Controller tetap tipis, bisnis logic ada di sini.
 * Injeksi: Dapat di-inject via Laravel DI Container di constructor Controller.
 *
 * Method yang tersedia:
 *   - generateQris(Transaksi $transaksi): array  → Membuat charge QRIS dinamis
 *   - verifySignatureKey(array $payload): bool   → Verifikasi keaslian webhook
 *
 * Referensi:
 *   - Midtrans Core API Docs: https://docs.midtrans.com/reference/charge-transactions-1
 *   - SDD Bab V — Payment Gateway Integration
 *   - Tiket JIRA: POS-10A, POS-11
 */
class MidtransService
{
    /**
     * Base URL Midtrans Core API.
     * Ditentukan secara otomatis berdasarkan `MIDTRANS_IS_PRODUCTION`.
     */
    private string $baseUrl;

    /**
     * Server Key Midtrans untuk otentikasi Basic Auth.
     * Dibaca dari konfigurasi `config/midtrans.php` → env `MIDTRANS_SERVER_KEY`.
     */
    private string $serverKey;

    /**
     * Nama acquirer QRIS yang digunakan.
     * Default: 'gopay'. Opsi lain: 'airpay shopee'.
     */
    private string $qrisAcquirer;

    /**
     * Waktu kadaluwarsa QR Code dalam menit.
     * Default: 15 menit sesuai kebijakan UX tim.
     */
    private int $qrisExpiryMinutes;

    /**
     * Inisialisasi service dengan membaca konfigurasi dari config/midtrans.php.
     * Constructor ini dipanggil sekali ketika service di-resolve dari IoC Container.
     */
    public function __construct()
    {
        $this->baseUrl           = config('midtrans.base_url');
        $this->serverKey         = config('midtrans.server_key');
        $this->qrisAcquirer      = config('midtrans.qris_acquirer', 'gopay');
        $this->qrisExpiryMinutes = (int) config('midtrans.qris_expiry_minutes', 15);
    }

    // =========================================================================
    // PUBLIC METHOD: generateQris
    // =========================================================================

    /**
     * Membuat transaksi QRIS dinamis melalui Midtrans Core API.
     *
     * Method ini mengirimkan HTTP POST ke endpoint `/v2/charge` Midtrans dengan
     * payment_type = 'qris' dan memformat payload sesuai spesifikasi resmi Midtrans.
     *
     * Proses:
     *   1. Menyusun payload JSON request sesuai format Core API Midtrans.
     *   2. Mengirim request dengan Basic Auth (server_key sebagai username, password kosong).
     *   3. Memvalidasi status HTTP response (2xx = sukses).
     *   4. Mengekstrak `transaction_id` dan `qr_string` / `actions[0].url` dari response.
     *   5. Mengembalikan array terstruktur untuk disimpan ke DB.
     *
     * @param  Transaksi $transaksi  Model transaksi yang sudah tersimpan di DB (status Draft/Pending).
     * @return array{
     *   transaction_id: string,
     *   order_id: string,
     *   qr_string: string,
     *   gross_amount: int,
     *   transaction_status: string,
     *   transaction_time: string,
     *   expiry_time: string|null,
     *   raw_response: array
     * }
     *
     * @throws RuntimeException Jika request gagal, timeout, atau status bukan PENDING dari Midtrans.
     * @throws ConnectionException Jika tidak bisa terhubung ke server Midtrans.
     */
    public function generateQris(Transaksi $transaksi): array
    {
        // =====================================================================
        // LANGKAH 1: Susun payload request sesuai Midtrans Core API Spec
        // =====================================================================
        // order_id menggunakan UUID transaksi (unik, idempoten untuk retry).
        // gross_amount harus bilangan bulat (integer), dibulatkan dengan round().
        // =====================================================================
        $grossAmount = (int) round((float) $transaksi->total);

        $payload = [
            'payment_type' => 'qris',

            // Detail transaksi (wajib)
            'transaction_details' => [
                'order_id'     => $transaksi->id_transaksi, // UUID v4 sebagai order_id unik
                'gross_amount' => $grossAmount,
            ],

            // Konfigurasi QRIS: tentukan acquirer yang digunakan
            'qris' => [
                'acquirer' => $this->qrisAcquirer, // 'gopay' | 'airpay shopee'
            ],

            // Informasi item (opsional tapi direkomendasikan untuk reconciliation)
            'item_details' => [
                [
                    'id'       => $transaksi->id_transaksi,
                    'price'    => $grossAmount,
                    'quantity' => 1,
                    'name'     => 'Pembayaran Transaksi POS Event',
                ],
            ],

            // Custom expiry: waktu kadaluwarsa QR Code
            'custom_expiry' => [
                'expiry_duration' => $this->qrisExpiryMinutes,
                'unit'            => 'minute',
            ],
        ];

        // =====================================================================
        // LANGKAH 2: Kirim HTTP POST ke Midtrans Core API
        // =====================================================================
        // Basic Auth: username = server_key, password = '' (string kosong)
        // Content-Type: application/json (otomatis di-set oleh Http::asJson())
        // =====================================================================
        $endpoint = $this->baseUrl . '/v2/charge';

        Log::info('[MidtransService] Mengirim request charge QRIS ke Midtrans.', [
            'endpoint'    => $endpoint,
            'order_id'    => $transaksi->id_transaksi,
            'gross_amount' => $grossAmount,
        ]);

        try {
            $response = Http::withBasicAuth($this->serverKey, '')
                ->acceptJson()
                ->asJson()
                ->timeout(30) // timeout 30 detik — Midtrans bisa lambat saat peak time
                ->post($endpoint, $payload);
        } catch (ConnectionException $e) {
            // Tidak bisa terhubung ke server Midtrans (timeout, DNS, dll)
            Log::error('[MidtransService] Koneksi ke Midtrans gagal.', [
                'order_id' => $transaksi->id_transaksi,
                'error'    => $e->getMessage(),
            ]);
            throw new RuntimeException(
                'Gagal terhubung ke server Midtrans. Periksa koneksi internet server: ' . $e->getMessage(),
                0,
                $e
            );
        }

        // =====================================================================
        // LANGKAH 3: Validasi response HTTP
        // =====================================================================
        // Midtrans mengembalikan 2xx untuk sukses, 4xx/5xx untuk error.
        // Status 201 = transaksi baru di-create. Status 200 = transaksi sudah ada.
        // =====================================================================
        if ($response->failed()) {
            $errorBody = $response->json() ?? [];
            Log::error('[MidtransService] Midtrans mengembalikan error response.', [
                'order_id'    => $transaksi->id_transaksi,
                'http_status' => $response->status(),
                'body'        => $errorBody,
            ]);

            $errorMessage = $errorBody['status_message']
                ?? $errorBody['error_messages'][0]
                ?? 'Response error dari Midtrans.';

            throw new RuntimeException(
                "Midtrans Error [{$response->status()}]: {$errorMessage}"
            );
        }

        // =====================================================================
        // LANGKAH 4: Parsing response JSON dari Midtrans
        // =====================================================================
        $responseData = $response->json();

        Log::info('[MidtransService] Midtrans charge berhasil.', [
            'order_id'       => $transaksi->id_transaksi,
            'transaction_id' => $responseData['transaction_id'] ?? 'N/A',
            'status'         => $responseData['transaction_status'] ?? 'N/A',
        ]);

        // =====================================================================
        // LANGKAH 5: Ekstrak data yang dibutuhkan dari response
        // =====================================================================
        // Midtrans QRIS mengembalikan QR string dalam 2 kemungkinan lokasi:
        //   a. `actions[0].url` — untuk Core API v2 dengan GoPay/ShopeePay
        //   b. `qr_string`      — field langsung (beberapa acquirer)
        // Kita ambil keduanya dengan fallback yang aman.
        // =====================================================================
        $qrString = $this->extractQrString($responseData);

        if (empty($qrString)) {
            Log::error('[MidtransService] QR String tidak ditemukan dalam response Midtrans.', [
                'order_id' => $transaksi->id_transaksi,
                'response' => $responseData,
            ]);
            throw new RuntimeException(
                'QR String tidak ditemukan dalam response Midtrans. Periksa konfigurasi acquirer QRIS.'
            );
        }

        return [
            'transaction_id'     => $responseData['transaction_id'] ?? '',
            'order_id'           => $responseData['order_id'] ?? $transaksi->id_transaksi,
            'qr_string'          => $qrString,
            'gross_amount'       => (int) ($responseData['gross_amount'] ?? $grossAmount),
            'transaction_status' => $responseData['transaction_status'] ?? 'pending',
            'transaction_time'   => $responseData['transaction_time'] ?? now()->toDateTimeString(),
            'expiry_time'        => $responseData['expiry_time'] ?? null,
            'raw_response'       => $responseData,
        ];
    }

    // =========================================================================
    // PUBLIC METHOD: verifySignatureKey
    // =========================================================================

    /**
     * Memverifikasi keaslian payload webhook yang diterima dari Midtrans.
     *
     * Formula signature Midtrans (sesuai dokumentasi resmi):
     *   SHA-512( order_id + status_code + gross_amount + ServerKey )
     *
     * Proses:
     *   1. Ambil `order_id`, `status_code`, `gross_amount` dari payload.
     *   2. Gabungkan string: order_id + status_code + gross_amount + server_key
     *   3. Hash dengan SHA-512.
     *   4. Bandingkan dengan `signature_key` dari payload (timing-safe compare).
     *
     * @param  array $payload  Array payload JSON yang diterima dari webhook Midtrans.
     * @return bool            true jika signature valid (webhook asli dari Midtrans),
     *                         false jika signature tidak cocok (indikasi fraud/spoofing).
     */
    public function verifySignatureKey(array $payload): bool
    {
        // Ambil field yang dibutuhkan dari payload webhook Midtrans
        $orderId       = $payload['order_id']      ?? '';
        $statusCode    = $payload['status_code']   ?? '';
        $grossAmount   = $payload['gross_amount']  ?? '';
        $signatureKey  = $payload['signature_key'] ?? '';

        // Formula: SHA-512(order_id + status_code + gross_amount + ServerKey)
        $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);

        // Timing-safe comparison menggunakan hash_equals() untuk mencegah timing attack
        $isValid = hash_equals($expectedSignature, $signatureKey);

        if (!$isValid) {
            Log::warning('[MidtransService] Verifikasi signature webhook GAGAL — kemungkinan fraud/spoofing!', [
                'order_id'           => $orderId,
                'status_code'        => $statusCode,
                'received_signature' => $signatureKey,
                'ip'                 => request()->ip(),
            ]);
        }

        return $isValid;
    }

    // =========================================================================
    // PRIVATE HELPER METHOD
    // =========================================================================

    /**
     * Mengekstrak QR string dari berbagai format response Midtrans.
     *
     * Midtrans Core API memiliki perbedaan format antara acquirer:
     *   - GoPay QRIS  : `actions[0].url` (deep link / QR URL)
     *   - Shopee Pay  : `actions[0].url`
     *   - Direct QRIS : `qr_string` (raw string)
     *
     * Method ini mencoba semua lokasi yang mungkin secara berurutan
     * untuk memastikan kompatibilitas maksimal.
     *
     * @param  array  $responseData  Decoded JSON response dari Midtrans.
     * @return string                QR string / URL, atau string kosong jika tidak ditemukan.
     */
    private function extractQrString(array $responseData): string
    {
        // Prioritas 1: `actions` array (format GoPay/Shopee Pay QRIS)
        // Berisi deep link atau URL yang bisa di-render sebagai QR Code
        if (!empty($responseData['actions']) && is_array($responseData['actions'])) {
            foreach ($responseData['actions'] as $action) {
                // Cari action dengan name 'generate-qr-code' atau ambil URL pertama
                if (isset($action['url']) && !empty($action['url'])) {
                    if (isset($action['name']) && str_contains(strtolower($action['name']), 'qr')) {
                        return (string) $action['url'];
                    }
                }
            }
            // Fallback: ambil URL dari action pertama jika tidak ada yang namanya 'qr'
            if (!empty($responseData['actions'][0]['url'])) {
                return (string) $responseData['actions'][0]['url'];
            }
        }

        // Prioritas 2: `qr_string` langsung (beberapa acquirer mengembalikan ini)
        if (!empty($responseData['qr_string'])) {
            return (string) $responseData['qr_string'];
        }

        return '';
    }
}

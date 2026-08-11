<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ConfirmTransactionRequest;
use App\Http\Requests\Api\V1\VoidTransactionRequest;
use App\Http\Requests\V1\CheckoutDraftRequest;
use App\Http\Resources\TransaksiResource;
use App\Models\Cabang;
use App\Models\MenuTemplate;
use App\Models\OtpCode;
use App\Models\Promosi;
use App\Models\ShiftSession;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * CheckoutController — POS-A-05 & POS-A-06 (Sprint 2)
 *
 * Mengelola proses pembuatan dan penyelesaian transaksi penjualan.
 *
 * Endpoint:
 *   - POST /api/v1/checkout/draft        → Buat draft transaksi baru
 *   - POST /api/v1/checkout/{id}/confirm → Konfirmasi pelunasan (tunai / non-tunai direct)
 *   - POST /api/v1/checkout/{id}/void    → Void transaksi (Draft: tanpa OTP | Success: wajib OTP)
 */
class CheckoutController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    // =========================================================================
    // [POS-A-05] CONFIRM TRANSACTION
    // =========================================================================

    /**
     * Konfirmasi pelunasan transaksi Draft menjadi 'Success'.
     * Endpoint: POST /api/v1/checkout/{id}/confirm
     *
     * Mendukung dua mode pembayaran:
     *   1. Tunai    : nomor_referensi = null
     *   2. Non-tunai: kasir mengisi nomor_referensi (RRN EDC / bukti transfer)
     *
     * Tidak ada payment gateway — pembayaran diverifikasi secara manual oleh kasir.
     */
    public function confirmTransaction(
        ConfirmTransactionRequest $request,
        string $id_transaksi
    ): JsonResponse {
        $transaksi = DB::transaction(function () use ($request, $id_transaksi): Transaksi {
            $transaksi = Transaksi::where('id_transaksi', $id_transaksi)
                ->lockForUpdate()
                ->first();

            abort_if($transaksi === null, 404, 'Transaksi tidak ditemukan.');

            // Hanya Draft yang bisa dikonfirmasi (status Pending sudah dihapus dari arsitektur)
            if ($transaksi->status !== 'Draft') {
                abort(422, 'Transaksi hanya dapat dikonfirmasi dari status "Draft". Status saat ini: ' . $transaksi->status);
            }

            $now      = now();
            $payload  = $request->validated();

            $transaksi->update([
                'status'            => 'Success',
                'tanggal_transaksi' => $now->format('Y-m-d'),
                'jam_transaksi'     => $now->format('H:i:s'),
                // nomor_referensi: null untuk tunai, diisi untuk non-tunai manual
                'nomor_referensi'   => $payload['nomor_referensi'] ?? null,
            ]);

            return $transaksi;
        });

        $this->loadTransactionRelations($transaksi);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dikonfirmasi (Success).',
            'data'    => new TransaksiResource($transaksi),
        ]);
    }

    // =========================================================================
    // [POS-A-06] VOID TRANSACTION — Draft (tanpa OTP) | Success (wajib OTP Admin)
    // =========================================================================

    /**
     * Void transaksi dengan aturan berbeda berdasarkan status.
     * Endpoint: POST /api/v1/checkout/{id}/void
     *
     * ATURAN BISNIS (PRD v1.1-Sprint2 § 2.3):
     * ─────────────────────────────────────────
     * ● Status 'Draft':
     *     - Kasir boleh void/hapus item atau seluruh transaksi TANPA OTP Admin.
     *     - Ubah status → 'Cancelled' (bukan 'Void' — karena belum ada pembayaran).
     *
     * ● Status 'Success':
     *     - Void WAJIB menyertakan kode OTP Admin yang valid (6 digit, TTL 1 menit).
     *     - Kode divalidasi: exists, belum dipakai (used_at NULL), belum expired.
     *     - Jika valid: void transaksi + semua item → catat ke audit_logs → pakai kode.
     *     - Ubah status → 'Void'.
     *
     * ● Status selain Draft/Success → tolak 422.
     */
    public function voidTransaction(
        VoidTransactionRequest $request,
        string $id_transaksi
    ): JsonResponse {
        $payload = $request->validated();

        $transaksi = DB::transaction(function () use ($request, $id_transaksi, $payload): Transaksi {
            $transaksi = Transaksi::where('id_transaksi', $id_transaksi)
                ->lockForUpdate()
                ->first();

            abort_if($transaksi === null, 404, 'Transaksi tidak ditemukan.');

            // ─────────────────────────────────────────────
            // CABANG 1: Draft → Cancelled (tanpa OTP)
            // ─────────────────────────────────────────────
            if ($transaksi->status === 'Draft') {
                $dataSebelum = $transaksi->toArray();

                $transaksi->update([
                    'status'          => 'Cancelled',
                    'alasan_batal'    => $payload['alasan_batal'] ?? 'Dibatalkan oleh kasir.',
                    'diperbarui_oleh' => $request->user()->id_kasir,
                    'catatan_koreksi' => 'Draft dibatalkan pada ' . now()->toDateTimeString(),
                ]);

                // Void semua item detail
                TransaksiDetail::where('id_transaksi', $transaksi->id_transaksi)->update([
                    'status_item'       => 'Void',
                    'alasan_batal_item' => $payload['alasan_batal'] ?? 'Transaksi dibatalkan.',
                    'updated_at'        => now(),
                ]);

                // Audit log untuk void Draft (tanpa OTP — informasi saja)
                $this->auditLogService->log(
                    aktivitas:    'CANCEL_DRAFT',
                    tabelTarget:  'transaksi',
                    idTarget:     $transaksi->id_transaksi,
                    idUserAktor:  $request->user()->id_kasir,
                    dataSebelum:  $dataSebelum,
                    dataSesudah:  $transaksi->fresh()->toArray()
                );

                return $transaksi->fresh();
            }

            // ─────────────────────────────────────────────
            // CABANG 2: Success → Void (wajib OTP Admin Target-Bound)
            // ─────────────────────────────────────────────
            if ($transaksi->status === 'Success') {
                $kodeOtp = $payload['kode_otp'] ?? null;

                // Kode OTP wajib ada untuk void Success
                if (empty($kodeOtp)) {
                    abort(422, 'Kode OTP Admin wajib diisi untuk mem-void transaksi yang sudah lunas (Success).');
                }

                /** @var \App\Models\Kasir $kasir */
                $kasir = $request->user();

                // Cari OTP berdasarkan kode yang dikirimkan
                /** @var OtpCode|null $otpRecord */
                $otpRecord = OtpCode::where('otp_code', $kodeOtp)
                    ->where('status', 'active')
                    ->where('expires_at', '>', now())
                    ->lockForUpdate()
                    ->first();

                // OTP tidak ditemukan / sudah expired / sudah dipakai
                if ($otpRecord === null) {
                    abort(403, 'Kode OTP tidak valid, sudah digunakan, atau sudah kadaluarsa. Minta kode baru dari Admin.');
                }

                // Poin 8: VALIDASI TARGET (Disederhanakan): OTP hanya perlu cocok dengan id_shift transaksi
                if ($otpRecord->id_shift !== $transaksi->id_shift) {
                    abort(403, 'Kode OTP ini tidak terdaftar untuk Sesi Shift dari transaksi ini!');
                }

                // Semua validasi lolos — tandai OTP sebagai sudah dipakai
                $otpRecord->update([
                    'status'  => 'used',
                    'used_at' => now(),
                ]);

                $dataSebelum = $transaksi->toArray();

                $transaksi->update([
                    'status'          => 'Void',
                    'alasan_batal'    => $payload['alasan_batal'] ?? 'Void transaksi oleh Admin.',
                    'diperbarui_oleh' => $kasir->id_kasir,
                    'catatan_koreksi' => 'Void dilakukan dengan otorisasi OTP Admin pada ' . now()->toDateTimeString(),
                ]);

                // Void semua item detail
                TransaksiDetail::where('id_transaksi', $transaksi->id_transaksi)->update([
                    'status_item'       => 'Void',
                    'alasan_batal_item' => $payload['alasan_batal'] ?? 'Void transaksi oleh Admin.',
                    'updated_at'        => now(),
                ]);

                // Audit log WAJIB untuk void Success (snapshot before/after + aktor)
                $this->auditLogService->log(
                    aktivitas:    'VOID_TRANSACTION',
                    tabelTarget:  'transaksi',
                    idTarget:     $transaksi->id_transaksi,
                    idUserAktor:  $kasir->id_kasir,
                    dataSebelum:  $dataSebelum,
                    dataSesudah:  array_merge(
                        $transaksi->fresh()->toArray(),
                        ['id_otp_dipakai' => $otpRecord->id_otp]
                    )
                );

                return $transaksi->fresh();
            }

            // ─────────────────────────────────────────────
            // CABANG 3: Status tidak valid
            // ─────────────────────────────────────────────
            abort(422, 'Transaksi berstatus "' . $transaksi->status . '" tidak dapat di-void. Hanya "Draft" atau "Success".');
        });

        $this->loadTransactionRelations($transaksi);

        $isDraft = $transaksi->status === 'Cancelled';

        return response()->json([
            'success' => true,
            'message' => $isDraft
                ? 'Draft transaksi berhasil dibatalkan.'
                : 'Transaksi berhasil di-void dengan otorisasi OTP Admin.',
            'data'    => new TransaksiResource($transaksi),
        ]);
    }

    // =========================================================================
    // [POS-A-05] STORE DRAFT
    // =========================================================================

    /**
     * Membuat draft transaksi baru.
     * Endpoint: POST /api/v1/checkout/draft
     *
     * Alur:
     *   1. Validasi shift aktif (OPEN) milik kasir.
     *   2. Ambil data Cabang untuk kalkulasi pajak.
     *   3. Hitung subtotal per item = (harga × qty) - diskon promo item.
     *   4. Hitung total header = subtotal_all - promo_transaksi + pajak.
     *   5. Simpan Transaksi + TransaksiDetail dalam DB::transaction atomic.
     */
    public function storeDraft(CheckoutDraftRequest $request): JsonResponse
    {
        /** @var \App\Models\Kasir $kasir */
        $kasir     = $request->user();
        $validated = $request->validated();

        // Validasi shift aktif milik kasir
        /** @var ShiftSession|null $shift */
        $shift = ShiftSession::where('id_shift', $validated['id_shift'])
            ->where('id_kasir', $kasir->id_kasir)
            ->where('status_shift', 'OPEN')
            ->first();

        if ($shift === null) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi shift tidak aktif atau tidak valid! Pastikan shift milik Anda dan berstatus OPEN.',
                'data'    => null,
            ], 422);
        }

        /** @var Cabang $cabang */
        $cabang      = Cabang::where('id_cabang', $validated['id_cabang'])->firstOrFail();
        // Poin 4: jika pajak_persen null (cabang tanpa pajak), default ke 0
        $pajakPersen = $cabang->pajak_persen !== null ? (float) $cabang->pajak_persen : 0.0;

        $transaksi = DB::transaction(function () use ($kasir, $validated, $pajakPersen): Transaksi {

            // ─────────────────────────────────────────────
            // Kalkulasi subtotal per item
            // ─────────────────────────────────────────────
            $detailsData       = [];
            $totalBelanjaBruto = 0.0;

            foreach ($validated['items'] as $item) {
                // Ambil harga dari input (offline-sync) atau dari menu_template
                if (isset($item['harga_produk']) && $item['harga_produk'] !== null) {
                    $harga = (float) $item['harga_produk'];
                } else {
                    // Poin 2: Harga dari MenuTemplate kini hanya berdasarkan id_menu + id_sales (tanpa id_cabang)
                    $hargaTemplate = MenuTemplate::where('id_menu', $item['id_produk'])
                        ->where('id_sales', $validated['id_sales'])
                        ->value('harga_produk');

                    $harga = $hargaTemplate !== null ? (float) $hargaTemplate : 0.00;
                }

                $qty = (int) $item['quantity'];

                // Kalkulasi promo item
                $nominalPromoItem = 0.00;
                if (isset($item['nominal_promo']) && $item['nominal_promo'] !== null) {
                    $nominalPromoItem = (float) $item['nominal_promo'];
                } elseif (! empty($item['id_promo'])) {
                    $promoItem = Promosi::find($item['id_promo']);
                    if ($promoItem && $promoItem->nilai_promo !== null) {
                        $nominalPromoItem = $promoItem->tipe_promo === 'Persen'
                            ? round(($harga * $qty) * ((float) $promoItem->nilai_promo / 100), 2)
                            : (float) $promoItem->nilai_promo;
                    }
                }

                $subtotalItem = max(0.0, ($harga * $qty) - $nominalPromoItem);
                $totalBelanjaBruto += $subtotalItem;

                $detailsData[] = [
                    'id_transaksi'  => null,
                    'id_produk'     => $item['id_produk'],
                    'harga_produk'  => $harga,
                    'quantity'      => $qty,
                    'id_promo'      => $item['id_promo'] ?? null,
                    'nominal_promo' => $nominalPromoItem,
                    'subtotal_item' => $subtotalItem,
                    'status_item'   => 'Active',
                ];
            }

            // ─────────────────────────────────────────────
            // Kalkulasi finansial header
            // ─────────────────────────────────────────────
            $nominalPromoTransaksi = 0.00;
            if (isset($validated['nominal_promo']) && $validated['nominal_promo'] !== null) {
                $nominalPromoTransaksi = (float) $validated['nominal_promo'];
            } elseif (! empty($validated['id_promo'])) {
                $promoHeader = Promosi::find($validated['id_promo']);
                if ($promoHeader && $promoHeader->nilai_promo !== null) {
                    $nominalPromoTransaksi = $promoHeader->tipe_promo === 'Persen'
                        ? round($totalBelanjaBruto * ((float) $promoHeader->nilai_promo / 100), 2)
                        : (float) $promoHeader->nilai_promo;
                }
            }

            $basisKenaPajak = max(0.0, $totalBelanjaBruto - $nominalPromoTransaksi);
            $nominalTax     = round($basisKenaPajak * ($pajakPersen / 100), 2);
            $totalBersih    = round($basisKenaPajak + $nominalTax, 2);

            // ─────────────────────────────────────────────
            // Simpan header Transaksi
            // ─────────────────────────────────────────────
            $dataHeader = [
                'id_sales'          => $validated['id_sales'],
                'id_cabang'         => $validated['id_cabang'],
                'id_kasir'          => $kasir->id_kasir,
                'id_metode'         => $validated['id_metode'],
                'id_shift'          => $validated['id_shift'],
                'id_promo'          => $validated['id_promo'] ?? null,
                'tanggal_transaksi' => now()->format('Y-m-d'),
                'jam_transaksi'     => now()->format('H:i:s'),
                'nama_pelanggan'    => $validated['nama_pelanggan'] ?? null,
                'nominal_promo'     => $nominalPromoTransaksi,
                'tax'               => $nominalTax,
                'total'             => $totalBersih,
                'status'            => 'Draft',
            ];

            // Gunakan UUID dari client jika ada (offline-sync idempotency)
            if (! empty($validated['id_transaksi'])) {
                $dataHeader['id_transaksi'] = $validated['id_transaksi'];
            }

            $transaksi = Transaksi::create($dataHeader);

            // ─────────────────────────────────────────────
            // Simpan detail items
            // ─────────────────────────────────────────────
            foreach ($detailsData as $detail) {
                $detail['id_transaksi'] = $transaksi->id_transaksi;
                TransaksiDetail::create($detail);
            }

            return $transaksi;
        });

        $transaksi->load([
            'kasir',
            'cabang',
            'salesMode',
            'metodePembayaran',
            'promosi',
            'details.menu',
            'details.promosi',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Draft transaksi berhasil dibuat.',
            'data'    => new TransaksiResource($transaksi),
        ], 201);
    }

    // =========================================================================
    // HELPER PRIVATE
    // =========================================================================

    private function loadTransactionRelations(Transaksi $transaksi): void
    {
        $transaksi->load([
            'cabang',
            'salesMode',
            'metodePembayaran',
            'kasir',
            'promosi',
            'details.menu',
            'details.promosi',
        ]);
    }
}

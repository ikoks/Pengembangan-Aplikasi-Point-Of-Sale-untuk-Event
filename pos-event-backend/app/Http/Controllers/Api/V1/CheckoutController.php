<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\CheckoutDraftRequest;
use App\Http\Resources\TransaksiResource;
use App\Models\Cabang;
use App\Models\MenuTemplate;
use App\Models\Promosi;
use App\Models\ShiftSession;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * CheckoutController — Hari ke-4 (API Checkout Draft Transaksi)
 *
 * Mengelola proses pembuatan transaksi penjualan dalam sistem POS Event.
 * Transaksi dibuat dengan status 'Draft' terlebih dahulu, memberikan
 * fleksibilitas untuk skenario online maupun offline-sync.
 *
 * Endpoint yang dikelola:
 *   - POST /api/v1/checkout/draft → Buat draft transaksi baru
 *
 * Endpoint selanjutnya (Hari ke-5+):
 *   - POST /api/v1/checkout/{id}/confirm → Konfirmasi menjadi status 'Success'
 *   - POST /api/v1/checkout/{id}/void    → Void transaksi
 *   - GET  /api/v1/transaksi             → Riwayat transaksi
 */
class CheckoutController extends Controller
{
    /**
     * Membuat draft transaksi baru (POS Hari ke-4).
     * Endpoint: POST /api/v1/checkout/draft
     * Middleware: auth:sanctum
     *
     * =========================================================================
     * ALUR BISNIS LENGKAP (Sesuai SRS 4.2.1 & SDD Use Case III.3):
     * =========================================================================
     *
     * 1. Identifikasi kasir dari Bearer Token aktif.
     * 2. Validasi shift: Pastikan shift milik kasir & statusnya 'OPEN'.
     * 3. Hitung subtotal tiap item: (harga_produk × quantity) - nominal_promo_item.
     * 4. Kalkulasi finansial header:
     *    a. Total Item  = ∑ subtotal_item semua baris.
     *    b. Potongan    = nominal_promo transaksi (dari input atau 0).
     *    c. Pajak       = (Total Item - Potongan) × (pajak_persen cabang / 100).
     *    d. Total Bersih = (Total Item - Potongan) + Pajak.
     * 5. Simpan record Transaksi (header) + seluruh TransaksiDetail dalam
     *    satu DB::transaction atomic — jika satu gagal, semua di-rollback.
     * 6. Return HTTP 201 dengan TransaksiResource yang sudah di-eager-load.
     *
     * @param  CheckoutDraftRequest $request  Input yang sudah divalidasi.
     */
    public function storeDraft(CheckoutDraftRequest $request): JsonResponse
    {
        /** @var \App\Models\UserModel $kasir */
        $kasir     = $request->user();
        $validated = $request->validated();

        // =====================================================================
        // LANGKAH 1: Validasi Kepemilikan & Status Shift
        // =====================================================================
        // Shift yang dikirim harus milik kasir yang sedang login DAN statusnya OPEN.
        // Ini mencegah kasir memakai shift orang lain atau shift yang sudah ditutup.
        // =====================================================================
        /** @var ShiftSession|null $shift */
        $shift = ShiftSession::where('id_shift', $validated['id_shift'])
            ->where('id_user', $kasir->id_user)
            ->where('status_shift', 'OPEN')
            ->first();

        if ($shift === null) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi shift tidak aktif atau tidak valid! Pastikan shift milik Anda dan berstatus OPEN.',
                'data'    => null,
            ], 422);
        }

        // =====================================================================
        // LANGKAH 2: Ambil data Cabang untuk kalkulasi pajak
        // =====================================================================
        /** @var Cabang $cabang */
        $cabang      = Cabang::where('id_cabang', $validated['id_cabang'])->firstOrFail();
        $pajakPersen = (float) $cabang->pajak_persen;

        // =====================================================================
        // LANGKAH 3 & 4 & 5: Kalkulasi + Simpan dalam DB Transaction
        // =====================================================================
        // Seluruh operasi INSERT dibungkus dalam satu transaction agar atomik:
        // Jika INSERT detail gagal, header transaksi juga otomatis di-rollback.
        // Tidak ada "transaksi tanpa detail" yang tersimpan di database.
        // =====================================================================
        $transaksi = DB::transaction(function () use ($kasir, $validated, $pajakPersen): Transaksi {

            // -----------------------------------------------------------------
            // LANGKAH 3: Kalkulasi subtotal per item & siapkan data bulk insert
            // -----------------------------------------------------------------
            $detailsData      = [];
            $totalBelanjaBruto = 0.0; // Akumulasi subtotal semua item

            foreach ($validated['items'] as $item) {
                // Ambil harga: jika dikirim oleh client (offline-sync) gunakan nilai tersebut,
                // jika null/opsional, cari otomatis dari tabel menu_template sesuai (id_produk + id_cabang + id_sales)
                if (isset($item['harga_produk']) && $item['harga_produk'] !== null) {
                    $harga = (float) $item['harga_produk'];
                } else {
                    $hargaTemplate = MenuTemplate::where('id_menu', $item['id_produk'])
                        ->where('id_cabang', $validated['id_cabang'])
                        ->where('id_sales', $validated['id_sales'])
                        ->value('harga_produk');

                    $harga = $hargaTemplate !== null ? (float) $hargaTemplate : 0.00;
                }

                $qty = (int) $item['quantity'];

                // Hitung nominal promo item secara otomatis dari DB jika id_promo dikirim tetapi nominal_promo null/kosong
                $nominalPromoItem = 0.00;
                if (isset($item['nominal_promo']) && $item['nominal_promo'] !== null) {
                    $nominalPromoItem = (float) $item['nominal_promo'];
                } elseif (!empty($item['id_promo'])) {
                    $promoItem = Promosi::find($item['id_promo']);
                    if ($promoItem && $promoItem->nilai_promo !== null) {
                        $nominalPromoItem = $promoItem->tipe_promo === 'Persen'
                            ? round(($harga * $qty) * ((float) $promoItem->nilai_promo / 100), 2)
                            : (float) $promoItem->nilai_promo;
                    }
                }

                // Subtotal = (harga × qty) - diskon per item
                // Tidak boleh negatif (floor at 0) untuk mencegah data anomali
                $subtotalItem  = max(0.0, ($harga * $qty) - $nominalPromoItem);

                $totalBelanjaBruto += $subtotalItem;

                $detailsData[] = [
                    'id_transaksi'   => null, // diisi setelah header tersimpan
                    'id_produk'      => $item['id_produk'],
                    'harga_produk'   => $harga,
                    'quantity'       => $qty,
                    'id_promo'       => $item['id_promo'] ?? null,
                    'nominal_promo'  => $nominalPromoItem,
                    'subtotal_item'  => $subtotalItem,
                    'status_item'    => 'Active',
                ];
            }

            // -----------------------------------------------------------------
            // LANGKAH 4: Kalkulasi finansial header transaksi
            // -----------------------------------------------------------------
            // Hitung nominal promo transaksi secara otomatis dari DB jika id_promo dikirim tetapi nominal_promo null/kosong
            $nominalPromoTransaksi = 0.00;
            if (isset($validated['nominal_promo']) && $validated['nominal_promo'] !== null) {
                $nominalPromoTransaksi = (float) $validated['nominal_promo'];
            } elseif (!empty($validated['id_promo'])) {
                $promoHeader = Promosi::find($validated['id_promo']);
                if ($promoHeader && $promoHeader->nilai_promo !== null) {
                    $nominalPromoTransaksi = $promoHeader->tipe_promo === 'Persen'
                        ? round($totalBelanjaBruto * ((float) $promoHeader->nilai_promo / 100), 2)
                        : (float) $promoHeader->nilai_promo;
                }
            }

            // Basis kena pajak = total belanja setelah dikurangi diskon transaksi
            $basisKenaPajak = max(0.0, $totalBelanjaBruto - $nominalPromoTransaksi);

            // Nominal pajak = basis × persentase pajak cabang
            $nominalTax     = round($basisKenaPajak * ($pajakPersen / 100), 2);

            // Total bersih final yang harus dibayar pelanggan
            $totalBersih    = round($basisKenaPajak + $nominalTax, 2);

            // -----------------------------------------------------------------
            // LANGKAH 5a: Simpan header Transaksi
            // Jika `id_transaksi` dikirim dari client (offline-sync), gunakan.
            // Jika tidak, biarkan Trait HasUuid yang membuatkan UUID baru.
            // -----------------------------------------------------------------
            $dataHeader = [
                'id_sales'          => $validated['id_sales'],
                'id_cabang'         => $validated['id_cabang'],
                'id_user'           => $kasir->id_user,
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

            // Sertakan id_transaksi dari client jika tersedia (offline-sync mode)
            if (!empty($validated['id_transaksi'])) {
                $dataHeader['id_transaksi'] = $validated['id_transaksi'];
            }

            $transaksi = Transaksi::create($dataHeader);

            // -----------------------------------------------------------------
            // LANGKAH 5b: Simpan setiap baris TransaksiDetail
            // FK id_transaksi diisi setelah header berhasil tersimpan
            // -----------------------------------------------------------------
            foreach ($detailsData as $detail) {
                $detail['id_transaksi'] = $transaksi->id_transaksi;
                TransaksiDetail::create($detail);
            }

            return $transaksi;
        });

        // =====================================================================
        // LANGKAH 6: Eager-load semua relasi untuk response yang informatif
        // =====================================================================
        $transaksi->load([
            'kasir',           // Data kasir pembuat
            'cabang',          // Data cabang
            'salesMode',       // Kanal penjualan
            'metodePembayaran', // Metode bayar
            'promosi',         // Promo level transaksi (jika ada)
            'details.menu',    // Setiap item beserta nama menunya
            'details.promosi', // Promo level item (jika ada)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Draft transaksi berhasil dibuat.',
            'data'    => new TransaksiResource($transaksi),
        ], 201);
    }
}

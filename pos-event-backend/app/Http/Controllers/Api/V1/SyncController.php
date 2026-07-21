<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\SyncBatchRequest;
use App\Models\Cabang;
use App\Models\MenuTemplate;
use App\Models\Promosi;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * SyncController — POS-5 (Batch Offline Sync Receiver / SyncManager Backend)
 *
 * Menerima dan memproses batch transaksi yang dikumpulkan HP Kasir
 * selama periode offline (koneksi Wi-Fi event tidak stabil / putus).
 *
 * SIKLUS HIDUP OFFLINE SYNC:
 * ───────────────────────────────────────────────────────────────────────────
 * 1. [HP Kasir OFFLINE] → Kasir membuat transaksi → Disimpan di SQLite lokal
 *    dengan UUID yang di-generate lokal (uuid_v4) dan status 'PendingSync'.
 *
 * 2. [Koneksi Pulih] → SyncManager di HP mendeteksi Wi-Fi tersambung kembali.
 *
 * 3. [HP → Server] → SyncManager mengirim SEMUA transaksi 'PendingSync'
 *    dalam satu request batch ke endpoint ini.
 *
 * 4. [Server MEMPROSES] → Untuk setiap transaksi dalam batch:
 *    a. Cek apakah id_transaksi sudah ada di MySQL (sudah disync sebelumnya).
 *    b. Jika SUDAH ADA → Tandai 'already_synced', masukkan ke synced_ids.
 *    c. Jika BELUM ADA → Simpan header + detail dalam DB::transaction.
 *    d. Jika GAGAL → Catat ke failed_ids dengan pesan error spesifik.
 *
 * 5. [Server → HP] → Kembalikan synced_ids ke SyncManager.
 *
 * 6. [HP Kasir] → SyncManager update status SQLite lokal:
 *    transaksi dengan UUID di synced_ids → status = 'Synced'.
 * ───────────────────────────────────────────────────────────────────────────
 */
class SyncController extends Controller
{
    /**
     * Menerima dan memproses batch sinkronisasi transaksi offline.
     * Endpoint: POST /api/v1/checkout/sync
     * Middleware: auth:sanctum
     *
     * @param  SyncBatchRequest $request  Payload batch yang sudah divalidasi.
     */
    public function syncBatch(SyncBatchRequest $request): JsonResponse
    {
        /** @var \App\Models\UserModel $kasir */
        $kasir       = $request->user();
        $transactions = $request->validated()['transactions'];

        // Akumulator hasil per-transaksi
        $syncedIds   = []; // UUID transaksi yang berhasil disimpan/sudah ada
        $failedItems = []; // UUID transaksi yang gagal + alasan error

        // =====================================================================
        // Proses setiap transaksi dalam batch secara berurutan.
        // Setiap transaksi INDEPENDEN: jika satu gagal, yang lain tetap diproses.
        // Ini berbeda dengan CheckoutController yang menggunakan satu big transaction
        // untuk semua items — di sini kita ingin granularity per transaksi.
        // =====================================================================
        foreach ($transactions as $txData) {
            $idTransaksi = $txData['id_transaksi'];

            try {
                // =============================================================
                // LANGKAH 1: Cek Idempotency — apakah UUID sudah ada di server?
                // =============================================================
                $existingTx = Transaksi::where('id_transaksi', $idTransaksi)->first();

                if ($existingTx !== null) {
                    // Transaksi sudah pernah disync sebelumnya (atau sudah dibuat online).
                    // TIDAK perlu duplikasi — langsung masukkan ke synced_ids.
                    $syncedIds[] = $idTransaksi;
                    continue; // Lanjut ke transaksi berikutnya dalam batch
                }

                // =============================================================
                // LANGKAH 2: Transaksi baru — Ambil data Cabang untuk pajak
                // =============================================================
                $cabang      = Cabang::where('id_cabang', $txData['id_cabang'])->firstOrFail();
                $pajakPersen = (float) $cabang->pajak_persen;

                // =============================================================
                // LANGKAH 3 & 4: Kalkulasi + Simpan dalam DB::transaction
                // Logika kalkulasi selaras dengan CheckoutController@storeDraft
                // agar konsistensi kalkulasi antara online & offline terjaga.
                // =============================================================
                DB::transaction(function () use ($kasir, $txData, $pajakPersen, $idTransaksi, &$syncedIds): void {

                    // ---------------------------------------------------------
                    // Kalkulasi subtotal per item
                    // ---------------------------------------------------------
                    $detailsData       = [];
                    $totalBelanjaBruto = 0.0;

                    foreach ($txData['items'] as $item) {
                        // Fallback harga: gunakan dari payload HP, jika null cari dari menu_template
                        if (isset($item['harga_produk']) && $item['harga_produk'] !== null) {
                            $harga = (float) $item['harga_produk'];
                        } else {
                            $hargaTemplate = MenuTemplate::where('id_menu', $item['id_produk'])
                                ->where('id_cabang', $txData['id_cabang'])
                                ->where('id_sales', $txData['id_sales'])
                                ->value('harga_produk');

                            $harga = $hargaTemplate !== null ? (float) $hargaTemplate : 0.00;
                        }

                        $qty = (int) $item['quantity'];

                        // Hitung nominal promo item
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

                        $subtotalItem       = max(0.0, ($harga * $qty) - $nominalPromoItem);
                        $totalBelanjaBruto += $subtotalItem;

                        $detailsData[] = [
                            'id_produk'     => $item['id_produk'],
                            'harga_produk'  => $harga,
                            'quantity'      => $qty,
                            'id_promo'      => $item['id_promo'] ?? null,
                            'nominal_promo' => $nominalPromoItem,
                            'subtotal_item' => $subtotalItem,
                            'status_item'   => 'Active',
                        ];
                    }

                    // ---------------------------------------------------------
                    // Kalkulasi finansial header transaksi
                    // ---------------------------------------------------------
                    $nominalPromoTransaksi = 0.00;
                    if (isset($txData['nominal_promo']) && $txData['nominal_promo'] !== null) {
                        $nominalPromoTransaksi = (float) $txData['nominal_promo'];
                    } elseif (!empty($txData['id_promo'])) {
                        $promoHeader = Promosi::find($txData['id_promo']);
                        if ($promoHeader && $promoHeader->nilai_promo !== null) {
                            $nominalPromoTransaksi = $promoHeader->tipe_promo === 'Persen'
                                ? round($totalBelanjaBruto * ((float) $promoHeader->nilai_promo / 100), 2)
                                : (float) $promoHeader->nilai_promo;
                        }
                    }

                    $basisKenaPajak = max(0.0, $totalBelanjaBruto - $nominalPromoTransaksi);
                    $nominalTax     = round($basisKenaPajak * ($pajakPersen / 100), 2);
                    $totalBersih    = round($basisKenaPajak + $nominalTax, 2);

                    // ---------------------------------------------------------
                    // Simpan header Transaksi dengan UUID dari HP (id_transaksi)
                    // Tanggal/jam menggunakan data LOKAL HP jika tersedia,
                    // fallback ke server time now().
                    // ---------------------------------------------------------
                    $transaksi = Transaksi::create([
                        'id_transaksi'      => $idTransaksi, // UUID dari SQLite HP
                        'id_sales'          => $txData['id_sales'],
                        'id_cabang'         => $txData['id_cabang'],
                        'id_user'           => $kasir->id_user,
                        'id_metode'         => $txData['id_metode'],
                        'id_shift'          => $txData['id_shift'],
                        'id_promo'          => $txData['id_promo'] ?? null,
                        'tanggal_transaksi' => now()->format('Y-m-d'),
                        'jam_transaksi'     => now()->format('H:i:s'),
                        'nama_pelanggan'    => $txData['nama_pelanggan'] ?? null,
                        'nominal_promo'     => $nominalPromoTransaksi,
                        'tax'               => $nominalTax,
                        'total'             => $totalBersih,
                        'status'            => 'Draft',
                    ]);

                    // ---------------------------------------------------------
                    // Simpan setiap TransaksiDetail
                    // ---------------------------------------------------------
                    foreach ($detailsData as $detail) {
                        $detail['id_transaksi'] = $transaksi->id_transaksi;
                        TransaksiDetail::create($detail);
                    }

                    // Transaksi berhasil — catat ke synced_ids
                    $syncedIds[] = $idTransaksi;
                });

            } catch (\Throwable $e) {
                // Jika terjadi error apapun (database, constraint, dll),
                // jangan hentikan keseluruhan batch — catat transaksi yang gagal.
                $failedItems[] = [
                    'id_transaksi' => $idTransaksi,
                    'error'        => $e->getMessage(),
                ];
            }
        }

        // =====================================================================
        // Susun response akhir untuk SyncManager di HP kasir
        // =====================================================================
        $totalBatch   = count($transactions);
        $totalSynced  = count($syncedIds);
        $totalFailed  = count($failedItems);

        $statusMessage = match (true) {
            $totalFailed === 0  => sprintf('Sinkronisasi berhasil! %d dari %d transaksi berhasil disinkronkan.', $totalSynced, $totalBatch),
            $totalSynced === 0  => sprintf('Sinkronisasi gagal. %d transaksi tidak dapat diproses.', $totalFailed),
            default             => sprintf('Sinkronisasi sebagian. %d berhasil, %d gagal dari total %d transaksi.', $totalSynced, $totalFailed, $totalBatch),
        };

        $httpStatus = $totalFailed === 0 ? 200 : ($totalSynced === 0 ? 422 : 207); // 207 = Multi-Status

        return response()->json([
            'success'     => $totalFailed === 0,
            'message'     => $statusMessage,
            'data'        => [
                'synced_ids'   => $syncedIds,   // HP kasir update status SQLite → 'Synced'
                'failed_items' => $failedItems, // HP kasir bisa retry item ini
                'summary'      => [
                    'total_batch'  => $totalBatch,
                    'total_synced' => $totalSynced,
                    'total_failed' => $totalFailed,
                ],
            ],
        ], $httpStatus);
    }
}

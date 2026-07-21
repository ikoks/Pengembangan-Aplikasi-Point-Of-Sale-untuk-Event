<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\DownloadKatalogRequest;
use App\Http\Resources\KatalogResource;
use App\Models\Cabang;
use App\Models\Kategori;
use App\Models\MenuTemplate;
use App\Models\MetodePembayaran;
use App\Models\Promosi;
use App\Models\SalesMode;
use Illuminate\Http\JsonResponse;

/**
 * KatalogController — POS-5 (API Download Katalog Terpadu)
 *
 * Menyediakan satu endpoint agregat yang sangat efisien untuk diunduh
 * oleh HP Kasir pada saat inisialisasi/opening shift.
 *
 * FILOSOFI DESAIN — "Single Download, Full Offline":
 * Alih-alih HP kasir melakukan banyak request terpisah (GET kategori,
 * GET menu, GET harga, GET promo...), endpoint ini mengembalikan SEMUA
 * data yang diperlukan kasir dalam SATU response JSON.
 *
 * Keuntungan di lingkungan event (jaringan tidak stabil):
 *   - Mengurangi HTTP round-trip secara drastis.
 *   - Meminimalkan risiko katalog "setengah terunduh" akibat koneksi putus.
 *   - HP kasir menyimpan payload ini ke SQLite lokal sebagai cache offline.
 *
 * Payload yang dikembalikan:
 *   1. Data cabang (id, nama, pajak%)
 *   2. Data sales mode aktif
 *   3. Hierarki Kategori → SubKategori → Menu (+ harga spesifik dari menu_template)
 *   4. Daftar promosi aktif untuk cabang tersebut
 *   5. Seluruh metode pembayaran yang tersedia
 */
class KatalogController extends Controller
{
    /**
     * Download katalog terpadu untuk satu kombinasi cabang + sales mode.
     * Endpoint: GET /api/v1/katalog/download
     * Middleware: auth:sanctum
     *
     * =========================================================================
     * OPTIMASI QUERY (N+1 Prevention):
     * =========================================================================
     * Seluruh data diambil menggunakan eager-loading Eloquent yang terstruktur.
     * Harga per item diambil secara bulk dari `menu_template` dan di-map
     * menggunakan koleksi PHP (bukan query per-item di dalam loop) untuk
     * mencegah problem N+1 query dan memastikan performa optimal.
     *
     * @param  DownloadKatalogRequest $request  Query params yang sudah divalidasi.
     */
    public function download(DownloadKatalogRequest $request): JsonResponse
    {
        $idCabang = $request->validated()['id_cabang'];
        $idSales  = $request->validated()['id_sales'];

        // =====================================================================
        // LANGKAH 1: Ambil data Cabang & Sales Mode
        // =====================================================================
        $cabang    = Cabang::where('id_cabang', $idCabang)->firstOrFail();
        $salesMode = SalesMode::where('id_sales', $idSales)->firstOrFail();

        // =====================================================================
        // LANGKAH 2: Ambil SEMUA harga dari menu_template untuk kombinasi ini
        // dalam satu query tunggal → Map ke [id_menu => harga_produk]
        //
        // Pendekatan "pre-fetch dan map" ini menghindari query harga per-item
        // di dalam loop (yang akan menghasilkan ratusan N+1 queries).
        // =====================================================================
        $hargaMap = MenuTemplate::where('id_cabang', $idCabang)
            ->where('id_sales', $idSales)
            ->pluck('harga_produk', 'id_menu'); // Collection [id_menu => harga_produk]

        // =====================================================================
        // LANGKAH 3: Ambil hierarki Kategori → SubKategori → Menu
        // dengan SoftDeletes dihormati (hanya yang tidak terhapus ditampilkan)
        // =====================================================================
        $kategoris = Kategori::with([
                'subKategoris' => function ($query) {
                    // Hanya sub-kategori yang tidak di-soft-delete
                    $query->whereNull('deleted_at')
                          ->orderBy('nama_sub_kategori');
                },
                'subKategoris.menus' => function ($query) {
                    // Hanya menu yang tidak di-soft-delete
                    $query->whereNull('deleted_at')
                          ->orderBy('nama_menu');
                },
            ])
            ->whereNull('deleted_at')
            ->orderBy('nama_kategori')
            ->get();

        // =====================================================================
        // LANGKAH 4: Bangun struktur hierarki + injeksi harga dari $hargaMap
        // =====================================================================
        $totalItemMenu = 0;

        $katalogHierarki = $kategoris->map(function ($kategori) use ($hargaMap, &$totalItemMenu) {
            return [
                'id_kategori'   => $kategori->id_kategori,
                'nama_kategori' => $kategori->nama_kategori,
                'sub_kategori'  => $kategori->subKategoris->map(function ($sub) use ($hargaMap, &$totalItemMenu) {
                    return [
                        'id_sub_kategori'   => $sub->id_sub_kategori,
                        'nama_sub_kategori' => $sub->nama_sub_kategori,
                        'menu'              => $sub->menus->map(function ($menu) use ($hargaMap, &$totalItemMenu) {
                            $totalItemMenu++;

                            // Ambil harga dari peta pre-fetched; null jika belum dikonfigurasi
                            $hargaProduk = $hargaMap->get($menu->id_menu);

                            return [
                                'id_menu'      => $menu->id_menu,
                                'nama_menu'    => $menu->nama_menu,
                                // Harga spesifik cabang+sales; null = belum dikonfigurasi di template
                                'harga_produk' => $hargaProduk !== null ? (float) $hargaProduk : null,
                                'tersedia'     => $hargaProduk !== null, // Flag cepat untuk UI kasir
                            ];
                        })->values()->all(),
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        // =====================================================================
        // LANGKAH 5: Ambil daftar promosi aktif untuk cabang ini
        // =====================================================================
        $promosis = Promosi::where('id_cabang', $idCabang)
            ->get()
            ->map(fn ($promo) => [
                'id_promo'      => $promo->id_promo,
                'nama_promo'    => $promo->nama_promo,
                'tipe_promo'    => $promo->tipe_promo,
                'cakupan_promo' => $promo->cakupan_promo,
                'nilai_promo'   => $promo->nilai_promo !== null ? (float) $promo->nilai_promo : null,
                'id_menu_free'  => $promo->id_menu_free,
            ])->values()->all();

        // =====================================================================
        // LANGKAH 6: Ambil seluruh metode pembayaran yang tersedia
        // =====================================================================
        $metodes = MetodePembayaran::all()
            ->map(fn ($metode) => [
                'id_metode'       => $metode->id_metode,
                'nama_metode'     => $metode->nama_metode,
                'kategori_metode' => $metode->kategori_metode,
                'vendor_gateway'  => $metode->vendor_gateway,
            ])->values()->all();

        // =====================================================================
        // LANGKAH 7: Susun payload agregat dan kembalikan via KatalogResource
        // =====================================================================
        $payload = [
            'cabang'             => [
                'id_cabang'    => $cabang->id_cabang,
                'nama_cabang'  => $cabang->nama_cabang,
                'pajak_persen' => (float) $cabang->pajak_persen,
                'lokasi'       => $cabang->lokasi,
            ],
            'sales_mode'         => [
                'id_sales'  => $salesMode->id_sales,
                'nama_mode' => $salesMode->nama_mode,
            ],
            'kategori'           => $katalogHierarki,
            'promosi'            => $promosis,
            'metode_pembayaran'  => $metodes,
            'total_item_menu'    => $totalItemMenu,
        ];

        return response()->json([
            'success' => true,
            'message' => sprintf(
                'Katalog berhasil diunduh untuk cabang "%s" — kanal "%s". Total %d item menu.',
                $cabang->nama_cabang,
                $salesMode->nama_mode,
                $totalItemMenu
            ),
            'data'    => new KatalogResource($payload),
        ]);
    }
}

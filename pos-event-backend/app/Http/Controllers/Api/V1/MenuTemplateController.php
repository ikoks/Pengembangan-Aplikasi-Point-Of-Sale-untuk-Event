<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreMenuTemplateRequest;
use App\Http\Requests\V1\UpdateMenuTemplateRequest;
use App\Http\Resources\MenuTemplateResource;
use App\Models\Cabang;
use App\Models\MenuTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * MenuTemplateController — POS-4 (API Template Harga Regional)
 *
 * Mengelola konfigurasi harga produk yang bersifat regional:
 * satu item menu dapat memiliki harga yang berbeda-beda
 * tergantung pada cabang tempat penjualan DAN kanal penjualan yang digunakan.
 *
 * Hak Akses:
 *   - GET  /menu-templates/cabang/{id_cabang} → Admin & Kasir (download katalog harga)
 *   - POST, PUT, DELETE                        → Admin only (admin.only middleware)
 */
class MenuTemplateController extends Controller
{
    /**
     * Mengambil seluruh katalog harga menu untuk satu cabang tertentu,
     * dikelompokkan per sales mode untuk kemudahan konsumsi aplikasi mobile.
     *
     * Endpoint: GET /api/v1/menu-templates/cabang/{id_cabang}
     *
     * Digunakan oleh kasir saat sinkronisasi awal atau refresh katalog harga.
     * Eager-load hierarki penuh: menu → sub_kategori → kategori agar client
     * tidak perlu request tambahan untuk membangun tampilan katalog.
     *
     * @param  string $idCabang  UUID cabang dari URL parameter.
     */
    public function getByCabang(string $idCabang): JsonResponse
    {
        // Verifikasi cabang yang diminta benar-benar ada
        $cabang = Cabang::where('id_cabang', $idCabang)->firstOrFail();

        // Ambil seluruh template harga untuk cabang ini beserta relasi hierarki penuh
        $templates = MenuTemplate::with([
                'menu.subKategori.kategori', // Hierarki: menu → sub → kategori
                'salesMode',                 // Kanal penjualan
            ])
            ->where('id_cabang', $idCabang)
            ->orderBy('id_sales') // Kelompokkan per sales mode
            ->get();

        return response()->json([
            'success'     => true,
            'message'     => "Katalog harga untuk cabang '{$cabang->nama_cabang}' berhasil diambil.",
            'cabang'      => [
                'id_cabang'    => $cabang->id_cabang,
                'nama_cabang'  => $cabang->nama_cabang,
                'pajak_persen' => (float) $cabang->pajak_persen,
            ],
            'total_item'  => $templates->count(),
            'data'        => MenuTemplateResource::collection($templates),
        ]);
    }

    /**
     * Menyimpan konfigurasi harga menu baru untuk kombinasi tertentu.
     * Endpoint: POST /api/v1/menu-templates
     * Middleware: admin.only
     *
     * Kombinasi (id_menu + id_cabang + id_sales) harus UNIK — dijaga oleh Form Request.
     *
     * @param  StoreMenuTemplateRequest $request  Input yang sudah divalidasi.
     */
    public function store(StoreMenuTemplateRequest $request): JsonResponse
    {
        $template = MenuTemplate::create($request->only([
            'id_menu',
            'id_cabang',
            'id_sales',
            'harga_produk',
        ]));

        // Eager-load relasi lengkap untuk response yang informatif
        $template->load(['menu.subKategori', 'cabang', 'salesMode']);

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi harga berhasil ditambahkan.',
            'data'    => new MenuTemplateResource($template),
        ], 201);
    }

    /**
     * Memperbarui nominal harga pada konfigurasi yang sudah ada.
     * Endpoint: PUT /api/v1/menu-templates/{menu_template}
     * Middleware: admin.only
     *
     * Hanya `harga_produk` yang dapat diubah. Kombinasi FK adalah identitas
     * record dan bersifat immutable (lihat UpdateMenuTemplateRequest).
     *
     * @param  UpdateMenuTemplateRequest $request        Input yang sudah divalidasi.
     * @param  MenuTemplate             $menuTemplate    Model yang di-resolve via Route Model Binding.
     */
    public function update(UpdateMenuTemplateRequest $request, MenuTemplate $menuTemplate): JsonResponse
    {
        $menuTemplate->update(['harga_produk' => $request->validated()['harga_produk']]);
        $menuTemplate->load(['menu.subKategori', 'cabang', 'salesMode']);

        return response()->json([
            'success' => true,
            'message' => 'Harga produk berhasil diperbarui.',
            'data'    => new MenuTemplateResource($menuTemplate),
        ]);
    }

    /**
     * Menghapus konfigurasi harga (penghapusan permanen, bukan soft delete).
     * Endpoint: DELETE /api/v1/menu-templates/{menu_template}
     * Middleware: admin.only
     *
     * MenuTemplate menggunakan hard delete karena tidak memiliki relasi
     * ke tabel transaksi. Konfigurasi harga bersifat konfigurasi, bukan data historis.
     * (Harga historis sudah tercatat di `transaksi_detail.harga_satuan`).
     *
     * @param  MenuTemplate $menuTemplate  Model yang di-resolve via Route Model Binding.
     */
    public function destroy(MenuTemplate $menuTemplate): JsonResponse
    {
        $menuTemplate->delete(); // Hard delete — aman karena bukan data transaksi

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi harga berhasil dihapus dari sistem.',
            'data'    => null,
        ]);
    }
}

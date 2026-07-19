<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreMenuRequest;
use App\Http\Requests\V1\UpdateMenuRequest;
use App\Http\Resources\MenuResource;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * MenuController — POS-3 (CRUD Master Data Menu)
 *
 * Menangani operasi CRUD untuk data item menu katalog POS Event.
 * Endpoint READ (index, show) terbuka untuk Admin dan Kasir agar
 * aplikasi mobile dapat mengunduh katalog produk saat sinkronisasi awal.
 *
 * Hak Akses:
 *   - index, show → Admin dan Kasir (via auth:sanctum)
 *   - store, update, destroy → Admin only (via admin.only middleware)
 */
class MenuController extends Controller
{
    /**
     * Menampilkan daftar seluruh item menu beserta hierarki sub-kategori dan kategorinya.
     * Endpoint: GET /api/v1/menus
     *
     * Digunakan oleh aplikasi kasir sebagai endpoint utama untuk mengunduh katalog produk.
     */
    public function index(): AnonymousResourceCollection
    {
        // Eager-load relasi bersarang untuk menghindari N+1 query problem
        $menus = Menu::with(['subKategori.kategori'])
            ->orderBy('nama_menu')
            ->get();

        return MenuResource::collection($menus);
    }

    /**
     * Menyimpan item menu baru ke dalam katalog.
     * Endpoint: POST /api/v1/menus
     * Middleware: admin.only
     *
     * @param  StoreMenuRequest $request  Input yang sudah divalidasi.
     */
    public function store(StoreMenuRequest $request): JsonResponse
    {
        $menu = Menu::create($request->validated());
        $menu->load('subKategori.kategori');

        return response()->json([
            'success' => true,
            'message' => 'Item menu berhasil ditambahkan ke katalog.',
            'data'    => new MenuResource($menu),
        ], 201);
    }

    /**
     * Menampilkan detail satu item menu beserta relasi hierarki lengkapnya.
     * Endpoint: GET /api/v1/menus/{menu}
     *
     * @param  Menu $menu  Model yang di-resolve melalui Route Model Binding.
     */
    public function show(Menu $menu): JsonResponse
    {
        $menu->load('subKategori.kategori');

        return response()->json([
            'success' => true,
            'message' => 'Detail item menu berhasil diambil.',
            'data'    => new MenuResource($menu),
        ]);
    }

    /**
     * Memperbarui data item menu yang sudah ada.
     * Endpoint: PATCH /api/v1/menus/{menu}
     * Middleware: admin.only
     *
     * @param  UpdateMenuRequest $request  Input yang sudah divalidasi.
     * @param  Menu              $menu     Model yang di-resolve melalui Route Model Binding.
     */
    public function update(UpdateMenuRequest $request, Menu $menu): JsonResponse
    {
        $menu->update($request->validated());
        $menu->load('subKategori.kategori');

        return response()->json([
            'success' => true,
            'message' => 'Item menu berhasil diperbarui.',
            'data'    => new MenuResource($menu),
        ]);
    }

    /**
     * Melakukan Soft Delete pada item menu (bukan penghapusan permanen).
     * Endpoint: DELETE /api/v1/menus/{menu}
     * Middleware: admin.only
     *
     * Item menu yang di-soft-delete tidak tampil di katalog aktif, namun
     * data detail transaksi yang pernah memesan item ini tetap terjaga konsistensinya.
     *
     * @param  Menu $menu  Model yang di-resolve melalui Route Model Binding.
     */
    public function destroy(Menu $menu): JsonResponse
    {
        $menu->delete(); // Soft Delete — hanya mengisi deleted_at

        return response()->json([
            'success' => true,
            'message' => 'Item menu berhasil diarsipkan dari katalog aktif (soft delete).',
            'data'    => null,
        ]);
    }
}

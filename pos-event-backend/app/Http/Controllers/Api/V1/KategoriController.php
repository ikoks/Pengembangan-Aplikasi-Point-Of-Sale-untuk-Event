<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreKategoriRequest;
use App\Http\Requests\V1\UpdateKategoriRequest;
use App\Http\Resources\KategoriResource;
use App\Models\Kategori;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * KategoriController — POS-3 (CRUD Master Data Kategori Menu)
 *
 * Menangani operasi CRUD untuk data kategori menu.
 *
 * Hak Akses:
 *   - index, show → Admin dan Kasir (via auth:sanctum)
 *   - store, update, destroy → Admin only (via admin.only middleware)
 */
class KategoriController extends Controller
{
    /**
     * Menampilkan daftar semua kategori menu yang aktif, beserta sub-kategorinya.
     * Endpoint: GET /api/v1/kategoris
     *
     * Digunakan oleh aplikasi kasir untuk memuat katalog produk secara hierarki.
     */
    public function index(): AnonymousResourceCollection
    {
        // Eager-load sub-kategori untuk menghindari N+1 query problem
        $kategoris = Kategori::with('subKategoris')
            ->orderBy('nama_kategori')
            ->get();

        return KategoriResource::collection($kategoris);
    }

    /**
     * Menyimpan data kategori baru.
     * Endpoint: POST /api/v1/kategoris
     * Middleware: admin.only
     *
     * @param  StoreKategoriRequest $request  Input yang sudah divalidasi.
     */
    public function store(StoreKategoriRequest $request): JsonResponse
    {
        $kategori = Kategori::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil ditambahkan.',
            'data'    => new KategoriResource($kategori),
        ], 201);
    }

    /**
     * Menampilkan detail satu kategori beserta seluruh sub-kategorinya.
     * Endpoint: GET /api/v1/kategoris/{kategori}
     *
     * @param  Kategori $kategori  Model yang di-resolve melalui Route Model Binding.
     */
    public function show(Kategori $kategori): JsonResponse
    {
        $kategori->load('subKategoris');

        return response()->json([
            'success' => true,
            'message' => 'Detail kategori berhasil diambil.',
            'data'    => new KategoriResource($kategori),
        ]);
    }

    /**
     * Memperbarui data kategori yang sudah ada.
     * Endpoint: PATCH /api/v1/kategoris/{kategori}
     * Middleware: admin.only
     *
     * @param  UpdateKategoriRequest $request   Input yang sudah divalidasi.
     * @param  Kategori              $kategori  Model yang di-resolve melalui Route Model Binding.
     */
    public function update(UpdateKategoriRequest $request, Kategori $kategori): JsonResponse
    {
        $kategori->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui.',
            'data'    => new KategoriResource($kategori->fresh()),
        ]);
    }

    /**
     * Melakukan Soft Delete pada data kategori.
     * Endpoint: DELETE /api/v1/kategoris/{kategori}
     * Middleware: admin.only
     *
     * Sub-kategori dan menu yang berada di bawah kategori ini TIDAK otomatis ikut dihapus.
     * Admin harus menghapus sub-kategori dan menu secara eksplisit.
     *
     * @param  Kategori $kategori  Model yang di-resolve melalui Route Model Binding.
     */
    public function destroy(Kategori $kategori): JsonResponse
    {
        $kategori->delete(); // Soft Delete

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diarsipkan (soft delete).',
            'data'    => null,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreSubKategoriRequest;
use App\Http\Requests\V1\UpdateSubKategoriRequest;
use App\Http\Resources\SubKategoriResource;
use App\Models\SubKategori;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * SubKategoriController — POS-3 (CRUD Master Data Sub-Kategori Menu)
 *
 * Menangani operasi CRUD untuk data sub-kategori menu.
 *
 * Hak Akses:
 *   - index, show → Admin dan Kasir (via auth:sanctum)
 *   - store, update, destroy → Admin only (via admin.only middleware)
 */
class SubKategoriController extends Controller
{
    /**
     * Menampilkan daftar semua sub-kategori beserta data kategori induknya.
     * Endpoint: GET /api/v1/sub-kategoris
     */
    public function index(): AnonymousResourceCollection
    {
        $subKategoris = SubKategori::with('kategori')
            ->orderBy('nama_sub_kategori')
            ->get();

        return SubKategoriResource::collection($subKategoris);
    }

    /**
     * Menyimpan data sub-kategori baru.
     * Endpoint: POST /api/v1/sub-kategoris
     * Middleware: admin.only
     *
     * @param  StoreSubKategoriRequest $request  Input yang sudah divalidasi.
     */
    public function store(StoreSubKategoriRequest $request): JsonResponse
    {
        $subKategori = SubKategori::create($request->validated());
        $subKategori->load('kategori');

        return response()->json([
            'success' => true,
            'message' => 'Sub-kategori berhasil ditambahkan.',
            'data'    => new SubKategoriResource($subKategori),
        ], 201);
    }

    /**
     * Menampilkan detail satu sub-kategori beserta relasi kategori induk dan daftar menunya.
     * Endpoint: GET /api/v1/sub-kategoris/{sub_kategori}
     *
     * @param  SubKategori $subKategori  Model yang di-resolve melalui Route Model Binding.
     */
    public function show(SubKategori $subKategori): JsonResponse
    {
        $subKategori->load(['kategori', 'menus']);

        return response()->json([
            'success' => true,
            'message' => 'Detail sub-kategori berhasil diambil.',
            'data'    => new SubKategoriResource($subKategori),
        ]);
    }

    /**
     * Memperbarui data sub-kategori yang sudah ada.
     * Endpoint: PATCH /api/v1/sub-kategoris/{sub_kategori}
     * Middleware: admin.only
     *
     * @param  UpdateSubKategoriRequest $request       Input yang sudah divalidasi.
     * @param  SubKategori             $subKategori    Model yang di-resolve melalui Route Model Binding.
     */
    public function update(UpdateSubKategoriRequest $request, SubKategori $subKategori): JsonResponse
    {
        $subKategori->update($request->validated());
        $subKategori->load('kategori');

        return response()->json([
            'success' => true,
            'message' => 'Sub-kategori berhasil diperbarui.',
            'data'    => new SubKategoriResource($subKategori),
        ]);
    }

    /**
     * Melakukan Soft Delete pada data sub-kategori.
     * Endpoint: DELETE /api/v1/sub-kategoris/{sub_kategori}
     * Middleware: admin.only
     *
     * @param  SubKategori $subKategori  Model yang di-resolve melalui Route Model Binding.
     */
    public function destroy(SubKategori $subKategori): JsonResponse
    {
        $subKategori->delete(); // Soft Delete

        return response()->json([
            'success' => true,
            'message' => 'Sub-kategori berhasil diarsipkan (soft delete).',
            'data'    => null,
        ]);
    }
}

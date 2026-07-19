<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreCabangRequest;
use App\Http\Requests\V1\UpdateCabangRequest;
use App\Http\Resources\CabangResource;
use App\Models\Cabang;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * CabangController — POS-3 (CRUD Master Data Cabang)
 *
 * Menangani operasi CRUD untuk data cabang event.
 *
 * Hak Akses:
 *   - index, show → Admin dan Kasir (via auth:sanctum)
 *   - store, update, destroy → Admin only (via admin.only middleware)
 */
class CabangController extends Controller
{
    /**
     * Menampilkan daftar semua cabang yang aktif (tidak di-soft-delete).
     * Endpoint: GET /api/v1/cabang
     */
    public function index(): AnonymousResourceCollection
    {
        $cabangs = Cabang::orderBy('nama_cabang')->get();

        return CabangResource::collection($cabangs);
    }

    /**
     * Menyimpan data cabang baru ke dalam database.
     * Endpoint: POST /api/v1/cabang
     * Middleware: admin.only
     *
     * @param  StoreCabangRequest $request  Input yang sudah divalidasi.
     */
    public function store(StoreCabangRequest $request): JsonResponse
    {
        $cabang = Cabang::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Cabang berhasil ditambahkan.',
            'data'    => new CabangResource($cabang),
        ], 201);
    }

    /**
     * Menampilkan detail data satu cabang berdasarkan ID.
     * Endpoint: GET /api/v1/cabang/{cabang}
     *
     * @param  Cabang $cabang  Model yang di-resolve melalui Route Model Binding.
     */
    public function show(Cabang $cabang): JsonResponse
    {
        // Muat relasi user untuk detail cabang (opsional, berguna untuk panel admin)
        $cabang->load('users');

        return response()->json([
            'success' => true,
            'message' => 'Detail cabang berhasil diambil.',
            'data'    => new CabangResource($cabang),
        ]);
    }

    /**
     * Memperbarui data cabang yang sudah ada.
     * Endpoint: PATCH /api/v1/cabang/{cabang}
     * Middleware: admin.only
     *
     * @param  UpdateCabangRequest $request  Input yang sudah divalidasi.
     * @param  Cabang              $cabang   Model yang di-resolve melalui Route Model Binding.
     */
    public function update(UpdateCabangRequest $request, Cabang $cabang): JsonResponse
    {
        $cabang->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Cabang berhasil diperbarui.',
            'data'    => new CabangResource($cabang->fresh()),
        ]);
    }

    /**
     * Melakukan Soft Delete pada data cabang (bukan penghapusan permanen).
     * Endpoint: DELETE /api/v1/cabang/{cabang}
     * Middleware: admin.only
     *
     * Data tidak dihapus dari database; kolom `deleted_at` diisi dengan timestamp sekarang.
     * Ini menjaga integritas data historis transaksi yang merujuk ke cabang ini.
     *
     * @param  Cabang $cabang  Model yang di-resolve melalui Route Model Binding.
     */
    public function destroy(Cabang $cabang): JsonResponse
    {
        $cabang->delete(); // Soft Delete — hanya mengisi deleted_at

        return response()->json([
            'success' => true,
            'message' => 'Cabang berhasil diarsipkan (soft delete).',
            'data'    => null,
        ]);
    }
}

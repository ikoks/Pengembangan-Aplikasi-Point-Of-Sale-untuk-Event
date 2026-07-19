<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreUserRequest;
use App\Http\Requests\V1\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\UserModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

/**
 * UserController — POS-3 (CRUD Master Data User)
 *
 * Menangani operasi CRUD untuk manajemen akun user (Admin & Kasir).
 *
 * Hak Akses:
 *   - index, show → Admin dan Kasir (via auth:sanctum)
 *   - store, update, destroy → Admin only (via admin.only middleware)
 */
class UserController extends Controller
{
    /**
     * Menampilkan daftar semua user yang aktif (tidak di-soft-delete).
     * Endpoint: GET /api/v1/users
     *
     * Menyertakan data relasi role dan cabang untuk kemudahan tampilan.
     */
    public function index(): AnonymousResourceCollection
    {
        $users = UserModel::with(['role', 'cabang'])
            ->orderBy('nama_user')
            ->get();

        return UserResource::collection($users);
    }

    /**
     * Menyimpan akun user baru ke dalam database.
     * Endpoint: POST /api/v1/users
     * Middleware: admin.only
     *
     * Jika `password_hash` dikirim, nilai akan di-hash menggunakan bcrypt
     * sebelum disimpan. Jika NULL (kasir login cepat), disimpan apa adanya.
     *
     * @param  StoreUserRequest $request  Input yang sudah divalidasi.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Hash password hanya jika dikirim dan tidak null
        if (! empty($validated['password_hash'])) {
            $validated['password_hash'] = Hash::make($validated['password_hash']);
        }

        $user = UserModel::create($validated);
        $user->load(['role', 'cabang']);

        return response()->json([
            'success' => true,
            'message' => 'Akun user berhasil dibuat.',
            'data'    => new UserResource($user),
        ], 201);
    }

    /**
     * Menampilkan detail data satu user berdasarkan ID.
     * Endpoint: GET /api/v1/users/{user}
     *
     * Route Model Binding menggunakan kolom `id_user` sebagai key.
     *
     * @param  UserModel $user  Model yang di-resolve melalui Route Model Binding.
     */
    public function show(UserModel $user): JsonResponse
    {
        $user->load(['role', 'cabang']);

        return response()->json([
            'success' => true,
            'message' => 'Detail user berhasil diambil.',
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * Memperbarui data akun user yang sudah ada.
     * Endpoint: PATCH /api/v1/users/{user}
     * Middleware: admin.only
     *
     * Jika `password_hash` dikirim dengan nilai baru, akan di-hash ulang.
     * Jika `password_hash` tidak dikirim (field absen), password lama tetap.
     *
     * @param  UpdateUserRequest $request  Input yang sudah divalidasi.
     * @param  UserModel         $user     Model yang di-resolve melalui Route Model Binding.
     */
    public function update(UpdateUserRequest $request, UserModel $user): JsonResponse
    {
        $validated = $request->validated();

        // Perbarui password hanya jika field dikirim dan memiliki nilai baru
        if (array_key_exists('password_hash', $validated)) {
            $validated['password_hash'] = ! empty($validated['password_hash'])
                ? Hash::make($validated['password_hash'])
                : null; // Kasir bisa di-reset ke mode login cepat (tanpa password)
        }

        $user->update($validated);
        $user->load(['role', 'cabang']);

        return response()->json([
            'success' => true,
            'message' => 'Akun user berhasil diperbarui.',
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * Melakukan Soft Delete pada akun user (bukan penghapusan permanen).
     * Endpoint: DELETE /api/v1/users/{user}
     * Middleware: admin.only
     *
     * Akun yang di-soft-delete tidak bisa login, namun seluruh data historis
     * audit_log dan transaksi yang merujuknya tetap utuh dan bisa dilacak.
     *
     * @param  UserModel $user  Model yang di-resolve melalui Route Model Binding.
     */
    public function destroy(UserModel $user): JsonResponse
    {
        // Cabut semua token Sanctum aktif milik user ini sebelum di-soft-delete
        $user->tokens()->delete();

        $user->delete(); // Soft Delete — hanya mengisi deleted_at

        return response()->json([
            'success' => true,
            'message' => 'Akun user berhasil diarsipkan dan seluruh sesi aktif dicabut.',
            'data'    => null,
        ]);
    }
}

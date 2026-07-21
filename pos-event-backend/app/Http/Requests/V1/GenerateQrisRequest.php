<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * GenerateQrisRequest
 *
 * Validasi input untuk endpoint request QRIS dinamis Midtrans.
 * Endpoint: POST /api/v1/payment/qris
 * Middleware: auth:sanctum (kasir yang sudah login)
 *
 * Input yang divalidasi:
 *   - `id_transaksi`: UUID v4, wajib ada, harus sudah tersimpan di tabel `transaksi`
 *
 * Tiket JIRA: POS-10A
 * Referensi: SDD Bab V.2 — Payment Request Validation
 */
class GenerateQrisRequest extends FormRequest
{
    /**
     * Semua kasir yang terautentikasi via Sanctum diizinkan mengakses endpoint ini.
     * Otorisasi berbasis token sudah ditangani oleh middleware `auth:sanctum`.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi untuk setiap field input.
     *
     * Penjelasan `exists:transaksi,id_transaksi`:
     *   - Memastikan transaksi yang diminta benar-benar ada di database.
     *   - Mencegah request QRIS untuk transaksi fiktif.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            // Wajib: UUID v4 yang valid dan terdaftar di tabel transaksi
            'id_transaksi' => [
                'required',
                'uuid',
                'exists:transaksi,id_transaksi',
            ],
        ];
    }

    /**
     * Pesan validasi dalam Bahasa Indonesia yang ramah pengguna.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_transaksi.required' => 'ID transaksi wajib disertakan untuk generate QR Code.',
            'id_transaksi.uuid'     => 'Format ID transaksi tidak valid. Harus berupa UUID v4.',
            'id_transaksi.exists'   => 'Transaksi dengan ID tersebut tidak ditemukan dalam sistem.',
        ];
    }
}

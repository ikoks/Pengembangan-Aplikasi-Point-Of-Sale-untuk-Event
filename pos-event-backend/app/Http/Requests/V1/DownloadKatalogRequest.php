<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * DownloadKatalogRequest
 *
 * Validasi query parameter untuk endpoint download katalog terpadu.
 * (POS-5 — SDD Bab I.2, SRS Bab 3.1.3)
 *
 * Kasir mengirimkan dua parameter ini saat Opening Shift atau refresh katalog:
 *   - id_cabang : Menentukan lokasi/cabang event yang aktif.
 *   - id_sales  : Menentukan kanal penjualan (Offline / GoFood / dll).
 *
 * Kombinasi kedua parameter ini digunakan sebagai filter utama untuk
 * mengambil harga yang spesifik dari tabel `menu_template`, sehingga
 * satu katalog yang diunduh sudah berisi harga yang tepat untuk
 * kanal penjualan di cabang tersebut.
 */
class DownloadKatalogRequest extends FormRequest
{
    /** Endpoint terproteksi Sanctum, user sudah terautentikasi. */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'id_cabang' => [
                'required',
                'uuid',
                'exists:cabang,id_cabang',
            ],
            'id_sales'  => [
                'required',
                'uuid',
                'exists:sales_mode,id_sales',
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_cabang.required' => 'Parameter id_cabang wajib disertakan.',
            'id_cabang.uuid'     => 'Format id_cabang tidak valid, harus berupa UUID v4.',
            'id_cabang.exists'   => 'Cabang yang diminta tidak ditemukan dalam sistem.',
            'id_sales.required'  => 'Parameter id_sales wajib disertakan.',
            'id_sales.uuid'      => 'Format id_sales tidak valid, harus berupa UUID v4.',
            'id_sales.exists'    => 'Sales mode yang diminta tidak ditemukan dalam sistem.',
        ];
    }
}

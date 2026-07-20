<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * OpenShiftRequest
 *
 * Validasi input untuk endpoint pembukaan sesi shift kasir baru.
 * (POS-5A — Use Case III.2.3 SDD & SRS)
 *
 * Tiga field wajib yang harus dikirim kasir saat membuka shift:
 *   1. id_cabang   → Di cabang mana kasir akan bertugas.
 *   2. id_sales    → Kanal penjualan mana yang akan digunakan dalam shift ini.
 *   3. modal_awal  → Jumlah uang tunai fisik yang diserahkan sebagai modal awal.
 *
 * Catatan Validasi:
 *   - Validasi `exists` pada FK memastikan cabang dan sales mode yang dipilih
 *     benar-benar ada di database dan tidak dalam kondisi soft-deleted.
 *   - `modal_awal` diperbolehkan bernilai 0 (untuk event cashless / non-tunai penuh).
 */
class OpenShiftRequest extends FormRequest
{
    /**
     * Endpoint ini diakses oleh kasir yang sudah terautentikasi via Sanctum.
     * Otorisasi role ditangani di layer Controller (bukan di middleware admin.only).
     */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'id_cabang'  => [
                'required',
                'string',
                'uuid',
                'exists:cabang,id_cabang',
            ],
            'id_sales'   => [
                'required',
                'string',
                'uuid',
                'exists:sales_mode,id_sales',
            ],
            'modal_awal' => [
                'required',
                'numeric',
                'min:0',
                'max:9999999999.99',
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_cabang.required'  => 'Cabang tujuan bertugas wajib dipilih.',
            'id_cabang.uuid'      => 'Format ID cabang tidak valid.',
            'id_cabang.exists'    => 'Cabang yang dipilih tidak ditemukan dalam sistem.',
            'id_sales.required'   => 'Sales mode / kanal penjualan wajib dipilih.',
            'id_sales.uuid'       => 'Format ID sales mode tidak valid.',
            'id_sales.exists'     => 'Sales mode yang dipilih tidak ditemukan dalam sistem.',
            'modal_awal.required' => 'Modal awal kas wajib diisi (isi 0 jika event cashless).',
            'modal_awal.numeric'  => 'Modal awal harus berupa angka.',
            'modal_awal.min'      => 'Modal awal tidak boleh bernilai negatif.',
        ];
    }
}

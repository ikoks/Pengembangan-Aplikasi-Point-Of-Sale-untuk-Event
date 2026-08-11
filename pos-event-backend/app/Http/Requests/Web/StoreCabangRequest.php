<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;

class StoreCabangRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Middleware admin.only covers auth
    }

    public function rules(): array
    {
        return [
            'nama_cabang'       => ['required', 'string', 'max:100'],
            'id_sales'          => ['nullable', 'exists:sales_mode,id_sales'],
            'pajak_persen'      => ['required', 'numeric', 'min:0', 'max:100'],
            'lokasi'            => ['required', 'string', 'max:500'],
            'qr_static_payload' => ['nullable', 'string'],                      // Poin 5: QR payload
        ];
    }

    public function messages(): array
    {
        return [
            'id_sales.exists'       => 'Mode Penjualan yang dipilih tidak valid.',
            'pajak_persen.required' => 'Persentase pajak wajib diisi (isi 0 jika tanpa pajak).',
            'pajak_persen.numeric' => 'Persentase pajak harus berupa angka.',
            'pajak_persen.min'     => 'Persentase pajak tidak boleh kurang dari 0.',
            'pajak_persen.max'     => 'Persentase pajak tidak boleh lebih dari 100.',
        ];
    }
}

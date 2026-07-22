<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class VoidItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'id_transaksi_detail' => [
                'required',
                'uuid',
                'regex:/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/',
                'exists:transaksi_detail,id_transaksi_detail',
            ],
            'alasan_batal_item' => ['required', 'string', 'min:1', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_transaksi_detail.required' => 'ID detail transaksi wajib diisi.',
            'id_transaksi_detail.uuid'     => 'Format ID detail transaksi tidak valid.',
            'id_transaksi_detail.regex'    => 'ID detail transaksi harus berupa UUID v4.',
            'id_transaksi_detail.exists'   => 'Detail transaksi tidak ditemukan.',
            'alasan_batal_item.required'   => 'Alasan void item wajib diisi.',
            'alasan_batal_item.string'     => 'Alasan void item harus berupa teks.',
            'alasan_batal_item.min'        => 'Alasan void item minimal 1 karakter.',
            'alasan_batal_item.max'        => 'Alasan void item maksimal 500 karakter.',
        ];
    }
}

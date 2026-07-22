<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class ListTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $uuidV4 = ['uuid', 'regex:/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/'];

        return [
            'id_shift'       => ['nullable', ...$uuidV4, 'exists:shift_session,id_shift'],
            'id_cabang'      => ['nullable', ...$uuidV4, 'exists:cabang,id_cabang'],
            'id_metode'      => ['nullable', ...$uuidV4, 'exists:metode_pembayaran,id_metode'],
            'status'         => ['nullable', 'in:Draft,Pending,Success,Void,Cancelled'],
            'tanggal_mulai'  => ['nullable', 'date_format:Y-m-d'],
            'tanggal_akhir'  => ['nullable', 'date_format:Y-m-d', 'after_or_equal:tanggal_mulai'],
            'per_page'       => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? 15);
    }
}

<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class CancelTransactionRequest extends FormRequest
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
            'alasan_batal' => ['required', 'string', 'min:1', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'alasan_batal.required' => 'Alasan pembatalan wajib diisi.',
            'alasan_batal.string'   => 'Alasan pembatalan harus berupa teks.',
            'alasan_batal.min'      => 'Alasan pembatalan minimal 1 karakter.',
            'alasan_batal.max'      => 'Alasan pembatalan maksimal 500 karakter.',
        ];
    }
}

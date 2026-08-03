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
            'nama_cabang'  => ['required', 'string', 'max:100'],
            'pajak_persen' => ['required', 'numeric', 'min:0', 'max:100'],
            'lokasi'       => ['required', 'string', 'max:255'],
            'header_struk' => ['nullable', 'string', 'max:500'],
            'footer_struk' => ['nullable', 'string', 'max:500'],
        ];
    }
}

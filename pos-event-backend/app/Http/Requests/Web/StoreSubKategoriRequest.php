<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubKategoriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_kategori' => ['required', 'exists:kategori,id_kategori'],
            'nama_sub_kategori' => ['required', 'string', 'max:100'],
        ];
    }
}

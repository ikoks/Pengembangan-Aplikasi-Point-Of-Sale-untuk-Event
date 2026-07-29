<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKategoriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_kategori' => [
                'required', 
                'string', 
                'max:100', 
                Rule::unique('kategori')->ignore($this->route('kategori'))
            ],
        ];
    }
}

<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_sub_kategori' => ['required', 'exists:sub_kategori,id_sub_kategori'],
            'nama_menu' => ['required', 'string', 'max:255'],
        ];
    }
}

<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubKategoriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sub = $this->route('subKategori') ?? $this->route('sub_kategori');
        $id = is_object($sub) ? $sub->id_sub_kategori : ($sub ?? $this->id_sub_kategori);

        return [
            'id_kategori' => ['required', 'exists:kategori,id_kategori'],
            'nama_sub_kategori' => [
                'required', 
                'string', 
                'max:100', 
                Rule::unique('sub_kategori', 'nama_sub_kategori')->ignore($id, 'id_sub_kategori')->whereNull('deleted_at')
            ],
        ];
    }
}

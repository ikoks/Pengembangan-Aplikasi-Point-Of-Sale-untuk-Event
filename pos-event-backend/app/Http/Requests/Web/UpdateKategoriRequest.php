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
        $kategori = $this->route('kategori');
        $id = is_object($kategori) ? $kategori->id_kategori : ($kategori ?? $this->id_kategori);

        return [
            'nama_kategori' => [
                'required', 
                'string', 
                'max:100', 
                Rule::unique('kategori', 'nama_kategori')->ignore($id, 'id_kategori')->whereNull('deleted_at')
            ],
        ];
    }
}

<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePegawaiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Role akan di-set oleh controller berdasarkan route
        $rules = [
            'nama_user' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:50', 'unique:user,username'],
            'id_cabang' => ['nullable', 'string', 'exists:cabang,id_cabang'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];

        if (request()->routeIs('admin.pegawai.admin.*')) {
            $rules['password'] = ['required', 'string', 'min:6'];
        }

        return $rules;
    }
}

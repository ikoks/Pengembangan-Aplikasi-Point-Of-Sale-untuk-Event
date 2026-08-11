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
        $rules = [
            'nama_user' => ['required', 'string', 'max:100'],
            'id_cabang' => ['nullable', 'string', 'exists:cabang,id_cabang'],
            'password'  => ['nullable', 'string', 'min:8', 'confirmed'],
        ];

        if (request()->routeIs('admin.pegawai.kasir.*')) {
            $rules['username'] = ['required', 'string', 'max:50', 'unique:kasirs,username'];
            $rules['pin'] = ['nullable', 'string', 'digits:6'];
        } elseif (request()->routeIs('admin.pegawai.admin.*') || request()->routeIs('admin.management.*')) {
            $rules['username'] = ['required', 'string', 'max:50', 'unique:admins,username'];
            $rules['password'] = ['required', 'string', 'min:6'];
        } else {
            $rules['username'] = ['required', 'string', 'max:50'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'pin.digits' => 'PIN harus terdiri dari tepat 6 digit angka.',
        ];
    }
}

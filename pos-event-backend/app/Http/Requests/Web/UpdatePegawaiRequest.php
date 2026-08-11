<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePegawaiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id');

        $rules = [
            'nama_user' => ['required', 'string', 'max:100'],
            'password'  => ['nullable', 'string', 'min:6'], // opsional saat update
            'id_cabang' => ['nullable', 'string', 'exists:cabang,id_cabang'],
        ];

        if (request()->routeIs('admin.pegawai.kasir.*')) {
            $rules['username'] = [
                'required', 'string', 'max:50',
                Rule::unique('kasirs', 'username')->ignore($userId, 'id_kasir')
            ];
            $rules['pin'] = ['nullable', 'string', 'digits:6'];
        } elseif (request()->routeIs('admin.pegawai.admin.*') || request()->routeIs('admin.management.*')) {
            $rules['username'] = [
                'required', 'string', 'max:50',
                Rule::unique('admins', 'username')->ignore($userId, 'id_admin')
            ];
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

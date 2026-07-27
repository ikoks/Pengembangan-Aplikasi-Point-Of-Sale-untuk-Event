<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * ConfirmTransactionRequest — POS-A-05 (Sprint 2)
 *
 * Validasi request konfirmasi pelunasan transaksi.
 *
 * Arsitektur v1.1-Sprint2:
 *   Tidak ada payment gateway. Non-tunai manual menggunakan nomor_referensi
 *   (RRN EDC atau nomor bukti transfer) yang disimpan langsung di transaksi.
 *
 * Field:
 *   - nomor_referensi (optional): RRN EDC / nomor bukti transfer.
 *                                  Wajib diisi jika metode pembayaran non-tunai.
 *                                  NULL atau tidak dikirim = tunai.
 */
class ConfirmTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            /**
             * Nomor referensi untuk pembayaran non-tunai manual:
             *   - EDC   : RRN (Reference Retrieval Number) dari mesin EDC
             *   - Transfer: Nomor bukti transfer dari bukti slip/screenshot
             *
             * Nullable: boleh tidak dikirim atau null untuk pembayaran tunai.
             * Max 100 karakter mengikuti definisi kolom VARCHAR(100) di DB.
             */
            'nomor_referensi' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'nomor_referensi.max' => 'Nomor referensi maksimal 100 karakter.',
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'nomor_referensi' => [
                'description' => 'Nomor RRN EDC atau nomor bukti transfer untuk pembayaran non-tunai. Kosongkan/null untuk pembayaran tunai.',
                'example'     => '123456789012',
            ],
        ];
    }
}

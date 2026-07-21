<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * SyncBatchRequest
 *
 * Validasi payload batch sinkronisasi transaksi offline dari HP Kasir.
 * (POS-5 — SyncManager Backend Receiver)
 *
 * Ketika koneksi Wi-Fi event tidak stabil atau kasir beroperasi dalam
 * mode offline (SQLite lokal), transaksi disimpan di perangkat HP.
 * Saat koneksi pulih, `SyncManager` di aplikasi mobile mengirimkan
 * semua transaksi yang tertunda dalam satu request batch ini.
 *
 * Setiap transaksi dalam array `transactions[]` WAJIB menyertakan
 * `id_transaksi` yang sudah di-generate secara lokal di HP (UUID v4).
 * Hal ini menjamin idempotency: jika server sudah memiliki record
 * dengan UUID tersebut, data tidak akan diduplikasi.
 *
 * Struktur Payload:
 * {
 *   "transactions": [
 *     {
 *       "id_transaksi": "uuid-lokal",
 *       "id_shift": "uuid",
 *       "id_cabang": "uuid",
 *       "id_sales": "uuid",
 *       "id_metode": "uuid",
 *       "id_promo": null,
 *       "nama_pelanggan": "...",
 *       "items": [
 *         { "id_produk": "uuid", "quantity": 2, "id_promo": null, "nominal_promo": 0 }
 *       ]
 *     }
 *   ]
 * }
 */
class SyncBatchRequest extends FormRequest
{
    /** Endpoint terproteksi Sanctum, user sudah terautentikasi. */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Array transaksi wajib ada dan minimal 1 item
            'transactions'                         => ['required', 'array', 'min:1'],

            // Setiap transaksi WAJIB memiliki id_transaksi dari SQLite HP
            // (berbeda dengan draft normal yang boleh null)
            'transactions.*.id_transaksi'          => ['required', 'uuid'],

            // FK Header transaksi
            'transactions.*.id_shift'              => ['required', 'uuid', 'exists:shift_session,id_shift'],
            'transactions.*.id_cabang'             => ['required', 'uuid', 'exists:cabang,id_cabang'],
            'transactions.*.id_sales'              => ['required', 'uuid', 'exists:sales_mode,id_sales'],
            'transactions.*.id_metode'             => ['required', 'uuid', 'exists:metode_pembayaran,id_metode'],
            'transactions.*.id_promo'              => ['nullable', 'uuid', 'exists:promosi,id_promo'],
            'transactions.*.nominal_promo'         => ['nullable', 'numeric', 'min:0'],
            'transactions.*.nama_pelanggan'        => ['nullable', 'string', 'max:100'],

            // Setiap transaksi wajib memiliki minimal 1 item
            'transactions.*.items'                 => ['required', 'array', 'min:1'],
            'transactions.*.items.*.id_produk'     => ['required', 'uuid', 'exists:menu,id_menu'],
            'transactions.*.items.*.quantity'      => ['required', 'integer', 'min:1'],

            // harga_produk nullable — fallback dari menu_template jika null
            'transactions.*.items.*.harga_produk'  => ['nullable', 'numeric', 'min:0'],
            'transactions.*.items.*.id_promo'      => ['nullable', 'uuid', 'exists:promosi,id_promo'],
            'transactions.*.items.*.nominal_promo' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'transactions.required'                        => 'Array transaksi wajib disertakan.',
            'transactions.min'                             => 'Minimal harus ada 1 transaksi dalam batch.',
            'transactions.*.id_transaksi.required'         => 'Setiap transaksi harus memiliki id_transaksi dari perangkat lokal.',
            'transactions.*.id_transaksi.uuid'             => 'Format id_transaksi tidak valid, harus berupa UUID v4.',
            'transactions.*.id_shift.required'             => 'ID sesi shift wajib disertakan di setiap transaksi.',
            'transactions.*.id_shift.exists'               => 'Sesi shift tidak ditemukan dalam sistem.',
            'transactions.*.id_cabang.required'            => 'ID cabang wajib disertakan di setiap transaksi.',
            'transactions.*.id_cabang.exists'              => 'Cabang tidak ditemukan dalam sistem.',
            'transactions.*.id_sales.required'             => 'ID sales mode wajib disertakan di setiap transaksi.',
            'transactions.*.id_sales.exists'               => 'Sales mode tidak ditemukan dalam sistem.',
            'transactions.*.id_metode.required'            => 'Metode pembayaran wajib dipilih di setiap transaksi.',
            'transactions.*.id_metode.exists'              => 'Metode pembayaran tidak ditemukan dalam sistem.',
            'transactions.*.items.required'                => 'Setiap transaksi harus memiliki minimal 1 item.',
            'transactions.*.items.*.id_produk.required'    => 'Setiap item harus memiliki id_produk.',
            'transactions.*.items.*.id_produk.exists'      => 'Produk tidak ditemukan dalam katalog menu.',
            'transactions.*.items.*.quantity.required'     => 'Quantity setiap item wajib diisi.',
            'transactions.*.items.*.quantity.min'          => 'Quantity minimal adalah 1.',
        ];
    }
}

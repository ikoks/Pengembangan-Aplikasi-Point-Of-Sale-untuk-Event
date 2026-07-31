<?php

return [
    'required' => ':attribute wajib diisi.',
    'string' => ':attribute harus berupa teks.',
    'max' => [
        'string' => ':attribute maksimal :max karakter.',
        'numeric' => ':attribute maksimal bernilai :max.',
        'file' => ':attribute maksimal berukuran :max kilobytes.',
    ],
    'min' => [
        'string' => ':attribute minimal :min karakter.',
        'numeric' => ':attribute minimal bernilai :min.',
        'file' => ':attribute minimal berukuran :min kilobytes.',
    ],
    'unique' => ':attribute sudah digunakan.',
    'exists' => ':attribute yang dipilih tidak valid atau tidak ditemukan.',
    'email' => ':attribute harus berupa alamat email yang valid.',
    'confirmed' => 'Konfirmasi :attribute tidak cocok.',
    'boolean' => ':attribute harus berupa benar atau salah.',
    'in' => ':attribute yang dipilih tidak valid.',
    'image' => ':attribute harus berupa gambar.',
    'mimes' => ':attribute harus berupa file dengan tipe: :values.',
    'numeric' => ':attribute harus berupa angka.',
    'integer' => ':attribute harus berupa bilangan bulat.',
    'after_or_equal' => ':attribute harus berisi tanggal setelah atau sama dengan hari ini.',
    'date' => ':attribute bukan tanggal yang valid.',
    'array' => ':attribute harus berupa array.',
    
    'custom' => [
        'nama_kategori' => [
            'unique' => 'Nama kategori ini sudah digunakan.',
        ],
        'nama_sub_kategori' => [
            'unique' => 'Nama sub-kategori ini sudah digunakan.',
        ],
        'nama_menu' => [
            'unique' => 'Nama menu ini sudah digunakan.',
        ],
    ],
    
    'attributes' => [
        'nama_kategori' => 'Nama Kategori',
        'nama_sub_kategori' => 'Nama Sub-Kategori',
        'nama_menu' => 'Nama Menu',
        'nama_user' => 'Nama',
        'username' => 'Username',
        'email' => 'Email',
        'password' => 'Password',
        'id_cabang' => 'Cabang',
        'id_kategori' => 'Kategori',
        'id_sub_kategori' => 'Sub-Kategori',
        'id_sales' => 'Mode Penjualan',
        'nama_promo' => 'Nama Promosi',
        'tipe_promo' => 'Tipe Promosi',
        'cakupan_promo' => 'Cakupan Promosi',
        'nilai_promo' => 'Nilai Promosi',
        'min_pembelian' => 'Min. Pembelian',
        'tanggal_mulai' => 'Tanggal Mulai',
        'tanggal_selesai' => 'Tanggal Selesai',
        'harga_produk' => 'Harga Produk',
    ],
];

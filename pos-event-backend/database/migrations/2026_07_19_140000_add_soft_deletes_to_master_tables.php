<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambahkan kolom `deleted_at` (Soft Deletes) pada tabel yang dibutuhkan.
 *
 * Tabel yang mendapat fitur Soft Deletes:
 *   - cabang        → Data cabang tidak boleh hilang jika masih ada relasi transaksi historis.
 *   - user          → Akun kasir/admin tidak dihapus permanen, hanya dinonaktifkan.
 *   - kategori      → Kategori mungkin masih direferensikan oleh transaksi lama.
 *   - sub_kategori  → Sama dengan kategori.
 *   - menu          → Item menu mungkin masih ada di detail transaksi historis.
 */
return new class extends Migration
{
    /**
     * Jalankan migrasi: tambah kolom `deleted_at` ke setiap tabel.
     */
    public function up(): void
    {
        // Tabel: cabang
        Schema::table('cabang', function (Blueprint $table) {
            $table->softDeletes()->after('lokasi');
        });

        // Tabel: user
        Schema::table('user', function (Blueprint $table) {
            $table->softDeletes()->after('status_aktif');
        });

        // Tabel: kategori
        Schema::table('kategori', function (Blueprint $table) {
            $table->softDeletes()->after('nama_kategori');
        });

        // Tabel: sub_kategori
        Schema::table('sub_kategori', function (Blueprint $table) {
            $table->softDeletes()->after('nama_sub_kategori');
        });

        // Tabel: menu
        Schema::table('menu', function (Blueprint $table) {
            $table->softDeletes()->after('nama_menu');
        });
    }

    /**
     * Balikkan migrasi: hapus kolom `deleted_at` dari setiap tabel.
     */
    public function down(): void
    {
        Schema::table('cabang', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('user', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('kategori', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('sub_kategori', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('menu', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};

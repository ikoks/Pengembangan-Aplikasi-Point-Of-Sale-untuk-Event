<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promosi', function (Blueprint $table) {
            $table->char('id_promo', 36)->primary();
            $table->char('id_cabang', 36);
            $table->char('id_sales', 36);
            $table->string('nama_promo', 100);
            $table->enum('tipe_promo', ['Nominal', 'Persen'])->nullable();
            $table->enum('cakupan_promo', ['Per Transaksi', 'Per Item', 'Free Item']);
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->time('waktu_mulai')->nullable();
            $table->time('waktu_selesai')->nullable();
            $table->json('hari_aktif')->nullable();
            $table->decimal('nilai_promo', 12, 2)->nullable();
            $table->decimal('min_pembelian', 12, 2)->default(0);
            $table->json('syarat_menu')->nullable();

            $table->foreign('id_cabang')->references('id_cabang')->on('cabang');
            $table->foreign('id_sales')->references('id_sales')->on('sales_mode');

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promosi');
    }
};

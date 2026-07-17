<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transaksi', function (Blueprint $table) {
            $table->char('id_transaksi', 36)->primary();
            $table->char('id_sales', 36);
            $table->char('id_cabang', 36);
            $table->char('id_user', 36);
            $table->char('id_metode', 36);
            $table->char('id_shift', 36);
            $table->char('id_promo', 36)->nullable();
            $table->date('tanggal_transaksi');
            $table->time('jam_transaksi');
            $table->string('nama_pelanggan', 100)->nullable();
            $table->decimal('total', 12, 2);
            $table->decimal('tax', 12, 2);
            $table->enum('status', ['Draft', 'Pending', 'Success', 'Void', 'Cancelled'])->default('Draft');
            $table->char('diperbarui_oleh', 36)->nullable();
            $table->text('alasan_batal')->nullable();
            $table->text('catatan_koreksi')->nullable();
            $table->decimal('nominal_promo', 12, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('id_sales')->references('id_sales')->on('sales_mode');
            $table->foreign('id_cabang')->references('id_cabang')->on('cabang');
            $table->foreign('id_user')->references('id_user')->on('user');
            $table->foreign('id_metode')->references('id_metode')->on('metode_pembayaran');
            $table->foreign('id_shift')->references('id_shift')->on('shift_session');
            $table->foreign('id_promo')->references('id_promo')->on('promosi');
            $table->foreign('diperbarui_oleh')->references('id_user')->on('user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi');
    }
};

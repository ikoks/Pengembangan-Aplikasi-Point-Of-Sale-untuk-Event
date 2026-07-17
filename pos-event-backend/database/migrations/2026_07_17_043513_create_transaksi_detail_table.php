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
        Schema::create('transaksi_detail', function (Blueprint $table) {
            $table->char('id_transaksi_detail', 36)->primary();
            $table->char('id_transaksi', 36);
            $table->char('id_produk', 36);
            $table->decimal('harga_produk', 12, 2);
            $table->integer('quantity');
            $table->char('id_promo', 36)->nullable();
            $table->decimal('nominal_promo', 12, 2)->default(0.00);
            $table->decimal('subtotal_item', 12, 2);
            $table->enum('status_item', ['Active', 'Void'])->default('Active');
            $table->text('alasan_batal_item')->nullable();
            $table->timestamps();

            $table->foreign('id_transaksi')->references('id_transaksi')->on('transaksi')->onDelete('cascade');
            $table->foreign('id_produk')->references('id_menu')->on('menu');
            $table->foreign('id_promo')->references('id_promo')->on('promosi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi_detail');
    }
};

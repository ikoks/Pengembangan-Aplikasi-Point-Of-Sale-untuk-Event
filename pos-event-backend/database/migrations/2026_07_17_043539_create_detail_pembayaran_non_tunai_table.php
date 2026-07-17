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
    Schema::create('detail_pembayaran_non_tunai', function (Blueprint $table) {
        $table->char('id_detail_bayar', 36)->primary();
        $table->char('id_transaksi', 36);
        $table->string('payment_gateway_id', 100)->unique();
        $table->string('reference_number', 100)->nullable();
        $table->text('qr_string_data')->nullable();
        $table->string('va_number', 50)->nullable();
        $table->enum('status_api', ['PENDING', 'SETTLEMENT', 'EXPIRED', 'DENIED'])->default('PENDING');
        $table->dateTime('waktu_kedaluwarsa');
        $table->json('raw_callback_payload')->nullable();
        $table->timestamps();

        $table->foreign('id_transaksi')->references('id_transaksi')->on('transaksi');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_pembayaran_non_tunai');
    }
};

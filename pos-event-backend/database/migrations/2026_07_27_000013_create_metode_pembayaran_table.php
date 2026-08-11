<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metode_pembayaran', function (Blueprint $table) {
            $table->char('id_metode', 36)->primary();
            $table->string('nama_metode', 50);
            $table->char('id_kategori_metode', 36);
            $table->foreign('id_kategori_metode')->references('id_kategori_metode')->on('kategori_metode_pembayaran')->onDelete('restrict');
            $table->enum('status', ['Aktif', 'Nonaktif'])->default('Aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metode_pembayaran');
    }
};

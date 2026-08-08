<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kategori_metode_pembayaran', function (Blueprint $table) {
            $table->char('id_kategori_metode', 36)->primary();
            $table->string('nama_kategori', 50);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kategori_metode_pembayaran');
    }
};

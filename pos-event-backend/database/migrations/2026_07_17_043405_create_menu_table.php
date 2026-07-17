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
        Schema::create('menu', function (Blueprint $table) {
            $table->char('id_menu', 36)->primary();
            $table->char('id_sub_kategori', 36);
            $table->string('nama_menu', 150);
            $table->timestamps();

            $table->foreign('id_sub_kategori')->references('id_sub_kategori')->on('sub_kategori');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu');
    }
};

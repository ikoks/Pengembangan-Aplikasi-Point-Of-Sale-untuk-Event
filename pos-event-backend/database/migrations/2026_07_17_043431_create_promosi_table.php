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
        Schema::create('promosi', function (Blueprint $table) {
            $table->char('id_promo', 36)->primary();
            $table->char('id_cabang', 36);
            $table->string('nama_promo', 100);
            $table->enum('tipe_promo', ['Nominal', 'Persen']);
            $table->decimal('id_menu_free', 36)->nullable();
            $table->char('id_menu_free', 36)->nullable();
            $table->timestamps();

            $table->foreign('id_cabang')->references('id_cabang')->on('cabang');
            $table->foreign('id_menu_free')->references('id_menu')->on('menu');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promosi');
    }
};

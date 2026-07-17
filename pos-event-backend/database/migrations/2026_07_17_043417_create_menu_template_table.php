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
        Schema::create('menu_template', function (Blueprint $table) {
            $table->char('id_template', 36)->primary();
            $table->char('id_menu', 36);
            $table->char('id_cabang', 36);
            $table->char('id_sales', 36);
            $table->decimal('harga_produk', 12, 2);
            $table->timestamps();

            $table->foreign('id_menu')->references('id_menu')->on('menu');
            $table->foreign('id_cabang')->references('id_cabang')->on('cabang');
            $table->foreign('id_sales')->references('id_sales')->on('sales_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_template');
    }
};

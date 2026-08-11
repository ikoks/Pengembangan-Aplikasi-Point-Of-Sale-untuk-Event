<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_template', function (Blueprint $table) {
            $table->char('id_template', 36)->primary();
            $table->char('id_menu', 36);
            $table->char('id_sales', 36);
            $table->decimal('harga_produk', 12, 2);
            $table->timestamps();

            $table->foreign('id_menu')->references('id_menu')->on('menu');
            $table->foreign('id_sales')->references('id_sales')->on('sales_mode');

            // Poin 2: Unique per Menu × Sales Mode (tanpa cabang)
            $table->unique(['id_menu', 'id_sales'], 'menu_template_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_template');
    }
};

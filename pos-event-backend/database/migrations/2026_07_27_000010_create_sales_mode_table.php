<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_mode', function (Blueprint $table) {
            $table->char('id_sales', 36)->primary();
            $table->string('nama_mode', 50);
            $table->enum('status', ['Aktif', 'Nonaktif'])->default('Aktif');
            $table->timestamps();
        });

        Schema::table('cabang', function (Blueprint $table) {
            $table->foreign('id_sales')->references('id_sales')->on('sales_mode')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('cabang', function (Blueprint $table) {
            $table->dropForeign(['id_sales']);
        });

        Schema::dropIfExists('sales_mode');
    }
};

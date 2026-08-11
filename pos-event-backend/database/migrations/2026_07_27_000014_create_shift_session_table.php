<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_session', function (Blueprint $table) {
            $table->char('id_shift', 36)->primary();
            $table->char('id_kasir', 36);
            $table->char('id_kasir_aktif', 36)->nullable();
            $table->char('id_cabang', 36);
            $table->char('id_sales', 36);
            $table->dateTime('waktu_mulai');
            $table->dateTime('waktu_selesai')->nullable();
            $table->decimal('modal_awal', 12, 2);
            $table->decimal('uang_fisik_akhir', 12, 2)->nullable();
            $table->enum('status_shift', ['OPEN', 'ON_BREAK', 'CLOSED'])->default('OPEN');
            $table->decimal('selisih_uang', 12, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('id_kasir')->references('id_kasir')->on('kasirs');
            $table->foreign('id_kasir_aktif')->references('id_kasir')->on('kasirs');
            $table->foreign('id_cabang')->references('id_cabang')->on('cabang');
            $table->foreign('id_sales')->references('id_sales')->on('sales_mode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_session');
    }
};

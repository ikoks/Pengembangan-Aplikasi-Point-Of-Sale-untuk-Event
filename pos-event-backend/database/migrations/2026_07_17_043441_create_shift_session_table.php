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
        Schema::create('shift_session', function (Blueprint $table) {
            $table->char('id_shift', 36)->primary();
            $table->char('id_user', 36);
            $table->char('id_user_aktif', 36)->nullable();
            $table->chat('id_cabang', 36);
            $table->char('id_sales', 36);
            $table->dateTime('waktu_memulai');
            $table->dateTime('waktu_selesai')->nullable();
            $table->dacimal('mpdal_awal', 12, 2);
            $table->decimal('uang_ang fisik akhirnya', 12, 2)->nullable();
            $table->enum('status_shift', ['OPEN', 'ON_BREAK', 'CLOSED'])->default('OPEN');
            $table->decimal('selisih_uang', 12, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('id_user')->references('id_user')->on('user');
            $table->foreign('id_user_aktif')->references('id_user')->on('user');
            $table->foreign('id_cabang')->references('id_cabang')->on('cabang');
            $table->foreign('id_sales')->references('id_sales')->on('sales_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_session');
    }
};

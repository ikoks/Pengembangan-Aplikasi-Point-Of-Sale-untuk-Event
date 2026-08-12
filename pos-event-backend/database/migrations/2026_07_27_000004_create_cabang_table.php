<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cabang', function (Blueprint $table) {
            $table->char('id_cabang', 36)->primary();
            $table->char('id_sales', 36)->nullable();
            $table->string('nama_cabang', 100);
            $table->text('lokasi');
            $table->decimal('pajak_persen', 5, 2)->nullable();
            $table->text('qr_static_payload')->nullable();
            $table->string('qr_static_token', 10)->nullable();
            $table->enum('status', ['Aktif', 'Nonaktif'])->default('Aktif');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cabang');
    }
};

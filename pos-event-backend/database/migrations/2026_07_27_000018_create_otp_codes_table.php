<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->char('id_otp', 36)->primary();
            // Admin pembuat OTP
            $table->char('id_admin', 36);
            // Poin 8: OTP kini terikat ke sesi shift aktif
            $table->char('id_shift', 36)->nullable();
            // Target lama — tetap nullable untuk backward-compatibility
            $table->char('id_kasir', 36)->nullable();
            $table->char('id_cabang', 36)->nullable();
            $table->char('id_sales', 36)->nullable();
            $table->string('otp_code', 6);
            $table->enum('status', ['active', 'used', 'expired'])->default('active');
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->foreign('id_admin')->references('id_admin')->on('admins')->onDelete('cascade');
            $table->foreign('id_shift')->references('id_shift')->on('shift_session')->onDelete('set null');
            $table->foreign('id_kasir')->references('id_kasir')->on('kasirs')->onDelete('set null');
            $table->foreign('id_cabang')->references('id_cabang')->on('cabang')->onDelete('set null');
            $table->foreign('id_sales')->references('id_sales')->on('sales_mode')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};

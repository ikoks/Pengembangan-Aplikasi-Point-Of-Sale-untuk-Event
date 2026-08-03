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
            $table->char('id_user', 36);
            // Target: Kasir, Cabang, dan Sales Mode yang dituju
            $table->char('id_kasir', 36);
            $table->char('id_cabang', 36);
            $table->char('id_sales', 36);
            $table->string('otp_code', 6);
            $table->enum('status', ['active', 'used', 'expired'])->default('active');
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->foreign('id_user')->references('id_user')->on('user')->onDelete('cascade');
            $table->foreign('id_kasir')->references('id_user')->on('user')->onDelete('cascade');
            $table->foreign('id_cabang')->references('id_cabang')->on('cabang')->onDelete('cascade');
            $table->foreign('id_sales')->references('id_sales')->on('sales_mode')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};

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
        Schema::create('user', function (Blueprint $table) {
            $table->char('id_user', 36)->primary();
            $table->char('id_role', 36);
            $table->char('id_cabang', 36)->nullable();
            $table->string('username', 50)->unique();
            $table->string('password_hash', 255)->nullable();
            $table->string('nama_user', 100);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();

            $table->foreign('id_role')->references('id_role')->on('role_user');
            $table->foreign('id_cabang')->references('id_cabang')->on('cabang');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user');
    }
};

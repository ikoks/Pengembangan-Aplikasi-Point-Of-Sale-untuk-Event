<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->char('id_admin', 36)->primary();
            $table->char('id_role', 36);
            $table->string('username', 50)->unique();
            $table->string('password_hash', 255);
            $table->string('nama_admin', 100);
            $table->string('email', 100)->unique()->nullable();
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('id_role')->references('id_role')->on('role_user');
        });

        Schema::create('kasirs', function (Blueprint $table) {
            $table->char('id_kasir', 36)->primary();
            $table->char('id_role', 36);
            $table->char('id_cabang', 36)->nullable();
            $table->string('username', 50)->unique();
            $table->string('pin', 6);
            $table->string('nama_kasir', 100);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('id_role')->references('id_role')->on('role_user');
            $table->foreign('id_cabang')->references('id_cabang')->on('cabang');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kasirs');
        Schema::dropIfExists('admins');
    }
};

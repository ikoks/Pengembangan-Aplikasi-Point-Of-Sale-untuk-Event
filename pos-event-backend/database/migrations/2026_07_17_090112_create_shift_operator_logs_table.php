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
        Schema::create('shift_operator_logs', function (Blueprint $table) {
            $table->char('id_log', 36)->primary();
            $table->char('id_shift', 36);
            $table->char('id_user', 36);
            $table->enum('aksi', ['OPEN', 'BREAK', 'RESUME', 'SWITCH', 'CLOSED']);
            $table->dateTime('waktu_kejadian');
            $table->text('catatan')->nullable();
            $table->timestamps();
            
            $table->foreign('id_shift')->references('id_shift')->on('shift_session')->onDelete('cascade');
            $table->foreign('id_user')->references('id_user')->on('user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_operator_logs');
    }
};

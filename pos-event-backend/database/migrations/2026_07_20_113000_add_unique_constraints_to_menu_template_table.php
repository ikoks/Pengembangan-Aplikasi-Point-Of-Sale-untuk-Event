<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Bersihkan baris duplikat yang sudah terlanjur ada di database secara otomatis.
        // Hanya menyisakan 1 baris pertama yang dibuat (berdasarkan ID atau created_at terkecil).
        DB::statement("
            DELETE t1 FROM menu_template t1
            INNER JOIN menu_template t2 
            WHERE t1.created_at > t2.created_at 
              AND t1.id_menu = t2.id_menu 
              AND t1.id_cabang = t2.id_cabang 
              AND t1.id_sales = t2.id_sales
        ");

        // 2. Pasang indeks unik komposit agar duplikasi tidak terjadi lagi di masa depan.
        Schema::table('menu_template', function (Blueprint $table) {
            $table->unique(['id_menu', 'id_cabang', 'id_sales'], 'menu_template_unique_combination');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_template', function (Blueprint $table) {
            $table->dropUnique('menu_template_unique_combination');
        });
    }
};

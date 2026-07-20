<?php

namespace App\Providers;

use App\Models\Cabang;
use App\Models\Kategori;
use App\Models\Menu;
use App\Models\MenuTemplate;
use App\Models\ShiftSession;
use App\Models\SubKategori;
use App\Models\UserModel;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Mendaftarkan Custom Route Model Binding untuk setiap model yang menggunakan
     * primary key non-standar (UUID dengan nama kolom kustom seperti `id_xxx`).
     *
     * Tanpa ini, Laravel akan mencoba resolve record menggunakan kolom `id`
     * (standar auto-increment), yang tidak ada di skema database kita.
     *
     * Prinsip: Setiap route parameter `{xxx}` dipetakan ke kolom PK yang sesuai.
     */
    public function boot(): void
    {
        // =====================================================================
        // BINDINGS HARI 1 & 2 — Master Data
        // =====================================================================

        /**
         * Binding {cabang} → Cabang model menggunakan kolom `id_cabang`.
         * Digunakan pada route: /api/v1/cabang/{cabang}
         */
        Route::bind('cabang', function (string $value) {
            return Cabang::where('id_cabang', $value)->firstOrFail();
        });

        /**
         * Binding {user} → UserModel menggunakan kolom `id_user`.
         * Digunakan pada route: /api/v1/users/{user}
         */
        Route::bind('user', function (string $value) {
            return UserModel::where('id_user', $value)->firstOrFail();
        });

        /**
         * Binding {kategori} → Kategori model menggunakan kolom `id_kategori`.
         * Digunakan pada route: /api/v1/kategoris/{kategori}
         */
        Route::bind('kategori', function (string $value) {
            return Kategori::where('id_kategori', $value)->firstOrFail();
        });

        /**
         * Binding {sub_kategori} → SubKategori model menggunakan kolom `id_sub_kategori`.
         * Digunakan pada route: /api/v1/sub-kategoris/{sub_kategori}
         */
        Route::bind('sub_kategori', function (string $value) {
            return SubKategori::where('id_sub_kategori', $value)->firstOrFail();
        });

        /**
         * Binding {menu} → Menu model menggunakan kolom `id_menu`.
         * Digunakan pada route: /api/v1/menus/{menu}
         */
        Route::bind('menu', function (string $value) {
            return Menu::where('id_menu', $value)->firstOrFail();
        });

        // =====================================================================
        // BINDINGS HARI 3 — Template Harga & Shift
        // =====================================================================

        /**
         * Binding {menu_template} → MenuTemplate model menggunakan kolom `id_template`.
         * Digunakan pada route: /api/v1/menu-templates/{menu_template}
         */
        Route::bind('menu_template', function (string $value) {
            return MenuTemplate::where('id_template', $value)->firstOrFail();
        });

        /**
         * Binding {shift_session} → ShiftSession model menggunakan kolom `id_shift`.
         * Digunakan pada route: /api/v1/shift/{shift_session}
         * (Dipersiapkan untuk endpoint closing dan log shift di hari berikutnya)
         */
        Route::bind('shift_session', function (string $value) {
            return ShiftSession::where('id_shift', $value)->firstOrFail();
        });
    }
}

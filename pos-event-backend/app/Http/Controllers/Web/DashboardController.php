<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * DashboardController
 *
 * Controller untuk halaman utama panel admin setelah login.
 * Halaman ini dilindungi oleh middleware 'auth' (Web Guard).
 */
class DashboardController extends Controller
{
    /**
     * Menampilkan halaman dashboard admin.
     * Data statistik dan ringkasan akan ditambahkan pada sprint berikutnya.
     */
    public function index(): View
    {
        return view('admin.dashboard');
    }
}

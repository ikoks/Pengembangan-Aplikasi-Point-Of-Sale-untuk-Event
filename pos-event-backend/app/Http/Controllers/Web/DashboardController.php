<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

use App\Models\Transaksi;
use App\Models\Cabang;
use App\Models\Menu;

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
        $totalTransaksi = Transaksi::where('status', 'Success')->count();
        $totalPendapatan = Transaksi::where('status', 'Success')->sum('total');
        $totalCabang = Cabang::count();
        $totalMenu = Menu::count();

        // 7 hari terakhir
        $tujuhHariLalu = now()->subDays(6)->toDateString();
        
        $chartData = Transaksi::where('status', 'Success')
            ->where('tanggal_transaksi', '>=', $tujuhHariLalu)
            ->selectRaw('tanggal_transaksi as tanggal, sum(total) as pendapatan, count(id_transaksi) as jumlah')
            ->groupBy('tanggal_transaksi')
            ->orderBy('tanggal_transaksi', 'asc')
            ->get();

        return view('admin.dashboard', compact(
            'totalTransaksi', 
            'totalPendapatan', 
            'totalCabang', 
            'totalMenu', 
            'chartData'
        ));
    }
}

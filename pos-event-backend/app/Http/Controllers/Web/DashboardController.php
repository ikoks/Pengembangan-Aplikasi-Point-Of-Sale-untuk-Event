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

        $periode = request('periode', 'hari');

        $labels = [];
        $dataPendapatan = [];
        $chartTitle = 'GRAFIK PENDAPATAN (7 HARI TERAKHIR)';

        if ($periode === 'minggu') {
            // 1 Minggu (7 Hari Terakhir)
            $startDate = now()->subDays(6)->format('Y-m-d');
            $transaksi = Transaksi::where('status', 'Success')
                ->where('tanggal_transaksi', '>=', $startDate)
                ->selectRaw('tanggal_transaksi as tanggal, sum(total) as pendapatan')
                ->groupBy('tanggal_transaksi')
                ->pluck('pendapatan', 'tanggal');
            
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $labels[] = $date;
                $dataPendapatan[] = $transaksi->get($date, 0);
            }
            $chartTitle = 'GRAFIK PENDAPATAN (1 MINGGU TERAKHIR)';
        } elseif ($periode === 'bulan') {
            // 1 Bulan (30 Hari Terakhir)
            $startDate = now()->subDays(29)->format('Y-m-d');
            $transaksi = Transaksi::where('status', 'Success')
                ->where('tanggal_transaksi', '>=', $startDate)
                ->selectRaw('tanggal_transaksi as tanggal, sum(total) as pendapatan')
                ->groupBy('tanggal_transaksi')
                ->pluck('pendapatan', 'tanggal');
                
            for ($i = 29; $i >= 0; $i--) {
                $dateObj = now()->subDays($i);
                $date = $dateObj->format('Y-m-d');
                $labels[] = $dateObj->format('d/m');
                $dataPendapatan[] = $transaksi->get($date, 0);
            }
            $chartTitle = 'GRAFIK PENDAPATAN (1 BULAN TERAKHIR)';
        } else {
            // Default: 1 hari (Hari Ini)
            $today = now()->format('Y-m-d');
            $transaksi = Transaksi::where('status', 'Success')
                ->where('tanggal_transaksi', $today)
                ->get();
            
            for ($i = 0; $i <= 23; $i++) {
                $hourStr = str_pad($i, 2, '0', STR_PAD_LEFT) . ':00';
                
                $sum = $transaksi->filter(function($t) use ($i) {
                    return (int) substr($t->jam_transaksi, 0, 2) === $i;
                })->sum('total');
                
                // Only show label if there's data, or just show every hour but it might be cramped.
                // Let's show every hour
                $labels[] = $hourStr;
                $dataPendapatan[] = $sum;
            }
            $chartTitle = 'GRAFIK PENDAPATAN (HARI INI)';
        }

        return view('admin.dashboard', compact(
            'totalTransaksi', 
            'totalPendapatan', 
            'totalCabang', 
            'totalMenu', 
            'labels',
            'dataPendapatan',
            'chartTitle',
            'periode'
        ));
    }
}

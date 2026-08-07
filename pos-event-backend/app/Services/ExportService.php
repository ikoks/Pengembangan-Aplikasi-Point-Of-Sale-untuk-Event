<?php

namespace App\Services;

use App\Models\Transaksi;
use Illuminate\Database\Eloquent\Collection;

// Service Query & Kalkulasi Laporan Keuangan
class ExportService
{
    const STATUS_PENDAPATAN = ['Success'];
    const STATUS_AUDIT      = ['Void', 'Cancelled'];

    // Filter query laporan
    public function buildQuery(array $params)
    {
        $query = Transaksi::with([
            'kasir',
            'cabang',
            'metodePembayaran',
            'salesMode',
            'details.menu.subKategori.kategori',
            'promosi',
        ])->orderBy('tanggal_transaksi', 'desc')
          ->orderBy('jam_transaksi', 'desc');

        if (!empty($params['tanggal_mulai'])) {
            $query->where('tanggal_transaksi', '>=', $params['tanggal_mulai']);
        }
        if (!empty($params['tanggal_akhir'])) {
            $query->where('tanggal_transaksi', '<=', $params['tanggal_akhir']);
        }
        if (!empty($params['id_cabang'])) {
            $query->where('id_cabang', $params['id_cabang']);
        }
        if (!empty($params['id_kategori'])) {
            $query->whereHas('details.menu.subKategori', function ($q) use ($params) {
                $q->where('id_kategori', $params['id_kategori']);
            });
        }
        if (!empty($params['id_metode'])) {
            $query->where('id_metode', $params['id_metode']);
        }

        return $query;
    }

    // Kalkulasi KPI laporan
    public function hitungKPI(Collection $transaksis, array $params = []): array
    {
        $pendapatan = $transaksis->whereIn('status', self::STATUS_PENDAPATAN);
        $audit      = $transaksis->whereIn('status', self::STATUS_AUDIT);

        $pendapatanBersih = $pendapatan->sum(fn($t) => (float) $t->total);
        $volumePenjualan  = $pendapatan->sum(function ($t) {
            return $t->details->where('status_item', 'Active')->sum('quantity');
        });

        $breakdownMetode = $pendapatan->groupBy('id_metode')->map(function ($group) {
            $first = $group->first();
            return [
                'nama_metode'      => $first->metodePembayaran?->nama_metode ?? 'Tidak Diketahui',
                'jumlah_transaksi' => $group->count(),
                'total_nominal'    => $group->sum(fn($t) => (float) $t->total),
            ];
        })->values();

        $jumlahVoid      = $transaksis->where('status', 'Void')->count();
        $jumlahCancelled = $transaksis->where('status', 'Cancelled')->count();
        $nilaiVoid       = $transaksis->where('status', 'Void')->sum(fn($t) => (float) $t->total);

        $breakdownKategori = collect();
        $breakdownSubKategori = collect();
        $breakdownProduk = collect();
        $breakdownCabang = collect();
        $breakdownSalesMode = collect();
        $breakdownKasir = collect();
        $breakdownJamSibuk = collect();

        $jl = $params['jenis_laporan'] ?? '';

        if (in_array($jl, ['per_kategori', 'per_sub_kategori', 'per_produk'])) {
            $kategoriSales = [];
            $subKategoriSales = [];
            $produkSales = [];
            foreach ($pendapatan as $trx) {
                foreach ($trx->details->where('status_item', 'Active') as $detail) {
                    $subKat = $detail->menu?->subKategori;
                    $katName = $subKat?->kategori?->nama_kategori ?? 'Tanpa Kategori';
                    $subKatName = $subKat?->nama_sub_kategori ?? 'Tanpa Sub-Kategori';
                    $prodName = $detail->menu?->nama_menu ?? 'Produk Tidak Dikenal';

                    if ($jl === 'per_kategori') {
                        if (!isset($kategoriSales[$katName])) {
                            $kategoriSales[$katName] = ['nama_kategori' => $katName, 'qty' => 0, 'total' => 0];
                        }
                        $kategoriSales[$katName]['qty'] += $detail->quantity;
                        $kategoriSales[$katName]['total'] += (float) $detail->subtotal_item;
                    }

                    if ($jl === 'per_sub_kategori') {
                        if (!isset($subKategoriSales[$subKatName])) {
                            $subKategoriSales[$subKatName] = ['nama_sub_kategori' => $subKatName, 'nama_kategori' => $katName, 'qty' => 0, 'total' => 0];
                        }
                        $subKategoriSales[$subKatName]['qty'] += $detail->quantity;
                        $subKategoriSales[$subKatName]['total'] += (float) $detail->subtotal_item;
                    }

                    if ($jl === 'per_produk') {
                        if (!isset($produkSales[$prodName])) {
                            $produkSales[$prodName] = ['nama_produk' => $prodName, 'nama_sub_kategori' => $subKatName, 'qty' => 0, 'total' => 0];
                        }
                        $produkSales[$prodName]['qty'] += $detail->quantity;
                        $produkSales[$prodName]['total'] += (float) $detail->subtotal_item;
                    }
                }
            }
            if ($jl === 'per_kategori') $breakdownKategori = collect(array_values($kategoriSales))->sortByDesc('total')->values();
            if ($jl === 'per_sub_kategori') $breakdownSubKategori = collect(array_values($subKategoriSales))->sortByDesc('total')->values();
            if ($jl === 'per_produk') $breakdownProduk = collect(array_values($produkSales))->sortByDesc('qty')->values();
        }

        if ($jl === 'per_cabang') {
            $breakdownCabang = $pendapatan->groupBy('id_cabang')->map(function($g) {
                return [
                    'nama_cabang' => $g->first()->cabang?->nama_cabang ?? 'Tidak Diketahui',
                    'qty' => $g->count(),
                    'total' => $g->sum(fn($t) => (float)$t->total)
                ];
            })->sortByDesc('total')->values();
        }

        if ($jl === 'per_sales_mode') {
            $breakdownSalesMode = $pendapatan->groupBy('id_sales_mode')->map(function($g) {
                return [
                    'nama_sales_mode' => $g->first()->salesMode?->nama_mode ?? 'Tidak Diketahui',
                    'qty' => $g->count(),
                    'total' => $g->sum(fn($t) => (float)$t->total)
                ];
            })->sortByDesc('total')->values();
        }

        if ($jl === 'per_kasir') {
            $breakdownKasir = $pendapatan->groupBy('id_user')->map(function($g) {
                return [
                    'nama_kasir' => $g->first()->kasir?->nama_user ?? 'Tidak Diketahui',
                    'nama_cabang' => $g->first()->cabang?->nama_cabang ?? '-',
                    'qty' => $g->count(),
                    'total' => $g->sum(fn($t) => (float)$t->total)
                ];
            })->sortByDesc('total')->values();
        }

        if ($jl === 'per_jam_sibuk') {
            $breakdownJamSibuk = $pendapatan->groupBy(function($t) {
                return substr($t->jam_transaksi, 0, 2) . ':00';
            })->map(function($g, $hour) {
                return [
                    'jam' => $hour,
                    'qty' => $g->count(),
                    'total' => $g->sum(fn($t) => (float)$t->total)
                ];
            })->sortBy('jam')->values();
        }

        return [
            'pendapatan_bersih' => $pendapatanBersih,
            'volume_penjualan'  => (int) $volumePenjualan,
            'jumlah_transaksi'  => $pendapatan->count(),
            'jumlah_void'       => $jumlahVoid,
            'jumlah_cancelled'  => $jumlahCancelled,
            'nilai_void'        => $nilaiVoid,
            'breakdown_metode'  => $breakdownMetode,
            'breakdown_kategori'=> $breakdownKategori,
            'breakdown_sub_kategori' => $breakdownSubKategori,
            'breakdown_produk'  => $breakdownProduk,
            'breakdown_cabang'  => $breakdownCabang,
            'breakdown_sales_mode' => $breakdownSalesMode,
            'breakdown_kasir'   => $breakdownKasir,
            'breakdown_jam_sibuk' => $breakdownJamSibuk,
        ];
    }

    // Ambil data laporan & KPI
    public function getLaporanData(array $params): array
    {
        $query      = $this->buildQuery($params);
        $transaksis = $query->get();
        $kpi        = $this->hitungKPI($transaksis, $params);

        return [
            'transaksis' => $transaksis,
            'kpi'        => $kpi,
            'params'     => $params,
        ];
    }

    // Ambil data laporan dengan paginasi
    public function getLaporanPaginated(array $params, int $perPage = 25)
    {
        return $this->buildQuery($params)->paginate($perPage)->withQueryString();
    }
}

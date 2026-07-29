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
    public function hitungKPI(Collection $transaksis): array
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

        return [
            'pendapatan_bersih' => $pendapatanBersih,
            'volume_penjualan'  => (int) $volumePenjualan,
            'jumlah_transaksi'  => $pendapatan->count(),
            'jumlah_void'       => $jumlahVoid,
            'jumlah_cancelled'  => $jumlahCancelled,
            'nilai_void'        => $nilaiVoid,
            'breakdown_metode'  => $breakdownMetode,
        ];
    }

    // Ambil data laporan & KPI
    public function getLaporanData(array $params): array
    {
        $query      = $this->buildQuery($params);
        $transaksis = $query->get();
        $kpi        = $this->hitungKPI($transaksis);

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

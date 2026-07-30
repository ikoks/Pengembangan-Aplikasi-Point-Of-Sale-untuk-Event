<?php

namespace App\Exports;

use App\Models\Shift;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ShiftLogExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    use Exportable;

    protected $params;

    public function __construct(array $params = [])
    {
        $this->params = $params;
    }

    public function query()
    {
        $query = Shift::with(['user', 'cabang', 'salesMode', 'transaksis']);

        if (!empty($this->params['kasir'])) {
            $kasirName = $this->params['kasir'];
            $query->whereHas('user', function ($q) use ($kasirName) {
                $q->where('nama_user', 'like', "%{$kasirName}%");
            });
        }
        if (!empty($this->params['id_cabang'])) {
            $query->where('id_cabang', $this->params['id_cabang']);
        }
        if (!empty($this->params['status_shift'])) {
            $query->where('status_shift', $this->params['status_shift']);
        }
        if (!empty($this->params['tanggal_mulai'])) {
            $query->whereDate('waktu_mulai', '>=', $this->params['tanggal_mulai']);
        }
        if (!empty($this->params['tanggal_akhir'])) {
            $query->whereDate('waktu_mulai', '<=', $this->params['tanggal_akhir']);
        }
        if (!empty($this->params['auto_closed'])) {
            $query->whereHas('operatorLogs', function ($q) {
                $q->where('catatan', 'like', '%auto_closed%');
            });
        }

        return $query->latest('waktu_mulai');
    }

    public function headings(): array
    {
        return [
            'ID Shift',
            'Waktu Mulai',
            'Waktu Selesai',
            'Status',
            'Nama Kasir',
            'Cabang',
            'Sales Mode',
            'Modal Awal',
            'Uang Fisik Akhir',
            'Selisih Kas',
            'Pendapatan Sistem',
            'Jumlah Transaksi',
        ];
    }

    public function map($shift): array
    {
        $totalPendapatan = $shift->transaksis->where('status', 'Success')->sum(fn($t) => (float) $t->total);
        $totalTrx = $shift->transaksis->count();

        return [
            $shift->id_shift,
            $shift->waktu_mulai ? $shift->waktu_mulai->format('Y-m-d H:i:s') : '-',
            $shift->waktu_selesai ? $shift->waktu_selesai->format('Y-m-d H:i:s') : '-',
            $shift->status_shift,
            $shift->user ? $shift->user->nama_user : '-',
            $shift->cabang ? $shift->cabang->nama_cabang : '-',
            $shift->salesMode ? $shift->salesMode->nama_sales : '-',
            $shift->modal_awal,
            $shift->uang_fisik_akhir,
            $shift->selisih_uang,
            $totalPendapatan,
            $totalTrx,
        ];
    }
}

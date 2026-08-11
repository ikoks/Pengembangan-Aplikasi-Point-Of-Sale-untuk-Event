<?php

namespace App\Exports;

use App\Models\ShiftSession;
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
        $query = ShiftSession::with(['kasir', 'cabang', 'salesMode', 'transaksis']);

        if (!empty($this->params['kasir'])) {
            $kasirName = $this->params['kasir'];
            $query->whereHas('kasir', function ($q) use ($kasirName) {
                $q->where('nama_kasir', 'like', "%{$kasirName}%");
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

    public function map($ShiftSession): array
    {
        $totalPendapatan = $ShiftSession->transaksis->where('status', 'Success')->sum(fn($t) => (float) $t->total);
        $totalTrx = $ShiftSession->transaksis->count();

        return [
            $ShiftSession->id_shift,
            $ShiftSession->waktu_mulai ? $ShiftSession->waktu_mulai->format('Y-m-d H:i:s') : '-',
            $ShiftSession->waktu_selesai ? $ShiftSession->waktu_selesai->format('Y-m-d H:i:s') : '-',
            $ShiftSession->status_shift,
            $ShiftSession->kasir ? $ShiftSession->kasir->nama_kasir : '-',
            $ShiftSession->cabang ? $ShiftSession->cabang->nama_cabang : '-',
            $ShiftSession->salesMode ? $ShiftSession->salesMode->nama_sales : '-',
            $ShiftSession->modal_awal,
            $ShiftSession->uang_fisik_akhir,
            $ShiftSession->selisih_uang,
            $totalPendapatan,
            $totalTrx,
        ];
    }
}

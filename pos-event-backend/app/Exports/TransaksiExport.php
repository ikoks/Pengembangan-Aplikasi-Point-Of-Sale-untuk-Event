<?php

namespace App\Exports;

use App\Models\Transaksi;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class TransaksiExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    use Exportable;

    protected $params;

    public function __construct(array $params = [])
    {
        $this->params = $params;
    }

    public function query()
    {
        $query = Transaksi::with([
            'kasir', 'cabang', 'metodePembayaran', 'details.menu', 'promosi'
        ])->where('status', '!=', 'Draft')->orderBy('tanggal_transaksi', 'desc')->orderBy('jam_transaksi', 'desc');

        if (!empty($this->params['id_transaksi'])) {
            $query->where('id_transaksi', 'like', '%' . $this->params['id_transaksi'] . '%');
        }
        if (!empty($this->params['kasir'])) {
            $query->whereHas('kasir', function ($q) {
                $q->where('nama_kasir', 'like', '%' . $this->params['kasir'] . '%');
            });
        }
        if (!empty($this->params['id_cabang'])) {
            $query->where('id_cabang', $this->params['id_cabang']);
        }
        if (!empty($this->params['id_metode'])) {
            $query->where('id_metode', $this->params['id_metode']);
        }
        if (!empty($this->params['tanggal_mulai'])) {
            $query->where('tanggal_transaksi', '>=', $this->params['tanggal_mulai']);
        }
        if (!empty($this->params['tanggal_akhir'])) {
            $query->where('tanggal_transaksi', '<=', $this->params['tanggal_akhir']);
        }
        if (!empty($this->params['status'])) {
            $query->where('status', $this->params['status']);
        }
        if (!empty($this->params['nomor_referensi'])) {
            $query->where('nomor_referensi', 'like', '%' . $this->params['nomor_referensi'] . '%');
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'ID Transaksi',
            'Tanggal',
            'Jam',
            'Status',
            'Kasir',
            'Cabang',
            'Metode Pembayaran',
            'Nomor Referensi',
            'Subtotal',
            'Diskon',
            'Pajak',
            'Total',
            'Dibayar',
            'Kembalian',
        ];
    }

    public function map($trx): array
    {
        return [
            $trx->id_transaksi,
            $trx->tanggal_transaksi ? \Carbon\Carbon::parse($trx->tanggal_transaksi)->format('Y-m-d') : '-',
            $trx->jam_transaksi,
            strtoupper($trx->status),
            $trx->kasir ? $trx->kasir->nama_kasir : '-',
            $trx->cabang ? $trx->cabang->nama_cabang : '-',
            $trx->metodePembayaran ? $trx->metodePembayaran->nama_metode : '-',
            $trx->nomor_referensi ?? '-',
            $trx->subtotal,
            $trx->total_diskon,
            $trx->total_pajak,
            $trx->total,
            $trx->jumlah_dibayar,
            $trx->kembalian,
        ];
    }
}

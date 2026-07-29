<?php

namespace App\Exports;

use App\Services\ExportService;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

// Export Laporan Keuangan ke XLSX
class LaporanExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    protected array $params;
    protected ExportService $exportService;

    public function __construct(array $params)
    {
        $this->params        = $params;
        $this->exportService = new ExportService();
    }

    public function title(): string
    {
        return 'Laporan Keuangan POS';
    }

    public function collection()
    {
        $data = $this->exportService->getLaporanData($this->params);
        return $data['transaksis'];
    }

    public function headings(): array
    {
        return [
            'ID Transaksi',
            'Tanggal',
            'Jam',
            'Kasir',
            'Cabang',
            'Sales Mode',
            'Metode Bayar',
            'No. Referensi (RRN)',
            'Nama Pelanggan',
            'Subtotal (Rp)',
            'Diskon Promo (Rp)',
            'Pajak (Rp)',
            'Total (Rp)',
            'Status',
            'Alasan Batal / Void',
            'Diperbarui Oleh',
        ];
    }

    public function map($transaksi): array
    {
        return [
            $transaksi->id_transaksi,
            $transaksi->tanggal_transaksi,
            $transaksi->jam_transaksi,
            $transaksi->kasir?->nama_user ?? '-',
            $transaksi->cabang?->nama_cabang ?? '-',
            $transaksi->salesMode?->nama_sales ?? '-',
            $transaksi->metodePembayaran?->nama_metode ?? '-',
            $transaksi->nomor_referensi ?? '-',
            $transaksi->nama_pelanggan ?? '-',
            $transaksi->details->sum(fn($d) => (float) $d->harga_produk * $d->quantity),
            ((float) $transaksi->nominal_promo) + $transaksi->details->sum(fn($d) => (float) $d->nominal_promo),
            (float) $transaksi->tax,
            (float) $transaksi->total,
            $transaksi->status,
            $transaksi->alasan_batal ?? '-',
            $transaksi->updatedBy?->nama_user ?? '-',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FFE2E8F0'],
                ],
            ],
        ];
    }
}

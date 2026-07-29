<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Keuangan POS Event</title>
    <style>
        /* Print-clean style untuk DomPDF dan browser print */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #000; background: #fff; }

        .page-header { border-bottom: 4px solid #000; padding: 12px 0; margin-bottom: 16px; }
        .page-header h1 { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
        .page-header p { font-size: 9px; color: #555; margin-top: 2px; }

        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .kpi-box { border: 3px solid #000; padding: 10px; }
        .kpi-box.dark { background: #000; color: #fff; }
        .kpi-label { font-size: 8px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #888; }
        .kpi-box.dark .kpi-label { color: #aaa; }
        .kpi-value { font-size: 16px; font-weight: 900; margin-top: 4px; }
        .kpi-box.dark .kpi-value { color: #facc15; }
        .kpi-note { font-size: 7px; color: #888; margin-top: 2px; }
        .kpi-box.dark .kpi-note { color: #aaa; }

        .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; border-bottom: 3px solid #000; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 1px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9px; }
        th { background: #000; color: #fff; font-weight: 700; text-transform: uppercase; padding: 6px 8px; border: 2px solid #000; text-align: left; font-size: 8px; letter-spacing: 0.5px; }
        td { border: 1px solid #ccc; padding: 5px 8px; vertical-align: top; }
        tr:nth-child(even) td { background: #f9f9f9; }
        tr.void-row td { background: #fff0f0; text-decoration: line-through; color: #999; }
        tr.cancelled-row td { background: #f5f5f5; color: #aaa; }

        tfoot td { background: #000 !important; color: #fff; font-weight: 900; border: 2px solid #000; }
        tfoot .amount { color: #facc15; }

        .badge { display: inline-block; border: 2px solid #000; padding: 1px 4px; font-size: 7px; font-weight: 900; }
        .badge-success { background: #86efac; }
        .badge-void { border: 2px dashed #dc2626; color: #dc2626; background: #fee2e2; }
        .badge-cancelled { background: #e5e7eb; color: #666; }
        .badge-draft { background: #fef08a; }

        .footer { margin-top: 24px; border-top: 3px solid #000; padding-top: 8px; font-size: 8px; color: #555; display: flex; justify-content: space-between; }

        .audit-note { border: 2px dashed #dc2626; padding: 8px; margin-top: 12px; background: #fff5f5; }
        .audit-note h4 { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #dc2626; margin-bottom: 4px; }

        @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .kpi-box.dark { background: #000 !important; color: #fff !important; }
            tfoot td { background: #000 !important; }
        }
        @page { size: A4 landscape; margin: 1cm; }
    </style>
</head>
<body>

    {{-- TOMBOL PRINT (browser) - tersembunyi saat print --}}
    <div class="no-print" style="padding: 12px; background: #000; text-align: right; margin-bottom: 16px;">
        <button onclick="window.print()"
            style="background:#fff; color:#000; border:3px solid #fff; padding:8px 16px; font-weight:900; font-size:11px; cursor:pointer; text-transform:uppercase; font-family: monospace;">
            CETAK / SIMPAN PDF [🖨]
        </button>
        <button onclick="window.history.back()"
            style="background:transparent; color:#fff; border:3px solid #fff; padding:8px 16px; font-weight:900; font-size:11px; cursor:pointer; text-transform:uppercase; font-family: monospace; margin-left: 8px;">
            ← KEMBALI
        </button>
    </div>

    {{-- HEADER --}}
    <div class="page-header">
        <h1>LAPORAN KEUANGAN — POS EVENT SYSTEM</h1>
        <p>
            Jenis: {{ strtoupper(str_replace('_', ' ', $params['jenis_laporan'] ?? 'RINGKASAN')) }}
            &nbsp;|&nbsp;
            Periode: {{ $params['tanggal_mulai'] ?? '-' }} s.d. {{ $params['tanggal_akhir'] ?? '-' }}
            @if(!empty($params['id_cabang']))
                &nbsp;|&nbsp; Cabang: {{ $cabangs->firstWhere('id_cabang', $params['id_cabang'])?->nama_cabang ?? '-' }}
            @endif
            @if(!empty($params['id_kategori']))
                &nbsp;|&nbsp; Kategori: {{ $kategoris->firstWhere('id_kategori', $params['id_kategori'])?->nama_kategori ?? '-' }}
            @endif
            @if(!empty($params['id_metode']))
                &nbsp;|&nbsp; Metode: {{ $metodes->firstWhere('id_metode', $params['id_metode'])?->nama_metode ?? '-' }}
            @endif
        </p>
        <p>Dicetak: {{ now()->format('d/m/Y H:i:s') }} WIB</p>
    </div>

    {{-- KPI WIDGETS --}}
    <div class="kpi-grid">
        <div class="kpi-box dark">
            <div class="kpi-label">Pendapatan Bersih [SUCCESS]</div>
            <div class="kpi-value">Rp {{ number_format($kpi['pendapatan_bersih'], 0, ',', '.') }}</div>
            <div class="kpi-note">{{ $kpi['jumlah_transaksi'] }} transaksi sukses</div>
        </div>
        <div class="kpi-box">
            <div class="kpi-label">Volume Penjualan</div>
            <div class="kpi-value">{{ number_format($kpi['volume_penjualan'], 0, ',', '.') }} item</div>
            <div class="kpi-note">Item terjual (status Active)</div>
        </div>
        <div class="kpi-box" style="border: 2px dashed #dc2626;">
            <div class="kpi-label" style="color: #dc2626;">Catatan Audit</div>
            <div class="kpi-value" style="color: #dc2626; font-size: 13px;">
                {{ $kpi['jumlah_void'] }} [VOID] &nbsp;|&nbsp; {{ $kpi['jumlah_cancelled'] }} [CANCELLED]
            </div>
            <div class="kpi-note" style="color: #dc2626;">
                Void: Rp {{ number_format($kpi['nilai_void'], 0, ',', '.') }} dikecualikan
            </div>
        </div>
    </div>

    {{-- BREAKDOWN METODE BAYAR --}}
    @if($kpi['breakdown_metode']->count() > 0)
    <div style="margin-bottom: 16px;">
        <div class="section-title">BREAKDOWN METODE PEMBAYARAN</div>
        <table>
            <thead>
                <tr>
                    <th>Metode Pembayaran</th>
                    <th>Jumlah Transaksi</th>
                    <th style="text-align: right;">Total Nominal (Rp)</th>
                    <th style="text-align: right;">% Kontribusi</th>
                </tr>
            </thead>
            <tbody>
                @foreach($kpi['breakdown_metode'] as $item)
                    <tr>
                        <td style="font-weight: 700;">{{ $item['nama_metode'] }}</td>
                        <td>{{ $item['jumlah_transaksi'] }}</td>
                        <td style="text-align: right; font-family: monospace; font-weight: 700;">
                            {{ number_format($item['total_nominal'], 0, ',', '.') }}
                        </td>
                        <td style="text-align: right;">
                            @if($kpi['pendapatan_bersih'] > 0)
                                {{ number_format(($item['total_nominal'] / $kpi['pendapatan_bersih']) * 100, 1) }}%
                            @else
                                —
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- DETAIL TRANSAKSI --}}
    <div class="section-title">DETAIL TRANSAKSI</div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Tanggal / Jam</th>
                <th>Kasir</th>
                <th>Cabang</th>
                <th>Metode</th>
                <th>No. Referensi</th>
                <th style="text-align: right;">Diskon (Rp)</th>
                <th style="text-align: right;">Pajak (Rp)</th>
                <th style="text-align: right;">Total (Rp)</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @php $no = 1; @endphp
            @forelse($transaksis as $trx)
                @php
                    $rowClass = match($trx->status) {
                        'Void'      => 'void-row',
                        'Cancelled' => 'cancelled-row',
                        default     => '',
                    };
                @endphp
                <tr class="{{ $rowClass }}">
                    <td>{{ $no++ }}</td>
                    <td style="font-family: monospace;">
                        {{ $trx->tanggal_transaksi }}<br>
                        <span style="color: #888;">{{ substr($trx->jam_transaksi, 0, 5) }}</span>
                    </td>
                    <td>{{ $trx->kasir?->nama_user ?? '-' }}</td>
                    <td>{{ $trx->cabang?->nama_cabang ?? '-' }}</td>
                    <td>{{ $trx->metodePembayaran?->nama_metode ?? '-' }}</td>
                    <td style="font-family: monospace; font-size: 8px;">{{ $trx->nomor_referensi ?? '—' }}</td>
                    <td style="text-align: right; font-family: monospace;">
                        @if((float)$trx->nominal_promo > 0)
                            - {{ number_format((float)$trx->nominal_promo, 0, ',', '.') }}
                        @else
                            —
                        @endif
                    </td>
                    <td style="text-align: right; font-family: monospace;">{{ number_format((float)$trx->tax, 0, ',', '.') }}</td>
                    <td style="text-align: right; font-family: monospace; font-weight: 700;">
                        {{ number_format((float)$trx->total, 0, ',', '.') }}
                    </td>
                    <td>
                        @php
                            $bc = match($trx->status) {
                                'Success'   => 'badge-success',
                                'Void'      => 'badge-void',
                                'Cancelled' => 'badge-cancelled',
                                default     => 'badge-draft',
                            };
                        @endphp
                        <span class="badge {{ $bc }}">[{{ strtoupper($trx->status) }}]</span>
                        @if(in_array($trx->status, ['Void', 'Cancelled']) && $trx->alasan_batal)
                            <br><span style="font-size: 7px; color: #dc2626;">{{ $trx->alasan_batal }}</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="10" style="text-align: center; color: #aaa; font-style: italic;">
                        Tidak ada data transaksi dalam parameter yang dipilih.
                    </td>
                </tr>
            @endforelse
        </tbody>
        @if($transaksis->count() > 0)
        <tfoot>
            <tr>
                <td colspan="8" style="font-weight: 900; text-transform: uppercase;">
                    Total Pendapatan Bersih [SUCCESS Only]
                </td>
                <td class="amount" style="text-align: right; font-family: monospace; font-weight: 900;">
                    {{ number_format($kpi['pendapatan_bersih'], 0, ',', '.') }}
                </td>
                <td style="font-weight: 700;">{{ $kpi['jumlah_transaksi'] }} trx</td>
            </tr>
        </tfoot>
        @endif
    </table>

    {{-- AUDIT NOTE --}}
    @if($kpi['jumlah_void'] > 0 || $kpi['jumlah_cancelled'] > 0)
    <div class="audit-note">
        <h4>⚠ CATATAN AUDIT: Transaksi Dikecualikan dari Pendapatan</h4>
        <p>
            {{ $kpi['jumlah_void'] }} transaksi [VOID] senilai Rp {{ number_format($kpi['nilai_void'], 0, ',', '.') }}
            dan {{ $kpi['jumlah_cancelled'] }} transaksi [CANCELLED] tidak termasuk dalam pendapatan bersih.
            Data ini tercatat untuk keperluan audit dan rekonsiliasi.
        </p>
    </div>
    @endif

    {{-- FOOTER --}}
    <div class="footer">
        <span>POS Event System — Laporan Keuangan</span>
        <span>Dicetak oleh sistem pada {{ now()->format('d/m/Y H:i:s') }} WIB</span>
    </div>

</body>
</html>

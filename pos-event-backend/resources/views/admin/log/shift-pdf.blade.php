<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Shift Log - POS Event</title>
    <style>{!! file_get_contents(public_path('css/pdf.css')) !!}</style>
</head>
<body>

    <div class="header">
        <h1>LAPORAN SHIFT LOG - POS EVENT</h1>
        <p>Tanggal Cetak: {{ now()->format('d/m/Y H:i:s') }}</p>
        @if(!empty($params))
            <p>
                Filter Aktif: 
                @foreach($params as $key => $val)
                    @if($val) <strong>{{ ucfirst(str_replace('_', ' ', $key)) }}:</strong> {{ $val }} | @endif
                @endforeach
            </p>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 15%">WAKTU SHIFT</th>
                <th style="width: 10%">STATUS</th>
                <th style="width: 15%">KASIR</th>
                <th style="width: 15%">CABANG</th>
                <th style="width: 25%">REKAP KAS</th>
                <th style="width: 20%" class="text-right">PENDAPATAN SISTEM</th>
            </tr>
        </thead>
        <tbody>
            @forelse($shifts as $shift)
                @php
                    $isAutoClosed = $shift->operatorLogs->contains(fn($l) => str_contains($l->catatan ?? '', 'auto_closed'));
                    $totalTrx = $shift->transaksis->count();
                    $totalPendapatan = $shift->transaksis->where('status', 'Success')->sum(fn($t) => (float) $t->total);
                    $selisih = (float) $shift->selisih_uang;
                @endphp
                <tr>
                    <td>
                        {{ $shift->waktu_mulai?->format('d/m/Y') }}<br>
                        <span class="mono">{{ $shift->waktu_mulai?->format('H:i') }} - {{ $shift->waktu_selesai?->format('H:i') ?? '...' }}</span>
                    </td>
                    <td>
                        <span class="badge mono">{{ $shift->status_shift }}</span>
                        @if($isAutoClosed)
                            <br><span style="color: red; font-size: 8px; font-weight: bold;">⚠ AUTO_CLOSED</span>
                        @endif
                    </td>
                    <td>
                        <strong>{{ $shift->user?->nama_user ?? '—' }}</strong><br>
                        <span class="mono">{{ $shift->user?->username ?? '-' }}</span>
                    </td>
                    <td>{{ $shift->cabang?->nama_cabang ?? '-' }}</td>
                    <td>
                        Modal: Rp {{ number_format((float)$shift->modal_awal, 0, ',', '.') }}<br>
                        Fisik: {{ $shift->uang_fisik_akhir ? 'Rp ' . number_format((float)$shift->uang_fisik_akhir, 0, ',', '.') : '—' }}<br>
                        Selisih: <span style="font-weight: bold; color: {{ $selisih != 0 ? 'red' : 'green' }}">
                            {{ $selisih >= 0 ? '+' : '' }}Rp {{ number_format($selisih, 0, ',', '.') }}
                        </span>
                    </td>
                    <td class="text-right">
                        <strong>Rp {{ number_format($totalPendapatan, 0, ',', '.') }}</strong><br>
                        <span style="color: #666; font-size: 9px;">{{ $totalTrx }} transaksi</span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center">Tidak ada shift log yang tercatat.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Dicetak oleh sistem POS Event.
    </div>

</body>
</html>

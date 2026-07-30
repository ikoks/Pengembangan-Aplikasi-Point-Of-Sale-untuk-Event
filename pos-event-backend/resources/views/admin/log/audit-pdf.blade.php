<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Audit Log - POS Event</title>
    <style>{!! file_get_contents(public_path('css/pdf.css')) !!}</style>
</head>
<body>

    <div class="header">
        <h1>LAPORAN AUDIT LOG - POS EVENT</h1>
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
                <th style="width: 12%">TIMESTAMP</th>
                <th style="width: 15%">AKTIVITAS</th>
                <th style="width: 20%">ACTOR</th>
                <th style="width: 13%">IP ADDRESS</th>
                <th style="width: 40%">DETAIL TARGET</th>
            </tr>
        </thead>
        <tbody>
            @forelse($logs as $log)
                <tr>
                    <td>
                        {{ $log->waktu_kejadian?->format('d/m/Y') }}<br>
                        <span class="mono">{{ $log->waktu_kejadian?->format('H:i:s') }}</span>
                    </td>
                    <td><span class="badge mono">{{ $log->aktivitas }}</span></td>
                    <td>
                        @if($log->user)
                            <strong>{{ $log->user->nama_user }}</strong><br>
                            <span class="mono">{{ $log->user->username }}</span>
                        @else
                            <span class="mono">[SISTEM]</span>
                        @endif
                    </td>
                    <td class="mono">{{ $log->ip_address ?? '-' }}</td>
                    <td>
                        Tabel: <strong>{{ $log->tabel_target ?? '-' }}</strong><br>
                        ID: <span class="mono">{{ $log->id_target ?? '-' }}</span>
                        
                        @if($log->data_sebelum || $log->data_sesudah)
                            <div style="margin-top: 5px; font-size: 8px;">
                                <em>(Detail perubahan dapat dilihat di Export Excel / Sistem Utama)</em>
                            </div>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" class="text-center">Tidak ada log aktivitas yang tercatat.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Dicetak oleh sistem POS Event.
    </div>

</body>
</html>

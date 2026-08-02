<!DOCTYPE html>
<html lang="id">
<head>
 <meta charset="UTF-8">
 <title>Riwayat Transaksi - POS Event</title>
 <style>{!! file_get_contents(public_path('css/pdf.css')) !!}</style>
</head>
<body>

 <div class="header">
  <h1>Laporan Riwayat Transaksi - Pos Event</h1>
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
    <th style="width: 15%">Id Transaksi</th>
    <th style="width: 12%">Tanggal / Jam</th>
    <th style="width: 15%">Kasir</th>
    <th style="width: 12%">Cabang</th>
    <th style="width: 12%">Pembayaran</th>
    <th style="width: 18%">NO. REFERENSI (RRN)</th>
    <th style="width: 10%" class="text-right">Total</th>
    <th style="width: 6%" class="text-center">Status</th>
   </tr>
  </thead>
  <tbody>
   @forelse($transaksis as $trx)
    <tr>
     <td>
      <span class="mono">{{ $trx->id_transaksi }}</span>
     </td>
     <td>
      {{ $trx->tanggal_transaksi?->format('d/m/Y') }}<br>
      <span class="mono">{{ $trx->jam_transaksi }}</span>
     </td>
     <td>{{ $trx->kasir?->nama_user ?? '—' }}</td>
     <td>{{ $trx->cabang?->nama_cabang ?? '-' }}</td>
     <td>{{ $trx->metodePembayaran?->nama_metode ?? '-' }}</td>
     <td><span class="mono">{{ $trx->nomor_referensi ?? '-' }}</span></td>
     <td class="text-right"><strong>Rp {{ number_format($trx->total, 0, ',', '.') }}</strong></td>
     <td class="text-center">
      <span class="badge">{{ strtoupper($trx->status) }}</span>
     </td>
    </tr>
   @empty
    <tr>
     <td colspan="8" class="text-center">Tidak ada transaksi yang tercatat.</td>
    </tr>
   @endforelse
  </tbody>
 </table>

 <div class="footer">
  Dicetak oleh sistem POS Event.
 </div>

</body>
</html>

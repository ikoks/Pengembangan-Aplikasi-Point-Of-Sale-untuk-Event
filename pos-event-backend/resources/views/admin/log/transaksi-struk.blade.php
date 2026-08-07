<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk Transaksi - {{ $transaksi->id_transaksi }}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            background-color: #f3f4f6;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
        }
        .receipt-container {
            background: #fff;
            width: 300px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-mono { font-family: monospace; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .border-dashed { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 4px 0; vertical-align: top; }
        .flex { display: flex; justify-content: space-between; }
        .print-btn-container {
            text-align: center;
            margin-top: 20px;
        }
        @media print {
            body { background: #fff; padding: 0; }
            .receipt-container { box-shadow: none; width: 100%; max-width: 300px; margin: 0 auto; }
            .print-btn-container { display: none; }
        }
    </style>
</head>
<body>
    <div>
        <div class="receipt-container">
            <div class="text-center mb-4">
                <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">{{ config('app.name', 'POS EVENT') }}</h2>
                <div class="font-bold">{{ $transaksi->cabang->nama_cabang ?? 'Cabang Pusat' }}</div>
                @if($transaksi->cabang && $transaksi->cabang->alamat_cabang)
                    <div style="font-size: 10px; margin-top: 4px;">{{ $transaksi->cabang->alamat_cabang }}</div>
                @endif
            </div>

            <div class="border-dashed"></div>

            <div class="mb-2">
                <div class="flex"><span>TGL</span> <span>{{ $transaksi->tanggal_transaksi }} {{ substr($transaksi->jam_transaksi, 0, 5) }}</span></div>
                <div class="flex"><span>KSR</span> <span>{{ $transaksi->kasir->nama_user ?? '-' }}</span></div>
                <div class="flex"><span>NO </span> <span>{{ substr($transaksi->id_transaksi, 0, 8) }}</span></div>
                @if($transaksi->status === 'Void')
                    <div class="font-bold text-center mt-2" style="color:red; border: 1px solid red; padding: 2px;">*** VOID ***</div>
                @endif
                @if($transaksi->status === 'Cancelled')
                    <div class="font-bold text-center mt-2" style="border: 1px solid black; padding: 2px;">*** CANCELLED ***</div>
                @endif
            </div>

            <div class="border-dashed"></div>

            <table class="mb-2">
                @php 
                    $subtotal = 0; 
                    $totalPromoItem = 0;
                @endphp
                @foreach($transaksi->details as $item)
                    @php
                        $harga = $item->harga_produk;
                        $qty = $item->quantity;
                        $promo = $item->nominal_promo;
                        $sub = $item->subtotal_item;
                        $subtotal += ($harga * $qty);
                        $totalPromoItem += $promo;
                        $isVoid = $item->status_item === 'Void';
                    @endphp
                    <tr>
                        <td colspan="3" class="font-bold" style="{{ $isVoid ? 'text-decoration: line-through;' : '' }}">
                            {{ $item->menu->nama_menu ?? 'Produk' }}
                            @if($isVoid)
                                <span style="font-size: 10px;">(VOID)</span>
                            @endif
                        </td>
                    </tr>
                    <tr style="{{ $isVoid ? 'text-decoration: line-through;' : '' }}">
                        <td>{{ $qty }} x {{ number_format($harga, 0, ',', '.') }}</td>
                        <td class="text-right">
                            @if($promo > 0)
                                <div style="font-size: 10px;">Disc: -{{ number_format($promo, 0, ',', '.') }}</div>
                            @endif
                        </td>
                        <td class="text-right">{{ number_format($sub, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </table>

            <div class="border-dashed"></div>

            @php
                $totalPromo = $totalPromoItem + $transaksi->nominal_promo;
                $tax = $transaksi->tax;
            @endphp

            <div class="flex">
                <span>SUBTOTAL</span>
                <span>{{ number_format($subtotal, 0, ',', '.') }}</span>
            </div>
            @if($totalPromo > 0)
            <div class="flex">
                <span>DISKON</span>
                <span>-{{ number_format($totalPromo, 0, ',', '.') }}</span>
            </div>
            @endif
            @if($tax > 0)
            <div class="flex">
                <span>PAJAK ({{ $transaksi->cabang->pajak_persen ?? 0 }}%)</span>
                <span>{{ number_format($tax, 0, ',', '.') }}</span>
            </div>
            @endif
            
            <div class="border-dashed"></div>
            
            <div class="flex font-bold" style="font-size: 16px;">
                <span>TOTAL</span>
                <span>{{ number_format($transaksi->total, 0, ',', '.') }}</span>
            </div>
            
            <div class="flex mt-2 text-right justify-between" style="font-size: 10px;">
                <span>PEMBAYARAN</span>
                <span class="font-bold">{{ strtoupper($transaksi->metodePembayaran->nama_metode ?? 'TUNAI') }}</span>
            </div>
            @if($transaksi->nomor_referensi)
            <div class="flex text-right justify-between" style="font-size: 10px;">
                <span>REF</span>
                <span>{{ $transaksi->nomor_referensi }}</span>
            </div>
            @endif

            <div class="border-dashed"></div>
            
            <div class="text-center mt-4">
                <div>TERIMA KASIH</div>
                <div style="font-size: 10px; margin-top: 4px;">Selamat Belanja Kembali</div>
            </div>
        </div>

        <div class="print-btn-container">
            <div style="margin-top: 15px;">
                <a href="{{ route('admin.log.transaksi.index') }}" style="color: #666; text-decoration: none; font-weight: bold;">&larr; KEMBALI</a>
            </div>
        </div>
    </div>
</body>
</html>

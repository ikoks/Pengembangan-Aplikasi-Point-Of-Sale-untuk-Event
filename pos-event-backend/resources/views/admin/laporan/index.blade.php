@extends('layouts.admin')

@section('title', 'Laporan Keuangan')

@section('content')
{{-- POS-A-14: Laporan Keuangan dengan 8 Filter Parameter --}}

{{-- =====================================================================
     FORM PARAMETER LAPORAN — 8 Kombinasi Filter
     ===================================================================== --}}
@php $hasFilter = request()->except(['page']); @endphp
<div x-data="{ showFilter: {{ empty($hasFilter) ? 'false' : 'true' }} }">
    <button type="button" @click="showFilter = !showFilter" class="brutal-btn brutal-btn-secondary text-sm mb-4 brutal-shadow-sm flex items-center gap-2">
        <svg x-show="!showFilter" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        <svg x-show="showFilter" style="display:none;" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
        <span x-show="!showFilter">TAMPILKAN FILTER LAPORAN</span>
        <span x-show="showFilter" style="display:none;">SEMBUNYIKAN FILTER LAPORAN</span>
    </button>

<form method="GET" action="{{ route('admin.laporan.index') }}" id="formLaporan" x-show="showFilter" style="{{ empty($hasFilter) ? 'display: none;' : '' }}">
    <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
        <h3 class="font-extrabold text-lg uppercase mb-4 border-b-4 border-black pb-2 tracking-tight">
            [PARAMETER] FILTER LAPORAN KEUANGAN
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

            {{-- Jenis Laporan --}}
            <div class="lg:col-span-1">
                <label class="block text-xs font-extrabold uppercase mb-1">Jenis Laporan <span class="text-red-600">*</span></label>
                <select name="jenis_laporan" class="brutal-input bg-white" required>
                    <option value="ringkasan" {{ ($params['jenis_laporan'] ?? '') === 'ringkasan' ? 'selected' : '' }}>
                        Ringkasan Pendapatan
                    </option>
                    <option value="detail_transaksi" {{ ($params['jenis_laporan'] ?? '') === 'detail_transaksi' ? 'selected' : '' }}>
                        Detail Transaksi Lengkap
                    </option>
                    <option value="per_kategori" {{ ($params['jenis_laporan'] ?? '') === 'per_kategori' ? 'selected' : '' }}>
                        Penjualan Per Kategori
                    </option>
                    <option value="per_metode" {{ ($params['jenis_laporan'] ?? '') === 'per_metode' ? 'selected' : '' }}>
                        Rekap Per Metode Bayar
                    </option>
                </select>
            </div>

            {{-- Rentang Tanggal --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Mulai <span class="text-red-600">*</span></label>
                <input type="date" name="tanggal_mulai" value="{{ $params['tanggal_mulai'] ?? '' }}"
                    class="brutal-input" required>
            </div>
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Akhir <span class="text-red-600">*</span></label>
                <input type="date" name="tanggal_akhir" value="{{ $params['tanggal_akhir'] ?? '' }}"
                    class="brutal-input" required>
            </div>

            {{-- Filter Cabang (Opsional) --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">
                    Cabang
                    <span class="text-gray-400 font-normal normal-case text-xs">(opsional)</span>
                </label>
                <select name="id_cabang" class="brutal-input bg-white">
                    <option value="">-- Semua Cabang --</option>
                    @foreach($cabangs as $cabang)
                        <option value="{{ $cabang->id_cabang }}"
                            {{ ($params['id_cabang'] ?? '') == $cabang->id_cabang ? 'selected' : '' }}>
                            {{ $cabang->nama_cabang }}
                        </option>
                    @endforeach
                </select>
            </div>

            {{-- Filter Kategori (Opsional) --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">
                    Kategori Produk
                    <span class="text-gray-400 font-normal normal-case text-xs">(opsional)</span>
                </label>
                <select name="id_kategori" class="brutal-input bg-white">
                    <option value="">-- Semua Kategori --</option>
                    @foreach($kategoris as $kategori)
                        <option value="{{ $kategori->id_kategori }}"
                            {{ ($params['id_kategori'] ?? '') == $kategori->id_kategori ? 'selected' : '' }}>
                            {{ $kategori->nama_kategori }}
                        </option>
                    @endforeach
                </select>
            </div>

            {{-- Filter Metode Bayar (Opsional) --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">
                    Metode Pembayaran
                    <span class="text-gray-400 font-normal normal-case text-xs">(opsional)</span>
                </label>
                <select name="id_metode" class="brutal-input bg-white">
                    <option value="">-- Semua Metode --</option>
                    @foreach($metodes as $metode)
                        <option value="{{ $metode->id_metode }}"
                            {{ ($params['id_metode'] ?? '') == $metode->id_metode ? 'selected' : '' }}>
                            {{ $metode->nama_metode }}
                        </option>
                    @endforeach
                </select>
            </div>
        </div>

        <div class="flex flex-wrap gap-3">
            <button type="submit" name="generate" value="1"
                class="brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                TAMPILKAN LAPORAN
            </button>

            @if($transaksis !== null)
                {{-- Ekspor PDF --}}
                <a href="{{ route('admin.laporan.export-pdf', request()->query()) }}"
                    class="brutal-btn brutal-btn-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    EKSPOR PDF
                </a>

                {{-- Ekspor Excel --}}
                <a href="{{ route('admin.laporan.export-excel', request()->query()) }}"
                    class="brutal-btn brutal-btn-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    EKSPOR EXCEL
                </a>
            @endif

            <a href="{{ route('admin.laporan.index') }}"
                class="brutal-btn brutal-btn-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                ATUR ULANG
            </a>
        </div>
    </div>
</form>
</div>

<div id="data-container">
@if($kpi !== null && $transaksis !== null)

{{-- =====================================================================
     WIDGET KPI
     ===================================================================== --}}
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

    {{-- KPI 1: Pendapatan Bersih --}}
    <div class="bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] p-6">
        <p class="text-xs font-extrabold uppercase text-gray-400 mb-1 tracking-widest">PENDAPATAN BERSIH</p>
        <p class="font-mono font-extrabold text-3xl text-yellow-300">
            Rp {{ number_format($kpi['pendapatan_bersih'], 0, ',', '.') }}
        </p>
        <p class="text-xs text-gray-400 mt-2">
            Hanya transaksi <span class="text-green-400 font-bold">[SUCCESS]</span> &nbsp;·&nbsp;
            {{ $kpi['jumlah_transaksi'] }} transaksi
        </p>
        @if($kpi['jumlah_void'] > 0 || $kpi['jumlah_cancelled'] > 0)
            <p class="text-xs text-red-400 mt-1">
                ⚠ {{ $kpi['jumlah_void'] }} void, {{ $kpi['jumlah_cancelled'] }} cancelled dikecualikan
            </p>
        @endif
    </div>

    {{-- KPI 2: Volume Penjualan --}}
    <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <p class="text-xs font-extrabold uppercase text-gray-500 mb-1 tracking-widest">VOLUME PENJUALAN</p>
        <p class="font-mono font-extrabold text-3xl text-black">
            {{ number_format($kpi['volume_penjualan'], 0, ',', '.') }}
            <span class="text-base font-bold text-gray-500">item</span>
        </p>
        <p class="text-xs text-gray-500 mt-2">
            Total item terjual (status Active)
        </p>
    </div>

    {{-- KPI 3: Catatan Audit --}}
    <div class="bg-white border-4 border-dashed border-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,0.5)] p-6">
        <p class="text-xs font-extrabold uppercase text-red-600 mb-1 tracking-widest">CATATAN AUDIT</p>
        <div class="flex gap-6">
            <div>
                <p class="font-mono font-extrabold text-2xl text-red-700">{{ $kpi['jumlah_void'] }}</p>
                <p class="text-xs text-red-500 font-bold">[VOID]</p>
                <p class="font-mono text-sm text-red-600 mt-1">
                    Rp {{ number_format($kpi['nilai_void'], 0, ',', '.') }}
                </p>
            </div>
            <div class="border-l-2 border-dashed border-red-300 pl-6">
                <p class="font-mono font-extrabold text-2xl text-gray-600">{{ $kpi['jumlah_cancelled'] }}</p>
                <p class="text-xs text-gray-500 font-bold">[CANCELLED]</p>
            </div>
        </div>
    </div>
</div>

{{-- =====================================================================
     BREAKDOWN METODE PEMBAYARAN
     ===================================================================== --}}
@if($kpi['breakdown_metode']->count() > 0)
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
    <h3 class="font-extrabold uppercase mb-4 border-b-4 border-black pb-2 tracking-tight">
        [BREAKDOWN] METODE PEMBAYARAN
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-{{ min($kpi['breakdown_metode']->count(), 4) }} gap-4">
        @foreach($kpi['breakdown_metode'] as $metodeKPI)
            <div class="border-4 border-black p-4 bg-gray-50">
                <p class="font-extrabold uppercase text-sm">{{ $metodeKPI['nama_metode'] }}</p>
                <p class="font-mono font-extrabold text-xl mt-1">
                    Rp {{ number_format($metodeKPI['total_nominal'], 0, ',', '.') }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                    {{ $metodeKPI['jumlah_transaksi'] }} transaksi
                </p>
            </div>
        @endforeach
    </div>
</div>
@endif

{{-- =====================================================================
     TABEL LAPORAN
     ===================================================================== --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl uppercase tracking-tight">DETAIL TRANSAKSI</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $transaksis->count() }}</span> transaksi
                (termasuk void & cancelled sebagai catatan audit)
            </p>
        </div>
    </div>

    <div class="overflow-x-auto">
        <table class="w-full border-collapse">
            <thead>
                <tr>
                    <th class="brutal-table-th text-xs">TANGGAL</th>
                    <th class="brutal-table-th text-xs">KASIR</th>
                    <th class="brutal-table-th text-xs">CABANG</th>
                    <th class="brutal-table-th text-xs">METODE BAYAR</th>
                    <th class="brutal-table-th text-xs">NO. REFERENSI</th>
                    <th class="brutal-table-th text-xs text-right">DISKON (Rp)</th>
                    <th class="brutal-table-th text-xs text-right">PAJAK (Rp)</th>
                    <th class="brutal-table-th text-xs text-right">TOTAL (Rp)</th>
                    <th class="brutal-table-th text-xs">STATUS</th>
                </tr>
            </thead>
            <tbody>
                @forelse($transaksis as $trx)
                    @php
                        $isAuditOnly = in_array($trx->status, ['Void', 'Cancelled']);
                        $rowClass = $isAuditOnly ? 'opacity-60 bg-red-50' : 'hover:bg-yellow-50';
                    @endphp
                    <tr class="{{ $rowClass }} transition-colors">
                        <td class="brutal-table-td">
                            <span class="font-mono text-sm">{{ $trx->tanggal_transaksi }}</span>
                            <span class="block text-xs text-gray-400 font-mono">{{ substr($trx->jam_transaksi, 0, 5) }}</span>
                        </td>
                        <td class="brutal-table-td text-sm">{{ $trx->kasir?->nama_user ?? '-' }}</td>
                        <td class="brutal-table-td text-sm">{{ $trx->cabang?->nama_cabang ?? '-' }}</td>
                        <td class="brutal-table-td text-sm font-bold">{{ $trx->metodePembayaran?->nama_metode ?? '-' }}</td>
                        <td class="brutal-table-td">
                            @if($trx->nomor_referensi)
                                <span class="font-mono text-xs bg-gray-100 border border-black px-2 py-0.5">
                                    {{ $trx->nomor_referensi }}
                                </span>
                            @else
                                <span class="text-gray-400 text-xs">— TUNAI —</span>
                            @endif
                        </td>
                        <td class="brutal-table-td text-right">
                            <span class="font-mono text-sm text-red-600">
                                @if((float)$trx->nominal_promo > 0)
                                    - {{ number_format((float)$trx->nominal_promo, 0, ',', '.') }}
                                @else
                                    —
                                @endif
                            </span>
                        </td>
                        <td class="brutal-table-td text-right">
                            <span class="font-mono text-sm">{{ number_format((float)$trx->tax, 0, ',', '.') }}</span>
                        </td>
                        <td class="brutal-table-td text-right">
                            <span class="font-mono font-extrabold text-sm {{ $isAuditOnly ? 'line-through text-gray-400' : '' }}">
                                {{ number_format((float)$trx->total, 0, ',', '.') }}
                            </span>
                        </td>
                        <td class="brutal-table-td">
                            @php
                                $bc = match($trx->status) {
                                    'Success'   => 'bg-green-400 border-black',
                                    'Void'      => 'bg-red-400 border-dashed border-red-700 text-white',
                                    'Cancelled' => 'bg-gray-300 border-gray-500',
                                    default     => 'bg-yellow-300 border-black',
                                };
                            @endphp
                            <span class="inline-block border-2 px-2 py-0.5 text-xs font-extrabold {{ $bc }}">
                                [{{ strtoupper($trx->status) }}]
                            </span>
                            @if($isAuditOnly && $trx->alasan_batal)
                                <p class="text-xs text-red-600 mt-1 font-mono">{{ $trx->alasan_batal }}</p>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="9" class="brutal-table-td text-center py-12">
                            <p class="font-extrabold text-xl text-gray-400">[TIDAK ADA DATA]</p>
                            <p class="text-sm text-gray-400 mt-1">Tidak ada transaksi dalam rentang tanggal yang dipilih.</p>
                        </td>
                    </tr>
                @endforelse
            </tbody>

            {{-- Baris Total --}}
            @if($transaksis->count() > 0)
            <tfoot>
                <tr class="bg-black text-white">
                    <td class="brutal-table-td bg-black text-white font-extrabold text-sm uppercase" colspan="7">
                        TOTAL PENDAPATAN BERSIH [SUCCESS]
                    </td>
                    <td class="brutal-table-td bg-black text-yellow-300 text-right font-mono font-extrabold text-sm">
                        Rp {{ number_format($kpi['pendapatan_bersih'], 0, ',', '.') }}
                    </td>
                    <td class="brutal-table-td bg-black text-white text-xs font-bold">
                        {{ $kpi['jumlah_transaksi'] }} trx
                    </td>
                </tr>
            </tfoot>
            @endif
        </table>
    </div>
</div>

@else
{{-- Placeholder jika belum ada data --}}
<div class="bg-white border-4 border-dashed border-gray-400 p-16 text-center">
    <p class="font-extrabold text-2xl text-gray-300 uppercase tracking-widest">[BELUM ADA LAPORAN]</p>
    <p class="text-gray-400 mt-2">Pilih parameter di atas lalu klik <strong>TAMPILKAN LAPORAN</strong></p>
</div>
@endif
</div>

@endsection

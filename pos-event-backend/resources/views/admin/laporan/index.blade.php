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
  <span x-show="!showFilter">Tampilkan Filter Laporan</span>
  <span x-show="showFilter" style="display:none;">Sembunyikan Filter Laporan</span>
 </button>

<form method="GET" action="{{ route('admin.laporan.index') }}" id="formLaporan" x-show="showFilter" style="{{ empty($hasFilter) ? 'display: none;' : '' }}">
 <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
  <h3 class="font-extrabold text-lg mb-4 border-b-4 border-black pb-2 tracking-tight">
    FILTER LAPORAN KEUANGAN
  </h3>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

   {{-- Jenis Laporan --}}
   <div class="lg:col-span-1">
    <label class="block text-xs font-extrabold mb-1">Jenis Laporan <span class="text-red-600">*</span></label>
    <select name="jenis_laporan" class="brutal-input bg-white" required>
     <option value="ringkasan" {{ ($params['jenis_laporan'] ?? '') === 'ringkasan' ? 'selected' : '' }}>Ringkasan Pendapatan</option>
     <option value="detail_transaksi" {{ ($params['jenis_laporan'] ?? '') === 'detail_transaksi' ? 'selected' : '' }}>Detail Transaksi Lengkap</option>
     <option value="per_kategori" {{ ($params['jenis_laporan'] ?? '') === 'per_kategori' ? 'selected' : '' }}>Penjualan Per Kategori</option>
     <option value="per_sub_kategori" {{ ($params['jenis_laporan'] ?? '') === 'per_sub_kategori' ? 'selected' : '' }}>Penjualan Per Sub-Kategori</option>
     <option value="per_produk" {{ ($params['jenis_laporan'] ?? '') === 'per_produk' ? 'selected' : '' }}>Penjualan Per Produk (Best Seller)</option>
     <option value="per_metode" {{ ($params['jenis_laporan'] ?? '') === 'per_metode' ? 'selected' : '' }}>Rekap Per Metode Bayar</option>
     <option value="per_cabang" {{ ($params['jenis_laporan'] ?? '') === 'per_cabang' ? 'selected' : '' }}>Penjualan Per Cabang / Event</option>
     <option value="per_sales_mode" {{ ($params['jenis_laporan'] ?? '') === 'per_sales_mode' ? 'selected' : '' }}>Penjualan Per Mode Penjualan</option>
     <option value="per_kasir" {{ ($params['jenis_laporan'] ?? '') === 'per_kasir' ? 'selected' : '' }}>Performa Kasir / Pegawai</option>
     <option value="per_jam_sibuk" {{ ($params['jenis_laporan'] ?? '') === 'per_jam_sibuk' ? 'selected' : '' }}>Analisis Jam Sibuk</option>
    </select>
   </div>

   {{-- Rentang Tanggal --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">Tanggal Mulai <span class="text-red-600">*</span></label>
    <input type="date" name="tanggal_mulai" value="{{ $params['tanggal_mulai'] ?? '' }}"
     class="brutal-input" required>
   </div>
   <div>
    <label class="block text-xs font-extrabold mb-1">Tanggal Akhir <span class="text-red-600">*</span></label>
    <input type="date" name="tanggal_akhir" value="{{ $params['tanggal_akhir'] ?? '' }}"
     class="brutal-input" required>
   </div>

   {{-- Filter Cabang (Opsional) --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">
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
    <label class="block text-xs font-extrabold mb-1">
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
    <label class="block text-xs font-extrabold mb-1">
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
    Tampilkan Laporan
   </button>

   @if($transaksis !== null)
    {{-- Ekspor PDF --}}
    <a href="{{ route('admin.laporan.export-pdf', request()->query()) }}"
     class="brutal-btn brutal-btn-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
     Ekspor Pdf
    </a>

    {{-- Ekspor Excel --}}
    <a href="{{ route('admin.laporan.export-excel', request()->query()) }}"
     class="brutal-btn brutal-btn-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
     Ekspor Excel
    </a>
   @endif

   <a href="{{ route('admin.laporan.index') }}"
    class="brutal-btn brutal-btn-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    Atur Ulang
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
  <p class="text-xs font-extrabold text-gray-400 mb-1 tracking-widest">Pendapatan Bersih</p>
  <p class="font-mono font-extrabold text-3xl text-yellow-300">
   Rp {{ number_format($kpi['pendapatan_bersih'], 0, ',', '.') }}
  </p>
 </div>

 {{-- KPI 2: Volume Penjualan --}}
 <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
  <p class="text-xs font-extrabold text-gray-500 mb-1 tracking-widest">Volume Penjualan</p>
  <p class="font-mono font-extrabold text-3xl text-black">
   {{ number_format($kpi['volume_penjualan'], 0, ',', '.') }}
   <span class="text-base font-bold text-gray-500">item</span>
  </p>
 </div>

 {{-- KPI 3: Catatan Audit --}}
 <div class="bg-white border-4 border-dashed border-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,0.5)] p-6">
  <p class="text-xs font-extrabold text-red-600 mb-1 tracking-widest">Catatan Audit</p>
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
@if(in_array($params['jenis_laporan'] ?? 'ringkasan', ['ringkasan', 'detail_transaksi', 'per_metode']) && $kpi['breakdown_metode']->count() > 0)
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
 <h3 class="font-extrabold mb-4 border-b-4 border-black pb-2 tracking-tight">
  METODE PEMBAYARAN
 </h3>
 <div class="grid grid-cols-1 md:grid-cols-{{ min($kpi['breakdown_metode']->count(), 4) }} gap-4">
  @foreach($kpi['breakdown_metode'] as $metodeKPI)
   <div class="border-4 border-black p-4 bg-gray-50">
    <p class="font-extrabold text-sm">{{ $metodeKPI['nama_metode'] }}</p>
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
  TABEL LAPORAN - PENJUALAN PER KATEGORI
  ===================================================================== --}}
@if(($params['jenis_laporan'] ?? '') === 'per_kategori')
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
 <div class="p-5 border-b-4 border-black">
  <h3 class="font-extrabold text-xl tracking-tight">Rekapitulasi Penjualan Per Kategori</h3>
 </div>
 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Nama Kategori</th>
     <th class="brutal-table-th text-xs text-right">Volume (Item)</th>
     <th class="brutal-table-th text-xs text-right">Total Penjualan (Rp)</th>
    </tr>
   </thead>
   <tbody>
    @forelse($kpi['breakdown_kategori'] as $kat)
     <tr class="hover:bg-yellow-50 transition-colors">
      <td class="brutal-table-td text-sm font-bold">{{ $kat['nama_kategori'] }}</td>
      <td class="brutal-table-td text-right font-mono">{{ number_format($kat['qty'], 0, ',', '.') }}</td>
      <td class="brutal-table-td text-right font-mono font-extrabold">{{ number_format($kat['total'], 0, ',', '.') }}</td>
     </tr>
    @empty
     <tr>
      <td colspan="3" class="brutal-table-td text-center py-12 text-gray-400 font-bold">
       Tidak ada data penjualan kategori
      </td>
     </tr>
    @endforelse
   </tbody>
  </table>
 </div>
</div>
@endif

{{-- =====================================================================
  TABEL LAPORAN - PENJUALAN PER SUB-KATEGORI
  ===================================================================== --}}
@if(($params['jenis_laporan'] ?? '') === 'per_sub_kategori')
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
 <div class="p-5 border-b-4 border-black">
  <h3 class="font-extrabold text-xl tracking-tight">Rekapitulasi Penjualan Per Sub-Kategori</h3>
 </div>
 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Sub-Kategori</th>
     <th class="brutal-table-th text-xs">Kategori Induk</th>
     <th class="brutal-table-th text-xs text-right">Volume (Item)</th>
     <th class="brutal-table-th text-xs text-right">Total Penjualan (Rp)</th>
    </tr>
   </thead>
   <tbody>
    @forelse($kpi['breakdown_sub_kategori'] as $subkat)
     <tr class="hover:bg-yellow-50 transition-colors">
      <td class="brutal-table-td text-sm font-bold">{{ $subkat['nama_sub_kategori'] }}</td>
      <td class="brutal-table-td text-sm">{{ $subkat['nama_kategori'] }}</td>
      <td class="brutal-table-td text-right font-mono">{{ number_format($subkat['qty'], 0, ',', '.') }}</td>
      <td class="brutal-table-td text-right font-mono font-extrabold">{{ number_format($subkat['total'], 0, ',', '.') }}</td>
     </tr>
    @empty
     <tr><td colspan="4" class="brutal-table-td text-center py-12 text-gray-400 font-bold">Tidak ada data</td></tr>
    @endforelse
   </tbody>
  </table>
 </div>
</div>
@endif

{{-- =====================================================================
  TABEL LAPORAN - PENJUALAN PER PRODUK
  ===================================================================== --}}
@if(($params['jenis_laporan'] ?? '') === 'per_produk')
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
 <div class="p-5 border-b-4 border-black">
  <h3 class="font-extrabold text-xl tracking-tight">Produk Best Seller</h3>
 </div>
 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs text-center">Peringkat</th>
     <th class="brutal-table-th text-xs">Nama Produk</th>
     <th class="brutal-table-th text-xs">Sub-Kategori</th>
     <th class="brutal-table-th text-xs text-right">Terjual (Item)</th>
     <th class="brutal-table-th text-xs text-right">Omset (Rp)</th>
    </tr>
   </thead>
   <tbody>
    @php $rank = 1; @endphp
    @forelse($kpi['breakdown_produk'] as $prod)
     <tr class="hover:bg-yellow-50 transition-colors">
      <td class="brutal-table-td text-center font-extrabold">{{ $rank++ }}</td>
      <td class="brutal-table-td text-sm font-bold">{{ $prod['nama_produk'] }}</td>
      <td class="brutal-table-td text-sm text-gray-600">{{ $prod['nama_sub_kategori'] }}</td>
      <td class="brutal-table-td text-right font-mono text-blue-600 font-bold">{{ number_format($prod['qty'], 0, ',', '.') }}</td>
      <td class="brutal-table-td text-right font-mono font-extrabold">{{ number_format($prod['total'], 0, ',', '.') }}</td>
     </tr>
    @empty
     <tr><td colspan="5" class="brutal-table-td text-center py-12 text-gray-400 font-bold">Tidak ada data</td></tr>
    @endforelse
   </tbody>
  </table>
 </div>
</div>
@endif

{{-- =====================================================================
  TABEL LAPORAN - PER CABANG
  ===================================================================== --}}
@if(($params['jenis_laporan'] ?? '') === 'per_cabang')
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
 <div class="p-5 border-b-4 border-black">
  <h3 class="font-extrabold text-xl tracking-tight">Kinerja Cabang / Event</h3>
 </div>
 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Cabang / Lokasi Event</th>
     <th class="brutal-table-th text-xs text-right">Total Transaksi</th>
     <th class="brutal-table-th text-xs text-right">Total Pendapatan (Rp)</th>
    </tr>
   </thead>
   <tbody>
    @forelse($kpi['breakdown_cabang'] as $cb)
     <tr class="hover:bg-yellow-50 transition-colors">
      <td class="brutal-table-td text-sm font-bold">{{ $cb['nama_cabang'] }}</td>
      <td class="brutal-table-td text-right font-mono">{{ number_format($cb['qty'], 0, ',', '.') }} trx</td>
      <td class="brutal-table-td text-right font-mono font-extrabold">{{ number_format($cb['total'], 0, ',', '.') }}</td>
     </tr>
    @empty
     <tr><td colspan="3" class="brutal-table-td text-center py-12 text-gray-400 font-bold">Tidak ada data</td></tr>
    @endforelse
   </tbody>
  </table>
 </div>
</div>
@endif

{{-- =====================================================================
  TABEL LAPORAN - PER SALES MODE
  ===================================================================== --}}
@if(($params['jenis_laporan'] ?? '') === 'per_sales_mode')
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
 <div class="p-5 border-b-4 border-black">
  <h3 class="font-extrabold text-xl tracking-tight">Kinerja Mode Penjualan</h3>
 </div>
 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Mode Penjualan</th>
     <th class="brutal-table-th text-xs text-right">Total Transaksi</th>
     <th class="brutal-table-th text-xs text-right">Total Pendapatan (Rp)</th>
    </tr>
   </thead>
   <tbody>
    @forelse($kpi['breakdown_sales_mode'] as $sm)
     <tr class="hover:bg-yellow-50 transition-colors">
      <td class="brutal-table-td text-sm font-bold">{{ $sm['nama_sales_mode'] }}</td>
      <td class="brutal-table-td text-right font-mono">{{ number_format($sm['qty'], 0, ',', '.') }} trx</td>
      <td class="brutal-table-td text-right font-mono font-extrabold">{{ number_format($sm['total'], 0, ',', '.') }}</td>
     </tr>
    @empty
     <tr><td colspan="3" class="brutal-table-td text-center py-12 text-gray-400 font-bold">Tidak ada data</td></tr>
    @endforelse
   </tbody>
  </table>
 </div>
</div>
@endif

{{-- =====================================================================
  TABEL LAPORAN - PER KASIR
  ===================================================================== --}}
@if(($params['jenis_laporan'] ?? '') === 'per_kasir')
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
 <div class="p-5 border-b-4 border-black">
  <h3 class="font-extrabold text-xl tracking-tight">Performa Kasir / Pegawai</h3>
 </div>
 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Nama Kasir</th>
     <th class="brutal-table-th text-xs">Cabang Terakhir</th>
     <th class="brutal-table-th text-xs text-right">Transaksi Diproses</th>
     <th class="brutal-table-th text-xs text-right">Omset (Rp)</th>
    </tr>
   </thead>
   <tbody>
    @forelse($kpi['breakdown_kasir'] as $ksr)
     <tr class="hover:bg-yellow-50 transition-colors">
      <td class="brutal-table-td text-sm font-bold">{{ $ksr['nama_kasir'] }}</td>
      <td class="brutal-table-td text-sm text-gray-600">{{ $ksr['nama_cabang'] }}</td>
      <td class="brutal-table-td text-right font-mono">{{ number_format($ksr['qty'], 0, ',', '.') }} trx</td>
      <td class="brutal-table-td text-right font-mono font-extrabold">{{ number_format($ksr['total'], 0, ',', '.') }}</td>
     </tr>
    @empty
     <tr><td colspan="4" class="brutal-table-td text-center py-12 text-gray-400 font-bold">Tidak ada data</td></tr>
    @endforelse
   </tbody>
  </table>
 </div>
</div>
@endif

{{-- =====================================================================
  TABEL LAPORAN - JAM SIBUK
  ===================================================================== --}}
@if(($params['jenis_laporan'] ?? '') === 'per_jam_sibuk')
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
 <div class="p-5 border-b-4 border-black">
  <h3 class="font-extrabold text-xl tracking-tight">Analisis Jam Sibuk (Peak Hours)</h3>
 </div>
 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Waktu (Jam)</th>
     <th class="brutal-table-th text-xs text-right">Jumlah Transaksi</th>
     <th class="brutal-table-th text-xs text-right">Omset (Rp)</th>
    </tr>
   </thead>
   <tbody>
    @forelse($kpi['breakdown_jam_sibuk'] as $jam)
     <tr class="hover:bg-yellow-50 transition-colors">
      <td class="brutal-table-td text-sm font-bold">Pukul {{ $jam['jam'] }}</td>
      <td class="brutal-table-td text-right font-mono">{{ number_format($jam['qty'], 0, ',', '.') }} trx</td>
      <td class="brutal-table-td text-right font-mono font-extrabold">{{ number_format($jam['total'], 0, ',', '.') }}</td>
     </tr>
    @empty
     <tr><td colspan="3" class="brutal-table-td text-center py-12 text-gray-400 font-bold">Tidak ada data</td></tr>
    @endforelse
   </tbody>
  </table>
 </div>
</div>
@endif

{{-- =====================================================================
  TABEL LAPORAN - DETAIL TRANSAKSI
  ===================================================================== --}}
@if(($params['jenis_laporan'] ?? '') === 'detail_transaksi')
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Detail Transaksi</h3>
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
     <th class="brutal-table-th text-xs">Tanggal</th>
     <th class="brutal-table-th text-xs">Kasir</th>
     <th class="brutal-table-th text-xs">Cabang</th>
     <th class="brutal-table-th text-xs">Metode Bayar</th>
     <th class="brutal-table-th text-xs">NO. REFERENSI</th>
     <th class="brutal-table-th text-xs text-right">DISKON (Rp)</th>
     <th class="brutal-table-th text-xs text-right">PAJAK (Rp)</th>
     <th class="brutal-table-th text-xs text-right">TOTAL (Rp)</th>
     <th class="brutal-table-th text-xs">Status</th>
    </tr>
   </thead>
    @forelse($transaksis as $trx)
     @php
      $isAuditOnly = in_array($trx->status, ['Void', 'Cancelled']);
      $rowClass = $isAuditOnly ? 'opacity-60 bg-red-50' : 'hover:bg-yellow-50';
     @endphp
     <tbody x-data="{ expanded: false }">
      <tr class="{{ $rowClass }} transition-colors cursor-pointer" @click="expanded = !expanded" title="Klik untuk melihat detail item">
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
          'Success' => 'bg-green-400 border-black',
          'Void'  => 'bg-red-400 border-dashed border-red-700 text-white',
          'Cancelled' => 'bg-gray-300 border-gray-500',
          default  => 'bg-yellow-300 border-black',
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
      
      {{-- DETAIL ITEM COLLAPSIBLE --}}
      <tr x-show="expanded" style="display: none;" class="bg-gray-100 border-b-4 border-black">
       <td colspan="9" class="p-4">
        <div class="border-2 border-black bg-white p-4">
         <h4 class="font-extrabold mb-3 tracking-tight">Menu yang Dibeli (Detail Pesanan)</h4>
         <table class="w-full text-sm border-collapse">
          <thead>
           <tr class="bg-gray-200 border-b-2 border-black">
            <th class="p-2 text-left font-bold border-r-2 border-black">Menu</th>
            <th class="p-2 text-right font-bold border-r-2 border-black">Harga Satuan (Rp)</th>
            <th class="p-2 text-right font-bold border-r-2 border-black">Qty</th>
            <th class="p-2 text-right font-bold border-r-2 border-black">Diskon Promo (Rp)</th>
            <th class="p-2 text-right font-bold">Subtotal (Rp)</th>
           </tr>
          </thead>
          <tbody>
           @foreach($trx->details as $item)
           <tr class="border-b border-gray-300">
            <td class="p-2 border-r-2 border-black">{{ $item->menu?->nama_menu ?? 'Item Dihapus' }}</td>
            <td class="p-2 text-right font-mono border-r-2 border-black">{{ number_format((float)$item->harga_produk, 0, ',', '.') }}</td>
            <td class="p-2 text-right font-mono font-bold border-r-2 border-black">{{ $item->quantity }}</td>
            <td class="p-2 text-right font-mono text-red-600 border-r-2 border-black">
             @if((float)$item->nominal_promo > 0)
              - {{ number_format((float)$item->nominal_promo, 0, ',', '.') }}
             @else
              0
             @endif
            </td>
            <td class="p-2 text-right font-mono font-extrabold">{{ number_format((float)$item->subtotal_item, 0, ',', '.') }}</td>
           </tr>
           @endforeach
          </tbody>
         </table>
        </div>
       </td>
      </tr>
     </tbody>
    @empty
     <tbody>
      <tr>
       <td colspan="9" class="brutal-table-td text-center py-12">
        <p class="font-extrabold text-xl text-gray-400">[TIDAK ADA DATA]</p>
        <p class="text-sm text-gray-400 mt-1">Tidak ada transaksi dalam rentang tanggal yang dipilih.</p>
       </td>
      </tr>
     </tbody>
    @endforelse

   {{-- Baris Total --}}
   @if($transaksis->count() > 0)
   <tfoot>
    <tr class="bg-black text-white">
     <td class="brutal-table-td bg-black text-white font-extrabold text-sm " colspan="7">
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
@endif

@else
{{-- Placeholder jika belum ada data --}}
<div class="bg-white border-4 border-dashed border-gray-400 p-16 text-center">
 <p class="font-extrabold text-2xl text-gray-300 tracking-widest">[BELUM ADA LAPORAN]</p>
 <p class="text-gray-400 mt-2">Pilih parameter di atas lalu klik <strong>Tampilkan Laporan</strong></p>
</div>
@endif
</div>

@endsection

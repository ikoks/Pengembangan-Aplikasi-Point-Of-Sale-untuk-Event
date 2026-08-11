@extends('layouts.admin')

@section('title', 'Riwayat Transaksi')

@section('content')
{{-- POS-A-13: Riwayat Transaksi & Detail Struk Modal --}}

@php $hasFilter = request()->except('page'); @endphp
<div x-data="{ showFilter: {{ empty($hasFilter) ? 'false' : 'true' }} }">
 <button type="button" @click="showFilter = !showFilter" class="brutal-btn brutal-btn-secondary text-sm mb-4 brutal-shadow-sm flex items-center gap-2">
  <svg x-show="!showFilter" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
  <svg x-show="showFilter" style="display:none;" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
  <span x-show="!showFilter">Tampilkan Filter</span>
  <span x-show="showFilter" style="display:none;">Sembunyikan Filter</span>
 </button>

<form id="filter-form" method="GET" action="{{ route('admin.transaksi.index') }}" class="mb-6" x-show="showFilter" style="{{ empty($hasFilter) ? 'display: none;' : '' }}">
 <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
  <h3 class="font-extrabold text-lg mb-4 border-b-4 border-black pb-2 tracking-tight">
   Pencarian Transaksi
  </h3>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

   {{-- ID Transaksi --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">ID Transaksi</label>
    <input type="text" name="id_transaksi" value="{{ request('id_transaksi') }}"
     placeholder="UUID / Sebagian..."
     class="brutal-input font-mono text-sm">
   </div>

   {{-- Kasir --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">Nama Kasir</label>
    <input type="text" name="kasir" value="{{ request('kasir') }}"
     placeholder="Nama kasir..."
     class="brutal-input">
   </div>

   {{-- Cabang --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">Cabang</label>
    <select name="id_cabang" class="brutal-input bg-white">
     <option value="">-- Semua Cabang --</option>
     @foreach($cabangs as $cabang)
      <option value="{{ $cabang->id_cabang }}"
       {{ request('id_cabang') == $cabang->id_cabang ? 'selected' : '' }}>
       {{ $cabang->nama_cabang }}
      </option>
     @endforeach
    </select>
   </div>

   {{-- Metode Bayar --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">Metode Bayar</label>
    <select name="id_metode" class="brutal-input bg-white">
     <option value="">-- Semua Metode --</option>
     @foreach($metodes as $metode)
      <option value="{{ $metode->id_metode }}"
       {{ request('id_metode') == $metode->id_metode ? 'selected' : '' }}>
       {{ $metode->nama_metode }}
      </option>
     @endforeach
    </select>
   </div>

   {{-- Tanggal Mulai --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">Tanggal Mulai</label>
    <input type="date" name="tanggal_mulai" value="{{ request('tanggal_mulai') }}"
     class="brutal-input">
   </div>

   {{-- Tanggal Akhir --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">Tanggal Akhir</label>
    <input type="date" name="tanggal_akhir" value="{{ request('tanggal_akhir') }}"
     class="brutal-input">
   </div>

   {{-- Status --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">Status</label>
    <select name="status" class="brutal-input bg-white">
     <option value="">-- Semua Status --</option>
     <option value="Success" {{ request('status') == 'Success' ? 'selected' : '' }}>[SUCCESS]</option>
     <option value="Void" {{ request('status') == 'Void' ? 'selected' : '' }}>[VOID]</option>
     <option value="Cancelled" {{ request('status') == 'Cancelled' ? 'selected' : '' }}>[CANCELLED]</option>
    </select>
   </div>

   {{-- Nomor Referensi RRN --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">No. Referensi (RRN)</label>
    <input type="text" name="nomor_referensi" value="{{ request('nomor_referensi') }}"
     placeholder="RRN / Bukti Transfer..."
     class="brutal-input font-mono text-sm">
   </div>
  </div>

  <div class="flex gap-3">
   <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">
    Cari Transaksi
   </button>
   <a href="{{ route('admin.transaksi.index') }}"
    class="brutal-btn brutal-btn-secondary brutal-shadow">
    Atur Ulang
   </a>
  </div>
 </div>
</form>
</div>

{{-- TABEL RIWAYAT TRANSAKSI --}}
<div id="data-container">
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 {{-- Header Tabel --}}
 <div class="p-5 border-b-4 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Riwayat Transaksi</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $transaksis->total() }}</span> transaksi ditemukan
   </p>
  </div>
  <div class="flex flex-col sm:flex-row gap-2">
   <a href="{{ route('admin.transaksi.export-excel', request()->all()) }}" class="brutal-btn brutal-btn-secondary bg-green-300 text-xs py-1 px-3 brutal-shadow-sm flex items-center justify-center">
    Ekspor Excel
   </a>
   <a href="{{ route('admin.transaksi.export-pdf', request()->all()) }}" class="brutal-btn brutal-btn-secondary bg-red-300 text-xs py-1 px-3 brutal-shadow-sm flex items-center justify-center">
    Ekspor Pdf
   </a>
  </div>
 </div>

 {{-- Table --}}
 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Id Transaksi</th>
     <th class="brutal-table-th text-xs">Tanggal / Jam</th>
     <th class="brutal-table-th text-xs">Kasir</th>
     <th class="brutal-table-th text-xs">Cabang</th>
     <th class="brutal-table-th text-xs">Metode Bayar</th>
     <th class="brutal-table-th text-xs">NO. REFERENSI (RRN)</th>
     <th class="brutal-table-th text-xs text-right">TOTAL (Rp)</th>
     <th class="brutal-table-th text-xs">Status</th>
     <th class="brutal-table-th text-xs text-center">Aksi</th>
    </tr>
   </thead>
   <tbody>
    @forelse($transaksis as $trx)
     <tr class="hover:bg-yellow-50 transition-colors cursor-pointer
      {{ $trx->status === 'Void' ? 'border-dashed' : '' }}
      {{ $trx->status === 'Cancelled' ? 'opacity-70' : '' }}"
      onclick="window.location='{{ route('admin.transaksi.show', $trx->id_transaksi) }}'">

      {{-- ID Transaksi --}}
      <td class="brutal-table-td">
       <span class="font-mono text-xs text-gray-700 block">
        {{ substr($trx->id_transaksi, 0, 8) }}...
       </span>
      </td>

      {{-- Tanggal & Jam --}}
      <td class="brutal-table-td">
       <span class="font-mono text-sm font-bold">{{ $trx->tanggal_transaksi }}</span>
       <span class="block text-xs text-gray-500 font-mono">{{ substr($trx->jam_transaksi, 0, 5) }}</span>
      </td>

      {{-- Kasir --}}
      <td class="brutal-table-td">
       <span class="font-bold text-sm">{{ $trx->kasir?->nama_kasir ?? '-' }}</span>
      </td>

      {{-- Cabang --}}
      <td class="brutal-table-td">
       <span class="text-sm">{{ $trx->cabang?->nama_cabang ?? '-' }}</span>
      </td>

      {{-- Metode Bayar --}}
      <td class="brutal-table-td">
       <span class="text-sm font-bold">{{ $trx->metodePembayaran?->nama_metode ?? '-' }}</span>
      </td>

      {{-- Nomor Referensi --}}
      <td class="brutal-table-td">
       @if($trx->nomor_referensi)
        <span class="font-mono text-xs bg-gray-100 border border-black px-2 py-0.5 inline-block">
         {{ $trx->nomor_referensi }}
        </span>
       @else
        <span class="text-gray-400 text-xs">— TUNAI —</span>
       @endif
      </td>

      {{-- Total --}}
      <td class="brutal-table-td text-right">
       <span class="font-mono font-extrabold text-sm
        {{ in_array($trx->status, ['Void', 'Cancelled']) ? 'line-through text-gray-400' : '' }}">
        {{ number_format((float)$trx->total, 0, ',', '.') }}
       </span>
      </td>

      {{-- Status Badge --}}
      <td class="brutal-table-td">
       @php
        $badgeClass = match($trx->status) {
         'Success' => 'bg-green-400 border-black',
         'Void'  => 'bg-red-400 border-red-700 border-dashed',
         'Cancelled' => 'bg-gray-300 border-gray-500',
         'Draft'  => 'bg-yellow-300 border-black',
         default  => 'bg-gray-200 border-black',
        };
       @endphp
       <span class="inline-block border-2 px-2 py-0.5 text-xs font-extrabold {{ $badgeClass }}">
        [{{ strtoupper($trx->status) }}]
       </span>
      </td>

      {{-- Aksi --}}
      <td class="brutal-table-td text-center">
       <a
        href="{{ route('admin.transaksi.show', $trx->id_transaksi) }}"
        class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-xs px-3 py-1 inline-block">
        Lihat Struk
       </a>
      </td>
     </tr>
    @empty
     <tr>
      <td colspan="9" class="brutal-table-td text-center py-12">
       <p class="font-extrabold text-xl text-gray-400">[TIDAK ADA DATA]</p>
       <p class="text-sm text-gray-400 mt-1">Tidak ada transaksi yang cocok dengan filter.</p>
      </td>
     </tr>
    @endforelse
   </tbody>
  </table>
 </div>

 {{-- Pagination --}}
 @if($transaksis->hasPages())
  <div class="p-5 border-t-4 border-black">
   {{ $transaksis->links() }}
  </div>
 @endif
</div>
</div>


@endsection

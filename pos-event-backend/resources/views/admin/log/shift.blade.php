@extends('layouts.admin')

@section('title', 'Shift Log')

@section('content')
{{-- POS-A-15: Shift Log Viewer --}}

@php $hasFilter = request()->except('page'); @endphp
<div x-data="{ showFilter: {{ empty($hasFilter) ? 'false' : 'true' }} }">
 <button type="button" @click="showFilter = !showFilter" class="brutal-btn brutal-btn-secondary text-sm mb-4 brutal-shadow-sm flex items-center gap-2">
  <svg x-show="!showFilter" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
  <svg x-show="showFilter" style="display:none;" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
  <span x-show="!showFilter">Tampilkan Filter</span>
  <span x-show="showFilter" style="display:none;">Sembunyikan Filter</span>
 </button>

<form id="filter-form" method="GET" action="{{ route('admin.log.shift.index') }}" class="mb-6" x-show="showFilter" style="{{ empty($hasFilter) ? 'display: none;' : '' }}">
 <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
  <h3 class="font-extrabold text-lg mb-4 border-b-4 border-black pb-2 tracking-tight">
   Pencarian Shift Log
  </h3>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

   <div>
    <label class="block text-xs font-extrabold mb-1">Nama Kasir</label>
    <input type="text" name="kasir" value="{{ request('kasir') }}"
     placeholder="Nama kasir..." class="brutal-input">
   </div>

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

   <div>
    <label class="block text-xs font-extrabold mb-1">Status Shift</label>
    <select name="status_shift" class="brutal-input bg-white">
     <option value="">-- Semua Status --</option>
     <option value="OPEN" {{ request('status_shift') === 'OPEN' ? 'selected' : '' }}>[OPEN]</option>
     <option value="ON_BREAK" {{ request('status_shift') === 'ON_BREAK' ? 'selected' : '' }}>[ON_BREAK]</option>
     <option value="CLOSED" {{ request('status_shift') === 'CLOSED' ? 'selected' : '' }}>[CLOSED]</option>
    </select>
   </div>

   <div>
    <label class="block text-xs font-extrabold mb-1">Tanggal Mulai</label>
    <input type="date" name="tanggal_mulai" value="{{ request('tanggal_mulai') }}"
     class="brutal-input">
   </div>

   <div>
    <label class="block text-xs font-extrabold mb-1">Tanggal Akhir</label>
    <input type="date" name="tanggal_akhir" value="{{ request('tanggal_akhir') }}"
     class="brutal-input">
   </div>

   <div class="flex items-end">
    <label class="flex items-center gap-3 cursor-pointer p-3 border-4 border-black bg-white hover:bg-gray-100 w-full">
     <input type="checkbox" name="auto_closed" value="1"
      {{ request('auto_closed') ? 'checked' : '' }}
      class="w-5 h-5 border-2 border-black accent-black">
     <span class="font-extrabold text-sm">Hanya AUTO_CLOSED</span>
    </label>
   </div>
  </div>

  <div class="flex gap-3">
   <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">Cari Shift</button>
   <a href="{{ route('admin.log.shift.index') }}" class="brutal-btn brutal-btn-secondary brutal-shadow">Atur Ulang</a>
  </div>
 </div>
</form>
</div>

{{-- DAFTAR SHIFT --}}
<div id="data-container">
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Log Shift</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $shifts->total() }}</span> shift
   </p>
  </div>
  <div class="flex flex-col sm:flex-row gap-2">
   <a href="{{ route('admin.log.shift.export-excel', request()->all()) }}" class="brutal-btn brutal-btn-secondary bg-green-300 text-xs py-1 px-3 brutal-shadow-sm flex items-center justify-center">
    Ekspor Excel
   </a>
   <a href="{{ route('admin.log.shift.export-pdf', request()->all()) }}" class="brutal-btn brutal-btn-secondary bg-red-300 text-xs py-1 px-3 brutal-shadow-sm flex items-center justify-center">
    Ekspor Pdf
   </a>
  </div>
 </div>

 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Waktu Shift</th>
     <th class="brutal-table-th text-xs">Status</th>
     <th class="brutal-table-th text-xs">Kasir</th>
     <th class="brutal-table-th text-xs">Cabang</th>
     <th class="brutal-table-th text-xs text-right">Pendapatan</th>
     <th class="brutal-table-th text-xs text-center">Detail</th>
    </tr>
   </thead>
   <tbody>
    @forelse($shifts as $shift)
     @php
      $isAutoClosed = $shift->operatorLogs->contains(fn($l) => str_contains($l->catatan ?? '', 'auto_closed'));
      $rowBg = match($shift->status_shift) {
       'OPEN'  => 'bg-green-50',
       'ON_BREAK' => 'bg-yellow-50',
       'CLOSED' => 'hover:bg-gray-50',
       default => 'hover:bg-gray-50',
      };
      $statusClass = match($shift->status_shift) {
       'OPEN'  => 'bg-green-400 border-green-700',
       'ON_BREAK' => 'bg-yellow-300 border-yellow-700',
       'CLOSED' => 'bg-gray-300 border-black',
       default => 'bg-gray-200 border-black',
      };
      $totalTrx = $shift->transaksis->count();
      $totalPendapatan = $shift->transaksis->where('status', 'Success')->sum(fn($t) => (float) $t->total);
      $pendapatanTunai = $shift->transaksis->where('status', 'Success')->filter(fn($t) => strcasecmp($t->metodePembayaran?->kategoriMetode?->nama_kategori ?? '', 'Tunai') === 0)->sum(fn($t) => (float) $t->total);
      $pendapatanNonTunai = $totalPendapatan - $pendapatanTunai;
     @endphp
     <tr class="{{ $rowBg }} transition-colors {{ $isAutoClosed ? 'bg-red-50' : '' }}">
      {{-- Waktu Shift --}}
      <td class="brutal-table-td">
       <span class="font-mono text-xs font-bold">{{ $shift->waktu_mulai?->format('d-m-Y') }}</span>
       <span class="block font-mono text-xs text-gray-500 mt-1">
        {{ $shift->waktu_mulai?->format('H:i') }} - {{ $shift->waktu_selesai?->format('H:i') ?? '...' }}
       </span>
      </td>

      {{-- Status Badge --}}
      <td class="brutal-table-td">
       <span class="inline-block border-2 px-2 py-0.5 text-xs font-extrabold font-mono {{ $statusClass }}">
        {{ $shift->status_shift }}
       </span>
       @if($isAutoClosed)
        <span class="block mt-1 border-2 border-dashed border-red-600 bg-red-100 text-red-700 px-1 py-0.5 text-[10px] font-extrabold text-center">
         AUTO_CLOSED
        </span>
       @endif
      </td>

      {{-- Kasir --}}
      <td class="brutal-table-td">
       <span class="font-bold text-sm">{{ $shift->user?->nama_user ?? '—' }}</span>
       <span class="block text-xs text-gray-400 font-mono">ID: {{ substr($shift->id_shift, 0, 8) }}...</span>
      </td>

      {{-- Cabang --}}
      <td class="brutal-table-td">
       <span class="font-bold text-sm">{{ $shift->cabang?->nama_cabang ?? '-' }}</span>
      </td>

      {{-- Pendapatan --}}
      <td class="brutal-table-td text-right">
       <span class="font-mono font-extrabold text-sm">Rp {{ number_format($totalPendapatan, 0, ',', '.') }}</span>
       <span class="block text-xs text-gray-400">{{ $totalTrx }} trx</span>
      </td>

      {{-- Detail (Toggle) --}}
      <td class="brutal-table-td text-center">
       <button
        type="button"
        onclick="toggleDetail('detail-{{ $shift->id_shift }}')"
        class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-xs px-3 py-1">
        Lihat
       </button>
      </td>
     </tr>

     {{-- Detail Row (hidden by default) --}}
     <tr id="detail-{{ $shift->id_shift }}" class="hidden bg-gray-50">
      <td colspan="6" class="border-4 border-dashed border-gray-400 p-4">
       
       {{-- Rekap Modal & Kas --}}
       <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 border-b-2 border-dashed border-gray-300 pb-4">
        @php 
            $modal = (float)$shift->modal_awal;
            $uangTunaiAkhir = $shift->uang_fisik_akhir !== null ? (float)$shift->uang_fisik_akhir : ($modal + $pendapatanTunai);
            $uangNonTunaiAkhir = $pendapatanNonTunai;
            $totalUangAkhir = $uangTunaiAkhir + $uangNonTunaiAkhir;
            $keuntungan = $totalUangAkhir - $modal;
            $selisih = (float)$shift->selisih_uang;
        @endphp
        <div>
         <span class="text-xs font-extrabold text-gray-500">Modal Awal</span>
         <p class="font-mono font-bold">Rp {{ number_format($modal, 0, ',', '.') }}</p>
        </div>
        <div>
         <span class="text-xs font-extrabold text-gray-500">Uang Tunai Akhir</span>
         <p class="font-mono font-bold">Rp {{ number_format($uangTunaiAkhir, 0, ',', '.') }}</p>
        </div>
        <div>
         <span class="text-xs font-extrabold text-gray-500">Uang Non-Tunai Akhir</span>
         <p class="font-mono font-bold text-gray-600">Rp {{ number_format($uangNonTunaiAkhir, 0, ',', '.') }}</p>
        </div>
        <div>
         <span class="text-xs font-extrabold text-gray-500">Total Uang Akhir</span>
         <p class="font-mono font-bold text-brutal-black bg-yellow-200 px-1 inline-block">Rp {{ number_format($totalUangAkhir, 0, ',', '.') }}</p>
        </div>
        <div>
         <span class="text-xs font-extrabold text-gray-500">Total Keuntungan</span>
         <p class="font-mono font-bold {{ $keuntungan > 0 ? 'text-green-600' : ($keuntungan < 0 ? 'text-red-600' : '') }}">
          Rp {{ number_format($keuntungan, 0, ',', '.') }}
         </p>
        </div>
        <div>
         <span class="text-xs font-extrabold text-gray-500">Selisih Kas</span>
         <p class="font-mono font-bold {{ $selisih != 0 ? 'text-red-600' : 'text-green-600' }}">
          {{ $selisih >= 0 ? '+' : '' }}Rp {{ number_format($selisih, 0, ',', '.') }}
         </p>
        </div>
        <div>
         <span class="text-xs font-extrabold text-gray-500">Mode Penjualan</span>
         <p class="font-bold">{{ $shift->salesMode?->nama_mode ?? '-' }}</p>
        </div>
       </div>

       {{-- Operator Logs --}}
       <div>
        <h4 class="font-extrabold text-xs mb-2 text-gray-700">
         [LOG OPERATOR] — {{ $shift->operatorLogs->count() }} aksi
        </h4>
        @if($shift->operatorLogs->count() > 0)
         <div class="space-y-1">
          @foreach($shift->operatorLogs->sortBy('waktu_kejadian') as $opLog)
           @php
            $logBg = match($opLog->aksi) {
             'open' => 'border-green-500 bg-green-50',
             'break' => 'border-yellow-500 bg-yellow-50',
             'resume' => 'border-blue-500 bg-blue-50',
             'switch' => 'border-purple-500 bg-purple-50',
             'closed' => 'border-gray-500 bg-gray-50',
             default => 'border-red-500 bg-red-50',
            };
            $isAutoCloseLog = str_contains($opLog->catatan ?? '', 'auto_closed');
           @endphp
           <div class="flex items-start gap-2 border-l-4 pl-3 py-1.5 {{ $logBg }}">
            <div class="w-16 shrink-0">
             <span class="font-mono text-xs font-bold">{{ $opLog->waktu_kejadian?->format('H:i') }}</span>
            </div>
            <div class="flex-1 text-xs">
             <span class="font-extrabold font-mono mr-2">{{ $opLog->aksi }}</span>
             <span>{{ $opLog->user?->nama_user ?? '—' }}</span>
             @if($opLog->catatan && !$isAutoCloseLog)
              <span class="text-gray-500 font-mono ml-2">— {{ $opLog->catatan }}</span>
             @elseif($isAutoCloseLog)
              <span class="text-red-600 font-mono ml-2 font-bold">— Shift ditutup otomatis cron 03:00</span>
             @endif
            </div>
           </div>
          @endforeach
         </div>
        @else
         <p class="text-gray-400 text-xs italic">Tidak ada log operator.</p>
        @endif
       </div>
      </td>
     </tr>
    @empty
     <tr>
      <td colspan="6" class="brutal-table-td text-center py-12">
       <p class="font-extrabold text-xl text-gray-400">[TIDAK ADA SHIFT]</p>
       <p class="text-sm text-gray-400 mt-1">Tidak ada shift yang cocok dengan filter.</p>
      </td>
     </tr>
    @endforelse
   </tbody>
  </table>
 </div>

 @if($shifts->hasPages())
  <div class="p-5 border-t-4 border-black">
   {{ $shifts->links() }}
  </div>
 @endif
</div>
</div>

@push('scripts')
<script>
 function toggleDetail(id) {
  const row = document.getElementById(id);
  if (row) {
   row.classList.toggle('hidden');
  }
 }
</script>
@endpush

@endsection

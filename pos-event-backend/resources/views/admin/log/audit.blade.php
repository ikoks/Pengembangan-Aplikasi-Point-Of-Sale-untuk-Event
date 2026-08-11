@extends('layouts.admin')

@section('title', 'Audit Log')

@section('content')
{{-- POS-A-15: Searchable Audit Log Viewer --}}

@php $hasFilter = request()->except('page'); @endphp
<div x-data="{ showFilter: {{ empty($hasFilter) ? 'false' : 'true' }} }">
 <button type="button" @click="showFilter = !showFilter" class="brutal-btn brutal-btn-secondary text-sm mb-4 brutal-shadow-sm flex items-center gap-2">
  <svg x-show="!showFilter" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
  <svg x-show="showFilter" style="display:none;" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
  <span x-show="!showFilter">Tampilkan Filter</span>
  <span x-show="showFilter" style="display:none;">Sembunyikan Filter</span>
 </button>

<form id="filter-form" method="GET" action="{{ route('admin.log.audit.index') }}" class="mb-6" x-show="showFilter" style="{{ empty($hasFilter) ? 'display: none;' : '' }}">
 <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
  <h3 class="font-extrabold text-lg mb-4 border-b-4 border-black pb-2 tracking-tight">
   Pencarian Audit Log
  </h3>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

   {{-- Aktivitas --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">Aktivitas / Aksi</label>
    <input type="text" name="aktivitas" value="{{ request('aktivitas') }}"
     placeholder="VOID_TRANSACTION, CREATE_ADMIN..."
     class="brutal-input font-mono text-sm">
   </div>

   {{-- Actor --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">Actor (Nama User)</label>
    <input type="text" name="actor" value="{{ request('actor') }}"
     placeholder="Nama user..."
     class="brutal-input">
   </div>

   {{-- IP Address --}}
   <div>
    <label class="block text-xs font-extrabold mb-1">IP Address</label>
    <input type="text" name="ip_address" value="{{ request('ip_address') }}"
     placeholder="192.168.x.x..."
     class="brutal-input font-mono text-sm">
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
  </div>

  <div class="flex gap-3">
   <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">
    Cari Log
   </button>
   <a href="{{ route('admin.log.audit.index') }}" class="brutal-btn brutal-btn-secondary brutal-shadow">
    Atur Ulang
   </a>
  </div>
 </div>
</form>
</div>

{{-- TABEL AUDIT LOG --}}
<div id="data-container">
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Log Audit</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $logs->total() }}</span> entri log
   </p>
  </div>
  <div class="flex flex-col sm:flex-row gap-2">
   <a href="{{ route('admin.log.audit.export-excel', request()->all()) }}" class="brutal-btn brutal-btn-secondary bg-green-300 text-xs py-1 px-3 brutal-shadow-sm flex items-center justify-center">
    Ekspor Excel
   </a>
   <a href="{{ route('admin.log.audit.export-pdf', request()->all()) }}" class="brutal-btn brutal-btn-secondary bg-red-300 text-xs py-1 px-3 brutal-shadow-sm flex items-center justify-center">
    Ekspor Pdf
   </a>
  </div>
 </div>

 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Waktu</th>
     <th class="brutal-table-th text-xs">Aktivitas</th>
     <th class="brutal-table-th text-xs">Pengguna</th>
     <th class="brutal-table-th text-xs">Id Target</th>
     <th class="brutal-table-th text-xs">Ip Address</th>
     <th class="brutal-table-th text-xs text-center">Detail</th>
    </tr>
   </thead>
   <tbody>
    @forelse($logs as $log)
     @php
      $isVoid = str_contains($log->aktivitas, 'VOID');
      $isDelete = str_contains($log->aktivitas, 'DELETE');
      $isCreate = str_contains($log->aktivitas, 'CREATE');
      $rowBg = $isVoid || $isDelete ? 'bg-red-50' : ($isCreate ? 'bg-green-50' : 'hover:bg-gray-50');
     @endphp
     <tr class="{{ $rowBg }} transition-colors">
      {{-- Timestamp --}}
      <td class="brutal-table-td">
       <span class="font-mono text-xs font-bold">
        {{ $log->waktu_kejadian?->format('d-m-Y') }}
       </span>
       <span class="block font-mono text-xs text-gray-500">
        {{ $log->waktu_kejadian?->format('H:i:s') }}
       </span>
      </td>

      {{-- Aktivitas Badge --}}
      <td class="brutal-table-td">
       @php
        $actBg = match(true) {
         str_contains($log->aktivitas, 'VOID') => 'bg-red-400 border-dashed border-red-700',
         str_contains($log->aktivitas, 'DELETE') => 'bg-orange-300 border-black',
         str_contains($log->aktivitas, 'CREATE') => 'bg-green-300 border-black',
         str_contains($log->aktivitas, 'UPDATE') => 'bg-blue-200 border-black',
         str_contains($log->aktivitas, 'RESET') => 'bg-yellow-300 border-black',
         str_contains($log->aktivitas, 'LOGIN') => 'bg-purple-300 border-black',
         str_contains($log->aktivitas, 'LOGOUT') => 'bg-gray-300 border-black',
         str_contains($log->aktivitas, 'FAILED') => 'bg-red-300 border-black',
         default         => 'bg-gray-200 border-black',
        };
       @endphp
       <span class="inline-block border-2 px-2 py-0.5 text-xs font-extrabold font-mono {{ $actBg }}">
        {{ $log->aktivitas }}
       </span>
      </td>

      {{-- Actor --}}
      <td class="brutal-table-td">
       @if($log->admin)
        <span class="font-bold text-sm">{{ $log->admin->nama_admin }}</span>
        <span class="block text-xs text-gray-400 font-mono">{{ $log->admin->username }}</span>
       @else
        <span class="text-gray-400 text-xs font-mono">[SISTEM / TIDAK DIKETAHUI]</span>
       @endif
      </td>

      {{-- ID Target --}}
      <td class="brutal-table-td">
       <span class="font-mono text-xs text-gray-600">
        {{ $log->id_target ? substr($log->id_target, 0, 12) . '...' : '-' }}
       </span>
      </td>

      {{-- IP Address --}}
      <td class="brutal-table-td">
       <span class="font-mono text-xs font-bold">{{ $log->ip_address ?? '-' }}</span>
      </td>

      {{-- Detail (Toggle) --}}
      <td class="brutal-table-td text-center">
       @if($log->data_sebelum || $log->data_sesudah)
        <button
         type="button"
         onclick="toggleDetail('detail-{{ $log->id_audit }}')"
         class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-xs px-3 py-1">
         Lihat
        </button>
       @else
        <span class="text-gray-300 text-xs">—</span>
       @endif
      </td>
     </tr>

     {{-- Detail Row (hidden by default) --}}
     @if($log->data_sebelum || $log->data_sesudah)
      <tr id="detail-{{ $log->id_audit }}" class="hidden bg-gray-50">
       <td colspan="6" class="border-4 border-dashed border-gray-400 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
         @php
          if (!function_exists('formatAuditValue')) {
           function formatAuditValue($val) {
            if (is_array($val) || is_object($val)) {
             $res = [];
             foreach ((array)$val as $k => $v) {
              $res[] = $k . ': ' . (is_array($v) || is_object($v) ? '...' : $v);
             }
             return implode(', ', $res);
            }
            return $val;
           }
          }
         @endphp
         @if($log->data_sebelum)
          <div>
           <p class="text-xs font-extrabold text-red-600 mb-2">Data Sebelum:</p>
           <div class="bg-white border-2 border-dashed border-red-400 p-3 text-xs font-mono overflow-x-auto">
            <table class="w-full text-left border-collapse">
             @foreach((array)$log->data_sebelum as $key => $value)
              <tr class="border-b border-gray-200 last:border-0">
               <td class="py-1 pr-2 font-bold text-gray-700 align-top w-1/3">{{ $key }}</td>
               <td class="py-1 text-gray-900 break-all align-top">{{ formatAuditValue($value) }}</td>
              </tr>
             @endforeach
            </table>
           </div>
          </div>
         @endif
         @if($log->data_sesudah)
          <div>
           <p class="text-xs font-extrabold text-green-600 mb-2">Data Sesudah:</p>
           <div class="bg-white border-2 border-dashed border-green-400 p-3 text-xs font-mono overflow-x-auto">
            <table class="w-full text-left border-collapse">
             @foreach((array)$log->data_sesudah as $key => $value)
              <tr class="border-b border-gray-200 last:border-0">
               <td class="py-1 pr-2 font-bold text-gray-700 align-top w-1/3">{{ $key }}</td>
               <td class="py-1 text-gray-900 break-all align-top">{{ formatAuditValue($value) }}</td>
              </tr>
             @endforeach
            </table>
           </div>
          </div>
         @endif
        </div>
       </td>
      </tr>
     @endif
    @empty
     <tr>
      <td colspan="6" class="brutal-table-td text-center py-12">
       <p class="font-extrabold text-xl text-gray-400">[Tidak Ada Log]</p>
       <p class="text-sm text-gray-400 mt-1">Belum ada aktivitas yang tercatat.</p>
      </td>
     </tr>
    @endforelse
   </tbody>
  </table>
 </div>

 @if($logs->hasPages())
  <div class="p-5 border-t-4 border-black">
   {{ $logs->links() }}
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

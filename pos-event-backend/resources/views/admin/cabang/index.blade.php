@extends('layouts.admin')
@section('title', 'Cabang')

@section('content')
{{-- FORM TAMBAH CABANG (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_cabang') ? 'true' : 'false' }} }" class="mb-6">
 <button @click="openForm = !openForm"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Tambah Cabang Baru</span>
  <svg :class="openForm ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path>
  </svg>
 </button>

 <div x-show="openForm" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
  <form action="{{ route('admin.cabang.store') }}" method="POST">
   @csrf
   <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div>
     <label class="block text-xs font-extrabold mb-1">Nama Cabang <span class="text-red-600">*</span></label>
     <input type="text" name="nama_cabang" value="{{ old('nama_cabang') }}" class="brutal-input" required>
     @error('nama_cabang') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
    <div>
     <label class="block text-xs font-extrabold mb-1">Lokasi <span class="text-red-600">*</span></label>
     <input type="text" name="lokasi" value="{{ old('lokasi') }}" class="brutal-input" required>
     @error('lokasi') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
    <div>
     <label class="block text-xs font-extrabold mb-1">Pajak (%) <span class="text-red-600">*</span></label>
     <input type="number" step="0.01" name="pajak_persen" value="{{ old('pajak_persen', 0) }}" class="brutal-input" required>
     <p class="text-[10px] mt-1 font-bold text-gray-500">Gunakan angka desimal jika perlu (contoh: 11.00)</p>
     @error('pajak_persen') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
   </div>
   <div class="flex gap-3 mt-2">
    <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">Simpan Cabang</button>
    <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary brutal-shadow">Batal</button>
   </div>
  </form>
 </div>
</div>

{{-- TABEL DAFTAR CABANG --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Cabang</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $cabangs->total() }}</span> cabang terdaftar
   </p>
  </div>

  {{-- Search --}}
  <form method="GET" action="{{ route('admin.cabang.index') }}" class="flex gap-2">
   <input type="text" name="search" value="{{ request('search') }}"
    placeholder="Cari cabang atau lokasi..."
    class="brutal-input text-sm w-48">
   <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm px-3">
    Cari
   </button>
  </form>
 </div>

 <div class="overflow-x-auto">
  <table class="w-full text-left border-collapse min-w-max">
   <thead class="bg-black text-white">
    <tr>
     <th class="brutal-table-th text-xs">Nama Cabang</th>
     <th class="brutal-table-th text-xs">Lokasi</th>
     <th class="brutal-table-th text-xs">PAJAK (%)</th>
     <th class="brutal-table-th text-xs text-center">Aksi</th>
    </tr>
   </thead>
  <tbody>
   @forelse($cabangs as $cabang)
   <tr class="hover:bg-gray-50">
    <td class="brutal-table-td font-bold">{{ $cabang->nama_cabang }}</td>
    <td class="brutal-table-td">{{ $cabang->lokasi }}</td>
    <td class="brutal-table-td">{{ $cabang->pajak_persen }}%</td>
    <td class="brutal-table-td space-x-2 text-center">
     
     <!-- Edit Modal -->
     <div x-data="{ open: {{ $errors->any() && old('id_cabang') == $cabang->id_cabang ? 'true' : 'false' }} }" class="inline-block">
      <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

      <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
       <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
        <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Cabang</h2>
        <form action="{{ route('admin.cabang.update', $cabang->id_cabang) }}" method="POST">
         @csrf
         @method('PUT')
         <input type="hidden" name="id_cabang" value="{{ $cabang->id_cabang }}">
         <div class="mb-4">
          <label class="block font-extrabold mb-2 text-xs text-left">Nama Cabang</label>
          <input type="text" name="nama_cabang" value="{{ old('id_cabang') == $cabang->id_cabang ? old('nama_cabang') : $cabang->nama_cabang }}" class="brutal-input" required>
          @error('nama_cabang') 
           @if(old('id_cabang') == $cabang->id_cabang)
            <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
           @endif
          @enderror
         </div>
         <div class="mb-4">
          <label class="block font-extrabold mb-2 text-xs text-left">Lokasi</label>
          <input type="text" name="lokasi" value="{{ old('id_cabang') == $cabang->id_cabang ? old('lokasi') : $cabang->lokasi }}" class="brutal-input" required>
          @error('lokasi') 
           @if(old('id_cabang') == $cabang->id_cabang)
            <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
           @endif
          @enderror
         </div>
         <div class="mb-4">
          <label class="block font-extrabold mb-2 text-xs text-left">Pajak (%)</label>
          <input type="number" step="0.01" name="pajak_persen" value="{{ old('id_cabang') == $cabang->id_cabang ? old('pajak_persen') : (float)$cabang->pajak_persen }}" class="brutal-input" required>
          <p class="text-[10px] mt-1 font-bold text-gray-500 text-left">Gunakan angka desimal jika perlu (contoh: 11.00)</p>
          @error('pajak_persen') 
           @if(old('id_cabang') == $cabang->id_cabang)
            <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
           @endif
          @enderror
         </div>
         <div class="flex gap-4 mt-6">
          <button type="submit" class="brutal-btn brutal-btn-primary">Simpan</button>
          <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">Batal</button>
         </div>
        </form>
       </div>
      </div>
     </div>

     <form action="{{ route('admin.cabang.destroy', $cabang->id_cabang) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus cabang ini?');">
      @csrf
      @method('DELETE')
      <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
     </form>
    </td>
   </tr>
   @empty
   <tr>
    <td colspan="4" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data cabang.</td>
   </tr>
   @endforelse
  </tbody>
 </table>
</div>

@if($cabangs->hasPages())
 <div class="p-5 border-t-4 border-black">
  {{ $cabangs->links() }}
 </div>
@endif
</div>
@endsection

@extends('layouts.admin')
@section('title', 'Kategori Metode Pembayaran')

@section('content')
{{-- MODAL TAMBAH KATEGORI --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_kategori_metode') ? 'true' : 'false' }} }" class="mb-6">
 <button @click="openForm = true"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Tambah Kategori Metode Baru</span>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M12 4v16m8-8H4"></path>
  </svg>
 </button>

 <div x-show="openForm" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
  <div @click.away="openForm = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
   <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Tambah Kategori Metode Baru</h2>
   <form action="{{ route('admin.kategori-metode.store') }}" method="POST">
    @csrf
    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1">Nama Kategori <span class="text-red-600">*</span></label>
     <input type="text" name="nama_kategori" value="{{ old('nama_kategori') }}" class="brutal-input" required autofocus>
     @error('nama_kategori') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
    <p class="text-xs text-gray-500 font-bold mb-4">
      <span class="bg-yellow-100 border border-yellow-400 px-2 py-1 inline-block">ℹ Status default: <strong>Aktif</strong>. Bisa diubah via toggle di tabel.</span>
     </p>
     <div class="flex gap-4 mt-6">
      <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Kategori</button>
      <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary">Batal</button>
     </div>
   </form>
  </div>
 </div>
</div>

{{-- TABEL DAFTAR KATEGORI --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Kategori Metode Pembayaran</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $kategoris->total() }}</span> kategori terdaftar
   </p>
  </div>

  <form method="GET" action="{{ route('admin.kategori-metode.index') }}" class="flex gap-2">
   <select name="status" class="brutal-input text-sm w-32" onchange="this.form.submit()">
    <option value="Aktif" {{ request('status', 'Aktif') == 'Aktif' ? 'selected' : '' }}>Aktif</option>
    <option value="Nonaktif" {{ request('status') == 'Nonaktif' ? 'selected' : '' }}>Nonaktif</option>
    <option value="Semua" {{ request('status') == 'Semua' ? 'selected' : '' }}>Semua</option>
   </select>
   <input type="text" name="search" value="{{ request('search') }}"
    placeholder="Cari kategori..."
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
     <th class="brutal-table-th text-xs">Nama Kategori</th>
     <th class="brutal-table-th text-xs">Status</th>
     <th class="brutal-table-th text-xs w-48 text-center">Aksi</th>
    </tr>
   </thead>
   <tbody class="divide-y-2 divide-gray-200">
   @forelse($kategoris as $kat)
   <tr class="hover:bg-gray-50">
    <td class="brutal-table-td font-bold">{{ $kat->nama_kategori }}</td>
    <td class="brutal-table-td">
      <form action="{{ route('admin.kategori-metode.toggle-status', $kat->id_kategori_metode) }}" method="POST" class="inline-flex flex-col items-center gap-1">
       @csrf
       @method('PATCH')
       <span class="text-[10px] font-black tracking-wider {{ $kat->status === 'Aktif' ? 'text-green-600' : 'text-gray-500' }}">{{ $kat->status }}</span>
       <button type="submit" title="{{ $kat->status }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $kat->status === 'Aktif' ? 'bg-green-400' : 'bg-gray-300' }}">
        <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $kat->status === 'Aktif' ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
       </button>
      </form>
    </td>
    <td class="brutal-table-td text-center space-x-2">
     
     <!-- Edit Modal -->
     <div x-data="{ open: {{ $errors->any() && old('id_kategori_metode') == $kat->id_kategori_metode ? 'true' : 'false' }} }" class="inline-block">
      <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

      <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
       <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
        <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Kategori</h2>
        <form action="{{ route('admin.kategori-metode.update', $kat->id_kategori_metode) }}" method="POST">
         @csrf
         @method('PUT')
         <input type="hidden" name="id_kategori_metode" value="{{ $kat->id_kategori_metode }}">
         <div class="mb-4">
          <label class="block font-extrabold mb-2 text-xs">Nama Kategori</label>
          <input type="text" name="nama_kategori" value="{{ old('id_kategori_metode') == $kat->id_kategori_metode ? old('nama_kategori') : $kat->nama_kategori }}" class="brutal-input" required>
          @error('nama_kategori') 
           @if(old('id_kategori_metode') == $kat->id_kategori_metode)
            <span class="text-red-500 text-xs font-bold">{{ $message }}</span> 
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

     <form action="{{ route('admin.kategori-metode.destroy', $kat->id_kategori_metode) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus kategori ini?');">
      @csrf
      @method('DELETE')
      <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
     </form>
    </td>
   </tr>
   @empty
   <tr>
    <td colspan="2" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data kategori metode.</td>
   </tr>
   @endforelse
  </tbody>
 </table>
 </div>

 @if($kategoris->hasPages())
  <div class="p-5 border-t-4 border-black">
   {{ $kategoris->links() }}
  </div>
 @endif
</div>
@endsection

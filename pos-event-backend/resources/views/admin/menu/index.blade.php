@extends('layouts.admin')
@section('title', 'Menu Produk')

@section('content')
{{-- FORM TAMBAH MENU (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_menu') ? 'true' : 'false' }} }" class="mb-6">
 <button @click="openForm = !openForm"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Tambah Menu Baru</span>
  <svg :class="openForm ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path>
  </svg>
 </button>

 <div x-show="openForm" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
  <form action="{{ route('admin.menu.store') }}" method="POST">
   @csrf
   <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div>
     <label class="block text-xs font-extrabold mb-1">Sub-Kategori <span class="text-red-600">*</span></label>
     <select name="id_sub_kategori" class="brutal-input bg-white" required>
      <option value="">-- Pilih Sub-Kategori --</option>
      @foreach($subKategoris as $sub)
       <option value="{{ $sub->id_sub_kategori }}" {{ old('id_sub_kategori') == $sub->id_sub_kategori ? 'selected' : '' }}>
        {{ $sub->kategori->nama_kategori ?? '' }} - {{ $sub->nama_sub_kategori }}
       </option>
      @endforeach
     </select>
     @error('id_sub_kategori') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
    <div>
     <label class="block text-xs font-extrabold mb-1">Nama Menu <span class="text-red-600">*</span></label>
     <input type="text" name="nama_menu" value="{{ old('nama_menu') }}" class="brutal-input" required>
     @error('nama_menu') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
   </div>
   <div class="flex gap-3">
    <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">Simpan Menu</button>
    <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary brutal-shadow">Batal</button>
   </div>
  </form>
 </div>
</div>

{{-- TABEL DAFTAR MENU --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Menu</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $menus->total() }}</span> menu terdaftar
   </p>
  </div>

  {{-- Search --}}
  <form method="GET" action="{{ route('admin.menu.index') }}" class="flex gap-2">
   <input type="text" name="search" value="{{ request('search') }}"
    placeholder="Cari nama menu..."
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
     <th class="brutal-table-th text-xs">Nama Menu</th>
     <th class="brutal-table-th text-xs">Kategori</th>
     <th class="brutal-table-th text-xs">Sub-kategori</th>
     <th class="brutal-table-th text-xs text-center w-32">Status</th>
     <th class="brutal-table-th text-xs w-48 text-center">Aksi</th>
    </tr>
   </thead>
  <tbody>
   @forelse($menus as $menu)
   <tr class="hover:bg-gray-50">
    <td class="brutal-table-td font-bold">{{ $menu->nama_menu }}</td>
    <td class="brutal-table-td">{{ $menu->subKategori->kategori->nama_kategori ?? '-' }}</td>
    <td class="brutal-table-td">{{ $menu->subKategori->nama_sub_kategori ?? '-' }}</td>
    <td class="brutal-table-td text-center">
     <form action="{{ route('admin.menu.toggle-status', $menu->id_menu) }}" method="POST" class="inline-flex flex-col items-center gap-1">
      @csrf
      @method('PATCH')
      <span class="text-[10px] font-black tracking-wider {{ $menu->status === 'Aktif' ? 'text-green-600' : 'text-gray-500' }}">{{ $menu->status }}</span>
      <button type="submit" title="{{ $menu->status }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $menu->status === 'Aktif' ? 'bg-green-400' : 'bg-gray-300' }}">
       <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $menu->status === 'Aktif' ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
      </button>
     </form>
    </td>
    <td class="brutal-table-td text-center space-x-2">
     
     <!-- Edit Modal -->
     <div x-data="{ open: {{ $errors->any() && old('id_menu') == $menu->id_menu ? 'true' : 'false' }} }" class="inline-block">
      <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

      <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
       <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
        <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Menu</h2>
        <form action="{{ route('admin.menu.update', $menu->id_menu) }}" method="POST">
         @csrf
         @method('PUT')
         <input type="hidden" name="id_menu" value="{{ $menu->id_menu }}">
         <div class="mb-4">
          <label class="block font-extrabold mb-2 text-xs text-left">Sub-Kategori</label>
          <select name="id_sub_kategori" class="brutal-input bg-white" required>
           <option value="">-- Pilih Sub-Kategori --</option>
           @foreach($subKategoris as $sub)
            <option value="{{ $sub->id_sub_kategori }}" {{ (old('id_menu') == $menu->id_menu ? old('id_sub_kategori') : $menu->id_sub_kategori) == $sub->id_sub_kategori ? 'selected' : '' }}>
             {{ $sub->kategori->nama_kategori ?? '' }} - {{ $sub->nama_sub_kategori }}
            </option>
           @endforeach
          </select>
          @error('id_sub_kategori')
           @if(old('id_menu') == $menu->id_menu)
            <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span>
           @endif
          @enderror
         </div>
         <div class="mb-4">
          <label class="block font-extrabold mb-2 text-xs text-left">Nama Menu</label>
          <input type="text" name="nama_menu" value="{{ old('id_menu') == $menu->id_menu ? old('nama_menu') : $menu->nama_menu }}" class="brutal-input" required>
          @error('nama_menu') 
           @if(old('id_menu') == $menu->id_menu)
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

     <form action="{{ route('admin.menu.destroy', $menu->id_menu) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus menu ini?');">
      @csrf
      @method('DELETE')
      <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
     </form>
    </td>
   </tr>
   @empty
   <tr>
    <td colspan="5" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data menu.</td>
   </tr>
   @endforelse
  </tbody>
 </table>
</div>

@if($menus->hasPages())
 <div class="p-5 border-t-4 border-black">
  {{ $menus->links() }}
 </div>
@endif
</div>
@endsection

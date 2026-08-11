@extends('layouts.admin')
@section('title', 'Menu Produk')

@section('content')
{{-- MODAL TAMBAH MENU --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_menu') ? 'true' : 'false' }} }" class="mb-6">
 <button @click="openForm = true"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Tambah Menu Baru</span>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M12 4v16m8-8H4"></path>
  </svg>
 </button>

 <div x-show="openForm" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
  <div @click.away="openForm = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
   <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Tambah Menu Baru</h2>
   <form action="{{ route('admin.menu.store') }}" method="POST">
    @csrf
    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1">Sub-Kategori <span class="text-red-600">*</span></label>
     
     <!-- Komponen Modal Pemilih Sub-Kategori -->
     <div x-data="{
        openPicker: false, search: '', items: [], loading: false,
        selectedId: '{{ old('id_sub_kategori') }}', selectedName: '{{ old('id_sub_kategori') ? ($subKategoris->where('id_sub_kategori', old('id_sub_kategori'))->first() ? ($subKategoris->where('id_sub_kategori', old('id_sub_kategori'))->first()->kategori->nama_kategori . ' - ' . $subKategoris->where('id_sub_kategori', old('id_sub_kategori'))->first()->nama_sub_kategori) : '') : '' }}',
        fetchData() {
            this.loading = true;
            fetch('{{ route('admin.ajax.sub-kategori') }}?search=' + this.search)
                .then(res => res.json())
                .then(data => { this.items = data.data; this.loading = false; });
        },
        selectItem(item) {
            this.selectedId = item.id_sub_kategori;
            this.selectedName = item.label_lengkap;
            this.openPicker = false;
        }
     }">
      <input type="hidden" name="id_sub_kategori" :value="selectedId">
      <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
       <span x-text="selectedName || '-- Pilih Sub-Kategori (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </button>

      <!-- Modal List Sub-Kategori (zIndex > modal utama) -->
      <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
       <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h3 class="font-extrabold mb-3">Pilih Sub-Kategori</h3>
        <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Ketik untuk mencari...">
        <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
         <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
         <template x-for="item in items" :key="item.id_sub_kategori">
          <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
           <span x-text="item.nama_sub_kategori" class="text-brutal-black"></span>
           <span x-text="item.nama_kategori" class="text-[10px] text-gray-500"></span>
          </button>
         </template>
         <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada sub-kategori.</div>
        </div>
        <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
       </div>
      </div>
     </div>
     @error('id_sub_kategori') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
    
    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1">Nama Menu <span class="text-red-600">*</span></label>
     <input type="text" name="nama_menu" value="{{ old('nama_menu') }}" class="brutal-input" required>
     @error('nama_menu') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>

    <div class="flex gap-4 mt-6">
     <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Menu</button>
     <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary">Batal</button>
    </div>
   </form>
  </div>
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

  <form method="GET" action="{{ route('admin.menu.index') }}" class="flex gap-2">
   <select name="status" class="brutal-input text-sm w-32" onchange="this.form.submit()">
    <option value="Aktif" {{ request('status', 'Aktif') == 'Aktif' ? 'selected' : '' }}>Aktif</option>
    <option value="Nonaktif" {{ request('status') == 'Nonaktif' ? 'selected' : '' }}>Nonaktif</option>
    <option value="Semua" {{ request('status') == 'Semua' ? 'selected' : '' }}>Semua</option>
   </select>
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
           <!-- Komponen Modal Pemilih Sub-Kategori (Edit) -->
           <div x-data="{
              openPicker: false, search: '', items: [], loading: false,
              selectedId: '{{ old('id_menu') == $menu->id_menu ? old('id_sub_kategori') : $menu->id_sub_kategori }}',
              selectedName: '{{ old('id_menu') == $menu->id_menu ? ($subKategoris->where('id_sub_kategori', old('id_sub_kategori'))->first() ? ($subKategoris->where('id_sub_kategori', old('id_sub_kategori'))->first()->kategori->nama_kategori . ' - ' . $subKategoris->where('id_sub_kategori', old('id_sub_kategori'))->first()->nama_sub_kategori) : '') : ($menu->subKategori ? ($menu->subKategori->kategori->nama_kategori . ' - ' . $menu->subKategori->nama_sub_kategori) : '') }}',
              fetchData() {
                  this.loading = true;
                  fetch('{{ route('admin.ajax.sub-kategori') }}?search=' + this.search)
                      .then(res => res.json())
                      .then(data => { this.items = data.data; this.loading = false; });
              },
              selectItem(item) {
                  this.selectedId = item.id_sub_kategori;
                  this.selectedName = item.label_lengkap;
                  this.openPicker = false;
              }
           }">
            <input type="hidden" name="id_sub_kategori" :value="selectedId">
            <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
             <span x-text="selectedName || '-- Pilih Sub-Kategori (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>

            <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
             <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
              <h3 class="font-extrabold mb-3">Pilih Sub-Kategori</h3>
              <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Ketik untuk mencari...">
              <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
               <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
               <template x-for="item in items" :key="item.id_sub_kategori">
                <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
                 <span x-text="item.nama_sub_kategori" class="text-brutal-black"></span>
                 <span x-text="item.nama_kategori" class="text-[10px] text-gray-500"></span>
                </button>
               </template>
               <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada sub-kategori.</div>
              </div>
              <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
             </div>
            </div>
           </div>
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

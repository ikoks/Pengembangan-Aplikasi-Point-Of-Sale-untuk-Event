@extends('layouts.admin')
@section('title', 'Sub-Kategori')

@section('content')
{{-- MODAL TAMBAH SUB-KATEGORI --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_sub_kategori') ? 'true' : 'false' }} }" class="mb-6">
 <button @click="openForm = true"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Tambah Sub-Kategori Baru</span>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M12 4v16m8-8H4"></path>
  </svg>
 </button>

 <div x-show="openForm" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
  <div @click.away="openForm = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
   <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Tambah Sub-Kategori Baru</h2>
   <form action="{{ route('admin.sub-kategori.store') }}" method="POST">
    @csrf
    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1">Kategori Induk <span class="text-red-600">*</span></label>
     
     <!-- Komponen Modal Pemilih Kategori -->
     <div x-data="{
        openPicker: false, search: '', items: [], loading: false,
        selectedId: '{{ old('id_kategori') }}', selectedName: '{{ old('id_kategori') ? $kategoris->where('id_kategori', old('id_kategori'))->first()->nama_kategori ?? '' : '' }}',
        fetchData() {
            this.loading = true;
            fetch('{{ route('admin.ajax.kategori') }}?search=' + this.search)
                .then(res => res.json())
                .then(data => { this.items = data.data; this.loading = false; });
        },
        selectItem(item) {
            this.selectedId = item.id_kategori;
            this.selectedName = item.nama_kategori;
            this.openPicker = false;
        }
     }">
      <input type="hidden" name="id_kategori" :value="selectedId">
      <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
       <span x-text="selectedName || '-- Pilih Kategori (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </button>

      <!-- Modal List Kategori (zIndex > modal utama) -->
      <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
       <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h3 class="font-extrabold mb-3">Pilih Kategori Induk</h3>
        <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Ketik untuk mencari...">
        <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
         <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
         <template x-for="item in items" :key="item.id_kategori">
          <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors">
           <span x-text="item.nama_kategori"></span>
          </button>
         </template>
         <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada kategori.</div>
        </div>
        <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
       </div>
      </div>
     </div>
     @error('id_kategori') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>

    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1">Nama Sub-Kategori <span class="text-red-600">*</span></label>
     <input type="text" name="nama_sub_kategori" value="{{ old('nama_sub_kategori') }}" class="brutal-input" required>
     @error('nama_sub_kategori') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
     <p class="text-xs text-gray-500 font-bold mb-4">
      <span class="bg-yellow-100 border border-yellow-400 px-2 py-1 inline-block">ℹ Status default: <strong>Aktif</strong>. Bisa diubah via toggle di tabel.</span>
     </p>

     <div class="flex gap-4 mt-6">
     <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Sub-kategori</button>
     <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary">Batal</button>
    </div>
   </form>
  </div>
 </div>
</div>


{{-- TABEL DAFTAR SUB-KATEGORI --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Sub-kategori</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $subKategoris->total() }}</span> sub-kategori terdaftar
   </p>
  </div>

  <form method="GET" action="{{ route('admin.sub-kategori.index') }}" class="flex gap-2">
   <select name="status" class="brutal-input text-sm w-32" onchange="this.form.submit()">
    <option value="Aktif" {{ request('status', 'Aktif') == 'Aktif' ? 'selected' : '' }}>Aktif</option>
    <option value="Nonaktif" {{ request('status') == 'Nonaktif' ? 'selected' : '' }}>Nonaktif</option>
    <option value="Semua" {{ request('status') == 'Semua' ? 'selected' : '' }}>Semua</option>
   </select>
   <input type="text" name="search" value="{{ request('search') }}"
    placeholder="Cari nama sub-kategori..."
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
     <th class="brutal-table-th text-xs">Kategori</th>
     <th class="brutal-table-th text-xs">Sub-kategori</th>
     <th class="brutal-table-th text-xs">Status</th>
     <th class="brutal-table-th text-xs w-48 text-center">Aksi</th>
    </tr>
   </thead>
  <tbody>
   @forelse($subKategoris as $sub)
   <tr class="hover:bg-gray-50">
    <td class="brutal-table-td">{{ $sub->kategori->nama_kategori ?? '-' }}</td>
    <td class="brutal-table-td font-bold">{{ $sub->nama_sub_kategori }}</td>
    <td class="brutal-table-td">
      <form action="{{ route('admin.sub-kategori.toggle-status', $sub->id_sub_kategori) }}" method="POST" class="inline-flex flex-col items-center gap-1">
       @csrf
       @method('PATCH')
       <span class="text-[10px] font-black tracking-wider {{ $sub->status === 'Aktif' ? 'text-green-600' : 'text-gray-500' }}">{{ $sub->status }}</span>
       <button type="submit" title="{{ $sub->status }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $sub->status === 'Aktif' ? 'bg-green-400' : 'bg-gray-300' }}">
        <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $sub->status === 'Aktif' ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
       </button>
      </form>
    </td>
    <td class="brutal-table-td text-center space-x-2">
     
     <!-- Edit Modal -->
     <div x-data="{ open: {{ $errors->any() && old('id_sub_kategori') == $sub->id_sub_kategori ? 'true' : 'false' }} }" class="inline-block">
      <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

      <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
       <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
        <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Sub-Kategori</h2>
        <form action="{{ route('admin.sub-kategori.update', $sub->id_sub_kategori) }}" method="POST">
         @csrf
         @method('PUT')
         <input type="hidden" name="id_sub_kategori" value="{{ $sub->id_sub_kategori }}">
          <div class="mb-4">
           <label class="block font-extrabold mb-2 text-xs text-left">Kategori Induk</label>
           <!-- Komponen Modal Pemilih Kategori (Edit) -->
           <div x-data="{
              openPicker: false, search: '', items: [], loading: false,
              selectedId: '{{ old('id_sub_kategori') == $sub->id_sub_kategori ? old('id_kategori') : $sub->id_kategori }}',
              selectedName: '{{ old('id_sub_kategori') == $sub->id_sub_kategori ? ($kategoris->where('id_kategori', old('id_kategori'))->first()->nama_kategori ?? '') : ($sub->kategori->nama_kategori ?? '') }}',
              fetchData() {
                  this.loading = true;
                  fetch('{{ route('admin.ajax.kategori') }}?search=' + this.search)
                      .then(res => res.json())
                      .then(data => { this.items = data.data; this.loading = false; });
              },
              selectItem(item) {
                  this.selectedId = item.id_kategori;
                  this.selectedName = item.nama_kategori;
                  this.openPicker = false;
              }
           }">
            <input type="hidden" name="id_kategori" :value="selectedId">
            <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
             <span x-text="selectedName || '-- Pilih Kategori (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>

            <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
             <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
              <h3 class="font-extrabold mb-3">Pilih Kategori Induk</h3>
              <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Ketik untuk mencari...">
              <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
               <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
               <template x-for="item in items" :key="item.id_kategori">
                <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors">
                 <span x-text="item.nama_kategori"></span>
                </button>
               </template>
               <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada kategori.</div>
              </div>
              <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
             </div>
            </div>
           </div>
           @error('id_kategori')
            @if(old('id_sub_kategori') == $sub->id_sub_kategori)
             <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span>
            @endif
           @enderror
          </div>
         <div class="mb-4">
          <label class="block font-extrabold mb-2 text-xs text-left">Nama Sub-Kategori</label>
          <input type="text" name="nama_sub_kategori" value="{{ old('id_sub_kategori') == $sub->id_sub_kategori ? old('nama_sub_kategori') : $sub->nama_sub_kategori }}" class="brutal-input" required>
          @error('nama_sub_kategori') 
           @if(old('id_sub_kategori') == $sub->id_sub_kategori)
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

     <form action="{{ route('admin.sub-kategori.destroy', $sub->id_sub_kategori) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus sub-kategori ini?');">
      @csrf
      @method('DELETE')
      <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
     </form>
    </td>
   </tr>
   @empty
   <tr>
    <td colspan="3" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data sub-kategori.</td>
   </tr>
   @endforelse
  </tbody>
 </table>
</div>

@if($subKategoris->hasPages())
 <div class="p-5 border-t-4 border-black">
  {{ $subKategoris->links() }}
 </div>
@endif
</div>
@endsection

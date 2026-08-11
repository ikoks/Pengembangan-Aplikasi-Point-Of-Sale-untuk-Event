@extends('layouts.admin')
@section('title', 'Kasir')

@section('content')
{{-- MODAL TAMBAH KASIR --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_user') ? 'true' : 'false' }} }" class="mb-6">
 <button @click="openForm = true"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Tambah Kasir Baru</span>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M12 4v16m8-8H4"></path>
  </svg>
 </button>

 <div x-show="openForm" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
  <div @click.away="openForm = false" class="bg-white brutal-border brutal-shadow p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
   <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Tambah Kasir Baru</h2>
   <form action="{{ route('admin.pegawai.kasir.store') }}" method="POST">
    @csrf
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
     <div>
      <label class="block text-xs font-extrabold mb-1">Nama Lengkap <span class="text-red-600">*</span></label>
      <input type="text" name="nama_user" value="{{ old('nama_user') }}" class="brutal-input" required autofocus>
      @error('nama_user') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
     </div>
     <div>
      <label class="block text-xs font-extrabold mb-1">Username <span class="text-red-600">*</span></label>
      <input type="text" name="username" value="{{ old('username') }}" class="brutal-input" required>
      @error('username') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
     </div>
     {{-- Poin 6 & 9: PIN 6-digit plain-text --}}
     <div>
      <label class="block text-xs font-extrabold mb-1">
       PIN <span class="text-gray-500 font-normal">(6 digit angka)</span>
      </label>
      <input type="text" name="pin" value="{{ old('pin') }}" class="brutal-input font-mono" maxlength="6" pattern="[0-9]{6}" placeholder="123456">
      @error('pin') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
     </div>
     {{-- Pilih Cabang Modal Picker --}}
     <div>
      <label class="block text-xs font-extrabold mb-1">Cabang Penugasan <span class="text-gray-500 font-normal">(Opsional)</span></label>
      <div x-data="{
          openPicker: false, search: '', items: [], loading: false,
          selectedId: '{{ old('id_cabang') }}', selectedName: '{{ old('id_cabang') ? ($cabangs->where('id_cabang', old('id_cabang'))->first()->nama_cabang ?? '') : '' }}',
          fetchData() {
              this.loading = true;
              fetch('{{ route('admin.ajax.cabang') }}?search=' + this.search)
                  .then(res => res.json())
                  .then(data => { this.items = data.data; this.loading = false; });
          },
          selectItem(item) {
              this.selectedId = item.id_cabang;
              this.selectedName = item.nama_cabang;
              this.openPicker = false;
          },
          clearSelection() {
              this.selectedId = '';
              this.selectedName = '';
              this.openPicker = false;
          }
       }">
        <input type="hidden" name="id_cabang" :value="selectedId">
        <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
         <span x-text="selectedName || '-- Tidak Terikat Cabang (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>

        <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
         <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
          <h3 class="font-extrabold mb-3">Pilih Cabang</h3>
          <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari cabang...">
          <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
           <button type="button" @click="clearSelection()" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors text-red-600">
             -- Tidak Terikat Cabang --
           </button>
           <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
           <template x-for="item in items" :key="item.id_cabang">
            <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
             <span x-text="item.nama_cabang" class="text-brutal-black"></span>
             <span x-text="item.lokasi" class="text-[10px] text-gray-500"></span>
            </button>
           </template>
           <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada cabang.</div>
          </div>
          <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
         </div>
        </div>
      </div>
      @error('id_cabang') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
     </div>
    </div>
    <div class="flex gap-4 mt-6">
     <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Kasir</button>
     <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary">Batal</button>
    </div>
   </form>
  </div>
 </div>
</div>


{{-- TABEL DAFTAR KASIR --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Kasir</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $kasirs->total() }}</span> kasir terdaftar
   </p>
  </div>

  {{-- Search --}}
  <form method="GET" action="{{ route('admin.pegawai.kasir.index') }}" class="flex gap-2">
   <input type="text" name="search" value="{{ request('search') }}"
    placeholder="Cari kasir..."
    class="brutal-input text-sm w-48">
   <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm px-3">Cari</button>
  </form>
 </div>

 <div class="overflow-x-auto">
  <table class="w-full text-left border-collapse min-w-max">
   <thead class="bg-black text-white">
    <tr>
     <th class="brutal-table-th text-xs">Nama Kasir</th>
     <th class="brutal-table-th text-xs">Username</th>
     {{-- Poin 9: Kolom PIN tampil --}}
     <th class="brutal-table-th text-xs">PIN</th>
     <th class="brutal-table-th text-xs">Cabang</th>
     <th class="brutal-table-th text-xs">Status</th>
     <th class="brutal-table-th text-xs w-64 text-center">Aksi</th>
    </tr>
   </thead>
  <tbody>
   @forelse($kasirs as $kasir)
   <tr class="hover:bg-gray-50 border-b-2 border-brutal-black">
    <td class="brutal-table-td font-bold">{{ $kasir->nama_kasir }}</td>
    <td class="brutal-table-td">{{ $kasir->username }}</td>
    {{-- Poin 9: Tampilkan PIN plain-text --}}
    <td class="brutal-table-td">
     @if($kasir->pin)
      <span class="font-mono font-black bg-yellow-200 border-2 border-black px-2 py-0.5 text-sm tracking-widest">{{ $kasir->pin }}</span>
     @else
      <span class="text-gray-400 text-xs italic">—</span>
     @endif
    </td>
    <td class="brutal-table-td">{{ $kasir->cabang->nama_cabang ?? '-' }}</td>
    <td class="brutal-table-td text-center">
     <form action="{{ route('admin.pegawai.kasir.toggle-status', $kasir->id_kasir) }}" method="POST" class="inline-flex flex-col items-center gap-1">
      @csrf
      @method('PATCH')
      <span class="text-[10px] font-black tracking-wider {{ $kasir->status_aktif ? 'text-green-600' : 'text-gray-500' }}">{{ $kasir->status_aktif ? 'Aktif' : 'Nonaktif' }}</span>
      <button type="submit" title="{{ $kasir->status_aktif ? 'Aktif' : 'Nonaktif' }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $kasir->status_aktif ? 'bg-green-400' : 'bg-gray-300' }}">
       <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $kasir->status_aktif ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
      </button>
     </form>
    </td>
    <td class="brutal-table-td text-center">
     <div class="flex justify-center items-center gap-2">

      {{-- Edit Modal --}}
      <div x-data="{ open: {{ $errors->any() && old('id_user') == $kasir->id_kasir ? 'true' : 'false' }} }" class="inline-block">
       <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

       <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
        <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
         <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Kasir</h2>
         <form action="{{ route('admin.pegawai.kasir.update', $kasir->id_kasir) }}" method="POST">
          @csrf
          @method('PUT')
          <input type="hidden" name="id_user" value="{{ $kasir->id_kasir }}">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
           <div>
            <label class="block font-extrabold mb-2 text-xs text-left">Nama Lengkap</label>
            <input type="text" name="nama_user" value="{{ old('id_user') == $kasir->id_kasir ? old('nama_user') : $kasir->nama_kasir }}" class="brutal-input" required>
            @error('nama_user')
             @if(old('id_user') == $kasir->id_kasir)
              <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span>
             @endif
            @enderror
           </div>
           <div>
            <label class="block font-extrabold mb-2 text-xs text-left">Username</label>
            <input type="text" name="username" value="{{ old('id_user') == $kasir->id_kasir ? old('username') : $kasir->username }}" class="brutal-input" required>
            @error('username')
             @if(old('id_user') == $kasir->id_kasir)
              <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span>
             @endif
            @enderror
           </div>
           {{-- Poin 6 & 9: Edit PIN --}}
           <div>
            <label class="block font-extrabold mb-2 text-xs text-left">
             PIN <span class="text-gray-500 font-normal text-xs">(6 digit, kosongkan = tidak berubah)</span>
            </label>
            <input type="text" name="pin" value="{{ old('id_user') == $kasir->id_kasir ? old('pin') : $kasir->pin }}"
             class="brutal-input font-mono" maxlength="6" pattern="[0-9]{6}" placeholder="{{ $kasir->pin ?? '______' }}">
            @error('pin')
             @if(old('id_user') == $kasir->id_kasir)
              <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span>
             @endif
            @enderror
           </div>
           <div>
            <label class="block font-extrabold mb-2 text-xs text-left">Cabang Penugasan</label>
            <div x-data="{
                openPicker: false, search: '', items: [], loading: false,
                selectedId: '{{ old('id_user') == $kasir->id_kasir ? old('id_cabang') : $kasir->id_cabang }}',
                selectedName: '{{ old('id_user') == $kasir->id_kasir ? ($cabangs->where('id_cabang', old('id_cabang'))->first()->nama_cabang ?? '') : ($kasir->cabang->nama_cabang ?? '') }}',
                fetchData() {
                    this.loading = true;
                    fetch('{{ route('admin.ajax.cabang') }}?search=' + this.search)
                        .then(res => res.json())
                        .then(data => { this.items = data.data; this.loading = false; });
                },
                selectItem(item) {
                    this.selectedId = item.id_cabang;
                    this.selectedName = item.nama_cabang;
                    this.openPicker = false;
                },
                clearSelection() {
                    this.selectedId = '';
                    this.selectedName = '';
                    this.openPicker = false;
                }
             }">
              <input type="hidden" name="id_cabang" :value="selectedId">
              <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
               <span x-text="selectedName || '-- Tidak Terikat Cabang (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>

              <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
               <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
                <h3 class="font-extrabold mb-3">Pilih Cabang</h3>
                <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari cabang...">
                <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
                 <button type="button" @click="clearSelection()" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors text-red-600">
                   -- Tidak Terikat Cabang --
                 </button>
                 <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
                 <template x-for="item in items" :key="item.id_cabang">
                  <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
                   <span x-text="item.nama_cabang" class="text-brutal-black"></span>
                   <span x-text="item.lokasi" class="text-[10px] text-gray-500"></span>
                  </button>
                 </template>
                 <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada cabang.</div>
                </div>
                <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
               </div>
              </div>
            </div>
            @error('id_cabang')
             @if(old('id_user') == $kasir->id_kasir)
              <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span>
             @endif
            @enderror
           </div>
          </div>

          <div class="flex gap-4 mt-4">
           <button type="submit" class="brutal-btn brutal-btn-primary">Simpan</button>
           <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">Batal</button>
          </div>
         </form>
        </div>
       </div>
      </div>

      <form action="{{ route('admin.pegawai.kasir.destroy', $kasir->id_kasir) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus kasir ini?');">
       @csrf
       @method('DELETE')
       <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
      </form>
     </div>
    </td>
   </tr>
   @empty
   <tr>
    <td colspan="6" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data kasir.</td>
   </tr>
   @endforelse
  </tbody>
 </table>
</div>

@if($kasirs->hasPages())
 <div class="p-5 border-t-4 border-black">
  {{ $kasirs->links() }}
 </div>
@endif
</div>
@endsection

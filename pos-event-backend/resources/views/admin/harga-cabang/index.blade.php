@extends('layouts.admin')
@section('title', 'Harga Produk')

@section('content')

{{-- Poin 2: Form Tambah Harga Produk — TANPA Cabang, Sales Mode Single Select --}}
{{-- MODAL TAMBAH HARGA PRODUK --}}
<div class="mb-6" x-data="{ openForm: {{ session('errors') && !old('id_template') ? 'true' : 'false' }} }">
 <button @click="openForm = true"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Tambah Harga Produk Baru</span>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M12 4v16m8-8H4"></path>
  </svg>
 </button>

 <div x-show="openForm" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
  <div @click.away="openForm = false" class="bg-white brutal-border brutal-shadow p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
   <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Tambah Harga Produk Baru</h2>
   <form action="{{ route('admin.harga-cabang.store') }}" method="POST">
    @csrf
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
     {{-- Pilih Menu Modal Picker --}}
     <div>
      <label class="block text-xs font-extrabold mb-1">Pilih Menu <span class="text-red-600">*</span></label>
      <div x-data="{
          openPicker: false, search: '', items: [], loading: false,
          selectedId: '{{ old('id_menu') }}', selectedName: '{{ old('id_menu') ? ($menus->where('id_menu', old('id_menu'))->first() ? $menus->where('id_menu', old('id_menu'))->first()->nama_menu : '') : '' }}',
          fetchData() {
              this.loading = true;
              fetch('{{ route('admin.ajax.menu') }}?search=' + this.search)
                  .then(res => res.json())
                  .then(data => { this.items = data.data; this.loading = false; });
          },
          selectItem(item) {
              this.selectedId = item.id_menu;
              this.selectedName = item.label_lengkap;
              this.openPicker = false;
          }
       }">
        <input type="hidden" name="id_menu" :value="selectedId">
        <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
         <span x-text="selectedName || '-- Pilih Menu (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>

        <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
         <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-md w-full max-h-[80vh] flex flex-col">
          <h3 class="font-extrabold mb-3">Pilih Menu Produk</h3>
          <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari menu...">
          <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
           <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
           <template x-for="item in items" :key="item.id_menu">
            <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
             <span x-text="item.nama_menu" class="text-brutal-black"></span>
             <span x-text="item.sub_kategori" class="text-[10px] text-gray-500"></span>
            </button>
           </template>
           <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada menu.</div>
          </div>
          <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
         </div>
        </div>
      </div>
      @error('id_menu') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
     </div>

     {{-- Pilih Sales Mode Modal Picker --}}
     <div>
      <label class="block text-xs font-extrabold mb-1">Mode Penjualan <span class="text-red-600">*</span></label>
      <div x-data="{
           openPicker: false, search: '', items: [], loading: false,
           selectedId: '{{ old('id_sales') }}', selectedName: '{{ old('id_sales') ? ($salesModes->where('id_sales', old('id_sales'))->first()->nama_mode ?? '') : '' }}',
           init() { this.fetchData(); },
           fetchData() {
               this.loading = true;
               fetch('{{ route('admin.ajax.sales-mode') }}?search=' + this.search)
                   .then(res => res.json())
                   .then(data => { this.items = data.data; this.loading = false; });
           },
           selectItem(item) {
               this.selectedId = item.id_sales;
               this.selectedName = item.nama_mode || item.nama_sales;
               this.openPicker = false;
           }
        }">
        <input type="hidden" name="id_sales" :value="selectedId">
        <button type="button" @click="openPicker = true" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
         <span x-text="selectedName || '-- Pilih Mode (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>

        <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
         <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
          <h3 class="font-extrabold mb-3">Pilih Mode Penjualan</h3>
          <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari mode...">
          <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
           <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
           <template x-for="item in items" :key="item.id_sales">
            <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors">
             <span x-text="item.nama_mode || item.nama_sales"></span>
            </button>
           </template>
           <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada mode penjualan.</div>
          </div>
          <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
         </div>
        </div>
      </div>
      @error('id_sales') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
     </div>
    </div>

    {{-- Harga Produk --}}
    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1">Harga Produk (Rp) <span class="text-red-600">*</span></label>
     <input type="number" step="1" min="0" name="harga_produk" value="{{ old('harga_produk') }}" class="brutal-input" required placeholder="0">
     @error('harga_produk') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>

    <div class="flex gap-4 mt-6">
     <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Harga Produk</button>
     <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary">Batal</button>
    </div>
   </form>
  </div>
 </div>
</div>


{{-- TABEL DAFTAR HARGA PRODUK --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Harga Produk</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $templates->total() }}</span> harga terdaftar
   </p>
   @if($activeSalesMode)
    <div class="mt-2 inline-flex items-center gap-2 bg-yellow-200 border-2 border-black px-3 py-1">
     <span class="text-xs font-black">Filter Mode:</span>
     <span class="text-sm font-black">{{ $activeSalesMode->nama_mode }}</span>
     <a href="{{ route('admin.harga-cabang.index') }}" class="text-xs text-red-600 font-black underline ml-1">× Hapus Filter</a>
    </div>
   @endif
  </div>

  {{-- Search & Filter --}}
  <form method="GET" action="{{ route('admin.harga-cabang.index') }}" class="flex flex-wrap gap-2">
   @if(request('id_sales'))
    <input type="hidden" name="id_sales" value="{{ request('id_sales') }}">
   @endif
   <select name="id_sales" class="brutal-input text-sm w-48 bg-white" onchange="this.form.submit()">
    <option value="">-- Semua Mode --</option>
    @foreach($salesModes as $sm)
     <option value="{{ $sm->id_sales }}" {{ request('id_sales') == $sm->id_sales ? 'selected' : '' }}>{{ $sm->nama_mode }}</option>
    @endforeach
   </select>
   <input type="text" name="search" value="{{ request('search') }}"
    placeholder="Cari menu..."
    class="brutal-input text-sm w-40">
   <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm px-3">Cari</button>
  </form>
 </div>

 <div class="overflow-x-auto">
  <table class="w-full text-left border-collapse min-w-max">
   <thead class="bg-black text-white">
    <tr>
     <th class="brutal-table-th text-xs">Menu</th>
     <th class="brutal-table-th text-xs">Mode Penjualan</th>
     <th class="brutal-table-th text-xs">HARGA (Rp)</th>
     <th class="brutal-table-th text-xs w-36 text-center">Aksi</th>
    </tr>
   </thead>
   <tbody>
    @forelse($templates as $tpl)
    <tr class="hover:bg-gray-50 border-b-2 border-brutal-black">
     <td class="brutal-table-td font-bold">{{ $tpl->menu->nama_menu ?? '-' }}</td>
     <td class="brutal-table-td">
      <span class="inline-block px-2 py-1 text-xs font-black bg-yellow-200 border-2 border-black">
       {{ $tpl->salesMode->nama_mode ?? '-' }}
      </span>
     </td>
     <td class="brutal-table-td font-mono font-bold">Rp {{ number_format($tpl->harga_produk, 0, ',', '.') }}</td>
     <td class="brutal-table-td text-center space-x-2">
      {{-- Edit Modal --}}
      <div x-data="{ open: {{ $errors->any() && old('id_template') == $tpl->id_template ? 'true' : 'false' }} }" class="inline-block">
       <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

       <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
        <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-lg w-full">
         <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Harga Produk</h2>
         <form action="{{ route('admin.harga-cabang.update', $tpl->id_template) }}" method="POST">
          @csrf
          @method('PUT')
          <input type="hidden" name="id_template" value="{{ $tpl->id_template }}">

          <div class="mb-4">
           <label class="block font-extrabold mb-2 text-xs">Pilih Menu</label>
           <!-- Komponen Modal Pemilih Menu (Edit) -->
           <div x-data="{
              openPicker: false, search: '', items: [], loading: false,
              selectedId: '{{ old('id_template') == $tpl->id_template ? old('id_menu') : $tpl->id_menu }}',
              selectedName: '{{ old('id_template') == $tpl->id_template ? ($menus->where('id_menu', old('id_menu'))->first() ? $menus->where('id_menu', old('id_menu'))->first()->nama_menu : '') : ($tpl->menu->nama_menu ?? '') }}',
              fetchData() {
                  this.loading = true;
                  fetch('{{ route('admin.ajax.menu') }}?search=' + this.search)
                      .then(res => res.json())
                      .then(data => { this.items = data.data; this.loading = false; });
              },
              selectItem(item) {
                  this.selectedId = item.id_menu;
                  this.selectedName = item.label_lengkap;
                  this.openPicker = false;
              }
           }">
            <input type="hidden" name="id_menu" :value="selectedId">
            <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
             <span x-text="selectedName || '-- Pilih Menu (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>

            <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
             <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
              <h3 class="font-extrabold mb-3">Pilih Menu Produk</h3>
              <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari menu...">
              <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
               <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
               <template x-for="item in items" :key="item.id_menu">
                <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
                 <span x-text="item.nama_menu" class="text-brutal-black"></span>
                 <span x-text="item.sub_kategori" class="text-[10px] text-gray-500"></span>
                </button>
               </template>
               <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada menu.</div>
              </div>
              <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
             </div>
            </div>
           </div>
          </div>

          <div class="mb-4">
           <label class="block font-extrabold mb-2 text-xs">Mode Penjualan</label>
           <!-- Komponen Modal Pemilih Sales Mode (Edit) -->
           <div x-data="{
               openPicker: false, search: '', items: [], loading: false,
               selectedId: '{{ old('id_template') == $tpl->id_template ? old('id_sales') : $tpl->id_sales }}',
               selectedName: '{{ old('id_template') == $tpl->id_template ? ($salesModes->where('id_sales', old('id_sales'))->first()->nama_mode ?? '') : ($tpl->salesMode->nama_mode ?? '') }}',
               init() { this.fetchData(); },
               fetchData() {
                   this.loading = true;
                   fetch('{{ route('admin.ajax.sales-mode') }}?search=' + this.search)
                       .then(res => res.json())
                       .then(data => { this.items = data.data; this.loading = false; });
               },
               selectItem(item) {
                   this.selectedId = item.id_sales;
                   this.selectedName = item.nama_mode || item.nama_sales;
                   this.openPicker = false;
               }
            }">
            <input type="hidden" name="id_sales" :value="selectedId">
            <button type="button" @click="openPicker = true" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
             <span x-text="selectedName || '-- Pilih Mode (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>

            <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
             <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
              <h3 class="font-extrabold mb-3">Pilih Mode Penjualan</h3>
              <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari mode...">
              <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
               <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
               <template x-for="item in items" :key="item.id_sales">
                <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors">
                 <span x-text="item.nama_mode || item.nama_sales"></span>
                </button>
               </template>
               <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada mode penjualan.</div>
              </div>
              <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
             </div>
            </div>
           </div>
           @error('id_sales')
            @if(old('id_template') == $tpl->id_template)
             <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span>
            @endif
           @enderror
          </div>

          <div class="mb-4">
           <label class="block font-extrabold mb-2 text-xs">Harga Produk (Rp)</label>
           <input type="number" step="1" min="0" name="harga_produk"
            value="{{ old('id_template') == $tpl->id_template ? old('harga_produk') : (float)$tpl->harga_produk }}"
            class="brutal-input" required>
           @error('harga_produk')
            @if(old('id_template') == $tpl->id_template)
             <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span>
            @endif
           @enderror
          </div>

          <div class="flex gap-4 mt-6">
           <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Perubahan</button>
           <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">Batal</button>
          </div>
         </form>
        </div>
       </div>
      </div>

      <form action="{{ route('admin.harga-cabang.destroy', $tpl->id_template) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus harga ini?');">
       @csrf
       @method('DELETE')
       <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
      </form>
     </td>
    </tr>
    @empty
    <tr>
     <td colspan="4" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data harga produk.</td>
    </tr>
    @endforelse
   </tbody>
  </table>
 </div>

 @if($templates->hasPages())
  <div class="p-5 border-t-4 border-black">
   {{ $templates->links() }}
  </div>
 @endif
</div>
@endsection

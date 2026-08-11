@extends('layouts.admin')

@section('title', 'Metode Pembayaran')

@section('content')

{{-- MODAL TAMBAH METODE PEMBAYARAN --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_metode') ? 'true' : 'false' }} }" class="mb-6">
    <button @click="openForm = true" class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
        <span>Tambah Metode Pembayaran Baru</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
    </button>
    <div x-show="openForm" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
        <div @click.away="openForm = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Tambah Metode Pembayaran Baru</h2>
            <form action="{{ route('admin.metode-pembayaran.store') }}" method="POST">
                @csrf
                <div class="mb-4">
                    <label class="block text-xs font-extrabold mb-1">Nama Metode <span class="text-red-500">*</span></label>
                    <input type="text" name="nama_metode" value="{{ old('nama_metode') }}" 
                        class="brutal-input" required placeholder="Contoh: Cash, QRIS Dynamic, GoPay..." autocomplete="off">
                    @error('nama_metode') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>

                <div class="mb-4">
                    <label class="block text-xs font-extrabold mb-1">Kategori Metode <span class="text-red-500">*</span></label>
                    <div x-data="{
                        openPicker: false, search: '', items: [], loading: false,
                        selectedId: '{{ old('id_kategori_metode') }}', selectedName: '{{ old('id_kategori_metode') ? ($kategoriMetodes->where('id_kategori_metode', old('id_kategori_metode'))->first()->nama_kategori ?? '') : '' }}',
                        init() { this.fetchData(); },
                        fetchData() {
                            this.loading = true;
                            fetch('{{ route('admin.ajax.kategori-pembayaran') }}?search=' + this.search)
                                .then(res => res.json())
                                .then(data => { this.items = data.data; this.loading = false; });
                        },
                        selectItem(item) {
                            this.selectedId = item.id_kategori_metode;
                            this.selectedName = item.nama_kategori;
                            this.openPicker = false;
                        }
                     }">
                      <input type="hidden" name="id_kategori_metode" :value="selectedId">
                      <button type="button" @click="openPicker = true" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
                       <span x-text="selectedName || '-- Pilih Kategori (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </button>

                      <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
                       <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
                        <h3 class="font-extrabold mb-3">Pilih Kategori</h3>
                        <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari kategori...">
                        <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
                         <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
                         <template x-for="item in items" :key="item.id_kategori_metode">
                          <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
                           <span x-text="item.nama_kategori" class="text-brutal-black"></span>
                          </button>
                         </template>
                         <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada kategori.</div>
                        </div>
                        <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
                       </div>
                      </div>
                    </div>
                    @error('id_kategori_metode') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>

                <p class="text-xs text-gray-500 font-bold mb-4">
                    <span class="bg-yellow-100 border border-yellow-400 px-2 py-1 inline-block">ℹ Status default: <strong>Aktif</strong>. Bisa diubah via toggle di tabel.</span>
                </p>

                <div class="flex gap-4 mt-6">
                    <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Metode Pembayaran</button>
                    <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary">Batal</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Table Data -->
<div id="data-container" class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl tracking-tight">Daftar Metode Pembayaran</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $metodePembayaran->total() }}</span> metode terdaftar
            </p>
        </div>

        <form method="GET" action="{{ route('admin.metode-pembayaran.index') }}" class="flex gap-2">
            <select name="status" class="brutal-input text-sm w-32" onchange="this.form.submit()">
             <option value="Aktif" {{ request('status', 'Aktif') == 'Aktif' ? 'selected' : '' }}>Aktif</option>
             <option value="Nonaktif" {{ request('status') == 'Nonaktif' ? 'selected' : '' }}>Nonaktif</option>
             <option value="Semua" {{ request('status') == 'Semua' ? 'selected' : '' }}>Semua</option>
            </select>
            <input type="text" name="search" value="{{ request('search') }}"
                placeholder="Cari nama metode..."
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
                    <th class="brutal-table-th text-xs">Nama Metode</th>
                    <th class="brutal-table-th text-xs">Kategori Metode</th>
                    <th class="brutal-table-th text-xs">Status</th>
                    <th class="brutal-table-th text-xs w-48 text-center">Aksi</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($metodePembayaran as $item)
                <tr class="hover:bg-gray-50">
                    <td class="brutal-table-td font-bold">{{ $item->nama_metode }}</td>
                    <td class="brutal-table-td font-bold">
                        <span class="inline-block px-2 py-1 bg-gray-200 border-2 border-brutal-black text-xs font-black shadow-sm">
                            {{ $item->kategoriMetode?->nama_kategori ?? '-' }}
                        </span>
                    </td>
                    <td class="brutal-table-td">
                      <form action="{{ route('admin.metode-pembayaran.toggle-status', $item->id_metode) }}" method="POST" class="inline-flex flex-col items-center gap-1">
                       @csrf
                       @method('PATCH')
                       <span class="text-[10px] font-black tracking-wider {{ $item->status === 'Aktif' ? 'text-green-600' : 'text-gray-500' }}">{{ $item->status }}</span>
                       <button type="submit" title="{{ $item->status }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $item->status === 'Aktif' ? 'bg-green-400' : 'bg-gray-300' }}">
                        <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $item->status === 'Aktif' ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
                       </button>
                      </form>
                    </td>
                    <td class="brutal-table-td text-center space-x-2">

                        {{-- Edit Modal (per baris) --}}
                        <div x-data="{ 
                            open: {{ $errors->any() && old('id_metode') == $item->id_metode ? 'true' : 'false' }},
                            selectedKatId: '{{ $item->id_kategori_metode }}',
                            selectedKatName: '{{ addslashes($item->kategoriMetode?->nama_kategori ?? '') }}',
                            openPicker: false, search: '', items: [], loading: false,
                            init() { this.fetchKategori(); },
                            fetchKategori() {
                                this.loading = true;
                                fetch('{{ route('admin.ajax.kategori-pembayaran') }}?search=' + this.search)
                                    .then(res => res.json())
                                    .then(data => { this.items = data.data; this.loading = false; });
                            },
                            selectKat(item) {
                                this.selectedKatId = item.id_kategori_metode;
                                this.selectedKatName = item.nama_kategori;
                                this.openPicker = false;
                            }
                        }" class="inline-block">
                            <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

                            <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
                                <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full relative">
                                    <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Metode Pembayaran</h2>
                                    <form action="{{ route('admin.metode-pembayaran.update', $item->id_metode) }}" method="POST">
                                        @csrf
                                        @method('PUT')
                                        <input type="hidden" name="id_metode" value="{{ $item->id_metode }}">
                                        
                                        <div class="mb-4">
                                            <label class="block font-extrabold mb-2 text-xs">Nama Metode <span class="text-red-500">*</span></label>
                                            <input type="text" name="nama_metode" 
                                                value="{{ old('id_metode') == $item->id_metode ? old('nama_metode') : $item->nama_metode }}" 
                                                class="brutal-input" required autocomplete="off">
                                            @error('nama_metode') 
                                                @if(old('id_metode') == $item->id_metode)
                                                    <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span>
                                                @endif
                                            @enderror
                                        </div>

                                        <div class="mb-4">
                                            <label class="block font-extrabold mb-2 text-xs">Kategori Metode <span class="text-red-500">*</span></label>
                                            <input type="hidden" name="id_kategori_metode" :value="selectedKatId">
                                            <button type="button" @click="openPicker = true" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
                                             <span x-text="selectedKatName || '-- Pilih Kategori --'" :class="!selectedKatName ? 'text-gray-500' : ''"></span>
                                             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                            </button>

                                            <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
                                             <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
                                              <h3 class="font-extrabold mb-3">Pilih Kategori</h3>
                                              <input type="text" x-model="search" @input.debounce.300ms="fetchKategori()" class="brutal-input text-sm mb-4" placeholder="Cari kategori...">
                                              <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
                                               <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
                                               <template x-for="item in items" :key="item.id_kategori_metode">
                                                <button type="button" @click="selectKat(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
                                                 <span x-text="item.nama_kategori" class="text-brutal-black"></span>
                                                </button>
                                               </template>
                                               <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada kategori.</div>
                                              </div>
                                              <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
                                             </div>
                                            </div>
                                            @error('id_kategori_metode')
                                                @if(old('id_metode') == $item->id_metode)
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

                        <form action="{{ route('admin.metode-pembayaran.destroy', $item->id_metode) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Apakah Anda yakin ingin menghapus metode pembayaran ini?');">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="4" class="brutal-table-td text-center py-8 text-gray-500 font-bold">
                        Belum ada data metode pembayaran.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    
    @if($metodePembayaran->hasPages())
    <div class="p-4 border-t-4 border-brutal-black bg-gray-50">
        {{ $metodePembayaran->links() }}
    </div>
    @endif
</div>
@endsection

@extends('layouts.admin')
@section('title', 'Master Harga Produk')

@section('content')
{{-- FORM TAMBAH HARGA CABANG (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_template') ? 'true' : 'false' }} }" class="mb-6">
    <button @click="openForm = !openForm"
        class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
        <span>+ TAMBAH HARGA PRODUK BARU</span>
        <svg :class="openForm ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path>
        </svg>
    </button>

    <div x-show="openForm" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
        <form action="{{ route('admin.harga-cabang.store') }}" method="POST">
            @csrf
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Pilih Menu <span class="text-red-600">*</span></label>
                    <select name="id_menu" class="brutal-input bg-white" required>
                        <option value="">-- Pilih Menu --</option>
                        @foreach($menus as $menu)
                            <option value="{{ $menu->id_menu }}" {{ old('id_menu') == $menu->id_menu ? 'selected' : '' }}>
                                {{ $menu->nama_menu }}
                            </option>
                        @endforeach
                    </select>
                    @error('id_menu') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>
                <div class="col-span-1 md:col-span-2" x-data="{ 
                    checkAll: false,
                    toggleAll() {
                        this.checkAll = !this.checkAll;
                        document.querySelectorAll('.cabang-harga-cb').forEach(cb => cb.checked = this.checkAll);
                    }
                }">
                    <div class="flex justify-between items-center mb-1">
                        <label class="block text-xs font-extrabold uppercase">Pilih Cabang / Event <span class="text-red-600">*</span></label>
                        <button type="button" @click="toggleAll()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                            [ <span x-text="checkAll ? 'Batal Pilih Semua' : 'Pilih Semua Cabang'"></span> ]
                        </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border-2 border-black p-3 bg-white max-h-40 overflow-y-auto brutal-shadow-sm">
                        @foreach($cabangs as $cabang)
                            <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                <input type="checkbox" name="id_cabang[]" value="{{ $cabang->id_cabang }}" 
                                    class="cabang-harga-cb brutal-checkbox"
                                    {{ is_array(old('id_cabang')) && in_array($cabang->id_cabang, old('id_cabang')) ? 'checked' : '' }}>
                                <span>{{ $cabang->nama_cabang }}</span>
                            </label>
                        @endforeach
                    </div>
                    @error('id_cabang') <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Pilih Sales Mode <span class="text-red-600">*</span></label>
                    <select name="id_sales" class="brutal-input bg-white" required>
                        <option value="">-- Pilih Sales Mode --</option>
                        @foreach($salesModes as $mode)
                            <option value="{{ $mode->id_sales }}" {{ old('id_sales') == $mode->id_sales ? 'selected' : '' }}>
                                {{ $mode->nama_mode }}
                            </option>
                        @endforeach
                    </select>
                    @error('id_sales') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Harga Produk (Rp) <span class="text-red-600">*</span></label>
                    <input type="number" step="0.01" name="harga_produk" value="{{ old('harga_produk') }}" class="brutal-input" required>
                    @error('harga_produk') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">SIMPAN HARGA PRODUK</button>
                <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary brutal-shadow">BATAL</button>
            </div>
        </form>
    </div>
</div>

{{-- TABEL DAFTAR HARGA PRODUK --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl uppercase tracking-tight">DAFTAR HARGA PRODUK</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $templates->total() }}</span> harga produk terdaftar
            </p>
        </div>

        {{-- Search --}}
        <form method="GET" action="{{ route('admin.harga-cabang.index') }}" class="flex gap-2">
            <input type="text" name="search" value="{{ request('search') }}"
                placeholder="Cari menu / cabang..."
                class="brutal-input text-sm w-48">
            <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm px-3">
                CARI
            </button>
        </form>
    </div>

    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-max">
            <thead class="bg-black text-white">
                <tr>
                    <th class="brutal-table-th text-xs">MENU</th>
                    <th class="brutal-table-th text-xs">CABANG</th>
                    <th class="brutal-table-th text-xs">SALES MODE</th>
                    <th class="brutal-table-th text-xs">HARGA (Rp)</th>
                    <th class="brutal-table-th text-xs w-48 text-center">AKSI</th>
                </tr>
            </thead>
        <tbody>
            @forelse($templates as $tpl)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $tpl->menu->nama_menu ?? '-' }}</td>
                <td class="brutal-table-td">{{ $tpl->cabang->nama_cabang ?? '-' }}</td>
                <td class="brutal-table-td">{{ $tpl->salesMode->nama_mode ?? '-' }}</td>
                <td class="brutal-table-td">{{ number_format($tpl->harga_produk, 0, ',', '.') }}</td>
                <td class="brutal-table-td text-center space-x-2">
                    <!-- Edit Modal -->
                    <div x-data="{ open: {{ $errors->any() && old('id_template') == $tpl->id_template ? 'true' : 'false' }} }" class="inline-block">
                        <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</button>

                        <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left overflow-y-auto">
                            <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full my-8">
                                <h2 class="text-xl font-black uppercase mb-4 border-b-2 border-brutal-black pb-2">Edit Harga Produk</h2>
                                <form action="{{ route('admin.harga-cabang.update', $tpl->id_template) }}" method="POST">
                                    @csrf
                                    @method('PUT')
                                    <input type="hidden" name="id_template" value="{{ $tpl->id_template }}">
                                    
                                    <div class="mb-4">
                                        <label class="block font-extrabold mb-2 uppercase text-xs text-left">Pilih Menu</label>
                                        <select name="id_menu" class="brutal-input bg-white" required>
                                            @foreach($menus as $menu)
                                                <option value="{{ $menu->id_menu }}" {{ (old('id_template') == $tpl->id_template ? old('id_menu') : $tpl->id_menu) == $menu->id_menu ? 'selected' : '' }}>
                                                    {{ $menu->nama_menu }}
                                                </option>
                                            @endforeach
                                        </select>
                                    </div>

                                    <div class="mb-4" x-data="{ 
                                        checkAll: false,
                                        toggleAll() {
                                            this.checkAll = !this.checkAll;
                                            $el.querySelectorAll('.cabang-harga-edit-cb').forEach(cb => cb.checked = this.checkAll);
                                        }
                                    }">
                                        <div class="flex justify-between items-center mb-1">
                                            <label class="block font-extrabold uppercase text-xs text-left">Pilih Cabang / Event <span class="text-red-600">*</span></label>
                                            <button type="button" @click="toggleAll()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                                                [ <span x-text="checkAll ? 'Batal Pilih Semua' : 'Pilih Semua Cabang'"></span> ]
                                            </button>
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 border-2 border-black p-3 bg-white max-h-36 overflow-y-auto brutal-shadow-sm text-left">
                                            @foreach($cabangs as $cabang)
                                                <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                                    <input type="checkbox" name="id_cabang[]" value="{{ $cabang->id_cabang }}" 
                                                        class="cabang-harga-edit-cb brutal-checkbox"
                                                        {{ (old('id_template') == $tpl->id_template && is_array(old('id_cabang')) && in_array($cabang->id_cabang, old('id_cabang'))) || $tpl->id_cabang == $cabang->id_cabang ? 'checked' : '' }}>
                                                    <span>{{ $cabang->nama_cabang }}</span>
                                                </label>
                                            @endforeach
                                        </div>
                                    </div>

                                    <div class="mb-4">
                                        <label class="block font-extrabold mb-2 uppercase text-xs text-left">Pilih Sales Mode</label>
                                        <select name="id_sales" class="brutal-input bg-white" required>
                                            @foreach($salesModes as $mode)
                                                <option value="{{ $mode->id_sales }}" {{ (old('id_template') == $tpl->id_template ? old('id_sales') : $tpl->id_sales) == $mode->id_sales ? 'selected' : '' }}>
                                                    {{ $mode->nama_mode }}
                                                </option>
                                            @endforeach
                                        </select>
                                    </div>

                                    <div class="mb-4">
                                        <label class="block font-extrabold mb-2 uppercase text-xs text-left">Harga Produk (Rp)</label>
                                        <input type="number" step="0.01" name="harga_produk" 
                                            value="{{ old('id_template') == $tpl->id_template ? old('harga_produk') : (float)$tpl->harga_produk }}" 
                                            class="brutal-input" required>
                                    </div>

                                    <div class="flex gap-4 mt-6">
                                        <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN PERUBAHAN</button>
                                        <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">BATAL</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <form action="{{ route('admin.harga-cabang.destroy', $tpl->id_template) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus harga ini?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data harga produk.</td>
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

@extends('layouts.admin')
@section('title', 'Master Promosi')

@section('content')
{{-- FORM TAMBAH PROMOSI (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_promo') ? 'true' : 'false' }} }" class="mb-6">
    <button @click="openForm = !openForm"
        class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
        <span>+ TAMBAH PROMOSI BARU</span>
        <svg :class="openForm ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path>
        </svg>
    </button>

    <div x-show="openForm" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
        <form action="{{ route('admin.promosi.store') }}" method="POST">
            @csrf
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="col-span-1 md:col-span-2" x-data="{ 
                    checkAll: false,
                    toggleAll() {
                        this.checkAll = !this.checkAll;
                        document.querySelectorAll('.cabang-promo-cb').forEach(cb => cb.checked = this.checkAll);
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
                                    class="cabang-promo-cb brutal-checkbox"
                                    {{ is_array(old('id_cabang')) && in_array($cabang->id_cabang, old('id_cabang')) ? 'checked' : '' }}>
                                <span>{{ $cabang->nama_cabang }}</span>
                            </label>
                        @endforeach
                    </div>
                    @error('id_cabang') <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Nama Promosi <span class="text-red-600">*</span></label>
                    <input type="text" name="nama_promo" value="{{ old('nama_promo') }}" class="brutal-input" required>
                    @error('nama_promo') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Tipe Promosi <span class="text-red-600">*</span></label>
                    <select name="tipe_promo" class="brutal-input bg-white" required>
                        <option value="Nominal" {{ old('tipe_promo') == 'Nominal' ? 'selected' : '' }}>Nominal (Rp)</option>
                        <option value="Persen" {{ old('tipe_promo') == 'Persen' ? 'selected' : '' }}>Persen (%)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Cakupan Promosi <span class="text-red-600">*</span></label>
                    <select name="cakupan_promo" class="brutal-input bg-white" required>
                        <option value="Per Transaksi" {{ old('cakupan_promo') == 'Per Transaksi' ? 'selected' : '' }}>Per Transaksi</option>
                        <option value="Per Item" {{ old('cakupan_promo') == 'Per Item' ? 'selected' : '' }}>Per Item</option>
                        <option value="Free Item" {{ old('cakupan_promo') == 'Free Item' ? 'selected' : '' }}>Free Item</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Nilai Promosi</label>
                    <input type="number" step="0.01" name="nilai_promo" value="{{ old('nilai_promo') }}" class="brutal-input">
                    <p class="text-[10px] mt-1 text-gray-500 font-bold">Kosongkan jika free item.</p>
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Min. Pembelian (Rp)</label>
                    <input type="number" step="0.01" name="min_pembelian" value="{{ old('min_pembelian', 0) }}" class="brutal-input">
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Mulai</label>
                    <input type="date" name="tanggal_mulai" value="{{ old('tanggal_mulai') }}" class="brutal-input" min="{{ date('Y-m-d') }}">
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Selesai</label>
                    <input type="date" name="tanggal_selesai" value="{{ old('tanggal_selesai') }}" class="brutal-input" min="{{ date('Y-m-d') }}">
                </div>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">SIMPAN PROMOSI</button>
                <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary brutal-shadow">BATAL</button>
            </div>
        </form>
    </div>
</div>

{{-- TABEL DAFTAR PROMOSI --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl uppercase tracking-tight">DAFTAR PROMOSI</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $promosis->total() }}</span> promosi terdaftar
            </p>
        </div>

        {{-- Search --}}
        <form method="GET" action="{{ route('admin.promosi.index') }}" class="flex gap-2">
            <input type="text" name="search" value="{{ request('search') }}"
                placeholder="Cari nama promosi..."
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
                    <th class="brutal-table-th text-xs">NAMA PROMOSI</th>
                    <th class="brutal-table-th text-xs">CABANG</th>
                    <th class="brutal-table-th text-xs">TIPE</th>
                    <th class="brutal-table-th text-xs">NILAI / SYARAT</th>
                    <th class="brutal-table-th text-xs">MASA BERLAKU</th>
                    <th class="brutal-table-th text-xs w-48 text-center">AKSI</th>
                </tr>
            </thead>
            <tbody>
            @forelse($promosis as $promosi)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $promosi->nama_promo }}</td>
                <td class="brutal-table-td">{{ $promosi->cabang->nama_cabang ?? '-' }}</td>
                <td class="brutal-table-td">{{ $promosi->tipe_promo }} ({{ $promosi->cakupan_promo }})</td>
                <td class="brutal-table-td">
                    @if($promosi->tipe_promo === 'Persen')
                        {{ (float) $promosi->nilai_promo }}%
                    @elseif($promosi->tipe_promo === 'Nominal')
                        Rp {{ number_format($promosi->nilai_promo, 0, ',', '.') }}
                    @else
                        -
                    @endif
                    <br>
                    <span class="text-xs text-gray-500">Min. Beli: Rp {{ number_format($promosi->min_pembelian, 0, ',', '.') }}</span>
                </td>
                <td class="brutal-table-td">
                    @if($promosi->tanggal_mulai && $promosi->tanggal_selesai)
                        {{ \Carbon\Carbon::parse($promosi->tanggal_mulai)->format('d/m/Y') }} - {{ \Carbon\Carbon::parse($promosi->tanggal_selesai)->format('d/m/Y') }}
                    @else
                        Tanpa Batas
                    @endif
                </td>
                <td class="brutal-table-td text-center space-x-2">
                    <!-- Edit Modal -->
                    <div x-data="{ open: {{ $errors->any() && old('id_promo') == $promosi->id_promo ? 'true' : 'false' }} }" class="inline-block">
                        <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</button>

                        <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left overflow-y-auto">
                            <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-2xl w-full my-8">
                                <h2 class="text-xl font-black uppercase mb-4 border-b-2 border-brutal-black pb-2">Edit Promosi</h2>
                                <form action="{{ route('admin.promosi.update', $promosi->id_promo) }}" method="POST">
                                    @csrf
                                    @method('PUT')
                                    <input type="hidden" name="id_promo" value="{{ $promosi->id_promo }}">
                                    
                                    <div class="mb-4" x-data="{ 
                                        checkAll: false,
                                        toggleAll() {
                                            this.checkAll = !this.checkAll;
                                            $el.querySelectorAll('.cabang-promo-edit-cb').forEach(cb => cb.checked = this.checkAll);
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
                                                        class="cabang-promo-edit-cb brutal-checkbox"
                                                        {{ (old('id_promo') == $promosi->id_promo && is_array(old('id_cabang')) && in_array($cabang->id_cabang, old('id_cabang'))) || $promosi->id_cabang == $cabang->id_cabang ? 'checked' : '' }}>
                                                    <span>{{ $cabang->nama_cabang }}</span>
                                                </label>
                                            @endforeach
                                        </div>
                                        @error('id_cabang')
                                            @if(old('id_promo') == $promosi->id_promo)
                                                <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span>
                                            @endif
                                        @enderror
                                    </div>
                                    <div class="mb-4">
                                        <label class="block font-extrabold mb-2 uppercase text-xs text-left">Nama Promosi</label>
                                        <input type="text" name="nama_promo" value="{{ old('id_promo') == $promosi->id_promo ? old('nama_promo') : $promosi->nama_promo }}" class="brutal-input" required>
                                        @error('nama_promo') 
                                            @if(old('id_promo') == $promosi->id_promo)
                                                <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
                                            @endif
                                        @enderror
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Tipe Promosi</label>
                                            <select name="tipe_promo" class="brutal-input bg-white" required>
                                                <option value="Nominal" {{ (old('id_promo') == $promosi->id_promo ? old('tipe_promo') : $promosi->tipe_promo) == 'Nominal' ? 'selected' : '' }}>Nominal (Rp)</option>
                                                <option value="Persen" {{ (old('id_promo') == $promosi->id_promo ? old('tipe_promo') : $promosi->tipe_promo) == 'Persen' ? 'selected' : '' }}>Persen (%)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Cakupan Promosi</label>
                                            <select name="cakupan_promo" class="brutal-input bg-white" required>
                                                <option value="Per Transaksi" {{ (old('id_promo') == $promosi->id_promo ? old('cakupan_promo') : $promosi->cakupan_promo) == 'Per Transaksi' ? 'selected' : '' }}>Per Transaksi</option>
                                                <option value="Per Item" {{ (old('id_promo') == $promosi->id_promo ? old('cakupan_promo') : $promosi->cakupan_promo) == 'Per Item' ? 'selected' : '' }}>Per Item</option>
                                                <option value="Free Item" {{ (old('id_promo') == $promosi->id_promo ? old('cakupan_promo') : $promosi->cakupan_promo) == 'Free Item' ? 'selected' : '' }}>Free Item</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Nilai Promosi</label>
                                            <input type="number" step="0.01" name="nilai_promo" value="{{ old('id_promo') == $promosi->id_promo ? old('nilai_promo') : (float)$promosi->nilai_promo }}" class="brutal-input">
                                            <p class="text-[10px] mt-1 text-gray-500 font-bold text-left">Kosongkan jika free item.</p>
                                        </div>
                                        <div>
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Min. Pembelian (Rp)</label>
                                            <input type="number" step="0.01" name="min_pembelian" value="{{ old('id_promo') == $promosi->id_promo ? old('min_pembelian') : (float)$promosi->min_pembelian }}" class="brutal-input">
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Tanggal Mulai</label>
                                            <input type="date" name="tanggal_mulai" value="{{ old('id_promo') == $promosi->id_promo ? old('tanggal_mulai') : ($promosi->tanggal_mulai ? \Carbon\Carbon::parse($promosi->tanggal_mulai)->format('Y-m-d') : '') }}" class="brutal-input">
                                        </div>
                                        <div>
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Tanggal Selesai</label>
                                            <input type="date" name="tanggal_selesai" value="{{ old('id_promo') == $promosi->id_promo ? old('tanggal_selesai') : ($promosi->tanggal_selesai ? \Carbon\Carbon::parse($promosi->tanggal_selesai)->format('Y-m-d') : '') }}" class="brutal-input">
                                        </div>
                                    </div>
                                    <div class="flex gap-4">
                                        <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN</button>
                                        <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">BATAL</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <form action="{{ route('admin.promosi.destroy', $promosi->id_promo) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus promosi ini?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data promosi.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

@if($promosis->hasPages())
    <div class="p-5 border-t-4 border-black">
        {{ $promosis->links() }}
    </div>
@endif
</div>
@endsection

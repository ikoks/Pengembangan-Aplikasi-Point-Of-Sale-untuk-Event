@extends('layouts.admin')

@section('title', 'Metode Pembayaran')

@section('content')


@php
    $predefinedMethods = [
        'Cash', 'QRIS Dynamic', 'QRIS Static', 'Mandiri Virtual Account', 
        'BCA Virtual Account', 'BRI Virtual Account', 'BNI Virtual Account', 
        'EDC Mandiri', 'EDC BCA', 'EDC BRI', 'GoPay', 'OVO', 'ShopeePay', 'DANA'
    ];
@endphp

<!-- Accordion Form Tambah -->
<div x-data="{ open: false, selectedMetode: '', customMetode: '' }" class="mb-6">
    <button @click="open = !open" class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
        <span>Tambah Metode Pembayaran Baru</span>
        <svg :class="open ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
    </button>
    <div x-show="open" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
        <form action="{{ route('admin.metode-pembayaran.store') }}" method="POST">
            @csrf
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-extrabold mb-1">Nama Metode <span class="text-red-500">*</span></label>
                    <select name="nama_metode" x-model="selectedMetode" required class="brutal-input bg-white mb-2">
                        <option value="">-- Pilih Metode --</option>
                        @foreach($predefinedMethods as $method)
                            <option value="{{ $method }}">{{ $method }}</option>
                        @endforeach
                        <option value="lainnya">Lainnya (Kustom)</option>
                    </select>
                    
                    <!-- Input Kustom -->
                    <div x-show="selectedMetode === 'lainnya'" style="display: none;">
                        <input type="text" name="nama_metode_custom" x-model="customMetode" :required="selectedMetode === 'lainnya'" class="brutal-input bg-yellow-50" placeholder="Ketik nama metode...">
                    </div>
                    @error('nama_metode_final') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold mb-1">Kategori Metode <span class="text-red-500">*</span></label>
                    <select name="id_kategori_metode" required class="brutal-input bg-white">
                        <option value="">-- Pilih Kategori --</option>
                        @foreach($kategoriMetodes as $kat)
                            <option value="{{ $kat->id_kategori_metode }}">{{ $kat->nama_kategori }}</option>
                        @endforeach
                    </select>
                    @error('id_kategori_metode') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">Simpan Metode Pembayaran</button>
                <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary brutal-shadow">Batal</button>
            </div>
        </form>
    </div>
</div>

<!-- Table Data -->
<div id="data-container" class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" x-data="{ 
    editModal: false, 
    editData: { id_metode: '', nama_metode: '', id_kategori_metode: '' },
    selectedEditMetode: '',
    customEditMetode: ''
}">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl tracking-tight">Daftar Metode Pembayaran</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $metodePembayaran->total() }}</span> metode terdaftar
            </p>
        </div>

        {{-- Search --}}
        <form method="GET" action="{{ route('admin.metode-pembayaran.index') }}" class="flex gap-2">
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
                    <td class="brutal-table-td text-center space-x-2">
                            <button type="button" @click="
                                editData = {{ json_encode(['id_metode' => $item->id_metode, 'nama_metode' => $item->nama_metode, 'id_kategori_metode' => $item->id_kategori_metode]) }}; 
                                let predefined = @js($predefinedMethods);
                                if(predefined.includes(editData.nama_metode)) {
                                    selectedEditMetode = editData.nama_metode;
                                    customEditMetode = '';
                                } else {
                                    selectedEditMetode = 'lainnya';
                                    customEditMetode = editData.nama_metode;
                                }
                                editModal = true;
                            " class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

                            <form action="{{ route('admin.metode-pembayaran.destroy', $item->id_metode) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Apakah Anda yakin ingin menghapus metode pembayaran ini?');">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
                            </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="3" class="brutal-table-td text-center py-8 text-gray-500 font-bold">
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

    <!-- Modal Edit (Draggable) -->
    <div x-show="editModal" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
        <div @click.away="editModal = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full relative">
            <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Metode Pembayaran</h2>
            <form :action="`{{ route('admin.metode-pembayaran.index') }}/${editData.id_metode}`" method="POST">
                @csrf
                @method('PUT')
                
                <div class="mb-4">
                    <label class="block font-extrabold mb-2 text-xs">Nama Metode <span class="text-red-500">*</span></label>
                    <select name="nama_metode" x-model="selectedEditMetode" required class="brutal-input bg-white mb-2">
                        <option value="">-- Pilih Metode --</option>
                        @foreach($predefinedMethods as $method)
                            <option value="{{ $method }}">{{ $method }}</option>
                        @endforeach
                        <option value="lainnya">Lainnya (Kustom)</option>
                    </select>
                    
                    <div x-show="selectedEditMetode === 'lainnya'" style="display: none;">
                        <input type="text" name="nama_metode_custom" x-model="customEditMetode" :required="selectedEditMetode === 'lainnya'" class="brutal-input bg-yellow-50" placeholder="Ketik nama metode...">
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block font-extrabold mb-2 text-xs">Kategori Metode <span class="text-red-500">*</span></label>
                    <select name="id_kategori_metode" x-model="editData.id_kategori_metode" required class="brutal-input bg-white">
                        <option value="">-- Pilih Kategori --</option>
                        @foreach($kategoriMetodes as $kat)
                            <option value="{{ $kat->id_kategori_metode }}">{{ $kat->nama_kategori }}</option>
                        @endforeach
                    </select>
                </div>
                
                <div class="flex gap-4 mt-6">
                    <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Perubahan</button>
                    <button type="button" @click="editModal = false" class="brutal-btn brutal-btn-secondary">Batal</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

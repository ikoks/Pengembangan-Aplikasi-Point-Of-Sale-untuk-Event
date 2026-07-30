@extends('layouts.admin')
@section('title', 'Master Mode Penjualan')

@section('content')
{{-- FORM TAMBAH SALES MODE (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_sales') ? 'true' : 'false' }} }" class="mb-6">
    <button @click="openForm = !openForm"
        class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
        <span>+ TAMBAH MODE PENJUALAN BARU</span>
        <svg :class="openForm ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path>
        </svg>
    </button>

    <div x-show="openForm" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
        <form action="{{ route('admin.sales-mode.store') }}" method="POST">
            @csrf
            <div class="mb-4">
                <label class="block text-xs font-extrabold uppercase mb-1">Nama Mode Penjualan <span class="text-red-600">*</span></label>
                <input type="text" name="nama_mode" value="{{ old('nama_mode') }}" class="brutal-input" required>
                @error('nama_mode') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
            </div>
            <div class="flex gap-3 mt-4">
                <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">SIMPAN MODE PENJUALAN</button>
                <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary brutal-shadow">BATAL</button>
            </div>
        </form>
    </div>
</div>

{{-- TABEL DAFTAR SALES MODE --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl uppercase tracking-tight">DAFTAR MODE PENJUALAN</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $salesModes->total() }}</span> mode terdaftar
            </p>
        </div>

        {{-- Search --}}
        <form method="GET" action="{{ route('admin.sales-mode.index') }}" class="flex gap-2">
            <input type="text" name="search" value="{{ request('search') }}"
                placeholder="Cari mode penjualan..."
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
                    <th class="brutal-table-th text-xs">NAMA MODE PENJUALAN</th>
                    <th class="brutal-table-th text-xs text-center w-32">STATUS</th>
                    <th class="brutal-table-th text-xs w-48 text-center">AKSI</th>
                </tr>
            </thead>
            <tbody>
            @forelse($salesModes as $mode)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $mode->nama_mode }}</td>
                <td class="brutal-table-td text-center">
                    <form action="{{ route('admin.sales-mode.toggle-status', $mode->id_sales) }}" method="POST" class="inline-flex flex-col items-center gap-1">
                        @csrf
                        @method('PATCH')
                        <span class="text-[10px] font-black uppercase tracking-wider {{ $mode->status === 'Aktif' ? 'text-green-600' : 'text-gray-500' }}">{{ $mode->status }}</span>
                        <button type="submit" title="{{ $mode->status }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $mode->status === 'Aktif' ? 'bg-green-400' : 'bg-gray-300' }}">
                            <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $mode->status === 'Aktif' ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
                        </button>
                    </form>
                </td>
                <td class="brutal-table-td text-center space-x-2">
                    
                    <!-- Edit Modal -->
                    <div x-data="{ open: {{ $errors->any() && old('id_sales') == $mode->id_sales ? 'true' : 'false' }} }" class="inline-block">
                        <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</button>

                        <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
                            <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
                                <h2 class="text-xl font-black uppercase mb-4 border-b-2 border-brutal-black pb-2">Edit Mode Penjualan</h2>
                                <form action="{{ route('admin.sales-mode.update', $mode->id_sales) }}" method="POST">
                                    @csrf
                                    @method('PUT')
                                    <input type="hidden" name="id_sales" value="{{ $mode->id_sales }}">
                                    <div class="mb-4">
                                        <label class="block font-extrabold mb-2 uppercase text-xs text-left">Nama Mode Penjualan</label>
                                        <input type="text" name="nama_mode" value="{{ old('id_sales') == $mode->id_sales ? old('nama_mode') : $mode->nama_mode }}" class="brutal-input" required>
                                        @error('nama_mode') 
                                            @if(old('id_sales') == $mode->id_sales)
                                                <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
                                            @endif
                                        @enderror
                                    </div>
                                    <div class="flex gap-4 mt-6">
                                        <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN</button>
                                        <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">BATAL</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <form action="{{ route('admin.sales-mode.destroy', $mode->id_sales) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus mode penjualan ini?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="3" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data mode penjualan.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

@if($salesModes->hasPages())
    <div class="p-5 border-t-4 border-black">
        {{ $salesModes->links() }}
    </div>
@endif
</div>
@endsection

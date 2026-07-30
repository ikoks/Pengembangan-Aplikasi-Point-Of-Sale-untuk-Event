@extends('layouts.admin')
@section('title', 'Master Kasir')

@section('content')
{{-- FORM TAMBAH KASIR (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_user') ? 'true' : 'false' }} }" class="mb-6">
    <button @click="openForm = !openForm"
        class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
        <span>+ TAMBAH KASIR BARU</span>
        <svg :class="openForm ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path>
        </svg>
    </button>

    <div x-show="openForm" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
        <form action="{{ route('admin.pegawai.kasir.store') }}" method="POST">
            @csrf
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Nama Lengkap <span class="text-red-600">*</span></label>
                    <input type="text" name="nama_user" value="{{ old('nama_user') }}" class="brutal-input" required>
                    @error('nama_user') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Username <span class="text-red-600">*</span></label>
                    <input type="text" name="username" value="{{ old('username') }}" class="brutal-input" required>
                    @error('username') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Cabang Penugasan</label>
                    <select name="id_cabang" class="brutal-input bg-white">
                        <option value="">-- Tidak Terikat Cabang --</option>
                        @foreach($cabangs as $cabang)
                            <option value="{{ $cabang->id_cabang }}" {{ old('id_cabang') == $cabang->id_cabang ? 'selected' : '' }}>
                                {{ $cabang->nama_cabang }}
                            </option>
                        @endforeach
                    </select>
                    @error('id_cabang') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">SIMPAN KASIR</button>
                <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary brutal-shadow">BATAL</button>
            </div>
        </form>
    </div>
</div>

{{-- TABEL DAFTAR KASIR --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl uppercase tracking-tight">DAFTAR KASIR</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $kasirs->total() }}</span> kasir terdaftar
            </p>
        </div>

        {{-- Search --}}
        <form method="GET" action="{{ route('admin.pegawai.kasir.index') }}" class="flex gap-2">
            <input type="text" name="search" value="{{ request('search') }}"
                placeholder="Cari kasir..."
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
                    <th class="brutal-table-th text-xs">NAMA KASIR</th>
                    <th class="brutal-table-th text-xs">USERNAME</th>
                    <th class="brutal-table-th text-xs">CABANG</th>
                    <th class="brutal-table-th text-xs">STATUS</th>
                    <th class="brutal-table-th text-xs w-64 text-center">AKSI</th>
                </tr>
            </thead>
        <tbody>
            @forelse($kasirs as $kasir)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $kasir->nama_user }}</td>
                <td class="brutal-table-td">{{ $kasir->username }}</td>
                <td class="brutal-table-td">{{ $kasir->cabang->nama_cabang ?? '-' }}</td>
                <td class="brutal-table-td text-center">
                    <form action="{{ route('admin.pegawai.kasir.toggle-status', $kasir->id_user) }}" method="POST" class="inline-flex flex-col items-center gap-1">
                        @csrf
                        @method('PATCH')
                        <span class="text-[10px] font-black uppercase tracking-wider {{ $kasir->status_aktif ? 'text-green-600' : 'text-gray-500' }}">{{ $kasir->status_aktif ? 'Aktif' : 'Nonaktif' }}</span>
                        <button type="submit" title="{{ $kasir->status_aktif ? 'Aktif' : 'Nonaktif' }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $kasir->status_aktif ? 'bg-green-400' : 'bg-gray-300' }}">
                            <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $kasir->status_aktif ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
                        </button>
                    </form>
                </td>
                <td class="brutal-table-td text-center">
                    <div class="flex justify-center items-center gap-2">
                        
                        <!-- Edit Modal -->
                        <div x-data="{ open: {{ $errors->any() && old('id_user') == $kasir->id_user ? 'true' : 'false' }} }" class="inline-block">
                            <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</button>

                            <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
                                <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
                                    <h2 class="text-xl font-black uppercase mb-4 border-b-2 border-brutal-black pb-2">Edit Kasir</h2>
                                    <form action="{{ route('admin.pegawai.kasir.update', $kasir->id_user) }}" method="POST">
                                        @csrf
                                        @method('PUT')
                                        <input type="hidden" name="id_user" value="{{ $kasir->id_user }}">
                                        <div class="mb-4">
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Nama Lengkap</label>
                                            <input type="text" name="nama_user" value="{{ old('id_user') == $kasir->id_user ? old('nama_user') : $kasir->nama_user }}" class="brutal-input" required>
                                            @error('nama_user') 
                                                @if(old('id_user') == $kasir->id_user)
                                                    <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
                                                @endif
                                            @enderror
                                        </div>
                                        <div class="mb-4">
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Username</label>
                                            <input type="text" name="username" value="{{ old('id_user') == $kasir->id_user ? old('username') : $kasir->username }}" class="brutal-input" required>
                                            @error('username') 
                                                @if(old('id_user') == $kasir->id_user)
                                                    <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
                                                @endif
                                            @enderror
                                        </div>
                                        <div class="mb-4">
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Cabang Penugasan</label>
                                            <select name="id_cabang" class="brutal-input bg-white">
                                                <option value="">-- Tidak Terikat Cabang --</option>
                                                @foreach($cabangs as $cabang)
                                                    <option value="{{ $cabang->id_cabang }}" {{ (old('id_user') == $kasir->id_user ? old('id_cabang') : $kasir->id_cabang) == $cabang->id_cabang ? 'selected' : '' }}>
                                                        {{ $cabang->nama_cabang }}
                                                    </option>
                                                @endforeach
                                            </select>
                                            @error('id_cabang')
                                                @if(old('id_user') == $kasir->id_user)
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

                        
                        <form action="{{ route('admin.pegawai.kasir.destroy', $kasir->id_user) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus kasir ini?');">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                        </form>
                    </div>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data kasir.</td>
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

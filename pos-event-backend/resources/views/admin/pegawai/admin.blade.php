@extends('layouts.admin')

@section('title', 'Manajemen Admin')

@section('content')
{{-- POS-A-15: Registrasi & Manajemen User Admin --}}

{{-- FORM TAMBAH ADMIN (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && old('_action') === 'create' ? 'true' : 'false' }} }" class="mb-6">
    <button @click="openForm = !openForm"
        class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
        <span>+ DAFTARKAN ADMIN BARU</span>
        <svg :class="openForm ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path>
        </svg>
    </button>

    <div x-show="openForm" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
        <form method="POST" action="{{ route('admin.management.store') }}">
            @csrf
            <input type="hidden" name="_action" value="create">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Nama Lengkap <span class="text-red-600">*</span></label>
                    <input type="text" name="nama_user" value="{{ old('nama_user') }}"
                        class="brutal-input" placeholder="Nama lengkap..." required>
                    @error('nama_user')
                        <p class="text-red-600 text-xs font-bold mt-1">{{ $message }}</p>
                    @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Username <span class="text-red-600">*</span></label>
                    <input type="text" name="username" value="{{ old('username') }}"
                        class="brutal-input font-mono" placeholder="username_unik..." required>
                    @error('username')
                        <p class="text-red-600 text-xs font-bold mt-1">{{ $message }}</p>
                    @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Email <span class="text-red-600">*</span></label>
                    <input type="email" name="email" value="{{ old('email') }}"
                        class="brutal-input" placeholder="email@contoh.com" required>
                    @error('email')
                        <p class="text-red-600 text-xs font-bold mt-1">{{ $message }}</p>
                    @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Cabang</label>
                    <select name="id_cabang" class="brutal-input bg-white">
                        <option value="">-- Admin Pusat (Semua Cabang) --</option>
                        @foreach($cabangs as $cabang)
                            <option value="{{ $cabang->id_cabang }}"
                                {{ old('id_cabang') == $cabang->id_cabang ? 'selected' : '' }}>
                                {{ $cabang->nama_cabang }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Password <span class="text-red-600">*</span></label>
                    <input type="password" name="password"
                        class="brutal-input" placeholder="Min. 8 karakter..." required>
                    <p class="text-xs text-gray-500 mt-1">Min. 8 karakter, huruf besar, kecil, dan angka.</p>
                    @error('password')
                        <p class="text-red-600 text-xs font-bold mt-1">{{ $message }}</p>
                    @enderror
                </div>
                <div>
                    <label class="block text-xs font-extrabold uppercase mb-1">Konfirmasi Password <span class="text-red-600">*</span></label>
                    <input type="password" name="password_confirmation"
                        class="brutal-input" placeholder="Ulangi password..." required>
                </div>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">
                    SIMPAN ADMIN
                </button>
                <button type="button" @click="openForm = false"
                    class="brutal-btn brutal-btn-secondary brutal-shadow">
                    BATAL
                </button>
            </div>
        </form>
    </div>
</div>

{{-- TABEL DAFTAR ADMIN --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl uppercase tracking-tight">DAFTAR USER ADMIN</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $admins->total() }}</span> admin terdaftar
            </p>
        </div>

        {{-- Search --}}
        <form method="GET" action="{{ route('admin.management.index') }}" class="flex gap-2">
            <input type="text" name="search" value="{{ request('search') }}"
                placeholder="Cari nama / username..."
                class="brutal-input text-sm w-48">
            <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm px-3">
                CARI
            </button>
        </form>
    </div>

    <div class="overflow-x-auto">
        <table class="w-full border-collapse">
            <thead>
                <tr>
                    <th class="brutal-table-th text-xs">NAMA ADMIN</th>
                    <th class="brutal-table-th text-xs">USERNAME</th>
                    <th class="brutal-table-th text-xs">EMAIL</th>
                    <th class="brutal-table-th text-xs">CABANG</th>
                    <th class="brutal-table-th text-xs text-center">STATUS</th>
                    <th class="brutal-table-th text-xs text-center">AKSI</th>
                </tr>
            </thead>
            <tbody>
                @forelse($admins as $admin)
                    <tr class="{{ !$admin->status_aktif ? 'opacity-50 bg-gray-50' : 'hover:bg-yellow-50' }} transition-colors">
                        <td class="brutal-table-td">
                            <span class="font-bold text-sm">{{ $admin->nama_user }}</span>
                            @if($admin->id_user === auth()->id())
                                <span class="ml-2 text-xs bg-yellow-300 border border-black px-1.5 py-0.5 font-bold">ANDA</span>
                            @endif
                        </td>
                        <td class="brutal-table-td font-mono text-sm">{{ $admin->username }}</td>
                        <td class="brutal-table-td text-sm">{{ $admin->email ?? '—' }}</td>
                        <td class="brutal-table-td text-sm">
                            {{ $admin->cabang?->nama_cabang ?? 'Admin Pusat' }}
                        </td>
                        <td class="brutal-table-td text-center">
                            @if($admin->id_user !== auth()->id())
                                <form action="{{ route('admin.management.toggle-status', $admin->id_user) }}" method="POST" class="inline-flex flex-col items-center gap-1">
                                    @csrf
                                    @method('PATCH')
                                    <span class="text-[10px] font-black uppercase tracking-wider {{ $admin->status_aktif ? 'text-green-600' : 'text-gray-500' }}">{{ $admin->status_aktif ? 'Aktif' : 'Nonaktif' }}</span>
                                    <button type="submit" title="{{ $admin->status_aktif ? 'Aktif' : 'Nonaktif' }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $admin->status_aktif ? 'bg-green-400' : 'bg-gray-300' }}">
                                        <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $admin->status_aktif ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
                                    </button>
                                </form>
                            @else
                                <span class="border-2 border-black bg-green-400 px-2 py-0.5 text-xs font-extrabold">[AKTIF]</span>
                            @endif
                        </td>
                        <td class="brutal-table-td">
                            <div class="flex gap-2 justify-center flex-wrap">

                                {{-- Edit Modal --}}
                                <div x-data="{ open: {{ $errors->any() && old('id_user') == $admin->id_user ? 'true' : 'false' }} }" class="inline-block">
                                    <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-xs px-2 py-1">EDIT</button>

                                    <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left overflow-y-auto font-normal">
                                        <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-2xl w-full my-8">
                                            <h2 class="text-xl font-black uppercase mb-4 border-b-2 border-brutal-black pb-2">Edit Admin: {{ $admin->nama_user }}</h2>
                                            <form method="POST" action="{{ route('admin.management.update', $admin->id_user) }}">
                                                @csrf
                                                @method('PUT')
                                                <input type="hidden" name="id_user" value="{{ $admin->id_user }}">
                                                
                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label class="block text-xs font-extrabold uppercase mb-1">Nama Lengkap</label>
                                                        <input type="text" name="nama_user" value="{{ old('id_user') == $admin->id_user ? old('nama_user') : $admin->nama_user }}"
                                                            class="brutal-input" required>
                                                    </div>
                                                    <div>
                                                        <label class="block text-xs font-extrabold uppercase mb-1">Username</label>
                                                        <input type="text" name="username" value="{{ old('id_user') == $admin->id_user ? old('username') : $admin->username }}"
                                                            class="brutal-input font-mono" required>
                                                    </div>
                                                    <div>
                                                        <label class="block text-xs font-extrabold uppercase mb-1">Email <span class="text-red-600">*</span></label>
                                                        <input type="email" name="email" value="{{ old('id_user') == $admin->id_user ? old('email') : $admin->email }}"
                                                            class="brutal-input" required>
                                                    </div>
                                                    <div>
                                                        <label class="block text-xs font-extrabold uppercase mb-1">Cabang</label>
                                                        <select name="id_cabang" class="brutal-input bg-white">
                                                            <option value="">Admin Pusat</option>
                                                            @foreach($cabangs as $cabang)
                                                                <option value="{{ $cabang->id_cabang }}"
                                                                    {{ (old('id_user') == $admin->id_user ? old('id_cabang') : $admin->id_cabang) == $cabang->id_cabang ? 'selected' : '' }}>
                                                                    {{ $cabang->nama_cabang }}
                                                                </option>
                                                            @endforeach
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                <div class="flex gap-3 mt-6">
                                                    <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm">SIMPAN PERUBAHAN</button>
                                                    <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-sm">BATAL</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>

                                {{-- Reset Password Button --}}
                                <button type="button"
                                    onclick="toggleResetForm('reset-{{ $admin->id_user }}')"
                                    class="brutal-btn brutal-shadow-sm text-xs px-2 py-1 bg-yellow-300 border-2 border-black">
                                    RESET PASSWORD
                                </button>

                                {{-- Delete (tidak bisa hapus diri sendiri) --}}
                                @if($admin->id_user !== auth()->id())
                                    <form method="POST"
                                        action="{{ route('admin.management.destroy', $admin->id_user) }}"
                                        onsubmit="return confirmAndSubmit(event, 'KONFIRMASI: Nonaktifkan admin {{ $admin->nama_user }}?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit"
                                            class="brutal-btn brutal-shadow-sm text-xs px-2 py-1 bg-red-400 border-2 border-black">
                                            NONAKTIFKAN
                                        </button>
                                    </form>
                                @endif
                            </div>
                        </td>
                    </tr>
                    <tr id="reset-{{ $admin->id_user }}" class="hidden bg-yellow-50">
                        <td colspan="6" class="border-4 border-dashed border-yellow-500 p-5">
                            <h4 class="font-extrabold uppercase text-sm mb-4">
                                [RESET PASSWORD] Admin: {{ $admin->nama_user }}
                            </h4>
                            <form method="POST" action="{{ route('admin.management.reset-password', $admin->id_user) }}" onsubmit="return confirmAndSubmit(event, 'KONFIRMASI: Reset password admin {{ $admin->nama_user }}? Semua sesi aktif akan diinvalidasi.');">
                                @csrf
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="block text-xs font-extrabold uppercase mb-1">Password Baru <span class="text-red-600">*</span></label>
                                        <input type="password" name="password_baru"
                                            class="brutal-input" placeholder="Min. 8 karakter..." required>
                                        <p class="text-xs text-gray-500 mt-1">Min. 8 karakter, huruf besar, kecil, dan angka.</p>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-extrabold uppercase mb-1">Konfirmasi Password Baru <span class="text-red-600">*</span></label>
                                        <input type="password" name="password_baru_confirmation"
                                            class="brutal-input" placeholder="Ulangi password..." required>
                                    </div>
                                </div>
                                <div class="flex gap-3">
                                    <button type="submit"
                                        class="brutal-btn brutal-shadow-sm text-sm bg-yellow-300 border-3 border-black">
                                        RESET PASSWORD
                                    </button>
                                    <button type="button" onclick="toggleResetForm('reset-{{ $admin->id_user }}')"
                                        class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-sm">BATAL</button>
                                </div>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="brutal-table-td text-center py-12">
                            <p class="font-extrabold text-xl text-gray-400">[TIDAK ADA ADMIN]</p>
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($admins->hasPages())
        <div class="p-5 border-t-4 border-black">
            {{ $admins->links() }}
        </div>
    @endif
</div>

@push('scripts')
<script>
    function toggleEditForm(id) {
        const row = document.getElementById(id);
        if (row) row.classList.toggle('hidden');
    }
    function toggleResetForm(id) {
        const row = document.getElementById(id);
        if (row) row.classList.toggle('hidden');
    }
</script>
@endpush
@endsection

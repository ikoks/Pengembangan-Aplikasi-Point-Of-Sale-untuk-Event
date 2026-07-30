@extends('layouts.admin')
@section('title', 'Master Admin')

@section('content')
<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <form action="{{ route('admin.pegawai.admin.index') }}" method="GET" class="flex w-full sm:w-auto">
        <input type="text" name="search" value="{{ $search }}" placeholder="Cari admin..." class="brutal-input flex-1 sm:w-64">
        <button type="submit" class="brutal-btn brutal-btn-primary ml-2">CARI</button>
    </form>
    <!-- Create Modal -->
    <div x-data="{ open: {{ $errors->any() && !old('id_user') ? 'true' : 'false' }} }">
        <button @click="open = true" type="button" class="brutal-btn brutal-btn-primary whitespace-nowrap">+ TAMBAH ADMIN</button>

        <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
            <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
                <h2 class="text-xl font-black uppercase mb-4 border-b-2 border-brutal-black pb-2">Tambah Admin</h2>
                <form action="{{ route('admin.management.store') }}" method="POST">
                    @csrf
                    <div class="mb-4">
                        <label class="block font-extrabold mb-2 uppercase text-xs">Nama Lengkap</label>
                        <input type="text" name="nama_user" value="{{ old('nama_user') }}" class="brutal-input" required>
                        @error('nama_user') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>
                    <div class="mb-4">
                        <label class="block font-extrabold mb-2 uppercase text-xs">Username</label>
                        <input type="text" name="username" value="{{ old('username') }}" class="brutal-input" required>
                        @error('username') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>
                    <div class="mb-4">
                        <label class="block font-extrabold mb-2 uppercase text-xs">Password</label>
                        <input type="password" name="password" class="brutal-input" required>
                        @error('password') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>
                    <div class="mb-6 flex items-center">
                        <input type="checkbox" name="status_aktif" id="status_aktif_create" value="1" {{ old('status_aktif', true) ? 'checked' : '' }} class="w-5 h-5 border-2 border-brutal-black rounded-none">
                        <label for="status_aktif_create" class="ml-2 font-extrabold uppercase text-xs">Akun Aktif</label>
                    </div>
                    <div class="flex gap-4 mt-6">
                        <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN</button>
                        <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">BATAL</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<div class="bg-white brutal-border brutal-shadow overflow-x-auto">
    <table class="w-full text-left border-collapse min-w-max">
        <thead>
            <tr>
                <th class="brutal-table-th">NAMA ADMIN</th>
                <th class="brutal-table-th">USERNAME</th>
                <th class="brutal-table-th">STATUS</th>
                <th class="brutal-table-th w-64 text-center">AKSI</th>
            </tr>
        </thead>
        <tbody>
            @forelse($admins as $admin)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $admin->nama_user }}</td>
                <td class="brutal-table-td">{{ $admin->username }}</td>
                <td class="brutal-table-td">
                    @if($admin->status_aktif)
                        <span class="inline-block px-2 py-1 bg-brutal-black text-white text-xs font-bold">[AKTIF]</span>
                    @else
                        <span class="inline-block px-2 py-1 border-2 border-brutal-black text-xs font-bold text-gray-500">[NONAKTIF]</span>
                    @endif
                </td>
                <td class="brutal-table-td text-center">
                    <div class="flex justify-center items-center gap-2">
                        
                        <!-- Edit Modal -->
                        <div x-data="{ open: {{ $errors->any() && old('id_user') == $admin->id_user ? 'true' : 'false' }} }" class="inline-block">
                            <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</button>

                            <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
                                <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full">
                                    <h2 class="text-xl font-black uppercase mb-4 border-b-2 border-brutal-black pb-2">Edit Admin</h2>
                                    <form action="{{ route('admin.management.update', $admin->id_user) }}" method="POST">
                                        @csrf
                                        @method('PUT')
                                        <input type="hidden" name="id_user" value="{{ $admin->id_user }}">
                                        <div class="mb-4">
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Nama Lengkap</label>
                                            <input type="text" name="nama_user" value="{{ old('id_user') == $admin->id_user ? old('nama_user') : $admin->nama_user }}" class="brutal-input" required>
                                            @error('nama_user') 
                                                @if(old('id_user') == $admin->id_user)
                                                    <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
                                                @endif
                                            @enderror
                                        </div>
                                        <div class="mb-4">
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Username</label>
                                            <input type="text" name="username" value="{{ old('id_user') == $admin->id_user ? old('username') : $admin->username }}" class="brutal-input" required>
                                            @error('username') 
                                                @if(old('id_user') == $admin->id_user)
                                                    <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
                                                @endif
                                            @enderror
                                        </div>
                                        <div class="mb-4">
                                            <label class="block font-extrabold mb-2 uppercase text-xs text-left">Password (opsional)</label>
                                            <input type="password" name="password" class="brutal-input">
                                            <p class="text-[10px] mt-1 font-bold text-gray-500 text-left">Kosongkan jika tidak ingin mengubah password.</p>
                                            @error('password') 
                                                @if(old('id_user') == $admin->id_user)
                                                    <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span> 
                                                @endif
                                            @enderror
                                        </div>
                                        <div class="mb-6 flex items-center">
                                            <input type="checkbox" name="status_aktif" id="status_aktif_edit_{{ $admin->id_user }}" value="1" {{ (old('id_user') == $admin->id_user ? old('status_aktif') : $admin->status_aktif) ? 'checked' : '' }} class="w-5 h-5 border-2 border-brutal-black rounded-none">
                                            <label for="status_aktif_edit_{{ $admin->id_user }}" class="ml-2 font-extrabold uppercase text-xs">Akun Aktif</label>
                                        </div>
                                        <div class="flex gap-4 mt-6">
                                            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN</button>
                                            <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">BATAL</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        
                        <form action="{{ route('admin.management.reset-password', $admin->id_user) }}" method="POST" class="inline-block" @submit.prevent="confirmMessage = 'Reset password menjadi admin123?'; confirmCallback = () => $event.target.submit(); confirmModal = true;">
                            @csrf
                            <button type="submit" class="brutal-btn brutal-btn-secondary bg-yellow-300 text-xs px-2 py-1">RESET PW</button>
                        </form>

                        <form action="{{ route('admin.management.destroy', $admin->id_user) }}" method="POST" class="inline-block" @submit.prevent="confirmMessage = 'Yakin ingin menghapus admin ini?'; confirmCallback = () => $event.target.submit(); confirmModal = true;">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black" {{ auth()->id() == $admin->id_user ? 'disabled' : '' }}>HAPUS</button>
                        </form>
                    </div>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data admin.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-6">
    {{ $admins->links() }}
</div>
@endsection

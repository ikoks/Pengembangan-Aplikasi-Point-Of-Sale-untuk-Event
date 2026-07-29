@extends('layouts.admin')
@section('title', 'Tambah Kasir')

@section('content')
<div class="bg-white brutal-border brutal-shadow p-6 max-w-xl">
    <form action="{{ route('admin.pegawai.kasir.store') }}" method="POST">
        @csrf
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Nama Lengkap</label>
            <input type="text" name="nama_user" value="{{ old('nama_user') }}" class="brutal-input" required>
        </div>
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Username</label>
            <input type="text" name="username" value="{{ old('username') }}" class="brutal-input" required>
        </div>
        


        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Cabang Penugasan</label>
            <div class="relative">
                <select name="id_cabang" class="brutal-input appearance-none bg-white">
                    <option value="">-- Tidak Terikat Cabang --</option>
                    @foreach($cabangs as $cabang)
                        <option value="{{ $cabang->id_cabang }}" {{ old('id_cabang') == $cabang->id_cabang ? 'selected' : '' }}>
                            {{ $cabang->nama_cabang }}
                        </option>
                    @endforeach
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>

        <div class="mb-6 flex items-center">
            <input type="checkbox" name="status_aktif" id="status_aktif" value="1" {{ old('status_aktif', true) ? 'checked' : '' }} class="w-5 h-5 border-2 border-brutal-black rounded-none">
            <label for="status_aktif" class="ml-2 font-extrabold uppercase">Akun Aktif</label>
        </div>

        <div class="flex gap-4">
            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN DATA</button>
            <a href="{{ route('admin.pegawai.kasir.index') }}" class="brutal-btn brutal-btn-secondary">BATAL</a>
        </div>
    </form>
</div>
@endsection

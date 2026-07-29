@extends('layouts.admin')
@section('title', 'Edit Sub-Kategori')

@section('content')
<div class="bg-white brutal-border brutal-shadow p-6 max-w-xl">
    <form action="{{ route('admin.sub-kategori.update', $subKategori->id_sub_kategori) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Parent Kategori</label>
            <div class="relative">
                <select name="id_kategori" class="brutal-input appearance-none bg-white" required>
                    <option value="">-- Pilih Kategori Induk --</option>
                    @foreach($kategoris as $kat)
                        <option value="{{ $kat->id_kategori }}" {{ old('id_kategori', $subKategori->id_kategori) == $kat->id_kategori ? 'selected' : '' }}>
                            {{ $kat->nama_kategori }}
                        </option>
                    @endforeach
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>

        <div class="mb-6">
            <label class="block font-extrabold mb-2 uppercase">Nama Sub-Kategori</label>
            <input type="text" name="nama_sub_kategori" value="{{ old('nama_sub_kategori', $subKategori->nama_sub_kategori) }}" class="brutal-input" required>
        </div>

        <div class="flex gap-4">
            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN DATA</button>
            <a href="{{ route('admin.sub-kategori.index') }}" class="brutal-btn brutal-btn-secondary">BATAL</a>
        </div>
    </form>
</div>
@endsection

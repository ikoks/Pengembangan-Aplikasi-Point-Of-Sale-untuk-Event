@extends('layouts.admin')
@section('title', 'Edit Kategori')

@section('content')
<div class="bg-white brutal-border brutal-shadow p-6 max-w-xl">
    <form action="{{ route('admin.kategori.update', $kategori->id_kategori) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="mb-6">
            <label class="block font-extrabold mb-2 uppercase">Nama Kategori</label>
            <input type="text" name="nama_kategori" value="{{ old('nama_kategori', $kategori->nama_kategori) }}" class="brutal-input" required>
        </div>

        <div class="flex gap-4">
            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN DATA</button>
            <a href="{{ route('admin.kategori.index') }}" class="brutal-btn brutal-btn-secondary">BATAL</a>
        </div>
    </form>
</div>
@endsection

@extends('layouts.admin')
@section('title', 'Edit Harga Cabang')

@section('content')
<div class="bg-white brutal-border brutal-shadow p-6 max-w-xl">
    <form action="{{ route('admin.harga-cabang.update', $menuTemplate->id_template) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Menu</label>
            <div class="relative">
                <select name="id_menu" class="brutal-input appearance-none bg-white" required>
                    <option value="">-- Pilih Menu --</option>
                    @foreach($menus as $menu)
                        <option value="{{ $menu->id_menu }}" {{ old('id_menu', $menuTemplate->id_menu) == $menu->id_menu ? 'selected' : '' }}>
                            {{ $menu->nama_menu }}
                        </option>
                    @endforeach
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>

        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Cabang</label>
            <div class="relative">
                <select name="id_cabang" class="brutal-input appearance-none bg-white" required>
                    <option value="">-- Pilih Cabang --</option>
                    @foreach($cabangs as $cabang)
                        <option value="{{ $cabang->id_cabang }}" {{ old('id_cabang', $menuTemplate->id_cabang) == $cabang->id_cabang ? 'selected' : '' }}>
                            {{ $cabang->nama_cabang }}
                        </option>
                    @endforeach
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>

        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Sales Mode</label>
            <div class="relative">
                <select name="id_sales" class="brutal-input appearance-none bg-white" required>
                    <option value="">-- Pilih Sales Mode --</option>
                    @foreach($salesModes as $mode)
                        <option value="{{ $mode->id_sales }}" {{ old('id_sales', $menuTemplate->id_sales) == $mode->id_sales ? 'selected' : '' }}>
                            {{ $mode->nama_mode }}
                        </option>
                    @endforeach
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>

        <div class="mb-6">
            <label class="block font-extrabold mb-2 uppercase">Harga (Rp)</label>
            <input type="number" step="0.01" name="harga_produk" value="{{ old('harga_produk', $menuTemplate->harga_produk) }}" class="brutal-input" required>
        </div>

        <div class="flex gap-4">
            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN DATA</button>
            <a href="{{ route('admin.harga-cabang.index') }}" class="brutal-btn brutal-btn-secondary">BATAL</a>
        </div>
    </form>
</div>
@endsection

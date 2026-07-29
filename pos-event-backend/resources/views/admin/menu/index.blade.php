@extends('layouts.admin')
@section('title', 'Master Menu Produk')

@section('content')
<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <form action="{{ route('admin.menu.index') }}" method="GET" class="flex w-full sm:w-auto">
        <input type="text" name="search" value="{{ $search }}" placeholder="Cari nama menu..." class="brutal-input flex-1 sm:w-64">
        <button type="submit" class="brutal-btn brutal-btn-primary ml-2">CARI</button>
    </form>
    <a href="{{ route('admin.menu.create') }}" class="brutal-btn brutal-btn-primary whitespace-nowrap">+ TAMBAH MENU</a>
</div>

<div class="bg-white brutal-border brutal-shadow overflow-x-auto">
    <table class="w-full text-left border-collapse min-w-max">
        <thead>
            <tr>
                <th class="brutal-table-th">NAMA MENU</th>
                <th class="brutal-table-th">KATEGORI</th>
                <th class="brutal-table-th">SUB-KATEGORI</th>
                <th class="brutal-table-th w-48 text-center">AKSI</th>
            </tr>
        </thead>
        <tbody>
            @forelse($menus as $menu)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $menu->nama_menu }}</td>
                <td class="brutal-table-td">{{ $menu->subKategori->kategori->nama_kategori ?? '-' }}</td>
                <td class="brutal-table-td">{{ $menu->subKategori->nama_sub_kategori ?? '-' }}</td>
                <td class="brutal-table-td text-center space-x-2">
                    <a href="{{ route('admin.menu.edit', $menu->id_menu) }}" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</a>
                    <form action="{{ route('admin.menu.destroy', $menu->id_menu) }}" method="POST" class="inline-block" onsubmit="return confirm('Yakin ingin menghapus menu ini?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data menu.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-6">
    {{ $menus->links() }}
</div>
@endsection

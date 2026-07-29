@extends('layouts.admin')
@section('title', 'Master Kategori')

@section('content')
<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <form action="{{ route('admin.kategori.index') }}" method="GET" class="flex w-full sm:w-auto">
        <input type="text" name="search" value="{{ $search }}" placeholder="Cari nama kategori..." class="brutal-input flex-1 sm:w-64">
        <button type="submit" class="brutal-btn brutal-btn-primary ml-2">CARI</button>
    </form>
    <a href="{{ route('admin.kategori.create') }}" class="brutal-btn brutal-btn-primary whitespace-nowrap">+ TAMBAH KATEGORI</a>
</div>

<div class="bg-white brutal-border brutal-shadow overflow-x-auto">
    <table class="w-full text-left border-collapse min-w-max">
        <thead>
            <tr>
                <th class="brutal-table-th">NAMA KATEGORI</th>
                <th class="brutal-table-th w-48 text-center">AKSI</th>
            </tr>
        </thead>
        <tbody>
            @forelse($kategoris as $kat)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $kat->nama_kategori }}</td>
                <td class="brutal-table-td text-center space-x-2">
                    <a href="{{ route('admin.kategori.edit', $kat->id_kategori) }}" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</a>
                    <form action="{{ route('admin.kategori.destroy', $kat->id_kategori) }}" method="POST" class="inline-block" onsubmit="return confirm('Yakin ingin menghapus kategori ini? Data sub-kategori juga bisa terpengaruh.');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="2" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data kategori.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-6">
    {{ $kategoris->links() }}
</div>
@endsection

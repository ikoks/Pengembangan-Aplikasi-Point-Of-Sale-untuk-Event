@extends('layouts.admin')
@section('title', 'Master Promosi')

@section('content')
<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <form action="{{ route('admin.promosi.index') }}" method="GET" class="flex w-full sm:w-auto">
        <input type="text" name="search" value="{{ $search }}" placeholder="Cari nama promosi..." class="brutal-input flex-1 sm:w-64">
        <button type="submit" class="brutal-btn brutal-btn-primary ml-2">CARI</button>
    </form>
    <a href="{{ route('admin.promosi.create') }}" class="brutal-btn brutal-btn-primary whitespace-nowrap">+ TAMBAH PROMOSI</a>
</div>

<div class="bg-white brutal-border brutal-shadow overflow-x-auto">
    <table class="w-full text-left border-collapse min-w-max">
        <thead>
            <tr>
                <th class="brutal-table-th">NAMA PROMOSI</th>
                <th class="brutal-table-th">CABANG</th>
                <th class="brutal-table-th">TIPE</th>
                <th class="brutal-table-th">NILAI / SYARAT</th>
                <th class="brutal-table-th">MASA BERLAKU</th>
                <th class="brutal-table-th w-48 text-center">AKSI</th>
            </tr>
        </thead>
        <tbody>
            @forelse($promosis as $promosi)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $promosi->nama_promo }}</td>
                <td class="brutal-table-td">{{ $promosi->cabang->nama_cabang ?? '-' }}</td>
                <td class="brutal-table-td">{{ $promosi->tipe_promo }} ({{ $promosi->cakupan_promo }})</td>
                <td class="brutal-table-td">
                    @if($promosi->tipe_promo === 'Persen')
                        {{ (float) $promosi->nilai_promo }}%
                    @elseif($promosi->tipe_promo === 'Nominal')
                        Rp {{ number_format($promosi->nilai_promo, 0, ',', '.') }}
                    @else
                        -
                    @endif
                    <br>
                    <span class="text-xs text-gray-500">Min. Beli: Rp {{ number_format($promosi->min_pembelian, 0, ',', '.') }}</span>
                </td>
                <td class="brutal-table-td">
                    @if($promosi->tanggal_mulai && $promosi->tanggal_selesai)
                        {{ \Carbon\Carbon::parse($promosi->tanggal_mulai)->format('d/m/Y') }} - {{ \Carbon\Carbon::parse($promosi->tanggal_selesai)->format('d/m/Y') }}
                    @else
                        Tanpa Batas
                    @endif
                </td>
                <td class="brutal-table-td text-center space-x-2">
                    <a href="{{ route('admin.promosi.edit', $promosi->id_promo) }}" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</a>
                    <form action="{{ route('admin.promosi.destroy', $promosi->id_promo) }}" method="POST" class="inline-block" onsubmit="return confirm('Yakin ingin menghapus promosi ini?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data promosi.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-6">
    {{ $promosis->links() }}
</div>
@endsection

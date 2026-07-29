@extends('layouts.admin')

@section('title', 'Shift Log')

@section('content')
{{-- POS-A-15: Shift Log Viewer --}}

{{-- FILTER PANEL --}}
<form method="GET" action="{{ route('admin.log.shift.index') }}" class="mb-6">
    <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 class="font-extrabold text-lg uppercase mb-4 border-b-4 border-black pb-2 tracking-tight">
            [FILTER] PENCARIAN SHIFT LOG
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Nama Kasir</label>
                <input type="text" name="kasir" value="{{ request('kasir') }}"
                    placeholder="Nama kasir..." class="brutal-input">
            </div>

            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Cabang</label>
                <select name="id_cabang" class="brutal-input bg-white">
                    <option value="">-- Semua Cabang --</option>
                    @foreach($cabangs as $cabang)
                        <option value="{{ $cabang->id_cabang }}"
                            {{ request('id_cabang') == $cabang->id_cabang ? 'selected' : '' }}>
                            {{ $cabang->nama_cabang }}
                        </option>
                    @endforeach
                </select>
            </div>

            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Status Shift</label>
                <select name="status_shift" class="brutal-input bg-white">
                    <option value="">-- Semua Status --</option>
                    <option value="OPEN" {{ request('status_shift') === 'OPEN' ? 'selected' : '' }}>[OPEN]</option>
                    <option value="ON_BREAK" {{ request('status_shift') === 'ON_BREAK' ? 'selected' : '' }}>[ON_BREAK]</option>
                    <option value="CLOSED" {{ request('status_shift') === 'CLOSED' ? 'selected' : '' }}>[CLOSED]</option>
                </select>
            </div>

            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Mulai</label>
                <input type="date" name="tanggal_mulai" value="{{ request('tanggal_mulai') }}"
                    class="brutal-input">
            </div>

            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Akhir</label>
                <input type="date" name="tanggal_akhir" value="{{ request('tanggal_akhir') }}"
                    class="brutal-input">
            </div>

            <div class="flex items-end">
                <label class="flex items-center gap-3 cursor-pointer p-3 border-4 border-black bg-white hover:bg-gray-100 w-full">
                    <input type="checkbox" name="auto_closed" value="1"
                        {{ request('auto_closed') ? 'checked' : '' }}
                        class="w-5 h-5 border-2 border-black accent-black">
                    <span class="font-extrabold uppercase text-sm">Hanya AUTO_CLOSED</span>
                </label>
            </div>
        </div>

        <div class="flex gap-3">
            <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">CARI SHIFT</button>
            <a href="{{ route('admin.log.shift.index') }}" class="brutal-btn brutal-btn-secondary brutal-shadow">RESET</a>
        </div>
    </div>
</form>

{{-- DAFTAR SHIFT --}}
<div class="space-y-4">
    @forelse($shifts as $shift)
        @php
            $isAutoClosed = $shift->operatorLogs->contains(fn($l) => str_contains($l->catatan ?? '', 'auto_closed'));
            $statusClass = match($shift->status_shift) {
                'OPEN'     => 'bg-green-400 border-black',
                'ON_BREAK' => 'bg-yellow-300 border-black',
                'CLOSED'   => 'bg-gray-300 border-gray-500',
                default    => 'bg-gray-200 border-black',
            };
            $totalTrx = $shift->transaksis->count();
            $totalPendapatan = $shift->transaksis->where('status', 'Success')->sum(fn($t) => (float) $t->total);
        @endphp

        <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            {{ $isAutoClosed ? 'border-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,0.5)]' : '' }}">

            {{-- Shift Header --}}
            <div class="p-5 border-b-4 {{ $isAutoClosed ? 'border-red-600 bg-red-50' : 'border-black bg-gray-50' }} flex flex-wrap justify-between items-start gap-4">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="inline-block border-2 px-2 py-0.5 text-xs font-extrabold {{ $statusClass }}">
                            [{{ $shift->status_shift }}]
                        </span>
                        @if($isAutoClosed)
                            <span class="inline-block border-2 border-dashed border-red-600 bg-red-100 text-red-700 px-2 py-0.5 text-xs font-extrabold">
                                ⚠ [AUTO_CLOSED 03:00]
                            </span>
                        @endif
                    </div>
                    <p class="font-extrabold text-lg">{{ $shift->user?->nama_user ?? '—' }}</p>
                    <p class="text-sm text-gray-500 font-mono">
                        ID: {{ substr($shift->id_shift, 0, 12) }}...
                    </p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div class="border-4 border-black px-4 py-2 bg-white">
                        <p class="text-xs font-extrabold uppercase text-gray-500">Mulai</p>
                        <p class="font-mono font-bold text-sm">{{ $shift->waktu_mulai?->format('d/m H:i') }}</p>
                    </div>
                    <div class="border-4 border-black px-4 py-2 bg-white">
                        <p class="text-xs font-extrabold uppercase text-gray-500">Selesai</p>
                        <p class="font-mono font-bold text-sm">{{ $shift->waktu_selesai?->format('d/m H:i') ?? '—' }}</p>
                    </div>
                    <div class="border-4 border-black px-4 py-2 bg-white">
                        <p class="text-xs font-extrabold uppercase text-gray-500">Cabang</p>
                        <p class="font-bold text-sm">{{ $shift->cabang?->nama_cabang ?? '-' }}</p>
                    </div>
                    <div class="border-4 border-black px-4 py-2 bg-white">
                        <p class="text-xs font-extrabold uppercase text-gray-500">Pendapatan</p>
                        <p class="font-mono font-extrabold text-sm">Rp {{ number_format($totalPendapatan, 0, ',', '.') }}</p>
                        <p class="text-xs text-gray-400">{{ $totalTrx }} trx</p>
                    </div>
                </div>
            </div>

            {{-- Rekap Modal --}}
            <div class="px-5 py-3 border-b-4 border-black grid grid-cols-2 md:grid-cols-4 gap-3 bg-white text-sm">
                <div>
                    <span class="text-xs font-extrabold uppercase text-gray-500">Modal Awal</span>
                    <p class="font-mono font-bold">Rp {{ number_format((float)$shift->modal_awal, 0, ',', '.') }}</p>
                </div>
                <div>
                    <span class="text-xs font-extrabold uppercase text-gray-500">Uang Fisik Akhir</span>
                    <p class="font-mono font-bold">{{ $shift->uang_fisik_akhir ? 'Rp ' . number_format((float)$shift->uang_fisik_akhir, 0, ',', '.') : '—' }}</p>
                </div>
                <div>
                    <span class="text-xs font-extrabold uppercase text-gray-500">Selisih Kas</span>
                    @php $selisih = (float)$shift->selisih_uang; @endphp
                    <p class="font-mono font-bold {{ $selisih != 0 ? 'text-red-600' : 'text-green-600' }}">
                        {{ $selisih >= 0 ? '+' : '' }}Rp {{ number_format($selisih, 0, ',', '.') }}
                    </p>
                </div>
                <div>
                    <span class="text-xs font-extrabold uppercase text-gray-500">Sales Mode</span>
                    <p class="font-bold">{{ $shift->salesMode?->nama_sales ?? '-' }}</p>
                </div>
            </div>

            {{-- Operator Action Logs --}}
            <div class="p-5">
                <h4 class="font-extrabold uppercase text-sm mb-3 tracking-tight">
                    [OPERATOR LOGS] — {{ $shift->operatorLogs->count() }} aksi
                </h4>
                @if($shift->operatorLogs->count() > 0)
                    <div class="space-y-2">
                        @foreach($shift->operatorLogs->sortBy('waktu_kejadian') as $opLog)
                            @php
                                $logBg = match($opLog->aksi) {
                                    'open'   => 'border-green-500 bg-green-50',
                                    'break'  => 'border-yellow-500 bg-yellow-50',
                                    'resume' => 'border-blue-500 bg-blue-50',
                                    'switch' => 'border-purple-500 bg-purple-50',
                                    'closed' => 'border-gray-500 bg-gray-50',
                                    default  => 'border-red-500 bg-red-50',
                                };
                                $isAutoClose = str_contains($opLog->catatan ?? '', 'auto_closed');
                            @endphp
                            <div class="flex items-start gap-3 border-l-4 pl-4 py-2 {{ $logBg }}">
                                <div class="shrink-0 w-28">
                                    <span class="font-mono text-xs font-bold">
                                        {{ $opLog->waktu_kejadian?->format('H:i:s') }}
                                    </span>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="border-2 border-black px-2 py-0.5 text-xs font-extrabold uppercase font-mono bg-white">
                                            {{ strtoupper($opLog->aksi) }}
                                        </span>
                                        @if($isAutoClose)
                                            <span class="border-2 border-dashed border-red-600 text-red-700 bg-red-50 px-2 py-0.5 text-xs font-extrabold">
                                                [AUTO_CLOSED CRON 03:00]
                                            </span>
                                        @endif
                                        <span class="text-sm font-bold">{{ $opLog->user?->nama_user ?? '—' }}</span>
                                    </div>
                                    @if($opLog->catatan && !$isAutoClose)
                                        <p class="text-xs text-gray-600 font-mono mt-1">{{ $opLog->catatan }}</p>
                                    @elseif($isAutoClose)
                                        <p class="text-xs text-red-600 font-mono mt-1">⚠ Shift ditutup otomatis oleh sistem cron pada 03:00 karena tidak ditutup manual.</p>
                                    @endif
                                </div>
                            </div>
                        @endforeach
                    </div>
                @else
                    <p class="text-gray-400 text-sm italic">[Tidak ada log operator untuk shift ini]</p>
                @endif
            </div>
        </div>
    @empty
        <div class="bg-white border-4 border-dashed border-gray-400 p-16 text-center">
            <p class="font-extrabold text-2xl text-gray-300 uppercase">[TIDAK ADA SHIFT]</p>
            <p class="text-gray-400 mt-2">Tidak ada shift yang cocok dengan filter.</p>
        </div>
    @endforelse

    {{-- Pagination --}}
    @if($shifts->hasPages())
        <div class="bg-white border-4 border-black p-4">
            {{ $shifts->links() }}
        </div>
    @endif
</div>

@endsection

@extends('layouts.admin')

@section('title', 'Riwayat Transaksi')

@section('content')
{{-- POS-A-13: Riwayat Transaksi & Detail Struk Modal --}}

@php $hasFilter = request()->except('page'); @endphp
<div x-data="{ showFilter: {{ empty($hasFilter) ? 'false' : 'true' }} }">
    <button type="button" @click="showFilter = !showFilter" class="brutal-btn brutal-btn-secondary text-sm mb-4 brutal-shadow-sm flex items-center gap-2">
        <svg x-show="!showFilter" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        <svg x-show="showFilter" style="display:none;" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
        <span x-show="!showFilter">TAMPILKAN FILTER</span>
        <span x-show="showFilter" style="display:none;">SEMBUNYIKAN FILTER</span>
    </button>

<form id="filter-form" method="GET" action="{{ route('admin.log.transaksi.index') }}" class="mb-6" x-show="showFilter" style="{{ empty($hasFilter) ? 'display: none;' : '' }}">
    <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 class="font-extrabold text-lg uppercase mb-4 border-b-4 border-black pb-2 tracking-tight">
            PENCARIAN TRANSAKSI
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

            {{-- ID Transaksi --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">ID Transaksi</label>
                <input type="text" name="id_transaksi" value="{{ request('id_transaksi') }}"
                    placeholder="UUID / Sebagian..."
                    class="brutal-input font-mono text-sm">
            </div>

            {{-- Kasir --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Nama Kasir</label>
                <input type="text" name="kasir" value="{{ request('kasir') }}"
                    placeholder="Nama kasir..."
                    class="brutal-input">
            </div>

            {{-- Cabang --}}
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

            {{-- Metode Bayar --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Metode Bayar</label>
                <select name="id_metode" class="brutal-input bg-white">
                    <option value="">-- Semua Metode --</option>
                    @foreach($metodes as $metode)
                        <option value="{{ $metode->id_metode }}"
                            {{ request('id_metode') == $metode->id_metode ? 'selected' : '' }}>
                            {{ $metode->nama_metode }}
                        </option>
                    @endforeach
                </select>
            </div>

            {{-- Tanggal Mulai --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Mulai</label>
                <input type="date" name="tanggal_mulai" value="{{ request('tanggal_mulai') }}"
                    class="brutal-input">
            </div>

            {{-- Tanggal Akhir --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Akhir</label>
                <input type="date" name="tanggal_akhir" value="{{ request('tanggal_akhir') }}"
                    class="brutal-input">
            </div>

            {{-- Status --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Status</label>
                <select name="status" class="brutal-input bg-white">
                    <option value="">-- Semua Status --</option>
                    <option value="Success" {{ request('status') == 'Success' ? 'selected' : '' }}>[SUCCESS]</option>
                    <option value="Void" {{ request('status') == 'Void' ? 'selected' : '' }}>[VOID]</option>
                    <option value="Cancelled" {{ request('status') == 'Cancelled' ? 'selected' : '' }}>[CANCELLED]</option>
                </select>
            </div>

            {{-- Nomor Referensi RRN --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">No. Referensi (RRN)</label>
                <input type="text" name="nomor_referensi" value="{{ request('nomor_referensi') }}"
                    placeholder="RRN / Bukti Transfer..."
                    class="brutal-input font-mono text-sm">
            </div>
        </div>

        <div class="flex gap-3">
            <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">
                CARI TRANSAKSI
            </button>
            <a href="{{ route('admin.log.transaksi.index') }}"
                class="brutal-btn brutal-btn-secondary brutal-shadow">
                ATUR ULANG
            </a>
        </div>
    </div>
</form>
</div>

{{-- TABEL RIWAYAT TRANSAKSI --}}
<div id="data-container">
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    {{-- Header Tabel --}}
    <div class="p-5 border-b-4 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h3 class="font-extrabold text-xl uppercase tracking-tight">RIWAYAT TRANSAKSI</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $transaksis->total() }}</span> transaksi ditemukan
            </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
            <a href="{{ route('admin.log.transaksi.export-excel', request()->all()) }}" class="brutal-btn brutal-btn-secondary bg-green-300 text-xs py-1 px-3 brutal-shadow-sm flex items-center justify-center">
                EKSPOR EXCEL
            </a>
            <a href="{{ route('admin.log.transaksi.export-pdf', request()->all()) }}" target="_blank" class="brutal-btn brutal-btn-secondary bg-red-300 text-xs py-1 px-3 brutal-shadow-sm flex items-center justify-center">
                EKSPOR PDF
            </a>
        </div>
    </div>

    {{-- Table --}}
    <div class="overflow-x-auto">
        <table class="w-full border-collapse">
            <thead>
                <tr>
                    <th class="brutal-table-th text-xs">ID TRANSAKSI</th>
                    <th class="brutal-table-th text-xs">TANGGAL / JAM</th>
                    <th class="brutal-table-th text-xs">KASIR</th>
                    <th class="brutal-table-th text-xs">CABANG</th>
                    <th class="brutal-table-th text-xs">METODE BAYAR</th>
                    <th class="brutal-table-th text-xs">NO. REFERENSI (RRN)</th>
                    <th class="brutal-table-th text-xs text-right">TOTAL (Rp)</th>
                    <th class="brutal-table-th text-xs">STATUS</th>
                    <th class="brutal-table-th text-xs text-center">AKSI</th>
                </tr>
            </thead>
            <tbody>
                @forelse($transaksis as $trx)
                    <tr class="hover:bg-yellow-50 transition-colors
                        {{ $trx->status === 'Void' ? 'border-dashed' : '' }}
                        {{ $trx->status === 'Cancelled' ? 'opacity-70' : '' }}">

                        {{-- ID Transaksi --}}
                        <td class="brutal-table-td">
                            <span class="font-mono text-xs text-gray-700 block">
                                {{ substr($trx->id_transaksi, 0, 8) }}...
                            </span>
                        </td>

                        {{-- Tanggal & Jam --}}
                        <td class="brutal-table-td">
                            <span class="font-mono text-sm font-bold">{{ $trx->tanggal_transaksi }}</span>
                            <span class="block text-xs text-gray-500 font-mono">{{ substr($trx->jam_transaksi, 0, 5) }}</span>
                        </td>

                        {{-- Kasir --}}
                        <td class="brutal-table-td">
                            <span class="font-bold text-sm">{{ $trx->kasir?->nama_user ?? '-' }}</span>
                        </td>

                        {{-- Cabang --}}
                        <td class="brutal-table-td">
                            <span class="text-sm">{{ $trx->cabang?->nama_cabang ?? '-' }}</span>
                        </td>

                        {{-- Metode Bayar --}}
                        <td class="brutal-table-td">
                            <span class="text-sm font-bold">{{ $trx->metodePembayaran?->nama_metode ?? '-' }}</span>
                        </td>

                        {{-- Nomor Referensi --}}
                        <td class="brutal-table-td">
                            @if($trx->nomor_referensi)
                                <span class="font-mono text-xs bg-gray-100 border border-black px-2 py-0.5 inline-block">
                                    {{ $trx->nomor_referensi }}
                                </span>
                            @else
                                <span class="text-gray-400 text-xs">— TUNAI —</span>
                            @endif
                        </td>

                        {{-- Total --}}
                        <td class="brutal-table-td text-right">
                            <span class="font-mono font-extrabold text-sm
                                {{ in_array($trx->status, ['Void', 'Cancelled']) ? 'line-through text-gray-400' : '' }}">
                                {{ number_format((float)$trx->total, 0, ',', '.') }}
                            </span>
                        </td>

                        {{-- Status Badge --}}
                        <td class="brutal-table-td">
                            @php
                                $badgeClass = match($trx->status) {
                                    'Success'   => 'bg-green-400 border-black',
                                    'Void'      => 'bg-red-400 border-red-700 border-dashed',
                                    'Cancelled' => 'bg-gray-300 border-gray-500',
                                    'Draft'     => 'bg-yellow-300 border-black',
                                    default     => 'bg-gray-200 border-black',
                                };
                            @endphp
                            <span class="inline-block border-2 px-2 py-0.5 text-xs font-extrabold {{ $badgeClass }}">
                                [{{ strtoupper($trx->status) }}]
                            </span>
                        </td>

                        {{-- Aksi --}}
                        <td class="brutal-table-td text-center">
                            <button
                                type="button"
                                onclick="bukaModalStruk('{{ $trx->id_transaksi }}')"
                                class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-xs px-3 py-1">
                                DETAIL
                            </button>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="9" class="brutal-table-td text-center py-12">
                            <p class="font-extrabold text-xl text-gray-400">[TIDAK ADA DATA]</p>
                            <p class="text-sm text-gray-400 mt-1">Tidak ada transaksi yang cocok dengan filter.</p>
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- Pagination --}}
    @if($transaksis->hasPages())
        <div class="p-5 border-t-4 border-black">
            {{ $transaksis->links() }}
        </div>
    @endif
</div>
</div>

{{-- =====================================================================
     MODAL DETAIL STRUK — Neo-Brutalist
     ===================================================================== --}}
<div
    id="modalStruk"
    class="fixed inset-0 z-50 hidden items-center justify-center p-4"
    x-data="{ show: false }"
    x-show="show"
    x-cloak
    @keydown.escape.window="show = false; document.getElementById('modalStruk').classList.add('hidden')">

    {{-- Backdrop --}}
    <div class="absolute inset-0 bg-black/60" onclick="tutupModal()"></div>

    {{-- Modal Box --}}
    <div class="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">

        {{-- Modal Header --}}
        <div class="bg-black text-white p-5 flex justify-between items-center sticky top-0">
            <div>
                <h3 class="font-extrabold text-xl uppercase tracking-tight">DETAIL STRUK TRANSAKSI</h3>
                <p id="modalIdTransaksi" class="font-mono text-xs text-gray-300 mt-1"></p>
            </div>
            <button onclick="tutupModal()" class="text-white hover:text-yellow-300 font-extrabold text-2xl leading-none">✕</button>
        </div>

        {{-- Modal Loading --}}
        <div id="modalLoading" class="p-8 text-center">
            <p class="font-extrabold text-lg animate-pulse">[MEMUAT DATA...]</p>
        </div>

        {{-- Modal Content --}}
        <div id="modalContent" class="hidden">
            {{-- Info Header Transaksi --}}
            <div class="p-5 border-b-4 border-black grid grid-cols-2 gap-4">
                <div>
                    <p class="text-xs font-extrabold uppercase text-gray-500">Status</p>
                    <p id="modalStatus" class="font-extrabold text-lg"></p>
                </div>
                <div>
                    <p class="text-xs font-extrabold uppercase text-gray-500">Tanggal & Jam</p>
                    <p id="modalTanggal" class="font-mono font-bold"></p>
                </div>
                <div>
                    <p class="text-xs font-extrabold uppercase text-gray-500">Kasir</p>
                    <p id="modalKasir" class="font-bold"></p>
                </div>
                <div>
                    <p class="text-xs font-extrabold uppercase text-gray-500">Cabang</p>
                    <p id="modalCabang" class="font-bold"></p>
                </div>
                <div>
                    <p class="text-xs font-extrabold uppercase text-gray-500">Metode Bayar</p>
                    <p id="modalMetode" class="font-bold"></p>
                </div>
                <div>
                    <p class="text-xs font-extrabold uppercase text-gray-500">No. Referensi (RRN)</p>
                    <p id="modalRRN" class="font-mono text-sm font-bold"></p>
                </div>
                <div>
                    <p class="text-xs font-extrabold uppercase text-gray-500">Pelanggan</p>
                    <p id="modalPelanggan" class="font-bold"></p>
                </div>
                <div>
                    <p class="text-xs font-extrabold uppercase text-gray-500">Sales Mode</p>
                    <p id="modalSalesMode" class="font-bold"></p>
                </div>
            </div>

            {{-- Breakdown Item --}}
            <div class="p-5 border-b-4 border-black">
                <h4 class="font-extrabold uppercase mb-3 text-sm tracking-tight">[ITEM PESANAN]</h4>
                <table class="w-full border-collapse">
                    <thead>
                        <tr>
                            <th class="brutal-table-th text-xs">PRODUK</th>
                            <th class="brutal-table-th text-xs text-center">QTY</th>
                            <th class="brutal-table-th text-xs text-right">HARGA</th>
                            <th class="brutal-table-th text-xs text-right">PROMO</th>
                            <th class="brutal-table-th text-xs text-right">SUBTOTAL</th>
                            <th class="brutal-table-th text-xs text-center">STATUS</th>
                        </tr>
                    </thead>
                    <tbody id="modalItemTable">
                        {{-- Diisi oleh JS --}}
                    </tbody>
                </table>
            </div>

            {{-- Rekap Keuangan --}}
            <div class="p-5 border-b-4 border-black">
                <h4 class="font-extrabold uppercase mb-3 text-sm tracking-tight">[REKAP PEMBAYARAN]</h4>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-sm font-bold">Subtotal Item</span>
                        <span id="modalSubtotal" class="font-mono font-bold text-sm"></span>
                    </div>
                    <div class="flex justify-between" id="rowPromo">
                        <span class="text-sm font-bold text-gray-600">Diskon Promo</span>
                        <span id="modalPromo" class="font-mono font-bold text-sm text-red-600"></span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-bold text-gray-600" id="labelPajak">Pajak Cabang</span>
                        <span id="modalPajak" class="font-mono font-bold text-sm"></span>
                    </div>
                    <div class="flex justify-between border-t-4 border-black pt-2 mt-2">
                        <span class="font-extrabold text-lg uppercase">TOTAL</span>
                        <span id="modalTotal" class="font-mono font-extrabold text-lg"></span>
                    </div>
                </div>
            </div>

            {{-- Alasan Void (ditampilkan jika status VOID) --}}
            <div id="sectionVoid" class="hidden p-5 border-b-4 border-dashed border-red-600 bg-red-50">
                <h4 class="font-extrabold uppercase mb-2 text-sm text-red-700 tracking-tight">⚠ [VOID] ALASAN PEMBATALAN</h4>
                <p id="modalAlasanBatal" class="text-sm font-bold text-red-800 font-mono border-2 border-dashed border-red-600 p-3 bg-white"></p>
                <div class="mt-3 grid grid-cols-2 gap-2">
                    <div>
                        <p class="text-xs font-extrabold uppercase text-red-500">Diverifikasi Oleh</p>
                        <p id="modalDiperbarui" class="font-bold text-sm text-red-800"></p>
                    </div>
                    <div>
                        <p class="text-xs font-extrabold uppercase text-red-500">Catatan Koreksi</p>
                        <p id="modalCatatanKoreksi" class="font-bold text-sm text-red-800"></p>
                    </div>
                </div>
            </div>

            {{-- Tombol Tutup --}}
            <div class="p-5">
                <button onclick="tutupModal()" class="brutal-btn brutal-btn-secondary brutal-shadow w-full">
                    TUTUP [✕]
                </button>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    const CSRF_TOKEN = '{{ csrf_token() }}';

    function formatRp(angka) {
        return 'Rp ' + Number(angka).toLocaleString('id-ID', { minimumFractionDigits: 0 });
    }

    function bukaModalStruk(idTransaksi) {
        const modal = document.getElementById('modalStruk');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.getElementById('modalLoading').classList.remove('hidden');
        document.getElementById('modalContent').classList.add('hidden');
        document.getElementById('modalIdTransaksi').textContent = idTransaksi;

        fetch(`/admin/log/transaksi/${idTransaksi}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': CSRF_TOKEN,
            }
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) throw new Error('Gagal memuat data');
            renderModal(data.transaksi);
        })
        .catch(err => {
            document.getElementById('modalLoading').innerHTML =
                '<p class="text-red-600 font-extrabold">[ERROR] Gagal memuat data transaksi.</p>';
        });
    }

    function renderModal(trx) {
        // Header info
        const statusMap = {
            'Success': '<span class="border-2 border-black bg-green-400 px-3 py-1 font-extrabold">[SUCCESS]</span>',
            'Void':    '<span class="border-2 border-dashed border-red-600 bg-red-100 px-3 py-1 font-extrabold text-red-700">[VOID]</span>',
            'Cancelled': '<span class="border-2 border-gray-400 bg-gray-200 px-3 py-1 font-extrabold text-gray-600">[CANCELLED]</span>',
            'Draft':   '<span class="border-2 border-black bg-yellow-300 px-3 py-1 font-extrabold">[DRAFT]</span>',
        };
        document.getElementById('modalStatus').innerHTML = statusMap[trx.status] || `[${trx.status}]`;
        document.getElementById('modalTanggal').textContent = `${trx.tanggal_transaksi}  ${(trx.jam_transaksi || '').substring(0, 5)}`;
        document.getElementById('modalKasir').textContent = trx.kasir?.nama_user || '-';
        document.getElementById('modalCabang').textContent = trx.cabang?.nama_cabang || '-';
        document.getElementById('modalMetode').textContent = trx.metode_pembayaran?.nama_metode || '-';
        document.getElementById('modalRRN').textContent = trx.nomor_referensi || '— TUNAI —';
        document.getElementById('modalPelanggan').textContent = trx.nama_pelanggan || '— UMUM —';
        document.getElementById('modalSalesMode').textContent = trx.sales_mode?.nama_sales || '-';

        // Tabel Item
        const tbody = document.getElementById('modalItemTable');
        tbody.innerHTML = '';
        let subtotalBruto = 0;
        let totalPromoItem = 0;

        if (trx.details && trx.details.length > 0) {
            trx.details.forEach(item => {
                const harga = parseFloat(item.harga_produk || 0);
                const qty = parseInt(item.quantity || 0);
                const promo = parseFloat(item.nominal_promo || 0);
                const subtotal = parseFloat(item.subtotal_item || 0);
                subtotalBruto += harga * qty;
                totalPromoItem += promo;

                const isVoid = item.status_item === 'Void';
                const row = `
                    <tr class="${isVoid ? 'bg-red-50 opacity-60' : 'hover:bg-gray-50'}">
                        <td class="brutal-table-td text-sm ${isVoid ? 'line-through text-gray-400' : ''}">
                            ${item.menu?.nama_menu || 'Produk Tidak Diketahui'}
                            ${item.alasan_batal_item ? `<br><span class="text-xs text-red-600 font-mono no-underline">⚠ ${item.alasan_batal_item}</span>` : ''}
                        </td>
                        <td class="brutal-table-td text-center font-mono font-bold">${qty}</td>
                        <td class="brutal-table-td text-right font-mono text-sm">${formatRp(harga)}</td>
                        <td class="brutal-table-td text-right font-mono text-sm text-red-600">${promo > 0 ? '-' + formatRp(promo) : '-'}</td>
                        <td class="brutal-table-td text-right font-mono font-bold text-sm">${formatRp(subtotal)}</td>
                        <td class="brutal-table-td text-center">
                            <span class="text-xs font-extrabold border ${isVoid ? 'border-dashed border-red-500 text-red-600' : 'border-black bg-green-100'}  px-1 py-0.5">
                                [${(item.status_item || 'Active').toUpperCase()}]
                            </span>
                        </td>
                    </tr>`;
                tbody.innerHTML += row;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="brutal-table-td text-center text-gray-400 italic">Tidak ada item detail.</td></tr>';
        }

        // Rekap keuangan
        const total = parseFloat(trx.total || 0);
        const pajak = parseFloat(trx.tax || 0);
        const promoTrx = parseFloat(trx.nominal_promo || 0);
        const totalPromo = totalPromoItem + promoTrx;

        document.getElementById('modalSubtotal').textContent = formatRp(subtotalBruto);
        document.getElementById('modalPromo').textContent = totalPromo > 0 ? '- ' + formatRp(totalPromo) : '—';
        document.getElementById('rowPromo').style.display = totalPromo > 0 ? 'flex' : 'none';
        document.getElementById('labelPajak').textContent = `Pajak (${trx.cabang?.pajak_persen || 0}%)`;
        document.getElementById('modalPajak').textContent = formatRp(pajak);
        document.getElementById('modalTotal').textContent = formatRp(total);

        // Void section
        const sectionVoid = document.getElementById('sectionVoid');
        if (trx.status === 'Void') {
            sectionVoid.classList.remove('hidden');
            document.getElementById('modalAlasanBatal').textContent = trx.alasan_batal || '(Tidak ada alasan tercatat)';
            document.getElementById('modalDiperbarui').textContent = trx.updated_by?.nama_user || '-';
            document.getElementById('modalCatatanKoreksi').textContent = trx.catatan_koreksi || '-';
        } else {
            sectionVoid.classList.add('hidden');
        }

        // Tampilkan konten, sembunyikan loading
        document.getElementById('modalLoading').classList.add('hidden');
        document.getElementById('modalContent').classList.remove('hidden');
    }

    function tutupModal() {
        const modal = document.getElementById('modalStruk');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
</script>
@endpush
@endsection

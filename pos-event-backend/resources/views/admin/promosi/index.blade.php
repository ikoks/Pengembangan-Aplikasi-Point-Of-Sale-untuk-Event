@extends('layouts.admin')
@section('title', 'Master Promosi')

@section('content')
{{-- FORM TAMBAH PROMOSI (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_promo') ? 'true' : 'false' }} }" class="mb-6">
    <button @click="openForm = !openForm"
        class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
        <span>+ TAMBAH PROMOSI BARU</span>
        <svg :class="openForm ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path>
        </svg>
    </button>

    <div x-show="openForm" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
        <form action="{{ route('admin.promosi.store') }}" method="POST">
            @csrf
            <div x-data="{ 
                cakupan: '{{ old('cakupan_promo') }}',
                tanggalMulai: '{{ old('tanggal_mulai') }}',
                tanggalSelesai: '{{ old('tanggal_selesai') }}',
                waktuMulai: '{{ old('waktu_mulai') }}',
                waktuSelesai: '{{ old('waktu_selesai') }}',
                validateDates() {
                    if (this.tanggalSelesai && this.tanggalMulai && this.tanggalSelesai < this.tanggalMulai) {
                        alert('Tanggal selesai tidak boleh kurang dari tanggal mulai!');
                        this.tanggalSelesai = '';
                    }
                },
                validateTimes() {
                    if (this.tanggalMulai && this.tanggalSelesai && this.tanggalMulai === this.tanggalSelesai) {
                        if (this.waktuSelesai && this.waktuMulai && this.waktuSelesai <= this.waktuMulai) {
                            alert('Waktu selesai harus lebih besar dari waktu mulai di hari yang sama!');
                            this.waktuSelesai = '';
                        }
                    }
                }
            }">
                <div class="mb-4">
                    <label class="block text-xs font-extrabold uppercase mb-1">Cakupan Promosi <span class="text-red-600">*</span></label>
                    <select name="cakupan_promo" x-model="cakupan" class="brutal-input bg-white" required>
                        <option value="">-- Pilih Cakupan --</option>
                        <option value="Per Transaksi">Per Transaksi</option>
                        <option value="Per Item">Per Item</option>
                        <option value="Free Item">Free Item</option>
                    </select>
                    @error('cakupan_promo') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                </div>

                <div x-show="cakupan !== ''" x-cloak class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="col-span-1 md:col-span-2" x-data="{ 
                        checkAll: false,
                        toggleAll() {
                            this.checkAll = !this.checkAll;
                            $el.querySelectorAll('.cabang-promo-cb').forEach(cb => cb.checked = this.checkAll);
                        }
                    }">
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs font-extrabold uppercase">Pilih Cabang / Event <span class="text-red-600">*</span></label>
                            <button type="button" @click="toggleAll()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                                [ <span x-text="checkAll ? 'Batal Pilih Semua' : 'Pilih Semua Cabang'"></span> ]
                            </button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border-2 border-black p-3 bg-white max-h-40 overflow-y-auto brutal-shadow-sm">
                            @foreach($cabangs as $cabang)
                                <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                    <input type="checkbox" name="id_cabang[]" value="{{ $cabang->id_cabang }}" 
                                        class="cabang-promo-cb brutal-checkbox"
                                        {{ is_array(old('id_cabang')) && in_array($cabang->id_cabang, old('id_cabang')) ? 'checked' : '' }}>
                                    <span>{{ $cabang->nama_cabang }}</span>
                                </label>
                            @endforeach
                        </div>
                        @error('id_cabang') <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @enderror
                    </div>

                    <div class="col-span-1 md:col-span-2" x-data="{ 
                        checkAllSales: false,
                        toggleAllSales() {
                            this.checkAllSales = !this.checkAllSales;
                            $el.querySelectorAll('.sales-promo-cb').forEach(cb => cb.checked = this.checkAllSales);
                        }
                    }">
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs font-extrabold uppercase">Pilih Sales Mode <span class="text-red-600">*</span></label>
                            <button type="button" @click="toggleAllSales()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                                [ <span x-text="checkAllSales ? 'Batal Pilih Semua' : 'Pilih Semua Sales Mode'"></span> ]
                            </button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border-2 border-black p-3 bg-white max-h-40 overflow-y-auto brutal-shadow-sm">
                            @foreach($salesModes as $mode)
                                <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                    <input type="checkbox" name="id_sales[]" value="{{ $mode->id_sales }}" 
                                        class="sales-promo-cb brutal-checkbox"
                                        {{ is_array(old('id_sales')) && in_array($mode->id_sales, old('id_sales')) ? 'checked' : '' }}>
                                    <span>{{ $mode->nama_mode }}</span>
                                </label>
                            @endforeach
                        </div>
                        @error('id_sales') <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @enderror
                    </div>

                    <div class="col-span-1 md:col-span-2" x-data="{ 
                        checkAllHari: false,
                        toggleAllHari() {
                            this.checkAllHari = !this.checkAllHari;
                            $el.querySelectorAll('.hari-promo-cb').forEach(cb => cb.checked = this.checkAllHari);
                        }
                    }">
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs font-extrabold uppercase">Hari Aktif Promosi <span class="text-red-600">*</span></label>
                            <button type="button" @click="toggleAllHari()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                                [ <span x-text="checkAllHari ? 'Batal Pilih Semua' : 'Pilih Semua Hari'"></span> ]
                            </button>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 border-2 border-black p-3 bg-white brutal-shadow-sm">
                            @foreach(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as $hari)
                                <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                    <input type="checkbox" name="hari_aktif[]" value="{{ $hari }}" 
                                        class="hari-promo-cb brutal-checkbox"
                                        {{ is_array(old('hari_aktif')) && in_array($hari, old('hari_aktif')) ? 'checked' : '' }}>
                                    <span>{{ $hari }}</span>
                                </label>
                            @endforeach
                        </div>
                        @error('hari_aktif') <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @enderror
                    </div>

                    <div class="col-span-1 md:col-span-2" x-show="['Per Item', 'Free Item'].includes(cakupan)" x-data="{ 
                        checkAllMenu: false,
                        toggleAllMenu() {
                            this.checkAllMenu = !this.checkAllMenu;
                            $el.querySelectorAll('.menu-promo-cb').forEach(cb => cb.checked = this.checkAllMenu);
                        }
                    }">
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs font-extrabold uppercase">Pilih Menu (Syarat/Gratis) <span class="text-red-600">*</span></label>
                            <button type="button" @click="toggleAllMenu()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                                [ <span x-text="checkAllMenu ? 'Batal Pilih Semua' : 'Pilih Semua Menu'"></span> ]
                            </button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border-2 border-black p-3 bg-white max-h-40 overflow-y-auto brutal-shadow-sm">
                            @foreach($menus as $menu)
                                <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                    <input type="checkbox" name="syarat_menu[]" value="{{ $menu->id_menu }}" 
                                        class="menu-promo-cb brutal-checkbox"
                                        {{ is_array(old('syarat_menu')) && in_array($menu->id_menu, old('syarat_menu')) ? 'checked' : '' }}>
                                    <span>{{ $menu->nama_menu }}</span>
                                </label>
                            @endforeach
                        </div>
                        @error('syarat_menu') <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @enderror
                    </div>

                    <div class="col-span-1 md:col-span-2">
                        <label class="block text-xs font-extrabold uppercase mb-1">Nama Promosi <span class="text-red-600">*</span></label>
                        <input type="text" name="nama_promo" value="{{ old('nama_promo') }}" class="brutal-input" required>
                        @error('nama_promo') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>

                    <div x-show="['Per Transaksi', 'Per Item'].includes(cakupan)">
                        <label class="block text-xs font-extrabold uppercase mb-1">Tipe Promosi</label>
                        <select name="tipe_promo" class="brutal-input bg-white" :required="['Per Transaksi', 'Per Item'].includes(cakupan)">
                            <option value="Nominal" {{ old('tipe_promo') == 'Nominal' ? 'selected' : '' }}>Nominal (Rp)</option>
                            <option value="Persen" {{ old('tipe_promo') == 'Persen' ? 'selected' : '' }}>Persen (%)</option>
                        </select>
                        @error('tipe_promo') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>
                    <div x-show="['Per Transaksi', 'Per Item'].includes(cakupan)">
                        <label class="block text-xs font-extrabold uppercase mb-1">Nilai Promosi</label>
                        <input type="number" step="0.01" name="nilai_promo" value="{{ old('nilai_promo') }}" class="brutal-input">
                        <p class="text-[10px] mt-1 text-gray-500 font-bold">Kosongkan jika free item.</p>
                        @error('nilai_promo') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>

                    <div>
                        <label class="block text-xs font-extrabold uppercase mb-1">Min. Pembelian (Rp)</label>
                        <input type="number" step="0.01" name="min_pembelian" value="{{ old('min_pembelian', 0) }}" class="brutal-input">
                        @error('min_pembelian') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>
                    <div x-show="!['Per Transaksi', 'Per Item'].includes(cakupan)"></div> <!-- Spacer -->

                    <div>
                        <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Mulai</label>
                        <input type="date" name="tanggal_mulai" x-model="tanggalMulai" @change="validateDates(); validateTimes();" class="brutal-input" min="{{ date('Y-m-d') }}">
                        @error('tanggal_mulai') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Selesai</label>
                        <input type="date" name="tanggal_selesai" x-model="tanggalSelesai" @change="validateDates(); validateTimes();" class="brutal-input" min="{{ date('Y-m-d') }}">
                        @error('tanggal_selesai') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>

                    <div>
                        <label class="block text-xs font-extrabold uppercase mb-1">Waktu Mulai</label>
                        <input type="time" name="waktu_mulai" x-model="waktuMulai" @change="validateTimes()" class="brutal-input">
                        @error('waktu_mulai') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold uppercase mb-1">Waktu Selesai</label>
                        <input type="time" name="waktu_selesai" x-model="waktuSelesai" @change="validateTimes()" class="brutal-input">
                        @error('waktu_selesai') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
                    </div>
                </div>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">SIMPAN PROMOSI</button>
                <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary brutal-shadow">BATAL</button>
            </div>
        </form>
    </div>
</div>

{{-- TABEL DAFTAR PROMOSI --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl uppercase tracking-tight">DAFTAR PROMOSI</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $promosis->total() }}</span> promosi terdaftar
            </p>
        </div>

        {{-- Search --}}
        <form method="GET" action="{{ route('admin.promosi.index') }}" class="flex gap-2">
            <input type="text" name="search" value="{{ request('search') }}"
                placeholder="Cari nama promosi..."
                class="brutal-input text-sm w-48">
            <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm px-3">
                CARI
            </button>
        </form>
    </div>

    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-max">
            <thead class="bg-black text-white">
                <tr>
                    <th class="brutal-table-th text-xs">NAMA PROMOSI</th>
                    <th class="brutal-table-th text-xs">CABANG</th>
                    <th class="brutal-table-th text-xs">SALES MODE</th>
                    <th class="brutal-table-th text-xs">TIPE</th>
                    <th class="brutal-table-th text-xs">NILAI / SYARAT</th>
                    <th class="brutal-table-th text-xs">MASA BERLAKU</th>
                    <th class="brutal-table-th text-xs w-48 text-center">AKSI</th>
                </tr>
            </thead>
            <tbody>
            @forelse($promosis as $promosi)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $promosi->nama_promo }}</td>
                <td class="brutal-table-td">{{ $promosi->cabang->nama_cabang ?? '-' }}</td>
                <td class="brutal-table-td">{{ $promosi->salesMode->nama_mode ?? '-' }}</td>
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
                    @if($promosi->waktu_mulai && $promosi->waktu_selesai)
                        <br><span class="text-xs font-mono font-bold">{{ \Carbon\Carbon::parse($promosi->waktu_mulai)->format('H:i') }} - {{ \Carbon\Carbon::parse($promosi->waktu_selesai)->format('H:i') }}</span>
                    @endif
                    @if($promosi->hari_aktif && count($promosi->hari_aktif) > 0)
                        <br><span class="text-[10px] text-gray-600 font-bold uppercase">{{ implode(', ', $promosi->hari_aktif) }}</span>
                    @endif
                </td>
                <td class="brutal-table-td text-center space-x-2">
                    <!-- Edit Modal -->
                    <div x-data="{ open: {{ $errors->any() && old('id_promo') == $promosi->id_promo ? 'true' : 'false' }} }" class="inline-block">
                        <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</button>

                        <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left overflow-y-auto">
                            <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-2xl w-full my-8">
                                <h2 class="text-xl font-black uppercase mb-4 border-b-2 border-brutal-black pb-2">Edit Promosi</h2>
                                <form action="{{ route('admin.promosi.update', $promosi->id_promo) }}" method="POST">
                                    @csrf
                                    @method('PUT')
                                    <input type="hidden" name="id_promo" value="{{ $promosi->id_promo }}">
                                    
                                    <div x-data="{ 
                                        cakupan: '{{ old('id_promo') == $promosi->id_promo ? old('cakupan_promo') : $promosi->cakupan_promo }}',
                                        tanggalMulai: '{{ old('id_promo') == $promosi->id_promo ? old('tanggal_mulai') : ($promosi->tanggal_mulai ? \Carbon\Carbon::parse($promosi->tanggal_mulai)->format('Y-m-d') : '') }}',
                                        tanggalSelesai: '{{ old('id_promo') == $promosi->id_promo ? old('tanggal_selesai') : ($promosi->tanggal_selesai ? \Carbon\Carbon::parse($promosi->tanggal_selesai)->format('Y-m-d') : '') }}',
                                        waktuMulai: '{{ old('id_promo') == $promosi->id_promo ? old('waktu_mulai') : ($promosi->waktu_mulai ? \Carbon\Carbon::parse($promosi->waktu_mulai)->format('H:i') : '') }}',
                                        waktuSelesai: '{{ old('id_promo') == $promosi->id_promo ? old('waktu_selesai') : ($promosi->waktu_selesai ? \Carbon\Carbon::parse($promosi->waktu_selesai)->format('H:i') : '') }}',
                                        validateDates() {
                                            if (this.tanggalSelesai && this.tanggalMulai && this.tanggalSelesai < this.tanggalMulai) {
                                                alert('Tanggal selesai tidak boleh kurang dari tanggal mulai!');
                                                this.tanggalSelesai = '';
                                            }
                                        },
                                        validateTimes() {
                                            if (this.tanggalMulai && this.tanggalSelesai && this.tanggalMulai === this.tanggalSelesai) {
                                                if (this.waktuSelesai && this.waktuMulai && this.waktuSelesai <= this.waktuMulai) {
                                                    alert('Waktu selesai harus lebih besar dari waktu mulai di hari yang sama!');
                                                    this.waktuSelesai = '';
                                                }
                                            }
                                        }
                                    }">
                                        <div class="mb-4">
                                            <label class="block text-xs font-extrabold uppercase mb-1">Cakupan Promosi <span class="text-red-600">*</span></label>
                                            <select name="cakupan_promo" x-model="cakupan" class="brutal-input bg-white" required>
                                                <option value="">-- Pilih Cakupan --</option>
                                                <option value="Per Transaksi">Per Transaksi</option>
                                                <option value="Per Item">Per Item</option>
                                                <option value="Free Item">Free Item</option>
                                            </select>
                                            @error('cakupan_promo') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                        </div>

                                        <div x-show="cakupan !== ''" x-cloak>
                                            <!-- CABANG -->
                                            <div class="mb-4" x-data="{ 
                                                checkAll: false,
                                                toggleAll() {
                                                    this.checkAll = !this.checkAll;
                                                    $el.querySelectorAll('.cabang-promo-edit-cb').forEach(cb => cb.checked = this.checkAll);
                                                }
                                            }">
                                                <div class="flex justify-between items-center mb-1">
                                                    <label class="block font-extrabold uppercase text-xs text-left">Pilih Cabang / Event <span class="text-red-600">*</span></label>
                                                    <button type="button" @click="toggleAll()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                                                        [ <span x-text="checkAll ? 'Batal Pilih Semua' : 'Pilih Semua Cabang'"></span> ]
                                                    </button>
                                                </div>
                                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 border-2 border-black p-3 bg-white max-h-36 overflow-y-auto brutal-shadow-sm text-left">
                                                    @foreach($cabangs as $cabang)
                                                        <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                                            <input type="checkbox" name="id_cabang[]" value="{{ $cabang->id_cabang }}" 
                                                                class="cabang-promo-edit-cb brutal-checkbox"
                                                                {{ (old('id_promo') == $promosi->id_promo && is_array(old('id_cabang')) && in_array($cabang->id_cabang, old('id_cabang'))) || $promosi->id_cabang == $cabang->id_cabang ? 'checked' : '' }}>
                                                            <span>{{ $cabang->nama_cabang }}</span>
                                                        </label>
                                                    @endforeach
                                                </div>
                                                @error('id_cabang') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                            </div>

                                            <!-- SALES MODE -->
                                            <div class="mb-4" x-data="{ 
                                                checkAllSales: false,
                                                toggleAllSales() {
                                                    this.checkAllSales = !this.checkAllSales;
                                                    $el.querySelectorAll('.sales-promo-edit-cb').forEach(cb => cb.checked = this.checkAllSales);
                                                }
                                            }">
                                                <div class="flex justify-between items-center mb-1">
                                                    <label class="block font-extrabold uppercase text-xs text-left">Pilih Sales Mode <span class="text-red-600">*</span></label>
                                                    <button type="button" @click="toggleAllSales()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                                                        [ <span x-text="checkAllSales ? 'Batal Pilih Semua' : 'Pilih Semua Sales Mode'"></span> ]
                                                    </button>
                                                </div>
                                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 border-2 border-black p-3 bg-white max-h-36 overflow-y-auto brutal-shadow-sm text-left">
                                                    @foreach($salesModes as $mode)
                                                        <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                                            <input type="checkbox" name="id_sales[]" value="{{ $mode->id_sales }}" 
                                                                class="sales-promo-edit-cb brutal-checkbox"
                                                                {{ (old('id_promo') == $promosi->id_promo && is_array(old('id_sales')) && in_array($mode->id_sales, old('id_sales'))) || $promosi->id_sales == $mode->id_sales ? 'checked' : '' }}>
                                                            <span>{{ $mode->nama_mode }}</span>
                                                        </label>
                                                    @endforeach
                                                </div>
                                                @error('id_sales') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                            </div>

                                            <!-- HARI AKTIF -->
                                            <div class="mb-4" x-data="{ 
                                                checkAllHari: false,
                                                toggleAllHari() {
                                                    this.checkAllHari = !this.checkAllHari;
                                                    $el.querySelectorAll('.hari-promo-edit-cb').forEach(cb => cb.checked = this.checkAllHari);
                                                }
                                            }">
                                                <div class="flex justify-between items-center mb-1">
                                                    <label class="block font-extrabold uppercase text-xs text-left">Hari Aktif Promosi <span class="text-red-600">*</span></label>
                                                    <button type="button" @click="toggleAllHari()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                                                        [ <span x-text="checkAllHari ? 'Batal Pilih Semua' : 'Pilih Semua Hari'"></span> ]
                                                    </button>
                                                </div>
                                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 border-2 border-black p-3 bg-white max-h-36 overflow-y-auto brutal-shadow-sm text-left">
                                                    @foreach(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as $hari)
                                                        <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                                            <input type="checkbox" name="hari_aktif[]" value="{{ $hari }}" 
                                                                class="hari-promo-edit-cb brutal-checkbox"
                                                                {{ (old('id_promo') == $promosi->id_promo && is_array(old('hari_aktif')) && in_array($hari, old('hari_aktif'))) || (!old('id_promo') && is_array($promosi->hari_aktif) && in_array($hari, $promosi->hari_aktif)) ? 'checked' : '' }}>
                                                            <span>{{ $hari }}</span>
                                                        </label>
                                                    @endforeach
                                                </div>
                                                @error('hari_aktif') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                            </div>

                                            <!-- SYARAT MENU -->
                                            <div class="mb-4" x-show="['Per Item', 'Free Item'].includes(cakupan)" x-data="{ 
                                                checkAllMenu: false,
                                                toggleAllMenu() {
                                                    this.checkAllMenu = !this.checkAllMenu;
                                                    $el.querySelectorAll('.menu-promo-edit-cb').forEach(cb => cb.checked = this.checkAllMenu);
                                                }
                                            }">
                                                <div class="flex justify-between items-center mb-1">
                                                    <label class="block font-extrabold uppercase text-xs text-left">Pilih Menu (Syarat/Gratis) <span class="text-red-600">*</span></label>
                                                    <button type="button" @click="toggleAllMenu()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">
                                                        [ <span x-text="checkAllMenu ? 'Batal Pilih Semua' : 'Pilih Semua Menu'"></span> ]
                                                    </button>
                                                </div>
                                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 border-2 border-black p-3 bg-white max-h-36 overflow-y-auto brutal-shadow-sm text-left">
                                                    @foreach($menus as $menu)
                                                        <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
                                                            <input type="checkbox" name="syarat_menu[]" value="{{ $menu->id_menu }}" 
                                                                class="menu-promo-edit-cb brutal-checkbox"
                                                                {{ (old('id_promo') == $promosi->id_promo && is_array(old('syarat_menu')) && in_array($menu->id_menu, old('syarat_menu'))) || (!old('id_promo') && is_array($promosi->syarat_menu) && in_array($menu->id_menu, $promosi->syarat_menu)) ? 'checked' : '' }}>
                                                            <span>{{ $menu->nama_menu }}</span>
                                                        </label>
                                                    @endforeach
                                                </div>
                                                @error('syarat_menu') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                            </div>

                                            <div class="mb-4">
                                                <label class="block font-extrabold mb-2 uppercase text-xs text-left">Nama Promosi</label>
                                                <input type="text" name="nama_promo" value="{{ old('id_promo') == $promosi->id_promo ? old('nama_promo') : $promosi->nama_promo }}" class="brutal-input" required>
                                                @error('nama_promo') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                            </div>

                                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                <div x-show="['Per Transaksi', 'Per Item'].includes(cakupan)">
                                                    <label class="block font-extrabold mb-2 uppercase text-xs text-left">Tipe Promosi</label>
                                                    <select name="tipe_promo" class="brutal-input bg-white" :required="['Per Transaksi', 'Per Item'].includes(cakupan)">
                                                        <option value="Nominal" {{ (old('id_promo') == $promosi->id_promo ? old('tipe_promo') : $promosi->tipe_promo) == 'Nominal' ? 'selected' : '' }}>Nominal (Rp)</option>
                                                        <option value="Persen" {{ (old('id_promo') == $promosi->id_promo ? old('tipe_promo') : $promosi->tipe_promo) == 'Persen' ? 'selected' : '' }}>Persen (%)</option>
                                                    </select>
                                                    @error('tipe_promo') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                                </div>
                                                <div x-show="['Per Transaksi', 'Per Item'].includes(cakupan)">
                                                    <label class="block font-extrabold mb-2 uppercase text-xs text-left">Nilai Promosi</label>
                                                    <input type="number" step="0.01" name="nilai_promo" value="{{ old('id_promo') == $promosi->id_promo ? old('nilai_promo') : (float)$promosi->nilai_promo }}" class="brutal-input">
                                                    @error('nilai_promo') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                                </div>
                                                <div>
                                                    <label class="block font-extrabold mb-2 uppercase text-xs text-left">Min. Pembelian (Rp)</label>
                                                    <input type="number" step="0.01" name="min_pembelian" value="{{ old('id_promo') == $promosi->id_promo ? old('min_pembelian') : (float)$promosi->min_pembelian }}" class="brutal-input">
                                                    @error('min_pembelian') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                                </div>
                                            </div>

                                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                <div>
                                                    <label class="block font-extrabold mb-2 uppercase text-xs text-left">Tanggal Mulai</label>
                                                    <input type="date" name="tanggal_mulai" x-model="tanggalMulai" @change="validateDates(); validateTimes();" class="brutal-input" min="{{ date('Y-m-d') }}">
                                                    @error('tanggal_mulai') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                                </div>
                                                <div>
                                                    <label class="block font-extrabold mb-2 uppercase text-xs text-left">Tanggal Selesai</label>
                                                    <input type="date" name="tanggal_selesai" x-model="tanggalSelesai" @change="validateDates(); validateTimes();" class="brutal-input" min="{{ date('Y-m-d') }}">
                                                    @error('tanggal_selesai') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                                </div>
                                                <div>
                                                    <label class="block font-extrabold mb-2 uppercase text-xs text-left">Waktu Mulai</label>
                                                    <input type="time" name="waktu_mulai" x-model="waktuMulai" @change="validateTimes()" class="brutal-input">
                                                    @error('waktu_mulai') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                                </div>
                                                <div>
                                                    <label class="block font-extrabold mb-2 uppercase text-xs text-left">Waktu Selesai</label>
                                                    <input type="time" name="waktu_selesai" x-model="waktuSelesai" @change="validateTimes()" class="brutal-input">
                                                    @error('waktu_selesai') @if(old('id_promo') == $promosi->id_promo) <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @endif @enderror
                                                </div>
                                            </div>
                                        </div> <!-- End x-show cakupan -->
                                    </div>
                                    <div class="flex gap-4">
                                        <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN</button>
                                        <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">BATAL</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <form action="{{ route('admin.promosi.destroy', $promosi->id_promo) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus promosi ini?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data promosi.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

@if($promosis->hasPages())
    <div class="p-5 border-t-4 border-black">
        {{ $promosis->links() }}
    </div>
@endif
</div>
@endsection

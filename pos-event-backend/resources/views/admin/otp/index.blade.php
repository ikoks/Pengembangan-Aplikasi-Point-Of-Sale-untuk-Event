@extends('layouts.admin')
@section('title', 'OTP Void')

@section('content')
<div class="mb-6">

 <!-- Toast Notification Container -->
 <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none" 
   x-data="{ toasts: [] }"
   x-on:show-toast.window="
   const newToast = { id: Date.now(), type: $event.detail.type, message: $event.detail.message };
   toasts.push(newToast);
   setTimeout(() => { toasts = toasts.filter(t => t.id !== newToast.id) }, 5000);
   ">
  <template x-for="toast in toasts" :key="toast.id">
   <div :class="toast.type === 'success' ? 'bg-green-400' : (toast.type === 'error' ? 'bg-red-400' : 'bg-yellow-400')"
     class="pointer-events-auto text-brutal-black font-extrabold px-5 py-2.5 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 text-sm rounded-none"
     x-transition:enter="transition ease-out duration-200"
     x-transition:enter-start="opacity-0 -translate-y-4"
     x-transition:enter-end="opacity-100 translate-y-0"
     x-transition:leave="transition ease-in duration-200"
     x-transition:leave-start="opacity-100 translate-y-0"
     x-transition:leave-end="opacity-0 -translate-y-4">
    <span x-text="toast.message"></span>
    <button @click="toasts = toasts.filter(t => t.id !== toast.id)" class="ml-2 font-black hover:opacity-75">✕</button>
   </div>
  </template>
 </div>

 <div class="flex flex-col gap-6">
  <!-- Data untuk Alpine -->
  @php
      $kasirListData = $kasirs->map(fn($k) => [
          'id_user' => $k->id_user, 
          'nama_user' => $k->nama_user
      ]);
      
      $activeOtpData = $activeOtp ? [
          'otp_code' => $activeOtp->otp_code,
          'status' => $activeOtp->status,
          'expires_at' => $activeOtp->expires_at->toIso8601String(),
          'target_kasir' => $activeOtp->kasir?->nama_user,
          'target_cabang' => $activeOtp->cabang?->nama_cabang,
          'target_sales' => $activeOtp->salesMode?->nama_mode,
      ] : null;
  @endphp
  <script>
      window.otpGeneratorData = {
          kasirList: @json($kasirListData),
          activeOtp: @json($activeOtpData)
      };
  </script>

  <!-- Panel Utama Generator OTP -->
  <div class="w-full max-w-2xl mx-auto" x-data="{
   // State form target
   idCabang: '',
   idSales: '',
   idKasir: '',
   kasirList: window.otpGeneratorData.kasirList,
   filteredKasirs: [],
   loadingKasir: false,

   // State OTP
   otpCode: window.otpGeneratorData.activeOtp?.otp_code ?? '',
   status: window.otpGeneratorData.activeOtp?.status ?? '',
   expiresAt: window.otpGeneratorData.activeOtp?.expires_at ?? '',
   targetKasir: window.otpGeneratorData.activeOtp?.target_kasir ?? '',
   targetCabang: window.otpGeneratorData.activeOtp?.target_cabang ?? '',
   targetSales: window.otpGeneratorData.activeOtp?.target_sales ?? '',
   timeLeft: 0,
   timerInterval: null,
   pollingInterval: null,

   get canGenerate() {
    return this.idCabang !== '' && this.idSales !== '' && this.idKasir !== '';
   },

   init() {
    this.filteredKasirs = [];
    if (this.otpCode && this.expiresAt) {
     this.startCountdown();
    }
    // Polling table history setiap 5 detik
    this.pollingInterval = setInterval(() => {
     if (window.refreshTable) window.refreshTable();
    }, 5000);
   },

   destroy() {
    this.stopCountdown();
    if (this.pollingInterval) clearInterval(this.pollingInterval);
   },

   async onCabangChange() {
    this.idSales = '';
    this.idKasir = '';
    this.filteredKasirs = [];
    if (!this.idCabang) {
     return;
    }
    this.loadingKasir = true;
    try {
     const url = new URL('{{ route('admin.otp.kasir-by-cabang') }}', window.location.origin);
     url.searchParams.set('id_cabang', this.idCabang);
     const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
     const data = await res.json();
     this.filteredKasirs = data.data ?? [];
    } catch (e) {
     console.error('Gagal memuat kasir:', e);
     this.filteredKasirs = [];
    } finally {
     this.loadingKasir = false;
    }
   },

   formatOtp(code) {
    if (!code || code.length !== 6) return '- - - - - -';
    return code.split('').join(' ');
   },

   async generateOtp() {
    if (!this.canGenerate) return;
    try {
     const response = await fetch('{{ route('admin.otp.generate') }}', {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
       'X-CSRF-TOKEN': '{{ csrf_token() }}',
       'Accept': 'application/json'
      },
      body: JSON.stringify({
       id_kasir: this.idKasir,
       id_cabang: this.idCabang,
       id_sales: this.idSales,
      })
     });

     const result = await response.json();

     if (result.success) {
      this.otpCode     = result.data.otp_code;
      this.status      = result.data.status;
      this.expiresAt   = result.data.expires_at;
      this.targetKasir = result.data.target_kasir;
      this.targetCabang= result.data.target_cabang;
      this.targetSales = result.data.target_sales;
      this.startCountdown();
      if (window.refreshTable) window.refreshTable();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'OTP berhasil digenerate untuk ' + result.data.target_kasir, type: 'success' } }));
     } else {
      const msg = result.message ?? result.errors ?? 'Gagal generate OTP';
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: typeof msg === 'string' ? msg : JSON.stringify(msg), type: 'error' } }));
     }
    } catch (error) {
     console.error('Error:', error);
     window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Terjadi kesalahan koneksi', type: 'error' } }));
    }
   },

   startCountdown() {
    this.stopCountdown();
    this.updateTimeLeft();
    this.timerInterval = setInterval(() => { this.updateTimeLeft(); }, 1000);
   },

   stopCountdown() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
   },

   updateTimeLeft() {
    if (!this.expiresAt) { this.timeLeft = 0; return; }
    const diffSeconds = Math.floor((new Date(this.expiresAt) - new Date()) / 1000);
    if (diffSeconds <= 0) {
     this.timeLeft = 0;
     this.status = 'expired';
     this.stopCountdown();
     if (window.refreshTable) window.refreshTable();
    } else {
     this.timeLeft = diffSeconds;
    }
   },

   copyOtp() {
    if (!this.otpCode) return;
    navigator.clipboard.writeText(this.otpCode).then(() => {
     window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Kode OTP berhasil disalin: ' + this.otpCode, type: 'success' } }));
    }).catch(() => {
     window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Gagal menyalin kode OTP', type: 'error' } }));
    });
   }
  }" @turbo:before-cache.window="destroy()">

   <div class="bg-[#F5F0E8] border-4 border-[#0A0A0A] p-6 shadow-[4px_4px_0px_0px_#0A0A0A] flex flex-col gap-5">

    <!-- Judul -->
    <div class="text-center border-b-4 border-[#0A0A0A] pb-4">
     <p class="font-bold text-sm text-gray-600 mt-1">Pilih Target Kasir terlebih dahulu sebelum Membuat OTP</p>
    </div>

    <!-- ===== FORM PEMILIHAN TARGET ===== -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

     <!-- Pilih Cabang -->
     <div>
      <label class="block text-xs font-extrabold mb-1">
       Pilih Cabang / Event <span class="text-red-600">*</span>
      </label>
      <select x-model="idCabang" @change="onCabangChange()" class="brutal-input bg-white w-full text-sm">
       <option value="">-- Pilih Cabang --</option>
       @foreach($cabangs as $cabang)
        <option value="{{ $cabang->id_cabang }}">{{ $cabang->nama_cabang }}</option>
       @endforeach
      </select>
     </div>

     <!-- Pilih Sales Mode -->
     <div>
      <label class="block text-xs font-extrabold mb-1" :class="!idCabang ? 'text-gray-400' : ''">
       Pilih Mode Penjualan <span class="text-red-600">*</span>
      </label>
      <select x-model="idSales" @change="idKasir = ''" :disabled="!idCabang" :class="!idCabang ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-white'" class="brutal-input w-full text-sm">
       <option value="" x-text="!idCabang ? '-- Pilih Cabang Dulu --' : '-- Pilih Mode --'"></option>
       @foreach($salesModes as $mode)
        <option value="{{ $mode->id_sales }}">{{ $mode->nama_mode }}</option>
       @endforeach
      </select>
     </div>

     <!-- Pilih Kasir (dinamis) -->
     <div>
      <label class="block text-xs font-extrabold mb-1" :class="(!idCabang || !idSales) ? 'text-gray-400' : ''">
       Pilih Kasir <span class="text-red-600">*</span>
      </label>
      <div class="relative">
       <select x-model="idKasir" :disabled="!idCabang || !idSales || loadingKasir" :class="(!idCabang || !idSales || loadingKasir) ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-white'" class="brutal-input w-full text-sm disabled:cursor-wait">
        <option value="">
         <span x-text="(!idCabang || !idSales) ? '-- Pilih Mode Dulu --' : (loadingKasir ? 'Memuat kasir...' : '-- Pilih Kasir --')"></span>
        </option>
        <template x-for="kasir in filteredKasirs" :key="kasir.id_user">
         <option :value="kasir.id_user" x-text="kasir.nama_user"></option>
        </template>
       </select>
       <template x-if="!loadingKasir && idCabang && idSales && filteredKasirs.length === 0">
        <p class="text-red-500 text-xs font-bold mt-1">Tidak ada kasir aktif di cabang ini.</p>
       </template>
      </div>
     </div>

    </div>

    <!-- Pesan panduan jika belum memilih semua -->
    <template x-if="!canGenerate">
     <div class="bg-yellow-100 border-2 border-yellow-500 px-4 py-2 text-xs font-bold text-yellow-800 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
      Lengkapi ketiga pilihan (Cabang, Mode Penjualan, dan Kasir) untuk mengaktifkan tombol Generate OTP.
     </div>
    </template>

    <!-- ===== DISPLAY KODE OTP ===== -->
    <div>
     <!-- Box Kode OTP -->
     <div class="bg-white border-2 border-[#0A0A0A] p-4 text-center mb-3">
      <div class="font-mono text-3xl md:text-4xl font-black tracking-[0.15em] sm:tracking-widest" id="otpDisplay" x-text="formatOtp(otpCode)">
       - - - - - -
      </div>
     </div>

     <!-- Info Target Aktif -->
     <template x-if="otpCode && targetKasir">
      <div class="bg-blue-50 border-2 border-[#0A0A0A] px-4 py-2 text-xs font-bold text-blue-900 mb-3">
        Target:
       <span class="text-blue-700" x-text="'Kasir: ' + targetKasir"></span>
       <span class="text-blue-700" x-text="'Cabang: ' + targetCabang"></span>
       <span class="text-blue-700" x-text="'Mode: ' + targetSales"></span>
      </div>
     </template>

     <!-- Status Indicator Badge -->
     <div class="text-center font-bold" x-show="otpCode">
      <template x-if="status === 'active' && timeLeft > 0">
       <div class="inline-block bg-[#D1FAE5] border-2 border-[#0A0A0A] px-4 py-2 text-[#065F46] w-full shadow-[2px_2px_0px_0px_#0A0A0A]">
        Status: Aktif (Berlaku <span x-text="timeLeft"></span> detik)
       </div>
      </template>
      <template x-if="status === 'expired' || timeLeft <= 0 && otpCode">
       <div class="inline-block bg-[#FEE2E2] border-2 border-[#0A0A0A] px-4 py-2 text-[#991B1B] w-full shadow-[2px_2px_0px_0px_#0A0A0A]">
        Status: Kedaluwarsa / Silakan Generate Ulang
       </div>
      </template>
      <template x-if="status === 'used'">
       <div class="inline-block bg-[#FEF08A] border-2 border-[#0A0A0A] px-4 py-2 text-[#854D0E] w-full shadow-[2px_2px_0px_0px_#0A0A0A]">
        Status: Sudah Digunakan
       </div>
      </template>
     </div>
    </div>

    <!-- ===== TOMBOL AKSI ===== -->
    <div class="flex flex-col sm:flex-row justify-center gap-4 mt-2">
     <button @click="canGenerate && generateOtp()"
       :disabled="!canGenerate"
       :class="canGenerate
        ? 'bg-[#0A0A0A] text-white hover:bg-gray-800 hover:shadow-[4px_4px_0px_0px_#0A0A0A] cursor-pointer transform hover:-translate-y-1 active:translate-y-0 active:shadow-none'
        : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'"
       class="font-black py-3 px-8 border-2 border-[#0A0A0A] transition-all text-lg min-w-[220px]">
      Buat OTP
     </button>

     <button @click="copyOtp()" x-show="otpCode"
       class="bg-[#F5F0E8] text-[#0A0A0A] font-black py-3 px-8 border-2 border-[#0A0A0A] hover:bg-white hover:shadow-[4px_4px_0px_0px_#0A0A0A] transition-all min-w-[220px] flex items-center justify-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
       <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
      </svg>
      Salin Kode
     </button>
    </div>

   </div>
  </div>

  <!-- Tabel Riwayat OTP (Audit Log) -->
  <div class="w-full" x-data="{ showTable: false }">
   <div class="bg-white border-4 border-[#0A0A0A] shadow-[4px_4px_0px_0px_#0A0A0A] p-6 h-full flex flex-col">
    <div class="flex justify-between items-center mb-4 border-b-4 border-[#0A0A0A] pb-2 cursor-pointer" @click="showTable = !showTable">
     <h2 class="text-xl font-black">10 Riwayat Terakhir OTP</h2>
     <button class="bg-[#F5F0E8] border-2 border-[#0A0A0A] px-3 py-1 font-bold hover:bg-gray-200 transition-colors" x-text="showTable ? 'Sembunyikan' : 'Tampilkan'"></button>
    </div>

    <div class="overflow-x-auto flex-1" id="otpHistoryTableContainer" x-show="showTable" x-transition>
     @include('admin.otp.partials.table', ['historyOtps' => $historyOtps])
    </div>
   </div>
  </div>
 </div>
</div>

<script>
 window.refreshTable = function() {
  fetch('{{ route('admin.otp.status') }}')
   .then(response => response.json())
   .then(data => {
    if (data.success) {
     const container = document.getElementById('otpHistoryTableContainer');
     if (container) { container.innerHTML = data.html; }
    }
   })
   .catch(error => console.error('Error refreshing table:', error));
 }
</script>
@endsection

@extends('layouts.admin')
@section('title', 'OTP Void')

@section('content')
<div class="mb-6">

 {{-- Toast Notification Container --}}
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

  {{-- Poin 8: Data Shift Aktif dikirim dari server --}}
  @php
      $activeShiftsData = $activeShifts->map(fn($s) => [
          'id_shift'    => $s->id_shift,
          'label'       => ($s->user->nama_user ?? '-') . ' — ' . ($s->cabang->nama_cabang ?? '-') . ' (' . ($s->salesMode->nama_mode ?? '-') . ')',
          'kasir'       => $s->user->nama_user ?? '-',
          'cabang'      => $s->cabang->nama_cabang ?? '-',
          'sales_mode'  => $s->salesMode->nama_mode ?? '-',
          'waktu_mulai' => $s->waktu_mulai?->format('H:i'),
          'status'      => $s->status_shift,
      ]);

      $activeOtpData = $activeOtp ? [
          'otp_code'    => $activeOtp->otp_code,
          'status'      => $activeOtp->status,
          'expires_at'  => $activeOtp->expires_at->toIso8601String(),
          'target_kasir'  => $activeOtp->shiftSession?->user?->nama_user ?? ($activeOtp->kasir?->nama_user),
          'target_cabang' => $activeOtp->shiftSession?->cabang?->nama_cabang ?? ($activeOtp->cabang?->nama_cabang),
          'target_sales'  => $activeOtp->shiftSession?->salesMode?->nama_mode ?? ($activeOtp->salesMode?->nama_mode),
      ] : null;
  @endphp
  <script>
      window.otpGeneratorData = {
          activeShifts: @json($activeShiftsData),
          activeOtp: @json($activeOtpData)
      };
  </script>

  {{-- Panel Utama Generator OTP --}}
  <div class="w-full max-w-2xl mx-auto" x-data="{
   // [Poin 8] State: Hanya butuh pilih shift aktif
   idShift: '',
   selectedShiftInfo: null,
   shifts: window.otpGeneratorData.activeShifts,

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
    return this.idShift !== '';
   },

   onShiftChange() {
    this.selectedShiftInfo = this.shifts.find(s => s.id_shift === this.idShift) ?? null;
   },

   init() {
    if (this.otpCode && this.expiresAt) {
     this.startCountdown();
    }
    this.pollingInterval = setInterval(() => {
     if (window.refreshTable) window.refreshTable();
    }, 5000);
   },

   destroy() {
    this.stopCountdown();
    if (this.pollingInterval) clearInterval(this.pollingInterval);
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
      body: JSON.stringify({ id_shift: this.idShift })
     });

     const result = await response.json();

     if (result.success) {
      this.otpCode      = result.data.otp_code;
      this.status       = result.data.status;
      this.expiresAt    = result.data.expires_at;
      this.targetKasir  = result.data.target_kasir;
      this.targetCabang = result.data.target_cabang;
      this.targetSales  = result.data.target_sales;
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

   async refreshShifts() {
    try {
     const res = await fetch('{{ route('admin.otp.active-shifts') }}', { headers: { 'Accept': 'application/json' } });
     const data = await res.json();
     if (data.success) {
      this.shifts = data.data;
      // Reset pilihan jika shift yang dipilih sudah tidak ada
      if (this.idShift && !this.shifts.find(s => s.id_shift === this.idShift)) {
       this.idShift = '';
       this.selectedShiftInfo = null;
      }
     }
    } catch(e) { console.error(e); }
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

    {{-- Judul --}}
    <div class="text-center border-b-4 border-[#0A0A0A] pb-4">
     <h1 class="text-2xl font-black">Generator OTP Void</h1>
     <p class="font-bold text-sm text-gray-600 mt-1">Pilih Sesi Shift Kasir yang sedang aktif</p>
    </div>

    {{-- [Poin 8] FORM: Hanya Pilih Shift Aktif --}}
    <div class="flex flex-col gap-3">
     <div class="flex justify-between items-center">
      <label class="block text-xs font-extrabold">
       Pilih Sesi Shift Aktif <span class="text-red-600">*</span>
      </label>
      <button type="button" @click="refreshShifts()"
        class="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
       <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
       Refresh
      </button>
     </div>

     <select x-model="idShift" @change="onShiftChange()" class="brutal-input bg-white w-full">
      <option value="">-- Pilih Shift --</option>
      <template x-for="shift in shifts" :key="shift.id_shift">
       <option :value="shift.id_shift" x-text="shift.label + ' | ' + shift.waktu_mulai"></option>
      </template>
     </select>

     {{-- Info shift yang dipilih --}}
     <template x-if="selectedShiftInfo">
      <div class="bg-blue-50 border-2 border-blue-900 p-3 text-xs font-bold text-blue-900 grid grid-cols-2 gap-1">
       <div>👤 Kasir: <span class="font-black" x-text="selectedShiftInfo.kasir"></span></div>
       <div>🏢 Cabang: <span class="font-black" x-text="selectedShiftInfo.cabang"></span></div>
       <div>🛒 Mode: <span class="font-black" x-text="selectedShiftInfo.sales_mode"></span></div>
       <div>🕐 Mulai: <span class="font-black" x-text="selectedShiftInfo.waktu_mulai"></span></div>
       <div class="col-span-2">
        <span :class="selectedShiftInfo.status === 'OPEN' ? 'bg-green-200' : 'bg-yellow-200'"
          class="inline-block px-2 py-0.5 border border-black font-black" x-text="selectedShiftInfo.status">
        </span>
       </div>
      </div>
     </template>

     <template x-if="!shifts.length">
      <div class="bg-yellow-100 border-2 border-yellow-500 px-4 py-2 text-xs font-bold text-yellow-800">
       ⚠️ Tidak ada sesi shift kasir yang aktif saat ini. Kasir perlu membuka shift terlebih dahulu.
      </div>
     </template>
    </div>

    {{-- Pesan jika belum pilih shift --}}
    <template x-if="!canGenerate && shifts.length > 0">
     <div class="bg-yellow-100 border-2 border-yellow-500 px-4 py-2 text-xs font-bold text-yellow-800 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
      Pilih sesi shift aktif untuk mengaktifkan tombol Generate OTP.
     </div>
    </template>

    {{-- Display Kode OTP --}}
    <div>
     <div class="bg-white border-2 border-[#0A0A0A] p-4 text-center mb-3">
      <div class="font-mono text-3xl md:text-4xl font-black tracking-[0.15em] sm:tracking-widest" id="otpDisplay" x-text="formatOtp(otpCode)">
       - - - - - -
      </div>
     </div>

     <template x-if="otpCode && targetKasir">
      <div class="bg-blue-50 border-2 border-[#0A0A0A] px-4 py-2 text-xs font-bold text-blue-900 mb-3 grid grid-cols-3 gap-1">
       <span x-text="'👤 ' + targetKasir"></span>
       <span x-text="'🏢 ' + targetCabang"></span>
       <span x-text="'🛒 ' + targetSales"></span>
      </div>
     </template>

     <div class="text-center font-bold" x-show="otpCode">
      <template x-if="status === 'active' && timeLeft > 0">
       <div class="inline-block bg-[#D1FAE5] border-2 border-[#0A0A0A] px-4 py-2 text-[#065F46] w-full shadow-[2px_2px_0px_0px_#0A0A0A]">
        Status: Aktif (Berlaku <span x-text="timeLeft"></span> detik)
       </div>
      </template>
      <template x-if="status === 'expired' || (timeLeft <= 0 && otpCode && status !== 'used')">
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

    {{-- Tombol Aksi --}}
    <div class="flex flex-col sm:flex-row justify-center gap-4 mt-2">
     <button @click="canGenerate && generateOtp()"
       :disabled="!canGenerate"
       :class="canGenerate
        ? 'bg-[#0A0A0A] text-white hover:bg-gray-800 cursor-pointer transform hover:-translate-y-1 active:translate-y-0'
        : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'"
       class="font-black py-3 px-8 border-2 border-[#0A0A0A] transition-all text-lg min-w-[220px]">
      Buat OTP
     </button>

     <button @click="copyOtp()" x-show="otpCode"
       class="bg-[#F5F0E8] text-[#0A0A0A] font-black py-3 px-8 border-2 border-[#0A0A0A] hover:bg-white hover:shadow-[4px_4px_0px_0px_#0A0A0A] transition-all min-w-[220px] flex items-center justify-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
       <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
      </svg>
      Salin Kode
     </button>
    </div>

   </div>
  </div>

  {{-- Tabel Riwayat OTP --}}
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

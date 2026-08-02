@extends('layouts.admin')
@section('title', 'Generator OTP Void')

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
  <!-- Panel Utama Generator OTP -->
  <div class="w-full max-w-xl mx-auto" x-data="{
   otpCode: '{{ $activeOtp ? $activeOtp->otp_code : '' }}',
   status: '{{ $activeOtp ? $activeOtp->status : '' }}',
   expiresAt: '{{ $activeOtp ? $activeOtp->expires_at->toIso8601String() : '' }}',
   timeLeft: 0,
   timerInterval: null,
   pollingInterval: null,
   
   init() {
    if (this.otpCode && this.expiresAt) {
     this.startCountdown();
    }
    
    // Polling table history
    this.pollingInterval = setInterval(() => {
     if (window.refreshTable) window.refreshTable();
    }, 5000);
    
    // Destroy hook for Turbo
    this.$watch('otpCode', () => {});
   },
   
   destroy() {
    this.stopCountdown();
    if (this.pollingInterval) clearInterval(this.pollingInterval);
   },
   
   formatOtp(code) {
    if (!code || code.length !== 6) return '------';
    return code.split('').join(' ');
   },
   
   async generateOtp() {
    try {
     const response = await fetch('{{ route('admin.otp.generate') }}', {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
       'X-CSRF-TOKEN': '{{ csrf_token() }}',
       'Accept': 'application/json'
      }
     });
     
     const result = await response.json();
     
     if (result.success) {
      this.otpCode = result.data.otp_code;
      this.status = result.data.status;
      this.expiresAt = result.data.expires_at;
      this.startCountdown();
      
      if (window.refreshTable) window.refreshTable();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'OTP Berhasil Digenerate', type: 'success' } }));
     } else {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Gagal generate OTP', type: 'error' } }));
     }
    } catch (error) {
     console.error('Error:', error);
     window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Terjadi kesalahan koneksi', type: 'error' } }));
    }
   },
   
   startCountdown() {
    this.stopCountdown();
    this.updateTimeLeft();
    
    this.timerInterval = setInterval(() => {
     this.updateTimeLeft();
    }, 1000);
   },
   
   stopCountdown() {
    if (this.timerInterval) {
     clearInterval(this.timerInterval);
     this.timerInterval = null;
    }
   },
   
   updateTimeLeft() {
    if (!this.expiresAt) {
     this.timeLeft = 0;
     return;
    }
    
    const expireDate = new Date(this.expiresAt);
    const now = new Date();
    const diffSeconds = Math.floor((expireDate - now) / 1000);
    
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
    }).catch(err => {
     console.error('Gagal menyalin text: ', err);
     window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Gagal menyalin kode OTP', type: 'error' } }));
    });
   }
  }" @turbo:before-cache.window="destroy()">
   <div class="bg-[#F5F0E8] border-4 border-[#0A0A0A] p-6 shadow-[4px_4px_0px_0px_#0A0A0A] flex flex-col">
    <div class="mb-6 text-center">
     <p class="font-bold text-sm text-gray-700 mb-2">Gunakan kode ini untuk otorisasi Kasir saat membatalkan transaksi</p>
    </div>

    <!-- Box Kode OTP -->
    <div class="bg-white border-2 border-[#0A0A0A] p-4 text-center mb-4">
     <div class="font-mono text-3xl md:text-4xl font-black tracking-[0.15em] sm:tracking-widest" id="otpDisplay" x-text="formatOtp(otpCode)">
      ------
     </div>
    </div>

    <!-- Status Indicator Badge -->
    <div class="mb-6 text-center font-bold" x-show="otpCode">
     <template x-if="status === 'active' && timeLeft > 0">
      <div class="inline-block bg-[#D1FAE5] border-2 border-[#0A0A0A] px-4 py-2 text-[#065F46] w-full shadow-[2px_2px_0px_0px_#0A0A0A]">
       Status: Aktif (Berlaku <span x-text="timeLeft"></span> detik)
      </div>
     </template>
     <template x-if="status === 'expired' || timeLeft <= 0">
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

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
     <button @click="generateOtp()" 
       :class="otpCode ? 'w-full' : 'w-full md:col-span-2 md:w-1/2 justify-self-center'"
       class="bg-[#0A0A0A] text-white font-black py-4 px-6 border-2 border-[#0A0A0A] hover:bg-gray-800 hover:shadow-[4px_4px_0px_0px_#0A0A0A] transition-all transform hover:-translate-y-1 active:translate-y-0 active:shadow-none text-lg">
      Generate OTP
     </button>
     
     <button @click="copyOtp()" x-show="otpCode"
       class="bg-[#F5F0E8] text-[#0A0A0A] font-black py-3 px-6 border-2 border-[#0A0A0A] hover:bg-white hover:shadow-[4px_4px_0px_0px_#0A0A0A] transition-all w-full flex items-center justify-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
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
 // Define global function if needed, but we will use x-data inline
 window.refreshTable = function() {
  fetch('{{ route('admin.otp.status') }}')
   .then(response => response.json())
   .then(data => {
    if (data.success) {
     const container = document.getElementById('otpHistoryTableContainer');
     if (container) {
      container.innerHTML = data.html;
     }
    }
   })
   .catch(error => console.error('Error refreshing table:', error));
 }
</script>
@endsection

<table class="w-full text-left border-collapse min-w-[700px]">
 <thead>
  <tr class="border-b-4 border-[#0A0A0A] bg-[#F5F0E8]">
   <th class="p-3 font-black text-sm border-r-2 border-[#0A0A0A]">Waktu Dibuat</th>
   <th class="p-3 font-black text-sm border-r-2 border-[#0A0A0A]">Kode OTP</th>
   <th class="p-3 font-black text-sm border-r-2 border-[#0A0A0A]">Dibuat Oleh</th>
   <th class="p-3 font-black text-sm border-r-2 border-[#0A0A0A]">Masa Berlaku</th>
   <th class="p-3 font-black text-sm border-r-2 border-[#0A0A0A]">Status</th>
   <th class="p-3 font-black text-sm">Waktu Digunakan</th>
  </tr>
 </thead>
 <tbody>
  @forelse($historyOtps as $otp)
   <tr class="border-b-2 border-gray-300 hover:bg-gray-50 transition-colors">
    <td class="p-3 text-sm font-medium border-r-2 border-[#0A0A0A]">
     {{ $otp->created_at->format('d/m/Y H:i:s') }}
    </td>
    <td class="p-3 border-r-2 border-[#0A0A0A]">
     <span class="font-mono font-bold text-lg tracking-wider">{{ $otp->otp_code }}</span>
    </td>
    <td class="p-3 text-sm border-r-2 border-[#0A0A0A]">
     {{ $otp->user->nama_user ?? 'Admin' }}
    </td>
    <td class="p-3 text-sm border-r-2 border-[#0A0A0A]">
     {{ $otp->expires_at->format('d/m/Y H:i:s') }}
    </td>
    <td class="p-3 border-r-2 border-[#0A0A0A]">
     @if($otp->status == 'active')
      <span class="inline-block px-2 py-1 text-xs font-black bg-[#D1FAE5] text-[#065F46] border-2 border-[#065F46]">Aktif</span>
     @elseif($otp->status == 'used')
      <span class="inline-block px-2 py-1 text-xs font-black bg-[#FEF08A] text-[#854D0E] border-2 border-[#854D0E]">Digunakan</span>
     @else
      <span class="inline-block px-2 py-1 text-xs font-black bg-[#FEE2E2] text-[#991B1B] border-2 border-[#991B1B]">Kedaluwarsa</span>
     @endif
    </td>
    <td class="p-3 text-sm">
     {{ $otp->used_at ? $otp->used_at->format('d/m/Y H:i:s') : '-' }}
    </td>
   </tr>
  @empty
   <tr>
    <td colspan="6" class="p-6 text-center font-bold text-gray-500">Belum ada riwayat OTP</td>
   </tr>
  @endforelse
 </tbody>
</table>

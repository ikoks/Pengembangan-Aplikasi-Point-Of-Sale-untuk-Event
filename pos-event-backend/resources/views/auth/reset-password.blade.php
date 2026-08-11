<!DOCTYPE html>
<html lang="id">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <meta name="description" content="Reset Password Admin — Sistem POS Event">
 <title>Reset Password — POS Event</title>

 <script src="https://cdn.tailwindcss.com"></script>
 <link rel="preconnect" href="https://fonts.googleapis.com">
 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">

 <script>
  tailwind.config = {
   theme: {
    extend: {
     fontFamily: { 'grotesk': ['"Space Grotesk"', 'sans-serif'] },
     colors: {
      'brutal-black': '#0A0A0A',
     },
     boxShadow: {
      'brutal': '4px 4px 0px 0px rgba(0,0,0,1)',
      'brutal-lg': '6px 6px 0px 0px rgba(0,0,0,1)',
     }
    }
   }
  }
 </script>
 <style>
  body { font-family: 'Space Grotesk', sans-serif; background-color: #F5F0E8; }
  .brutal-input {
   display: block; width: 100%; padding: 0.6rem 0.75rem;
   border: 3px solid #0A0A0A; font-weight: 700;
   background: #fff; font-size: 0.95rem; outline: none;
   font-family: inherit;
  }
  .brutal-input:focus { box-shadow: 3px 3px 0 #0A0A0A; }
 </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">

 <div class="w-full max-w-md">
  {{-- Judul --}}
  <div class="text-center mb-8">
   <h1 class="text-4xl font-black text-brutal-black tracking-tight">POS EVENT</h1>
   <p class="text-sm font-bold text-gray-500 mt-1 tracking-widest uppercase">Buat Password Baru</p>
  </div>

  <div class="bg-white border-4 border-brutal-black shadow-brutal-lg p-8">

   {{-- Error Message (Token Expired dll) --}}
   @if($errors->has('email'))
    <div class="mb-6 bg-red-100 border-2 border-red-600 px-4 py-3 font-bold text-red-800 text-sm flex justify-between items-center">
     <span>{{ $errors->first('email') }}</span>
     <a href="{{ route('admin.password.request') }}" class="underline text-xs ml-2">Minta Ulang</a>
    </div>
   @endif

   <form method="POST" action="{{ route('admin.password.update') }}">
    @csrf
    <input type="hidden" name="token" value="{{ $token }}">

    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1 uppercase tracking-wider">Email Admin</label>
     <input type="email" name="email" value="{{ $email ?? old('email') }}" class="brutal-input bg-gray-100 cursor-not-allowed" readonly required>
    </div>

    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1 uppercase tracking-wider">Password Baru</label>
     <input type="password" name="password" class="brutal-input" required autofocus placeholder="Minimal 8 karakter">
     @error('password')
      <span class="text-red-600 text-xs font-bold mt-1 block">{{ $message }}</span>
     @enderror
    </div>

    <div class="mb-6">
     <label class="block text-xs font-extrabold mb-1 uppercase tracking-wider">Konfirmasi Password Baru</label>
     <input type="password" name="password_confirmation" class="brutal-input" required placeholder="Ulangi password baru">
    </div>

    <button type="submit"
     class="w-full py-3 bg-brutal-black text-white font-black text-base border-2 border-brutal-black hover:bg-gray-800 shadow-brutal hover:shadow-none transition-all hover:-translate-y-0.5 active:translate-y-0">
     SIMPAN PASSWORD BARU
    </button>
   </form>

  </div>

  <p class="text-center text-xs font-bold text-gray-400 mt-6">
   &copy; {{ date('Y') }} POS Event System
  </p>
 </div>
</body>
</html>

<!DOCTYPE html>
<html lang="id">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <meta name="description" content="Lupa Password Admin — Sistem POS Event">
 <title>Lupa Password — POS Event</title>

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
      'brutal-purple': '#c77dff',
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
   <p class="text-sm font-bold text-gray-500 mt-1 tracking-widest uppercase">Reset Password Admin</p>
  </div>

  <div class="bg-white border-4 border-brutal-black shadow-brutal-lg p-8">

   {{-- Status / Success Message --}}
   @if(session('status'))
    <div class="mb-6 bg-green-100 border-2 border-green-600 px-4 py-3 font-bold text-green-800 text-sm">
     {{ session('status') }}
    </div>
   @endif

   <h2 class="text-2xl font-black mb-2">Lupa Password</h2>
   <p class="text-sm font-bold text-gray-500 mb-6">
    Masukkan alamat email admin Anda. Kami akan mengirimkan tautan untuk membuat password baru.
   </p>

   <form method="POST" action="{{ route('admin.password.email') }}">
    @csrf
    <div class="mb-5">
     <label class="block text-xs font-extrabold mb-2 uppercase tracking-wider">Email Admin</label>
     <input type="email" name="email" value="{{ old('email') }}" class="brutal-input"
            placeholder="admin@event.com" required autofocus>
     @error('email')
      <span class="text-red-600 text-xs font-bold mt-1 block">{{ $message }}</span>
     @enderror
    </div>

    <button type="submit"
     class="w-full py-3 bg-brutal-black text-white font-black text-base border-2 border-brutal-black hover:bg-gray-800 shadow-brutal hover:shadow-none transition-all hover:-translate-y-0.5 active:translate-y-0">
     KIRIM TAUTAN RESET
    </button>
   </form>

   <div class="mt-6 text-center border-t-2 border-brutal-black pt-4">
    <a href="{{ route('admin.login') }}" class="text-xs font-extrabold text-brutal-black hover:underline">
     ← Kembali ke Halaman Login
    </a>
   </div>
  </div>

  <p class="text-center text-xs font-bold text-gray-400 mt-6">
   &copy; {{ date('Y') }} POS Event System
  </p>
 </div>
</body>
</html>

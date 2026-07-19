<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Admin — POS Event</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { 'grotesk': ['"Space Grotesk"', 'sans-serif'] },
                    boxShadow: { 'brutal': '4px 4px 0px 0px #000000' },
                    colors: { 'brutal-purple': '#c77dff', 'brutal-black': '#0A0A0A' }
                }
            }
        }
    </script>
    <style>body { font-family: 'Space Grotesk', sans-serif; background-color: #F5F0E8; }</style>
</head>
<body class="min-h-screen">

    {{-- Navbar --}}
    <nav class="bg-brutal-black text-white border-b-4 border-brutal-black px-6 py-4 flex justify-between items-center">
        <span class="font-extrabold text-xl uppercase tracking-tight">
            POS <span class="text-brutal-purple">Event</span>
            <span class="text-xl ml-4 text-gray-200 font-extrabold normal-case">Dashboard</span>
        </span>
        <div class="flex items-center gap-4">
            <span class="text-sm font-semibold text-gray-200">
                {{ auth()->user()->nama_user }}
            </span>
            <form method="POST" action="{{ route('admin.logout') }}" class="inline">
                @csrf
                <button
                    id="btn-logout"
                    type="submit"
                    class="px-4 py-2 text-xs font-extrabold uppercase tracking-widest bg-brutal-purple text-brutal-black border-2 border-brutal-purple hover:bg-transparent hover:text-brutal-purple transition-colors"
                >
                    Logout
                </button>
            </form>
        </div>
    </nav>

    {{-- Konten --}}
    <main class="p-8">
        @if (session('success'))
            <div class="mb-6 p-4 border-4 border-green-600 bg-green-50 font-bold text-green-800">
                {{ session('success') }}
            </div>
        @endif

        <div class="border-4 border-brutal-black bg-white shadow-brutal p-8 text-center">
            <h1 class="text-3xl font-extrabold text-brutal-black uppercase">Selamat Datang! 👋</h1>
            <p class="mt-2 text-gray-600 font-medium">
                Dashboard Sprint 1 siap. Fitur penuh akan ditambahkan pada Sprint 2.
            </p>
            <div class="mt-6 inline-block bg-brutal-purple border-4 border-brutal-black px-6 py-3 font-extrabold uppercase text-sm shadow-brutal">
                ✅ Hari 1 — Login & Seeder Berhasil!
            </div>
        </div>
    </main>
</body>
</html>

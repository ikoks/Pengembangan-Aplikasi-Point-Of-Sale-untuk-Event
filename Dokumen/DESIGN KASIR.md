## 🎨 Aturan Desain Global (Monochrome & Neo-Brutalist)

Gunakan aturan dasar ini sebagai instruksi sistem/context utama dalam generator UI:

- **Skema Warna:**
  - **Murni Monokrom:** Hanya gunakan `#000000` (hitam murni), `#FFFFFF` (putih murni), abu-abu sangat muda `#F5F5F5` (untuk background/hover), abu-abu sedang `#999999` (untuk border sekunder), dan abu-abu gelap `#222222`.
  - **Tanpa Warna Lain:** Dilarang keras menggunakan warna merah, hijau, biru, kuning, atau warna lainnya.
- **Tipografi:**
  - Gunakan font monospace atau sans-serif geometris yang bersih dan modern seperti `Space Grotesk`, `JetBrains Mono`, atau `Inter`.
- **Gaya Visual (Neo-brutalisme / Minimalis):**
  - Gunakan border hitam tebal (1px atau 2px).
  - Gunakan bayangan kaku tanpa blur (_hard shadow_ hitam pekat).
  - Sudut elemen tajam dengan `border-radius: 0px` atau maksimum `4px`.
  - Garis pemisah (_divider_) hitam yang tegas.
- **Indikator Status:**
  - Jangan gunakan warna (seperti merah untuk gagal, hijau untuk sukses).
  - Gunakan ikon outline tebal dan label teks kapital yang jelas seperti `[SUCCESS]`, `[VOID]`, `[PENDING]`, atau `[CANCELLED]`.
  - Gunakan pola border putus-putus (_dashed borders_) untuk menandakan elemen yang non-aktif atau dibatalkan.
- **Interaksi:**
  - Efek hover atau tombol aktif menggunakan **inversi warna** (warna latar hitam menjadi putih, teks putih menjadi hitam).
- **Bahasa:**
  - Bahasa harus konsisten Indonesia.

---

## 📱 Prompt Bagian 1: Aplikasi Mobile APK (Sisi Kasir)

### 1. Halaman Login & Opening Shift

```text
Buat halaman Login & Inisialisasi Sesi Kasir untuk aplikasi Mobile Android POS.
Tampilan harus monokromatik (hitam dan putih) dengan gaya minimalis brutalis.

Elemen-elemen yang wajib ada di layar:
1. Header bersih dengan teks tebal "POSEVENT - TERMINAL KASIR".
2. Form Input Username Kasir (hanya berupa satu kolom input teks dengan border hitam tegas 2px, tanpa kolom password).
3. Area dropdown/pilihan Cabang Event (id_cabang) dan Mode Penjualan (id_sales, contoh: 'Offline', 'GoFood', 'GrabFood') dengan border hitam tebal.
4. Input nominal uang untuk Modal Awal (modal_awal) dengan tombol angka (numeric keypad) besar yang didesain minimalis di bawahnya untuk input cepat.
5. Tombol aksi utama "MULAI" di bagian bawah dengan warna latar belakang hitam murni dan teks putih tebal.

Gunakan tipografi monospace, border hitam tegas, tidak ada warna sama sekali. Tombol aktif menggunakan efek hover/tekan berupa inversi warna (hitam jadi putih, putih jadi hitam).
```

### 2. Halaman POS Utama (Katalog Menu & Keranjang)

```text
Buat antarmuka utama POS Mobile Kasir berukuran layar tablet/smartphone besar.
Desain monokrom (hitam-putih saja) dengan pembagian area (layout split) yang jelas dan teks berbahasa Indonesia:

Sisi Kiri (60% lebar layar): Katalog Menu & Kategori
- Baris filter kategori produk di bagian atas (contoh: 'Semua', 'Kopi Spesial', 'Non-Kopi', 'Merchandise') berupa tombol kapsul dengan border hitam tipis.
- Grid menu produk (2 - 4 kolom). Setiap kartu menu memiliki nama produk, harga (menu_template), border hitam tipis, dan tombol "+" minimalis di sudut kanan bawah.
-Tombol aksi di pojok kiri bawah:
  * Tombol "PENGATURAN" (background putih, border hitam 2px).

Sisi Kanan (40% lebar layar): Keranjang Belanja & Ringkasan
- Daftar item belanja aktif dengan detail: Nama item, harga satuan, tombol minus/plus kuantitas, subtotal, dan ikon tempat sampah (trash) outline hitam untuk hapus item.
- Di bagian bawah keranjang, tampilkan ringkasan biaya: Subtotal, Nominal Promo/Diskon (jika ada), Pajak Event (tax), dan Total Akhir (total) dengan font berukuran besar dan tebal.
- Tombol aksi di bawah:
  * Tombol "BAYAR SEKARANG" (background hitam murni, teks putih tebal).

Gunakan gaya visual brutalist monokrom, border tajam, tanpa ada warna lain.
```

### 3. Modal Detail Pembayaran & Layar QRIS

```text
Buat tampilan pop-up modal "Pembayaran Transaksi" untuk aplikasi POS kasir mobile dengan teks berbahasa Indonesia.
Tampilan monokromatik hitam-putih murni.

Elemen di dalam modal:
1. Ringkasan total tagihan dengan teks tebal besar: "TOTAL TAGIHAN: Rp 150.000".
2. Pilihan Metode Pembayaran dalam bentuk grid tombol outline hitam (pilihan: 'TUNAI', 'QRIS DINAMIS', 'KARTU DEBIT'). Tombol yang dipilih akan aktif dengan warna hitam pekat dan teks putih.
3. Konten Dinamis berdasarkan Metode Pembayaran:
   - Jika 'TUNAI' dipilih: Tampilkan tombol nominal cepat (Tombol Uang Pas, Rp 50.000, Rp 100.000) dengan kalkulasi input kembalian otomatis.
   - Jika 'QRIS' dipilih: Tampilkan placeholder kode QR hitam-putih di bagian tengah layar dengan teks status "[MENUNGGU SINKRONISASI PEMBAYARAN...]" di bawahnya.
4. Tombol aksi di bawah modal: "BATALKAN TRANSAKSI" (border putus-putus hitam) dan "CETAK STRUK & SINKRONISASI" (tombol hitam tebal).

Gaya: Minimalis, kontras tinggi, menggunakan ikon outline, tanpa warna merah/hijau/biru.
```

### 4. Layar Jeda Sesi (Switch Kasir / Lock Screen Overlay)

```text
Buat layar kunci overlay "Jeda Sesi Kasir / Ganti Pengguna" untuk aplikasi POS Mobile Android dengan teks berbahasa Indonesia.
Desain monokrom hitam-putih murni.

Elemen-elemen:
1. Pesan status di tengah layar: "TERMINAL SEDANG DI-JEDA (ON_BREAK)".
2. Detail sesi aktif saat ini: Operator Utama (Nama Kasir Pagi), Cabang, dan Waktu Mulai Shift.
3. Form Input Username Kasir dengan lingkaran input hitam-putih untuk membuka kembali terminal.
4. Tombol "AMBIL ALIH KASIR (SWITCH USER)" untuk memproses pergantian kasir aktif (operator pengganti) tanpa menutup shift utama yang sedang berjalan.
5. Tombol darurat "LOGOUT".

Gaya: Menggunakan background abu-abu tipis dengan card putih di tengah yang memiliki border hitam 2px tebal dan drop-shadow kaku berwarna hitam murni.
```

### 5. Halaman Closing Shift & Slip Summary

```text
Buat antarmuka laporan penutupan shift kasir (Closing Shift Screen) untuk POS Mobile.
Tampilan hitam-putih monokromatik murni.

Elemen-elemen:
1. Judul halaman "TUTUP SHIFT & REKONSILIASI".
2. Ringkasan data digital sistem: Total Modal Awal, Total Penjualan Tunai, Total Penjualan QRIS/Non-Tunai, dan Estimasi Uang di Laci.
3. Kolom Input manual kasir: "INPUT JUMLAH UANG FISIK ASLI" (dengan kolom input angka besar ber-border hitam tebal).
4. Hasil Rekonsiliasi instan: Menampilkan perhitungan selisih antara nominal sistem dan input fisik kasir ("SELISIH: Rp 0" atau "SELISIH: -Rp 10.000").
5. Tombol aksi: "CETAK SLIP CLOSING" (border hitam tebal, latar putih) dan "TUTUP SHIFT PERMANEN [CLOSED]" (latar hitam murni, teks putih).

Gaya: Monospaced font, rapi seperti nota thermal, monokrom, minimalis.
```

### 6. Halaman Pengaturan Printer & Sinkronisasi

```text
Buat halaman Pengaturan Terminal (Settings Screen) untuk aplikasi POS Mobile Kasir dengan teks berbahasa Indonesia.
Tampilan monokromatik hitam-putih murni.

Elemen-elemen yang wajib ada di layar:
1. Header halaman: "PENGATURAN TERMINAL & SINKRONISASI".
2. Bagian Koneksi Printer Thermal:
   - Status printer: "STATUS PRINTER: [TERPUTUS]" (dengan border putus-putus) atau "[TERHUBUNG - PRINTER 58MM]" (border tebal).
   - Tombol "PINDAI PERANGKAT BLUETOOTH" untuk mencari printer terdekat.
   - Daftar pilihan perangkat Bluetooth terdeteksi (Daftar item dengan border hitam tipis).
   - Opsi pilihan Lebar Kertas (Pilihan tombol radio: 58mm atau 80mm).
   - Tombol "CETAK STRUK UJI COBA" (Latar putih, border hitam 2px).
3. Bagian Sinkronisasi Data Luring (Penyimpanan Lokal):
   - Status penyimpanan lokal: "12 Transaksi Tersimpan Lokal (Belum Sinkron)".
   - Tombol "SINKRONISASI SEKARANG" (Latar hitam murni, teks putih).
   - Status koneksi: "Koneksi Internet: [OFFLINE]" atau "[ONLINE]" dan "Terakhir Sinkron: 15 menit yang lalu".
4. Bagian API Server (Endpoint):
   - Kolom Input: "Alamat URL API Server Backend" (contoh: https://api.pos-event.local).
   - Tombol "UJI KONEKSI SERVER (TEST PING)".
5. Bagian Tindakan Keamanan Sesi (Aksi Cepat):
   - Tombol besar "JEDA SESI KASIR (ISTIRAHAT)" (Latar belakang putih dengan border hitam tebal 2px, jika ditekan akan mengunci layar terminal dan mengeset status shift menjadi ON_BREAK).
   - Tombol "KEMBALI KE POS" untuk kembali melayani transaksi.

Gaya: Bersih, menggunakan garis-garis tipis, monokrom, minimalis brutalis.
```

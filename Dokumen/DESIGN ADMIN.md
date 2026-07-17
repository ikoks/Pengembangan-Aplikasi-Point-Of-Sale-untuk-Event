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

## 💻 Prompt Bagian 2: Web Dashboard (Sisi Admin)

### 1. Dashboard Utama & Statistik Ringkasan (Brutalist Grid)

```text
Buat halaman Dashboard Utama (Web Admin) untuk Sistem POS Event.
Desain monokromatik (hitam dan putih) bergaya brutalis modern, optimal untuk layar desktop.

Elemen utama halaman:
1. Sidebar Navigasi Kiri (monokrom): Logo aplikasi, menu 'Dashboard', 'Kelola Menu', 'Kelola Kasir', 'Riwayat Transaksi', 'Laporan Keuangan'.
2. Baris Card Statistik di atas:
   - Omzet Hari Ini (Total Rupiah)
   - Jumlah Transaksi Aktif
   - Persentase Pembayaran QRIS vs Tunai
   - Selisih Shift Kasir (Audit warning)
   *Setiap card menggunakan border hitam tebal 2px dengan drop shadow hitam kaku.*
3. Area tengah: Placeholder grafik garis tren omzet periodik (line chart menggunakan warna garis hitam tebal di atas background grid putih murni).
4. Tabel ringkasan di bawah: Daftar menu kuliner terlaris saat ini (Tabel hitam-putih dengan baris header hitam pekat berpola putih).

Sama sekali tidak ada warna. Status aktif pada sidebar ditunjukkan dengan kotak hitam berlatar teks putih.
```

### 2. Manajemen Transaksi & Audit Log (Void / Cancelled)

```text
Buat halaman riwayat transaksi dan log audit keuangan (Manage Transactions Screen) untuk dashboard web admin.
Desain monokrom (hitam-putih saja).

Elemen utama:
1. Header halaman: "AUDIT LOG & RIWAYAT TRANSAKSI EVENT".
2. Baris Filter: Cari ID Transaksi, Filter Cabang, dan Filter Status (Dropdown: 'Success', 'Void', 'Cancelled').
3. Tabel data transaksi utama dengan kolom: ID Transaksi (UUID), Nama Kasir, Waktu, Cabang, Metode Pembayaran, Total, Status, dan Catatan Koreksi Admin.
4. Gaya khusus baris tabel:
   - Baris transaksi sukses memiliki border biasa.
   - Baris dengan status `Cancelled` atau item `Void` diberi border putus-putus (dashed border) tebal dan disertai teks alasan pembatalan kasir ("Alasan Batal: ...").
5. Kolom aksi "KOREKSI TRANSAKSI" untuk admin melakukan penyesuaian manual pos-event.

Gaya: Bersih, rapi, font monospace untuk teks UUID/angka, monokrom.
```

### 3. Manajemen Katalog Menu, Cabang, & Template Harga

```text
Buat halaman manajemen menu produk dan konfigurasi template harga cabang (Regional Price Settings) pada Web Dashboard Admin.
Tampilan monokromatik hitam-putih murni dengan teks berbahasa Indonesia.

Elemen-elemen:
1. Panel Form Input Kiri (CRUD): Tambah/Ubah Menu Baru, dropdown Kategori, dropdown Sub-Kategori. Dilengkapi tombol "SIMPAN" dan "BATAL" di bawah form.
2. Panel Tabel Kanan: Daftar menu aktif beserta relasi harga regional/cabang dan sales mode (menu_template).
3. Tabel template memuat kolom: Nama Menu, Cabang Toko/Event, Mode Jual (Offline/GoFood), Harga Jual (Rupiah), dan kolom khusus Tombol Aksi.
4. Tombol Aksi yang wajib ada secara eksplisit di setiap baris tabel:
   - Tombol "UBAH" (Ikon pensil outline hitam) untuk mengedit data menu/template harga.
   - Tombol "HAPUS" (Ikon tempat sampah outline hitam) untuk menghapus data dari sistem.
5. Bagian program promo aktif (promosi): Daftar nama diskon, tipe promo (Nominal/Persen/Free Item), dan cakupan promosi yang terikat ke cabang tertentu, lengkap dengan tombol aksi "UBAH" dan "HAPUS" untuk masing-masing promo.

Gaya: Menggunakan garis kisi (gridlines) hitam yang tegas untuk memisahkan tabel, layout form yang rapi, dan tombol aksi ber-border hitam murni tanpa warna sama sekali.
```

### 4. Halaman Login Admin

```text
Buat halaman Masuk (Login Screen) untuk Web Dashboard Admin POS Event.
Tampilan monokromatik hitam-putih murni dengan teks berbahasa Indonesia.

Elemen-elemen yang wajib ada di layar:
1. Card tengah dengan border hitam tebal 2px dan drop-shadow kaku berwarna hitam pekat.
2. Judul di atas card: "MASUK ADMIN - POS EVENT".
3. Form Input:
   - Nama Pengguna / Username (username)
   - Kata Sandi / Password (password_hash)
4. Tautan (link) "Lupa Password?" (Teks outline atau garis bawah tipis) diletakkan tepat di bawah kolom Kata Sandi di sebelah kanan.
5. Tombol aksi utama "MASUK KE DASHBOARD" (Latar belakang hitam pekat, teks putih tebal).

Gaya: Bersih, geometris, minimalis brutalis, tipografi monospace.
```

### 5. Halaman Kelola Data Admin

```text
Buat halaman Manajemen Akun Admin (Manage Admin Accounts Screen) untuk Web Dashboard Admin dengan teks berbahasa Indonesia.
Tampilan monokromatik hitam-putih murni.

Elemen-elemen yang wajib ada di layar:
1. Header halaman: "KELOLA DATA ADMIN SISTEM".
2. Form Input Tambah/Edit Admin (Sisi Kiri, 35% lebar layar):
   - Kolom teks: Nama Lengkap Admin (nama_user).
   - Kolom teks: Nama Pengguna / Username (username).
   - Kolom kata sandi: Kata Sandi Baru (password_hash, opsional/hanya diisi jika ingin mereset sandi).
   - Baris Tombol Aksi:
     * Tombol "SIMPAN DATA" (Latar hitam, teks putih).
     * Tombol "BATAL" (Latar putih, border hitam tipis).
3. Tabel Daftar Admin (Sisi Kanan, 65% lebar layar):
   - Tabel memuat kolom: Username, Nama Admin, Status Akun (Aktif/Nonaktif), dan Kolom Aksi.
   - Kolom Aksi di setiap baris tabel admin harus memiliki tombol aksi yang jelas:
     * Tombol "UBAH" (Ikon pensil outline hitam) untuk memuat data admin ke form edit.
     * Tombol "HAPUS" (Ikon tempat sampah outline hitam) untuk menghapus admin dari database.

Gaya: Rapi, menggunakan border hitam tipis pada tabel, tata letak input yang bersih, tanpa warna sama sekali.
```

### 6. Halaman Lupa Password Admin

```text
Buat halaman Lupa Kata Sandi (Forgot Password Screen) untuk Web Dashboard Admin POS Event.
Tampilan monokromatik hitam-putih murni dengan teks berbahasa Indonesia.

Elemen-elemen yang wajib ada di layar:
1. Card tengah dengan border hitam tebal 2px dan drop-shadow kaku berwarna hitam pekat.
2. Judul di atas card: "PULIHKAN KATA SANDI ADMIN".
3. Teks petunjuk singkat: "Masukkan Nama Pengguna (Username) Anda yang terdaftar. Hubungi Super-Admin atau hubungi WhatsApp Support Event untuk memverifikasi reset kata sandi Anda."
4. Form Input:
   - Nama Pengguna / Username (username)
5. Tombol aksi utama "KIRIM PERMINTAAN RESET" (Latar belakang hitam pekat, teks putih tebal).
6. Tautan (link) untuk kembali ke halaman masuk: "Kembali ke halaman Masuk" (Teks dengan garis bawah tipis).

Gaya: Bersih, geometris, minimalis brutalis, tipografi monospace.
```

### 7. Halaman Kelola Data Kasir

```text
Buat halaman Manajemen Akun Kasir (Manage Cashier Accounts Screen) untuk Web Dashboard Admin dengan teks berbahasa Indonesia.
Tampilan monokromatik hitam-putih murni.

Elemen-elemen yang wajib ada di layar:
1. Header halaman: "KELOLA DATA KASIR LAPANGAN".
2. Form Input Tambah/Edit Kasir (Sisi Kiri, 35% lebar layar):
   - Kolom teks: Username Kasir (username, untuk login cepat kasir).
   - Kolom teks: Nama Lengkap Kasir (nama_user).
   - Dropdown pilihan: Cabang Asal/Default Penugasan (id_cabang).
   - Status Aktif: Tombol sakelar (switch) atau opsi checkbox "Akun Aktif" (status_aktif).
   - Baris Tombol Aksi:
     * Tombol "SIMPAN DATA" (Latar hitam, teks putih).
     * Tombol "BATAL" (Latar putih, border hitam tipis).
3. Tabel Daftar Kasir (Sisi Kanan, 65% lebar layar):
   - Tabel memuat kolom: Username, Nama Kasir, Cabang Penugasan, Status Akun (Aktif/Nonaktif), dan Kolom Aksi.
   - Kolom Aksi di setiap baris tabel kasir harus memiliki tombol aksi yang jelas:
     * Tombol "UBAH" (Ikon pensil outline hitam atau teks outline) untuk mengubah data kasir.
     * Tombol "HAPUS" (Ikon tempat sampah outline hitam atau teks outline) untuk menghapus kasir dari database.
     * Tombol "NONAKTIFKAN / AKTIFKAN" untuk mengubah status_aktif kasir secara cepat tanpa menghapus data.

Gaya: Rapi, menggunakan border hitam tipis pada tabel, tata letak input yang bersih, tanpa warna sama sekali.
```

### 8. Halaman Laporan Keuangan (Generate Laporan)

```text
Buat halaman Laporan Analisis Keuangan (Financial Report Screen) untuk Web Dashboard Admin dengan teks berbahasa Indonesia.
Tampilan monokromatik hitam-putih murni.

Elemen-elemen yang wajib ada di layar:
1. Header halaman: "LAPORAN KEUANGAN & RINGKASAN TRANSAKSI".
2. Panel Filter & Parameter Laporan (Bagian Atas):
   - Pilihan Jenis Laporan (Dropdown: Harian, Rekap Shift, Per Event/Cabang, Bulanan).
   - Pemilih Rentang Tanggal (Date Range Picker).
   - Pemilih Cabang (id_cabang) dan Saluran Penjualan (id_sales).
   - Tombol utama "TAMPILKAN LAPORAN" (Latar hitam, teks putih).
3. Ringkasan Kinerja Keuangan (Bentuk Card Brutalis):
   - Card Total Pendapatan Bersih (Rupiah).
   - Card Total Transaksi Batal/Void (Audit Nilai Kebocoran Finansial).
   - Card Rata-rata Nilai Belanja Pelanggan.
4. Area Detail Grafik & Tabel (Bawah):
   - Placeholder grafik batang sebaran metode pembayaran (Tunai vs QRIS) dalam warna arsiran hitam-putih (pola diagonal/arsir garis).
   - Tabel data omzet detail per hari/shift yang siap diekspor.
5. Baris Tombol Ekspor (Kanan Atas):
   - Tombol "EKSPOR PDF" (Border hitam tebal, latar putih).
   - Tombol "EKSPOR EXCEL (XLSX)" (Latar hitam, teks putih).

Gaya: Sangat terstruktur, bersih, menggunakan gridline tipis, monokrom.
```

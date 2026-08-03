# Dokumen Spesifikasi Desain UI/UX — POS Event

**Produk:** POS Event — Mobile APK Kasir & Web Admin  
**Acuan:** Sampel mockup pada folder [`Dokumen/Mokup`](Mokup)  
**Prinsip:** minimalis, kontras tinggi, cepat dipindai, aman terhadap salah tekan, dan tetap operasional saat koneksi terbatas.

## 1. Panduan Gaya Visual (Style Guide Ringkas)

### 1.1 Sistem desain

POS Event menggunakan sistem **Neo-Brutalist Monokrom**. Komponen sengaja dibuat tegas agar mudah dikenali di bawah pencahayaan festival, saat kasir bergerak, dan ketika layar terkena pantulan cahaya.

| Elemen | Spesifikasi |
|---|---|
| Latar | Krem/abu sangat muda untuk area kerja; hitam untuk aksi utama dan header tabel. |
| Panel | Putih/abu muda, border hitam 3–4 px, shadow datar offset sekitar 4 px. |
| Border | Hitam solid untuk field dan panel; garis putus-putus untuk warning, status void, atau area audit. |
| Aksi utama | Tombol hitam dengan teks putih, label berupa kata kerja: `MASUK`, `MULAI SHIFT`, `SINKRONISASI`, `SIMPAN DATA`. |
| Aksi sekunder | Tombol putih dengan border hitam. Aksi destruktif atau pembatalan diberi label eksplisit. |
| Status sukses/aktif | Hitam/putih dengan label berkurung siku, misalnya `[SUCCESS]`, `[AKTIF]`. |
| Status perhatian/error | Merah untuk alasan batal, error, dan peringatan rekonsiliasi; jangan mengandalkan warna saja, selalu sertakan teks. |
| Ikon | Ikon garis sederhana, dekat dengan label, tidak menjadi satu-satunya penjelas aksi. |

### 1.2 Tipografi dan hirarki

- Gunakan sans-serif tebal untuk heading dan label aksi; gunakan monospace/teks berjarak untuk nominal, ID transaksi, username, dan data teknis.
- Heading halaman: sekitar 28–36 px pada web, 24–32 px pada mobile.
- Label field: 12–14 px, uppercase bila mengikuti mockup.
- Nilai nominal/KPI utama: 24–36 px dan paling menonjol dalam panel.
- Teks bantuan: minimal 12 px dengan kontras yang memadai.
- Semua target sentuh mobile minimal **48 × 48 dp**; tombol aksi transaksi disarankan selebar area yang mudah dijangkau ibu jari.
- Jarak antarkontrol minimal 8 dp; area klik ikon hapus, tambah, kurang, dan tutup tidak boleh hanya sebesar ikon visualnya.

### 1.3 Perilaku umum

- Satu layar memiliki satu aksi utama yang paling gelap/menonjol.
- Perubahan state memberi feedback instan: state tombol, toast/status inline, spinner singkat, atau perubahan label.
- Field nominal menggunakan format Rupiah dan keypad numerik pada mobile.
- Aksi destruktif diberi label spesifik dan dipisahkan dari aksi lanjut.
- Layout web mempertahankan sidebar tetap terlihat pada desktop; pada lebar kecil sidebar berubah menjadi navigasi yang dapat dibuka melalui tombol menu.

## 2. Spesifikasi Layar Mobile APK (Kasir Lapangan)

### 2.1 Login dan pembukaan shift

| Layar | File reference mockup | Layout dan komponen | Hirarki aksi dan usability |
|---|---|---|---|
| Login/Buka Shift | [`Kasir (Login).png`](Mokup/Kasir%20%28Login%29.png) | Layar satu kolom dengan heading `BUKA SHIFT`, label `USERNAME KASIR`, satu input username, dan tombol lebar `BUKA SHIFT`. | Fokus otomatis pada username. Tombol utama disabled sampai input valid; tampilkan error inline jika username tidak ditemukan. |
| Popup Buka Shift | [`Kasir (Pop_up Buka Shift).png`](Mokup/Kasir%20%28Pop_up%20Buka%20Shift%29.png) | Modal berisi ikon kunci, judul `TERMINAL SEDANG DI-JEDA (BUKA SHIFT)`, ringkasan kasir/waktu mulai/akhir, input `MODAL AWAL (RP)`, dan tombol `MULAI SHIFT`. | Modal memusatkan perhatian pada pembukaan shift. Nominal memakai keypad numerik, format Rupiah, dan validasi sebelum shift berubah menjadi aktif. |

### 2.2 POS utama/katalog

| Layar | File reference mockup | Layout dan komponen | Hirarki aksi dan usability |
|---|---|---|---|
| Menu/Katalog | [`Kasir (Menu).png`](Mokup/Kasir%20%28Menu%29.png) | Header `MENU` dengan hamburger. Area kerja terbagi dua: kiri katalog dan kanan `KERANJANG (n)`. Katalog berisi selector `Mode Sale`, `Cabang`, pencarian menu/kode, chip kategori dan subkategori, lalu kartu produk tiga kolom dengan nama, harga, dan tombol `+`. | Tambah item adalah aksi utama dan dapat ditekan pada seluruh area tombol. Keranjang selalu terlihat, menampilkan nama, harga/unit, subtotal, kontrol `− / jumlah / +`, dan hapus. `BERSIHKAN` ditempatkan terpisah sebagai aksi Draft. |

**Aturan split screen:**

- Pada tablet/layar lebar, katalog mengambil sisi kiri dan keranjang sisi kanan dengan pemisah visual jelas.
- Pada layar sempit, keranjang tetap dapat diakses melalui panel/bottom sheet tanpa menghilangkan konteks jumlah item dan total.
- Selector `Cabang` dan `Mode Sale` dapat digunakan sebelum item pertama masuk keranjang; setelah Draft memiliki item, selector terkunci.
- Tampilkan indikator koneksi dan sinkronisasi di header/panel pengaturan. Status lokal harus membedakan `tersimpan lokal`, `menunggu sinkronisasi`, dan `tersinkronisasi`.

### 2.3 Pembayaran tunai

| Layar | File reference mockup | Layout dan komponen | Hirarki aksi dan usability |
|---|---|---|---|
| Popup Pembayaran Transaksi — Tunai | [`Kasir (Pop_up Pembayaran Tunai).png`](Mokup/Kasir%20%28Pop_up%20Pembayaran%20Tunai%29.png) | Modal menampilkan `TOTAL TAGIHAN`, pilihan metode `TUNAI`/`NON-TUNAI`, input `NOMINAL MANUAL`, panel `UANG DITERIMA`, panel `KEMBALIAN`, serta footer `BATALKAN TRANSAKSI` dan `CETAK STRUK & SELESAI`. | Tunai menjadi tab aktif. Sediakan keypad kustom dan nominal cepat minimal `10.000`, `20.000`, `50.000`; nominal diterima tidak boleh lebih kecil dari tagihan. Kalkulator kembalian diperbarui setiap input. Tombol selesai disabled sampai nominal valid. |

**Perilaku:** total tagihan tidak berubah dari keranjang; pembulatan tidak dilakukan diam-diam; jika uang diterima lebih besar, kembalian ditampilkan dalam Rupiah besar dan mudah dibaca. Setelah selesai, tampilkan feedback cetak/struk dan status transaksi `Success`.

### 2.4 Pembayaran non-tunai

| Layar | File reference mockup | Layout dan komponen | Hirarki aksi dan usability |
|---|---|---|---|
| Popup Pembayaran Transaksi — Non-Tunai | [`Kasir (Pop_up Pembayaran Non-Tunai).png`](Mokup/Kasir%20%28Pop_up Pembayaran Non-Tunai%29.png) | Modal menampilkan total tagihan, tab metode, pilihan `OVO`, `DANA`, `BANK TRANSFER`, `KARTU DEBIT`, `QRIS`, panel metode terpilih/status `MENUNGGU PEMBAYARAN`, dan tombol `CETAK STRUK & SELESAI`. | Pilihan metode aktif diberi blok hitam. Input nomor referensi/RRN EDC harus dapat diisi langsung oleh kasir; tidak menunggu callback gateway. Tombol selesai aktif setelah metode dan nomor referensi valid sesuai kebutuhan metode. |

**Fallback koneksi:** transaksi non-tunai yang berhasil dicatat secara lokal harus diberi status sinkronisasi yang terlihat. Jangan menampilkan seolah-olah gateway telah mengonfirmasi apabila aplikasi hanya menyimpan referensi manual.

### 2.5 Jeda sesi, ganti kasir, dan pembukaan kembali

| Layar | File reference mockup | Layout dan komponen | Hirarki aksi dan usability |
|---|---|---|---|
| Ganti Kasir saat jeda | [`Kasir (Pop_up Ganti Kasir).png`](Mokup/Kasir%20%28Pop_up Ganti Kasir%29.png) | Modal lockscreen `TERMINAL SEDANG DI-JEDA (ISTIRAHAT)`, ringkasan kasir/waktu, input username, dan tombol `AMBIL ALIH KASIR`. | Seluruh transaksi dikunci selama jeda. Tombol ambil alih memerlukan username kasir pengganti yang valid; tampilkan feedback berhasil/gagal di dalam modal. |
| Tutup Shift dari jeda | [`Kasir (Pop_up Tutup Shift).png`](Mokup/Kasir%20%28Pop_up Tutup Shift%29.png) | Modal `TERMINAL SEDANG DI-JEDA (TUTUP SHIFT)`, ringkasan kasir dan waktu, input username, serta `AMBIL ALIH KASIR`. | Gunakan state terkunci agar kasir tidak dapat kembali berjualan tanpa memilih alur yang valid. Bila memilih tutup shift, lanjutkan ke input uang fisik. |
| Lockscreen OTP | [`Kasir (Pop_up Verifikasi OTP).png`](Mokup/Kasir%20%28Pop_up Verifikasi OTP%29.png) | Modal dengan ikon kunci, judul `TERMINAL SEDANG DI-JEDA (VERIFIKASI OTP)`, input kode OTP, dan tombol `VERIFIKASI`. | OTP hanya untuk tindakan yang memang memerlukan otorisasi Admin, terutama Void nota lunas. Jangan tampilkan OTP untuk menghapus Draft. Batasi percobaan dan tampilkan error inline. |

### 2.6 Closing shift dan logout

| Layar | File reference mockup | Layout dan komponen | Hirarki aksi dan usability |
|---|---|---|---|
| Tutup Toko/Closing Shift | [`Kasir (Tutup Toko).png`](Mokup/Kasir%20%28Tutup%20Toko%29.png) | Header `TUTUP TOKO`, panel tengah `INPUT JUMLAH UANG FISIK ASLI`, field nominal, lalu footer `TUTUP SHIFT` dan `TUTUP TOKO`. | Input memakai keypad dan format Rupiah. `TUTUP SHIFT` menutup shift; `TUTUP TOKO` menutup shift sekaligus menjalankan direct logout sesuai otorisasi. Setelah klik tutup, langsung redirect ke Login; jangan menampilkan ringkasan selisih uang di HP kasir. |

### 2.7 Pengaturan terminal

| Layar | File reference mockup | Layout dan komponen | Hirarki aksi dan usability |
|---|---|---|---|
| Pengaturan | [`Kasir (Pengaturan).png`](Mokup/Kasir%20%28Pengaturan%29.png) | Sidebar mobile berisi `MENU`, `GANTI KASIR`, `TUTUP TOKO`, `PENGATURAN`. Konten berisi koneksi printer thermal dan tombol `PINDAI PERANGKAT`, pilihan lebar kertas 58/80 mm, `TEST PRINT`, panel sinkronisasi data dengan jumlah transaksi lokal dan `SINKRONISASI`, endpoint API dan `UJI KONEKSI SERVER`, pengguna aktif, serta waktu sistem. | Kelompokkan tindakan perangkat, jaringan, dan sinkronisasi dalam panel terpisah. Hasil test print/uji koneksi tampil inline. Jangan menghapus antrean lokal ketika sinkronisasi gagal; tampilkan jumlah transaksi yang masih menunggu. |

## 3. Spesifikasi Layar Web Dashboard (Admin Event)

### 3.1 Pola layout dan hirarki navigasi sidebar web

Semua layar internal Web Admin menggunakan layout konsisten dengan **Sidebar Kiri Fixed** beridentitas `POS ADMIN` dan **Content Area Utama** di sebelah kanan.

Struktur navigasi sidebar dikelompokkan sebagai berikut:

```text
POS ADMIN (Sidebar)
 ├─ Dashboard
 ├─ Menu & Katalog (Dropdown)
 │   ├─ Kategori
 │   ├─ Sub-kategori
 │   ├─ Menu Produk
 │   ├─ Harga Produk
 │   └─ Promosi
 ├─ Cabang / Event
 ├─ Mode Penjualan
 ├─ Pegawai (Dropdown)
 │   ├─ Kasir
 │   └─ Admin
 ├─ Laporan Keuangan
 ├─ OTP
 └─ Log & Riwayat (Dropdown)
     ├─ Audit Log
     ├─ Shift Log
     └─ Riwayat Transaksi
```

### 3.2 Rincian komponen dan halaman per item navigasi admin

| Item Navigasi | Tipe Menu | File reference mockup | Struktur, Komponen, dan Fungsi UI |
|---|---|---|---|
| **Dashboard** | Single | [`Admin (Dashboard).png`](Mokup/Admin%20%28Dashboard%29.png) | Widget KPI (`OMZET HARI INI`, `TRANSAKSI AKTIF`, `TOTAL TRANSAKSI`, `AUDIT WARNING`), grafik tren omzet dengan toggle `Harian`/`Bulanan`, dan panel alert selisih shift dengan border putus-putus. |
| **Menu ➔ Kategori** | Submenu | [`Admin (Menu).png`](Mokup/Admin%20%28Menu%29.png) | Form CRUD Kategori (nama kategori, deskripsi, status aktif) & tabel master data kategori dengan pencarian, filter, pagination, dan tombol aksi (Edit/Hapus). |
| **Menu ➔ Sub-kategori** | Submenu | [`Admin (Menu).png`](Mokup/Admin%20%28Menu%29.png) | Form CRUD Sub-kategori (pilihan parent Kategori, nama sub-kategori) & tabel master sub-kategori dengan pencarian, filter, pagination, dan tombol aksi (Edit/Hapus). |
| **Menu ➔ Promosi** | Submenu | [`Admin (Menu).png`](Mokup/Admin%20%28Menu%29.png) | Form CRUD Promosi (nama promo, tipe diskon persen/nominal, tanggal berlaku, minimum pembelian) & tabel promo aktif/nonaktif pada cabang mana berlaku dengan pencarian, filter, pagination, dan tombol aksi (Edit/Hapus). |
| **Menu ➔ Menu** | Submenu | [`Admin (Menu).png`](Mokup/Admin%20%28Menu%29.png) | Form CRUD produk/item menu (nama, subkategori, kategori) & tabel master menu terpadu dengan pencarian, filter, pagination, dan tombol aksi (Edit/Hapus). |
| **Menu ➔ Harga Cabang** | Submenu | [`Admin (Menu).png`](Mokup/Admin%20%28Menu%29.png) | Form & Tabel `TEMPLATE HARGA REGIONAL & CABANG` (pemetaan harga khusus produk per cabang & sales mode) dengan filter, pagination, dan tombol aksi (Edit/Hapus). |
| **Cabang** | Single | [`Admin (Menu).png`](Mokup/Admin%20%28Menu%29.png) | Form CRUD Cabang/Booth Event (nama cabang, alamat, persen pajak cabang, status aktif) & tabel daftar cabang terdaftar dengan pencarian, filter, pagination, dan tombol aksi (Edit/Hapus). |
| **Sales Mode** | Single | [`Admin (Menu).png`](Mokup/Admin%20%28Menu%29.png) | Form CRUD Jalur Penjualan (`Dine In`, `Takeaway`, `Event Field Sales`, dll.) & tabel konfigurasi sales mode dengan pencarian, filter, pagination, dan tombol aksi (Edit/Hapus). |
| **Pegawai ➔ Kasir** | Submenu | [`Admin (Kasir).png`](Mokup/Admin%20%28Kasir%29.png) | Form akun Kasir Lapangan (username, nama lengkap, pilihan cabang penugasan, status akun aktif/nonaktif) & tabel kasir dengan tombol reset token, export CSV, dan log aktivitas dengan pencarian, filter, pagination, dan tombol aksi (Edit/Hapus). |
| **Pegawai ➔ Admin** | Submenu | [`Admin (Admin).png`](Mokup/Admin%20%28Admin%29.png) | Form akun Administrator Web (nama lengkap, username, password) & tabel administrator aktif dengan status akun, total akun, dan log perubahan terakhir dengan pencarian, filter, pagination, dan tombol aksi (Edit/Hapus). |
| **Log ➔ Audit Log** | Submenu | [`Admin (Riwayat Transaksi).png`](Mokup/Admin%20%28Riwayat%20Transaksi%29.png) | Viewer log audit keamanan sistem (pencatatan verifikasi OTP void, alasan void, aksi perubahan master data, user actor, timestamp, dan IP address). |
| **Log ➔ Shift Log** | Submenu | [`Admin (Riwayat Transaksi).png`](Mokup/Admin%20%28Riwayat%20Transaksi%29.png) | Viewer log sesi shift operator (riwayat Buka Shift, Jeda/Break, Resume, Switch Operator, Close Silent, dan catatan `auto_closed` 03:00). |
| **Log ➔ Riwayat Transaksi** | Submenu | [`Admin (Riwayat Transaksi).png`](Mokup/Admin%20%28Riwayat%20Transaksi%29.png) | Tabel pencarian & filter transaksi (ID transaksi, kasir, waktu, cabang, metode bayar, nomor referensi RRN EDC/transfer, status `[SUCCESS]`, `[CANCELLED]`, `[VOID]`, serta modal detail struk). |
| **Laporan Keuangan** | Single | [`Admin (Laporan Keuangan).png`](Mokup/Admin%20%28Laporan%20Keuangan%29.png) | Halaman analitik omzet dengan 8 kombinasi filter parameter, KPI pendapatan bersih, breakdown metode pembayaran, serta tombol `EKSPOR PDF` dan `EKSPOR EXCEL (XLSX)`. |

### 3.3 Filter dan tabel laporan

Panel parameter laporan mengikuti mockup: jenis laporan, rentang tanggal, cabang, kategori, metode pembayaran, dan tombol `TAMPILKAN LAPORAN`. Untuk memenuhi kebutuhan analitik, filter diterapkan dalam delapan kombinasi berikut; kontrol yang tidak relevan pada jenis laporan terpilih boleh dinonaktifkan dengan alasan yang terlihat.

| Kombinasi | Parameter laporan |
|---:|---|
| 1 | Jenis laporan + rentang tanggal |
| 2 | Jenis laporan + rentang tanggal + cabang |
| 3 | Jenis laporan + rentang tanggal + kategori |
| 4 | Jenis laporan + rentang tanggal + metode pembayaran |
| 5 | Jenis laporan + rentang tanggal + cabang + kategori |
| 6 | Jenis laporan + rentang tanggal + cabang + metode pembayaran |
| 7 | Jenis laporan + rentang tanggal + kategori + metode pembayaran |
| 8 | Jenis laporan + rentang tanggal + cabang + kategori + metode pembayaran |

Output harus konsisten antara KPI, grafik/panel metode, tabel rincian, dan file export. Nilai transaksi `Cancelled`/`Void` ditampilkan sebagai komponen audit dan tidak dihitung sebagai pendapatan bersih tanpa penyesuaian yang jelas.

## 4. Aturan Proteksi UX & Penanganan Kesalahan (Usability Safeguards)

| Skenario | Aturan interaksi | Feedback yang wajib terlihat |
|---|---|---|
| Penguncian selector | `Cabang` dan `Sales Mode` otomatis disabled begitu item pertama masuk keranjang Draft. | Selector tampak disabled dan beri helper text bahwa perubahan memerlukan keranjang kosong. |
| Pembatalan keranjang Draft | Hapus item, kurangi jumlah, atau `BERSIHKAN` mengubah Draft secara instan. Tidak ada popup OTP Admin. | Jumlah item dan total diperbarui seketika; sediakan undo singkat bila item terhapus karena salah tekan. |
| Pembatalan nota lunas/Success | Tombol `Void` membuka modal verifikasi OTP Admin dan field alasan wajib. | Modal mengunci konteks nota, menampilkan status verifikasi, error OTP, dan validasi alasan kosong. Berhasil Void masuk audit log. |
| Closing shift direct logout | Kasir mengisi uang fisik, klik `TUTUP`, lalu sistem langsung redirect ke halaman Login. | Tampilkan feedback singkat sebelum redirect. Jangan menampilkan ringkasan selisih uang pada layar HP kasir. Data rekonsiliasi tetap tersedia untuk Admin. |
| Input non-tunai direct | Nomor referensi/RRN EDC diinput langsung; alur tidak menunggu callback gateway. | Tampilkan metode terpilih, referensi, status pencatatan lokal/sinkronisasi, dan cegah submit ganda. |
| Salah input nominal tunai | Nominal kosong, bukan angka, atau lebih kecil dari tagihan tidak dapat diselesaikan. | Error inline dekat input; tombol `CETAK STRUK & SELESAI` disabled. |
| Koneksi terputus | Transaksi dan perubahan yang aman disimpan dalam antrean lokal sesuai status sinkronisasi. | Indikator `offline/menunggu sinkronisasi` selalu terlihat; jangan memberi label sukses server sebelum sinkronisasi terkonfirmasi. |
| Sinkronisasi gagal | Jangan menghapus data lokal atau menggandakan transaksi saat retry. | Tampilkan jumlah gagal, waktu percobaan terakhir, dan tombol retry/sinkronisasi manual. |
| Tombol berisiko | Hapus, Void, Tutup Shift, dan Tutup Toko memiliki label berbeda, posisi konsisten, dan target sentuh cukup besar. | Gunakan status/action confirmation yang proporsional; OTP hanya pada Void Success atau tindakan yang ditetapkan membutuhkan Admin. |
| Sesi jeda | Saat lockscreen aktif, kontrol katalog dan pembayaran tidak dapat digunakan. | Tampilkan identitas kasir, waktu mulai/akhir, serta aksi yang tersedia: buka kembali, ambil alih kasir, atau tutup shift. |

### 4.1 State transaksi yang harus terlihat

| State | Makna UI | Aksi yang diizinkan |
|---|---|---|
| `Draft` | Keranjang masih disusun dan belum menjadi nota lunas. | Tambah/ubah/hapus item, kosongkan keranjang, ganti parameter sebelum item pertama. Tidak perlu OTP untuk pembatalan Draft. |
| `Success` | Pembayaran selesai dan transaksi tercatat. | Cetak ulang/catat; pembatalan berubah menjadi alur Void. |
| `Cancelled` | Draft dibatalkan sebelum menjadi transaksi lunas. | Tampilkan alasan bila diperlukan oleh audit; tidak menggunakan alur Void. |
| `Void` | Nota Success dibatalkan setelah pembayaran. | Wajib OTP Admin, alasan wajib, dan jejak audit. |

### 4.2 Checklist penerimaan UI/UX

- Semua layar mobile memiliki target sentuh utama minimal 48 × 48 dp dan kontras tinggi.
- Keranjang selalu menunjukkan jumlah, harga/unit, subtotal, dan total yang mutakhir.
- Selector Cabang/Sales Mode terkunci setelah item Draft pertama masuk.
- Draft dapat dibersihkan tanpa OTP; Void Success selalu memakai OTP dan alasan.
- Pembayaran tunai menghitung kembalian otomatis; pembayaran non-tunai menerima referensi/RRN secara langsung.
- Closing shift melakukan direct logout tanpa ringkasan selisih pada HP kasir.
- Status offline, antrean lokal, dan hasil sinkronisasi terbaca tanpa membuka menu tersembunyi.
- Admin dapat memfilter riwayat, melihat status dan alasan, meninjau KPI, serta mengekspor laporan sesuai mockup.
- Tidak ada status yang hanya dibedakan lewat warna; semua status memiliki label teks.

---

## 5. Alternatif Desain: Minimalist Dark Mode (Web Admin)

> **Tujuan:** Bagian ini mendokumentasikan spesifikasi lengkap desain alternatif **Minimalist UI Dark Mode** untuk Web Admin. Desain ini bisa diaktifkan kapan saja sebagai pengganti Neo-Brutalism tanpa mengubah logika backend, controller, database, maupun routing. Perubahan bersifat 100% pada lapisan tampilan (CSS, Tailwind class, dan Blade view).

### 5.1 Filosofi Desain

| Aspek | Keterangan |
|---|---|
| **Gaya** | SaaS-grade Minimalist, terinspirasi dari Vercel, Linear, dan Shadcn UI |
| **Mode Warna** | **Dark Mode** sebagai default — mengurangi kelelahan mata saat bekerja lama di depan layar |
| **Prinsip** | Bersih (*clean*), tenang (*calm*), fokus pada konten data, hierarki visual jelas melalui kontras tipis & spasi |
| **Target** | Admin yang bekerja lama memantau dasbor, mengelola data master, dan menganalisis laporan |

### 5.2 Design Tokens — Skema Warna Dark Mode

#### 5.2.1 Warna Latar Belakang (Background)

| Token | Hex | Penggunaan |
|---|---|---|
| `--bg-base` | `#0F0F12` | Latar utama `<body>` dan area konten |
| `--bg-surface` | `#18181B` | Card, panel, modal, dan area formulir (Zinc 900) |
| `--bg-elevated` | `#1F1F23` | Sidebar, header, dropdown, dan tooltip |
| `--bg-hover` | `#27272A` | Hover pada baris tabel, item navigasi (Zinc 800) |
| `--bg-active` | `#3F3F46` | Item sidebar aktif, tab yang dipilih (Zinc 700) |

#### 5.2.2 Warna Teks (Foreground)

| Token | Hex | Penggunaan |
|---|---|---|
| `--text-primary` | `#FAFAFA` | Heading, label aksi, KPI utama (Zinc 50) |
| `--text-secondary` | `#A1A1AA` | Teks deskripsi, helper, placeholder (Zinc 400) |
| `--text-muted` | `#71717A` | Teks disabler, keterangan minor (Zinc 500) |
| `--text-inverse` | `#0F0F12` | Teks di atas tombol aksen terang |

#### 5.2.3 Warna Border & Pemisah

| Token | Hex | Penggunaan |
|---|---|---|
| `--border-subtle` | `#27272A` | Border card, divider tabel, separator sidebar (Zinc 800) |
| `--border-default` | `#3F3F46` | Border input field, dropdown, dan modal (Zinc 700) |
| `--border-focus` | `#6366F1` | Ring focus pada input, button, dan interactive element (Indigo 500) |

#### 5.2.4 Warna Aksen & Status

| Token | Hex | Penggunaan |
|---|---|---|
| `--accent-primary` | `#6366F1` | Tombol aksi utama, link aktif, badge aktif (Indigo 500) |
| `--accent-hover` | `#818CF8` | Hover tombol aksi utama (Indigo 400) |
| `--success` | `#10B981` | Badge sukses, status aktif, indikator selesai (Emerald 500) |
| `--success-bg` | `rgba(16, 185, 129, 0.1)` | Background badge sukses |
| `--warning` | `#F59E0B` | Badge peringatan, selisih shift (Amber 500) |
| `--warning-bg` | `rgba(245, 158, 11, 0.1)` | Background badge peringatan |
| `--danger` | `#EF4444` | Badge error, tombol hapus, status void (Red 500) |
| `--danger-bg` | `rgba(239, 68, 68, 0.1)` | Background badge error |
| `--info` | `#3B82F6` | Badge info, status pending (Blue 500) |
| `--info-bg` | `rgba(59, 130, 246, 0.1)` | Background badge info |

### 5.3 Design Tokens — Tipografi

| Elemen | Font Family | Weight | Size |
|---|---|---|---|
| **Heading halaman** | `Inter`, `sans-serif` | 700 (Bold) | 24–28px |
| **Heading card/section** | `Inter` | 600 (Semibold) | 16–18px |
| **Label field** | `Inter` | 500 (Medium) | 13–14px |
| **Body text / tabel** | `Inter` | 400 (Regular) | 14px |
| **Helper / caption** | `Inter` | 400 | 12px, warna `--text-secondary` |
| **Nominal / KPI** | `JetBrains Mono` atau `Fira Code` | 600–700 | 28–36px |
| **Data teknis** | `JetBrains Mono` | 400 | 13px |

**CDN Font:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
```

### 5.4 Design Tokens — Spacing, Shadow, dan Radius

| Token | Nilai | Penggunaan |
|---|---|---|
| `--radius-sm` | `6px` | Input field, badge, chip |
| `--radius-md` | `8px` | Card, dropdown, tooltip |
| `--radius-lg` | `12px` | Modal, panel besar |
| `--radius-full` | `9999px` | Avatar, pill badge |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Card, input, dropdown |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.4)` | Modal, popup |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.5)` | Overlay, floating panel |
| `--space-xs` | `4px` | Gap antar elemen kecil |
| `--space-sm` | `8px` | Padding dalam badge, gap komponen |
| `--space-md` | `16px` | Padding card, margin section |
| `--space-lg` | `24px` | Padding panel besar, margin antar section |
| `--space-xl` | `32px` | Padding halaman, gap layout |

### 5.5 Mapping Komponen — Neo-Brutalism → Minimalist Dark

| Komponen | Neo-Brutalism (Saat Ini) | Minimalist Dark (Target) |
|---|---|---|
| **`body`** | `bg-[#F5F0E8]`, `font-grotesk` | `bg-[#0F0F12]`, `font-sans` (Inter) `text-zinc-50` |
| **Sidebar** | `bg-white`, `border-3px solid black` | `bg-[#18181B]`, `border-r border-zinc-800` |
| **Sidebar brand** | `bg-black text-white` | `bg-[#18181B]` `text-zinc-50`, logo/nama lebih halus |
| **Sidebar item** | `border-2 border-black bg-white` | `rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50` |
| **Sidebar item aktif** | `bg-gray-200 shadow translate` | `bg-zinc-800 text-zinc-50 font-medium` |
| **Top header** | `bg-white border-b-2 border-black` | `bg-[#18181B] border-b border-zinc-800` |
| **Date badge** | `bg-yellow-300 border-2 border-black shadow` | `bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md` |
| **Card / Panel** | `bg-white border-4 border-black shadow-[4px_4px_0_#000]` | `bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm` |
| **`.brutal-input`** | `border-2 border-black`, focus `shadow-[4px_4px_0_#000]` | `bg-zinc-900 border border-zinc-700 rounded-md text-zinc-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500` |
| **`.brutal-btn` primary** | `bg-black text-white border-2 border-black` | `bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-sm` |
| **`.brutal-btn` secondary** | `bg-white border-2 border-black shadow-[4px_4px_0_#000]` | `bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md` |
| **`.brutal-btn` danger** | `bg-red-400 border-2` | `bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-500/30 rounded-md` |
| **Table header** | `bg-black text-white border-2` | `bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800` |
| **Table row** | `border-2 border-black bg-white` | `border-b border-zinc-800 hover:bg-zinc-800/50 text-zinc-300` |
| **Toast success** | `bg-green-400 border-2 border-black` | `bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg` |
| **Toast error** | `bg-red-400 border-2 border-black` | `bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg` |
| **Modal overlay** | `bg-black/50` | `bg-black/60 backdrop-blur-sm` |
| **Modal box** | `bg-white border-4 border-black shadow-[4px_4px_0_#000]` | `bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg` |
| **Badge/Status** | `border-2 border-black` teks label | `rounded-full px-2.5 py-0.5 text-xs font-medium` + warna per status |
| **Pagination** | `border-2 border-black` | `rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400` |
| **Accordion button** | `brutal-btn brutal-btn-primary shadow-[4px_4px_0_#000]` | `bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-800` |

### 5.6 Konfigurasi Tailwind untuk Minimalist Dark

```javascript
tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                'sans': ['"Inter"', 'system-ui', 'sans-serif'],
                'mono': ['"JetBrains Mono"', 'monospace']
            },
            colors: {
                surface: '#18181B',
                elevated: '#1F1F23',
                base: '#0F0F12',
            }
        }
    }
}
```

### 5.7 File yang Perlu Diubah saat Migrasi

Semua perubahan bersifat **pure UI/presentasi** — tidak ada perubahan pada controller, model, migration, route, maupun request validation.

| No | File | Jenis Perubahan |
|---:|---|---|
| 1 | `public/css/admin-brutal.css` | **Tulis ulang** seluruh class utility (`.brutal-*`) menjadi class minimalist dark sesuai mapping §5.5 |
| 2 | `resources/views/layouts/admin.blade.php` | Ganti font CDN, Tailwind config, sidebar, top header, toast, modal konfirmasi, dan latar `<body>` |
| 3 | `resources/views/admin/dashboard.blade.php` | Ganti class warna card KPI, grafik, dan panel alert |
| 4 | `resources/views/admin/cabang/index.blade.php` | Ganti class tabel, form, modal edit |
| 5 | `resources/views/admin/menu/index.blade.php` | Ganti class tabel, form, modal edit |
| 6 | `resources/views/admin/kategori/index.blade.php` | Ganti class tabel, form, modal edit |
| 7 | `resources/views/admin/sub-kategori/index.blade.php` | Ganti class tabel, form, modal edit |
| 8 | `resources/views/admin/promosi/index.blade.php` | Ganti class tabel, form, modal edit |
| 9 | `resources/views/admin/harga-cabang/index.blade.php` | Ganti class tabel, form, modal edit |
| 10 | `resources/views/admin/sales-mode/index.blade.php` | Ganti class tabel, form |
| 11 | `resources/views/admin/pegawai/kasir/index.blade.php` | Ganti class tabel, form, modal edit |
| 12 | `resources/views/admin/management/index.blade.php` | Ganti class tabel, form, modal edit |
| 13 | `resources/views/admin/otp/index.blade.php` | Ganti class panel OTP, form target, dan display kode |
| 14 | `resources/views/admin/otp/partials/table.blade.php` | Ganti class tabel riwayat OTP |
| 15 | `resources/views/admin/log/audit/index.blade.php` | Ganti class tabel log |
| 16 | `resources/views/admin/log/shift/index.blade.php` | Ganti class tabel log |
| 17 | `resources/views/admin/log/transaksi/index.blade.php` | Ganti class tabel dan modal detail |
| 18 | `resources/views/admin/laporan/index.blade.php` | Ganti class filter, KPI, tabel, dan tombol ekspor |
| 19 | `resources/views/auth/login.blade.php` | Ganti latar dan card login |

### 5.8 Prinsip Aksesibilitas Dark Mode

1. **Rasio kontras minimum 4.5:1** untuk teks normal, 3:1 untuk teks besar (sesuai WCAG 2.1 AA).
2. **Jangan mengandalkan warna saja** untuk membedakan status — selalu sertakan label teks (`Aktif`, `Void`, `Success`, dll.).
3. **Focus ring** harus selalu terlihat jelas (`ring-2 ring-indigo-500`) pada semua elemen interaktif.
4. **Transisi halus** (`transition-colors duration-150`) untuk semua perubahan state agar tidak mengejutkan mata.
5. **Hindari pure black** (`#000000`) sebagai latar — gunakan off-black (`#0F0F12`) untuk mengurangi silau kontras pada layar OLED/AMOLED.


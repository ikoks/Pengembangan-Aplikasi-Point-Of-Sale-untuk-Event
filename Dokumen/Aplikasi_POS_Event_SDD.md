# SOFTWARE DESIGN DOCUMENT (SDD)
## APLIKASI KASIR DIGITAL (SISTEM POS EVENT)
**Multi-Platform: Web Dashboard & Mobile APK**

**Penulis:**
[Nama Anda / Tim Pengembang]

**Institusi:**
[Nama Universitas / Program Studi]
2026

---

## Daftar Isi
- [Bab I Pendahuluan](#bab-i-pendahuluan)
  - [I.1 Tujuan](#i1-tujuan)
  - [I.2 Ruang Lingkup](#i2-ruang-lingkup)
  - [I.3 Gambaran Umum](#i3-gambaran-umum)
  - [I.4 Referensi](#i4-referensi)
  - [I.5 Definisi dan Singkatan](#i5-definisi-dan-singkatan)
- [Bab II Gambaran Umum Sistem](#bab-ii-gambaran-umum-sistem)
  - [II.1 Fungsi](#ii1-fungsi)
  - [II.2 Fitur](#ii2-fitur)
  - [II.3 Proses Bisnis](#ii3-proses-bisnis)
- [Bab III Desain Aplikasi (UML Diagrams)](#bab-iii-desain-aplikasi-uml-diagrams)
  - [III.1 Use Case Diagram](#iii1-use-case-diagram)
  - [III.2 Skenario Use Case](#iii2-skenario-use-case)
  - [III.3 Class Diagram](#iii3-class-diagram)
  - [III.4 Sequence Diagram](#iii4-sequence-diagram)
  - [III.5 Activity Diagram](#iii5-activity-diagram)
  - [III.6 State Diagram](#iii6-state-diagram)
  - [III.7 Deployment Diagram](#iii7-deployment-diagram)
- [Bab IV Desain Data](#bab-iv-desain-data)
  - [IV.1 Logical Design (ERD)](#iv1-logical-design-erd)
  - [IV.2 Physical Design (Spesifikasi Tabel)](#iv2-physical-design-spesifikasi-tabel)
- [Bab V Desain Antarmuka Pengguna](#bab-v-desain-antarmuka-pengguna)
- [Bab VI Kebutuhan Antarmuka Eksternal](#bab-vi-kebutuhan-antarmuka-eksternal)
  - [VI.1 Antarmuka Pengguna (User Interface)](#vi1-antarmuka-pengguna-user-interface)
  - [VI.2 Antarmuka Perangkat Keras (Hardware Interface)](#vi2-antarmuka-perangkat-keras-hardware-interface)
  - [VI.3 Antarmuka Perangkat Lunak (Software Interface)](#vi3-antarmuka-perangkat-lunak-software-interface)
  - [VI.4 Antarmuka Komunikasi (Communication Interface)](#vi4-antarmuka-komunikasi-communication-interface)

---

## Bab I Pendahuluan

### I.1 Tujuan
Dokumen *Software Design Document* (SDD) ini disusun sebagai acuan utama dalam proses pengembangan dan implementasi Sistem POS Event (Aplikasi Kasir Digital Event). Dokumen ini menjabarkan desain teknis dari sistem yang akan dikembangkan, mencakup rancangan sistem, arsitektur perangkat lunak, desain antarmuka pengguna, serta berbagai diagram dan model pendukung lainnya. Tujuan dari penulisan dokumen ini adalah untuk memberikan gambaran dan penjelasan sistem yang dirancang agar seluruh komponen data (tabel MySQL) dan diagram perancangan (UML) saling terintegrasi secara konsisten tanpa ada celah ketidakcocokan logika sistem.

### I.2 Ruang Lingkup
Perangkat lunak Sistem POS Event ini mencakup pengelolaan operasional transaksi penjualan di area festival dengan mobilitas tinggi yang terdiri dari dua platform utama:
1. **Web Dashboard (Sisi Admin)**: Mengelola master data seperti pengguna (kasir/admin), cabang event, sales mode, katalog menu, promosi aktif, metode pembayaran, memantau log audit transaksi untuk keamanan finansial, serta generate laporan keuangan (omzet, menu terlaris) yang siap diekspor.
2. **Mobile APK (Sisi Kasir)**: Aplikasi mobile Android yang digunakan kasir di lapangan untuk melakukan opening/closing shift, menginput pesanan keranjang secara **hybrid** (berjalan secara *offline-first* ketika jaringan tidak stabil dan secara *online* langsung terhubung ke server pusat ketika internet tersedia), mengaplikasikan promosi otomatis cabang, memproses pembayaran tunai dan non-tunai (QRIS dinamis via API payment gateway), melakukan jeda sesi kasir sementara, void item pesanan, dan mencetak struk belanja menggunakan printer thermal Bluetooth.

**Konektivitas Klien Mobile**:
* **Kondisi Online (Tersambung Internet)**: Aplikasi mobile kasir terhubung secara langsung (*real-time*) ke server database pusat melalui RESTful API backend Laravel untuk mengunduh katalog menu terbaru, memvalidasi sesi login, me-request pembayaran QRIS/VA ke payment gateway, serta mengunggah data transaksi secara langsung.
* **Kondisi Offline (Terputus Internet)**: Kasir tetap dapat membuka shift, menyusun keranjang belanja, menerapkan promo, dan memproses pembayaran tunai secara mandiri menggunakan database lokal perangkat. Strategi basis data menggunakan **UUID v4 (CHAR(36))** pada seluruh tabel operasional transaksi untuk memungkinkan pembuatan ID transaksi yang unik secara mandiri di sisi klien mobile saat offline, tanpa risiko tabrakan data. Setelah koneksi internet kembali stabil, aplikasi mobile akan secara otomatis melakukan sinkronisasi untuk mengirimkan data transaksi lokal langsung ke database server pusat.

### I.3 Gambaran Umum
Dokumen ini disusun dalam beberapa bab utama:
* **Bab I Pendahuluan**: Berisi latar belakang, tujuan dokumen, ruang lingkup aplikasi, referensi perancangan, serta terminologi dan singkatan.
* **Bab II Gambaran Umum Sistem**: Berisi fungsi utama sistem, fitur pendukung operasional kasir dan keamanan administrasi, serta alur proses bisnis dari masing-masing aktor.
* **Bab III Desain Aplikasi**: Menyajikan visualisasi dan deskripsi diagram UML (Use Case, Skenario Use Case lengkap, Class Diagram, Sequence Diagram, Activity Diagram, State Diagram, dan Deployment Diagram).
* **Bab IV Desain Data**: Menjelaskan perancangan data secara logis (ERD) dan fisik (14 spesifikasi tabel database relasional terperinci).
* **Bab V Desain Antarmuka Pengguna**: Memuat konsep perancangan tampilan GUI untuk APK Mobile kasir dan Web Dashboard admin.
* **Bab VI Kebutuhan Antarmuka Eksternal**: Berisi kebutuhan fungsional antarmuka pengguna, kebutuhan perangkat keras pendukung (printer Bluetooth thermal, smartphone kasir), perangkat lunak (Laravel, MySQL, Android SDK), dan protokol antarmuka komunikasi.

### I.4 Referensi
* Fajri Rahmat Umbara. (2025). *Modul Praktikum Analisis dan Perancangan Perangkat Lunak*. Laboratorium Informatika UNJANI.
* Spesifikasi Standar UUID v4 (RFC 4122) untuk alokasi ID desentralisasi.
* API Reference Payment Gateway Integration (Midtrans / Xendit).

### I.5 Definisi dan Singkatan
1. **POS (Point Of Sale)**: Aplikasi kasir digital yang digunakan untuk mencatat transaksi penjualan.
2. **SDD (Software Design Document)**: Dokumen perancangan teknis perangkat lunak.
3. **UML (Unified Modeling Language)**: Bahasa pemodelan grafis standar untuk merancang sistem perangkat lunak.
4. **UUID v4**: *Universally Unique Identifier* versi 4 (berukuran 36 karakter) yang di-generate secara acak untuk menjamin keunikan kunci primer secara global.
5. **QRIS (Quick Response Code Indonesian Standard)**: Standar pembayaran non-tunai berbasis kode QR di Indonesia.
6. **Payment Gateway**: Pihak ketiga penyedia layanan pemrosesan transaksi pembayaran non-tunai (contoh: Midtrans, Xendit).
7. **Shift Session**: Sesi kerja kasir dari proses Opening Shift (modal awal) hingga Closing Shift (penginputan uang fisik laci).
8. **Void**: Pembatalan sebagian item menu dari keranjang nota belanja aktif atau transaksi ter-settle yang dicatat dalam log audit.
9. **Cancelled**: Pembatalan nota transaksi belanja secara menyeluruh sebelum atau setelah selesai transaksi dengan input alasan pembatalan.
10. **Webhook**: Callback API dari server payment gateway ke server backend untuk mengonfirmasi status transaksi (Settlement/Expired) secara otomatis.

---

## Bab II Gambaran Umum Sistem

### II.1 Fungsi
Aplikasi Sistem POS Event ini memiliki fungsi utama sebagai berikut:
* **Fungsi Dashboard Administrasi (Web Admin)**: Menyediakan antarmuka untuk pengelolaan data master cabang/event, akun pengguna, kategori produk, menu kuliner/merchandise, sales mode, promosi, audit log koreksi admin atas transaksi bermasalah, serta generate laporan omzet.
* **Fungsi Operasional POS (Mobile APK)**: Memproses pencatatan shift kerja, mendownload katalog menu spesifik cabang & sales mode, menyusun keranjang belanja secara offline-first, memvalidasi diskon promosi otomatis, menampilkan QRIS dinamis pembayaran non-tunai, melakukan jeda sesi layar kasir tanpa memutus shift aktif di backend, memfasilitasi pembatalan void/cancelled dengan alasan teks, serta memicu pencetakan struk fisik via koneksi Bluetooth.

### II.2 Fitur
Untuk mendukung kebutuhan operasional, sistem dilengkapi fitur berikut:
1. **Authentication Layer**: Login kasir cepat hanya menggunakan username tanpa password untuk mempercepat perputaran kasir di area festival.
2. **Opening/Closing Shift**: Perekaman modal awal laci kasir, penugasan cabang event berjalan, dan kanal sales mode yang aktif untuk sesi shift tersebut.
3. **Regional Price & Promotion Automation**: Kalkulasi harga otomatis sesuai cabang dan mode jual dari `menu_template` serta diskon otomatis (potongan nominal/persen atau penyisipan hadiah produk gratis senilai Rp0).
4. **Offline Transaction Buffer**: Penyimpanan transaksi lokal berbasis UUID v4 yang aman ketika jaringan internet event terputus sementara.
5. **Integrated Payment Gateway QRIS**: Request kode QR dinamis dari API payment gateway, penyimpanan QR string data di database, dan pembaruan status transaksi otomatis via callback Webhook server.
6. **Financial Security Forensic**: Log pembatalan transaksi berjenjang (Void/Cancelled) dengan input wajib alasan teks, serta pencatatan audit penyesuaian oleh Admin (`diperbaharui_oleh` dan `catatan_koreksi`).
7. **Reconciliation Analysis**: Kalkulasi otomatis selisih uang antara data transaksi digital sistem dengan uang fisik asli yang dihitung kasir saat menutup shift (`selisih_uang`).

### II.3 Proses Bisnis
1. **Proses Bisnis Kasir (Mobile POS)**:
   * Kasir membuka aplikasi POS Mobile dan login dengan Username kasir yang aktif.
   * Kasir melakukan konfigurasi *Opening Shift* dengan memilih cabang event ditugaskan, memilih sales mode (misal: Offline / GoFood), dan menginput modal awal.
   * Sistem mencatat baris `shift_session` baru dengan status `'OPEN'` dan mengunduh master katalog menu, harga regional, dan promosi yang aktif di cabang & sales mode tersebut.
   * Saat pelanggan memesan, kasir menyusun pesanan di keranjang belanja. Sistem otomatis menghitung subtotal item, memotong harga dari promosi aktif, menyisipkan produk gratis jika ada, menghitung pajak event, dan menjumlahkan total pembayaran.
   * Kasir memilih metode pembayaran. Jika Tunai, transaksi langsung selesai. Jika Non-Tunai, sistem menampilkan QRIS di layar (setelah mendapatkan string QR dari API payment gateway). Setelah status pembayaran sukses (dikonfirmasi lewat webhook), transaksi selesai.
   * Sistem memicu printer thermal Bluetooth untuk mencetak struk nota belanja.
   * Di akhir kerja, kasir melakukan *Closing Shift* dengan memasukkan uang fisik asli di laci. Sistem membandingkannya dengan nominal sistem dan mencatat selisihnya di kolom `selisih_uang`.
2. **Proses Bisnis Admin (Web Dashboard)**:
   * Admin mendaftar dan masuk ke dashboard web dengan username dan password (di-hash).
   * Admin mengelola master data menu produk dan mengatur detail `menu_template` harga per cabang & sales mode.
   * Admin mengelola akun kasir lapangan (membuat username baru, menonaktifkan akun, atau menetapkan cabang asal/default).
   * Admin memantau transaksi penjualan masuk, memeriksa audit log (nota cancelled, item void beserta alasannya), dan melakukan koreksi transaksi paska-event jika ada laporan masalah.
   * Admin memproduksi laporan keuangan (omzet, persentase pembayaran digital, menu terlaris) dan mengunduhnya dalam format PDF/Excel.

---

## Bab III Desain Aplikasi (UML Diagrams)

### III.1 Use Case Diagram
Diagram Use Case menggambarkan hubungan interaksi antara aktor (Admin dan Kasir) dengan fungsi-fungsi utama di dalam Sistem POS Event. 
Diagram ini dapat diakses pada berkas: [UseCase.png](file:///D:/Kuliah/Semester%207/KP/Point-Of-Sale-App/Dokumen/UseCase.png).

### III.2 Skenario Use Case
Skenario di bawah ini disarikan secara lengkap dari berkas `Usecase Scenario.xlsx` yang telah diperbarui dan disinkronkan dengan basis data:

#### 1. Use Case: Login & Inisialisasi Kasir
* **Aktor Utama**: Kasir
* **Tujuan**: Login dan menyiapkan parameter POS (mode, cabang, dan modal awal) sebelum transaksi dimulai.
* **Kondisi Sebelum**: ID/Username kasir sudah didaftarkan oleh Admin sebelumnya.
* **Kondisi Sesudah**: Sesi POS aktif dengan pengaturan harga dan promosi yang sesuai dengan mode dan cabang yang dipilih.
* **Alur Skenario**:
  1. Kasir membuka aplikasi POS Mobile dan memasukkan Username kasir unik miliknya.
  2. Sistem memvalidasi Username di database server, menampilkan layar konfigurasi terminal.
  3. Kasir memilih cabang toko/event (`id_cabang`) dan mode penjualan (`id_sales`) dari dropdown menu.
  4. Kasir memasukkan nominal modal awal uang fisik laci (`modal_awal`).
  5. Kasir menekan tombol "Mulai Sesi POS".
  6. Sistem mengunci konfigurasi harga (`menu_template`) dan promo aktif, membuat baris sesi shift (`shift_session`) baru dengan status `OPEN`, dan membuka halaman utama transaksi kasir.

#### 2. Use Case: Melakukan Transaksi Penjualan (Memilih Menu & Generate Struk)
* **Aktor Utama**: Kasir
* **Tujuan**: Melayani transaksi produk event oleh pelanggan dan mencetak struk bukti pembayaran.
* **Kondisi Sebelum**: Kasir sudah menyelesaikan proses inisialisasi/login POS dan shift berstatus `OPEN`.
* **Kondisi Sesudah**: Transaksi tersimpan ke database backend dan struk thermal berhasil dicetak.
* **Alur Skenario**:
  1. Kasir memilih menu item dan kuantitas pesanan pelanggan di layar POS.
  2. Sistem membuat draf transaksi secara otomatis di database lokal, menghitung harga item dari `menu_template` cabang/sales mode, mengaplikasikan promosi aktif (diskon/potongan/free item), menghitung pajak (`tax`), dan mengakumulasi total akhir (`total`).
  3. Kasir menanyakan metode pembayaran pelanggan, lalu memilih opsi pembayaran tunai/non-tunai.
  4. Kasir menekan tombol "Generate Struk".
  5. Sistem memproses pembayaran, mengeset status transaksi menjadi `Success` (jika non-tunai menunggu webhook payment gateway berstatus `SETTLEMENT`), menyimpan data permanen ke server database, dan mengirimkan perintah cetak struk ke printer thermal Bluetooth.

#### 3. Use Case: Registrasi Akun Admin
* **Aktor Utama**: Admin (Admin lama yang sudah login)
* **Tujuan**: Membuat akun admin baru untuk mengelola operasional sistem melalui Web Dashboard.
* **Kondisi Sebelum**: Admin lama sudah berhasil masuk (login) ke Web Dashboard dan mengakses menu Kelola Admin.
* **Kondisi Sesudah**: Akun admin baru terdaftar dengan aman di database pusat.
* **Alur Skenario**:
  1. Admin lama membuka menu "Kelola Admin" pada Web Dashboard.
  2. Admin lama menekan tombol "Tambah Admin" untuk membuka form registrasi admin baru.
  3. Admin lama mengisi formulir data nama lengkap, username, dan password untuk admin baru.
  4. Admin lama menekan tombol "Simpan Data".
  5. Sistem mengenkripsi (hashing) password admin baru, menyimpan data baru ke tabel `user` di database server, dan menampilkan notifikasi sukses pada halaman.

#### 4. Use Case: Login Akun Admin
* **Aktor Utama**: Admin
* **Tujuan**: Memvalidasi hak akses penuh admin ke dalam dashboard manajemen.
* **Kondisi Sebelum**: Admin sudah memiliki akun terdaftar di sistem.
* **Kondisi Sesudah**: Admin diarahkan masuk ke dashboard kontrol utama dengan hak akses CRUD penuh.
* **Alur Skenario**:
  1. Admin membuka halaman login pada web admin.
  2. Admin memasukkan username dan password.
  3. Admin menekan tombol "Login".
  4. Sistem memverifikasi kecocokan username dan hash kata sandi di database, lalu membuka akses masuk ke dashboard utama admin.

#### 5. Use Case: Kelola Menu
* **Aktor Utama**: Admin
* **Tujuan**: Mengelola data master menu (kategori, sub-kategori, menu, dan template harga cabang/sales mode).
* **Kondisi Sebelum**: Admin sudah berhasil login ke web dashboard.
* **Kondisi Sesudah**: Perubahan data menu dan template harga tersimpan di database pusat.
* **Alur Skenario**:
  1. Admin memilih menu "Kelola Menu" pada dashboard.
  2. Sistem menampilkan daftar seluruh menu produk beserta variasi harga cabang (`menu_template`).
  3. Admin melakukan aksi CRUD (Tambah menu, kategori, sub-kategori baru, ubah nama, atau sesuaikan harga cabang).
  4. Admin menekan tombol "Simpan".
  5. Sistem memperbarui baris data pada tabel `menu` atau `menu_template` di database server dan memperbarui katalog menu kasir.

#### 6. Use Case: Kelola Kasir
* **Aktor Utama**: Admin
* **Tujuan**: Mengelola akun kasir lapangan agar kasir memiliki username resmi untuk login.
* **Kondisi Sebelum**: Admin sudah login ke dashboard manajemen.
* **Kondisi Sesudah**: Perubahan data kasir (tambah baru, edit profil/cabang asal, atau nonaktifkan akun) tersimpan di database.
* **Alur Skenario**:
  1. Admin memilih menu "Kelola Kasir" pada dashboard.
  2. Sistem menampilkan daftar kasir beserta status aktif dan cabang tempat bertugas (`id_cabang` nullable).
  3. Admin melakukan CRUD (Menambah kasir dengan membuatkan username unik, menyunting cabang asal, atau mengubah status aktif akun).
  4. Admin menekan tombol "Simpan".
  5. Sistem memvalidasi keunikan username kasir, menyimpan data ke database server, dan menampilkan notifikasi sukses.

#### 7. Use Case: Kelola Transaksi
* **Aktor Utama**: Admin
* **Tujuan**: Memantau, meninjau detail, dan mengelola status seluruh riwayat transaksi finansial event.
* **Kondisi Sebelum**: Admin sudah login ke dashboard web dan kasir telah memproses transaksi di lapangan.
* **Kondisi Sesudah**: Admin mendapatkan transparansi data penjualan, dapat meninjau log audit pembatalan, serta melakukan penyesuaian status jika terjadi kendala.
* **Alur Skenario**:
  1. Admin memilih menu "Kelola Transaksi" pada dashboard.
  2. Sistem menampilkan tabel seluruh riwayat transaksi (status `Success`, `Cancelled`, `Void`) beserta filter cabang/event/kasir.
  3. Admin memilih baris transaksi untuk meninjau item yang dibeli, diskon, pajak, nominal promo, dan metode pembayaran. Jika ada pembatalan, sistem menampilkan status `CANCELLED` atau item `VOID` lengkap dengan nama kasir, waktu, dan alasan pembatalan.
  4. Admin dapat melakukan tindakan koreksi manual (jika ada laporan kendala laci/terminal), menekan tombol "Simpan".
  5. Sistem memperbarui log transaksi, mencatat log audit admin (`diperbaharui_oleh` dan `catatan_koreksi`) demi transparansi akuntansi ganda.

#### 8. Use Case: Generate Laporan
* **Aktor Utama**: Admin
* **Tujuan**: Menghasilkan rekapitulasi data omzet dan statistik penjualan transaksi event.
* **Kondisi Sebelum**: Admin sudah masuk ke halaman manajemen laporan di web dashboard.
* **Kondisi Sesudah**: Dokumen laporan periodik/event siap diunduh.
* **Alur Skenario**:
  1. Admin memilih menu "Generate Laporan" pada dashboard.
  2. Admin menentukan filter jenis laporan (Bulanan, Tahunan, atau Per Event/Cabang).
  3. Admin menekan tombol "Generate Laporan".
  4. Sistem melakukan kueri agregasi data transaksi finansial dari database berdasarkan filter, merender bagan ringkasan total omzet, sebaran metode pembayaran, dan menu terlaris.
  5. Admin menekan tombol "Cetak / Ekspor Laporan" untuk mengunduh berkas PDF/Excel.

#### 9. Use Case: Kelola Shift Kasir
* **Aktor Utama**: Kasir
* **Tujuan**: Membuka sesi kerja (Opening) dengan mengunci modal awal dan menutup sesi (Closing) untuk rekonsiliasi uang fisik di akhir shift.
* **Kondisi Sebelum**: Kasir sudah login dengan ID kasir yang valid.
* **Kondisi Sesudah**: Sesi shift tercatat (aktif/selesai) dan selisih uang terhitung secara otomatis.
* **Alur Skenario (Opening)**:
  1. Kasir membuka menu Shift, memasukkan nominal Modal Awal.
  2. Kasir menekan tombol "Buka Shift".
  3. Sistem membuat baris data `shift_session` baru dengan status `'OPEN'` dan mencatat waktu mulai.
* **Alur Skenario (Closing)**:
  1. Kasir membuka menu Shift di akhir jam kerja, menghitung dan menginput total Uang Fisik yang ada di laci.
  2. Kasir menekan tombol "Tutup Shift / Closing".
  3. Sistem menghitung total transaksi yang berjalan selama shift kasir tersebut.
  4. Sistem mengubah status shift menjadi `'CLOSED'`, mencatat waktu selesai, menghitung perbedaan antara kalkulasi sistem dengan uang fisik kasir, dan mengunci nominalnya pada kolom `selisih_uang` untuk audit.

#### 10. Use Case: Jeda Sesi/Switch User
* **Aktor Utama**: Kasir
* **Tujuan**: Mengalihkan akses APK POS secara sementara waktu (saat jam istirahat) tanpa menutup (closing) sesi shift kasir utama yang sedang berjalan.
* **Kondisi Sebelum**: Kasir Pagi memiliki sesi shift aktif (`status_shift = 'OPEN'`) yang sedang terbuka.
* **Kondisi Sesudah**: Pengguna aplikasi berganti menjadi Kasir Siang (sebagai operator aktif), dan pencatatan transaksi berikutnya ditandai dengan operator aktif Kasir Siang di dalam shift utama Kasir Pagi.
* **Alur Skenario**:
  1. Kasir Pagi ingin pergi istirahat dan menekan tombol "Jeda Sesi / Switch Kasir".
  2. Sistem mengunci layar transaksi aktif Kasir Pagi, mengubah `status_shift` di backend menjadi `'ON_BREAK'`, mengeset `id_user_aktif` menjadi `NULL`, dan menampilkan pop-up login cepat.
  3. Kasir Siang (pengganti) memasukkan Username miliknya untuk mengambil alih terminal.
  4. Sistem memverifikasi ID Kasir Siang, mengubah `status_shift` kembali menjadi `'OPEN'`, dan mengeset `id_user_aktif` menjadi `ID Kasir Siang` tanpa menutup/mengubah status shift utama Kasir Pagi di database (`shift_session.id_user` tetap Kasir Pagi).
  5. Setiap transaksi yang diproses mulai detik ini akan dicatat dengan `transaksi.id_user = ID Kasir Siang` dan `transaksi.id_shift = ID Shift Kasir Pagi`.
  6. Ketika istirahat selesai, Kasir Pagi kembali dan mengulangi proses login cepat untuk mengambil alih kembali operator aktif terminal (`id_user_aktif` dikembalikan ke Kasir Pagi).

#### 11. Use Case: Membatalkan Pemesanan
* **Aktor Utama**: Kasir
* **Tujuan**: Membatalkan sebagian item belanjaan (Void) atau membatalkan seluruh transaksi secara utuh (Cancelled) atas permintaan pelanggan sebelum/saat transaksi diproses.
* **Kondisi Sebelum**: Kasir sedang berada di halaman keranjang belanja/pemilihan menu yang aktif.
* **Kondisi Sesudah**: Pembatalan tersimpan sebagai log audit di database server untuk mencegah fraud finansial.
* **Alur Skenario (Pembatalan Sebagian Item - Void)**:
  1. Kasir memilih opsi "Hapus/Kurangi Item" pada item tertentu di daftar keranjang belanja.
  2. Sistem meminta kasir memasukkan alasan pembatalan item.
  3. Kasir mengisi teks alasan dan menekan tombol "Konfirmasi Batal Item".
  4. Sistem memperbarui flag `status_item` menjadi `'Void'`, menyimpan alasan pada kolom `alasan_batal_item` di database `transaksi_detail`, dan menghitung ulang total belanjaan.
* **Alur Skenario (Pembatalan Transaksi Utuh - Cancelled)**:
  1. Kasir memilih opsi "Batalkan Transaksi / Kosongkan Keranjang".
  2. Kasir memasukkan teks alasan pembatalan transaksi secara menyeluruh.
  3. Kasir menekan tombol "Konfirmasi Batal Transaksi".
  4. Sistem memperbarui `status` transaksi utama menjadi `'Cancelled'`, mengisi kolom `alasan_batal` di tabel `transaksi`, dan mengosongkan layar terminal kasir.

### III.3 Class Diagram
Class Diagram mendefinisikan struktur kelas sistem, mencakup atribut, operasi/metode kelas, serta hubungan relasi asosiasi dan pewarisan antar kelas objek sistem.
Diagram ini dapat diakses pada berkas: [Class Diagram.png](file:///D:/Kuliah/Semester%207/KP/Point-Of-Sale-App/Dokumen/Class%20Diagram.png).

### III.4 Sequence Diagram
Sequence Diagram menggambarkan interaksi antar objek sistem dalam urutan waktu tertentu berdasarkan skenario Use Case kasir dan admin.
Seluruh diagram sekuensial tersimpan dalam folder: [Sequence](file:///D:/Kuliah/Semester%207/KP/Point-Of-Sale-App/Dokumen/Sequence) dengan rincian berkas berikut:
* `Login(Kasir).png` & `Login(Admin).png`
* `OpeningShift(Kasir).png` & `ClosingShift(Kasir).png`
* `KelolaKasir(Admin).png`
* `KelolaMenu(Admin).png`
* `KelolaTransaksi(Admin).png`
* `GenerateLaporan(Admin).png`
* `JedaSesi(Kasir).png`
* `MembatalkanPesanan(Kasir).png`
* `Registerasi(Admin).png`
* `Menu(Kasir).png`

### III.5 Activity Diagram
Activity Diagram memodelkan alur kerja (workflow) langkah demi langkah dari aktivitas operasional yang berjalan dalam sistem.
Seluruh diagram aktivitas tersimpan dalam folder: [Activity](file:///D:/Kuliah/Semester%207/KP/Point-Of-Sale-App/Dokumen/Activity) dengan rincian berkas berikut:
* `Login(Kasir).png` & `Login(Admin).png`
* `KelolaShift(Kasir).png`
* `KelolaKasir(Admin).png`
* `KelolaMenu(Admin).png`
* `KelolaTransaksi(Admin).png`
* `GenerateLaporan(Admin).png`
* `JedaSesi(Kasir).png`
* `MembatalkanPesanan(Kasir).png`
* `Registrasi(Admin).png`
* `TransaksiPenjualan(Kasir).png`

### III.6 State Diagram
State Diagram mendeskripsikan transisi perubahan status siklus hidup (*lifecycle*) entitas penting di dalam sistem:
1. **Siklus Shift Session Kasir**: Menggambarkan transisi shift dari status `OPEN` $\rightarrow$ `ON_BREAK` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED`.
2. **Siklus Transaksi**: Menggambarkan transisi status nota dari `Draft` $\rightarrow$ `Pending` (khusus pembayaran digital non-tunai) $\rightarrow$ `Success` / `Cancelled` / `Void`.

Diagram ini dapat diakses pada berkas: [State Diagram](file:///D:/Kuliah/Semester%207/KP/Point-Of-Sale-App/Dokumen/State%20Diagram).

### III.7 Deployment Diagram
Deployment Diagram menggambarkan arsitektur fisik penyebaran perangkat lunak pada node-node perangkat keras sistem POS Event. Arsitektur ini menggunakan model multi-platform:
* **Web Client (Admin)**: Mengakses dashboard backend via browser dengan protokol HTTPS.
* **Mobile Client (Kasir APK)**: Berjalan di perangkat mobile Android/iOS, terhubung ke server backend melalui RESTful API, dan terhubung ke Printer Thermal menggunakan koneksi nirkabel Bluetooth.
* **Application Server (Laravel Backend)**: Menangani logika server, integrasi API Payment Gateway, dan Webhook callback.
* **Database Server (MySQL)**: Menyimpan basis data terpusat secara aman.

Diagram ini dapat diakses pada berkas: [Deployment Diagram.png](file:///D:/Kuliah/Semester%207/KP/Point-Of-Sale-App/Dokumen/Deployment%20Diagram.png).

---

## Bab IV Desain Data

### IV.1 Logical Design (ERD)
Desain logis menggambarkan entitas-entitas basis data beserta hubungan relasi kardinalitas (*one-to-many*, *one-to-one*) antar entitas. Seluruh rancangan kunci utama (PK) dan kunci asing (FK) didesain untuk mendukung desentralisasi offline dengan tipe UUID v4.
Diagram ERD dapat diakses pada berkas: [ERD.png](file:///D:/Kuliah/Semester%207/KP/Point-Of-Sale-App/Dokumen/ERD.png).

### IV.2 Physical Design (Spesifikasi Tabel)
Berikut adalah struktur fisik 14 tabel basis data MySQL yang telah disinkronkan secara penuh:

#### Tabel 4.1 - Spesifikasi Tabel `role_user`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_role** | CHAR(36) | PK | NOT NULL | ID unik role berupa UUID v4. |
| **nama_role** | VARCHAR(50) | - | NOT NULL | Nama hak akses (Contoh: 'Admin', 'Kasir'). |

#### Tabel 4.2 - Spesifikasi Tabel `cabang`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_cabang** | CHAR(36) | PK | NOT NULL | ID unik cabang berupa UUID v4. |
| **pajak_persen** | DECIMAL(5,2) | - | DEFAULT 0.00 | Persentase tarif pajak regional/event cabang untuk kalkulasi offline di APK. |
| **nama_cabang** | VARCHAR(100) | - | NOT NULL | Nama fisik cabang toko atau nama event. |
| **lokasi** | TEXT | - | NOT NULL | Alamat atau titik lokasi cabang berada. |

#### Tabel 4.3 - Spesifikasi Tabel `user`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_user** | CHAR(36) | PK | NOT NULL | ID unik user berupa UUID v4. |
| **id_role** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_role` di tabel `role_user`. |
| **id_cabang** | CHAR(36) | FK | NULLABLE | Cabang Asal/Default penugasan kasir (NULL jika admin pusat). |
| **username** | VARCHAR(50) | - | NOT NULL, UNIQUE | Identitas unik user. Login APK kasir (tanpa password) atau Web (dengan password). |
| **password_hash** | VARCHAR(255) | - | NULLABLE | Hash kata sandi. Wajib bagi Admin web, WAJIB NULL bagi Kasir APK. |
| **nama_user** | VARCHAR(100) | - | NOT NULL | Nama lengkap kasir atau admin. |
| **status_aktif** | BOOLEAN | - | DEFAULT TRUE | Menandakan keaktifan akun user di sistem. |

#### Tabel 4.4 - Spesifikasi Tabel `kategori`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_kategori** | CHAR(36) | PK | NOT NULL | ID unik kategori produk berupa UUID v4. |
| **nama_kategori** | VARCHAR(100) | - | NOT NULL | Nama kategori produk (contoh: 'Signature', 'Single Origin'). |

#### Tabel 4.5 - Spesifikasi Tabel `sub_kategori`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_sub_kategori** | CHAR(36) | PK | NOT NULL | ID unik sub_kategori produk berupa UUID v4. |
| **id_kategori** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_kategori` di tabel `kategori`. |
| **nama_sub_kategori** | VARCHAR(100) | - | NOT NULL | Nama sub_kategori (contoh: '100%', '77%'). |

#### Tabel 4.6 - Spesifikasi Tabel `menu`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_menu** | CHAR(36) | PK | NOT NULL | ID unik menu produk berupa UUID v4. |
| **id_sub_kategori**| CHAR(36) | FK | NOT NULL | Merujuk ke `id_sub_kategori` di tabel `sub_kategori`. |
| **nama_menu** | VARCHAR(150) | - | NOT NULL | Nama produk menu. |

#### Tabel 4.7 - Spesifikasi Tabel `sales_mode`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_sales** | CHAR(36) | PK | NOT NULL | ID unik mode penjualan berupa UUID v4. |
| **nama_mode** | VARCHAR(50) | - | NOT NULL | Nama channel (contoh: 'Offline', 'GoFood', 'GrabFood'). |

#### Tabel 4.8 - Spesifikasi Tabel `menu_template`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_template** | CHAR(36) | PK | NOT NULL | ID unik template variasi harga berupa UUID v4. |
| **id_menu** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_menu` di tabel `menu`. |
| **id_cabang** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_cabang` di tabel `cabang`. |
| **id_sales** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_sales` di tabel `sales_mode`. |
| **harga_produk** | DECIMAL(12,2) | - | NOT NULL | Nominal harga jual spesifik per cabang dan per sales mode. |

#### Tabel 4.9 - Spesifikasi Tabel `promosi`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_promo** | CHAR(36) | PK | NOT NULL | ID unik promo berupa UUID v4. |
| **id_cabang** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_cabang` di tabel `cabang`. |
| **nama_promo** | VARCHAR(100) | - | NOT NULL | Nama promosi aktif yang sedang berjalan. |
| **tipe_promo** | ENUM('Nominal','Persen')| - | NOT NULL | Jenis pemotongan harga (angka tetap / %). |
| **cakupan_promo** | ENUM('Per Transaksi','Per Item','Free Item')| - | NOT NULL | Ruang lingkup target pengaplikasian promo. |
| **nilai_promo** | DECIMAL(12,2) | - | NULLABLE | Potongan diskon (NULL jika bertipe 'Free Item'). |
| **id_menu_free** | CHAR(36) | FK | NULLABLE | Merujuk ke `id_menu` (hadiah menu gratis jika cakupan 'Free Item'). |

#### Tabel 4.10 - Spesifikasi Tabel `metode_pembayaran`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_metode** | CHAR(36) | PK | NOT NULL | ID unik jenis pembayaran berupa UUID v4. |
| **nama_metode** | VARCHAR(50) | - | NOT NULL | Nama opsi pembayaran (contoh: 'Cash', 'QRIS', 'Mandiri'). |
| **kategori_metode**| VARCHAR(50) | - | NOT NULL | Pengelompokan metode (contoh: 'Tunai', 'QRIS', 'VA'). |
| **vendor_gateway** | VARCHAR(50) | - | NULLABLE | Penyedia payment gateway (Midtrans/Xendit/Direct). NULL jika tunai. |

#### Tabel 4.11 - Spesifikasi Tabel `transaksi`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_transaksi** | CHAR(36) | PK | NOT NULL | ID unik nota transaksi penjualan berupa UUID v4. |
| **id_sales** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_sales` di tabel `sales_mode`. |
| **id_cabang** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_cabang` di tabel `cabang`. |
| **id_user** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_user` kasir pembuat/operator transaksi. |
| **id_metode** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_metode` di tabel `metode_pembayaran`. |
| **id_shift** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_shift` sesi shift terminal kasir berjalan. |
| **id_promo** | CHAR(36) | FK | NULLABLE | Merujuk ke `id_promo` (jika menggunakan promo tingkat transaksi). |
| **tanggal_transaksi**| DATE | - | NOT NULL | Tanggal saat transaksi penjualan berhasil tercatat. |
| **jam_transaksi** | TIME | - | NOT NULL | Waktu/jam presisi saat struk di-generate. |
| **nama_pelanggan** | VARCHAR(100) | - | NULLABLE | Nama customer pembeli produk event (opsional). |
| **total** | DECIMAL(12,2) | - | NOT NULL | Nilai bersih akhir uang yang wajib dibayar pelanggan. |
| **tax** | DECIMAL(12,2) | - | NOT NULL | Nominal komponen biaya pajak event yang dibebankan. |
| **status** | ENUM('Draft','Pending','Success','Void','Cancelled') | - | DEFAULT 'Draft' | Status validitas log transaksi. |
| **alasan_batal** | TEXT | - | NULLABLE | Catatan alasan jika transaksi dibatalkan (`Cancelled`). |
| **diperbaharui_oleh**| CHAR(36) | FK | NULLABLE | Merujuk ke `id_user` (Admin) yang melakukan koreksi manual. |
| **catatan_koreksi** | TEXT | - | NULLABLE | Catatan riwayat penyesuaian/koreksi data yang diinput oleh Admin. |
| **nominal_promo** | DECIMAL(12,2) | - | DEFAULT 0.00 | Nilai nominal pemotongan diskon tingkat transaksi. |

#### Tabel 4.12 - Spesifikasi Tabel `transaksi_detail`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_transaksi_detail**| CHAR(36) | PK | NOT NULL | ID unik baris item belanja berupa UUID v4. |
| **id_transaksi** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_transaksi` di tabel `transaksi`. |
| **id_produk** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_menu` di tabel `menu`. |
| **harga_produk** | DECIMAL(12,2) | - | NOT NULL | Harga satuan produk saat dibeli berdasarkan template cabang/sales. |
| **quantity** | INT | - | NOT NULL | Jumlah item produk yang dibeli pelanggan. |
| **id_promo** | CHAR(36) | FK | NULLABLE | Merujuk ke `id_promo` jika ada promo spesifik per item. |
| **nominal_promo** | DECIMAL(12,2) | - | DEFAULT 0.00 | Total potongan diskon tingkat item yang didapatkan. |
| **subtotal_item** | DECIMAL(12,2) | - | NOT NULL | Total harga bersih item per baris ( (Harga * Qty) - Diskon ). |
| **status_item** | ENUM('Active','Void')| - | DEFAULT 'Active' | Status keaktifan item (digunakan untuk pembatalan item `Void`). |
| **alasan_batal_item**| TEXT | - | NULLABLE | Alasan spesifik mengapa item menu ini di-void. |

#### Tabel 4.13 - Spesifikasi Tabel `detail_pembayaran_non_tunai`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_detail_bayar**| CHAR(36) | PK | NOT NULL | ID unik log pembayaran non-tunai berupa UUID v4. |
| **id_transaksi** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_transaksi` di tabel `transaksi`. |
| **payment_gateway_id**| VARCHAR(100)| - | NOT NULL | ID transaksi resmi dari vendor payment gateway (Midtrans/Xendit). |
| **reference_number**| VARCHAR(100) | - | NULLABLE | Nomor referensi bank / Retrieval Reference Number (RRN). |
| **qr_string_data** | TEXT | - | NULLABLE | Data teks mentah QRIS dari vendor untuk di-render menjadi QR. |
| **va_number** | VARCHAR(50) | - | NULLABLE | Nomor Virtual Account transfer bank (jika menggunakan VA). |
| **status_api** | ENUM('PENDING','SETTLEMENT','EXPIRED','DENIED')| - | DEFAULT 'PENDING' | Status pembayaran realtime dari server payment gateway. |
| **waktu_kedaluwarsa**| DATETIME | - | NOT NULL | Batas waktu akhir pembayaran sebelum QRIS/VA expired. |
| **raw_callback_payload**| JSON | - | NULLABLE | Log mentah JSON Webhook callback untuk audit log finansial. |

#### Tabel 4.14 - Spesifikasi Tabel `shift_session`
| Nama Kolom | Tipe Data | Kunci | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **id_shift** | CHAR(36) | PK | NOT NULL | ID unik sesi shift kerja terminal kasir berupa UUID v4. |
| **id_user** | CHAR(36) | FK | NOT NULL | ID Kasir yang membuka shift (penanggung jawab utama laci uang). |
| **id_user_aktif** | CHAR(36) | FK | NULLABLE | ID Kasir yang saat ini aktif mengoperasikan terminal (mendukung jeda). |
| **id_cabang** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_cabang` tempat ditugaskan saat shift berjalan. |
| **id_sales** | CHAR(36) | FK | NOT NULL | Merujuk ke `id_sales` channel aktif pada terminal untuk shift ini. |
| **waktu_mulai** | DATETIME | - | NOT NULL | Waktu presisi kasir melakukan *Opening Shift*. |
| **waktu_selesai** | DATETIME | - | NULLABLE | Waktu presisi kasir melakukan *Closing Shift* (NULL saat berjalan). |
| **modal_awal** | DECIMAL(12,2) | - | NOT NULL | Nominal modal awal di laci uang kasir saat Opening. |
| **uang_fisik_akhir**| DECIMAL(12,2) | - | NULLABLE | Total fisik uang akhir di laci kasir saat Closing. |
| **status_shift** | ENUM('OPEN','ON_BREAK','CLOSED')| - | DEFAULT 'OPEN' | Status operasional shift kasir. |
| **selisih_uang** | DECIMAL(12,2) | - | DEFAULT 0.00 | Selisih antara perhitungan sistem dengan input fisik uang kasir. |

---

## Bab V Desain Antarmuka Pengguna

### V.1 Aturan Desain Global (Monochrome & Neo-Brutalist)
Seluruh rancangan antarmuka pengguna, baik untuk aplikasi Mobile APK Kasir maupun Web Dashboard Admin, mengikuti aturan gaya visual terpadu berikut untuk memastikan keterbacaan yang tinggi di lingkungan festival yang sibuk dan bising:
* **Skema Warna Monokromatik**: Hanya menggunakan warna hitam murni (`#000000`), putih murni (`#FFFFFF`), abu-abu sangat muda (`#F5F5F5` untuk background/hover), abu-abu sedang (`#999999` untuk border sekunder), dan abu-abu gelap (`#222222`). Dilarang keras menggunakan warna sekunder seperti merah, hijau, biru, atau kuning.
* **Tipografi Modern Geometris**: Menggunakan font sans-serif geometris dan monospace seperti `Space Grotesk`, `JetBrains Mono`, atau `Inter` untuk kejelasan teks UUID/angka transaksi.
* **Karakteristik Neo-Brutalisme**:
  * Ketebalan border hitam kaku (1px atau 2px).
  * Bayangan kaku tanpa blur (*hard shadow* hitam pekat).
  * Sudut elemen tajam dengan `border-radius: 0px` hingga maksimum `4px`.
  * Garis pemisah (*divider*) hitam yang tegas.
* **Indikator Status Tanpa Warna**: Status berhasil, pending, atau gagal diwakili oleh label teks kapital tebal seperti `[SUCCESS]`, `[VOID]`, `[PENDING]`, `[CANCELLED]` dan ikon outline tebal, serta pola border putus-putus (*dashed borders*) untuk elemen non-aktif/void.
* **Interaksi Inversi**: Efek visual hover atau tombol aktif menggunakan pembalikan warna (inversi warna latar hitam menjadi putih, teks putih menjadi hitam).

---

### V.2 Rancangan Antarmuka Mobile APK (Sisi Kasir)
Berikut adalah visualisasi draf antarmuka mobile kasir yang disesuaikan dengan alur kerja operasional:

1. **Halaman Login & Pengaturan Terminal (Opening Shift)**:
   Digunakan untuk mengotentikasi username kasir dan mengunci modal awal, cabang, dan sales mode.
   ![Login Kasir](./Mokup/Login%20(Kasir).png)
   ![Pengaturan Kasir](./Mokup/Pengaturan%20(Kasir).png)

2. **Halaman Katalog POS Utama (Keranjang Belanja)**:
   Grid produk visual yang dinamis dengan pembagian layar split. Sisi kiri menampilkan daftar produk per kategori, dan sisi kanan menampilkan detail keranjang dan akumulasi biaya (subtotal, tax, nominal_promo, total).
   ![Menu Kasir](./Mokup/Menu%20(Kasir).png)

3. **Layar Modal Detail Pembayaran (Tunai vs Non-Tunai QRIS)**:
   Pop-up aksi cepat pembayaran. Pembayaran tunai dilengkapi kalkulator kembalian otomatis, sedangkan pembayaran non-tunai memunculkan placeholder QRIS Dinamis dan status `[PENDING]` (menunggu webhook settlement).
   ![Pembayaran Tunai Kasir](./Mokup/Pembayaran%20Tunai%20(Kasir).png)
   ![Pembayaran Non-Tunai Kasir](./Mokup/Pembayaran%20Non-Tunai%20(Kasir).png)

4. **Layar Jeda Sesi (Switch Kasir / Lock Screen Overlay)**:
   Mengunci layar transaksi dengan status `ON_BREAK` dan membolehkan kasir pengganti melakukan switch user tanpa menutup shift utama.
   ![Switch Kasir](./Mokup/Switch%20(Kasir).png)

5. **Halaman Laporan Penutupan (Closing Shift & Slip Summary)**:
   Formulir input uang fisik akhir kasir, kalkulasi otomatis selisih sistem (`selisih_uang`), cetak slip closing, dan pengubahan status shift menjadi `CLOSED`.
   ![Closing Kasir](./Mokup/Closing%20(Kasir).png)

---

### V.3 Rancangan Antarmuka Web Dashboard (Sisi Admin)
Berikut adalah visualisasi antarmuka kontrol dashboard web untuk sisi manajemen admin:

1. **Halaman Masuk (Login & Lupa Password Admin)**:
   Gerbang otentikasi admin web menggunakan password hashing aman.
   ![Login Admin](./Mokup/Login%20(Admin).png)
   ![Lupa Password Admin](./Mokup/Lupa%20Password%20(Admin).png)

2. **Dashboard Utama & Ringkasan Kinerja (Brutalist Grid)**:
   Card statistik ringkasan omzet, volume transaksi, persentase QRIS vs Tunai, audit selisih kasir, chart tren penjualan, serta tabel menu kuliner terlaris.
   ![Dashboard Admin](./Mokup/Dashboard%20(Admin).png)

3. **Halaman Kelola Data Menu, Cabang, & Template Harga**:
   CRUD master produk menu, sub-kategori, penyesuaian harga template per cabang (`menu_template`), dan manajemen program diskon aktif (`promosi`).
   ![Kelola Menu Admin](./Mokup/Kelola%20Menu%20(Admin).png)

4. **Halaman Kelola Akun Pengguna (Kasir & Admin)**:
   CRUD pembuatan akun admin sistem baru serta manajemen user kasir lapangan (termasuk penugasan cabang default/asal kasir).
   ![Kelola Admin Admin](./Mokup/Kelola%20Admin%20(Admin).png)
   ![Kelola Kasir Admin](./Mokup/Kelola%20Kasir%20(Admin).png)

5. **Manajemen Transaksi & Audit Log (Void / Cancelled)**:
   Daftar log audit riwayat transaksi. Transaksi bermasalah (`Cancelled`/`Void`) ditandai dengan border putus-putus tebal dan teks alasan pembatalan kasir. Dilengkapi kolom aksi koreksi manual untuk Admin.
   ![Riwayat Transaksi Admin](./Mokup/Riwayat%20Transaksi%20(Admin).png)

6. **Halaman Laporan Keuangan (Generate & Ekspor Laporan)**:
   Filter laporan harian, bulanan, atau per event cabang ditugaskan. Dilengkapi tombol ekspor cepat ke dokumen digital PDF dan Excel (XLSX).
   ![Generate Laporan Admin](./Mokup/Generate%20Laporan%20(Admin).png)

---

## Bab VI Kebutuhan Antarmuka Eksternal

### VI.1 Antarmuka Pengguna (User Interface)
Sistem POS Event menggunakan antarmuka grafis (GUI) yang responsif:
* **Web Admin (Dashboard)**: Dibuat menggunakan HTML5, CSS3, dan framework JavaScript yang dirender di browser modern (Google Chrome, Mozilla Firefox) dan dikelola oleh Laravel.
* **Mobile Kasir (APK)**: Dibuat menggunakan framework mobile cross-platform **React Native** untuk render lancar pada perangkat layar sentuh Android minimum versi 8.0 (Oreo) dengan orientasi portrait/landscape.
* **Tema Gaya**: Monochrome & Neo-Brutalist untuk kemudahan pembacaan yang optimal.

### VI.2 Antarmuka Perangkat Keras (Hardware Interface)
Perangkat keras eksternal yang dihubungkan ke sistem meliputi:
1. **Smartphone/Tablet Kasir**: Perangkat mobile dengan layar sentuh (min. 5.5 inci), memori RAM min 3GB, kamera (opsional untuk QR scanning), koneksi Wi-Fi/Seluler, dan Bluetooth.
2. **Printer Thermal Bluetooth**: Printer thermal mobile ukuran kertas 58mm/80mm yang dihubungkan secara nirkabel dengan perangkat mobile kasir menggunakan Bluetooth SPP profile.
3. **PC/Laptop Admin**: Komputer desktop untuk admin mengoperasikan dashboard web administrasi.

### VI.3 Antarmuka Perangkat Lunak (Software Interface)
Spesifikasi perangkat lunak pendukung Sistem POS Event:

| Komponen | Versi Minimum | Fungsi |
| :--- | :--- | :--- |
| **Web Browser** | Google Chrome v90+, Firefox v88+ | Menjalankan Web Dashboard Admin di sisi klien. |
| **Android OS (Mobile)**| Android 8.0 (Oreo) | Menjalankan aplikasi APK Kasir Digital POS. |
| **Mobile App Framework** | **React Native** v0.72+ | Framework pengembangan aplikasi mobile kasir dengan performa native. |
| **Web Server** | Nginx / Apache (Laragon) | Melayani lalu lintas request HTTP/HTTPS klien. |
| **DBMS** | MySQL v8.0 / MariaDB v10.4 | Menyimpan dan mengelola basis data relasional. |
| **Backend & Web Admin** | PHP v8.2 + Laravel Framework v10 | Mengelola dashboard admin, RESTful API, otentikasi, Eloquent ORM, dan callback webhook. |
| **Printer SDK** | Bluetooth ESC/POS Protocol | Library pengiriman byte array perintah cetak nota kasir. |

### VI.4 Antarmuka Komunikasi (Communication Interface)
Bagian ini mendefinisikan protokol dan standar yang digunakan untuk mengatur pertukaran data antara berbagai komponen arsitektur sistem (sinkron dengan Deployment Diagram):
* **Protokol Komunikasi Klien-Server**:
  * Seluruh komunikasi antara peramban web pengguna (klien admin), aplikasi mobile kasir (React Native), dan server web (Laravel) menggunakan protokol HTTPS (Hypertext Transfer Protocol Secure) dengan sertifikasi SSL/TLS v1.3 untuk mengenkripsi semua data keuangan dan data kredensial dari penyadapan.
* **Protokol Komunikasi Server Aplikasi ke Basis Data**:
  * Komunikasi antara server Laravel dan server MySQL terjadi di dalam jaringan internal yang aman (private network) menggunakan protokol TCP/IP standar yang didukung oleh DBMS MySQL, diakses secara terenkripsi menggunakan PDO driver pada PHP.
* **Antarmuka Pemrograman Aplikasi (API) Internal**:
  * Komunikasi internal menggunakan RESTful API.
  * **Format Pertukaran Data**: Menggunakan JSON (JavaScript Object Notation) untuk semua payload request-response.
  * **Autentikasi API**: Menggunakan Bearer Token Authentication (Laravel Sanctum) yang dikirimkan pada header HTTP Authorization untuk memproteksi endpoint privat.
* **Antarmuka Komunikasi dengan Payment Gateway**:
  * Menggunakan RESTful API berbasis HTTPS ke server Midtrans/Xendit untuk request QRIS dinamis.
  * **Webhook Callback**: Menerima HTTPS POST callback dari payment gateway untuk melakukan pembaruan otomatis status transaksi menjadi `Settlement`.
* **Protokol Komunikasi Nirkabel ke Printer**:
  * Menggunakan protokol Bluetooth SPP (Serial Port Profile) nirkabel untuk mentransmisikan byte perintah cetak standard ESC/POS dari aplikasi mobile kasir ke printer thermal 58mm/80mm di lokasi booth.

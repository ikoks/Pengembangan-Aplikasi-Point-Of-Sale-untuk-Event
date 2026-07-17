# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## SISTEM POS EVENT (APLIKASI KASIR DIGITAL EVENT)
**Multi-Platform: Web Dashboard & Mobile APK**

**Penulis:**
[Nama Anda / Tim Pengembang]

**Institusi:**
[Nama Universitas / Program Studi]
2026

---

## Table of Contents
- [Bab I Introduction](#bab-i-introduction)
  - [I.1 Purpose](#i1-purpose)
  - [I.2 Intended Audience and Reading Suggestions](#i2-intended-audience-and-reading-suggestions)
  - [I.3 Project Scope](#i3-project-scope)
  - [I.4 References](#i4-references)
- [Bab II Overall Description](#bab-ii-overall-description)
  - [II.1 Organizations](#ii1-organizations)
  - [II.2 Product Perspective](#ii2-product-perspective)
  - [II.3 User Classes and Characteristics](#ii3-user-classes-and-characteristics)
  - [II.4 Operating Environment](#ii4-operating-environment)
  - [II.5 Design and Implementation Constraints](#ii5-design-and-implementation-constraints)
  - [II.6 Assumptions and Dependencies](#ii6-assumptions-and-dependencies)
- [Bab III Functional Requirements](#bab-iii-functional-requirements)
  - [III.1 Detailed Functional Requirements](#iii1-detailed-functional-requirements)
  - [III.2 Use Case Diagram](#iii2-use-case-diagram)
  - [III.3 Use Case Scenario](#iii3-use-case-scenario)
- [Bab IV Non Functional Requirements](#bab-iv-non-functional-requirements)
  - [IV.1 Performance Requirements](#iv1-performance-requirements)
  - [IV.2 Safety Requirements](#iv2-safety-requirements)
  - [IV.3 Software Quality Attributes](#iv3-software-quality-attributes)
- [Bab V Data Requirements](#bab-v-data-requirements)
  - [V.1 Input](#v1-input)
  - [V.2 Output](#v2-output)
- [Bab VI Interface Requirements](#bab-vi-interface-requirements)
  - [VI.1 User Interface](#vi1-user-interface)
  - [VI.2 Hardware Interface](#vi2-hardware-interface)
  - [VI.3 Software Interface](#vi3-software-interface)
  - [VI.4 Communication Interface](#vi4-communication-interface)

---

## Bab I Introduction

### I.1 Purpose
Dokumen *Software Requirements Specification* (SRS) ini disusun untuk memberikan spesifikasi kebutuhan perangkat lunak secara formal bagi pengembangan **Sistem POS Event** (Aplikasi Kasir Digital Event). Dokumen ini mendokumentasikan seluruh kebutuhan fungsional (seperti skenario transaksi, pembukaan shift, dan audit log finansial) dan kebutuhan non-fungsional (keandalan offline, performa sinkronisasi, dan kompatibilitas portabilitas) sebagai basis acuan bagi tim pengembang (*programmer*), tim penguji (*QA*), serta pemangku kepentingan (*stakeholder*) selama masa siklus pengembangan perangkat lunak.

### I.2 Intended Audience and Reading Suggestions
Dokumen ini ditujukan untuk dibaca oleh:
1. **Tim Pengembang Perangkat Lunak**: Sebagai acuan utama dalam mengimplementasikan fungsionalitas program dan melakukan pemetaan basis data terintegrasi.
2. **Tim Quality Assurance (QA)**: Sebagai dasar penyusunan skenario uji (*test case*) untuk memvalidasi fungsionalitas kasir dan admin.
3. **Manajer Proyek**: Sebagai alat ukur kemajuan proyek dan pengelolaan alokasi sumber daya.
4. **Stakeholder / Penyelenggara Event**: Untuk memahami kapabilitas operasional dan fitur keamanan finansial yang disediakan sistem.

**Saran Membaca**: Tim pengembang disarankan langsung membaca Bab III (Kebutuhan Fungsional) dan Bab V (Kebutuhan Data), sedangkan Manajer Proyek dan Stakeholder dapat fokus pada Bab I dan Bab II untuk gambaran umum.

### I.3 Project Scope
Sistem POS Event adalah solusi kasir digital multi-platform yang dirancang untuk menangani transaksi penjualan produk (makanan, minuman, dan merchandise) di area festival dengan mobilitas tinggi. Lingkup utama sistem meliputi:
* **Mobile APK Kasir**: Aplikasi Android kasir dengan pendekatan *offline-first* untuk melakukan inisialisasi sesi shift, penginputan keranjang belanja luring, penarikan harga otomatis dari `menu_template` regional, validasi program diskon otomatis (`promosi`), pemrosesan pembayaran (tunai luring & non-tunai online QRIS via Payment Gateway), jeda sesi kasir (*switch operator*), serta pencetakan struk menggunakan printer Bluetooth thermal.
* **Web Dashboard Admin**: Aplikasi berbasis web untuk registrasi/login admin, pengelolaan master data (cabang, menu, sales mode, promosi, kasir), pemantauan log audit keamanan finansial (transaksi cancelled & item void), tindakan koreksi manual, serta pembuatan laporan keuangan bulanan/event.
* **Desentralisasi Data**: Pemanfaatan **UUID v4 (CHAR(36))** pada seluruh ID operasional transaksi sehingga mobile kasir di lapangan dapat menciptakan ID transaksi yang unik secara mandiri saat offline tanpa risiko bentrok data dengan terminal lain ketika internet kembali terhubung.

### I.4 References
1. Fajri Rahmat Umbara. (2025). *Modul Praktikum Analisis dan Perancangan Perangkat Lunak*. Laboratorium Informatika UNJANI.
2. Standar Spesifikasi Internasional RFC 4122 untuk pengalokasi UUID.
3. API Reference Payment Gateway Integration (Midtrans / Xendit).

---

## Bab II Overall Description

### II.1 Organizations
Sistem ini dioperasikan oleh organisasi/panitia penyelenggara festival atau merchant kuliner yang memiliki struktur kepanitiaan:
* **Super-Admin / Admin**: Bertanggung jawab menetapkan parameter event, cabang fisik, sales mode yang aktif, harga jual regional, akun kasir yang bertugas, serta mengawasi log audit keuangan.
* **Kasir Lapangan**: Bertugas melayani transaksi pemesanan langsung dari pelanggan di terminal kasir masing-masing.

### II.2 Product Perspective
Sistem POS Event menggunakan arsitektur multi-platform terdistribusi:
* Sisi depan mobile kasir (Android APK) bertindak sebagai klien mandiri yang memiliki database lokal untuk menyimpan transaksi sementara saat offline.
* Klien mobile terhubung secara langsung (*real-time/semi real-time*) ke server backend terpusat menggunakan protokol HTTPS RESTful API saat online.
* Server Backend (Laravel) bertindak sebagai koordinator integrasi API Payment Gateway (Midtrans/Xendit) untuk penanganan QRIS dinamis dan penerimaan callback Webhook status pembayaran.

### II.3 User Classes and Characteristics
1. **Kasir (Mobile APK)**:
   * **Karakteristik**: Memiliki mobilitas tinggi, membutuhkan kecepatan transaksi tinggi, masuk ke aplikasi cukup menggunakan Username unik (tanpa password) agar mempercepat *switch user* di lapangan saat jam sibuk festival.
   * **Hak Akses**: Membuka/menutup shift, menginput pesanan keranjang, memproses pembayaran, menjeda sesi, membatalkan transaksi/item pesanan (void/cancel).
2. **Admin (Web Dashboard)**:
   * **Karakteristik**: Mengoperasikan sistem melalui komputer/PC, membutuhkan analisis keuangan yang komprehensif, masuk menggunakan username dan sandi aman.
   * **Hak Akses**: Mengelola seluruh data master, melihat riwayat audit log finansial, melakukan koreksi manual transaksi paska-event, dan mengekspor laporan omzet.

### II.4 Operating Environment
* **Sisi Klien Mobile**: Perangkat smartphone/tablet Android min. OS 8.0 (Oreo) dengan RAM min. 3GB dan konektivitas Bluetooth.
* **Sisi Klien Web**: PC/Laptop dengan browser modern (Google Chrome, Firefox) terkoneksi internet.
* **Sisi Server**: Apache/Nginx (Laragon/Linux Environment), PHP v8.2, DBMS MySQL v8.0.

### II.5 Design and Implementation Constraints
* Sistem harus mengadopsi gaya visual **Monochrome & Neo-Brutalist** (Hanya menggunakan warna hitam, putih, abu-abu dengan garis border hitam tebal, tanpa warna lain) untuk kontras tinggi dan kemudahan pembacaan.
* Penyimpanan data offline-first harus diamankan pada database lokal klien mobile sebelum disinkronisasikan ke database pusat.
* Kunci utama tabel operasional wajib menggunakan UUID v4.

### II.6 Assumptions and Dependencies
* Diasumsikan printer thermal Bluetooth kasir selalu dalam kondisi menyala dan terpasang kertas struk thermal.
* Layanan pembayaran digital QRIS sangat bergantung pada ketersediaan API pihak ketiga (Payment Gateway) dan jaringan internet aktif pelanggan saat melakukan pemindaian.

---

## Bab III Functional Requirements

### III.1 Detailed Functional Requirements
Kebutuhan fungsional Sistem POS Event didefinisikan sebagai berikut:

* **FR-01 (Otentikasi Kasir)**: Sistem harus memfasilitasi kasir masuk ke aplikasi mobile cukup dengan menginput Username unik (tanpa password) yang terdaftar di cabang default.
* **FR-02 (Inisialisasi Shift)**: Sistem harus mewajibkan kasir melakukan Opening Shift dengan memilih cabang event ditugaskan, sales mode aktif, dan menginput modal awal sebelum masuk menu utama.
* **FR-03 (Unduh Katalog)**: Sistem harus mengunduh data katalog menu, harga regional (`menu_template`), dan diskon aktif (`promosi`) yang spesifik untuk cabang dan sales mode terpilih.
* **FR-04 (Pencatatan Keranjang)**: Sistem harus mencatat transaksi pemesanan dalam status `Draft` dan menyimpan data detail belanja ke database lokal.
* **FR-05 (Aplikasi Promosi Otomatis)**: Sistem harus menghitung promo secara otomatis di keranjang (potongan nominal/persen pada item, atau penyisipan produk gratis senilai Rp0).
* **FR-06 (Kalkulasi Pajak & Total)**: Sistem harus menghitung pajak event berdasarkan persentase cabang (`pajak_persen`) dan mengakumulasikan total bersih.
* **FR-07 (Pemrosesan Multi-Metode Pembayaran)**: Sistem harus memproses transaksi Tunai (langsung sukses luring) dan Non-Tunai (menampilkan QRIS dinamis via API payment gateway dan menunggu webhook settlement).
* **FR-08 (Cetak Struk)**: Sistem harus memicu printer Bluetooth thermal untuk mencetak nota bukti bayar fisik saat transaksi berstatus `Success`.
* **FR-09 (Jeda Sesi / Switch User)**: Sistem harus memfasilitasi jeda sesi kasir (mengubah status shift menjadi `ON_BREAK` dan mengosongkan operator aktif) serta membolehkan kasir pengganti mengambil alih operator aktif (`id_user_aktif`) tanpa menutup shift berjalan.
* **FR-10 (Forensik Pembatalan)**: Sistem harus mencatat alasan pembatalan teks untuk item yang di-void (`transaksi_detail.status_item = 'Void'`) atau transaksi yang dibatalkan (`transaksi.status = 'Cancelled'`).
* **FR-11 (Closing Shift & Rekonsiliasi)**: Sistem harus memproses penutupan shift kasir, menerima input uang fisik akhir kasir, menghitung selisih sistem (`selisih_uang`), mengubah status menjadi `CLOSED`, dan mencetak slip closing.
* **FR-12 (CRUD Web Admin)**: Sistem harus menyediakan fungsionalitas CRUD master menu, cabang, sales mode, promosi, user kasir, dan admin baru di Web Dashboard.
* **FR-13 (Koreksi Admin)**: Sistem harus membolehkan admin melakukan penyesuaian data transaksi pasca-event dan merekam audit log admin (`diperbaharui_oleh` dan `catatan_koreksi`).
* **FR-14 (Generate Laporan)**: Sistem harus memfasilitasi admin mengekspor laporan omzet periodik ke berkas PDF dan Excel (XLSX).

### III.2 Use Case Diagram
Diagram Use Case menggambarkan visualisasi fungsionalitas sistem POS Event yang melibatkan aktor Kasir, Admin, dan Payment Gateway.
Diagram ini dapat diakses pada berkas: [UseCase.png](file:///D:/Kuliah/Semester%207/KP/Point-Of-Sale-App/Dokumen/UseCase.png).

### III.3 Use Case Scenario
Skenario lengkap langkah-demi-langkah penggunaan sistem POS Event telah terdokumentasi secara detail di berkas **`Usecase Scenario.xlsx`** dan dapat ditinjau ringkasannya pada dokumen SDD Bab III Bagian III.2.

---

## Bab IV Non Functional Requirements

### IV.1 Performance Requirements
* **Waktu Respon Sinkronisasi**: Proses sinkronisasi data transaksi offline ke server database pusat saat koneksi internet kembali terhubung harus selesai dalam waktu kurang dari 3 detik per 50 baris data transaksi.
* **Kecepatan Cetak Struk**: Perintah cetak struk via Bluetooth thermal printer harus direspon oleh printer dalam waktu maksimal 1.5 detik setelah transaksi dinyatakan sukses.
* **Waktu Render Grafik**: Dashboard administrasi web harus memuat grafik visual tren omzet dalam waktu kurang dari 2 detik setelah filter diterapkan.

### IV.2 Safety Requirements
* **Enkripsi Kredensial**: Password admin web wajib dienkripsi di database menggunakan algoritma hashing satu arah yang aman (seperti bcrypt/Argon2).
* **Audit Keamanan Finansial**: Setiap pembatalan nota atau item pesanan harus mencatat alasan logis dan ID Kasir terkait. Database dilarang keras menghapus baris data transaksi asli secara fisik (*hard delete*); pembatalan diselesaikan dengan mengubah flag status (`Cancelled` atau `Void`).
* **Sertifikasi Koneksi**: Seluruh API endpoint yang diakses oleh APK kasir wajib menggunakan protokol HTTPS terenkripsi TLS 1.3 untuk mencegah serangan penyadapan (*man-in-the-middle*).

### IV.3 Software Quality Attributes
1. **Keandalan (Reliability)**: 
   Sistem harus menerapkan pendekatan *offline-first* dengan database lokal (SQLite/Hive) di APK mobile. Kasir harus tetap bisa melayani pemesanan dan pembayaran tunai secara luring tanpa internet. Sistem akan menyinkronkan data secara otomatis saat terhubung kembali tanpa risiko tabrakan data (menggunakan UUID v4).
2. **Kemudahan Penggunaan (Usability)**:
   Antarmuka kasir didesain kontras tinggi (Monokrom) dengan tombol besar dan navigasi intuitif agar kasir dapat memproses transaksi pelanggan dalam waktu kurang dari 45 detik.
3. **Portabilitas (Portability)**:
   Aplikasi mobile APK harus dapat berjalan lancar di berbagai perangkat Android dengan minimal OS 8.0 (Oreo) ke atas tanpa ada deformasi tata letak desain Brutalist.

---

## Bab V Data Requirements

### V.1 Input
Berikut adalah tabel entitas input utama dan pemetaan matriks hak akses CRUD untuk masing-masing peran pengguna di dalam Sistem POS Event (sinkron dengan berkas `Input.xlsx`):

#### Tabel 5.1 - Daftar Entitas Input dan Sumber Data

| Nama Entitas | Atribut Utama | Sumber Input | Peran Penginput |
| :--- | :--- | :--- | :--- |
| **role_user** | id_role, nama_role | Web Admin (Sistem) | Admin |
| **user** | id_user, id_role, id_cabang, username, password_hash, nama_user, status_aktif | Form Registrasi Admin & Kelola Kasir | Admin |
| **cabang** | id_cabang, pajak_persen, nama_cabang, lokasi | Form Manajemen Cabang | Admin |
| **shift_session** | id_shift, id_user, id_user_aktif, id_cabang, id_sales, waktu_mulai, waktu_selesai, modal_awal, uang_fisik_akhir, status_shift, selisih_uang | Form Shift (Opening & Closing) di APK | Kasir |
| **transaksi** | id_transaksi, id_sales, id_cabang, id_user, id_metode, id_shift, id_promo, tanggal_transaksi, jam_transaksi, nama_pelanggan, tax, total, status, alasan_batal, diperbaharui_oleh, catatan_koreksi, nominal_promo | Menu Checkout APK & Koreksi Web Admin | Kasir & Admin |
| **transaksi_detail** | id_transaksi_detail, id_transaksi, id_produk, harga_produk, quantity, id_promo, nominal_promo, subtotal_item, status_item, alasan_batal_item | Halaman Keranjang Belanja APK Mobile | Kasir |
| **metode_pembayaran** | id_metode, nama_metode, kategori_metode, vendor_gateway | Form Pengaturan Pembayaran | Admin |
| **detail_pembayaran_non_tunai** | id_detail_bayar, id_transaksi, payment_gateway_id, reference_number, qr_string_data, va_number, status_api, waktu_kedaluwarsa, raw_callback_payload | API / Callback Webhook Payment Gateway | Sistem (Payment Gateway) |
| **sales_mode** | id_sales, nama_mode | Form Pengaturan Jalur Penjualan | Admin |
| **menu_template** | id_template, id_menu, id_cabang, id_sales, harga_produk | Form Sinkronisasi Harga per Cabang | Admin |
| **kategori** | id_kategori, nama_kategori | Form Manajemen Kategori Produk | Admin |
| **sub_kategori** | id_sub_kategori, id_kategori, nama_sub_kategori | Form Manajemen Sub Kategori Produk | Admin |
| **menu** | id_menu, id_sub_kategori, nama_menu | Form Kelola Master Data Produk | Admin |
| **promosi** | id_promo, id_cabang, nama_promo, tipe_promo, cakupan_promo, nilai_promo, id_menu_free | Form Input Program Diskon & Promo | Admin |

#### Tabel 5.2 - Matriks Hak Akses CRUD Entitas

| Nama Entitas | Kasir | Admin | Sistem (Payment Gateway) |
| :--- | :---: | :---: | :---: |
| **role_user** | - | CRUD | - |
| **user** | R | CRUD | - |
| **cabang** | R | CRUD | - |
| **shift_session** | CRU | R | - |
| **transaksi** | CRU | RU | RU |
| **transaksi_detail** | CRU | R | - |
| **metode_pembayaran** | R | CRUD | - |
| **detail_pembayaran_non_tunai** | R | R | CRU |
| **sales_mode** | R | CRUD | - |
| **menu_template** | R | CRUD | - |
| **kategori** | R | CRUD | - |
| **sub_kategori** | R | CRUD | - |
| **menu** | R | CRUD | - |
| **promosi** | R | CRUD | - |

### V.2 Output
Output utama yang dihasilkan oleh Sistem POS Event meliputi:
1. **Nota Belanja Fisik (Struk Thermal 58mm/80mm)**: Output cetak langsung dari printer Bluetooth yang memuat Nama Event, ID Transaksi (UUID), Kasir, Kanal Jual, detail menu, diskon promosi, komponen PPN/Tax, jenis pembayaran, dan total pembayaran bersih.
2. **Dynamic QRIS (Penampil Layar POS Mobile)**: Kode QR dinamis yang di-render di layar HP kasir untuk di-scan pelanggan, di mana nominal pembayaran telah terkunci oleh server payment gateway.
3. **Audit Log & Laporan Analisis Dashboard**: Laporan visual berupa grafik sebaran metode pembayaran (Tunai vs QRIS), daftar menu terlaris, rekapitulasi omzet, serta tabel investigasi transaksi void/cancelled untuk keamanan audit finansial admin.
4. **Slip Shift Kasir (Closing Summary)**: Slip cetak thermal ringkasan penutupan shift kasir yang menampilkan data modal awal, total omzet digital (tunai & nontunai), uang fisik akhir laci kasir, dan nominal selisih uang.

---

## Bab VI Interface Requirements

### VI.1 User Interface
Desain User Interface (UI) dirancang berbasis Graphical User Interface (GUI) dengan skema **Monochrome Neo-Brutalist** untuk kontras ekstrim dan kemudahan operasional di lingkungan luar ruangan (*outdoor*) festival:
* **Mobile APK Kasir**: Desain responsif layout split (katalog menu di sisi kiri dan keranjang pesanan di sisi kanan). Tombol angka (keypad) berukuran besar untuk input modal awal dan uang fisik closing kasir secara cepat. Pop-up jeda sesi dengan background redup dan card popup tegas untuk switch user.
* **Web Dashboard**: Navigasi sidebar kiri yang tegas untuk berpindah halaman dashboard, menu, kasir, transaksi, dan laporan. Card widget brutalist tebal untuk indikator statistik kinerja finansial.

Mockup visual rancangan antarmuka pengguna dapat diakses secara detail pada Bab V dokumen SDD.

### VI.2 Hardware Interface
Sistem POS Event terintegrasi dengan perangkat keras eksternal sebagai berikut:
1. **Smartphone/Tablet Android**: Menggunakan koneksi Wi-Fi atau data seluler (4G/5G) untuk komunikasi server, serta fitur Bluetooth aktif untuk berpasangan (*pairing*) dengan printer.
2. **Printer Thermal Portable Bluetooth**: Menggunakan koneksi Serial Port Profile (SPP) untuk menerima byte data instruksi pencetakan nota dari perangkat Android kasir.
3. **PC / Komputer Admin**: Perangkat keras untuk admin mengakses dashboard administrasi web pusat.

### VI.3 Software Interface
Kebutuhan antarmuka perangkat lunak pendukung Sistem POS Event:
* **Web Browser Client**: Google Chrome v90+ atau Mozilla Firefox v88+ untuk menjalankan Web Dashboard Admin.
* **Android OS Client**: Google Android OS v8.0 (Oreo) atau versi di atasnya sebagai lingkungan eksekusi APK kasir yang dibangun dengan **React Native**.
* **Web Server**: Apache v2.4 atau Nginx v1.20 (melalui Laragon development platform atau server production).
* **DBMS**: MySQL v8.0 relasional terpusat.
* **Framework Backend & Web Admin**: Laravel Framework v10 dengan PHP v8.2 untuk mengelola dashboard admin web, backend RESTful API, database management, dan webhook receiver.
* **Mobile App Framework**: **React Native** v0.72+ untuk mengembangkan aplikasi mobile kasir dengan performa rendering native pada platform Android.
* **ESC/POS Command Library**: Driver perangkat lunak untuk memetakan teks struk kasir menjadi perintah byte cetak printer thermal.

### VI.4 Communication Interface
Bagian ini mendefinisikan protokol dan standar yang akan digunakan untuk mengatur pertukaran data antara berbagai komponen arsitektur sistem, seperti yang digambarkan dalam Deployment Diagram.
* **Protokol Komunikasi Klien-Server**:
  * Seluruh komunikasi antara peramban web pengguna (klien admin), aplikasi mobile kasir (React Native), dan server web (Laravel) akan menggunakan protokol HTTPS (Hypertext Transfer Protocol Secure). Penggunaan HTTPS bersifat wajib di seluruh aplikasi untuk mengenkripsi semua data yang dikirimkan, melindungi informasi sensitif seperti kata sandi kasir, token autentikasi, dan riwayat transaksi dari penyadapan di area festival.
* **Protokol Komunikasi Server Aplikasi ke Basis Data**:
  * Komunikasi antara server aplikasi Laravel dan server basis data MySQL akan terjadi di dalam jaringan internal yang aman (private network). Protokol yang digunakan adalah koneksi TCP/IP standar yang didukung oleh DBMS, diakses melalui driver PDO (PHP Data Objects) MySQL pada runtime PHP. Koneksi ini harus dikonfigurasi dengan kredensial yang aman dan akses jaringan yang terbatas hanya untuk server aplikasi Laravel.
* **Antarmuka Pemrograman Aplikasi (API) Internal**:
  * Komunikasi antara aplikasi mobile kasir (React Native) dan server backend (Laravel) akan diatur melalui RESTful API untuk melayani kebutuhan unduh katalog, sinkronisasi shift, dan pengunggahan transaksi.
  * **Format Pertukaran Data**: Format data standar untuk semua respons dan permintaan API adalah JSON (JavaScript Object Notation) karena sifatnya yang ringan dan mudah di-parse oleh React Native di sisi klien dan Laravel di sisi server.
  * **Autentikasi API**: Setiap panggilan API yang mengakses sumber daya yang dilindungi atau melakukan tindakan yang memerlukan hak akses harus diautentikasi. Mekanisme yang akan digunakan adalah Bearer Token Authentication, menggunakan token API yang aman (seperti Laravel Sanctum). Klien mobile akan mengirimkan token ini dalam header Authorization pada setiap permintaan setelah berhasil login.
* **Antarmuka Komunikasi dengan Sistem Eksternal (Payment Gateway)**:
  * Komunikasi antara server backend Laravel dan server payment gateway (Midtrans/Xendit) akan menggunakan protokol HTTPS RESTful API untuk meminta pembuatan QRIS dinamis.
  * **Webhook Callback**: Server payment gateway akan mengirimkan callback webhook menggunakan protokol HTTPS POST ke server Laravel untuk memicu pembaruan status transaksi secara otomatis dari `PENDING` menjadi `SETTLEMENT` saat pelanggan berhasil melakukan pembayaran.
* **Protokol Komunikasi Nirkabel ke Perangkat Tambahan (Printer)**:
  * Komunikasi antara aplikasi mobile kasir (React Native) dan printer thermal nirkabel menggunakan protokol Bluetooth SPP (Serial Port Profile). Aplikasi kasir akan mengirimkan byte array data mentah yang berisi perintah kontrol pencetakan standar ESC/POS untuk mencetak struk belanja fisik langsung di lokasi event.

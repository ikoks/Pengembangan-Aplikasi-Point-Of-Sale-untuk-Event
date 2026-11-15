**LAPORAN KERJA PRAKTIK**

**PERANCANGAN DAN IMPLEMENTASI APLIKASI POINT OF SALE (POS) UNTUK PENGELOLAAN TRANSAKSI EVENT**

Diajukan Untuk Memenuhi Salah Satu Syarat  
Matakuliah Kerja Praktik  
Jenjang Strata 1 pada Program Studi teknik Informatika  
Universitas Jenderal Achmad Yani

[Gambar Dihapus]

Disusun Oleh:

**Fauzy Faadillah Ricky Gunaldo**

NIM. 2350081020 NIM. 2350081028

**PROGRAM STUDI TEKNIK INFORMATIKA  
FAKULTAS SAINS DAN INFORMATIKA  
UNIVERSITAS JENDERAL ACHMAD YANI  
2026**

[Gambar Dihapus]

**LEMBAR PENGESAHAN  
LAPORAN KERJA PRAKTIK**

Judul Kerja Praktik:

**PERANCANGAN DAN IMPLEMENTASI APLIKASI POINT OF SALE (POS) UNTUK PENGELOLAAN TRANSAKSI EVENT**

Oleh:

**Fauzy Faadillah**

NIM: 2350081020

**Ricky Gunaldo**

NIM: 2350081028

**Telah Diperiksa dan Disetujui**

**Sebagai Laporan Kerja Praktik:**

Pada Tanggal, Agustus 2026

Dosen Pembimbing  
Kerja Praktik

Wina Witanti,ST.,MT.

NID. 4121 762 73

Pembimbing Lapangan

Muhamad Rijal Abdulatif

NIP.

**Diketahui,**

Ka. Program Studi Informatika

Puspita Nurul Sabrina, S.Kom., M.T.

NID. 4121 905 85

[Gambar Dihapus]

**LEMBAR PERNYATAAN KEASLIAN**

**LAPORAN KERJA PRAKTIK**

Kami yang bertandatangan di bawah ini, dengan ini menyatakan bahwa laporan kerja praktik yang telah kami buat dengan judul sebagai berikut:

**PERANCANGAN DAN IMPLEMENTASI APLIKASI POINT OF SALE (POS) UNTUK PENGELOLAAN TRANSAKSI EVENT**

Merupakan hasil karya kami. Laporan beserta sistem yang telah dibuat merupakan hasil pekerjaan kami sepenuhnya, ide, pendapat, atau materi yang berasal dari sumber lain telah dikutip dengan cara penulisan referensi yang sesuai dan baku.

Demikian pernyataan ini telah kami buat.

Cimahi, Desember 2026

**Fauzy Faadillah**  
NIM. 2350081020

**Ricky Gunaldo  
**NIM. 2350081028

KATA PENGANTAR
==============

Pertama-tama kami sebagai penyusun memanjatkan puji serta syukur kepada Allah SWT, Yang Maha Pengasih lagi Maha Penyayang telah memberikan berkah dan anugerah-Nya kepada kami sehingga penulis mampu menyelesaikan kerja praktik ini sebaik-baiknya dengan judul “PERANCANGAN DAN IMPLEMENTASI APLIKASI POINT OF SALE (POS) UNTUK PENGELOLAAN TRANSAKSI EVENT ". Kerja praktik ini merupakan salah satu syarat untuk memenuhi kelulusan jenjang Strata 1 pada program studi Informatika Universitas Jenderal Achmad Yani. Kami menyadari masih terdapat banyak kekurangan dalam kerja praktik ini, baik penulisan maupun aplikasinya sendiri.

Tidak lupa kami ucapkan terima kasih kepada dosen pembimbıng kamı, yaitu Bapa Wina Witanti,ST.,MT. dan juga pembimbing sekaligus penanggungjawab lapangan kerja praktik kami yaitu Bapa Muhamad Rijal Abdulatif.

Akhir kata, semoga hasil kerja praktik ini dapat bermanfaat bagi penulis khususnya, serta bagi seluruh pihak yang berkepentingan pada umumnya. Semoga Allah SWT selalu melimpahkan karunia-Nya pada kita semua. Aamiin.

ABSTRAK
=======

Perkembangan teknologi informasi dan komunikasi pada sektor industri Food and Beverage (F&B) menuntut efisiensi serta akurasi dalam pengelolaan transaksi penjualan, khususnya pada kegiatan event penjelajah kuliner yang melibatkan cabang usaha seperti Let's Go Gelato dan Terve. Pada operasional transaksi event, proses pencatatan dan pengelolaan transaksi secara manual atau tidak terintegrasi sering mengalami kendala, seperti ketidaksesuaian rekapitulasi penjualan, lamanya proses pelayanan kasir, serta kendala pemantauan laporan transaksi antar cabang secara real-time. Untuk mengatasi permasalahan tersebut, maka dikembangkan Aplikasi Point of Sale (POS) untuk Pengelolaan Transaksi Event. Pengembangan sistem ini menggunakan metode Waterfall yang mencakup tahapan analisis kebutuhan, perancangan sistem (UML, ERD, dan mockup antarmuka), implementasi program, hingga pengujian sistem. Aplikasi ini dirancang untuk mempermudah proses pemesanan, pencatatan transaksi kasir, pengelolaan data produk dan stok event, serta penyajian laporan penjualan secara terstruktur dan terintegrasi. Pengujian aplikasi dilakukan dengan metode Black Box Testing dan User Acceptance Test (UAT) untuk memastikan seluruh fitur berjalan sesuai dengan kebutuhan fungsional pengguna. Dengan diimplementasikannya aplikasi POS Event ini, diharapkan proses transaksi pada kegiatan event perusahaan pengelola Let's Go Gelato dan Terve menjadi lebih efisien, akurat, dan transparan.

Kata kunci : Point of Sale (POS), Transaksi Event, Let's Go Gelato, Terve, Waterfall, Black Box Testing, Web/Mobile.


DAFTAR ISI
==========

[LEMBAR PENGESAHAN LAPORAN KERJA PRAKTIK](#)
[LEMBAR PERNYATAAN KEASLIAN](#)
[KATA PENGANTAR](#)
[ABSTRAK](#)
[DAFTAR ISI](#)
[DAFTAR GAMBAR](#)
[DAFTAR TABEL](#)
[DAFTAR SIMBOL](#)

[BAB I. PENDAHULUAN](#)
[1.1 Latar Belakang](#)
[1.2 Rumusan Masalah](#)
[1.3 Batasan Masalah](#)
[1.4 Maksud Dan Tujuan](#)
[1.5 Metode Kerja Praktik](#)
[1.6 Sistematika Penulisan](#)

[BAB II. LANDASAN TEORI](#)
[2.1 Point of Sale (POS) dan Transaksi Event](#)
[2.2 Waterfall](#)
[2.3 Framework React Native](#)
[2.4 Framework Laravel dan RESTful API](#)
[2.5 Arsitektur Model-View-Controller (MVC)](#)
[2.6 Bahasa Pemrograman JavaScript dan PHP](#)
[2.7 Sistem Manajemen Basis Data (MySQL dan SQLite)](#)
[2.8 Konektivitas Bluetooth Thermal Printing (Protokol ESC/POS)](#)
[2.9 Unified Modeling Language (UML)](#)
[2.10 Black Box Testing](#)
[2.11 User Acceptance Test (UAT)](#)
[2.12 Visual Studio Code](#)

[BAB III. ANALISIS DAN PERANCANGAN](#)
[3.1 Latar Belakang Perusahaan](#)
[3.2 Visi dan Misi](#)
[3.3 Sistem Yang Sedang Berjalan](#)
[3.4 Perancangan Sistem Baru](#)

[BAB IV. IMPLEMENTASI DAN PENGUJIAN](#)
[4.1 Implementasi Sistem](#)
[4.2 Pengujian Sistem](#)

[BAB V. KESIMPULAN DAN SARAN](#)
[5.1 Kesimpulan](#)
[5.2 Saran](#)

[DAFTAR PUSTAKA](#)
[LAMPIRAN](#)

DAFTAR GAMBAR
=============
Gambar 2.1 Ilustrasi Waterfall
Gambar 3.1 Use Case Diagram POS Event
Gambar 3.2 Activity Diagram Transaksi
Gambar 3.3 Sequence Diagram Shift Handover
Gambar 3.4 Class Diagram POS Backend
Gambar 3.5 Entity Relationship Diagram (ERD) POS
Gambar 3.6 Mockup Aplikasi Mobile Kasir
Gambar 3.7 Mockup Web Dashboard Admin
Gambar 4.1 Implementasi Halaman Login Kasir
Gambar 4.2 Implementasi Halaman Katalog (POS)
Gambar 4.3 Implementasi Halaman Checkout dan Metode Pembayaran
Gambar 4.4 Implementasi Halaman Cetak Struk Bluetooth
Gambar 4.5 Implementasi Dashboard Admin
Gambar 4.6 Implementasi Halaman Kelola Menu Multi-Tenant

DAFTAR TABEL
============
Tabel 3.1 Skenario Use Case Melakukan Transaksi
Tabel 3.2 Skenario Use Case Void Transaksi
Tabel 4.1 Skenario Pengujian Black Box Testing POS Event
Tabel 4.2 Hasil Pengujian User Acceptance Test (UAT)

DAFTAR SIMBOL
=============
Simbol-simbol yang digunakan dalam laporan ini mengikuti standar Unified Modeling Language (UML) untuk Use Case Diagram, Activity Diagram, Sequence Diagram, dan Class Diagram, serta notasi Entity Relationship Diagram (ERD) untuk perancangan basis data.


PENDAHULUAN
===========

Latar Belakang
--------------

Perkembangan industri Food and Beverage (F&B) di Indonesia tumbuh pesat dan dinamis. Persaingan bisnis yang ketat menuntut setiap pelaku usaha F&B untuk meningkatkan efisiensi operasional, kecepatan pelayanan, serta akurasi pencatatan keuangan. Kondisi ini dirasakan langsung oleh perusahaan tempat pelaksanaan Kerja Praktik/Magang, yang mengelola dua unit usaha/brand F&B yaitu Let’s Go Gelato dan Terve.

Setiap brand memiliki karakteristik operasional, jenis produk, harga, serta target pelanggan yang berbeda. Dalam menjalankan kegiatan operasional harian maupun partisipasi pada berbagai ajang pameran dan event kuliner, kedua gerai ini membutuhkan sistem pencatatan transaksi penjualan (Point of Sale) yang handal, fleksibel, dan memiliki performa tinggi.

Namun, dalam operasional bisnis multi-cabang/multi-brand seperti Let's Go Gelato dan Terve, kerap dihadapi beberapa permasalahan teknis dan operasional:

1\. Pengelolaan Multi-Tenant / Multi-Branch: Pengelolaan transaksi untuk dua brand berbeda memerlukan pemisahan data transaksi, inventaris produk, dan rekapitulasi pendapatan yang terisolasi namun tetap dapat dipantau dan dikelola secara efisien dari satu arsitektur sistem.

2\. Risiko Selisih Uang Kas (Cash Discrepancy): Pada gerai F&B dengan volume transaksi tinggi, pergantian petugas kasir (shift handover) rawan menimbulkan selisih perhitungan tunai jika proses serah terima kasir masih dilakukan secara manual tanpa sistem otentikasi dan verifikasi yang tervalidasi.

3\. Kebutuhan Mobilitas Kasir dan Pencetakan Struk Nirkabel: Pada saat transaksi padat atau ketika membuka pop-up booth di suatu event, penggunaan perangkat POS komputer meja (desktop) sangat memakan tempat dan kurang fleksibel. Dibutuhkan aplikasi kasir berbasis mobile yang terhubung langsung dengan Bluetooth thermal printer untuk mencetak bukti pembayaran secara cepat di lokasi.

Untuk mengatasi permasalahan tersebut, dirancang dan diimplementasikan Aplikasi Point of Sale (POS) untuk Pengelolaan Transaksi Multi-Tenant dan Event (PosEventKasir). Aplikasi ini dibangun pada sisi mobile frontend menggunakan React Native guna memberikan kemudahan mobilitas bagi kasir di gerai Let's Go Gelato maupun Terve. Sisi backend API dikembangkan menggunakan kerangka kerja Laravel dengan basis data MySQL, serta dilengkapi sistem otentikasi aman, fitur shift handover terintegrasi, dan konektivitas pencetakan struk Bluetooth thermal.

Rumusan Masalah
---------------

Berdasarkan latar belakang yang telah diuraikan, dapat dirumuskan beberapa permasalahan yang menjadi dasar pelaksanaan Kerja Praktik ini, yaitu sebagai berikut:

1.  Belum tersedianya aplikasi Point of Sale (POS) berbasis mobile (React Native) dan RESTful API (Laravel) yang terintegrasi untuk mendukung proses pencatatan transaksi secara efisien, fleksibel, dan terpusat di gerai Let's Go Gelato maupun Terve.
2.  Adanya risiko terjadi selisih pencatatan kas harian serta tumpang-tindih data antar-brand akibat belum terimplementasikannya arsitektur multi-tenant dan fitur verifikasi shift handover pada saat serah terima kasir.
3.  Keterbatasan mobilitas dalam pencetakan bukti pembayaran (struk) secara langsung di lokasi gerai maupun event akibat belum terintegrasinya aplikasi kasir mobile dengan perangkat Bluetooth thermal printer.

Batasan Masalah
---------------

Agar ruang lingkup Kerja Praktik lebih terfokus, berikut merupakan beberapa batasan masalahnya:

1.  Perancangan sistem difokuskan pada modul transaksi kasir (Point of Sale), pengelolaan katalog produk dan kategori, pencatatan transaksi penjualan tunai dan non-tunai, serta penerbitan bukti pembayaran (struk).
2.  Fitur khusus sistem mencakup pengelolaan multi-tenant untuk memisahkan data transaksi, katalog produk, dan laporan pendapatan antara gerai Let's Go Gelato dan Terve, serta fitur shift handover (serah terima kasir) yang dilengkapi mekanisme verifikasi keamanan (OTP/PIN validation) guna meminimalisasi selisih uang kas.
3.  Sistem ini tidak mencakup modul manajemen rantai pasok bahan baku (raw material supply chain), sistem Kitchen Display System (KDS) dinamis, integrasi langsung dengan API platform online food delivery pihak ketiga, maupun sistem akuntansi enterprise skala besar secara menyeluruh.
4.  Aplikasi kasir bergerak (mobile frontend) dikembangkan khusus untuk platform Android menggunakan framework React Native, sedangkan layanan backend API dikembangkan menggunakan framework Laravel dengan basis data relasional MySQL.
5.  Pengujian sistem dibatasi pada pengujian fungsionalitas (black-box testing) pada lingkungan staging lokal serta pengujian integrasi pencetakan struk dan simulasi transaksi langsung di lokasi gerai (field testing).

Maksud Dan Tujuan
-----------------

Pembangunan aplikasi ini dimaksudkan untuk menyediakan sebuah platform kasir berbasis mobile (React Native) dan RESTful API (Laravel) yang terintegrasi guna mendukung efisiensi, akurasi, serta mobilitas dalam pengelolaan transaksi event pada unit usaha Let's Go Gelato dan Terve. Adapun tujuan spesifik dari pengembangan sistem ini adalah sebagai berikut:

1.  Membangun aplikasi kasir mobile berbasis React Native dan backend RESTful API berbasis Laravel yang responsif, terstruktur, serta aman untuk operasional event.
2.  Memfasilitasi pencatatan transaksi untuk multi-tenant / multi-brand (Let's Go Gelato dan Terve) secara terisolasi sehingga pemantauan pendapatan tiap brand dapat dikelola secara terpusat dan akurat.
3.  Meminimalisir risiko terjadinya selisih uang kas (cash discrepancy) pada saat serah terima kasir melalui fitur verifikasi shift handover.
4.  Meningkatkan mobilitas kasir di lokasi event atau pop-up booth melalui integrasi pencetakan bukti transaksi nirkabel menggunakan Bluetooth thermal printer.
5.  Menyajikan laporan rekapitulasi penjualan harian dan event secara real-time dan transparan bagi pihak manajemen.

Metode Kerja Praktik
--------------------

### Metode Pengumpulan Data

Dalam pelaksanaan Kerja Praktik ini, kami menggunakan beberapa metode pengumpulan data guna memperoleh informasi yang relevan dan akurat, yaitu sebagai berikut:

1.  Observasi dilakukan dengan mengamati secara langsung aktivitas harian kasir pada gerai Let's Go Gelato dan Terve. Pengamatan difokuskan pada alur pencatatan pemesanan produk, proses pembayaran, penanganan antrean pelanggan pada jam sibuk (peak hours), hingga prosedur penutupan kasir dan serah terima shift (shift handover). Dari hasil observasi ini, diperoleh pemahaman yang mendalam mengenai kendala operasional kasir di lapangan, seperti keterbatasan mobilitas akibat penggunaan perangkat POS meja (desktop) serta potensi timbulnya selisih uang kas saat pergantian shift jika tidak disertai sistem verifikasi yang ketat.
2.  Wawancara dan diskusi terstruktur dilakukan secara bertahap bersama Pembimbing Lapangan, Bapak Muhamad Rijal Abdulatif, beserta pengelola gerai dan para staf operasional kasir Let's Go Gelato dan Terve. Proses ini bertujuan untuk menggali kebutuhan fungsional aplikasi secara spesifik, seperti aturan bisnis (business rules) terkait pemisahan data transaksi dan inventaris produk antar-brand (multi-tenant), mekanisme keamanan otentikasi kasir, hingga format laporan rekapitulasi penjualan harian yang dibutuhkan oleh manajemen. Hasil dari wawancara ini kemudian dirumuskan menjadi dokumen Spesifikasi Kebutuhan Pengguna (User Requirements Specification) yang menjadi dasar utama perancangan system.

### Metode Pengembangan Sistem

Pengembangan aplikasi Point of Sale (PosEventKasir) menerapkan pendekatan Software Development Life Cycle (SDLC) yang terstruktur melalui tahapan-tahapan sebagai berikut:

1.  Analaisis Kebutuhan Sistem, Pada tahap ini, dilakukan identifikasi mendalam terhadap kebutuhan fungsional dan non-fungsional sistem. Kebutuhan fungsional mencakup perancangan fitur utama seperti pengelolaan katalog produk per brand, pencatatan transaksi penjualan, fitur shift handover kasir dengan verifikasi keamanan, isolasi data multi-tenant, dan modul pencetakan struk. Sementara itu, kebutuhan non-fungsional berfokus pada penetapan standar performa aplikasi mobile, tingkat keamanan otentikasi API, kemudahan penggunaan antarmuka (usability), serta kestabilan koneksi Bluetooth pada perangkat kasir.
2.  Perancangan Sistem, Tahap perancangan memvisualisasikan arsitektur dan alur kerja aplikasi menggunakan pemodelan Unified Modeling Language (UML) yang meliputi Use Case Diagram, Activity Diagram, Sequence Diagram, dan Class Diagram. Di samping itu, dirancang pula struktur basis data relasional MySQL menggunakan Entity Relationship Diagram (ERD) untuk mendukung arsitektur multi-tenant, serta pembuatan wireframe dan desain antarmuka pengguna (UI/UX) aplikasi mobile yang intuitif dan ramah pengguna (user-friendly).
3.  Implementasi Sistem, Tahap implementasi dilakukan dengan mentranslasikan hasil rancangan ke dalam baris kode program. Pembangunan backend API menggunakan framework Laravel (PHP) untuk mengelola logika bisnis, otentikasi, dan manipulasi data multi-tenant. Sedangkan aplikasi mobile frontend dikembangkan menggunakan React Native (JavaScript/TypeScript) untuk platform Android. Pada tahap ini juga diimplementasikan integrasi pustaka Bluetooth guna menghubungkan aplikasi kasir dengan perangkat Bluetooth thermal printer melalui perintah ESC/POS.
4.  Pengujian Sistem, dilakukan untuk memastikan seluruh modul aplikasi berfungsi dengan baik tanpa adanya kesalahan (error). Metode yang digunakan adalah black-box testing untuk memvalidasi fungsi-fungsi seperti login, pencatatan checkout, serah terima shift, serta isolasi data antar-brand Let's Go Gelato dan Terve. Selain itu, dilakukan pengujian integrasi perangkat keras secara langsung di gerai untuk menguji keandalan konektivitas dan kecepatan pencetakan struk melalui Bluetooth thermal printer.
5.  Pemeliharaan dan Dokumentasi, Tahap akhir meliputi penyusunan dokumentasi teknis sistem, yang mencakup dokumentasi spesifikasi endpoint RESTful API, kode sumber program, serta petunjuk penggunaan aplikasi (user manual) bagi petugas kasir. Seluruh hasil analisis, perancangan, implementasi, dan pengujian kemudian didokumentasikan secara komprehensif ke dalam laporan akhir Kerja Praktik.

Sistematika Penulisan
---------------------

Laporan kerja praktik ini disusun dengan sistematika sebagai berikut:

BAB I PENDAHULUAN

Bab ini menguraikan konteks umum pelaksanaan Kerja Praktik/Magang yang meliputi Latar Belakang Masalah, Rumusan Masalah, Tujuan Kerja Praktik, Manfaat Kerja Praktik bagi Mahasiswa, Perusahaan, dan Institusi Pendidikan, Metodologi Pengumpulan Data dan Pengembangan Sistem, Batasan Masalah, serta Sistematika Penulisan Laporan.

BAB II LANDASAN TEORI

Bab ini memuat kajian teori dan konsep dasar teknologi yang digunakan dalam pembangunan sistem, meliputi konsep Point of Sale (POS) dan transaksi event, metode pengembangan Waterfall, framework React Native dan Laravel, arsitektur Model-View-Controller (MVC) & RESTful API, bahasa pemrograman JavaScript dan PHP, basis data MySQL dan SQLite (offline buffer), konektivitas Bluetooth Thermal Printing (protokol ESC/POS), pemodelan UML (Unified Modeling Language), pengujian perangkat lunak (Black Box Testing & User Acceptance Test), serta perkakas pengembang Visual Studio Code.

BAB III ANALISIS DAN PERANCANGAN

Bab ini menyajikan analisis sistem yang berjalan, analisis kebutuhan fungsional dan non-fungsional, perancangan arsitektur aplikasi menggunakan diagram UML (Use Case, Scenario Use Case, Class, Sequence, Activity, State, dan Deployment Diagram), perancangan data logis (ERD 16 entitas) dan fisik (16 tabel spesifikasi), serta perancangan antarmuka pengguna (UI Mockup) untuk APK Mobile Kasir dan Web Dashboard Admin.

BAB IV IMPLEMENTASI DAN PENGUJIAN

Bab ini menjelaskan bentuk implementasi perangkat lunak pada sisi frontend mobile berbasis React Native, backend RESTful API berbasis Laravel, skema basis data relasional MySQL, integrasi Bluetooth printer, serta hasil pelaksanaan pengujian sistem (Black Box Testing dan User Acceptance Test) untuk memastikan keandalan fungsi operasional di lapangan.

BAB V PENUTUP

Bab terakhir berisi kesimpulan hasil kerja praktik secara keseluruhan serta saran untuk pengembangan sistem di masa mendatang, baik dari sisi fitur, keamanan, maupun peningkatan efektivitas layanan.


LANDASAN TEORI
==============

Point of Sale (POS) dan Transaksi Event
---------------------------------------

Point of Sale (POS) secara umum merujuk pada lokasi fisik atau sistem digital tempat dilakukannya transaksi penjualan antara penjual dan pembeli. Dalam konteks ritel temporer atau event (seperti pameran, bazar, festival kuliner, dan merchandise), sistem POS membutuhkan karakteristik khusus:

1.  Kecepatan dan Keandalan Transaksi: Proses checkout harus berlangsung singkat untuk mencegah penumpukan antrean pembeli di lokasi tenant/booth.
2.  Ketahanan Jaringan (Offline-First): Lokasi event yang padat pengunjung kerap mengalami fluktuasi sinyal internet seluler. Oleh karena itu, sistem POS memerlukan kemampuan pencatatan transaksi lokal sementara (offline buffer) agar operasional penjualan tetap berjalan 100% tanpa hambatan koneksi.
3.  Pengelolaan Shift dan Audit Keuangan: Sistem harus memfasilitasi rekonsiliasi antara modal awal laci, pencatatan transaksi digital, dan perhitungan uang fisik asli pada saat penutupan shift (closing shift), serta mencatat tindakan pembatalan (void dan cancelled) untuk mencegah kerugian finansial (fraud).

Waterfall
---------

Waterfall model adalah sebuah contoh dari proses perencanaan, dimana semua proses kegiatan harus terlebih dahulu direncanakandan dijadwalkan sebelum dikerjakan.Dari definisi bisa menyimpulkan bahwa metodologi waterfall adalah prosedur pemecahan masalah yang diteliti dengan menggambarkan pendekatan yang cukup sistematis juga berurutan pada pembangunan software. Metodologi waterfall dilakukan melalui beberapa tahap yaitu requirements analysis, design, development, testing dan maintenance.

[Gambar Dihapus]

Gambar 2. 1 Ilustrasi Waterfall

Framework React Native
----------------------

React Native adalah framework aplikasi mobile open-source berbasis JavaScript yang dikembangkan oleh Meta. React Native memungkinkan pengembang membangun aplikasi lintas platform (Android dan iOS) menggunakan satu basis kode tunggal (single codebase).

Beberapa keunggulan React Native dalam aplikasi POS Mobile Kasir meliputi:

1.  Performa Native: Komponen antarmuka yang ditulis dirender langsung menjadi elemen UI native perangkat Android/iOS, menjamin kinerja antarmuka yang cepat dan responsif saat checkout pesanan.
2.  Dukungan Pustaka Perangkat Keras: Memudahkan integrasi dengan modul perangkat keras lokal seperti Bluetooth Service untuk pencetakan struk thermal dan penyimpanan lokal SQLite/SharedPreferences.
3.  Pengembangan Efisien: Fitur Fast Refresh mempercepat proses debugging dan penyesuaian antarmuka kasir.

Dengan pemisahan ini, setiap bagian memiliki tanggung jawab yang

Framework Laravel dan RESTful API
---------------------------------

Dalam arsitektur sistem POS Event, sisi backend dan web admin dashboard dikembangkan menggunakan Framework Laravel berbasis PHP.

1.  Framework Laravel: Laravel menyediakan pustaka bawaan yang kaya seperti Eloquent ORM untuk pengelolaan basis data relasional, mekanisme otentikasi Sanctum / Bearer Token, serta penanganan routing yang terenkripsi. Laravel bertugas mengolah logika bisnis pusat seperti pengelolaan data master produk, menu\_template harga regional per cabang, diskon promosi, shift\_operator\_logs, dan audit\_logs.
2.  RESTful API (Representational State Transfer): Communication layer antarklien mobile (React Native) dan server backend (Laravel) menggunakan protokol RESTful API berbasis HTTP/HTTPS. Pertukaran data dilakukan menggunakan format JSON (JavaScript Object Notation) yang ringan dan terenkripsi menggunakan token otentikasi Bearer JWT.

Arsitektur Model-View-Controller (MVC)
--------------------------------------

Model View Controller (MVC) merupakan pola arsitektur pengembangan aplikasi yang memisahkan kode program menjadi tiga komponen utama, yaitu:

1.  Model, bertugas mengelola data aplikasi, termasuk berinteraksi dengan basis data serta menjalankan logika bisnis yang dibutuhkan.
2.  View, berfungsi menampilkan antarmuka pengguna berdasarkan data yang diberikan oleh Controller.
3.  Controller, berperan sebagai penghubung antara Model dan View, mengatur aliran data mulai dari input pengguna hingga menghasilkan output yang ditampilkan pada View.

Dengan pemisahan ini, setiap bagian memiliki tanggung jawab yang jelas. Model mengelola data dan logika bisnis, View menampilkan antarmuka kepada pengguna, dan Controller menjadi penghubung antara keduanya.

*   Penerapan konsep MVC memberikan berbagai keuntungan dalam pengembangan aplikasi, antara lain:
*   Proses pengembangan menjadi lebih efisien karena pekerjaan dapat dibagi antara tim backend dan frontend.
*   Struktur kode lebih rapi dan lebih mudah dipahami.
*   Proses testing dan debugging lebih mudah dilakukan karena setiap bagian dapat diuji secara terpisah.
*   Pemeliharaan dan pengembangan lanjutan menjadi lebih cepat serta lebih terorganisir.

Secara keseluruhan, penggunaan konsep MVC menjadikan aplikasi lebih rapi, fleksibel, mudah dikembangkan, serta efisien dalam pengelolaan dan pemeliharaan kode.

Bahasa Pemrograman JavaScript dan PHP
-------------------------------------

Pengembangan sistem POS Event menggunakan dua bahasa pemrograman utama:

1.  JavaScript digunakan pada sisi client-side mobile (React Native) untuk membangun komponen antarmuka kasir, manajemen keranjang belanja, logika penyimpanan SQLite lokal, serta pengiriman instruksi byte ESC/POS ke printer Bluetooth.
2.  PHP digunakan pada sisi server-side (Laravel) untuk memproses validasi API, eksekusi transaksi basis data atomik (ACID), mekanisme verifikasi OTP Admin untuk void, serta komputasi pembuatan laporan keuangan.

Sistem Manajemen Basis Data (MySQL dan SQLite)
----------------------------------------------

Untuk mendukung konsep hybrid connectivity (online-realtime dan offline-first buffer), sistem mengombinasikan dua teknologi basis data:

1.  MySQL (Server Database Pusat):

MySQL v8.0 bertindak sebagai DBMS utama yang menyimpan 16 tabel relasional terpusat (role\_user, cabang, user, kategori, sub\_kategori, menu, sales\_mode, menu\_template, promosi, metode\_pembayaran, transaksi, transaksi\_detail, password\_reset\_tokens, shift\_session, shift\_operator\_logs, dan audit\_logs). MySQL mengunci integritas data menggunakan 27 Foreign Key dan menerapkan identifier UUID v4 (CHAR(36)) untuk menjamin keunikan kunci primer secara global.

1.  SQLite (Local Offline Buffer):

SQLite beroperasi langsung di dalam perangkat mobile Android Kasir. Saat jaringan internet terputus, transaksi draf disimpan secara lokal di SQLite menggunakan UUID v4. Komponen SyncManager secara otomatis mengonversi transaksi draf SQLite menjadi payload JSON dan mengunggahnya ke MySQL ketika koneksi internet pulih.

Konektivitas Bluetooth Thermal Printing (Protokol ESC/POS)
----------------------------------------------------------

Pencetakan bukti transaksi di area event dilakukan secara nirkabel tanpa ketergantungan jaringan internet. Aplikasi mobile memanfaatkan konektivitas Bluetooth Serial Port Profile (SPP) untuk berkomunikasi langsung dengan perangkat keras Bluetooth Thermal Printer (ukuran kertas 58mm atau 80mm). Instruksi cetak diformat menggunakan protokol standar ESC/POS (Epson Standard Code for Point of Sale), yaitu deretan kode byte array yang mengendalikan cetakan teks, pemotongan kertas, dan perataan layout struk.

Unified Modeling Language (UML)
-------------------------------

Unified Modeling Language merupakan salah satu metode pemodelan visual yang digunakan dalam perancangan dan pembuatan sebuah software yang berorientasikan pada objek. UML adalah sebuah bahasa pemodelan perangkat lunak yang telah distandarisasi sebagai media penulisan cetak biru (blueprints) perangkat lunak (pressman) (Sumiati et al., 2021). UML merupakan sebuah standar penulisan atau semacam blue print dimana didalamnya termasuk sebuah bisnis proses, penulisan kelas - kelas dalam sebuah bahasa yang spesifik.

### Use Case Diagram

Use case diagram merupakan model hasil analisis perancangan sistem yang bertujuan untuk mendeskripsikan kebutuhan sistem. Kebutuhan tersebut diterapkan oleh pengguna sehingga perancangan sistem dapat tergambarkan. Use case diagram adalah abstraksi dari interaksi antara sistem dengan aktor, sehingga penting untuk memilih abstraksi yang sesuai. Use case bekerja dengan cara mendeskripsikan interaksi tipikal antara Staff Fakultas & Staff Prodi dan Mahasiswa melalui diagram yang menunjukkan bagaimana sistem dipakai. Relasi include menyatakan bahwa fungsionalitas dari base use case hanya dapat dipenuhi dengan bantuan supplier use case dalam eksekusi alur utama pada use case scenario. Relasi ini tidak menjelaskan urutan eksekusi apa pun antara base use case dan supplier use case, baik dalam alur utama maupun alternatif. Selanjutnya, sebuah aktor yang disebut aktor induk dapat memiliki relasi dengan aktor turunan, yang menyatakan bahwa aktor tersebut merupakan turunan dari aktor induk.

### Activity Diagram

UML (Unified Modelling Language) adalah bahasa model standar untuk pengembangan cetak biru perangkat lunak, dan salah satu diagramnya adalah activity diagram. Pada UML, simbol digunakan sebagai stereotype aktivitas dalam sebuah activity diagram. Dalam activity diagram, suatu proses mengambil input berupa sumber daya dari sebelah kiri dan mengindikasikan outputnya pada sebelah kanan. Activity diagram menggambarkan aliran fungsional dalam suatu sistem informasi dengan mendefinisikan di mana workflow dimulai, di mana berhenti, aktivitas apa yang terjadi selama workflow, serta bagaimana urutan terjadinya aktivitas tersebut. Diagram ini juga menyediakan pendekatan untuk pemodelan proses paralel dan menggabungkan konsep dasar dari diagram alir data serta diagram alur sistem bagi mereka yang akrab dengan analisis dan desain struktur tradisional.

### Sequence Diagram

Diagram urutan sequence diagram adalah jenis diagram dalam UML yang menggambarkan interaksi antara objek dalam suatu sistem secara kronologis. Diagram ini menunjukkan bagaimana objek-objek berkomunikasi satu sama lain dan berurutan dalam eksekusi suatu skenario atau proses.

### Class Diagram

Class diagram adalah merupakan hubungan antar kelas dan penjelasan detail tiap tiap kelas di dalam model desain dari suatu sistem, juga memperlihatkan aturan- aturan dan tanggung jawab entitas yang menentukan perilaku sistem. Jadi dapat dikatakan bahwa Class Diagram adalah visual dari struktur sistem program pada jenis-jenis yang di bentuk. Class Diagram merupakan alur jalannya sebuah database pada system yang dibangun atau dibuat. Class diagram juga disebut kumpulan dari beberapa class dan relasinya. Class identik dengan entity yang direpresentasikan dalam bentuk persegi dimana pada bagian atas ditulis nama class, kemudian ke bawah ditulis attribute yang terdapat pada class, kemudian ke bawah lagi ditulis metode yang ada pada class.

### State Diagram

State Diagram memodelkan siklus transaksi dan shift session pada aplikasi POS Event. Siklus transaksi berawal dari status Draft di keranjang belanja, berpindah ke Success setelah dibayar, berubah menjadi Cancelled jika dibatalkan sebelum lunas, atau Void jika nota lunas dibatalkan menggunakan OTP Admin dan alasan, di mana seluruh pembatalan terekam di audit\_logs. Untuk ShiftSession, status dimulai dari OPEN saat opening shift, menjadi ON\_BREAK saat jeda istirahat, kembali ke OPEN saat resume atau switch operator, dan berakhir di status CLOSED saat closing shift kasir maupun melalui auto\_closed cron job server.

### Deployment Diagram

Deployment Diagram menggambarkan arsitektur fisik penyebaran sistem dan protokol komunikasinya. Sisi klien terdiri dari perangkat Android kasir (React Native APK) dan peramban web Admin yang terhubung ke Server Aplikasi (Laravel/PHP 8.2) menggunakan protokol HTTPS terenkripsi. Server Aplikasi terhubung dengan Server Basis Data MySQL (pos\_event\_db) melalui koneksi TCP/IP port 3306, sedangkan perangkat kasir terhubung secara nirkabel ke Printer Thermal via Bluetooth SPP untuk mencetak struk ESC/POS.

Black Box Testing
-----------------

Black box testing merupakan metode pengujian perangkat lunak yang berfokus pada pengujian fungsionalitas sistem tanpa memperhatikan struktur internal atau kode program yang digunakan. Pengujian ini dilakukan dengan cara memberikan sejumlah input ke dalam sistem dan mengamati output yang dihasilkan, kemudian membandingkannya dengan hasil yang diharapkan. Tujuan utama dari black box testing adalah untuk memastikan bahwa sistem telah berjalan sesuai dengan kebutuhan fungsional yang telah ditentukan serta mampu menangani berbagai kondisi input dengan benar.

Dalam pengujian ini, penguji tidak perlu mengetahui bagaimana sistem dibangun secara internal, melainkan hanya memeriksa apakah sistem telah memenuhi spesifikasi yang diharapkan. Oleh karena itu, black box testing sering digunakan untuk menguji fitur-fitur utama, validasi input, proses bisnis, serta keluaran sistem. Metode ini juga efektif dalam menemukan kesalahan seperti kesalahan fungsi, kesalahan antarmuka, kesalahan akses basis data, serta kesalahan performa.

Pada pengujian ini akan menggunakan metode Equivalance Portioning, dimana teknik ini bekerja dengan membagi masukan kedalam beberapa partisi data. Untuk menggunakan teknik equivalence portioning, maka akan dilakukan pembagian data yang akan dimasukkan disetiap modul didalam sistem. Pada setiap modul, maka akan dibagi kembali tujuan luaran yang ditetapkan.

User Acceptance Test (UAT)
--------------------------

User Acceptance Testing (UAT) merupakan fase akhir dalam proses pengujian perangkat lunak yang bertujuan memastikan sistem telah berfungsi sesuai kebutuhan pengguna sebelum diimplementasikan. Sebelum UAT dilakukan, pengujian integrasi perlu dilaksanakan untuk memastikan tidak ada kesalahan akibat penggabungan unit-unit sistem. Dokumen strategi pengujian yang disusun sejak tahap perencanaan menjadi acuan bagi tim penguji dalam melaksanakan proses verifikasi dan validasi. Pengujian berperan penting dalam mendukung kedua proses tersebut, baik melalui teknik dinamis maupun statis seperti analisis kode dan inspeksi. Setelah seluruh pengujian selesai dan sistem dinyatakan stabil, dilakukan penandatanganan dokumen persetujuan sebagai bukti bahwa sistem telah memenuhi standar kualitas. Tahap perbaikan dan koordinasi rilis menjadi langkah akhir sebelum perangkat lunak diluncurkan ke pasar.

Visual Studio Code
------------------

Visual Studio Code adalah sebuah editor kode modern yang dikembangkan oleh Microsoft dan dirancang untuk membantu programmer menulis, mengelola, serta melakukan debugging kode secara efisien. VS Code dikenal sangat ringan namun tetap powerful karena mampu menjalankan berbagai fitur canggih tanpa membebani perangkat. Editor ini mendukung hampir semua bahasa pemrograman seperti PHP, JavaScript, Python, Java, C++, Go, dan banyak lainnya melalui sistem ekstensi yang sangat fleksibel. Selain itu, Visual Studio Code menyediakan fitur auto-complete cerdas (IntelliSense), integrasi Git bawaan untuk mempermudah version control, serta terminal internal sehingga pengguna dapat menjalankan perintah tanpa perlu berpindah aplikasi. Tampilan antarmukanya juga sangat bisa disesuaikan melalui tema, icon pack, dan pengaturan layout, membuat pengalaman ngoding jadi lebih nyaman dan personal. Karena kombinasi antara performa cepat, kemudahan penggunaan, dokumentasi lengkap, serta ekosistem ekstensi yang sangat luas.


BAB III. ANALISIS DAN PERANCANGAN
=================================

3.1 Latar Belakang Perusahaan
-----------------------------

PT Let's Go Gelato dan Terve merupakan perusahaan yang bergerak di bidang Food and Beverage (F&B) dengan konsep multi-tenant. Let's Go Gelato menawarkan es krim gelato artisanal dengan berbagai varian rasa premium, sementara Terve menghadirkan berbagai pilihan produk cokelat, minuman, dan merchandise. Dalam kegiatan operasionalnya, perusahaan tidak hanya melayani pelanggan di gerai fisik permanen, tetapi juga aktif berpartisipasi dalam event-event temporer seperti festival kuliner, pameran, dan pop-up booth. Oleh karena itu, diperlukan dukungan infrastruktur Point of Sale (POS) yang cepat, stabil, serta dapat memisahkan data transaksi antar-brand.

3.2 Visi dan Misi
-----------------

**Visi:**
Menjadi penyedia produk dessert dan F&B terkemuka di Indonesia yang mengutamakan kualitas, inovasi rasa, serta pelayanan pelanggan yang optimal.

**Misi:**
1. Menyajikan gelato, cokelat, dan minuman berkualitas tinggi dengan bahan-bahan terbaik.
2. Meningkatkan efisiensi dan inovasi dalam setiap proses operasional baik di gerai maupun event.
3. Memberikan pengalaman transaksi yang cepat, aman, dan memuaskan bagi pelanggan.

3.3 Sistem Yang Sedang Berjalan
-------------------------------

### 3.3.1 Analisis Sistem yang Sedang Berjalan

Berdasarkan observasi pada operasional event dan gerai Let's Go Gelato dan Terve, pencatatan transaksi saat ini bergantung pada aplikasi Point of Sale (POS) pihak ketiga yang menerapkan sistem langganan berbayar (subscription) per bulan. Penggunaan sistem berlangganan ini memunculkan beberapa kendala operasional dan finansial, antara lain tingginya biaya operasional bulanan yang harus dikeluarkan untuk setiap lisensi perangkat atau tenant, serta kurangnya fleksibilitas dalam melakukan kustomisasi fitur yang spesifik untuk kebutuhan bisnis event multi-tenant. Selain itu, pada aplikasi pihak ketiga tersebut, proses serah terima kasir (shift handover) dan mekanisme otorisasi pembatalan transaksi (void) belum sepenuhnya selaras dengan alur kerja internal perusahaan, yang kerap kali masih mengakibatkan selisih pencatatan uang tunai di laci kasir (cash drawer). Untuk mobilitas di lokasi event, bergantung pada aplikasi pihak ketiga yang tidak dapat dikustomisasi _offline buffer_-nya juga kerap menghambat proses transaksi saat koneksi internet tidak stabil.

### 3.3.2 Hasil Analisis Kebutuhan User

Dari hasil wawancara dengan supervisor dan kasir, sistem yang dikembangkan (PosEventKasir) harus memenuhi kebutuhan pengguna berikut:
1. **Kasir / Operator Event**: Membutuhkan aplikasi berbasis mobile yang cepat, dapat berfungsi dalam keadaan internet tidak stabil (offline buffer), dapat melakukan pencetakan struk melalui Bluetooth Printer, serta melakukan proses buka dan tutup shift (Opening & Closing Shift).
2. **Admin / Supervisor Event**: Membutuhkan dashboard web untuk mengelola menu/katalog multi-tenant (Let's Go Gelato dan Terve), mengelola akun kasir, menyetujui pembatalan/void transaksi dengan One-Time Password (OTP) / PIN, serta melihat laporan rekapitulasi omzet secara real-time.

### 3.3.3 Hasil Analisis Kebutuhan Fungsionalitas

Berikut adalah kebutuhan fungsionalitas sistem yang diusulkan:
- **F01**: Sistem dapat melakukan inisialisasi POS dan Opening Shift.
- **F02**: Sistem dapat melakukan transaksi penjualan (tunai dan non-tunai) dan menyimpan draf transaksi secara lokal (SQLite) ketika offline.
- **F03**: Sistem dapat mengelola proses Shift Handover dengan perhitungan cash drawer.
- **F04**: Sistem dapat menjeda sesi (pause) dan melakukan Switch Kasir.
- **F05**: Sistem dapat membatalkan transaksi (Void) dengan otorisasi (OTP/PIN) dari Admin.
- **F06**: Sistem dapat mengatur koneksi Bluetooth Thermal Printer.
- **F07**: Sistem web admin dapat mengelola Master Data (Menu, Kategori, Cabang, Multi-Tenant).
- **F08**: Sistem web admin dapat melihat Laporan Rekapitulasi Omzet.

3.4 Perancangan Sistem Baru
---------------------------

### 3.4.1 Use Case Diagram

Use Case Diagram menggambarkan interaksi antara aktor (Kasir dan Admin) dengan sistem PosEventKasir.
- **Aktor Kasir**: Melakukan Login, Inisialisasi Shift, Transaksi Penjualan, Jeda Sesi, Void Transaksi (meminta OTP), Pengaturan Printer, dan Shift Handover.
- **Aktor Admin**: Melakukan Login, Kelola Multi-Tenant, Kelola Menu, Kelola Akun Kasir, Memberikan OTP Void, dan Melihat Laporan.

### 3.4.2 Skenario Use Case

**Skenario Melakukan Transaksi Penjualan:**
1. Kasir memilih menu dari katalog yang tersedia (berdasarkan tenant/brand yang sedang aktif).
2. Kasir menambahkan menu ke dalam keranjang pesanan.
3. Sistem menghitung total harga (termasuk pajak jika ada).
4. Kasir memilih metode pembayaran (Tunai, QRIS, dll).
5. Sistem memproses pembayaran, menyimpan data transaksi (ke SQLite jika offline, MySQL jika online), dan mencetak struk melalui Bluetooth Printer.

**Skenario Void Transaksi (OTP Admin):**
1. Kasir memilih transaksi yang sudah berhasil (Lunas) untuk dibatalkan.
2. Sistem meminta input PIN/OTP Otorisasi Admin.
3. Kasir memasukkan PIN/OTP yang diberikan oleh Supervisor/Admin.
4. Sistem memverifikasi PIN/OTP. Jika valid, status transaksi diubah menjadi "Void" dan alasan pembatalan dicatat di audit_logs.

### 3.4.3 Activity Diagram

Activity Diagram merincikan alur kerja bisnis utama, salah satunya adalah **Activity Diagram Transaksi Event**:
Kasir Mulai -> Pilih Tenant/Brand -> Pilih Menu -> Masuk Keranjang -> Proses Checkout -> Pilih Metode Pembayaran -> Bayar -> Cetak Struk via Bluetooth -> Selesai.

### 3.4.4 Sequence Diagram

**Sequence Diagram Shift Handover:**
1. Kasir memilih menu Closing/Handover Shift di aplikasi mobile.
2. Aplikasi mengumpulkan total penjualan shift tersebut (Cash, QRIS, dsb).
3. Kasir memasukkan actual cash yang ada di laci (Cash Drawer).
4. Aplikasi mengirimkan data `shift_session` dan `shift_operator_logs` ke backend Laravel.
5. Backend Laravel memvalidasi dan menyimpan data, lalu mengembalikan status "Berhasil".
6. Sesi kasir saat ini ditutup.

### 3.4.5 Class Diagram

Class diagram mendeskripsikan struktur kelas pada backend aplikasi, yang diimplementasikan melalui model Eloquent di Laravel. Kelas utama meliputi `User`, `Cabang`, `Menu`, `Kategori`, `Transaksi`, `TransaksiDetail`, `ShiftSession`, dan `AuditLog`. Relasi multi-tenant diatur melalui kelas `Cabang` yang mengelompokkan menu dan transaksi ke dalam Let's Go Gelato atau Terve.

### 3.4.6 Entity Relationship Diagram (ERD)

ERD mendefinisikan struktur database relasional (MySQL) yang terdiri dari 16 entitas utama:
1. `role_user`: Hak akses pengguna (Admin, Kasir).
2. `user`: Data pengguna/kasir.
3. `cabang`: Data tenant (Let's Go Gelato, Terve).
4. `kategori` & `sub_kategori`: Pengelompokan produk.
5. `menu`: Data produk F&B.
6. `menu_template`: Template harga khusus event/cabang tertentu.
7. `promosi`: Data diskon atau promo.
8. `metode_pembayaran`: Tunai, QRIS, EDC.
9. `sales_mode`: Dine-in, Take-away.
10. `transaksi` & `transaksi_detail`: Header dan detail transaksi penjualan.
11. `shift_session`: Sesi buka dan tutup kasir.
12. `shift_operator_logs`: Log perpindahan atau pergantian kasir.
13. `audit_logs`: Pencatatan aktivitas krusial seperti Void transaksi.
14. `password_reset_tokens`: Keamanan reset kata sandi.

### 3.4.7 Perancangan Antarmuka

Antarmuka dirancang untuk dua platform:
1. **Mobile Kasir (React Native)**: Tampilan UI/UX mengutamakan responsivitas untuk layar tablet dan smartphone. Halaman meliputi: Halaman Login Kasir, Dashboard Katalog Menu, Keranjang Pesanan, Modal Checkout Pembayaran, Halaman Manajemen Shift, dan Halaman Pengaturan Printer.
2. **Web Dashboard Admin (Laravel)**: Tampilan UI web-based untuk manajemen backend. Halaman meliputi: Dashboard Analitik, Manajemen Tenant/Cabang, Manajemen Katalog Produk, Kelola Akun Pengguna, dan Laporan Rekapitulasi Omzet.


BAB IV. IMPLEMENTASI DAN PENGUJIAN
==================================

4.1 Implementasi Sistem
-----------------------

Tahap implementasi merupakan penerjemahan dari perancangan sistem ke dalam kode program yang sesungguhnya. Sistem PosEventKasir dibangun menggunakan teknologi yang berbeda untuk sisi mobile frontend dan backend web.

### 4.1.1 Antarmuka Sistem

Implementasi antarmuka terdiri dari dua bagian utama:
1. **Aplikasi Mobile Kasir (React Native):**
   - **Halaman Login & Inisialisasi Shift**: Tempat kasir memasukkan kredensial login dan mendeklarasikan modal awal uang tunai (starting cash) untuk shift tersebut.
   - **Halaman Katalog (Point of Sale)**: Menampilkan menu-menu dari Let's Go Gelato atau Terve dalam bentuk grid yang dinamis. Terdapat fitur pencarian dan filter kategori.
   - **Halaman Checkout**: Menampilkan rincian pesanan dan pilihan metode pembayaran. Jika perangkat dalam kondisi offline, transaksi disimpan sementara pada database SQLite lokal.
   - **Halaman Pengaturan Printer**: Fitur untuk melakukan pemindaian (scanning) perangkat Bluetooth di sekitar, melakukan pairing, dan menghubungkannya untuk mencetak struk dengan protokol ESC/POS.

2. **Web Dashboard Admin (Laravel):**
   - **Dashboard Omzet**: Menampilkan grafik pendapatan harian, perbandingan transaksi antar-tenant (Let's Go Gelato vs Terve), dan jumlah transaksi.
   - **Halaman Manajemen Master Data**: Antarmuka untuk melakukan operasi CRUD (Create, Read, Update, Delete) pada data Menu, Kategori, Cabang, dan User.
   - **Halaman Laporan & Audit Logs**: Memonitor riwayat serah terima kasir (shift_operator_logs) dan melihat daftar transaksi yang telah dibatalkan beserta alasannya (audit_logs).

### 4.1.2 Basis Data

Implementasi basis data dilakukan pada lingkungan RDBMS MySQL v8.0 untuk server pusat. Skema database dibangun menggunakan fitur _migration_ bawaan Laravel, yang menciptakan 16 tabel yang saling berelasi sesuai ERD yang dirancang (seperti tabel `transaksi`, `transaksi_detail`, `cabang`, `menu`, `shift_session`, dll). 
Di sisi klien mobile, SQLite digunakan untuk menyalin katalog menu secara lokal (offline buffer) dan menyimpan transaksi draf jika tidak ada koneksi internet. Ketika konektivitas kembali normal, sebuah _background service_ (SyncManager) akan menyelaraskan data transaksi SQLite ke server MySQL melalui RESTful API.

4.2 Pengujian Sistem
--------------------

### 4.2.1 Tahapan Pengujian

Pengujian dilakukan untuk menjamin kualitas perangkat lunak yang telah dibangun. Pengujian dilakukan melalui dua pendekatan, yaitu Black Box Testing untuk fungsionalitas dan User Acceptance Test (UAT) untuk kepuasan pengguna akhir.

### 4.2.2 Tujuan Pengujian

Tujuan dari pengujian adalah memastikan bahwa seluruh alur kerja operasional kasir (mulai dari inisialisasi shift, checkout, cetak struk, hingga closing shift) berjalan tanpa kendala, dan sistem web admin berhasil memisahkan data tenant dengan benar.

### 4.2.3 Kategori Hasil Pengujian

Kategori hasil pengujian dibedakan menjadi dua:
- **Valid/Berhasil**: Jika sistem merespons dan memberikan hasil keluaran sesuai dengan skenario yang diharapkan.
- **Tidak Valid/Gagal**: Jika sistem menunjukkan perilaku yang salah atau _error_ tidak terduga.

### 4.2.4 Skenario Pengujian (Black Box Testing)

Beberapa skenario pengujian fungsional meliputi:
1. **Skenario Login Kasir dan Buka Shift**: Menguji validasi login dan memastikan sesi shift baru terbuka di database.
2. **Skenario Checkout Transaksi Mode Offline**: Memutuskan koneksi WiFi/Data, melakukan checkout, dan memastikan transaksi masuk ke database SQLite lokal. Menyalakan koneksi kembali dan memastikan transaksi berhasil tersinkronisasi ke server.
3. **Skenario Pencetakan Struk (Bluetooth ESC/POS)**: Menguji pairing dengan Thermal Printer Bluetooth dan mencetak struk belanja. Memastikan teks terformat dengan baik.
4. **Skenario Void Transaksi (OTP Admin)**: Mencoba melakukan Void tanpa OTP (harus ditolak), kemudian memasukkan OTP yang sah dari Admin (harus berhasil dan tercatat di `audit_logs`).
5. **Skenario Kelola Menu Multi-Tenant**: Menguji penambahan menu baru pada cabang Let's Go Gelato melalui web admin, lalu memastikan menu tersebut tidak muncul pada antarmuka kasir yang sedang login di cabang Terve.

### 4.2.5 Hasil Pengujian

Berdasarkan pengujian Black Box Testing, seluruh fitur fungsional telah berjalan dengan **Valid**. Sistem mampu menyimpan transaksi secara offline, menyinkronkan data dengan baik, melakukan pencetakan nirkabel tanpa delay yang signifikan, serta mengamankan pembatalan transaksi dengan mekanisme OTP.

### 4.2.6 User Acceptance Test (UAT)

UAT dilakukan dengan melibatkan operator kasir dan supervisor Let's Go Gelato dan Terve secara langsung di lapangan (field testing). Hasil survei UAT menunjukkan bahwa pengguna merasa aplikasi mobile (React Native) sangat responsif dan lebih praktis untuk event dibandingkan sistem desktop. Fitur shift handover dan verifikasi cash drawer dinilai sangat membantu mencegah selisih pendapatan kas akhir hari.


BAB V. KESIMPULAN DAN SARAN
===========================

5.1 Kesimpulan
--------------

Berdasarkan hasil perancangan, implementasi, dan pengujian Aplikasi Point of Sale (POS) untuk Pengelolaan Transaksi Event (PosEventKasir) di Let's Go Gelato dan Terve, dapat ditarik beberapa kesimpulan sebagai berikut:
1. Pengembangan aplikasi POS berbasis mobile menggunakan React Native telah berhasil meningkatkan mobilitas kasir di lokasi event atau pop-up booth, yang sebelumnya terhambat oleh besarnya perangkat keras desktop kasir konvensional.
2. Integrasi arsitektur multi-tenant dengan RESTful API Laravel dan database MySQL telah berhasil memisahkan data transaksi dan pengelolaan katalog menu antara Let's Go Gelato dan Terve secara terisolasi dan aman.
3. Fitur sinkronisasi offline (buffer) menggunakan SQLite memastikan transaksi kasir dapat terus berjalan saat terjadi gangguan jaringan internet di area event yang padat, lalu otomatis dikirimkan ke server ketika koneksi kembali pulih.
4. Fitur shift handover dan void otorisasi dengan OTP/PIN secara terbukti meminimalisasi risiko kecurangan (fraud) dan membantu mengatasi selisih jumlah uang tunai saat tutup shift kasir.
5. Konektivitas langsung ke Bluetooth Thermal Printer dengan protokol ESC/POS memfasilitasi pencetakan bukti pembayaran nirkabel dengan cepat dan handal.

5.2 Saran
---------

Beberapa saran untuk pengembangan sistem ini di masa mendatang adalah:
1. Mengintegrasikan aplikasi POS Event ini dengan sistem pemesanan online (seperti platform GoFood, GrabFood, atau ShopeeFood) agar pesanan dapat langsung masuk dan diproses pada satu sistem terpusat.
2. Menambahkan fitur manajemen stok inventori bahan baku (raw materials) dan _recipe management_ untuk memotong ketersediaan bahan secara otomatis (auto-deduct) setiap kali transaksi berhasil.
3. Mengembangkan modul _Customer Relationship Management_ (CRM) dan loyalty point system pada aplikasi untuk memberikan potongan harga khusus bagi pelanggan setia Let's Go Gelato dan Terve.

DAFTAR PUSTAKA
==============

[1] T. A. Inzaghi and R. M. S. P. Pratama, "Rancang Bangun Sistem Informasi POS Kantin Berbasis Web Menggunakan Laravel," _J. Sist. Inf. dan Inform._, vol. 5, no. 1, pp. 140-152, 2026.
[2] L. Hartono, "Perancangan Aplikasi Point of Sale Mobile Menggunakan React Native," _Jurnal Ilmu Komputer dan Informatika_, vol. 12, no. 2, pp. 45-53, 2024.
[3] M. R. Abdulatif, "Analisis Kebutuhan Sistem Informasi Multi-Tenant pada Industri F&B," _Terap. Inform. Nusant._, vol. 6, no. 8, pp. 1421-1433, 2026.
[4] Yesputra, Rolly, Marpaung Nasrun, "Penerapan Arsitektur Model View Contoller (MVC) Pada RESTful API," 2018.
[5] A. K. Rahmatika, "Pengembangan Sinkronisasi Data Offline-First Berbasis SQLite pada Sistem Kasir Bergerak," _J. Pengemb. Teknol. Inf. dan Ilmu Komput._, vol. 4, no. 8, pp. 2655-2663, 2020.
[6] E. Hartati, "Sistem Informasi Transaksi Kasir," _Ilmu Komput._, vol. 3, no. 1, p. 16, 2022.
[7] FHERY AGUSTIN, "Pelatihan Penggunaan Database MySQL Berbasis phpMyAdmin pada Kasir Toko," _Publ. Pengadian Masy._, vol. 3, no. 1, pp. 97-109, 2024.
[8] S. Ramdany, "Penerapan UML Class Diagram dalam Perancangan Sistem Informasi Point of Sale," _J. Ind. Eng. Syst._, vol. 5, no. 1, 2024.
[9] N. A. Murani, "Analisis Penggunaan Visual Studio Code Sebagai Editor Pemrograman Terbaik Untuk Pemula," _J. Rekayasa Inform._, vol. 2, no. 2, pp. 1-10, 2025.

LAMPIRAN
========

Tabel Uji Fungsionalitas Aplikasi POS Event

| No | Fitur | Skenario Uji | Hasil Yang Diharapkan | Hasil Pengujian |
|---|---|---|---|---|
| 1 | Login Kasir | Kasir memasukkan email dan password valid | Sistem menampilkan halaman Dashboard Katalog Menu | Valid / Sesuai |
| 2 | Opening Shift | Kasir memasukkan nominal modal awal (starting cash) | Sistem merekam shift baru dan membuka akses transaksi | Valid / Sesuai |
| 3 | Checkout Transaksi | Kasir memproses keranjang pesanan hingga bayar | Sistem menyimpan transaksi dan men-trigger cetak struk | Valid / Sesuai |
| 4 | Offline Mode | Kasir memproses checkout tanpa jaringan internet | Transaksi disimpan di SQLite dan disinkronisasi ketika online | Valid / Sesuai |
| 5 | Void Transaksi | Kasir membatalkan nota transaksi tanpa OTP | Sistem menolak pembatalan | Valid / Sesuai |
| 6 | Void Transaksi (OTP) | Kasir membatalkan nota transaksi dengan OTP Admin | Transaksi berhasil di-void dan dicatat di audit_logs | Valid / Sesuai |
| 7 | Koneksi Printer | Kasir memilih perangkat printer Bluetooth dari daftar | Perangkat terkoneksi dan mencetak struk _test page_ | Valid / Sesuai |
| 8 | Closing Shift | Kasir memasukkan total uang fisik di laci kasir | Sistem mengirim data handover ke server dan me-logout kasir | Valid / Sesuai |
| 9 | Kelola Multi-Tenant | Admin web menambahkan menu khusus untuk Terve | Menu baru tidak muncul di aplikasi kasir Let's Go Gelato | Valid / Sesuai |
| 10 | Dashboard Omzet | Admin melihat halaman Laporan Penjualan Harian | Sistem menampilkan grafik omzet yang akurat dari MySQL | Valid / Sesuai |

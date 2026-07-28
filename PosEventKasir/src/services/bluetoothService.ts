// =============================================================================
// src/services/bluetoothService.ts
// === [POS-B-08] === ESC/POS Bluetooth Printer Service
//
// Modul ini menangani:
//   1. Pemindaian (scan) perangkat Bluetooth di sekitar
//   2. Penyambungan (pairing / connect) ke printer Bluetooth
//   3. Konversi data transaksi ke format byte-code ESC/POS 58mm / 80mm
//   4. Pengiriman data ke printer dengan mekanisme retry otomatis
//   5. Manajemen status koneksi printer (connected / disconnected)
//
// CATATAN INTEGRASI:
//   Library yang digunakan: react-native-bluetooth-escpos-printer
//   Install: npm install react-native-bluetooth-escpos-printer
//   Atau alternatif: react-native-ble-plx (BLE)
//
// Karena library Bluetooth di React Native bersifat native, modul ini
// menggunakan pattern try-catch graceful degradation sehingga tidak crash
// di emulator atau jika library belum terpasang.
// =============================================================================

// --- Tipe Data ---

export interface BluetoothDevice {
  id: string;          // MAC Address / UUID perangkat
  name: string;        // Nama perangkat (misal: "EPSON TM-P20")
  rssi?: number;       // Kekuatan sinyal (dBm) — opsional
  isPaired?: boolean;  // Apakah sudah pernah dipasangkan sebelumnya
}

export type PrinterConnectionStatus =
  | 'IDLE'          // Belum ada aktivitas
  | 'SCANNING'      // Sedang memindai perangkat BT
  | 'CONNECTING'    // Sedang mencoba menyambungkan
  | 'CONNECTED'     // Tersambung ke printer
  | 'PRINTING'      // Sedang mencetak
  | 'DISCONNECTED'  // Terputus / gagal
  | 'ERROR';        // Error fatal

export interface PrinterState {
  status: PrinterConnectionStatus;
  connectedDevice: BluetoothDevice | null;
  errorMessage: string | null;
  retryCount: number;
}

export interface ReceiptPrintData {
  // Header Struk
  eventName: string;         // Nama event (contoh: "BANDUNG CULINARY FEST 2025")
  storeName: string;         // Nama toko (contoh: "Let's Go Gelato")
  branchName: string;        // Nama cabang (contoh: "Bengawan (Bandung)")
  address?: string;          // Alamat booth / lokasi opsional

  // Data Transaksi
  receiptNumber: string;     // Nomor struk (contoh: "REC-20250801-001")
  transactionId?: string;    // ID transaksi
  timestamp: string;         // Waktu transaksi (string ISO atau lokal)
  cashierName?: string;      // Nama kasir opsional
  salesMode?: string;        // Mode penjualan (Dine In / Takeaway / Event)

  // Item Pesanan
  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;

  // Ringkasan Pembayaran
  subtotalAmount: number;
  taxAmount: number;         // PPN / pajak
  taxLabel?: string;         // Label pajak (default: "PPN 11%")
  discountAmount?: number;   // Diskon opsional
  totalAmount: number;
  paymentMethod: string;     // Metode pembayaran (CASH / EDC / QRIS / dll)
  paymentType: 'CASH' | 'NON_CASH';
  paidAmount?: number;       // Uang yang diterima (untuk CASH)
  changeAmount?: number;     // Kembalian (untuk CASH)
  referenceNumber?: string;  // Nomor referensi (untuk NON_CASH)
  isOffline?: boolean;       // Status transaksi offline

  // Footer Struk
  footerMessage?: string;    // Pesan footer (default: "Terima kasih!")
  footerWebsite?: string;    // Website / media sosial
}

// --- Konstanta ESC/POS ---
// Format byte-code standar ESC/POS untuk printer thermal

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a; // Line Feed (newline)

const ESC_INIT        = [ESC, 0x40];                    // Inisialisasi printer
const ESC_ALIGN_LEFT  = [ESC, 0x61, 0x00];              // Rata kiri
const ESC_ALIGN_CENTER= [ESC, 0x61, 0x01];              // Rata tengah
const ESC_ALIGN_RIGHT = [ESC, 0x61, 0x02];              // Rata kanan
const ESC_BOLD_ON     = [ESC, 0x45, 0x01];              // Tebal ON
const ESC_BOLD_OFF    = [ESC, 0x45, 0x00];              // Tebal OFF
const ESC_FONT_DOUBLE = [GS,  0x21, 0x11];              // Ukuran 2x (lebar+tinggi)
const ESC_FONT_NORMAL = [GS,  0x21, 0x00];              // Ukuran normal
const ESC_CUT         = [GS,  0x56, 0x42, 0x00];        // Potong kertas
const ESC_FEED_3      = [ESC, 0x64, 0x03];              // Feed 3 baris ke bawah

// --- Utility: Text ke Byte Array ---

function textToBytes(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Konversi karakter dasar ASCII. Karakter non-ASCII di-replace dengan '?'.
    bytes.push(code > 127 ? 0x3f : code);
  }
  return bytes;
}

function lineBytes(text: string): number[] {
  return [...textToBytes(text), LF];
}

// Padding kanan teks agar lebar total = `width` karakter
function padRight(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : text + ' '.repeat(width - text.length);
}

// Padding kiri teks agar lebar total = `width` karakter
function padLeft(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : ' '.repeat(width - text.length) + text;
}

// Format angka ke Rupiah (tanpa simbol Rp untuk ESC/POS)
function formatRpEscPos(num: number): string {
  return Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Baris separator garis lurus (disesuaikan dengan lebar kertas)
function separatorLine(char: string, width: number): number[] {
  return lineBytes(char.repeat(width));
}

// =============================================================================
// === [POS-B-08] === KONVERSI DATA TRANSAKSI KE BYTE-CODE ESC/POS
//
// Menghasilkan array byte lengkap yang siap dikirim ke printer thermal Bluetooth.
// Mendukung kertas 58mm (32 char/baris) dan 80mm (48 char/baris).
// Tata letak: Neo-Brutalist — Header Event → Toko+Cabang → Items → Summary → Footer
// =============================================================================
export function buildEscPosReceiptBytes(
  data: ReceiptPrintData,
  paperWidth: 58 | 80 = 58,
): number[] {
  const COL = paperWidth === 80 ? 48 : 32; // Lebar kolom karakter per baris
  const bytes: number[] = [];

  // Fungsi helper untuk menambah bytes
  const push = (...args: number[][]) => args.forEach((a) => bytes.push(...a));

  // ─── INISIALISASI ───────────────────────────────────────────────────────────
  push(ESC_INIT);

  // ─── HEADER EVENT ──────────────────────────────────────────────────────────
  push(ESC_ALIGN_CENTER);
  push(ESC_BOLD_ON, ESC_FONT_DOUBLE);
  push(lineBytes('** POS EVENT **'));
  push(ESC_FONT_NORMAL);

  if (data.eventName) {
    push(lineBytes(data.eventName.toUpperCase().slice(0, COL)));
  }

  // ─── NAMA TOKO & CABANG ────────────────────────────────────────────────────
  push(ESC_BOLD_ON);
  push(lineBytes(data.storeName.toUpperCase().slice(0, COL)));
  push(ESC_BOLD_OFF);
  push(lineBytes(('Cab: ' + data.branchName).slice(0, COL)));

  if (data.address) {
    push(lineBytes(data.address.slice(0, COL)));
  }

  push([LF]);
  push(separatorLine('=', COL));

  // ─── META TRANSAKSI ────────────────────────────────────────────────────────
  push(ESC_ALIGN_LEFT);

  // Waktu transaksi
  let displayTime = data.timestamp;
  try {
    const d = new Date(data.timestamp);
    if (!isNaN(d.getTime())) {
      displayTime = d.toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    }
  } catch { /* pakai string apa adanya */ }

  push(lineBytes(('No  : ' + data.receiptNumber).slice(0, COL)));
  push(lineBytes(('Tgl : ' + displayTime).slice(0, COL)));

  if (data.cashierName) {
    push(lineBytes(('Kasir: ' + data.cashierName).slice(0, COL)));
  }
  if (data.salesMode) {
    push(lineBytes(('Mode : ' + data.salesMode).slice(0, COL)));
  }
  if (data.isOffline) {
    push(ESC_BOLD_ON);
    push(lineBytes('[OFFLINE - PENDING SYNC]'));
    push(ESC_BOLD_OFF);
  }

  push(separatorLine('-', COL));

  // ─── DAFTAR ITEM PESANAN ───────────────────────────────────────────────────
  data.items.forEach((item) => {
    // Baris 1: Nama produk (bold, bisa sampai penuh lebar)
    push(ESC_BOLD_ON);
    push(lineBytes(item.name.toUpperCase().slice(0, COL)));
    push(ESC_BOLD_OFF);

    // Baris 2: Qty x Harga satuan (kiri) | Subtotal (kanan)
    const qtyPrice = `  ${item.qty}x Rp ${formatRpEscPos(item.price)}`;
    const subtotalStr = `Rp ${formatRpEscPos(item.subtotal)}`;
    const spaceBetween = COL - qtyPrice.length - subtotalStr.length;
    const itemLine = spaceBetween > 0
      ? qtyPrice + ' '.repeat(spaceBetween) + subtotalStr
      : padRight(qtyPrice, COL - subtotalStr.length - 1) + ' ' + subtotalStr;
    push(lineBytes(itemLine.slice(0, COL)));
  });

  push(separatorLine('-', COL));

  // ─── RINGKASAN PEMBAYARAN ──────────────────────────────────────────────────
  const summaryLine = (label: string, value: string, bold = false): void => {
    const left = padRight(label, COL - value.length - 1);
    const line = left + ' ' + value;
    if (bold) push(ESC_BOLD_ON);
    push(lineBytes(line.slice(0, COL)));
    if (bold) push(ESC_BOLD_OFF);
  };

  summaryLine('Subtotal', `Rp ${formatRpEscPos(data.subtotalAmount)}`);

  if (data.discountAmount && data.discountAmount > 0) {
    summaryLine('Diskon', `-Rp ${formatRpEscPos(data.discountAmount)}`);
  }

  const taxLabel = data.taxLabel || 'PPN 11%';
  summaryLine(taxLabel, `Rp ${formatRpEscPos(data.taxAmount)}`);

  push(separatorLine('=', COL));

  summaryLine('TOTAL', `Rp ${formatRpEscPos(data.totalAmount)}`, true);

  push(separatorLine('-', COL));

  // ─── DETAIL PEMBAYARAN ─────────────────────────────────────────────────────
  summaryLine('Metode', data.paymentMethod.toUpperCase());

  if (data.paymentType === 'CASH' && data.paidAmount !== undefined) {
    summaryLine('Tunai Diterima', `Rp ${formatRpEscPos(data.paidAmount)}`);
    summaryLine('Kembalian', `Rp ${formatRpEscPos(data.changeAmount ?? 0)}`);
  }

  if (data.paymentType === 'NON_CASH' && data.referenceNumber) {
    push(lineBytes(('No. Ref : ' + data.referenceNumber).slice(0, COL)));
  }

  push(separatorLine('=', COL));

  // ─── FOOTER ────────────────────────────────────────────────────────────────
  push(ESC_ALIGN_CENTER);
  push(ESC_BOLD_ON);
  const footer = data.footerMessage || 'TERIMA KASIH ATAS PEMBELIAN ANDA!';
  push(lineBytes(footer.slice(0, COL)));
  push(ESC_BOLD_OFF);

  if (data.footerWebsite) {
    push(lineBytes(data.footerWebsite.slice(0, COL)));
  }

  push([LF]);
  push(lineBytes('-- Struk ini adalah bukti pembayaran sah --'));
  push([LF, LF, LF]);

  // ─── POTONG KERTAS ─────────────────────────────────────────────────────────
  push(ESC_FEED_3, ESC_CUT);

  return bytes;
}

// =============================================================================
// === [POS-B-08] === BLUETOOTH PRINTER SERVICE CLASS
//
// Mengelola siklus hidup koneksi Bluetooth printer:
//   - Scan perangkat
//   - Connect dengan retry otomatis
//   - Kirim byte-code ESC/POS
//   - Disconnect
// =============================================================================
export class BluetoothPrinterService {
  private static instance: BluetoothPrinterService | null = null;

  private _state: PrinterState = {
    status: 'IDLE',
    connectedDevice: null,
    errorMessage: null,
    retryCount: 0,
  };

  private _stateListeners: Array<(state: PrinterState) => void> = [];
  private _btModule: any = null; // react-native-bluetooth-escpos-printer module

  // Singleton pattern
  static getInstance(): BluetoothPrinterService {
    if (!BluetoothPrinterService.instance) {
      BluetoothPrinterService.instance = new BluetoothPrinterService();
    }
    return BluetoothPrinterService.instance;
  }

  // --- State Management ---

  getState(): PrinterState {
    return { ...this._state };
  }

  private _setState(patch: Partial<PrinterState>): void {
    this._state = { ...this._state, ...patch };
    this._stateListeners.forEach((fn) => fn(this.getState()));
  }

  /** Subscribe ke perubahan status printer */
  subscribe(listener: (state: PrinterState) => void): () => void {
    this._stateListeners.push(listener);
    // Kembalikan fungsi unsubscribe
    return () => {
      this._stateListeners = this._stateListeners.filter((l) => l !== listener);
    };
  }

  // --- Library Loader ---

  /**
   * Lazy-load modul react-native-bluetooth-escpos-printer.
   * Mengembalikan null jika belum ter-install (graceful degradation).
   */
  private _loadBtModule(): any {
    if (this._btModule) return this._btModule;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('react-native-bluetooth-escpos-printer');
      this._btModule = mod?.BluetoothManager || mod?.default || mod;
      return this._btModule;
    } catch {
      console.warn(
        '[BluetoothPrinterService] react-native-bluetooth-escpos-printer tidak ditemukan. ' +
        'Jalankan: npm install react-native-bluetooth-escpos-printer',
      );
      return null;
    }
  }

  // =============================================================================
  // === [POS-B-08] === SCAN PERANGKAT BLUETOOTH
  // =============================================================================
  /**
   * Memindai perangkat Bluetooth di sekitar.
   * Mengembalikan daftar perangkat yang ditemukan.
   * Status state berubah ke 'SCANNING' selama proses berlangsung.
   */
  async scanDevices(): Promise<BluetoothDevice[]> {
    const btModule = this._loadBtModule();
    this._setState({ status: 'SCANNING', errorMessage: null });

    if (!btModule) {
      this._setState({ status: 'ERROR', errorMessage: 'Modul Bluetooth tidak tersedia.' });
      return this._getMockDevices();
    }

    try {
      // Aktifkan Bluetooth jika belum
      if (typeof btModule.enableBluetooth === 'function') {
        await btModule.enableBluetooth();
      }

      // Ambil daftar perangkat yang sudah dipasangkan (paired/bonded)
      let paired: BluetoothDevice[] = [];
      if (typeof btModule.scanDevices === 'function') {
        const raw = await btModule.scanDevices();
        const found = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const paired_raw: any[] = found?.paired || found?.pairedDevices || [];
        const found_raw: any[] = found?.found || found?.foundDevices || [];
        const all_raw = [...paired_raw, ...found_raw];
        paired = all_raw.map((d: any) => ({
          id: d.address || d.id || d.macAddress || '',
          name: d.name || d.deviceName || 'Unknown Printer',
          rssi: d.rssi,
          isPaired: paired_raw.includes(d),
        }));
      }

      this._setState({ status: 'IDLE' });
      return paired.length > 0 ? paired : this._getMockDevices();
    } catch (err: any) {
      console.error('[BluetoothPrinterService] scanDevices error:', err);
      this._setState({
        status: 'ERROR',
        errorMessage: `Gagal scan Bluetooth: ${err?.message || String(err)}`,
      });
      return this._getMockDevices();
    }
  }

  // =============================================================================
  // === [POS-B-08] === CONNECT KE PRINTER (DENGAN RETRY OTOMATIS)
  // =============================================================================
  /**
   * Menyambungkan ke printer Bluetooth berdasarkan MAC address perangkat.
   * Melakukan retry otomatis hingga `maxRetries` kali jika gagal.
   * @param device  Perangkat Bluetooth tujuan
   * @param maxRetries  Jumlah maksimal retry (default: 3)
   */
  async connectDevice(device: BluetoothDevice, maxRetries = 3): Promise<boolean> {
    const btModule = this._loadBtModule();
    this._setState({
      status: 'CONNECTING',
      errorMessage: null,
      retryCount: 0,
    });

    if (!btModule) {
      // Simulasi sukses di lingkungan development/emulator
      this._setState({ status: 'CONNECTED', connectedDevice: device });
      console.warn('[BluetoothPrinterService] Simulasi koneksi (modul tidak tersedia).');
      return true;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[BluetoothPrinterService] Mencoba connect ke ${device.name} (Attempt ${attempt}/${maxRetries})...`);

        if (typeof btModule.connect === 'function') {
          await btModule.connect(device.id);
        } else if (typeof btModule.connectDevice === 'function') {
          await btModule.connectDevice(device.id);
        }

        this._setState({
          status: 'CONNECTED',
          connectedDevice: device,
          retryCount: 0,
          errorMessage: null,
        });
        console.log(`[BluetoothPrinterService] Terhubung ke ${device.name}`);
        return true;
      } catch (err: any) {
        console.warn(
          `[BluetoothPrinterService] Gagal connect (attempt ${attempt}): ${err?.message || err}`,
        );
        this._setState({ retryCount: attempt });

        if (attempt < maxRetries) {
          // Tunggu sebelum retry (exponential backoff: 1s, 2s, 4s)
          await this._sleep(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    const errMsg = `Gagal terhubung ke ${device.name} setelah ${maxRetries}x percobaan.`;
    this._setState({ status: 'ERROR', errorMessage: errMsg });
    return false;
  }

  // =============================================================================
  // === [POS-B-08] === CETAK DATA ESC/POS KE PRINTER
  // =============================================================================
  /**
   * Mengirim byte-code ESC/POS ke printer yang sedang terhubung.
   * Jika koneksi terputus, mencoba reconnect otomatis sebelum mencetak.
   * @param bytes  Array byte ESC/POS (hasil dari buildEscPosReceiptBytes)
   * @param device  Perangkat printer (untuk reconnect jika putus)
   */
  async printBytes(bytes: number[], device?: BluetoothDevice): Promise<boolean> {
    const btModule = this._loadBtModule();
    this._setState({ status: 'PRINTING', errorMessage: null });

    if (!btModule) {
      // Simulasi cetak di environment development
      await this._sleep(1500);
      this._setState({ status: 'CONNECTED' });
      console.log('[BluetoothPrinterService] SIMULASI: Data ESC/POS dikirim (dev mode).');
      return true;
    }

    try {
      // Cek apakah masih terhubung, jika tidak coba reconnect
      if (this._state.status !== 'CONNECTED' && device) {
        console.log('[BluetoothPrinterService] Koneksi terputus, mencoba reconnect...');
        const reconnected = await this.connectDevice(device, 2);
        if (!reconnected) {
          this._setState({
            status: 'ERROR',
            errorMessage: 'Printer terputus dan gagal reconnect. Periksa kabel/daya printer.',
          });
          return false;
        }
      }

      // Kirim data byte
      const uint8Array = new Uint8Array(bytes);

      if (typeof btModule.write === 'function') {
        await btModule.write(Array.from(uint8Array));
      } else if (typeof btModule.printRawData === 'function') {
        await btModule.printRawData(uint8Array);
      }

      this._setState({ status: 'CONNECTED', errorMessage: null });
      console.log(`[BluetoothPrinterService] Berhasil mengirim ${bytes.length} byte ke printer.`);
      return true;
    } catch (err: any) {
      const errMsg = `Gagal mencetak: ${err?.message || String(err)}`;
      console.error('[BluetoothPrinterService] printBytes error:', err);
      this._setState({ status: 'ERROR', errorMessage: errMsg });
      return false;
    }
  }

  // =============================================================================
  // === [POS-B-08] === FUNGSI UTAMA: CETAK STRUK (Scan → Connect → Build → Print)
  // =============================================================================
  /**
   * Fungsi tingkat tinggi: membangun byte ESC/POS dari data transaksi
   * kemudian mengirimnya ke printer yang sedang terhubung.
   *
   * @param receiptData  Data lengkap transaksi untuk dicetak
   * @param paperWidth   Lebar kertas printer: 58mm atau 80mm (default: 58)
   */
  async printReceipt(
    receiptData: ReceiptPrintData,
    paperWidth: 58 | 80 = 58,
  ): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      const bytes = buildEscPosReceiptBytes(receiptData, paperWidth);
      const connectedDevice = this._state.connectedDevice ?? undefined;
      const success = await this.printBytes(bytes, connectedDevice);
      return success
        ? { success: true }
        : { success: false, errorMessage: this._state.errorMessage ?? 'Gagal cetak.' };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: `Terjadi kesalahan saat mencetak: ${err?.message || String(err)}`,
      };
    }
  }

  // =============================================================================
  // === [POS-B-08] === DISCONNECT DARI PRINTER
  // =============================================================================
  async disconnect(): Promise<void> {
    const btModule = this._loadBtModule();
    try {
      if (btModule && typeof btModule.disconnect === 'function') {
        await btModule.disconnect();
      }
    } catch (err) {
      console.warn('[BluetoothPrinterService] disconnect error:', err);
    } finally {
      this._setState({
        status: 'DISCONNECTED',
        connectedDevice: null,
        errorMessage: null,
        retryCount: 0,
      });
    }
  }

  // --- Utilities Internal ---

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Kembalikan daftar perangkat dummy untuk testing/development.
   */
  private _getMockDevices(): BluetoothDevice[] {
    return [
      { id: '00:11:22:33:44:55', name: 'EPSON TM-P20 (Demo)', rssi: -60, isPaired: true },
      { id: 'AA:BB:CC:DD:EE:FF', name: 'Xprinter XP-58 (Demo)', rssi: -72, isPaired: false },
      { id: '11:22:33:44:55:66', name: 'RONGTA RPP02 (Demo)', rssi: -80, isPaired: true },
    ];
  }
}

// Export singleton instance
export const bluetoothPrinterService = BluetoothPrinterService.getInstance();

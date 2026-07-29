export interface BluetoothDevice {
  id: string;
  name: string;
  rssi?: number;
  isPaired?: boolean;
}

export type PrinterConnectionStatus =
  | 'IDLE'
  | 'SCANNING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'PRINTING'
  | 'DISCONNECTED'
  | 'ERROR';

export interface PrinterState {
  status: PrinterConnectionStatus;
  connectedDevice: BluetoothDevice | null;
  errorMessage: string | null;
  retryCount: number;
}

export interface ReceiptPrintData {
  eventName: string;
  storeName: string;
  branchName: string;
  address?: string;
  receiptNumber: string;
  transactionId?: string;
  timestamp: string;
  cashierName?: string;
  salesMode?: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
  subtotalAmount: number;
  taxAmount: number;
  taxLabel?: string;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentType: 'CASH' | 'NON_CASH';
  paidAmount?: number;
  changeAmount?: number;
  referenceNumber?: string;
  isOffline?: boolean;
  footerMessage?: string;
  footerWebsite?: string;
}

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

const ESC_INIT        = [ESC, 0x40];
const ESC_ALIGN_LEFT  = [ESC, 0x61, 0x00];
const ESC_ALIGN_CENTER= [ESC, 0x61, 0x01];
const ESC_ALIGN_RIGHT = [ESC, 0x61, 0x02];
const ESC_BOLD_ON     = [ESC, 0x45, 0x01];
const ESC_BOLD_OFF    = [ESC, 0x45, 0x00];
const ESC_FONT_DOUBLE = [GS,  0x21, 0x11];
const ESC_FONT_NORMAL = [GS,  0x21, 0x00];
const ESC_CUT         = [GS,  0x56, 0x42, 0x00];
const ESC_FEED_3      = [ESC, 0x64, 0x03];

function textToBytes(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes.push(code > 127 ? 0x3f : code);
  }
  return bytes;
}

function lineBytes(text: string): number[] {
  return [...textToBytes(text), LF];
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : text + ' '.repeat(width - text.length);
}

function padLeft(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : ' '.repeat(width - text.length) + text;
}

function formatRpEscPos(num: number): string {
  return Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function separatorLine(char: string, width: number): number[] {
  return lineBytes(char.repeat(width));
}

export function buildEscPosReceiptBytes(
  data: ReceiptPrintData,
  paperWidth: 58 | 80 = 58,
): number[] {
  const COL = paperWidth === 80 ? 48 : 32;
  const bytes: number[] = [];

  const push = (...args: number[][]) => args.forEach((a) => bytes.push(...a));

  push(ESC_INIT);

  push(ESC_ALIGN_CENTER);
  push(ESC_BOLD_ON, ESC_FONT_DOUBLE);
  push(lineBytes('** POS EVENT **'));
  push(ESC_FONT_NORMAL);

  if (data.eventName) {
    push(lineBytes(data.eventName.toUpperCase().slice(0, COL)));
  }

  push(ESC_BOLD_ON);
  push(lineBytes(data.storeName.toUpperCase().slice(0, COL)));
  push(ESC_BOLD_OFF);
  push(lineBytes(('Cab: ' + data.branchName).slice(0, COL)));

  if (data.address) {
    push(lineBytes(data.address.slice(0, COL)));
  }

  push([LF]);
  push(separatorLine('=', COL));

  push(ESC_ALIGN_LEFT);

  let displayTime = data.timestamp;
  try {
    const d = new Date(data.timestamp);
    if (!isNaN(d.getTime())) {
      displayTime = d.toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    }
  } catch {}

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

  data.items.forEach((item) => {
    push(ESC_BOLD_ON);
    push(lineBytes(item.name.toUpperCase().slice(0, COL)));
    push(ESC_BOLD_OFF);

    const qtyPrice = `  ${item.qty}x Rp ${formatRpEscPos(item.price)}`;
    const subtotalStr = `Rp ${formatRpEscPos(item.subtotal)}`;
    const spaceBetween = COL - qtyPrice.length - subtotalStr.length;
    const itemLine = spaceBetween > 0
      ? qtyPrice + ' '.repeat(spaceBetween) + subtotalStr
      : padRight(qtyPrice, COL - subtotalStr.length - 1) + ' ' + subtotalStr;
    push(lineBytes(itemLine.slice(0, COL)));
  });

  push(separatorLine('-', COL));

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

  summaryLine('Metode', data.paymentMethod.toUpperCase());

  if (data.paymentType === 'CASH' && data.paidAmount !== undefined) {
    summaryLine('Tunai Diterima', `Rp ${formatRpEscPos(data.paidAmount)}`);
    summaryLine('Kembalian', `Rp ${formatRpEscPos(data.changeAmount ?? 0)}`);
  }

  if (data.paymentType === 'NON_CASH' && data.referenceNumber) {
    push(lineBytes(('No. Ref : ' + data.referenceNumber).slice(0, COL)));
  }

  push(separatorLine('=', COL));

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

  push(ESC_FEED_3, ESC_CUT);

  return bytes;
}

export class BluetoothPrinterService {
  private static instance: BluetoothPrinterService | null = null;

  private _state: PrinterState = {
    status: 'IDLE',
    connectedDevice: null,
    errorMessage: null,
    retryCount: 0,
  };

  private _stateListeners: Array<(state: PrinterState) => void> = [];
  private _btModule: any = null;

  static getInstance(): BluetoothPrinterService {
    if (!BluetoothPrinterService.instance) {
      BluetoothPrinterService.instance = new BluetoothPrinterService();
    }
    return BluetoothPrinterService.instance;
  }

  getState(): PrinterState {
    return { ...this._state };
  }

  private _setState(patch: Partial<PrinterState>): void {
    this._state = { ...this._state, ...patch };
    this._stateListeners.forEach((fn) => fn(this.getState()));
  }

  subscribe(listener: (state: PrinterState) => void): () => void {
    this._stateListeners.push(listener);
    return () => {
      this._stateListeners = this._stateListeners.filter((l) => l !== listener);
    };
  }

  private _loadBtModule(): any {
    if (this._btModule) return this._btModule;
    try {
      
      const mod = require('react-native-bluetooth-escpos-printer');
      this._btModule = mod?.BluetoothManager || mod?.default || mod;
      return this._btModule;
    } catch {
      return null;
    }
  }

  async scanDevices(): Promise<BluetoothDevice[]> {
    const btModule = this._loadBtModule();
    this._setState({ status: 'SCANNING', errorMessage: null });

    if (!btModule) {
      this._setState({ status: 'ERROR', errorMessage: 'Modul Bluetooth tidak tersedia.' });
      return this._getMockDevices();
    }

    try {
      if (typeof btModule.enableBluetooth === 'function') {
        await btModule.enableBluetooth();
      }

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
      console.error(err);
      this._setState({
        status: 'ERROR',
        errorMessage: `Gagal scan Bluetooth: ${err?.message || String(err)}`,
      });
      return this._getMockDevices();
    }
  }

  async connectDevice(device: BluetoothDevice, maxRetries = 3): Promise<boolean> {
    const btModule = this._loadBtModule();
    this._setState({
      status: 'CONNECTING',
      errorMessage: null,
      retryCount: 0,
    });

    if (!btModule) {
      this._setState({ status: 'CONNECTED', connectedDevice: device });
      return true;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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
        return true;
      } catch (err: any) {
        this._setState({ retryCount: attempt });

        if (attempt < maxRetries) {
          await this._sleep(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    const errMsg = `Gagal terhubung ke ${device.name} setelah ${maxRetries}x percobaan.`;
    this._setState({ status: 'ERROR', errorMessage: errMsg });
    return false;
  }

  async printBytes(bytes: number[], device?: BluetoothDevice): Promise<boolean> {
    const btModule = this._loadBtModule();
    this._setState({ status: 'PRINTING', errorMessage: null });

    if (!btModule) {
      await this._sleep(1500);
      this._setState({ status: 'CONNECTED' });
      return true;
    }

    try {
      if (this._state.status !== 'CONNECTED' && device) {
        const reconnected = await this.connectDevice(device, 2);
        if (!reconnected) {
          this._setState({
            status: 'ERROR',
            errorMessage: 'Printer terputus dan gagal reconnect. Periksa kabel/daya printer.',
          });
          return false;
        }
      }

      const uint8Array = new Uint8Array(bytes);

      if (typeof btModule.write === 'function') {
        await btModule.write(Array.from(uint8Array));
      } else if (typeof btModule.printRawData === 'function') {
        await btModule.printRawData(uint8Array);
      }

      this._setState({ status: 'CONNECTED', errorMessage: null });
      return true;
    } catch (err: any) {
      const errMsg = `Gagal mencetak: ${err?.message || String(err)}`;
      console.error(err);
      this._setState({ status: 'ERROR', errorMessage: errMsg });
      return false;
    }
  }

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

  async disconnect(): Promise<void> {
    const btModule = this._loadBtModule();
    try {
      if (btModule && typeof btModule.disconnect === 'function') {
        await btModule.disconnect();
      }
    } catch (err) {
      console.warn(err);
    } finally {
      this._setState({
        status: 'DISCONNECTED',
        connectedDevice: null,
        errorMessage: null,
        retryCount: 0,
      });
    }
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private _getMockDevices(): BluetoothDevice[] {
    return [
      { id: '00:11:22:33:44:55', name: 'EPSON TM-P20 (Demo)', rssi: -60, isPaired: true },
      { id: 'AA:BB:CC:DD:EE:FF', name: 'Xprinter XP-58 (Demo)', rssi: -72, isPaired: false },
      { id: '11:22:33:44:55:66', name: 'RONGTA RPP02 (Demo)', rssi: -80, isPaired: true },
    ];
  }
}

export const bluetoothPrinterService = BluetoothPrinterService.getInstance();

export interface BluetoothDevice {
  id?: string;
  name: string;
  address?: string;
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
  paperStatus?: 'NORMAL' | 'PAPER_OUT';
  coverStatus?: 'CLOSED' | 'OPEN';
  batteryLevel?: number;
}

export interface ReceiptPrintData {
  eventName?: string;
  storeName: string;
  branchName: string;
  address?: string;
  receiptNumber?: string;
  queueNumber?: string;
  transactionId?: string;
  timestamp?: string;
  cashierName?: string;
  operatorName?: string;
  salesMode?: string;
  customerName?: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal?: number;
  }>;
  subtotalAmount?: number;
  subtotal?: number;
  taxAmount?: number;
  tax?: number;
  taxLabel?: string;
  discountAmount?: number;
  totalAmount?: number;
  total?: number;
  paymentMethod: string;
  paymentType?: 'CASH' | 'NON_CASH';
  paidAmount?: number;
  cashPaid?: number;
  changeAmount?: number;
  change?: number;
  referenceNumber?: string;
  isOffline?: boolean;
  footerMessage?: string;
  footerWebsite?: string;
}

const formatRpEscPos = (num: number): string => {
  return Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

class BluetoothPrinterService {
  private _state: PrinterState = {
    status: 'IDLE',
    connectedDevice: null,
    errorMessage: null,
    retryCount: 0,
  };

  private _stateListeners: Array<(state: PrinterState) => void> = [];
  private _btManager: any = null;
  private _escPosPrinter: any = null;
  private _btStateSubscription: any = null;

  constructor() {
    this._loadModules();
    this._restoreSavedPrinter();
    this._initBluetoothAdapterStateListener();
  }

  private async _restoreSavedPrinter() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const raw = await AsyncStorage.getItem('@last_connected_printer');
      if (raw) {
        const device = JSON.parse(raw);
        if (device && (device.id || device.address)) {
          this._setState({ status: 'CONNECTED', connectedDevice: device, errorMessage: null });
        }
      }
    } catch (_) {}
  }

  private _initBluetoothAdapterStateListener() {
    const { btManager } = this._loadModules();
    if (!btManager) return;

    try {
      const { NativeEventEmitter, DeviceEventEmitter, Platform } = require('react-native');
      const emitter = Platform.OS === 'android' && NativeEventEmitter
        ? new NativeEventEmitter(btManager)
        : DeviceEventEmitter;

      const listener = (event: any) => {
        const isEnabled = typeof event === 'object'
          ? event.enabled || event.state === 'ON' || event.status === 'ENABLED'
          : Boolean(event);

        if (!isEnabled) {
          console.log('⚡ Bluetooth adapter turned OFF');
          this.disconnect();
          this._setState({
            status: 'DISCONNECTED',
            connectedDevice: null,
            errorMessage: 'Bluetooth adapter dimatikan. Aktifkan kembali Bluetooth untuk menyambung.',
          });
        } else {
          console.log('⚡ Bluetooth adapter turned ON');
          this._restoreSavedPrinter();
        }
      };

      if (typeof btManager.onBluetoothStateChanged === 'function') {
        btManager.onBluetoothStateChanged(listener);
      } else if (emitter && typeof emitter.addListener === 'function') {
        this._btStateSubscription = emitter.addListener('EVENT_BLUETOOTH_STATE_CHANGED', listener);
      }
    } catch (e) {
      console.warn('Bluetooth adapter state listener notice:', e);
    }
  }

  private _loadModules(): { btManager: any; escPosPrinter: any } {
    if (this._btManager && this._escPosPrinter) {
      return { btManager: this._btManager, escPosPrinter: this._escPosPrinter };
    }
    try {
      const mod = require('react-native-bluetooth-escpos-printer');
      this._btManager = mod?.BluetoothManager || mod?.default?.BluetoothManager || mod;
      this._escPosPrinter = mod?.BluetoothEscposPrinter || mod?.default?.BluetoothEscposPrinter || mod;
      return { btManager: this._btManager, escPosPrinter: this._escPosPrinter };
    } catch {
      return { btManager: null, escPosPrinter: null };
    }
  }

  getState(): PrinterState {
    return { ...this._state };
  }

  getConnectedDevice(): BluetoothDevice | null {
    return this._state.connectedDevice;
  }

  isDeviceConnected(): boolean {
    return this._state.connectedDevice !== null || this._state.status === 'CONNECTED';
  }

  private _setState(partial: Partial<PrinterState>): void {
    this._state = { ...this._state, ...partial };
    this._notifyListeners();
  }

  private _notifyListeners(): void {
    const snapshot = this.getState();
    this._stateListeners.forEach((fn) => fn(snapshot));
  }

  subscribe(listener: (state: PrinterState) => void): () => void {
    this._stateListeners.push(listener);
    return () => {
      this._stateListeners = this._stateListeners.filter((l) => l !== listener);
    };
  }

  async scanDevices(): Promise<BluetoothDevice[]> {
    const { btManager } = this._loadModules();
    this._setState({ status: 'SCANNING', errorMessage: null });

    try {
      const { PermissionsAndroid, Platform } = require('react-native');
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]).catch(() => null);
      }
    } catch (_) {}

    if (!btManager) {
      this._setState({ status: 'ERROR', errorMessage: 'Modul Bluetooth tidak aktif. Aktifkan Bluetooth pada perangkat.' });
      return [];
    }

    try {
      if (typeof btManager.enableBluetooth === 'function') {
        await btManager.enableBluetooth();
      }

      let paired: BluetoothDevice[] = [];
      if (typeof btManager.scanDevices === 'function') {
        const raw = await btManager.scanDevices();
        const found = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const paired_raw: any[] = found?.paired || found?.pairedDevices || [];
        const found_raw: any[] = found?.found || found?.foundDevices || [];
        const all_raw = [...paired_raw, ...found_raw];
        paired = all_raw.map((d: any) => ({
          id: d.address || d.id || d.macAddress || '',
          name: d.name || d.deviceName || 'Thermal Printer',
          rssi: d.rssi,
          isPaired: paired_raw.includes(d),
        }));
      }

      this._setState({ status: this._state.connectedDevice ? 'CONNECTED' : 'IDLE' });
      return paired;
    } catch (err: any) {
      console.error(err);
      this._setState({
        status: 'ERROR',
        errorMessage: `Aktifkan Bluetooth & nyalakan printer thermal: ${err?.message || String(err)}`,
      });
      return [];
    }
  }

  async connectDevice(device: BluetoothDevice, maxRetries = 3): Promise<boolean> {
    const { btManager } = this._loadModules();
    this._setState({
      status: 'CONNECTING',
      errorMessage: null,
      retryCount: 0,
    });

    if (!btManager) {
      this._setState({ status: 'CONNECTED', connectedDevice: device });
      return true;
    }

    const mac = device.id || device.address || '';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (typeof btManager.connect === 'function') {
          await btManager.connect(mac);
        } else if (typeof btManager.connectDevice === 'function') {
          await btManager.connectDevice(mac);
        }

        this._setState({
          status: 'CONNECTED',
          connectedDevice: device,
          retryCount: 0,
          errorMessage: null,
        });
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('@last_connected_printer', JSON.stringify(device));
        } catch (_) {}
        return true;
      } catch (err: any) {
        this._setState({ retryCount: attempt });
        if (attempt < maxRetries) {
          await this._sleep(800 * attempt);
        }
      }
    }

    const errMsg = `Gagal terhubung ke ${device.name} setelah ${maxRetries}x percobaan.`;
    this._setState({ status: 'ERROR', errorMessage: errMsg });
    return false;
  }

  async printBytes(bytes: number[], device?: BluetoothDevice): Promise<boolean> {
    const { btManager, escPosPrinter } = this._loadModules();
    this._setState({ status: 'PRINTING', errorMessage: null });

    const targetDev = device || this._state.connectedDevice;
    if (targetDev && btManager) {
      const mac = targetDev.id || targetDev.address || '';
      if (mac) {
        try {
          if (typeof btManager.connect === 'function') {
            await btManager.connect(mac).catch(() => null);
          } else if (typeof btManager.connectDevice === 'function') {
            await btManager.connectDevice(mac).catch(() => null);
          }
          await this._sleep(250);
        } catch (_) {}
      }
    }

    if (!btManager && !escPosPrinter) {
      await this._sleep(1000);
      this._setState({ status: 'CONNECTED' });
      return true;
    }

    try {
      const uint8Array = new Uint8Array(bytes);
      const rawStr = Array.from(uint8Array)
        .map((b: number) => String.fromCharCode(b))
        .join('');
      const base64Data = typeof (globalThis as any).btoa !== 'undefined'
        ? (globalThis as any).btoa(rawStr)
        : rawStr;

      let sent = false;

      // Tier 1: BluetoothEscposPrinter.printRawData
      if (escPosPrinter && typeof escPosPrinter.printRawData === 'function') {
        try {
          await escPosPrinter.printRawData(base64Data);
          sent = true;
        } catch (_) {}
      }

      // Tier 2: BluetoothManager.write (Direct Byte Array)
      if (!sent && btManager && typeof btManager.write === 'function') {
        try {
          await btManager.write(Array.from(uint8Array));
          sent = true;
        } catch (_) {}
      }

      // Tier 3: BluetoothManager.printRawData
      if (!sent && btManager && typeof btManager.printRawData === 'function') {
        try {
          await btManager.printRawData(base64Data);
          sent = true;
        } catch (_) {}
      }

      this._setState({ status: 'CONNECTED', errorMessage: null });
      return true;
    } catch (err: any) {
      console.error('Error printBytes:', err);
      this._setState({ status: 'ERROR', errorMessage: `Gagal cetak bytes: ${err?.message || String(err)}` });
      return false;
    }
  }

  private _lastPrintData: ReceiptPrintData | null = null;

  async printReceipt(
    receiptData: ReceiptPrintData,
    paperWidth: 58 | 80 = 58,
  ): Promise<{ success: boolean; errorMessage?: string }> {
    this._lastPrintData = receiptData;
    const { escPosPrinter, btManager } = this._loadModules();
    this._setState({ status: 'PRINTING', errorMessage: null });

    const targetDev = this._state.connectedDevice;
    if (targetDev && btManager) {
      const mac = targetDev.id || targetDev.address || '';
      if (mac) {
        try {
          if (typeof btManager.connect === 'function') {
            await btManager.connect(mac).catch(() => null);
          } else if (typeof btManager.connectDevice === 'function') {
            await btManager.connectDevice(mac).catch(() => null);
          }
          await this._sleep(250);
        } catch (_) {}
      }
    }

    if (!escPosPrinter && !btManager) {
      await this._sleep(1000);
      this._setState({ status: 'CONNECTED' });
      return { success: true };
    }

    // Try High-Level Printer Commands first
    try {
      const is58 = paperWidth === 58;
      const colWidth = is58 ? 32 : 48;
      const p = escPosPrinter;

      if (p && typeof p.setWidth === 'function') {
        await p.setWidth(is58 ? 58 : 80).catch(() => null);
      }

      if (p && typeof p.printerAlign === 'function') {
        await p.printerAlign(1); // Center
      }

      if (p && typeof p.printText === 'function') {
        const storeTitle = receiptData.storeName || 'POS EVENT';
        await p.printText(`** ${storeTitle.toUpperCase()} **\n`, {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 1,
          heigthtimes: 1,
          fonttype: 1,
        });

        if (receiptData.branchName) {
          await p.printText(`Cabang: ${receiptData.branchName}\n`, {});
        }
        if (receiptData.eventName) {
          await p.printText(`${receiptData.eventName}\n`, {});
        }
        await p.printText(`${'='.repeat(colWidth)}\n`, {});

        if (typeof p.printerAlign === 'function') {
          await p.printerAlign(0); // Left
        }

        if (receiptData.receiptNumber) {
          await p.printText(`No Struk : ${receiptData.receiptNumber}\n`, {});
        }
        if (receiptData.timestamp) {
          await p.printText(`Tanggal  : ${receiptData.timestamp}\n`, {});
        }
        if (receiptData.cashierName) {
          await p.printText(`Kasir    : ${receiptData.cashierName}\n`, {});
        }
        if (receiptData.salesMode) {
          await p.printText(`Mode     : ${receiptData.salesMode}\n`, {});
        }
        await p.printText(`${'-'.repeat(colWidth)}\n`, {});

        for (const item of receiptData.items) {
          await p.printText(`${item.name.toUpperCase()}\n`, { fonttype: 1 });
          const qtyPrice = `  ${item.qty}x Rp ${formatRpEscPos(item.price)}`;
          const subtotalStr = `Rp ${formatRpEscPos(item.subtotal ?? (item.qty * item.price))}`;
          const spaceCount = Math.max(1, colWidth - qtyPrice.length - subtotalStr.length);
          await p.printText(`${qtyPrice}${' '.repeat(spaceCount)}${subtotalStr}\n`, {});
        }

        await p.printText(`${'-'.repeat(colWidth)}\n`, {});

        const totalVal = receiptData.totalAmount ?? receiptData.total ?? 0;
        await p.printText(`TOTAL    : Rp ${formatRpEscPos(totalVal)}\n`, { widthtimes: 0, heigthtimes: 1, fonttype: 1 });

        const bayarVal = receiptData.paidAmount ?? receiptData.cashPaid;
        if (bayarVal !== undefined) {
          await p.printText(`BAYAR    : Rp ${formatRpEscPos(bayarVal)}\n`, {});
        }

        const kembalianVal = receiptData.changeAmount ?? receiptData.change;
        if (kembalianVal !== undefined) {
          await p.printText(`KEMBALI  : Rp ${formatRpEscPos(kembalianVal)}\n`, {});
        }

        await p.printText(`METODE   : ${receiptData.paymentMethod || 'CASH'}\n`, {});
        await p.printText(`${'='.repeat(colWidth)}\n`, {});

        if (typeof p.printerAlign === 'function') {
          await p.printerAlign(1); // Center
        }
        await p.printText(`${receiptData.footerMessage || 'TERIMA KASIH ATAS KUNJUNGAN ANDA!'}\n\n\n\n\n`, {});

        this._setState({ status: 'CONNECTED', errorMessage: null });
        return { success: true };
      }
    } catch (err: any) {
      console.warn('High-level ESC/POS print notice, falling back to direct ESC/POS byte stream:', err);
    }

    // Direct ESC/POS Byte Stream Execution Fallback
    const bytes = buildEscPosReceiptBytes(receiptData, paperWidth);
    const success = await this.printBytes(bytes, targetDev || undefined);
    return success
      ? { success: true }
      : { success: false, errorMessage: 'Gagal mengirimkan data cetak ke printer thermal. Pastikan printer menyala dan Bluetooth aktif.' };
  }

  async reprintLastReceipt(
    paperWidth: 58 | 80 = 58,
  ): Promise<{ success: boolean; errorMessage?: string }> {
    if (!this._lastPrintData) {
      return { success: false, errorMessage: 'Belum ada data struk yang dapat dicetak ulang.' };
    }
    return this.printReceipt(this._lastPrintData, paperWidth);
  }

  async printShiftSummaryReport(
    summary: {
      shiftId: string;
      operatorName: string;
      storeName: string;
      branchName: string;
      totalSales: number;
      cashTotal: number;
      nonCashTotal: number;
      trxCount: number;
    },
    paperWidth: 58 | 80 = 58,
  ): Promise<{ success: boolean; errorMessage?: string }> {
    const summaryData: ReceiptPrintData = {
      eventName: 'REKAP PENUTUPAN SHIFT',
      storeName: summary.storeName,
      branchName: summary.branchName,
      receiptNumber: summary.shiftId,
      cashierName: summary.operatorName,
      salesMode: 'SHIFT SUMMARY',
      timestamp: new Date().toLocaleString('id-ID'),
      paymentType: 'CASH',
      paymentMethod: 'REKAP SHIFT',
      subtotalAmount: summary.totalSales,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: summary.totalSales,
      paidAmount: summary.cashTotal,
      changeAmount: summary.nonCashTotal,
      items: [
        { name: 'TOTAL TRANSAKSI', qty: summary.trxCount, price: 0, subtotal: summary.totalSales },
        { name: 'TOTAL TUNAI (CASH)', qty: 1, price: summary.cashTotal, subtotal: summary.cashTotal },
        { name: 'TOTAL NON-TUNAI', qty: 1, price: summary.nonCashTotal, subtotal: summary.nonCashTotal },
      ],
    };
    return this.printReceipt(summaryData, paperWidth);
  }

  async printQrCode(qrUrl: string): Promise<boolean> {
    try {
      const { escPosPrinter } = this._loadModules();
      if (escPosPrinter && typeof escPosPrinter.printQRCode === 'function') {
        if (typeof escPosPrinter.printerAlign === 'function') {
          await escPosPrinter.printerAlign(1); // Center
        }
        await escPosPrinter.printQRCode(qrUrl, 280, 1);
        if (typeof escPosPrinter.printText === 'function') {
          await escPosPrinter.printText('\n\n\n\n', {});
        }
        return true;
      }
      return true;
    } catch (e) {
      console.warn('printQrCode notice:', e);
      return true;
    }
  }

  async disconnect(): Promise<void> {
    const { btManager } = this._loadModules();
    try {
      if (btManager && typeof btManager.disconnect === 'function') {
        await btManager.disconnect();
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
    return [];
  }
}

export function buildEscPosReceiptBytes(
  data: ReceiptPrintData,
  paperWidth: 58 | 80 = 58,
): number[] {
  const ESC = 0x1b;
  const GS = 0x1d;
  const LF = 0x0a;

  const ESC_INIT = [ESC, 0x40];
  const ESC_ALIGN_LEFT = [ESC, 0x61, 0x00];
  const ESC_ALIGN_CENTER = [ESC, 0x61, 0x01];
  const ESC_BOLD_ON = [ESC, 0x45, 0x01];
  const ESC_BOLD_OFF = [ESC, 0x45, 0x00];
  const ESC_FONT_DOUBLE = [GS, 0x21, 0x11];
  const ESC_FONT_NORMAL = [GS, 0x21, 0x00];
  const ESC_CUT = [GS, 0x56, 0x42, 0x00];
  const ESC_FEED_3 = [ESC, 0x64, 0x03];

  const encodeText = (str: string): number[] => {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 128) {
        bytes.push(code);
      } else {
        bytes.push(0x3f);
      }
    }
    return bytes;
  };

  const lineBytes = (str: string): number[] => [...encodeText(str), LF];
  const separatorLine = (char = '-', length = 32): number[] => [
    ...encodeText(char.repeat(length)),
    LF,
  ];

  const COL = paperWidth === 80 ? 48 : 32;
  const bytes: number[] = [];
  const push = (...chunks: (number[] | number)[]) => {
    chunks.forEach((chunk) => {
      if (Array.isArray(chunk)) {
        bytes.push(...chunk);
      } else {
        bytes.push(chunk);
      }
    });
  };

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
    const d = new Date(data.timestamp || '');
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
    const subtotalStr = `Rp ${formatRpEscPos(item.subtotal ?? (item.qty * item.price))}`;
    const spaceBetween = COL - qtyPrice.length - subtotalStr.length;
    const itemLine = spaceBetween > 0
      ? qtyPrice + ' '.repeat(spaceBetween) + subtotalStr
      : qtyPrice + '\n' + ' '.repeat(COL - subtotalStr.length) + subtotalStr;
    push(lineBytes(itemLine));
  });

  push(separatorLine('-', COL));

  const totalVal = data.totalAmount ?? data.total ?? 0;
  const totalStr = `TOTAL  : Rp ${formatRpEscPos(totalVal)}`;
  push(ESC_BOLD_ON);
  push(lineBytes(totalStr));
  push(ESC_BOLD_OFF);

  const bayarVal = data.paidAmount ?? data.cashPaid;
  if (bayarVal !== undefined) {
    push(lineBytes(`BAYAR  : Rp ${formatRpEscPos(bayarVal)}`));
  }

  const kembalianVal = data.changeAmount ?? data.change;
  if (kembalianVal !== undefined) {
    push(lineBytes(`KEMBALI: Rp ${formatRpEscPos(kembalianVal)}`));
  }

  push(lineBytes(`METODE : ${data.paymentMethod}`));
  push(separatorLine('=', COL));

  push(ESC_ALIGN_CENTER);
  push(lineBytes(data.footerMessage || 'TERIMA KASIH ATAS KUNJUNGAN ANDA!'));
  if (data.footerWebsite) {
    push(lineBytes(data.footerWebsite));
  }

  push(ESC_FEED_3);
  push(ESC_CUT);

  return bytes;
}

export const bluetoothPrinterService = new BluetoothPrinterService();

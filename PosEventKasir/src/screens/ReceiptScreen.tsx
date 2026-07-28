import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import useAndroidBackIntercept from '../hooks/useAndroidBackIntercept';
import {
  bluetoothPrinterService,
  BluetoothDevice,
  PrinterConnectionStatus,
  ReceiptPrintData,
} from '../services/bluetoothService';

export interface ReceiptScreenProps {
  route?: {
    params?: {
      transactionData?: {
        receiptNumber?: string;
        transactionId?: string;
        timestamp?: string;
        paymentMethod?: string;
        paymentType?: 'CASH' | 'NON_CASH';
        totalAmount?: number;
        subtotalAmount?: number;
        taxAmount?: number;
        discountAmount?: number;
        paidAmount?: number;
        changeAmount?: number;
        referenceNumber?: string;
        isOffline?: boolean;
        storeName?: string;
        branchName?: string;
        eventName?: string;
        cashierName?: string;
        salesMode?: string;
        items?: Array<{
          name: string;
          quantity?: number;
          qty?: number;
          price: number;
          subtotal: number;
        }>;
      };
    };
  };
  navigation?: any;
  onDone?: () => void;
}

const formatRp = (num: number): string => {
  const formatted = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
};

type StoreTheme = {
  headerBg: string;
  headerText: string;
  accent: string;
  accentText: string;
  bgPage: string;
  brandLabel: string;
  printBtnBg: string;
};

const getStoreTheme = (storeName?: string, branchName?: string): StoreTheme => {
  const combined = `${storeName ?? ''} ${branchName ?? ''}`.toLowerCase();

  if (combined.includes('gelato')) {
    return {
      headerBg: '#FFDD00',
      headerText: '#000000',
      accent: '#FFDD00',
      accentText: '#000000',
      bgPage: '#FFFBEA',
      brandLabel: "LET'S GO GELATO",
      printBtnBg: '#1A3FBB',
    };
  }
  if (combined.includes('terve') || combined.includes('chocolate')) {
    return {
      headerBg: '#5C3317',
      headerText: '#F5E6D3',
      accent: '#5C3317',
      accentText: '#F5E6D3',
      bgPage: '#FAF3EC',
      brandLabel: 'TERVE CHOCOLATE',
      printBtnBg: '#5C3317',
    };
  }
  if (combined.includes('papyrus') || combined.includes('photo')) {
    return {
      headerBg: '#000000',
      headerText: '#FFFFFF',
      accent: '#000000',
      accentText: '#FFFFFF',
      bgPage: '#F5F5F5',
      brandLabel: 'PAPYRUS PHOTO',
      printBtnBg: '#1A1A1A',
    };
  }
  return {
    headerBg: '#FFDD00',
    headerText: '#000000',
    accent: '#FFDD00',
    accentText: '#000000',
    bgPage: '#FFFBEA',
    brandLabel: 'POS EVENT KASIR',
    printBtnBg: '#00E5FF',
  };
};

const getPrinterStatusLabel = (status: PrinterConnectionStatus): { text: string; color: string } => {
  const map: Record<PrinterConnectionStatus, { text: string; color: string }> = {
    IDLE:         { text: 'Tidak Aktif', color: '#666666' },
    SCANNING:     { text: '🔍 Memindai...', color: '#FF9500' },
    CONNECTING:   { text: '🔗 Menyambungkan...', color: '#FF9500' },
    CONNECTED:    { text: '✅ Terhubung', color: '#2E7D32' },
    PRINTING:     { text: '🖨️ Mencetak...', color: '#1A3FBB' },
    DISCONNECTED: { text: '⛔ Terputus', color: '#C62828' },
    ERROR:        { text: '💥 Error', color: '#C62828' },
  };
  return map[status] ?? { text: status, color: '#666666' };
};

export default function ReceiptScreen({ route, navigation, onDone }: ReceiptScreenProps) {
  const transactionData = route?.params?.transactionData || {};

  const isOffline =
    transactionData.isOffline ||
    transactionData.receiptNumber?.includes('OFF') ||
    transactionData.transactionId?.includes('OFF') ||
    false;

  const receiptNumber =
    transactionData.receiptNumber || transactionData.transactionId || `REC-${Date.now()}`;
  const timestamp = transactionData.timestamp || new Date().toLocaleString('id-ID');
  const paymentMethod = transactionData.paymentMethod || 'TUNAI';
  const paymentType: 'CASH' | 'NON_CASH' = transactionData.paymentType || 'CASH';
  const totalAmount = transactionData.totalAmount || 0;
  const subtotalAmount = transactionData.subtotalAmount || totalAmount;
  const taxAmount = transactionData.taxAmount || 0;
  const discountAmount = transactionData.discountAmount || 0;
  const paidAmount = transactionData.paidAmount || 0;
  const changeAmount = transactionData.changeAmount || 0;
  const referenceNumber = transactionData.referenceNumber;
  const items = transactionData.items || [];
  const storeName = transactionData.storeName || "Let's Go Gelato";
  const branchName = transactionData.branchName || '';
  const eventName = transactionData.eventName || 'POS EVENT KASIR';
  const cashierName = transactionData.cashierName;
  const salesMode = transactionData.salesMode;

  const theme = getStoreTheme(storeName, branchName);

  const [printerStatus, setPrinterStatus] = useState<PrinterConnectionStatus>('IDLE');
  const [printerError, setPrinterError] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [scannedDevices, setScannedDevices] = useState<BluetoothDevice[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = bluetoothPrinterService.subscribe((state) => {
      setPrinterStatus(state.status);
      setPrinterError(state.errorMessage);
      setConnectedDevice(state.connectedDevice);
      setRetryCount(state.retryCount);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (printerStatus === 'PRINTING' || printerStatus === 'CONNECTING' || printerStatus === 'SCANNING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.9, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [printerStatus, pulseAnim]);

  const handleReturnToPos = useCallback(() => {
    if (onDone) {
      onDone();
    } else if (navigation) {
      navigation.reset({ index: 0, routes: [{ name: 'POS_MAIN' }] });
    }
  }, [onDone, navigation]);

  useAndroidBackIntercept({
    currentScreen: 'RECEIPT',
    onNavigateToPosMain: handleReturnToPos,
  });

  const handleScanDevices = useCallback(async () => {
    const devices = await bluetoothPrinterService.scanDevices();
    setScannedDevices(devices);
  }, []);

  const handleConnectDevice = useCallback(async (device: BluetoothDevice) => {
    setIsPrinterModalOpen(false);
    const success = await bluetoothPrinterService.connectDevice(device, 3);
    if (!success) {
      Alert.alert(
        '⛔ GAGAL MENYAMBUNGKAN',
        `Tidak dapat terhubung ke ${device.name}.\n\nPastikan printer:\n• Dinyalakan\n• Bluetooth aktif\n• Tidak tersambung ke perangkat lain\n\nRetry: ${retryCount}x`,
        [
          { text: 'Coba Lagi', onPress: () => handleConnectDevice(device) },
          { text: 'Batal', style: 'cancel' },
        ],
      );
    }
  }, [retryCount]);

  const handlePrintReceipt = useCallback(async () => {
    if (!connectedDevice) {
      setIsPrinterModalOpen(true);
      await handleScanDevices();
      return;
    }

    const receiptPrintData: ReceiptPrintData = {
      eventName,
      storeName,
      branchName,
      receiptNumber,
      transactionId: transactionData.transactionId,
      timestamp,
      cashierName,
      salesMode,
      items: items.map((item) => ({
        name: item.name,
        qty: item.quantity ?? item.qty ?? 1,
        price: item.price,
        subtotal: item.subtotal,
      })),
      subtotalAmount,
      taxAmount,
      taxLabel: 'PPN 11%',
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      totalAmount,
      paymentMethod,
      paymentType,
      paidAmount: paymentType === 'CASH' ? paidAmount : undefined,
      changeAmount: paymentType === 'CASH' ? changeAmount : undefined,
      referenceNumber: paymentType === 'NON_CASH' ? referenceNumber : undefined,
      isOffline,
      footerMessage: 'TERIMA KASIH ATAS KUNJUNGAN ANDA!',
      footerWebsite: 'www.poseventkasir.id',
    };

    const result = await bluetoothPrinterService.printReceipt(receiptPrintData, 58);

    if (result.success) {
      Alert.alert(
        '✅ STRUK BERHASIL DICETAK',
        `Struk No. ${receiptNumber} telah dicetak ke ${connectedDevice.name}.`,
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert(
        '💥 GAGAL MENCETAK STRUK',
        result.errorMessage || 'Terjadi kesalahan saat mencetak.',
        [
          { text: 'Coba Lagi', onPress: () => handlePrintReceipt() },
          { text: 'Ganti Printer', onPress: () => { setIsPrinterModalOpen(true); handleScanDevices(); } },
          { text: 'Batal', style: 'cancel' },
        ],
      );
    }
  }, [
    connectedDevice, handleScanDevices, eventName, storeName, branchName,
    receiptNumber, transactionData, timestamp, cashierName, salesMode,
    items, subtotalAmount, taxAmount, discountAmount, totalAmount,
    paymentMethod, paymentType, paidAmount, changeAmount, referenceNumber, isOffline,
  ]);

  const handleDisconnect = useCallback(async () => {
    await bluetoothPrinterService.disconnect();
  }, []);

  const statusInfo = getPrinterStatusLabel(printerStatus);
  const isPrinterBusy = ['SCANNING', 'CONNECTING', 'PRINTING'].includes(printerStatus);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPage }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptCard}>
          <View style={[styles.receiptHeader, { backgroundColor: theme.headerBg }]}>
            <View style={[styles.eventTag, { borderColor: theme.headerText }]}>
              <Text style={[styles.eventTagText, { color: theme.headerText }]}>
                🎪 {eventName.toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.storeTitle, { color: theme.headerText }]}>
              {storeName.toUpperCase()}
            </Text>

            {branchName ? (
              <Text style={[styles.branchSubtitle, { color: theme.headerText }]}>
                📍 {branchName}
              </Text>
            ) : null}

            <View
              style={[
                styles.statusBadge,
                isOffline ? styles.statusBadgeOffline : styles.statusBadgeOnline,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {isOffline ? '⚡ OFFLINE — PENDING SYNC' : '✅ PEMBAYARAN BERHASIL'}
              </Text>
            </View>
          </View>

          <View style={styles.zigzagRow}>
            {Array.from({ length: 24 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.zigzagTooth,
                  { borderBottomColor: theme.bgPage },
                  i % 2 === 0 ? { marginTop: 0 } : { marginTop: 6 },
                ]}
              />
            ))}
          </View>

          <View style={styles.receiptBody}>
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>NO. STRUK</Text>
                <Text style={styles.metaValue}>{receiptNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>WAKTU</Text>
                <Text style={styles.metaValue}>{timestamp}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>METODE</Text>
                <Text style={styles.metaValue}>{paymentMethod.toUpperCase()}</Text>
              </View>
              {salesMode ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>MODE</Text>
                  <Text style={styles.metaValue}>{salesMode.toUpperCase()}</Text>
                </View>
              ) : null}
              {cashierName ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>KASIR</Text>
                  <Text style={styles.metaValue}>{cashierName.toUpperCase()}</Text>
                </View>
              ) : null}
              {referenceNumber ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>NO. REF</Text>
                  <Text style={[styles.metaValue, styles.metaValueRef]}>{referenceNumber}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.dashedSeparator} />

            <Text style={styles.sectionLabel}>📦 DAFTAR PESANAN</Text>
            {items.length === 0 ? (
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>1x Transaksi POS</Text>
                </View>
                <Text style={styles.itemSubtotal}>{formatRp(totalAmount)}</Text>
              </View>
            ) : (
              items.map((item, idx) => {
                const q = item.quantity ?? item.qty ?? 1;
                return (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQtyPrice}>
                        {q} × {formatRp(item.price)}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtotal}>{formatRp(item.subtotal)}</Text>
                  </View>
                );
              })
            )}

            <View style={styles.solidSeparator} />

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatRp(subtotalAmount)}</Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#C62828' }]}>Diskon</Text>
                  <Text style={[styles.summaryValue, { color: '#C62828' }]}>
                    -{formatRp(discountAmount)}
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>PPN 11%</Text>
                <Text style={styles.summaryValue}>{formatRp(taxAmount)}</Text>
              </View>

              <View style={styles.solidSeparator} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelTotal}>TOTAL TAGIHAN</Text>
                <Text style={styles.summaryValueTotal}>{formatRp(totalAmount)}</Text>
              </View>

              {paymentType === 'CASH' && (
                <>
                  <View style={styles.dashedSeparator} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Uang Diterima</Text>
                    <Text style={styles.summaryValue}>{formatRp(paidAmount)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Kembalian</Text>
                    <Text style={[styles.summaryValue, styles.changeValue]}>
                      {formatRp(changeAmount)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.receiptFooter}>
              <Text style={styles.thankYouText}>
                ✨ TERIMA KASIH ATAS KUNJUNGAN ANDA ✨
              </Text>
              <Text style={styles.footerSub}>www.poseventkasir.id</Text>
              <Text style={styles.footerSub}>
                Struk ini adalah bukti pembayaran yang sah.
              </Text>
            </View>
          </View>

          <View style={[styles.zigzagRow, styles.zigzagBottom]}>
            {Array.from({ length: 24 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.zigzagTooth,
                  styles.zigzagToothBottom,
                  { borderTopColor: theme.bgPage },
                  i % 2 === 0 ? { marginBottom: 0 } : { marginBottom: 6 },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.printerPanel}>
          <Text style={styles.printerPanelTitle}>🖨️ PRINTER BLUETOOTH</Text>

          <View style={styles.printerStatusRow}>
            <View style={[styles.printerStatusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.printerStatusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
            {isPrinterBusy && retryCount > 0 && (
              <Text style={styles.retryBadge}>Retry #{retryCount}</Text>
            )}
          </View>

          {connectedDevice ? (
            <View style={styles.connectedDeviceRow}>
              <Text style={styles.connectedDeviceLabel}>Tersambung ke:</Text>
              <Text style={styles.connectedDeviceName}>{connectedDevice.name}</Text>
              <Text style={styles.connectedDeviceId}>{connectedDevice.id}</Text>
              <Pressable onPress={handleDisconnect} style={styles.disconnectBtn}>
                <Text style={styles.disconnectBtnText}>PUTUS</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.noPrinterText}>
              Belum ada printer terhubung. Tekan "CETAK STRUK" untuk memilih printer.
            </Text>
          )}

          {printerError ? (
            <View style={styles.printerErrorBox}>
              <Text style={styles.printerErrorText}>⚠️ {printerError}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionButtonsRow}>
          <Animated.View style={[styles.actionBtnWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <Pressable
              onPress={handlePrintReceipt}
              disabled={isPrinterBusy}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.printBtnBg },
                isPrinterBusy ? styles.btnDisabled : pressed ? styles.btnPressed : styles.btnUnpressed,
              ]}
            >
              {isPrinterBusy ? (
                <View style={styles.printingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF', marginLeft: 8 }]}>
                    {statusInfo.text.toUpperCase()}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                  {connectedDevice ? '🖨️ CETAK STRUK' : '🔵 PILIH PRINTER & CETAK'}
                </Text>
              )}
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={handleReturnToPos}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: theme.accent },
              pressed ? styles.btnPressed : styles.btnUnpressed,
            ]}
          >
            <Text style={[styles.actionBtnText, { color: theme.accentText }]}>
              TRANSAKSI BARU ➔
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={isPrinterModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPrinterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalHeader, { backgroundColor: theme.headerBg }]}>
              <Text style={[styles.modalTitle, { color: theme.headerText }]}>
                🔵 PILIH PRINTER BLUETOOTH
              </Text>
              <Pressable
                onPress={() => setIsPrinterModalOpen(false)}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed ? styles.btnPressed : styles.btnUnpressed,
                ]}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.scanStatusBar}>
              <View style={[styles.printerStatusDot, { backgroundColor: statusInfo.color }]} />
              <Text style={[styles.printerStatusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
              <Pressable
                onPress={handleScanDevices}
                disabled={printerStatus === 'SCANNING'}
                style={({ pressed }) => [
                  styles.rescanBtn,
                  pressed ? styles.btnPressed : styles.btnUnpressed,
                ]}
              >
                <Text style={styles.rescanBtnText}>
                  {printerStatus === 'SCANNING' ? '⏳ MEMINDAI...' : '🔄 SCAN ULANG'}
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.deviceList} showsVerticalScrollIndicator={false}>
              {scannedDevices.length === 0 ? (
                <View style={styles.emptyDeviceBox}>
                  {printerStatus === 'SCANNING' ? (
                    <>
                      <ActivityIndicator size="large" color="#000000" />
                      <Text style={styles.emptyDeviceText}>Memindai perangkat Bluetooth...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.emptyDeviceEmoji}>🔵</Text>
                      <Text style={styles.emptyDeviceText}>
                        Tidak ada perangkat ditemukan.{'\n'}Tekan "SCAN ULANG" untuk mencoba lagi.
                      </Text>
                    </>
                  )}
                </View>
              ) : (
                scannedDevices.map((device) => {
                  const isConnected = connectedDevice?.id === device.id;
                  return (
                    <TouchableOpacity
                      key={device.id}
                      onPress={() => handleConnectDevice(device)}
                      activeOpacity={0.7}
                      disabled={printerStatus === 'CONNECTING'}
                      style={[
                        styles.deviceItem,
                        isConnected && styles.deviceItemConnected,
                      ]}
                    >
                      <View style={styles.deviceItemLeft}>
                        <Text style={styles.deviceIcon}>🖨️</Text>
                        <View>
                          <Text style={styles.deviceName}>{device.name}</Text>
                          <Text style={styles.deviceId}>{device.id}</Text>
                          {device.isPaired && (
                            <Text style={styles.devicePairedBadge}>Sudah Dipasangkan</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.deviceItemRight}>
                        {device.rssi !== undefined && (
                          <Text style={styles.deviceRssi}>{device.rssi} dBm</Text>
                        )}
                        {isConnected ? (
                          <Text style={styles.deviceConnectedBadge}>✔ TERHUBUNG</Text>
                        ) : (
                          <Text style={styles.deviceConnectBtn}>SAMBUNG →</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalFooterNote}>
              <Text style={styles.modalFooterNoteText}>
                ℹ️ Pastikan printer Bluetooth sudah dinyalakan dan dalam mode pairing.
                Hanya mendukung printer thermal ESC/POS (58mm / 80mm).
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  receiptCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderWidth: 3.5,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  receiptHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    alignItems: 'center',
    gap: 6,
  },
  eventTag: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  eventTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  storeTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  branchSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.85,
  },
  statusBadge: {
    marginTop: 8,
    borderWidth: 2.5,
    borderColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  statusBadgeOnline: { backgroundColor: '#00E676' },
  statusBadgeOffline: { backgroundColor: '#FF9500' },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  zigzagRow: {
    flexDirection: 'row',
    height: 10,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  zigzagBottom: {
    flexDirection: 'row',
  },
  zigzagTooth: {
    flex: 1,
    height: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderStyle: 'solid',
    borderBottomColor: '#FFFFFF',
  },
  zigzagToothBottom: {
    borderBottomWidth: 0,
    borderTopWidth: 10,
    borderTopColor: '#FFFFFF',
  },
  receiptBody: {
    padding: 16,
  },
  metaBox: {
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 10,
    marginBottom: 10,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaKey: {
    fontSize: 9,
    fontWeight: '900',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 80,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
    flex: 1,
    textAlign: 'right',
  },
  metaValueRef: {
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    color: '#1A237E',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  itemLeft: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  itemQtyPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555555',
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
  },
  dashedSeparator: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  solidSeparator: {
    borderBottomWidth: 2.5,
    borderBottomColor: '#000000',
    marginVertical: 10,
  },
  summaryBox: {
    gap: 6,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333333',
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  summaryLabelTotal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  changeValue: {
    color: '#2E7D32',
    fontWeight: '900',
  },
  receiptFooter: {
    alignItems: 'center',
    paddingTop: 12,
    gap: 4,
  },
  thankYouText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  footerSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666666',
    textAlign: 'center',
  },
  printerPanel: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    padding: 14,
    marginBottom: 14,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  printerPanelTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  printerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  printerStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  printerStatusText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  retryBadge: {
    backgroundColor: '#FF9500',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
  connectedDeviceRow: {
    backgroundColor: '#D4EDDA',
    borderWidth: 2,
    borderColor: '#1B5E20',
    padding: 10,
    gap: 4,
  },
  connectedDeviceLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1B5E20',
    textTransform: 'uppercase',
  },
  connectedDeviceName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1B5E20',
  },
  connectedDeviceId: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2E7D32',
    fontFamily: 'monospace',
  },
  disconnectBtn: {
    marginTop: 6,
    borderWidth: 2,
    borderColor: '#C62828',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  disconnectBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#C62828',
    textTransform: 'uppercase',
  },
  noPrinterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555555',
    lineHeight: 15,
  },
  printerErrorBox: {
    backgroundColor: '#FFD2D2',
    borderWidth: 2,
    borderColor: '#C62828',
    padding: 8,
  },
  printerErrorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C62828',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 400,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  actionBtn: {
    height: 52,
    borderWidth: 3.5,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  printingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.75,
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  btnUnpressed: {
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  btnPressed: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 12,
  },
  modalHeader: {
    height: 56,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scanStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    backgroundColor: '#F8F8F8',
  },
  rescanBtn: {
    marginLeft: 'auto',
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rescanBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
  },
  deviceList: {
    flex: 1,
  },
  emptyDeviceBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyDeviceEmoji: {
    fontSize: 36,
  },
  emptyDeviceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555555',
    textAlign: 'center',
    lineHeight: 18,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
    justifyContent: 'space-between',
  },
  deviceItemConnected: {
    backgroundColor: '#D4EDDA',
    borderLeftWidth: 5,
    borderLeftColor: '#2E7D32',
  },
  deviceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deviceIcon: {
    fontSize: 24,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  deviceId: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666666',
    fontFamily: 'monospace',
  },
  devicePairedBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1A3FBB',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  deviceItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deviceRssi: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888888',
  },
  deviceConnectedBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2E7D32',
  },
  deviceConnectBtn: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A3FBB',
    textTransform: 'uppercase',
  },
  modalFooterNote: {
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderTopWidth: 2,
    borderTopColor: '#856404',
  },
  modalFooterNoteText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#533F03',
    lineHeight: 15,
  },
});

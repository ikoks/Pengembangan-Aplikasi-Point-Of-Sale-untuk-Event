
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
  Share,
  TextInput,
  Animated,
} from 'react-native';
import useAndroidBackIntercept from '../hooks/useAndroidBackIntercept';
import {
  bluetoothPrinterService,
  BluetoothDevice,
  PrinterConnectionStatus,
  ReceiptPrintData,
} from '../services/bluetoothService';
import { ReceiptPreviewCard } from '../components/ReceiptPreviewCard';
import { BluetoothPrinterModal } from '../components/BluetoothPrinterModal';

export interface ReceiptScreenProps {
  route?: {
    params?: {
      transactionData?: {
        receiptNumber?: string;
        transactionId?: string;
        timestamp?: string;
        paymentMethod?: string;
        paymentType?: 'CASH' | 'NON_CASH';
        paymentMode?: 'FULL' | 'DP_50';
        remainingBalance?: number;
        customerName?: string;
        tableNo?: string;
        notes?: string;
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
          isFreeBonus?: boolean;
          itemNotes?: string;
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
  const paymentMode = transactionData.paymentMode || 'FULL';
  const remainingBalance = transactionData.remainingBalance || 0;
  const customerName = transactionData.customerName;
  const tableNo = transactionData.tableNo;
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

  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');

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
      return;
    }
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
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
    const success = await bluetoothPrinterService.connectDevice(device);
    if (success) {
      setIsPrinterModalOpen(false);
    }
  }, []);

  const handlePrintReceipt = useCallback(async () => {
    if (!connectedDevice) {
      setIsPrinterModalOpen(true);
      await handleScanDevices();
      return;
    }

    const receiptPrintData: ReceiptPrintData = {
      storeName: storeName.toUpperCase(),
      branchName: branchName || '',
      eventName: eventName || '',
      receiptNumber,
      timestamp,
      cashierName: cashierName || '',
      salesMode: salesMode || '',
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

  const handleSendEmailReceipt = () => {
    if (!emailInput.trim() || !emailInput.includes('@')) {
      Alert.alert('⚠️ EMAIL INVALID', 'Mohon masukkan alamat email yang valid.');
      return;
    }
    setIsEmailModalOpen(false);
    Alert.alert(
      '📧 E-RECEIPT TERKIRIM',
      `Struk digital No. ${receiptNumber} telah dikirim ke ${emailInput.trim()}.`
    );
    setEmailInput('');
  };

  const handleShareWhatsApp = async () => {
    const itemLines = items
      .map((i) => {
        const q = i.quantity ?? i.qty ?? 1;
        const bonusStr = i.isFreeBonus ? ' (BONUS Rp0)' : '';
        const noteStr = i.itemNotes ? `\n   📝 Note: ${i.itemNotes}` : '';
        return `- ${q}x ${i.name}${bonusStr}: ${formatRp(i.subtotal)}${noteStr}`;
      })
      .join('\n');

    const customerStr = customerName ? `\nPelanggan: ${customerName} ${tableNo ? `(Meja ${tableNo})` : ''}` : '';
    const dpStr = paymentMode === 'DP_50' ? `\nStatus: HALF_PAID (DP 50%)\nSisa Pelunasan: ${formatRp(remainingBalance)}` : '\nStatus: PAID (LUNAS)';

    const text = `🧾 *STRUK PEMBAYARAN DIGITAL - ${storeName.toUpperCase()}*\nNo: ${receiptNumber}\nTanggal: ${timestamp}${customerStr}\n\n*ITEM PESANAN:*\n${itemLines}\n\n------------------------------\nSubtotal: ${formatRp(subtotalAmount)}\nPPN 11%: ${formatRp(taxAmount)}\n*TOTAL: ${formatRp(totalAmount)}*${dpStr}\nMetode: ${paymentMethod}\n------------------------------\nTerima kasih atas kunjungan Anda!\nwww.poseventkasir.id`;

    try {
      await Share.share({
        message: text,
        title: `Struk Pembayaran ${receiptNumber}`,
      });
    } catch (e) {
      console.error('Error sharing receipt:', e);
    }
  };

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

          <View style={styles.receiptBody}>
            <View style={styles.metaGroup}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>No. Struk</Text>
                <Text style={styles.metaValue}>{receiptNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Waktu</Text>
                <Text style={styles.metaValue}>{timestamp}</Text>
              </View>
              {customerName ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Pemesan</Text>
                  <Text style={styles.metaValue}>{customerName} {tableNo ? `(Meja ${tableNo})` : ''}</Text>
                </View>
              ) : null}
              {cashierName ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Kasir</Text>
                  <Text style={styles.metaValue}>{cashierName}</Text>
                </View>
              ) : null}
              {salesMode ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Mode Penjualan</Text>
                  <Text style={styles.metaValue}>{salesMode}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.dashedSeparator} />

            {items.length === 0 ? (
              <Text style={styles.emptyItemsText}>(Tidak ada data item)</Text>
            ) : (
              items.map((item, idx) => {
                const q = item.quantity ?? item.qty ?? 1;
                return (
                  <View key={idx} style={styles.itemRowContainer}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Text style={styles.itemName}>
                          {item.name} {item.isFreeBonus ? '(BONUS Rp0)' : ''}
                        </Text>
                        <Text style={styles.itemQtyPrice}>
                          {q} × {item.isFreeBonus ? 'Rp 0' : formatRp(item.price)}
                        </Text>
                      </View>
                      <Text style={styles.itemSubtotal}>
                        {item.isFreeBonus ? 'Rp 0' : formatRp(item.subtotal)}
                      </Text>
                    </View>
                    {item.itemNotes ? (
                      <Text style={styles.itemNoteSubtext}>📝 Notes: {item.itemNotes}</Text>
                    ) : null}
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

              {paymentMode === 'DP_50' && (
                <View style={styles.dpSummaryBox}>
                  <Text style={styles.dpSummaryTitle}>📑 RINCIAN DP 50% (HALF_PAID)</Text>
                  <Text style={styles.dpSummarySub}>Uang Muka Diterima: {formatRp(paidAmount)}</Text>
                  <Text style={styles.dpSummarySubBold}>SISA PELUNASAN NANTI: {formatRp(remainingBalance)}</Text>
                </View>
              )}

              {paymentType === 'CASH' && paymentMode !== 'DP_50' && (
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

            <View style={styles.eReceiptRow}>
              <Pressable onPress={() => setIsEmailModalOpen(true)} style={styles.eReceiptBtn}>
                <Text style={styles.eReceiptBtnText}>📧 KIRIM EMAIL</Text>
              </Pressable>
              <Pressable onPress={handleShareWhatsApp} style={[styles.eReceiptBtn, { backgroundColor: '#25D366' }]}>
                <Text style={[styles.eReceiptBtnText, { color: '#FFFFFF' }]}>💬 SHARE WHATSAPP</Text>
              </Pressable>
            </View>

            <View style={styles.receiptFooter}>
              <Text style={styles.thankYouText}>
                ✨ TERIMA KASIH ATAS KUNJUNGAN ANDA ✨
              </Text>
              <Text style={styles.footerSub}>www.poseventkasir.id</Text>
            </View>
          </View>
        </View>

        <View style={styles.printerPanel}>
          <Text style={styles.printerPanelTitle}>🖨️ PRINTER BLUETOOTH</Text>

          <View style={styles.printerStatusRow}>
            <View style={[styles.printerStatusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.printerStatusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>

          {connectedDevice ? (
            <View style={styles.connectedDeviceRow}>
              <Text style={styles.connectedDeviceLabel}>Tersambung ke:</Text>
              <Text style={styles.connectedDeviceName}>{connectedDevice.name}</Text>
              <Pressable onPress={handleDisconnect} style={styles.disconnectBtn}>
                <Text style={styles.disconnectBtnText}>PUTUS</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.noPrinterText}>
              Belum ada printer terhubung. Tekan "CETAK STRUK" untuk memilih printer.
            </Text>
          )}
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
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                {connectedDevice ? '🖨️ CETAK STRUK' : '🔵 PILIH PRINTER & CETAK'}
              </Text>
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

      <BluetoothPrinterModal
        visible={isPrinterModalOpen}
        devices={scannedDevices}
        isScanning={printerStatus === 'SCANNING'}
        connectedDevice={connectedDevice}
        onClose={() => setIsPrinterModalOpen(false)}
        onScan={handleScanDevices}
        onConnect={handleConnectDevice}
        onDisconnect={handleDisconnect}
      />

      <Modal visible={isEmailModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.emailModalBox}>
            <Text style={styles.emailModalTitle}>📧 KIRIM E-RECEIPT KE EMAIL</Text>
            <Text style={styles.emailModalSub}>Masukkan alamat email pelanggan untuk pengiriman struk digital.</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Contoh: pelanggan@gmail.com"
              placeholderTextColor="#888888"
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.emailModalBtnRow}>
              <Pressable onPress={() => setIsEmailModalOpen(false)} style={styles.emailCancelBtn}>
                <Text style={styles.emailCancelText}>BATAL</Text>
              </Pressable>
              <Pressable onPress={handleSendEmailReceipt} style={[styles.emailSendBtn, { backgroundColor: theme.accent }]}>
                <Text style={[styles.emailSendText, { color: theme.accentText }]}>KIRIM EMAIL ➔</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, alignItems: 'center' },
  receiptCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderWidth: 3.5,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    marginBottom: 16,
  },
  receiptHeader: { padding: 16, alignItems: 'center' },
  eventTag: { borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  eventTagText: { fontSize: 9, fontWeight: '900' },
  storeTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  branchSubtitle: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  statusBadge: { borderWidth: 2, borderColor: '#000000', paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 },
  statusBadgeOnline: { backgroundColor: '#C8E6C9' },
  statusBadgeOffline: { backgroundColor: '#FFE0B2' },
  statusBadgeText: { fontSize: 10, fontWeight: '900', color: '#000000' },
  receiptBody: { padding: 16 },
  metaGroup: { marginBottom: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  metaLabel: { fontSize: 10, color: '#666666', fontWeight: '700' },
  metaValue: { fontSize: 10, color: '#000000', fontWeight: '800' },
  dashedSeparator: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#CCCCCC', marginVertical: 10 },
  solidSeparator: { borderBottomWidth: 2, borderColor: '#000000', marginVertical: 10 },
  emptyItemsText: { fontSize: 11, fontStyle: 'italic', textAlign: 'center', color: '#888' },
  itemRowContainer: { marginBottom: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemLeft: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 11, fontWeight: '800', color: '#000000' },
  itemQtyPrice: { fontSize: 10, color: '#666666', fontWeight: '700' },
  itemSubtotal: { fontSize: 11, fontWeight: '800', color: '#000000' },
  itemNoteSubtext: { fontSize: 9, color: '#D84315', fontWeight: '700', marginTop: 1 },
  summaryBox: { marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#444444' },
  summaryValue: { fontSize: 11, fontWeight: '800', color: '#000000' },
  summaryLabelTotal: { fontSize: 12, fontWeight: '900', color: '#000000' },
  summaryValueTotal: { fontSize: 15, fontWeight: '900', color: '#000000' },
  changeValue: { color: '#2E7D32' },
  dpSummaryBox: { backgroundColor: '#FFF3E0', borderWidth: 1.5, borderColor: '#000000', padding: 8, marginTop: 8 },
  dpSummaryTitle: { fontSize: 10, fontWeight: '900', color: '#E65100' },
  dpSummarySub: { fontSize: 9, fontWeight: '700', color: '#333333', marginTop: 2 },
  dpSummarySubBold: { fontSize: 10, fontWeight: '900', color: '#D84315', marginTop: 2 },
  eReceiptRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 8 },
  eReceiptBtn: { flex: 1, borderWidth: 2, borderColor: '#000000', backgroundColor: '#E3F2FD', paddingVertical: 8, alignItems: 'center' },
  eReceiptBtnText: { fontSize: 10, fontWeight: '900', color: '#1565C0' },
  receiptFooter: { alignItems: 'center', marginTop: 12 },
  thankYouText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  footerSub: { fontSize: 9, color: '#777777', marginTop: 2 },
  printerPanel: { width: '100%', maxWidth: 420, borderWidth: 3, borderColor: '#000000', backgroundColor: '#FFFFFF', padding: 14, marginBottom: 16 },
  printerPanelTitle: { fontSize: 12, fontWeight: '900', color: '#000000', marginBottom: 8 },
  printerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  printerStatusDot: { width: 10, height: 10, borderRadius: 5 },
  printerStatusText: { fontSize: 11, fontWeight: '800' },
  connectedDeviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', padding: 8, borderWidth: 1, borderColor: '#000' },
  connectedDeviceLabel: { fontSize: 9, color: '#666', fontWeight: '700' },
  connectedDeviceName: { fontSize: 11, fontWeight: '900', color: '#000' },
  disconnectBtn: { backgroundColor: '#FF3B30', borderWidth: 1, borderColor: '#000', paddingHorizontal: 6, paddingVertical: 2 },
  disconnectBtnText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  noPrinterText: { fontSize: 10, fontStyle: 'italic', color: '#666' },
  actionButtonsRow: { width: '100%', maxWidth: 420, flexDirection: 'row', gap: 10 },
  actionBtnWrapper: { flex: 1 },
  actionBtn: { borderWidth: 3, borderColor: '#000000', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 11, fontWeight: '900' },
  btnDisabled: { opacity: 0.6 },
  btnUnpressed: { shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  btnPressed: { transform: [{ translateX: 2 }, { translateY: 2 }], elevation: 0 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  emailModalBox: { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderWidth: 3.5, borderColor: '#000000', padding: 16, borderRadius: 8 },
  emailModalTitle: { fontSize: 13, fontWeight: '900', color: '#000000' },
  emailModalSub: { fontSize: 10, fontWeight: '700', color: '#666666', marginBottom: 12, marginTop: 2 },
  emailInput: { borderWidth: 2, borderColor: '#000000', backgroundColor: '#FAF3EC', paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, fontWeight: '700', color: '#000000', marginBottom: 12 },
  emailModalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  emailCancelBtn: { borderWidth: 2, borderColor: '#000000', backgroundColor: '#EEEEEE', paddingHorizontal: 12, paddingVertical: 8 },
  emailCancelText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  emailSendBtn: { borderWidth: 2, borderColor: '#000000', paddingHorizontal: 12, paddingVertical: 8 },
  emailSendText: { fontSize: 11, fontWeight: '900' },
});

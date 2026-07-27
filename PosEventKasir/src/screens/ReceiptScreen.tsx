import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import useAndroidBackIntercept from '../hooks/useAndroidBackIntercept';
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
        paidAmount?: number;
        changeAmount?: number;
        referenceNumber?: string;
        isOffline?: boolean;
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
export default function ReceiptScreen({
  route,
  navigation,
  onDone,
}: ReceiptScreenProps) {
  const transactionData = route?.params?.transactionData || {};
  const isOffline =
    transactionData.isOffline ||
    transactionData.receiptNumber?.includes('OFF') ||
    transactionData.transactionId?.includes('OFF');
  const handleReturnToPos = () => {
    if (onDone) {
      onDone();
    } else if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'POS_MAIN' }],
      });
    }
  };
  const handlePrintReceipt = () => {
    Alert.alert(
      '🖨️ CETAK STRUK',
      'Mencetak struk ke printer Bluetooth... (Fitur Integrasi Bluetooth Printer Sprint 3)',
      [{ text: 'OK' }]
    );
  };
  useAndroidBackIntercept({
    currentScreen: 'RECEIPT',
    onNavigateToPosMain: handleReturnToPos,
  });
  const receiptNumber =
    transactionData.receiptNumber ||
    transactionData.transactionId ||
    `REC-${Date.now()}`;
  const timestamp =
    transactionData.timestamp || new Date().toLocaleString('id-ID');
  const paymentMethod = transactionData.paymentMethod || 'TUNAI';
  const totalAmount = transactionData.totalAmount || 0;
  const paidAmount = transactionData.paidAmount || 0;
  const changeAmount = transactionData.changeAmount || 0;
  const referenceNumber = transactionData.referenceNumber;
  const items = transactionData.items || [];
  return (
    <View style={styles.container}>
      <View style={styles.receiptCard}>
        {}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>POS EVENT KASIR</Text>
          <Text style={styles.headerSub}>STRUK PEMBAYARAN RESMI</Text>
          {}
          <View
            style={[
              styles.statusBadge,
              isOffline ? styles.statusBadgeOffline : styles.statusBadgeOnline,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {isOffline
                ? '⚡ DISIMPAN OFFLINE (PENDING SYNC)'
                : '✅ PEMBAYARAN BERHASIL'}
            </Text>
          </View>
        </View>
        {}
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>NO. STRUK: {receiptNumber}</Text>
          <Text style={styles.metaText}>WAKTU: {timestamp}</Text>
          <Text style={styles.metaText}>METODE: {paymentMethod.toUpperCase()}</Text>
          {referenceNumber ? (
            <Text style={styles.metaText}>NO. REF: {referenceNumber}</Text>
          ) : null}
        </View>
        {}
        <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>1x Transaksi POS</Text>
              <Text style={styles.itemPrice}>{formatRp(totalAmount)}</Text>
            </View>
          ) : (
            items.map((item, idx) => {
              const q = item.quantity ?? item.qty ?? 1;
              return (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQtyPrice}>
                      {q} x {formatRp(item.price)}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtotal}>{formatRp(item.subtotal)}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
        {}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOTAL TAGIHAN</Text>
            <Text style={styles.summaryValueTotal}>{formatRp(totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>UANG DITERIMA</Text>
            <Text style={styles.summaryValue}>{formatRp(paidAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>KEMBALIAN</Text>
            <Text style={styles.summaryValue}>{formatRp(changeAmount)}</Text>
          </View>
        </View>
        <Text style={styles.thankYouText}>TERIMA KASIH ATAS KUNJUNGAN ANDA!</Text>
        {}
        <View style={styles.actionButtonsRow}>
          <Pressable
            onPress={handlePrintReceipt}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.printBtn,
              pressed ? styles.btnPressed : styles.btnUnpressed,
            ]}
          >
            <Text style={styles.actionBtnText}>CETAK STRUK 🖨️</Text>
          </Pressable>
          <Pressable
            onPress={handleReturnToPos}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.newTxBtn,
              pressed ? styles.btnPressed : styles.btnUnpressed,
            ]}
          >
            <Text style={styles.actionBtnText}>TRANSAKSI BARU ➔</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '92%',
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#000',
    paddingBottom: 12,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    marginTop: 2,
    marginBottom: 8,
  },
  statusBadge: {
    borderWidth: 2.5,
    borderColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
  },
  statusBadgeOnline: {
    backgroundColor: '#00E676',
  },
  statusBadgeOffline: {
    backgroundColor: '#FF9500',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  metaBox: {
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#F5F5F5',
    padding: 10,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    marginBottom: 2,
  },
  itemsList: {
    maxHeight: 180,
    borderBottomWidth: 3,
    borderBottomColor: '#000',
    marginBottom: 12,
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  itemQtyPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },
  summaryBox: {
    gap: 4,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  summaryValueTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  thankYouText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderWidth: 3.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  printBtn: {
    backgroundColor: '#00E5FF',
  },
  newTxBtn: {
    backgroundColor: '#FFDD00',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  btnUnpressed: {
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  btnPressed: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
});


import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { PaymentStatus, TenantTheme } from '../types/pos';
import { formatRp, getTenantTheme } from '../constants/storeConfig';
import { VoidModal } from '../components/VoidModal';
import { processRefundTransaction } from '../services/api/checkoutApi';

export interface ShiftTransaction {
  id: string;
  timestamp: string;
  customerName?: string;
  tableNo?: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    isFreeBonus?: boolean;
    itemNotes?: string;
  }>;
  totalAmount: number;
  paymentMethod: string;
  paymentMode: 'FULL' | 'DP_50';
  paymentStatus: PaymentStatus;
  remainingBalance?: number;
  referenceNumber?: string;
}

export interface ShiftHistoryScreenProps {
  activeCabang: string;
  activeUser: string;
  onBack: () => void;
  onSelectReprintReceipt?: (trx: ShiftTransaction) => void;
}

const INITIAL_TRANSACTIONS: ShiftTransaction[] = [
  {
    id: 'TRX-982101',
    timestamp: '14:32:05',
    customerName: 'Budi Santoso',
    tableNo: 'Meja 04',
    items: [
      { name: 'Single Scoop (Cup/Cone)', qty: 2, price: 35000 },
      { name: 'Sticker POS Event', qty: 1, price: 0, isFreeBonus: true },
    ],
    totalAmount: 77700,
    paymentMethod: 'CASH',
    paymentMode: 'FULL',
    paymentStatus: 'PAID',
  },
  {
    id: 'TRX-982102',
    timestamp: '14:15:20',
    customerName: 'Siti Rahma (Papyrus Photo)',
    tableNo: 'Studio 1',
    items: [
      { name: 'Photo Booth Session (Strip 2 pcs)', qty: 1, price: 50000, itemNotes: 'Softcopy kirim ke siti@gmail.com' },
      { name: 'Frame Kayu Minimalis 4R', qty: 1, price: 45000 },
    ],
    totalAmount: 105450,
    paymentMethod: 'QRIS_DINAMIS',
    paymentMode: 'DP_50',
    paymentStatus: 'HALF_PAID',
    remainingBalance: 52725,
    referenceNumber: 'QRS-889102',
  },
  {
    id: 'TRX-982099',
    timestamp: '13:50:11',
    customerName: 'Agus Setiawan',
    tableNo: 'Meja 12',
    items: [
      { name: 'Dark Choco 70% Single Origin', qty: 1, price: 55000, itemNotes: 'Less sugar' },
    ],
    totalAmount: 61050,
    paymentMethod: 'EDC_DEBIT',
    paymentMode: 'FULL',
    paymentStatus: 'VOIDED',
    referenceNumber: 'EDC-55410',
  },
];

export default function ShiftHistoryScreen({
  activeCabang,
  activeUser,
  onBack,
  onSelectReprintReceipt,
}: ShiftHistoryScreenProps) {
  const [transactions, setTransactions] = useState<ShiftTransaction[]>(INITIAL_TRANSACTIONS);
  const [activeFilter, setActiveFilter] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVoidTrx, setSelectedVoidTrx] = useState<ShiftTransaction | null>(null);

  const theme = useMemo(() => getTenantTheme(activeCabang), [activeCabang]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (activeFilter !== 'SEMUA') {
      result = result.filter((t) => t.paymentStatus === activeFilter);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          (t.customerName && t.customerName.toLowerCase().includes(q)) ||
          t.paymentMethod.toLowerCase().includes(q)
      );
    }
    return result;
  }, [transactions, activeFilter, searchQuery]);

  const handleConfirmRefund = async (otp: string, reason: string) => {
    if (!selectedVoidTrx) return;

    try {
      await processRefundTransaction({
        transactionId: selectedVoidTrx.id,
        otpAdmin: otp,
        refundReason: reason,
        refundAmount: selectedVoidTrx.totalAmount,
        cashierUser: activeUser,
      });

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === selectedVoidTrx.id ? { ...t, paymentStatus: 'VOIDED' } : t
        )
      );

      Alert.alert(
        '✅ REFUND BERHASIL',
        `Transaksi ${selectedVoidTrx.id} berhasil di-refund & dibatalkan.\nAlasan: ${reason}`
      );
    } catch (err: any) {
      Alert.alert('💥 REFUND GAGAL', err.message || 'Gagal memproses refund.');
    } finally {
      setSelectedVoidTrx(null);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bgPage }]}>

      <View style={[styles.header, { backgroundColor: theme.secondary }]}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← KEMBALI TO KASIR</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.secondaryText }]}>
          📋 RIWAYAT TRANSAKSI SHIFT BERJALAN
        </Text>
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>👤 {activeUser}</Text>
        </View>
      </View>

      <View style={styles.filterSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Cari ID Transaksi / Nama Pelanggan / Metode..."
          placeholderTextColor="#888888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillRow}>
          {['SEMUA', 'PAID', 'HALF_PAID', 'HELD', 'VOIDED'].map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterPill,
                  isActive
                    ? [styles.filterPillActive, { backgroundColor: theme.accent }]
                    : styles.filterPillInactive,
                ]}
              >
                <Text style={[styles.filterPillText, isActive && { color: theme.accentText, fontWeight: '900' }]}>
                  {filter === 'SEMUA' ? 'SEMUA STATUS' : filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const isVoided = item.paymentStatus === 'VOIDED';
          const isHalfPaid = item.paymentStatus === 'HALF_PAID';

          return (
            <View style={[styles.trxCard, isVoided && styles.trxCardVoided]}>

              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.trxIdText}>{item.id}</Text>
                  <Text style={styles.trxTimeText}>🕒 {item.timestamp}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    item.paymentStatus === 'PAID' && styles.statusPaid,
                    item.paymentStatus === 'HALF_PAID' && styles.statusHalfPaid,
                    item.paymentStatus === 'HELD' && styles.statusHeld,
                    item.paymentStatus === 'VOIDED' && styles.statusVoided,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{item.paymentStatus}</Text>
                </View>
              </View>

              {(item.customerName || item.tableNo) && (
                <View style={styles.customerRow}>
                  <Text style={styles.customerText}>
                    👤 {item.customerName || 'Tanpa Nama'} {item.tableNo ? `| 📍 ${item.tableNo}` : ''}
                  </Text>
                </View>
              )}

              <View style={styles.itemsBox}>
                {item.items.map((sub, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemNameText}>
                      {sub.qty}x {sub.name} {sub.isFreeBonus ? '(BONUS)' : ''}
                    </Text>
                    <Text style={styles.itemPriceText}>
                      {sub.isFreeBonus ? 'Rp 0' : formatRp(sub.price * sub.qty)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  <Text style={styles.payMethodText}>💳 METODE: {item.paymentMethod}</Text>
                  {isHalfPaid && (
                    <Text style={styles.halfPaidNotice}>
                      ⚠️ SISA PELUNASAN: {formatRp(item.remainingBalance || 0)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.totalAmountText, isVoided && styles.textStrike]}>
                  {formatRp(item.totalAmount)}
                </Text>
              </View>

              <View style={styles.cardActionRow}>
                {onSelectReprintReceipt && (
                  <Pressable
                    onPress={() => onSelectReprintReceipt(item)}
                    style={styles.actionBtnReprint}
                  >
                    <Text style={styles.actionBtnReprintText}>🖨️ CETAK ULANG STRUK</Text>
                  </Pressable>
                )}

                {!isVoided && (
                  <Pressable
                    onPress={() => setSelectedVoidTrx(item)}
                    style={styles.actionBtnRefund}
                  >
                    <Text style={styles.actionBtnRefundText}>⚠️ REFUND / VOID (OTP)</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      <VoidModal
        visible={!!selectedVoidTrx}
        targetTransactionInfo={
          selectedVoidTrx
            ? `${selectedVoidTrx.id} (${formatRp(selectedVoidTrx.totalAmount)} - ${selectedVoidTrx.customerName || 'Pelanggan'})`
            : undefined
        }
        onClose={() => setSelectedVoidTrx(null)}
        onConfirmVoid={handleConfirmRefund}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 3,
    borderColor: '#000000',
  },
  backBtn: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  headerTitle: { fontSize: 13, fontWeight: '900' },
  userBadge: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userBadgeText: { fontSize: 11, fontWeight: '800', color: '#000000' },
  filterSection: {
    padding: 12,
    borderBottomWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FAF3EC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  filterPillRow: { flexDirection: 'row' },
  filterPill: {
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  filterPillActive: {},
  filterPillInactive: { backgroundColor: '#FFFFFF' },
  filterPillText: { fontSize: 10, fontWeight: '800', color: '#000000' },

  listContainer: { padding: 12 },
  trxCard: {
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  trxCardVoided: { backgroundColor: '#FFEBEE', opacity: 0.8 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trxIdText: { fontSize: 14, fontWeight: '900', color: '#000000' },
  trxTimeText: { fontSize: 11, fontWeight: '700', color: '#666666' },
  statusBadge: { borderWidth: 1.5, borderColor: '#000000', paddingHorizontal: 8, paddingVertical: 2 },
  statusPaid: { backgroundColor: '#C8E6C9' },
  statusHalfPaid: { backgroundColor: '#FFE0B2' },
  statusHeld: { backgroundColor: '#BBDEFB' },
  statusVoided: { backgroundColor: '#FFCDD2' },
  statusBadgeText: { fontSize: 9, fontWeight: '900', color: '#000000' },

  customerRow: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  customerText: { fontSize: 11, fontWeight: '800', color: '#000000' },

  itemsBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 6,
    marginBottom: 8,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemNameText: { fontSize: 11, fontWeight: '700', color: '#333333' },
  itemPriceText: { fontSize: 11, fontWeight: '800', color: '#000000' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  footerLeft: { flex: 1 },
  payMethodText: { fontSize: 10, fontWeight: '800', color: '#555555' },
  halfPaidNotice: { fontSize: 10, fontWeight: '900', color: '#E65100', marginTop: 2 },
  totalAmountText: { fontSize: 16, fontWeight: '900', color: '#000000' },
  textStrike: { textDecorationLine: 'line-through', color: '#999999' },

  cardActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionBtnReprint: {
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnReprintText: { fontSize: 10, fontWeight: '900', color: '#000000' },
  actionBtnRefund: {
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnRefundText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },
});

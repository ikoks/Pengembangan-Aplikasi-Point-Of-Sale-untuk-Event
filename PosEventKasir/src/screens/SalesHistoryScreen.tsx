import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  SafeAreaView,
  Linking,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { formatRp } from '../constants/storeConfig';

export interface CompletedTransactionRecord {
  id: string;
  timestamp: string;
  queueNumber?: string;
  totalAmount: number;
  paymentMethod: string;
  salesMode: string;
  activeUser: string;
  itemsCount: number;
  itemsSummary: string;
  subtotal?: number;
  promoTotal?: number;
  voucherTotal?: number;
  discountTotal?: number;
  taxAmount?: number;
}

interface SalesHistoryScreenProps {
  activeCabang: string;
  activeUser: string;
  historyRecords: CompletedTransactionRecord[];
  onBackToPos: () => void;
  onTakeBreak?: () => void;
  onEndShift?: () => void;
  onOpenSettings?: () => void;
}

export default function SalesHistoryScreen({
  activeCabang,
  activeUser,
  historyRecords,
  onBackToPos,
  onTakeBreak,
  onEndShift,
  onOpenSettings,
}: SalesHistoryScreenProps) {
  const [selectedRecord, setSelectedRecord] = useState<CompletedTransactionRecord | null>(null);
  const [waNumberInput, setWaNumberInput] = useState<string>('');
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);

  const totalGrandRevenue = historyRecords.reduce((sum, r) => sum + r.totalAmount, 0);

  const handleOpenWaModal = (rec: CompletedTransactionRecord) => {
    setSelectedRecord(rec);
    setWaNumberInput('');
    setIsWaModalOpen(true);
  };

  const handleSendWaReceipt = () => {
    if (!selectedRecord || !waNumberInput.trim()) {
      Alert.alert('⚠️ NOMOR KOSONG', 'Silakan masukkan nomor WhatsApp pelanggan.');
      return;
    }
    let cleanPhone = waNumberInput.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    if (cleanPhone.length < 9) {
      Alert.alert('⚠️ NOMOR TIDAK VALID', 'Format nomor HP tidak valid (minimal 9 digit).');
      return;
    }

    const rec = selectedRecord;
    const text = `🧾 *STRUK PEMBAYARAN - ${activeCabang.toUpperCase()}*
---------------------------------
Antrean: #${rec.queueNumber || '-'}
No. Transaksi: #${rec.id}
Waktu: ${rec.timestamp}
Mode: ${rec.salesMode}
Kasir: ${rec.activeUser}

Item Pesanan:
${rec.itemsSummary}

Total Dibayar: ${formatRp(rec.totalAmount)}
Metode: ${rec.paymentMethod}
---------------------------------
Terima kasih telah berkunjung! 🙏`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    setIsWaModalOpen(false);
    Linking.openURL(url).catch(() => {
      Alert.alert('⚠️ KESALAHAN', 'Gagal membuka WhatsApp. Pastikan aplikasi WhatsApp terpasang di perangkat ini.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        {onBackToPos && (
          <Pressable onPress={onBackToPos} style={styles.backBtnHeader}>
            <Text style={styles.backBtnHeaderText}>← Kembali</Text>
          </Pressable>
        )}
        <Text style={styles.headerTitle}>RIWAYAT PENJUALAN HARI INI</Text>
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>👤 {activeUser}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Left Navigation Sidebar */}
        <View style={styles.sidebar}>
          <Pressable onPress={onBackToPos} style={styles.navItem}>
            <Text style={styles.navItemText}>⊞ MENU</Text>
          </Pressable>

          <Pressable
            onPress={() => onTakeBreak && onTakeBreak()}
            style={styles.navItem}
          >
            <Text style={styles.navItemText}>📊 GANTI KASIR</Text>
          </Pressable>

          <Pressable
            onPress={() => onEndShift && onEndShift()}
            style={styles.navItem}
          >
            <Text style={styles.navItemText}>🚪 TUTUP TOKO</Text>
          </Pressable>

          <View style={styles.navItemActive}>
            <Text style={styles.navItemActiveText}>📜 RIWAYAT PENJUALAN</Text>
          </View>

          <Pressable
            onPress={() => onOpenSettings && onOpenSettings()}
            style={styles.navItem}
          >
            <Text style={styles.navItemText}>⚙ PENGATURAN</Text>
          </Pressable>
        </View>

        {/* Right Content View */}
        <View style={styles.content}>
          <View style={styles.summaryBar}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>TOTAL TRANSAKSI HARI INI</Text>
              <Text style={styles.summaryBoxVal}>{historyRecords.length} Transaksi</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>TOTAL OMZET SHIFT INI</Text>
              <Text style={[styles.summaryBoxVal, { color: '#1B5E20' }]}>
                {formatRp(totalGrandRevenue)}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.recordList} showsVerticalScrollIndicator={false}>
            {historyRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>BELUM ADA TRANSAKSI HARI INI</Text>
                <Text style={styles.emptySub}>
                  Riwayat penjualan akan tercatat otomatis saat kasir menyelesaikan transaksi.
                </Text>
              </View>
            ) : (
              historyRecords.map((rec) => (
                <View key={rec.id} style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      {rec.queueNumber ? (
                        <View style={styles.queueBadge}>
                          <Text style={styles.queueBadgeText}>ANTREAN #{rec.queueNumber}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.trxIdText}>#{rec.id}</Text>
                    </View>
                    <Text style={styles.timeText}>🕒 {rec.timestamp}</Text>
                  </View>

                  <View style={styles.cardMiddle}>
                    <Text style={styles.itemsSummaryText} numberOfLines={2}>
                      📦 {rec.itemsSummary} ({rec.itemsCount} Item)
                    </Text>
                    <View style={styles.pillRow}>
                      <View style={styles.modePill}>
                        <Text style={styles.modePillText}>🏷️ {rec.salesMode}</Text>
                      </View>
                      <View style={styles.payPill}>
                        <Text style={styles.payPillText}>💳 {rec.paymentMethod}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.totalLabel}>TOTAL DIBAYAR</Text>
                      <Text style={styles.totalVal}>{formatRp(rec.totalAmount)}</Text>
                    </View>

                    <Pressable
                      onPress={() => handleOpenWaModal(rec)}
                      style={styles.waBtn}
                    >
                      <Text style={styles.waBtnText}>📲 STRUK WA</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Modal Input Nomor WA Struk */}
      <Modal visible={isWaModalOpen} transparent animationType="fade" onRequestClose={() => setIsWaModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalHeader, { backgroundColor: '#25D366' }]}>
              <Text style={[styles.modalHeaderText, { color: '#FFFFFF' }]}>📲 STRUK DIGITAL VIA WHATSAPP</Text>
              <Pressable onPress={() => setIsWaModalOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSectionLabel}>MASUKKAN NOMOR WHATSAPP PELANGGAN:</Text>
              <TextInput
                style={styles.waInput}
                keyboardType="phone-pad"
                placeholder="Contoh: 081234567890"
                placeholderTextColor="#999"
                value={waNumberInput}
                onChangeText={setWaNumberInput}
              />
              <Text style={styles.waHelpText}>
                *Struk terformat lengkap beserta Rincian Item, Total Bayar & Nomor Antrean #{selectedRecord?.queueNumber || ''} akan otomatis dikirimkan via WhatsApp.
              </Text>

              <View style={styles.modalActionRow}>
                <Pressable onPress={() => setIsWaModalOpen(false)} style={styles.cancelModalBtn}>
                  <Text style={styles.cancelModalText}>BATAL</Text>
                </Pressable>
                <Pressable onPress={handleSendWaReceipt} style={styles.confirmWaBtn}>
                  <Text style={styles.confirmWaText}>KIRIM STRUK VIA WA ➔</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtnHeader: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  backBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  headerIcon: { fontSize: 20, fontWeight: '900', color: '#000000' },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
  userBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userBadgeText: { fontSize: 11, fontWeight: '900', color: '#000000' },

  body: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 3,
    borderColor: '#000000',
    padding: 12,
    gap: 8,
  },
  navItem: {
    height: 44,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  navItemText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  navItemActive: {
    height: 44,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#000000',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  navItemActiveText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },

  content: { flex: 1, padding: 14 },
  summaryBar: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  summaryBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    padding: 12,
  },
  summaryBoxLabel: { fontSize: 10, fontWeight: '900', color: '#666666' },
  summaryBoxVal: { fontSize: 16, fontWeight: '900', color: '#000000', fontFamily: 'monospace', marginTop: 4 },

  recordList: { flex: 1 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: '#000000' },
  emptySub: { fontSize: 11, fontWeight: '700', color: '#666666', marginTop: 4, textAlign: 'center' },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  queueBadge: { backgroundColor: '#FFDD00', borderWidth: 2, borderColor: '#000000', paddingHorizontal: 6, paddingVertical: 2 },
  queueBadgeText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  trxIdText: { fontSize: 13, fontWeight: '900', color: '#000000' },
  timeText: { fontSize: 11, fontWeight: '700', color: '#666666' },
  cardMiddle: { marginBottom: 8 },
  itemsSummaryText: { fontSize: 11, fontWeight: '700', color: '#333333', marginBottom: 6 },
  pillRow: { flexDirection: 'row', gap: 8 },
  modePill: { backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: '#000000', paddingHorizontal: 6, paddingVertical: 2 },
  modePillText: { fontSize: 10, fontWeight: '800', color: '#000000' },
  payPill: { backgroundColor: '#E3F2FD', borderWidth: 1.5, borderColor: '#000000', paddingHorizontal: 6, paddingVertical: 2 },
  payPillText: { fontSize: 10, fontWeight: '800', color: '#1565C0' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderColor: '#000000', paddingTop: 8 },
  totalLabel: { fontSize: 10, fontWeight: '900', color: '#666666' },
  totalVal: { fontSize: 14, fontWeight: '900', color: '#000000', fontFamily: 'monospace' },
  waBtn: { backgroundColor: '#25D366', borderWidth: 2, borderColor: '#000000', paddingHorizontal: 10, paddingVertical: 6 },
  waBtnText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '90%', maxWidth: 440, backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: '#000000', overflow: 'hidden' },
  modalHeader: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 3, borderColor: '#000000' },
  modalHeaderText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  closeBtn: { width: 28, height: 28, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  modalBody: { padding: 16 },
  modalSectionLabel: { fontSize: 11, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
  waInput: { height: 46, borderWidth: 2.5, borderColor: '#000000', backgroundColor: '#FFFFFF', paddingHorizontal: 12, fontSize: 14, fontWeight: '900', fontFamily: 'monospace', color: '#000000', marginTop: 8 },
  waHelpText: { fontSize: 10, color: '#666', marginTop: 6, fontWeight: '700' },
  modalActionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cancelModalBtn: { flex: 1, height: 44, borderWidth: 2.5, borderColor: '#000000', backgroundColor: '#EEEEEE', justifyContent: 'center', alignItems: 'center' },
  cancelModalText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  confirmWaBtn: { flex: 1.5, height: 44, borderWidth: 2.5, borderColor: '#000000', backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' },
  confirmWaText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
});

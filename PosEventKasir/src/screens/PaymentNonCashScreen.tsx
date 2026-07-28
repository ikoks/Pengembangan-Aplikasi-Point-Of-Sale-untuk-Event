// =============================================================================
// src/screens/PaymentNonCashScreen.tsx
// === [UPDATE POS-B-07] === Manual Non-Cash Payment Modal
// Aturan Ketat: TIDAK ada SDK Payment Gateway, TIDAK ada QRIS Dinamis.
// Semua pembayaran non-tunai diinput secara MANUAL oleh kasir.
// =============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { validateNonCashPayment } from '../utils/checkoutValidation';

// =============================================================================
// === [UPDATE POS-B-07] === INTERFACE PROPS
// =============================================================================
export interface PaymentNonCashScreenProps {
  isVisible: boolean;
  totalAmount: number;
  onClose: () => void;
  onSuccessPayment: (method: string, referenceNumber: string) => void;
  activeCabang?: string; // === [UPDATE POS-B-07] === Prop cabang aktif untuk tema dinamis
}

// =============================================================================
// === [UPDATE POS-B-07] === DAFTAR METODE PEMBAYARAN NON-TUNAI MANUAL
// ATURAN KETAT: TIDAK ADA QRIS Dinamis / Payment Gateway SDK.
// Semua adalah metode manual yang dikonfirmasi oleh kasir.
// =============================================================================
const PAYMENT_METHODS: {
  id: string;
  label: string;
  icon: string;
  category: string;
  refLabel: string;
  refPlaceholder: string;
  refHint: string;
}[] = [
  {
    id: 'EDC_DEBIT',
    label: 'EDC / DEBIT',
    icon: '💳',
    category: 'Mesin EDC',
    refLabel: 'NO. TRACE / APPROVAL CODE EDC',
    refPlaceholder: 'Contoh: 123456 (dari struk EDC)',
    refHint: 'Masukkan No. Trace atau Approval Code dari struk mesin EDC.',
  },
  {
    id: 'EDC_KREDIT',
    label: 'EDC / KREDIT',
    icon: '💳',
    category: 'Mesin EDC',
    refLabel: 'NO. TRACE / APPROVAL CODE EDC',
    refPlaceholder: 'Contoh: 654321 (dari struk EDC)',
    refHint: 'Masukkan No. Trace atau Approval Code dari struk mesin EDC kartu kredit.',
  },
  {
    id: 'TRANSFER_BANK',
    label: 'TRANSFER BANK',
    icon: '🏦',
    category: 'Transfer Bank',
    refLabel: 'NO. REFERENSI / KODE TRANSFER BANK',
    refPlaceholder: 'Contoh: TRF-20240801-001 atau No. Resi BCA',
    refHint: 'Masukkan No. Referensi atau Kode Unik Transfer dari notifikasi banking pembeli.',
  },
  {
    id: 'QRIS_MANUAL',
    label: 'QRIS (Manual)',
    icon: '📱',
    category: 'QRIS Statis',
    refLabel: 'NO. REFERENSI / ID TRANSAKSI QRIS',
    refPlaceholder: 'Contoh: QRS202408010001 (dari notif QRIS)',
    refHint: 'QRIS Statis: Scan QR code fisik kasir → konfirmasi ke pembeli → masukkan ID transaksi dari notifikasi.',
  },
  {
    id: 'VA_BCA',
    label: 'VA BCA',
    icon: '🏛️',
    category: 'Virtual Account',
    refLabel: 'NO. REFERENSI PEMBAYARAN VA BCA',
    refPlaceholder: 'Contoh: 1234567890 (dari mutasi/notif BCA)',
    refHint: 'Masukkan No. Referensi dari notifikasi pembayaran Virtual Account BCA.',
  },
  {
    id: 'VA_MANDIRI',
    label: 'VA Mandiri',
    icon: '🏛️',
    category: 'Virtual Account',
    refLabel: 'NO. REFERENSI PEMBAYARAN VA MANDIRI',
    refPlaceholder: 'Contoh: 8888001234567 (dari mutasi/notif Mandiri)',
    refHint: 'Masukkan No. Referensi dari notifikasi pembayaran Virtual Account Mandiri.',
  },
];

// =============================================================================
// === [UPDATE POS-B-07] === HELPER FORMAT RUPIAH
// =============================================================================
const formatRp = (num: number): string => {
  const formatted = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
};

// =============================================================================
// === [UPDATE POS-B-07] === DYNAMIC THEME RESOLVER BERDASARKAN TOKO AKTIF
// Skema warna header & aksen mengikuti brand toko aktif.
// =============================================================================
type StoreTheme = {
  accent: string;
  accentText: string;
  headerBg: string;
  headerText: string;
  methodActiveBg: string;
  methodActiveText: string;
};

const getStoreTheme = (cabang?: string): StoreTheme => {
  if (!cabang) {
    // Default: Let's Go Gelato - Kuning
    return {
      accent: '#FFDD00',
      accentText: '#000000',
      headerBg: '#FFDD00',
      headerText: '#000000',
      methodActiveBg: '#FFDD00',
      methodActiveText: '#000000',
    };
  }

  const lower = cabang.toLowerCase();

  if (lower.includes('terve') || lower.includes('chocolate')) {
    // Terve Chocolate - Coklat Tua
    return {
      accent: '#5C3317',
      accentText: '#F5E6D3',
      headerBg: '#5C3317',
      headerText: '#F5E6D3',
      methodActiveBg: '#5C3317',
      methodActiveText: '#F5E6D3',
    };
  }

  if (lower.includes('papyrus') || lower.includes('photo')) {
    // Papyrus Photo - Hitam
    return {
      accent: '#000000',
      accentText: '#FFFFFF',
      headerBg: '#000000',
      headerText: '#FFFFFF',
      methodActiveBg: '#1A1A1A',
      methodActiveText: '#FFFFFF',
    };
  }

  // Default: Let's Go Gelato - Kuning
  return {
    accent: '#FFDD00',
    accentText: '#000000',
    headerBg: '#FFDD00',
    headerText: '#000000',
    methodActiveBg: '#FFDD00',
    methodActiveText: '#000000',
  };
};

// =============================================================================
// === [UPDATE POS-B-07] === KOMPONEN UTAMA PAYMENTNONCCASHSCREEN
// =============================================================================
export default function PaymentNonCashScreen({
  isVisible,
  totalAmount,
  onClose,
  onSuccessPayment,
  activeCabang,
}: PaymentNonCashScreenProps) {

  // === [UPDATE POS-B-07] === State: Metode Pembayaran yang Dipilih
  const [selectedMethodId, setSelectedMethodId] = useState<string>('EDC_DEBIT');

  // === [UPDATE POS-B-07] === State: Nomor Referensi / RRN / Kode Transfer (WAJIB DIISI)
  const [referenceNumber, setReferenceNumber] = useState<string>('');

  // === [UPDATE POS-B-07] === State: Dropdown metode terbuka/tertutup
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // === [UPDATE POS-B-07] === State: Error validasi referensi
  const [refError, setRefError] = useState<string>('');

  // Animasi scale untuk tombol konfirmasi
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // === [UPDATE POS-B-07] === Tema Dinamis berdasarkan Toko Aktif
  const activeTheme = useMemo(() => getStoreTheme(activeCabang), [activeCabang]);

  // === [UPDATE POS-B-07] === Metode yang sedang dipilih (object lengkap)
  const selectedMethod = useMemo(
    () => PAYMENT_METHODS.find((m) => m.id === selectedMethodId) ?? PAYMENT_METHODS[0],
    [selectedMethodId],
  );

  // === [UPDATE POS-B-07] === Reset state saat modal dibuka
  useEffect(() => {
    if (isVisible) {
      setSelectedMethodId('EDC_DEBIT');
      setReferenceNumber('');
      setRefError('');
      setIsDropdownOpen(false);
    }
  }, [isVisible]);

  // === [UPDATE POS-B-07] === Reset referensi & error saat metode berganti
  useEffect(() => {
    setReferenceNumber('');
    setRefError('');
  }, [selectedMethodId]);

  // === [UPDATE POS-B-07] === Validasi Real-Time: Nomor Referensi minimal 4 karakter
  const isRefValid = referenceNumber.trim().length >= 4;
  const isPayable = isRefValid;

  // === [UPDATE POS-B-07] === Handler: Pilih Metode dari Dropdown
  const handleSelectMethod = (methodId: string) => {
    setSelectedMethodId(methodId);
    setIsDropdownOpen(false);
  };

  // === [UPDATE POS-B-07] === Handler: Konfirmasi Pembayaran dengan Validasi Ketat
  const handleConfirm = () => {
    const trimmedRef = referenceNumber.trim();

    if (trimmedRef.length < 4) {
      setRefError(`⚠️ ${selectedMethod.refLabel} wajib diisi minimal 4 karakter.`);
      return;
    }

    const validation = validateNonCashPayment(selectedMethodId, trimmedRef);
    if (!validation.isValid) {
      Alert.alert(
        '💥 DATA TIDAK VALID',
        validation.errorMessage || 'Data pembayaran non-tunai tidak valid. Periksa kembali.',
      );
      return;
    }

    // Animasi konfirmasi sebelum callback
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      onSuccessPayment(selectedMethodId, trimmedRef);
    });
  };

  // === [UPDATE POS-B-07] === Handler: Clear Nomor Referensi
  const handleClearRef = () => {
    setReferenceNumber('');
    setRefError('');
  };

  // === [UPDATE POS-B-07] === Handler: Perubahan input referensi (bersihkan error saat mengetik)
  const handleRefChange = (text: string) => {
    setReferenceNumber(text);
    if (refError) setRefError('');
  };

  // Grouping metode berdasarkan kategori untuk tampilan dropdown
  const methodCategories = useMemo(() => {
    const cats: Record<string, typeof PAYMENT_METHODS> = {};
    PAYMENT_METHODS.forEach((m) => {
      if (!cats[m.category]) cats[m.category] = [];
      cats[m.category].push(m);
    });
    return cats;
  }, []);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>

          {/* ================================================================= */}
          {/* === [UPDATE POS-B-07] === HEADER MODAL (WARNA TEMA TOKO AKTIF)   */}
          {/* ================================================================= */}
          <View style={[styles.modalHeader, { backgroundColor: activeTheme.headerBg }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.modalTitle, { color: activeTheme.headerText }]}>
                💳 PEMBAYARAN NON-TUNAI
              </Text>
              <View style={[styles.headerBadge, { borderColor: activeTheme.headerText }]}>
                <Text style={[styles.headerBadgeText, { color: activeTheme.headerText }]}>
                  MANUAL — TANPA GATEWAY
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed ? styles.btnPressed : styles.btnUnpressed,
              ]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >

            {/* ================================================================= */}
            {/* === [UPDATE POS-B-07] === KOTAK TOTAL TAGIHAN (WARNA TEMA AKTIF) */}
            {/* ================================================================= */}
            <View style={[styles.totalBox, { backgroundColor: activeTheme.accent, borderColor: '#000' }]}>
              <Text style={[styles.totalLabel, { color: activeTheme.accentText }]}>
                TOTAL TAGIHAN BELANJA
              </Text>
              <Text style={[styles.totalValue, { color: activeTheme.accentText }]}>
                {formatRp(totalAmount)}
              </Text>
            </View>

            {/* ================================================================= */}
            {/* === [UPDATE POS-B-07] === DROPDOWN PILIHAN METODE PEMBAYARAN     */}
            {/* Berisi: Mesin EDC (Debit/Kredit), Transfer Bank, QRIS Statis,    */}
            {/* Virtual Account BCA, VA Mandiri.                                  */}
            {/* ATURAN KETAT: TIDAK ADA Payment Gateway / QRIS Dinamis.          */}
            {/* ================================================================= */}
            <Text style={styles.sectionLabel}>📋 METODE PEMBAYARAN NON-TUNAI</Text>
            <View style={styles.dropdownWrapper}>
              {/* Tombol Trigger Dropdown */}
              <Pressable
                onPress={() => setIsDropdownOpen((prev) => !prev)}
                style={({ pressed }) => [
                  styles.dropdownTrigger,
                  isDropdownOpen && styles.dropdownTriggerOpen,
                  pressed ? styles.btnPressed : styles.btnUnpressed,
                ]}
              >
                <View style={styles.dropdownTriggerLeft}>
                  <Text style={styles.dropdownTriggerIcon}>{selectedMethod.icon}</Text>
                  <View>
                    <Text style={styles.dropdownTriggerCategory}>{selectedMethod.category}</Text>
                    <Text style={styles.dropdownTriggerLabel}>{selectedMethod.label}</Text>
                  </View>
                </View>
                <Text style={styles.dropdownChevron}>
                  {isDropdownOpen ? '▲' : '▼'}
                </Text>
              </Pressable>

              {/* Panel Dropdown (muncul jika terbuka) */}
              {isDropdownOpen && (
                <View style={styles.dropdownPanel}>
                  <ScrollView
                    nestedScrollEnabled
                    style={styles.dropdownScrollArea}
                    showsVerticalScrollIndicator={false}
                  >
                    {Object.entries(methodCategories).map(([category, methods]) => (
                      <View key={category}>
                        {/* Label Kategori */}
                        <View style={styles.dropdownCategoryHeader}>
                          <Text style={styles.dropdownCategoryLabel}>{category}</Text>
                        </View>
                        {/* Item-item Metode dalam Kategori */}
                        {methods.map((method) => {
                          const isActive = selectedMethodId === method.id;
                          return (
                            <TouchableOpacity
                              key={method.id}
                              onPress={() => handleSelectMethod(method.id)}
                              activeOpacity={0.7}
                              style={[
                                styles.dropdownItem,
                                isActive && {
                                  backgroundColor: activeTheme.methodActiveBg,
                                  borderLeftWidth: 5,
                                  borderLeftColor: activeTheme.accent,
                                },
                              ]}
                            >
                              <Text style={styles.dropdownItemIcon}>{method.icon}</Text>
                              <View style={styles.dropdownItemTextCol}>
                                <Text
                                  style={[
                                    styles.dropdownItemLabel,
                                    isActive && { color: activeTheme.methodActiveText },
                                  ]}
                                >
                                  {method.label}
                                </Text>
                                <Text
                                  style={[
                                    styles.dropdownItemHint,
                                    isActive && { color: activeTheme.methodActiveText, opacity: 0.75 },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {method.refHint}
                                </Text>
                              </View>
                              {isActive && (
                                <Text style={[styles.dropdownCheckmark, { color: activeTheme.methodActiveText }]}>
                                  ✔
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* ================================================================= */}
            {/* === [UPDATE POS-B-07] === INFO METODE TERPILIH                   */}
            {/* Panduan kontekstual sesuai metode yang dipilih kasir.            */}
            {/* ================================================================= */}
            <View style={[styles.methodInfoBox, { borderColor: activeTheme.accent, borderLeftColor: activeTheme.accent }]}>
              <Text style={styles.methodInfoTitle}>
                {selectedMethod.icon} {selectedMethod.label} — {selectedMethod.category}
              </Text>
              <Text style={styles.methodInfoHint}>{selectedMethod.refHint}</Text>
            </View>

            {/* ================================================================= */}
            {/* === [UPDATE POS-B-07] === INPUT NOMOR REFERENSI / RRN / KODE    */}
            {/* Kolom wajib diisi oleh kasir sebagai bukti pembayaran manual.   */}
            {/* ================================================================= */}
            <Text style={styles.sectionLabel}>
              🔑 {selectedMethod.refLabel} <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.refInput,
                  refError ? styles.refInputError : null,
                  isRefValid ? styles.refInputValid : null,
                ]}
                placeholder={selectedMethod.refPlaceholder}
                placeholderTextColor="#999"
                value={referenceNumber}
                onChangeText={handleRefChange}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={50}
                returnKeyType="done"
              />
              {referenceNumber.length > 0 && (
                <Pressable
                  onPress={handleClearRef}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    pressed ? styles.btnPressed : styles.btnUnpressed,
                  ]}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Indikator counter karakter & status validasi input */}
            <View style={styles.inputStatusRow}>
              {refError ? (
                <Text style={styles.refErrorText}>{refError}</Text>
              ) : isRefValid ? (
                <Text style={styles.refValidText}>✔ Nomor referensi valid</Text>
              ) : (
                <Text style={styles.inputHint}>
                  * Wajib diisi minimal 4 karakter.
                </Text>
              )}
              <Text style={[styles.charCounter, referenceNumber.length >= 45 && styles.charCounterWarn]}>
                {referenceNumber.length}/50
              </Text>
            </View>

            {/* ================================================================= */}
            {/* === [UPDATE POS-B-07] === BANNER PERINGATAN "TANPA GATEWAY"      */}
            {/* Penegasan bahwa pembayaran ini manual dan tanpa Payment Gateway. */}
            {/* ================================================================= */}
            <View style={styles.warningBanner}>
              <Text style={styles.warningBannerIcon}>⚠️</Text>
              <Text style={styles.warningBannerText}>
                Pembayaran ini bersifat <Text style={styles.warningBold}>MANUAL</Text>. Pastikan kasir sudah menerima konfirmasi
                pembayaran dari pembeli (notifikasi bank / struk EDC / screenshot QRIS) sebelum mengkonfirmasi.
                Tidak ada verifikasi otomatis dari sistem.
              </Text>
            </View>

            {/* ================================================================= */}
            {/* === [UPDATE POS-B-07] === TOMBOL KONFIRMASI PEMBAYARAN           */}
            {/* Dikunci (disabled) jika Nomor Referensi belum valid (< 4 char). */}
            {/* ================================================================= */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                disabled={!isPayable}
                onPress={handleConfirm}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  !isPayable
                    ? styles.confirmBtnDisabled
                    : pressed
                    ? styles.btnPressed
                    : styles.btnUnpressed,
                  isPayable && { backgroundColor: '#00E676' },
                ]}
              >
                {isPayable ? (
                  <Text style={styles.confirmBtnText}>
                    💳 KONFIRMASI PEMBAYARAN NON-TUNAI ➔
                  </Text>
                ) : (
                  <Text style={styles.confirmBtnTextDisabled}>
                    🔒 ISI NOMOR REFERENSI TERLEBIH DAHULU (MIN. 4 KARAKTER)
                  </Text>
                )}
              </Pressable>
            </Animated.View>

            {/* ================================================================= */}
            {/* METODE TERPILIH - RINGKASAN (PREVIEW SEBELUM KONFIRMASI)         */}
            {/* ================================================================= */}
            {isPayable && (
              <View style={[styles.confirmSummaryBox, { borderColor: activeTheme.accent }]}>
                <Text style={styles.confirmSummaryTitle}>📋 RINGKASAN TRANSAKSI NON-TUNAI</Text>
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmSummaryKey}>Metode</Text>
                  <Text style={styles.confirmSummaryValue}>
                    {selectedMethod.icon} {selectedMethod.label}
                  </Text>
                </View>
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmSummaryKey}>No. Referensi</Text>
                  <Text style={[styles.confirmSummaryValue, styles.confirmSummaryValueRef]}>
                    {referenceNumber.trim()}
                  </Text>
                </View>
                <View style={styles.confirmSummaryRow}>
                  <Text style={styles.confirmSummaryKey}>Total</Text>
                  <Text style={[styles.confirmSummaryValue, styles.confirmSummaryValueTotal]}>
                    {formatRp(totalAmount)}
                  </Text>
                </View>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// =============================================================================
// STYLES (Neo-Brutalist — Skema Warna Dinamis Mengikuti Tema Toko Aktif)
// =============================================================================
const styles = StyleSheet.create({
  // ---- Overlay & Card Utama ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 14,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // ---- Header ----
  modalHeader: {
    height: 60,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 38,
    height: 38,
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

  // ---- Total Tagihan Box ----
  totalBox: {
    borderWidth: 3.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
  },

  // ---- Section Label ----
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#FF3B30',
    fontWeight: '900',
  },

  // ---- Dropdown Metode Pembayaran ----
  dropdownWrapper: {
    marginBottom: 14,
    position: 'relative',
    zIndex: 100,
  },
  dropdownTrigger: {
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dropdownTriggerOpen: {
    borderBottomWidth: 2,
    borderBottomColor: '#555555',
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownTriggerIcon: {
    fontSize: 22,
  },
  dropdownTriggerCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownTriggerLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
  },
  dropdownChevron: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  dropdownPanel: {
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: '#000000',
    backgroundColor: '#FAFAFA',
    maxHeight: 280,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  dropdownScrollArea: {
    flex: 1,
  },
  dropdownCategoryHeader: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dropdownCategoryLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E0E0E0',
    gap: 10,
    borderLeftWidth: 5,
    borderLeftColor: 'transparent',
  },
  dropdownItemIcon: {
    fontSize: 20,
  },
  dropdownItemTextCol: {
    flex: 1,
  },
  dropdownItemLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
  },
  dropdownItemHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555555',
    marginTop: 1,
  },
  dropdownCheckmark: {
    fontSize: 16,
    fontWeight: '900',
  },

  // ---- Info Box Metode Terpilih ----
  methodInfoBox: {
    borderWidth: 2.5,
    borderLeftWidth: 5,
    backgroundColor: '#FFFDE0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 4,
  },
  methodInfoTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
  },
  methodInfoHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 16,
  },

  // ---- Input Nomor Referensi ----
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  refInput: {
    flex: 1,
    height: 50,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  refInputError: {
    borderColor: '#C62828',
    backgroundColor: '#FFF5F5',
  },
  refInputValid: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1FDF3',
  },
  clearBtn: {
    width: 50,
    height: 50,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  inputStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    minHeight: 18,
  },
  inputHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666666',
  },
  refErrorText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#C62828',
    flex: 1,
  },
  refValidText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2E7D32',
    flex: 1,
  },
  charCounter: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999999',
    marginLeft: 4,
  },
  charCounterWarn: {
    color: '#E65100',
  },

  // ---- Banner Peringatan Manual ----
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    borderWidth: 2.5,
    borderColor: '#856404',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
    gap: 8,
  },
  warningBannerIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: '#533F03',
    lineHeight: 15,
  },
  warningBold: {
    fontWeight: '900',
    color: '#533F03',
  },

  // ---- Tombol Konfirmasi ----
  confirmBtn: {
    height: 56,
    borderWidth: 4,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmBtnDisabled: {
    backgroundColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderColor: '#888888',
    elevation: 0,
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  confirmBtnTextDisabled: {
    fontSize: 11,
    fontWeight: '900',
    color: '#777777',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // ---- Ringkasan Konfirmasi (Preview) ----
  confirmSummaryBox: {
    borderWidth: 3,
    borderStyle: 'dashed',
    backgroundColor: '#F8F8F8',
    padding: 14,
    gap: 8,
  },
  confirmSummaryTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 6,
  },
  confirmSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmSummaryKey: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555555',
    textTransform: 'uppercase',
    flex: 1,
  },
  confirmSummaryValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    flex: 2,
    textAlign: 'right',
  },
  confirmSummaryValueRef: {
    fontFamily: 'monospace',
    letterSpacing: 1,
    color: '#1A237E',
  },
  confirmSummaryValueTotal: {
    fontSize: 16,
    color: '#1B5E20',
  },

  // ---- State Efek Neo-Brutalist ----
  btnUnpressed: {
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  btnPressed: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
});

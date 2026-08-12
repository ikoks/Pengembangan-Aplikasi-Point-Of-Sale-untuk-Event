import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { PaymentMode } from '../types/pos';

export interface PaymentNonCashScreenProps {
  isVisible: boolean;
  totalAmount: number;
  onClose: () => void;
  onSuccessPayment: (
    method: string,
    referenceNumber: string,
    paymentMode?: PaymentMode,
    remainingBalance?: number,
  ) => void;
  onSwitchToCash?: () => void;
  activeCabang?: string;
}

const formatRp = (num: number): string => {
  const formatted = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
};

const PAYMENT_METHODS = [
  {
    id: 'EDC_NFC',
    label: 'EDC NFC TAP',
    fullName: 'EDC BLUETOOTH / NFC CONTACTLESS',
    icon: '💳',
  },
  {
    id: 'CARD',
    label: 'KARTU DEBIT / KREDIT',
    fullName: '💳 EDC KARTU DEBIT / KREDIT (GESEK / DIP)',
    icon: '💳',
  },
  {
    id: 'QRIS',
    label: 'QRIS',
    fullName: '📱 QRIS (E-WALLET & BANK)',
    icon: '📱',
  },
];

export default function PaymentNonCashScreen({
  isVisible,
  totalAmount,
  onClose,
  onSuccessPayment,
  onSwitchToCash,
}: PaymentNonCashScreenProps) {
  const [paymentType, setPaymentType] = useState<'TUNAI' | 'NON-TUNAI'>('NON-TUNAI');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('EDC_NFC');
  const [cashInput, setCashInput] = useState<string>('');
  const [referenceInput, setReferenceInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setPaymentType('NON-TUNAI');
      setSelectedMethodId('EDC_NFC');
      setCashInput('');
      setReferenceInput('');
    }
  }, [isVisible]);

  const selectedMethod = useMemo(
    () => PAYMENT_METHODS.find((m) => m.id === selectedMethodId) || PAYMENT_METHODS[0],
    [selectedMethodId],
  );

  const numericCash = parseInt(cashInput || '0', 10);
  const changeAmount = numericCash > totalAmount ? numericCash - totalAmount : 0;

  const handleConfirmPayment = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (paymentType === 'TUNAI') {
        const paid = numericCash || totalAmount;
        const change = paid > totalAmount ? paid - totalAmount : 0;
        onSuccessPayment('TUNAI', `CASH-${Date.now().toString().slice(-6)}`, 'FULL', change);
      } else {
        const refNum = referenceInput.trim() || `REF-${Date.now().toString().slice(-6)}`;
        onSuccessPayment(selectedMethod.fullName, refNum, 'FULL', 0);
      }
    }, 400);
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCardWrapper}>
          <View style={styles.modalCardShadow} />
          <View style={styles.modalCardBody}>

            {/* Header */}
            <View style={[styles.headerRow, { justifyContent: 'center' }]}>
              <Text style={styles.headerTitle}>
                {paymentType === 'TUNAI' ? 'PEMBAYARAN TUNAI' : 'PEMBAYARAN NON-TUNAI'}
              </Text>
            </View>

            {/* Total Tagihan Card Banner */}
            <View style={styles.totalTagihanBanner}>
              <Text style={styles.totalTagihanLabel}>TOTAL TAGIHAN</Text>
              <Text style={styles.totalTagihanVal}>{formatRp(totalAmount)}</Text>
            </View>

            {/* Payment Type Buttons (TUNAI vs NON-TUNAI) */}
            <View style={styles.paymentTypeRow}>
              <Pressable
                onPress={() => {
                  if (onSwitchToCash) {
                    onSwitchToCash();
                  } else {
                    setPaymentType('TUNAI');
                  }
                }}
                style={[
                  styles.typeBox,
                  paymentType === 'TUNAI' ? styles.typeBoxActive : styles.typeBoxInactive,
                ]}
              >
                <Text style={[styles.typeIcon, paymentType === 'TUNAI' && styles.typeTextActive]}>💵</Text>
                <Text style={[styles.typeLabel, paymentType === 'TUNAI' && styles.typeTextActive]}>TUNAI</Text>
              </Pressable>

              <Pressable
                onPress={() => setPaymentType('NON-TUNAI')}
                style={[
                  styles.typeBox,
                  paymentType === 'NON-TUNAI' ? styles.typeBoxActive : styles.typeBoxInactive,
                ]}
              >
                <Text style={[styles.typeIcon, paymentType === 'NON-TUNAI' && styles.typeTextActive]}>💳</Text>
                <Text style={[styles.typeLabel, paymentType === 'NON-TUNAI' && styles.typeTextActive]}>NON-TUNAI</Text>
              </Pressable>
            </View>

            {/* Render TUNAI Mode Layout */}
            {paymentType === 'TUNAI' ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>INPUT NOMINAL MANUAL</Text>
                <View style={styles.cashInputRow}>
                  <Text style={styles.cashInputRpPrefix}>Rp</Text>
                  <TextInput
                    style={styles.cashInputField}
                    placeholder="0"
                    placeholderTextColor="#CCCCCC"
                    value={cashInput}
                    onChangeText={(t) => setCashInput(t.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>

                {/* 2 Gray Info Cards */}
                <View style={styles.cashInfoCardsRow}>
                  <View style={styles.cashInfoCard}>
                    <Text style={styles.cashInfoCardLabel}>UANG DITERIMA</Text>
                    <Text style={styles.cashInfoCardVal}>
                      {cashInput ? formatRp(numericCash) : 'Rp 0'}
                    </Text>
                  </View>

                  <View style={styles.cashInfoCard}>
                    <Text style={styles.cashInfoCardLabel}>KEMBALIAN</Text>
                    <Text style={styles.cashInfoCardVal}>
                      {cashInput ? formatRp(changeAmount) : 'Rp 0'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              /* Render NON-TUNAI Mode Layout (3 Option Grid) */
              <View style={{ marginBottom: 20 }}>
                <View style={styles.threeOptionsGrid}>
                  {PAYMENT_METHODS.map((method) => {
                    const isActive = selectedMethodId === method.id;
                    return (
                      <Pressable
                        key={method.id}
                        onPress={() => setSelectedMethodId(method.id)}
                        style={[
                          styles.subMethodBox,
                          isActive ? styles.subMethodBoxActive : styles.subMethodBoxInactive,
                        ]}
                      >
                        <Text style={[styles.subMethodIcon, isActive && styles.subMethodTextActive]}>
                          {method.icon}
                        </Text>
                        <Text style={[styles.subMethodLabel, isActive && styles.subMethodTextActive]}>
                          {method.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Selected Method Gray Card Box */}
                <View style={styles.grayDetailBox}>
                  <Text style={styles.grayDetailTitle}>{selectedMethod.fullName}</Text>
                  <Text style={styles.grayDetailSubLabel}>NOMOR REFERENSI (OPSIONAL)</Text>
                  <TextInput
                    style={styles.refInputBox}
                    placeholder="Masukkan no. referensi..."
                    placeholderTextColor="#888888"
                    value={referenceInput}
                    onChangeText={setReferenceInput}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {/* Footer Actions */}
            <View style={styles.footerRow}>
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>BATALKAN TRANSAKSI</Text>
              </Pressable>

              <Pressable
                disabled={isLoading}
                onPress={handleConfirmPayment}
                style={({ pressed }) => [
                  styles.finishBtnBase,
                  pressed && { opacity: 0.85 },
                  isLoading && { opacity: 0.7 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.finishBtnText}>CETAK STRUK & SELESAI</Text>
                )}
              </Pressable>
            </View>

          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardWrapper: {
    width: '100%',
    maxWidth: 620,
    position: 'relative',
  },
  modalCardShadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: -8,
    bottom: -8,
    backgroundColor: '#000000',
    zIndex: -1,
  },
  modalCardBody: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtnHeader: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  backBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  totalTagihanBanner: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  totalTagihanLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#777777',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  totalTagihanVal: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  paymentTypeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  typeBox: {
    flex: 1,
    height: 90,
    borderWidth: 1.5,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  typeBoxInactive: {
    backgroundColor: '#FFFFFF',
  },
  typeBoxActive: {
    backgroundColor: '#000000',
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  typeIcon: {
    fontSize: 22,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#777777',
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  cashInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: '#000000',
    paddingBottom: 8,
    marginBottom: 20,
  },
  cashInputRpPrefix: {
    fontSize: 18,
    fontWeight: '900',
    color: '#888888',
    marginRight: 8,
    fontFamily: 'monospace',
  },
  cashInputField: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
    padding: 0,
  },
  cashInfoCardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  cashInfoCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  cashInfoCardLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#777777',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  cashInfoCardVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  threeOptionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  subMethodBox: {
    flex: 1,
    height: 72,
    borderWidth: 1.5,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  subMethodBoxInactive: {
    backgroundColor: '#FFFFFF',
  },
  subMethodBoxActive: {
    backgroundColor: '#000000',
    transform: [{ translateX: -2 }, { translateY: -2 }],
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  subMethodIcon: {
    fontSize: 20,
    color: '#000000',
  },
  subMethodLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 0.2,
  },
  subMethodTextActive: {
    color: '#FFFFFF',
  },
  grayDetailBox: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grayDetailTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  grayDetailSubLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#777777',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  refInputBox: {
    width: '100%',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 14,
    marginHorizontal: -24,
    marginBottom: -24,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  finishBtnBase: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: '#000000',
    transform: [{ translateX: -2 }, { translateY: -2 }],
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
});

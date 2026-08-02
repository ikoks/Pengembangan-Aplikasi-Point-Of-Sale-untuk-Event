
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { PaymentMode } from '../types/pos';

export interface PaymentCashScreenProps {
  isVisible: boolean;
  totalAmount: number;
  onClose: () => void;
  onSuccessPayment: (
    paidAmount: number,
    changeAmount: number,
    paymentMode?: PaymentMode,
    remainingBalance?: number,
  ) => void;
  onSwitchToNonCash?: () => void;
  activeCabang?: string;
  themeAccent?: string;
  themeAccentText?: string;
}

const formatRp = (num: number): string => {
  const formatted = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
};

export default function PaymentCashScreen({
  isVisible,
  totalAmount,
  onClose,
  onSuccessPayment,
  onSwitchToNonCash,
}: PaymentCashScreenProps) {
  const [cashInput, setCashInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isVisible) {
      setCashInput('');
    }
  }, [isVisible]);

  const numericCash = parseInt(cashInput || '0', 10);
  const changeAmount = numericCash > totalAmount ? numericCash - totalAmount : 0;

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const paid = numericCash || totalAmount;
      const change = paid > totalAmount ? paid - totalAmount : 0;
      onSuccessPayment(paid, change, 'FULL', 0);
    }, 500);
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
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>PEMBAYARAN TRANSAKSI</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Total Tagihan Banner */}
            <View style={styles.totalTagihanBanner}>
              <Text style={styles.totalTagihanLabel}>TOTAL TAGIHAN</Text>
              <Text style={styles.totalTagihanVal}>{formatRp(totalAmount)}</Text>
            </View>

            {/* Payment Type Switcher Row (TUNAI Active) */}
            <View style={styles.paymentTypeRow}>
              <View style={[styles.typeBox, styles.typeBoxActive]}>
                <Text style={[styles.typeIcon, styles.typeTextActive]}>💵</Text>
                <Text style={[styles.typeLabel, styles.typeTextActive]}>TUNAI</Text>
              </View>

              <Pressable
                onPress={() => {
                  onClose();
                  if (onSwitchToNonCash) onSwitchToNonCash();
                }}
                style={[styles.typeBox, styles.typeBoxInactive]}
              >
                <Text style={styles.typeIcon}>💳</Text>
                <Text style={styles.typeLabel}>NON-TUNAI</Text>
              </Pressable>
            </View>

            {/* Input Nominal Manual Section */}
            <Text style={styles.sectionTitle}>INPUT NOMINAL MANUAL</Text>
            <View style={styles.cashInputRow}>
              <Text style={styles.cashInputRpPrefix}>Rp</Text>
              <TextInput
                style={styles.cashInputField}
                placeholder="Masukkan jumlah..."
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
                  {cashInput ? formatRp(numericCash) : 'Rp 200.000'}
                </Text>
              </View>

              <View style={styles.cashInfoCard}>
                <Text style={styles.cashInfoCardLabel}>KEMBALIAN</Text>
                <Text style={styles.cashInfoCardVal}>
                  {cashInput ? formatRp(changeAmount) : 'Rp 50.000'}
                </Text>
              </View>
            </View>

            {/* Footer Action Buttons */}
            <View style={styles.footerRow}>
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>BATALKAN TRANSAKSI</Text>
              </Pressable>

              <Pressable
                disabled={isLoading}
                onPress={handleConfirm}
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

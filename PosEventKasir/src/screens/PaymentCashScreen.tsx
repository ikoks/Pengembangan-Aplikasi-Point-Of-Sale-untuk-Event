import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { validateCashPayment } from '../utils/checkoutValidation';

export interface PaymentCashScreenProps {
  isVisible: boolean;
  totalAmount: number; // Subtotal tagihan dari keranjang
  onClose: () => void; // Fungsi tutup modal / kembali
  onSuccessPayment: (paidAmount: number, changeAmount: number) => void;
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
}: PaymentCashScreenProps) {
  const [cashInput, setCashInput] = useState<string>('0');

  // Reset input when modal opens or totalAmount changes
  useEffect(() => {
    if (isVisible) {
      setCashInput('0');
    }
  }, [isVisible]);

  const numericCash = parseInt(cashInput || '0', 10);
  const change = numericCash - totalAmount;
  const isPayable = numericCash >= totalAmount;

  // Keypad Handlers
  const handleDigit = (digit: string) => {
    setCashInput((prev) => {
      if (prev === '0') {
        return digit === '0' ? '0' : digit;
      }
      if (prev.length >= 12) return prev; // Limit max length
      return prev + digit;
    });
  };

  const handleTripleZero = () => {
    setCashInput((prev) => {
      if (prev === '0' || prev === '') return '0';
      if (prev.length >= 10) return prev;
      return prev + '000';
    });
  };

  const handleDel = () => {
    setCashInput((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setCashInput('0');
  };

  // Quick Nominal Handlers
  const handleQuickNominal = (val: string) => {
    setCashInput(val);
  };

  const handleConfirm = () => {
    const validation = validateCashPayment(totalAmount, numericCash);
    if (!validation.isValid) {
      Alert.alert('💥 UANG KURANG', validation.errorMessage || 'Pembayaran tunai tidak valid.');
      return;
    }
    onSuccessPayment(numericCash, validation.change);
  };

  const quickNominals = [
    { label: 'UANG PAS', value: totalAmount.toString() },
    { label: 'Rp 10.000', value: '10000' },
    { label: 'Rp 20.000', value: '20000' },
    { label: 'Rp 50.000', value: '50000' },
    { label: 'Rp 100.000', value: '100000' },
  ];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* HEADER MODAL */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>PEMBAYARAN TUNAI</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed ? styles.btnPressed : styles.btnUnpressed,
              ]}
            >
              <Text style={styles.closeBtnText}>X</Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            {/* DISPLAY BOXES (3 KOTAK BESAR BERBINGKAI HITAM TEBAL) */}
            <View style={styles.displayContainer}>
              {/* 1. TOTAL TAGIHAN */}
              <View style={[styles.displayBox, styles.totalBox]}>
                <Text style={styles.displayLabel}>TOTAL TAGIHAN</Text>
                <Text style={styles.displayValue}>{formatRp(totalAmount)}</Text>
              </View>

              {/* 2. UANG PEMBELI */}
              <View style={[styles.displayBox, styles.cashBox]}>
                <Text style={styles.displayLabel}>UANG PEMBELI</Text>
                <Text style={styles.displayValue}>{formatRp(numericCash)}</Text>
              </View>

              {/* 3. KEMBALIAN */}
              <View
                style={[
                  styles.displayBox,
                  isPayable ? styles.changeBoxSuccess : styles.changeBoxError,
                ]}
              >
                <Text style={styles.displayLabel}>
                  {isPayable ? 'KEMBALIAN' : 'KURANG BAYAR'}
                </Text>
                <Text
                  style={[
                    styles.displayValue,
                    { color: isPayable ? '#006400' : '#8B0000' },
                  ]}
                >
                  {isPayable ? formatRp(change) : formatRp(totalAmount - numericCash)}
                </Text>
              </View>
            </View>

            {/* QUICK NOMINAL BUTTONS */}
            <Text style={styles.sectionLabel}>NOMINAL CEPAT</Text>
            <View style={styles.quickRow}>
              {quickNominals.map((item) => {
                const isActive = cashInput === item.value;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => handleQuickNominal(item.value)}
                    style={({ pressed }) => [
                      styles.quickBtn,
                      isActive && styles.quickBtnActive,
                      pressed ? styles.btnPressed : styles.btnUnpressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickBtnText,
                        isActive && styles.quickBtnTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* KEYPAD KUSTOM */}
            <Text style={styles.sectionLabel}>KEYPAD</Text>
            <View style={styles.keypadGrid}>
              {[
                { label: '7', action: () => handleDigit('7') },
                { label: '8', action: () => handleDigit('8') },
                { label: '9', action: () => handleDigit('9') },
                { label: 'CLEAR', action: handleClear, isSpecial: true, color: '#FF9500' },

                { label: '4', action: () => handleDigit('4') },
                { label: '5', action: () => handleDigit('5') },
                { label: '6', action: () => handleDigit('6') },
                { label: 'DEL', action: handleDel, isSpecial: true, color: '#FF3B30' },

                { label: '1', action: () => handleDigit('1') },
                { label: '2', action: () => handleDigit('2') },
                { label: '3', action: () => handleDigit('3') },
                { label: '000', action: handleTripleZero, isSpecial: true },

                { label: '0', action: () => handleDigit('0'), isWide: true },
              ].map((keyItem, index) => (
                <Pressable
                  key={`${keyItem.label}-${index}`}
                  onPress={keyItem.action}
                  style={({ pressed }) => [
                    styles.keypadBtn,
                    keyItem.isWide && styles.keypadBtnWide,
                    keyItem.color ? { backgroundColor: keyItem.color } : null,
                    pressed ? styles.btnPressed : styles.btnUnpressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.keypadBtnText,
                      keyItem.color ? { color: '#FFF' } : null,
                    ]}
                  >
                    {keyItem.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* TOMBOL KONFIRMASI PEMBAYARAN */}
            <Pressable
              disabled={!isPayable}
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                !isPayable && styles.confirmBtnDisabled,
                isPayable && pressed ? styles.btnPressed : styles.btnUnpressed,
              ]}
            >
              <Text style={styles.confirmBtnText}>KONFIRMASI PEMBAYARAN ➔</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  modalHeader: {
    height: 52,
    backgroundColor: '#FFDD00',
    borderBottomWidth: 4,
    borderBottomColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
  },

  modalBody: {
    padding: 16,
  },

  // Display Box (3 Kotak)
  displayContainer: {
    gap: 8,
    marginBottom: 16,
  },
  displayBox: {
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBox: {
    backgroundColor: '#FFDD00',
  },
  cashBox: {
    backgroundColor: '#E0F7FA',
  },
  changeBoxSuccess: {
    backgroundColor: '#D4EDDA',
  },
  changeBoxError: {
    backgroundColor: '#FFD2D2',
  },
  displayLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  displayValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  // Quick Nominal
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  quickBtn: {
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnActive: {
    backgroundColor: '#000',
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
  },
  quickBtnTextActive: {
    color: '#FFF',
  },

  // Keypad
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  keypadBtn: {
    width: '23%',
    height: 46,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadBtnWide: {
    width: '98%',
  },
  keypadBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
  },

  // Button State Styles (Neo-Brutalist)
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

  // Confirm Button
  confirmBtn: {
    height: 52,
    borderWidth: 3.5,
    borderColor: '#000',
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#CCC',
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

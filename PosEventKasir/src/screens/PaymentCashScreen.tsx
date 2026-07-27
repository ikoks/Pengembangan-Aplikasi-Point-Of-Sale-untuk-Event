import React, { useState, useEffect, useMemo } from 'react';
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
  totalAmount: number; 
  onClose: () => void; 
  onSuccessPayment: (paidAmount: number, changeAmount: number) => void;
  activeCabang?: string; 
  themeAccent?: string; 
  themeAccentText?: string; 
}
const formatRp = (num: number): string => {
  const formatted = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
};
const getStoreTheme = (cabang?: string, customAccent?: string, customText?: string) => {
  if (customAccent) {
    return {
      accent: customAccent,
      accentText: customText || '#000000',
      headerBg: customAccent,
      headerText: customText || '#000000',
    };
  }
  if (!cabang) {
    return {
      accent: '#FFDD00',
      accentText: '#000000',
      headerBg: '#FFDD00',
      headerText: '#000000',
    };
  }
  const lower = cabang.toLowerCase();
  if (lower.includes('terve') || lower.includes('chocolate')) {
    return {
      accent: '#5C3317',
      accentText: '#F5E6D3',
      headerBg: '#5C3317',
      headerText: '#F5E6D3',
    };
  }
  if (lower.includes('papyrus') || lower.includes('photo')) {
    return {
      accent: '#000000',
      accentText: '#FFFFFF',
      headerBg: '#000000',
      headerText: '#FFFFFF',
    };
  }
  return {
    accent: '#FFDD00',
    accentText: '#000000',
    headerBg: '#FFDD00',
    headerText: '#000000',
  };
};
export default function PaymentCashScreen({
  isVisible,
  totalAmount,
  onClose,
  onSuccessPayment,
  activeCabang,
  themeAccent,
  themeAccentText,
}: PaymentCashScreenProps) {
  const [cashInput, setCashInput] = useState<string>('0');
  const activeTheme = useMemo(
    () => getStoreTheme(activeCabang, themeAccent, themeAccentText),
    [activeCabang, themeAccent, themeAccentText],
  );
  useEffect(() => {
    if (isVisible) {
      setCashInput('0');
    }
  }, [isVisible, totalAmount]);
  const numericCash = parseInt(cashInput || '0', 10);
  const changeAmount = numericCash - totalAmount;
  const isPayable = numericCash >= totalAmount;
  const handleDigit = (digit: string) => {
    setCashInput((prev) => {
      if (prev === '0') {
        return digit === '0' ? '0' : digit;
      }
      if (prev.length >= 11) return prev; 
      return prev + digit;
    });
  };
  const handleDoubleZero = () => {
    setCashInput((prev) => {
      if (prev === '0' || prev === '') return '0';
      if (prev.length >= 10) return prev;
      return prev + '00';
    });
  };
  const handleTripleZero = () => {
    setCashInput((prev) => {
      if (prev === '0' || prev === '') return '0';
      if (prev.length >= 9) return prev;
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
  const handleQuickNominal = (val: number) => {
    setCashInput(val.toString());
  };
  const handleConfirm = () => {
    const validation = validateCashPayment(totalAmount, numericCash);
    if (!validation.isValid) {
      Alert.alert(
        '💥 UANG TUNAI KURANG',
        validation.errorMessage || `Nominal tunai kurang ${formatRp(totalAmount - numericCash)}.`,
      );
      return;
    }
    onSuccessPayment(numericCash, validation.change);
  };
  const quickNominals = [
    { label: 'UANG PAS', value: totalAmount },
    { label: '20K', value: 20000 },
    { label: '50K', value: 50000 },
    { label: '100K', value: 100000 },
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
          {}
          <View style={[styles.modalHeader, { backgroundColor: activeTheme.headerBg }]}>
            <View style={styles.modalTitleRow}>
              <Text style={[styles.modalTitle, { color: activeTheme.headerText }]}>
                💵 PEMBAYARAN TUNAI
              </Text>
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
          <View style={styles.modalBody}>
            {}
            <View style={styles.displayContainer}>
              {}
              <View style={[styles.displayBox, styles.totalBox, { backgroundColor: activeTheme.accent }]}>
                <Text style={[styles.displayLabel, { color: activeTheme.accentText }]}>
                  TOTAL TAGIHAN BELANJA
                </Text>
                <Text style={[styles.displayValue, { color: activeTheme.accentText }]}>
                  {formatRp(totalAmount)}
                </Text>
              </View>
              {}
              <View style={[styles.displayBox, styles.cashBox]}>
                <Text style={styles.displayLabel}>UANG TUNAI PEMBELI</Text>
                <Text style={styles.displayValueInput}>{formatRp(numericCash)}</Text>
              </View>
              {}
              <View
                style={[
                  styles.displayBox,
                  isPayable ? styles.changeBoxSuccess : styles.changeBoxError,
                ]}
              >
                <Text style={[styles.displayLabel, { color: isPayable ? '#1B5E20' : '#B71C1C' }]}>
                  {isPayable ? 'KEMBALIAN UANG FISIK' : 'KURANG BAYAR'}
                </Text>
                <Text
                  style={[
                    styles.displayValue,
                    { color: isPayable ? '#2E7D32' : '#C62828' },
                  ]}
                >
                  {isPayable ? formatRp(changeAmount) : `-${formatRp(totalAmount - numericCash)}`}
                </Text>
              </View>
            </View>
            {}
            <Text style={styles.sectionLabel}>⚡ QUICK NOMINAL (UANG PAS, 20K, 50K, 100K)</Text>
            <View style={styles.quickRow}>
              {quickNominals.map((item) => {
                const isActive = numericCash === item.value;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => handleQuickNominal(item.value)}
                    style={({ pressed }) => [
                      styles.quickBtn,
                      isActive ? [styles.quickBtnActive, { backgroundColor: activeTheme.headerBg }] : styles.quickBtnInactive,
                      pressed ? styles.btnPressed : styles.btnUnpressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickBtnText,
                        isActive ? { color: activeTheme.headerText } : { color: '#000000' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {}
            <Text style={styles.sectionLabel}>🔢 NUMPAD INTERAKTIF</Text>
            <View style={styles.numpadGrid}>
              {}
              <Pressable onPress={() => handleDigit('7')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>7</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('8')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>8</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('9')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>9</Text>
              </Pressable>
              <Pressable onPress={handleClear} style={({ pressed }) => [styles.numpadBtn, styles.numpadBtnSpecialClear, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnSpecialText}>C</Text>
              </Pressable>
              {}
              <Pressable onPress={() => handleDigit('4')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>4</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('5')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>5</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('6')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>6</Text>
              </Pressable>
              <Pressable onPress={handleDel} style={({ pressed }) => [styles.numpadBtn, styles.numpadBtnSpecialDel, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnSpecialText}>⌫ DEL</Text>
              </Pressable>
              {}
              <Pressable onPress={() => handleDigit('1')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>1</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('2')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>2</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('3')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>3</Text>
              </Pressable>
              <Pressable onPress={handleDoubleZero} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>00</Text>
              </Pressable>
              {}
              <Pressable onPress={() => handleDigit('0')} style={({ pressed }) => [styles.numpadBtn, styles.numpadBtnZeroWide, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>0</Text>
              </Pressable>
              <Pressable onPress={handleTripleZero} style={({ pressed }) => [styles.numpadBtn, styles.numpadBtnTripleZero, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>000</Text>
              </Pressable>
            </View>
            {}
            <Pressable
              disabled={!isPayable}
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                !isPayable ? styles.confirmBtnDisabled : (pressed ? styles.btnPressed : styles.confirmBtnActive),
              ]}
            >
              <Text style={[styles.confirmBtnText, !isPayable && styles.confirmBtnTextDisabled]}>
                {isPayable ? '💵 KONFIRMASI PEMBAYARAN ➔' : `🔒 NOMINAL UANG KURANG (${formatRp(totalAmount - numericCash)})`}
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
    overflow: 'hidden',
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
  modalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
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
  modalBody: {
    padding: 16,
  },
  displayContainer: {
    gap: 8,
    marginBottom: 14,
  },
  displayBox: {
    borderWidth: 3,
    borderColor: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBox: {
    borderWidth: 3.5,
  },
  cashBox: {
    backgroundColor: '#FFFDE0',
  },
  changeBoxSuccess: {
    backgroundColor: '#D4EDDA',
    borderColor: '#1B5E20',
  },
  changeBoxError: {
    backgroundColor: '#FFD2D2',
    borderColor: '#B71C1C',
  },
  displayLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  displayValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  displayValueInput: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickBtn: {
    flex: 1,
    height: 42,
    borderWidth: 3,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnInactive: {
    backgroundColor: '#FFFFFF',
  },
  quickBtnActive: {
    transform: [{ translateX: -2 }, { translateY: -2 }],
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  numpadBtn: {
    width: '22.8%',
    height: 52,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numpadBtnZeroWide: {
    width: '48.5%',
  },
  numpadBtnTripleZero: {
    width: '48.5%',
  },
  numpadBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  numpadBtnSpecialClear: {
    backgroundColor: '#FF9500',
  },
  numpadBtnSpecialDel: {
    backgroundColor: '#FF3B30',
  },
  numpadBtnSpecialText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
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
  confirmBtn: {
    height: 56,
    borderWidth: 4,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBtnActive: {
    backgroundColor: '#00E676',
  },
  confirmBtnDisabled: {
    backgroundColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderColor: '#888888',
    opacity: 0.8,
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  confirmBtnTextDisabled: {
    color: '#777777',
  },
});

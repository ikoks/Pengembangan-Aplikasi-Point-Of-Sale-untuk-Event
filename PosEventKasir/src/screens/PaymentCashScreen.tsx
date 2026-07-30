
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
import { CashDenominationPill } from '../components/CashDenominationPill';
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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('FULL');

  const activeTheme = useMemo(
    () => getStoreTheme(activeCabang, themeAccent, themeAccentText),
    [activeCabang, themeAccent, themeAccentText],
  );

  const targetAmount = useMemo(() => {
    if (paymentMode === 'DP_50') {
      return Math.ceil(totalAmount * 0.5);
    }
    return totalAmount;
  }, [totalAmount, paymentMode]);

  const remainingBalance = useMemo(() => {
    if (paymentMode === 'DP_50') {
      return totalAmount - targetAmount;
    }
    return 0;
  }, [totalAmount, targetAmount, paymentMode]);

  useEffect(() => {
    if (isVisible) {
      setCashInput('0');
      setPaymentMode('FULL');
    }
  }, [isVisible, totalAmount]);

  const numericCash = parseInt(cashInput || '0', 10);
  const changeAmount = numericCash - targetAmount;
  const isPayable = numericCash >= targetAmount;

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
    const validation = validateCashPayment(targetAmount, numericCash);
    if (!validation.isValid) {
      Alert.alert(
        '💥 UANG TUNAI KURANG',
        validation.errorMessage || `Nominal tunai kurang ${formatRp(targetAmount - numericCash)}.`,
      );
      return;
    }
    onSuccessPayment(numericCash, validation.change, paymentMode, remainingBalance);
  };

  const quickNominals = [
    { label: 'UANG PAS', value: targetAmount },
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

            <View style={styles.modeToggleRow}>
              <Pressable
                onPress={() => setPaymentMode('FULL')}
                style={[
                  styles.modeTogglePill,
                  paymentMode === 'FULL' && [styles.modeToggleActive, { backgroundColor: activeTheme.accent }],
                ]}
              >
                <Text style={[styles.modeToggleText, paymentMode === 'FULL' && { color: activeTheme.accentText }]}>
                  💯 LUNAS 100% ({formatRp(totalAmount)})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPaymentMode('DP_50')}
                style={[
                  styles.modeTogglePill,
                  paymentMode === 'DP_50' && [styles.modeToggleActive, { backgroundColor: activeTheme.accent }],
                ]}
              >
                <Text style={[styles.modeToggleText, paymentMode === 'DP_50' && { color: activeTheme.accentText }]}>
                  📑 DP 50% ({formatRp(targetAmount)})
                </Text>
              </Pressable>
            </View>

            {paymentMode === 'DP_50' && (
              <View style={styles.dpNoticeBox}>
                <Text style={styles.dpNoticeText}>
                  ⚠️ UANG MUKA (DP 50%): Sisa pelunasan nanti: {formatRp(remainingBalance)}
                </Text>
              </View>
            )}

            <View style={styles.displayContainer}>
              <View style={[styles.displayBox, styles.totalBox, { backgroundColor: activeTheme.accent }]}>
                <Text style={[styles.displayLabel, { color: activeTheme.accentText }]}>
                  {paymentMode === 'DP_50' ? 'TARGET DP 50%' : 'TOTAL TAGIHAN'}
                </Text>
                <Text style={[styles.displayValue, { color: activeTheme.accentText }]}>
                  {formatRp(targetAmount)}
                </Text>
              </View>

              <View style={[styles.displayBox, styles.cashBox]}>
                <Text style={styles.displayLabel}>UANG TUNAI PEMBELI</Text>
                <Text style={styles.displayValueInput}>{formatRp(numericCash)}</Text>
              </View>

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
                  {isPayable ? formatRp(changeAmount) : `-${formatRp(targetAmount - numericCash)}`}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>⚡ QUICK NOMINAL</Text>
            <View style={styles.quickRow}>
              {quickNominals.map((item) => (
                <CashDenominationPill
                  key={item.label}
                  label={item.label}
                  isExactPay={item.value === targetAmount}
                  onPress={() => handleQuickNominal(item.value)}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>🔢 NUMPAD INTERAKTIF</Text>
            <View style={styles.numpadGrid}>
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

              <Pressable onPress={() => handleDigit('0')} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>0</Text>
              </Pressable>
              <Pressable onPress={handleTripleZero} style={({ pressed }) => [styles.numpadBtn, pressed ? styles.btnPressed : styles.btnUnpressed]}>
                <Text style={styles.numpadBtnText}>000</Text>
              </Pressable>

              <Pressable
                disabled={!isPayable}
                onPress={handleConfirm}
                style={({ pressed }) => [
                  styles.numpadBtnConfirm,
                  { backgroundColor: isPayable ? activeTheme.accent : '#CCCCCC' },
                  pressed && isPayable ? styles.btnPressed : styles.btnUnpressed,
                ]}
              >
                <Text style={[styles.confirmBtnText, { color: isPayable ? activeTheme.accentText : '#888888' }]}>
                  {isPayable ? (paymentMode === 'DP_50' ? 'BAYAR DP ➔' : 'BAYAR TUNAI ➔') : 'TUNAI KURANG'}
                </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderColor: '#000000',
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  closeBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  closeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  modalBody: { padding: 14 },
  modeToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  modeTogglePill: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#EEEEEE',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggleActive: { borderColor: '#000000' },
  modeToggleText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  dpNoticeBox: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 8,
    marginBottom: 10,
  },
  dpNoticeText: { fontSize: 10, fontWeight: '900', color: '#E65100', textAlign: 'center' },
  displayContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  displayBox: {
    flex: 1,
    borderWidth: 2.5,
    borderColor: '#000000',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  totalBox: {},
  cashBox: { backgroundColor: '#FFFFFF' },
  changeBoxSuccess: { backgroundColor: '#E8F5E9' },
  changeBoxError: { backgroundColor: '#FFEBEE' },
  displayLabel: { fontSize: 9, fontWeight: '900', color: '#333333', marginBottom: 2, textAlign: 'center' },
  displayValue: { fontSize: 13, fontWeight: '900' },
  displayValueInput: { fontSize: 14, fontWeight: '900', color: '#000000' },
  sectionLabel: { fontSize: 9, fontWeight: '900', color: '#666666', marginBottom: 6 },
  quickRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  numpadBtn: {
    width: '22%',
    height: 44,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadBtnText: { fontSize: 16, fontWeight: '900', color: '#000000' },
  numpadBtnSpecialClear: { backgroundColor: '#FFD1D1' },
  numpadBtnSpecialDel: { backgroundColor: '#FFE0B2' },
  numpadBtnSpecialText: { fontSize: 11, fontWeight: '900', color: '#000000' },
  numpadBtnConfirm: {
    width: '47%',
    height: 44,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 12, fontWeight: '900' },
  btnUnpressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  btnPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    elevation: 0,
  },
});

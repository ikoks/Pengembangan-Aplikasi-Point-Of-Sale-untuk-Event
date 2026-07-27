import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { validateNonCashPayment } from '../utils/checkoutValidation';
export interface PaymentNonCashScreenProps {
  isVisible: boolean;
  totalAmount: number; 
  onClose: () => void; 
  onSuccessPayment: (method: string, referenceNumber: string) => void;
}
const formatRp = (num: number): string => {
  const formatted = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
};
const PAYMENT_METHODS = [
  { id: 'QRIS', label: 'QRIS', icon: '📱' },
  { id: 'EDC / DEBIT', label: 'EDC / DEBIT', icon: '💳' },
  { id: 'EDC / KREDIT', label: 'EDC / KREDIT', icon: '💳' },
  { id: 'TRANSFER BANK', label: 'TRANSFER BANK', icon: '🏦' },
];
export default function PaymentNonCashScreen({
  isVisible,
  totalAmount,
  onClose,
  onSuccessPayment,
}: PaymentNonCashScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('QRIS');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  useEffect(() => {
    if (isVisible) {
      setSelectedMethod('QRIS');
      setReferenceNumber('');
    }
  }, [isVisible]);
  const isPayable = selectedMethod !== '' && referenceNumber.trim().length >= 4;
  const handleConfirm = () => {
    const validation = validateNonCashPayment(selectedMethod, referenceNumber);
    if (!validation.isValid) {
      Alert.alert('💥 DATA TIDAK VALID', validation.errorMessage || 'Pembayaran non-tunai tidak valid.');
      return;
    }
    onSuccessPayment(selectedMethod, referenceNumber.trim());
  };
  const handleClearRef = () => {
    setReferenceNumber('');
  };
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>PEMBAYARAN NON-TUNAI</Text>
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
            {}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>TOTAL TAGIHAN</Text>
              <Text style={styles.totalValue}>{formatRp(totalAmount)}</Text>
            </View>
            {}
            <Text style={styles.sectionLabel}>PILIH METODE PEMBAYARAN</Text>
            <View style={styles.methodsGrid}>
              {PAYMENT_METHODS.map((method) => {
                const isActive = selectedMethod === method.id;
                return (
                  <Pressable
                    key={method.id}
                    onPress={() => setSelectedMethod(method.id)}
                    style={({ pressed }) => [
                      styles.methodCard,
                      isActive && styles.methodCardActive,
                      pressed ? styles.btnPressed : styles.btnUnpressed,
                    ]}
                  >
                    <Text style={styles.methodIcon}>{method.icon}</Text>
                    <Text
                      style={[
                        styles.methodLabel,
                        isActive && styles.methodLabelActive,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {}
            <Text style={styles.sectionLabel}>NOMOR REFERENSI / APPROVAL CODE</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.refInput}
                placeholder="Masukkan No. Ref / Trace / Approval..."
                placeholderTextColor="#888"
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {referenceNumber.length > 0 && (
                <Pressable
                  onPress={handleClearRef}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    pressed ? styles.btnPressed : styles.btnUnpressed,
                  ]}
                >
                  <Text style={styles.clearBtnText}>CLEAR</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.inputHint}>
              * Minimal 4 karakter (No. Trace EDC / ID Transaksi QRIS / No. Ref Transfer)
            </Text>
            {}
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
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  modalHeader: {
    height: 52,
    backgroundColor: '#00E5FF',
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
  totalBox: {
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#FFDD00',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  methodCard: {
    width: '48%',
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCardActive: {
    backgroundColor: '#00E676',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  methodLabelActive: {
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  refInput: {
    flex: 1,
    height: 48,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  clearBtn: {
    height: 48,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  inputHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    marginBottom: 20,
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
  confirmBtn: {
    height: 52,
    borderWidth: 3.5,
    borderColor: '#000',
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
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

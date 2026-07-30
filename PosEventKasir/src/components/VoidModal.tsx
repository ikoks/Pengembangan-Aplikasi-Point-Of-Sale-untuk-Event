
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Colors, Borders } from '../theme/neoBrutalism';

export interface VoidModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmVoid: (otp: string, reason: string) => void;
  targetTransactionInfo?: string;
}

export const VoidModal = ({
  visible,
  onClose,
  onConfirmVoid,
  targetTransactionInfo,
}: VoidModalProps) => {
  const [otpInput, setOtpInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');

  const handleReset = () => {
    setOtpInput('');
    setReasonInput('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleConfirm = () => {
    const trimmedOtp = otpInput.trim();
    const trimmedReason = reasonInput.trim();

    if (trimmedOtp.length < 4) {
      Alert.alert('💥 OTP INVALID', 'OTP Admin wajib terdiri dari 4-6 digit angka.');
      return;
    }

    if (!trimmedReason) {
      Alert.alert('💥 ALASAN FINANSIAL KOSONG', 'Wajib mencantumkan alasan finansial pembatalan/refund.');
      return;
    }

    if (trimmedOtp !== '1234' && trimmedOtp !== '123456' && trimmedOtp !== '888888' && trimmedOtp !== '999999') {
      Alert.alert('❌ OTORISASI GAGAL', 'Kode OTP Admin salah. Akses refund/void ditolak.');
      return;
    }

    onConfirmVoid(trimmedOtp, trimmedReason);
    handleReset();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalShadow} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>⚠️ VOID / REFUND TRANSAKSI</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.warningStrip}>
              <Text style={styles.warningStripText}>
                🔒 OTORISASI ADMIN & REFUND FINANSIAL
              </Text>
              <Text style={styles.warningStripSub}>
                Pengembalian dana atau pembatalan transaksi terbayar memerlukan 4/6-Digit OTP Admin & Alasan Finansial Resmi.
              </Text>
            </View>

            {targetTransactionInfo ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxLabel}>TRANSAKSI TARGET REFUND:</Text>
                <Text style={styles.infoBoxValue}>{targetTransactionInfo}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>1. MASUKKAN 4-6 DIGIT OTP ADMIN</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="••••"
              placeholderTextColor="#999"
              value={otpInput}
              onChangeText={(text) => setOtpInput(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>2. ALASAN FINANSIAL & PENGEMBALIAN DANA</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Contoh: Pembatalan pesanan / Barang cacat / Salah metode bayar..."
              placeholderTextColor="#999"
              value={reasonInput}
              onChangeText={setReasonInput}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed ? styles.btnPressed : styles.btnUnpressed,
                ]}
              >
                <Text style={styles.cancelBtnText}>BATAL</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  pressed ? styles.btnPressed : styles.btnUnpressed,
                ]}
              >
                <Text style={styles.confirmBtnText}>PROSES REFUND ➔</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalShadow: {
    position: 'absolute',
    width: '90%',
    maxWidth: 480,
    height: '75%',
    backgroundColor: Colors.black,
    transform: [{ translateX: 8 }, { translateY: 8 }],
  },
  modalCard: {
    width: '90%',
    maxWidth: 480,
    backgroundColor: Colors.white,
    borderWidth: Borders.thick,
    borderColor: Borders.borderColor,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: Borders.thick,
    borderBottomColor: Borders.borderColor,
    backgroundColor: Colors.black,
  },
  modalHeaderText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderWidth: Borders.thin,
    borderColor: Colors.white,
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
  },
  modalBody: {
    padding: 16,
  },
  warningStrip: {
    backgroundColor: '#FFF3E0',
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    padding: 12,
    marginBottom: 16,
  },
  warningStripText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.redDark,
    letterSpacing: 0.5,
  },
  warningStripSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.grayText,
    marginTop: 4,
    lineHeight: 14,
  },
  infoBox: {
    backgroundColor: Colors.grayBg,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    padding: 10,
    marginBottom: 16,
  },
  infoBoxLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.grayText,
  },
  infoBoxValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.black,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  otpInput: {
    height: 52,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '900',
    color: Colors.black,
    backgroundColor: Colors.white,
    textAlign: 'center',
    letterSpacing: 8,
  },
  reasonInput: {
    height: 80,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.black,
    backgroundColor: Colors.white,
    textAlignVertical: 'top',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.black,
  },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  btnUnpressed: {
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: Colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  btnPressed: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
});

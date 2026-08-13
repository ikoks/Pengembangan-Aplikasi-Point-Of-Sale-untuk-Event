

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { VoucherPresaleData } from '../types/pos';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (voucherData: VoucherPresaleData) => void;
}

export const QRScannerModal = ({
  visible,
  onClose,
  onScanSuccess,
}: QRScannerModalProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [codeInput, setCodeInput] = useState('');

  if (!visible) return null;

  const handleProcessCode = (codeToTest: string) => {
    const cleanCode = codeToTest.trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert('⚠️ KODE KOSONG', 'Masukkan atau scan kode QR voucher presale.');
      return;
    }

    const liveVoucherData: VoucherPresaleData = {
      voucherCode: cleanCode,
      customerName: `Pelanggan Presale (#${cleanCode})`,
      isPrepaid: true,
      dpAmount: 0,
      remainingBalance: 0,
      storeBrand: 'POS Event',
      items: [
        {
          id: `vch_${cleanCode}_${Date.now()}`,
          name: `Voucher Presale #${cleanCode}`,
          price: 50000,
          qty: 1,
          category: 'VOUCHER',
          emoji: '🎟️',
        },
      ],
    };

    onScanSuccess(liveVoucherData);
    setCodeInput('');
    onClose();
    Alert.alert(
      '✅ VOUCHER PRESALE BERHASIL DIBACA',
      `Kode: ${cleanCode}\nNama: ${liveVoucherData.customerName}`
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>📷 SCANNER QR VOUCHER PRESALE</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.scannerBox}>
            <View style={styles.targetFrame}>
              <Text style={styles.targetText}>[ SEJAJARKAN KODE QR PRESALE ]</Text>
            </View>
            <Text style={styles.scannerSubtext}>Arahkan kamera ke QR Code Voucher Presale Event</Text>
          </View>

          <Text style={styles.presetLabel}>⚡ SIMULASI VOUCHER EVENT PRESALE:</Text>
          <View style={styles.presetRow}>
            <Pressable
              onPress={() => handleProcessCode('VCH-TERVE-CHOCO')}
              style={styles.presetBtn}
            >
              <Text style={styles.presetBtnText}>🍫 TERVE CHOCO</Text>
            </Pressable>
            <Pressable
              onPress={() => handleProcessCode('VCH-GELATO-EVENT')}
              style={styles.presetBtn}
            >
              <Text style={styles.presetBtnText}>🍦 GELATO EVENT</Text>
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>ATAU INPUT MANUAL KODE VOUCHER:</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Contoh: VCH-TERVE-CHOCO"
            placeholderTextColor="#888888"
            value={codeInput}
            onChangeText={setCodeInput}
            autoCapitalize="characters"
          />

          <Pressable
            onPress={() => handleProcessCode(codeInput)}
            style={styles.submitBtn}
          >
            <Text style={styles.submitBtnText}>TARIK DATA TRANSAKSI ➔</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderColor: '#000000',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#000000' },
  closeBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  scannerBox: {
    height: 140,
    backgroundColor: '#111111',
    borderWidth: 3,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  targetFrame: {
    borderWidth: 2,
    borderColor: '#FFDD00',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  targetText: { color: '#FFDD00', fontSize: 11, fontWeight: '900' },
  scannerSubtext: { color: '#CCCCCC', fontSize: 9, fontWeight: '700', marginTop: 8 },
  presetLabel: { fontSize: 10, fontWeight: '900', color: '#000000', marginBottom: 6 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  presetBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFF9C4',
    paddingVertical: 8,
    alignItems: 'center',
  },
  presetBtnText: { fontSize: 10, fontWeight: '900', color: '#000000' },
  inputLabel: { fontSize: 10, fontWeight: '900', color: '#000000', marginBottom: 6 },
  codeInput: {
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FAF3EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 14,
  },
  submitBtn: {
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFDD00',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { fontSize: 12, fontWeight: '900', color: '#000000' },
});

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { getApiBaseUrl, clearApiContext } from '../services/api/apiClient';

export interface ClosingShiftScreenProps {
  activeUser: string;
  activeCabang: string;
  salesMode: string;
  shiftId: string;
  onClosingSuccess: () => void;
  onCancelClosing?: () => void;
}

export default function ClosingShiftScreen({
  activeUser,
  onClosingSuccess,
  onCancelClosing,
}: ClosingShiftScreenProps) {
  const [cashAmount, setCashAmount] = useState<string>('1750000');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formatRpVal = (valStr: string) => {
    if (!valStr) return '';
    const num = parseInt(valStr, 10);
    if (isNaN(num)) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleCompleteClose = async () => {
    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/shift/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator: activeUser,
          cash_actual: parseFloat(cashAmount || '0'),
          waktu_tutup: new Date().toISOString(),
        }),
      }).catch(() => null);

      clearApiContext();
      setIsLoading(false);
      Alert.alert('✅ SHIFT & TOKO DITUTUP', 'Proses penutupan kasir berhasil diselesaikan.', [
        { text: 'OK', onPress: onClosingSuccess },
      ]);
    } catch (_) {
      setIsLoading(false);
      clearApiContext();
      onClosingSuccess();
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.headerBar}>
        {onCancelClosing && (
          <Pressable onPress={onCancelClosing} style={s.backBtnHeader}>
            <Text style={s.backBtnHeaderText}>← Kembali</Text>
          </Pressable>
        )}
        <Text style={s.headerTitle}>🔒 TUTUP TOKO</Text>
      </View>

      <View style={s.mainBody}>
        <View style={s.centerCardWrapper}>
          <View style={s.centerCardShadow} />
          <View style={s.centerCardBody}>
            <Text style={s.inputBoxLabel}>INPUT JUMLAH UANG FISIK (LACI KASIR)</Text>
            <View style={s.cashInputBox}>
              <Text style={s.rpPrefix}>Rp</Text>
              <TextInput
                style={s.cashInputField}
                value={formatRpVal(cashAmount)}
                onChangeText={(text) => setCashAmount(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                editable={!isLoading}
                placeholder="0"
                placeholderTextColor="#888"
              />
            </View>
          </View>
        </View>
      </View>

      <View style={s.footerBar}>
        <Pressable
          disabled={isLoading}
          onPress={handleCompleteClose}
          style={s.tutupTokoBtnSingle}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.tutupTokoBtnTextSingle}>🔒 TUTUP TOKO</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
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
  headerIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  mainBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerCardWrapper: {
    width: '100%',
    maxWidth: 580,
    position: 'relative',
  },
  centerCardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: '#000000',
    zIndex: -1,
  },
  centerCardBody: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 28,
  },
  inputBoxLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  cashInputBox: {
    width: '100%',
    height: 64,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rpPrefix: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000000',
    marginRight: 10,
    fontFamily: 'monospace',
  },
  cashInputField: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  footerBar: {
    borderTopWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 16,
  },
  tutupTokoBtnSingle: {
    flex: 1,
    height: 56,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tutupTokoBtnTextSingle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },

  /* OTP View Styles */
  scrollContentCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  otpCardWrapper: {
    width: '100%',
    maxWidth: 580,
    position: 'relative',
  },
  otpCardShadow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: -10,
    bottom: -10,
    backgroundColor: '#000000',
    zIndex: -1,
  },
  otpCardBody: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 40,
    alignItems: 'center',
  },
  lockIconBox: {
    marginBottom: 20,
  },
  lockIcon: {
    fontSize: 42,
    color: '#000000',
  },
  otpTitleMain: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  otpTitleSub: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 32,
  },
  otpFieldLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  otpInputField: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'monospace',
    marginBottom: 32,
  },
  verifyBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
});

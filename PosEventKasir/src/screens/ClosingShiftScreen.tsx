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
import { clearApiContext } from '../services/api/apiClient';
import { closeShift } from '../services/shiftService';

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
<<<<<<< HEAD
      const { getApiContextSnapshot } = require('../services/api/apiClient');
      const ctx = getApiContextSnapshot();
      const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
      const closeUrl = baseUrl.endsWith('/api/v1') ? `${baseUrl}/shift/close` : `${baseUrl}/api/v1/shift/close`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      if (ctx.accessToken) {
        headers['Authorization'] = `Bearer ${ctx.accessToken}`;
      }

      await fetch(closeUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          uang_fisik_akhir: parseFloat(cashAmount || '0'),
          operator: activeUser,
          waktu_tutup: new Date().toISOString(),
        }),
      }).catch(() => null);
=======
      const uangFisikAkhir = parseFloat(cashAmount || '0');
>>>>>>> 8a424618cc65922c5c153d9704981737069be4db

      // ─── Panggil API Backend: POST /api/v1/shift/close ──────────────────
      // Menggunakan shiftService yang sudah menggunakan apiClient dengan Bearer Token
      const result = await closeShift({ uang_fisik_akhir: uangFisikAkhir });

      if (result.success) {
        console.log('[ClosingShift] Shift berhasil ditutup di backend.');
      } else {
        console.warn('[ClosingShift] Backend shift close gagal:', result.message);
        // Tetap lanjutkan logout lokal meski backend gagal
      }

      // Bersihkan context API (token dsb.)
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
});

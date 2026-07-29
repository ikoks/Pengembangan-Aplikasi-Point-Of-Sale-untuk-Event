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
import { bluetoothPrinterService } from '../services/bluetoothService';
import { formatRp } from '../utils/formatters';
import { Colors, Borders, Shadows } from '../theme/neoBrutalism';

export interface ClosingShiftScreenProps {
  activeUser: string;
  activeCabang: string;
  salesMode: string;
  shiftId: string;
  onClosingSuccess: () => void;
  onCancelClosing?: () => void;
}

// === [NEW/UPDATE POS-B-13: Silent Closing Shift & Direct Logout] ===
export default function ClosingShiftScreen({
  activeUser,
  activeCabang,
  salesMode,
  shiftId,
  onClosingSuccess,
  onCancelClosing,
}: ClosingShiftScreenProps) {
  const [cashDrawerInput, setCashDrawerInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const numericCash = parseInt(cashDrawerInput || '0', 10);

  const handleConfirmCloseShift = async () => {
    if (!cashDrawerInput.trim() || numericCash < 0) {
      Alert.alert('💥 INPUT INVALID', 'Nominal uang fisik akhir di laci kasir wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = getApiBaseUrl();
      
      await fetch(`${baseUrl}/api/shift/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          shift_id: shiftId,
          operator: activeUser,
          cabang: activeCabang,
          sales_mode: salesMode,
          uang_fisik_laci: numericCash,
          waktu_tutup: new Date().toISOString(),
        }),
      }).catch((err) => {
        console.log('Closing API network fallback:', err);
      });

      
      clearApiContext();

      setIsLoading(false);

      
      
      
      onClosingSuccess();
    } catch (error) {
      setIsLoading(false);
      clearApiContext();
      
      onClosingSuccess();
    }
  };

  const handlePrintShiftReport = async () => {
    const res = await bluetoothPrinterService.printShiftSummaryReport({
      shiftId: shiftId || 'SHIFT-2026-001',
      operatorName: activeUser,
      storeName: "Let's Go Gelato",
      branchName: activeCabang,
      totalSales: numericCash,
      cashTotal: numericCash,
      nonCashTotal: 0,
      trxCount: 1,
    });
    if (res.success) {
      Alert.alert('✅ SUKSES CETAK', 'Struk rekap penutupan shift telah dicetak ke printer Bluetooth.');
    } else {
      Alert.alert('ℹ️ INFO PRINTER', res.errorMessage || 'Printer Bluetooth tidak terhubung.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.shadowBackplate} />
        <View style={styles.windowCard}>
          <View style={styles.windowHeaderBar}>
            <Text style={styles.headerTitleText}>🔒 PENUTUPAN SHIFT (CLOSING SHIFT)</Text>
          </View>

          <View style={styles.contentPadding}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeLabel}>TERMINAL & CABANG AKTIF:</Text>
              <Text style={styles.infoBadgeTitle}>{activeCabang}</Text>
              <Text style={styles.infoBadgeSub}>OPERATOR: {activeUser.toUpperCase()} | MODE: {salesMode.toUpperCase()}</Text>
            </View>

            <View style={styles.shiftIdCard}>
              <Text style={styles.shiftIdKey}>ID SHIFT KERJA:</Text>
              <Text style={styles.shiftIdVal}>{shiftId || 'SHIFT-2026-001'}</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>1. MASUKKAN TOTAL UANG FISIK DI LACI KASIR</Text>
              <TextInput
                style={styles.cashInput}
                placeholder="0"
                placeholderTextColor="#999"
                value={cashDrawerInput}
                onChangeText={(text) => setCashDrawerInput(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                editable={!isLoading}
              />
              <View style={styles.formattedDisplay}>
                <Text style={styles.formattedLabel}>FORMAT TERBACA:</Text>
                <Text style={styles.formattedValue}>{formatRp(numericCash)}</Text>
              </View>
            </View>

            <View style={styles.silentNoticeBox}>
              <Text style={styles.silentNoticeText}>
                ℹ️ SILENT CLOSING (POS-B-13)
              </Text>
              <Text style={styles.silentNoticeSub}>
                Perhitungan selisih laci kasir diproses secara rahasia di backend server. Layar akan langsung dialihkan ke Login setelah penutupan shift.
              </Text>
            </View>

            <Pressable
              disabled={isLoading}
              onPress={handlePrintShiftReport}
              style={({ pressed }) => [
                styles.cancelBtn,
                { marginBottom: 10 },
                pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
              ]}
            >
              <Text style={styles.cancelBtnText}>🖨️ CETAK STRUK REKAP SHIFT</Text>
            </Pressable>

            <Pressable
              disabled={isLoading}
              onPress={handleConfirmCloseShift}
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.confirmBtnText}>
                  🔒 TUTUP SHIFT & KELUAR ➔
                </Text>
              )}
            </Pressable>

            {onCancelClosing && (
              <Pressable
                disabled={isLoading}
                onPress={onCancelClosing}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
                ]}
              >
                <Text style={styles.cancelBtnText}>BATAL</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  shadowBackplate: {
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    height: 520,
    backgroundColor: Colors.black,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    transform: [{ translateX: 8 }, { translateY: 8 }],
  },
  windowCard: {
    backgroundColor: Colors.white,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    overflow: 'hidden',
  },
  windowHeaderBar: {
    height: 48,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerTitleText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  contentPadding: {
    padding: 20,
  },
  infoBadge: {
    backgroundColor: '#FFFBEA',
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    padding: 12,
    marginBottom: 12,
  },
  infoBadgeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.grayText,
  },
  infoBadgeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.black,
    marginTop: 2,
  },
  infoBadgeSub: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.black,
    marginTop: 2,
  },
  shiftIdCard: {
    backgroundColor: Colors.grayBg,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    padding: 10,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftIdKey: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.grayText,
  },
  shiftIdVal: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.black,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.black,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cashInput: {
    height: 56,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '900',
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  formattedDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  formattedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.grayText,
  },
  formattedValue: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.black,
  },
  silentNoticeBox: {
    backgroundColor: '#FFF3E0',
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    padding: 12,
    marginBottom: 20,
  },
  silentNoticeText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.orange,
  },
  silentNoticeSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.grayText,
    marginTop: 4,
    lineHeight: 14,
  },
  confirmBtn: {
    height: 54,
    backgroundColor: Colors.red,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    height: 44,
    backgroundColor: Colors.white,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.black,
  },
});

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  PermissionsAndroid,
  NativeModules,
} from 'react-native';
import { getDBConnection } from '../database/sqlite';
import apiClient, { getApiBaseUrl } from '../services/api/apiClient';

import { extractCleanBranchName, generateShortOrderUrl } from '../utils/branchHelper';

export interface BranchSetupScreenProps {
  onSetupComplete?: (boundCabangName: string) => void;
}

export default function BranchSetupScreen({ onSetupComplete }: BranchSetupScreenProps) {
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [successConfigData, setSuccessConfigData] = useState<{
    brand: string;
    branch: string;
    terminalId: string;
    orderUrl: string;
  } | null>(null);

  const handleOpenScanner = async () => {
    setIsProcessing(true);
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Izin Kamera Scanner POS',
          message: 'Aplikasi Kasir POS membutuhkan akses kamera untuk memindai QR Code Admin Konfigurasi Cabang.',
          buttonPositive: 'IZINKAN',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        if (NativeModules.NativeQrScanner && NativeModules.NativeQrScanner.openCameraScanner) {
          const qrResult = await NativeModules.NativeQrScanner.openCameraScanner();
          if (qrResult) {
            handleProcessPayload(qrResult);
            return;
          }
        }
      }
    } catch (err) {
      console.log('Scanner error:', err);
    }
    setIsProcessing(false);
    Alert.alert('📷 SCANNER KAMERA', 'Gunakan form input manual di bawah ini jika kamera scanner HP/Tablet tidak aktif.');
  };

  const handleProcessPayload = async (rawPayload: string) => {
    setIsProcessing(true);
    const cleaned = rawPayload.trim();

    let brand = '';
    let branch = '';
    let terminalId = `TAB-${Math.floor(100 + Math.random() * 900)}`;
    let orderUrl = '';

    try {
      // 1. Cek jika payload adalah URL HTTP/HTTPS (Fetch dari Backend API Server Admin)
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        try {
          const res = await apiClient.get<any>(cleaned, { timeoutMs: 5000 });
          if (res && res.data) {
            const data = res.data.data || res.data;
            if (data.nama_cabang || data.NAMA_CABANG || data.branch || data.branchName || data.storeName || data.location) {
              branch = data.nama_cabang || data.NAMA_CABANG || data.branch || data.branchName || data.storeName || data.location;
            }
            if (data.terminalId || data.deviceId) {
              terminalId = data.terminalId || data.deviceId;
            }
            if (data.orderUrl || data.url) {
              orderUrl = data.orderUrl || data.url;
            }
          }
        } catch (apiErr) {
          console.warn('API fetch warning, fallback to URL parsing:', apiErr);
        }
      }
      // 2. Extract clean branch name immediately using deep regex/JSON parser
      branch = extractCleanBranchName(cleaned);

      if (cleaned.startsWith('{')) {
        try {
          const json = JSON.parse(cleaned);
          if (json.terminalId || json.deviceId) {
            terminalId = json.terminalId || json.deviceId;
          }
          if (json.orderUrl || json.url) {
            orderUrl = json.orderUrl || json.url;
          }
        } catch (_) {}
      }

      // Pastikan URL Order Singkat & Bersih
      orderUrl = generateShortOrderUrl(branch);
      const boundCabangFull = branch;

      // Simpan konfigurasi secara PERMANEN di AsyncStorage & SQLite
      const configData = {
        isConfigured: true,
        brand,
        branch,
        boundCabangFull,
        terminalId,
        orderUrl,
        rawPayload: cleaned,
        configuredAt: new Date().toISOString(),
      };

      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('@is_terminal_configured', 'true');
      await AsyncStorage.setItem('@terminal_branch_config', JSON.stringify(configData));
      await AsyncStorage.setItem('device_bound_config', JSON.stringify({ activeCabang: boundCabangFull, isBound: true }));
      await AsyncStorage.setItem('@last_bound_branch', boundCabangFull);

      try {
        const db = await getDBConnection();
        await db.executeSql(
          `CREATE TABLE IF NOT EXISTS terminal_config (
            id TEXT PRIMARY KEY,
            brand TEXT,
            branch TEXT,
            bound_cabang_full TEXT,
            terminal_id TEXT,
            order_url TEXT,
            configured_at TEXT
          );`
        );
        await db.executeSql(
          `INSERT OR REPLACE INTO terminal_config (id, brand, branch, bound_cabang_full, terminal_id, order_url, configured_at) VALUES ('MAIN_CONFIG', ?, ?, ?, ?, ?, ?);`,
          [brand, branch, boundCabangFull, terminalId, orderUrl, new Date().toISOString()]
        );
      } catch (_) {}

      setIsProcessing(false);
      setSuccessConfigData({ brand, branch, terminalId, orderUrl });
    } catch (err) {
      console.error('Config parsing error:', err);
      const fallbackBranch = cleaned.trim() || 'Bengawan (Bandung)';
      const fallbackBound = fallbackBranch;

      const configData = {
        isConfigured: true,
        brand: '',
        branch: fallbackBranch,
        boundCabangFull: fallbackBound,
        terminalId,
        orderUrl,
        rawPayload: cleaned,
        configuredAt: new Date().toISOString(),
      };

      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('@terminal_branch_config', JSON.stringify(configData));
        await AsyncStorage.setItem('device_bound_config', JSON.stringify({ activeCabang: fallbackBound, isBound: true }));
      } catch (_) {}

      setIsProcessing(false);
      setSuccessConfigData({ brand: '', branch: fallbackBranch, terminalId, orderUrl });
    }
  };

  const handleManualSubmit = () => {
    if (!manualTokenInput.trim()) {
      Alert.alert('⚠️ TOKEN KOSONG', 'Silakan masukkan Kode Token Konfigurasi Admin terlebih dahulu!');
      return;
    }
    handleProcessPayload(manualTokenInput.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>⚙️ KONFIGURASI TERMINAL BOOTH EVENT</Text>
        <Text style={styles.headerSubtitle}>Sistem Konfigurasi Cabang Utama (1x Setup Admin)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Viewport Live Camera Scanner Frame */}
        <View style={styles.cameraFrame}>
          <View style={styles.scannerBox}>
            <View style={[styles.cornerTL, styles.corner]} />
            <View style={[styles.cornerTR, styles.corner]} />
            <View style={[styles.cornerBL, styles.corner]} />
            <View style={[styles.cornerBR, styles.corner]} />

            <Text style={styles.laserLine}>────── GARIS LASER SCANNER HIJAU ──────</Text>

            <Pressable onPress={handleOpenScanner} style={styles.scanTriggerBtn}>
              {isProcessing ? (
                <ActivityIndicator color="#FFDD00" size="large" />
              ) : (
                <>
                  <Text style={{ fontSize: 36, marginBottom: 4 }}>📷</Text>
                  <Text style={styles.scanTriggerText}>SENTUH UNTUK MEMINDAI QR ADMIN</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.statusText}>STATUS: 📷 KAMERA LIVE — Pindai QR Code Admin atau Masukkan Token</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <Pressable
            onPress={() => setIsFlashlightOn(!isFlashlightOn)}
            style={[styles.controlBtn, isFlashlightOn && styles.controlBtnActive]}
          >
            <Text style={styles.controlBtnText}>{isFlashlightOn ? '⚡ SENTER ON' : '⚡ SENTER OFF'}</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsFrontCamera(!isFrontCamera)}
            style={styles.controlBtn}
          >
            <Text style={styles.controlBtnText}>{isFrontCamera ? '🔄 KAMERA DEPAN' : '🔄 KAMERA BELAKANG'}</Text>
          </Pressable>
        </View>

        {/* Manual Input Fallback */}
        <View style={styles.manualCard}>
          <Text style={styles.manualCardTitle}>🔑 OPSI BACKUP MANUAL (TOKEN KONFIGURASI ADMIN):</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: BENGAWAN / BRAGA / CABANG-BANDUNG..."
              placeholderTextColor="#888"
              value={manualTokenInput}
              onChangeText={setManualTokenInput}
              autoCapitalize="characters"
            />
            <Pressable onPress={handleManualSubmit} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>🔓 SIMPAN TOKEN</Text>
            </Pressable>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footerNotice}>
          <Text style={styles.footerNoticeText}>
            ℹ️ Terhubung ke Backend API Server: <Text style={{ color: '#00D084', fontWeight: '900' }}>{getApiBaseUrl()}</Text>. Pindai QR Admin untuk mengunci identitas Cabang secara 100% dinamis.
          </Text>
        </View>
      </ScrollView>

      {/* Pop-Up Sukses Konfigurasi */}
      <Modal visible={!!successConfigData} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>✅ KONFIGURASI TERMINAL BERHASIL!</Text>
            <View style={styles.modalDivider} />

            {successConfigData && (
              <View style={styles.modalDetails}>
                <Text style={styles.detailItem}>🏢 <Text style={styles.detailBold}>Nama Cabang</Text>: {extractCleanBranchName(successConfigData.branch)}</Text>
                <Text style={styles.detailItem}>💻 <Text style={styles.detailBold}>Terminal ID</Text>: {successConfigData.terminalId}</Text>
                <Text style={styles.detailItem}>🌐 <Text style={styles.detailBold}>Web Order Domain</Text>: {successConfigData.orderUrl}</Text>
              </View>
            )}

            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>[ STATUS TERMINAL: TERKUNCI PERMANEN HARUS KHUSUS CABANG ]</Text>
            </View>

            <Pressable
              onPress={() => {
                const boundName = successConfigData ? successConfigData.branch : '';
                setSuccessConfigData(null);
                if (onSetupComplete) onSetupComplete(boundName);
              }}
              style={styles.continueBtn}
            >
              <Text style={styles.continueBtnText}>🚀 LANJUTKAN KE HALAMAN LOGIN ➔</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  headerBar: {
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#FFDD00',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFDD00',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  cameraFrame: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#374151',
  },
  scannerBox: {
    width: '100%',
    height: 220,
    backgroundColor: '#111',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00D084',
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3 },
  laserLine: {
    color: '#00D084',
    fontSize: 10,
    fontWeight: '900',
    position: 'absolute',
    top: 15,
  },
  scanTriggerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  scanTriggerText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 12,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 500,
  },
  controlBtn: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  controlBtnActive: {
    backgroundColor: '#FFDD00',
  },
  controlBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 11,
  },
  manualCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
  },
  manualCardTitle: {
    color: '#FFDD00',
    fontWeight: '900',
    fontSize: 11,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#4B5563',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#00D084',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 6,
  },
  submitBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 11,
  },
  footerNotice: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerNoticeText: {
    color: '#D1D5DB',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  modalHeader: {
    fontSize: 15,
    fontWeight: '900',
    color: '#00875A',
    letterSpacing: 0.5,
  },
  modalDivider: {
    height: 2,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginVertical: 14,
  },
  modalDetails: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    fontSize: 12,
    color: '#1F2937',
  },
  detailBold: {
    fontWeight: '900',
  },
  statusBadge: {
    backgroundColor: '#FFDD00',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#000',
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
  },
  continueBtn: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
  },
});

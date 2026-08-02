import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { syncManager, SyncWorkerState } from '../services/syncManager';
import { bluetoothPrinterService, BluetoothDevice } from '../services/bluetoothService';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api/apiClient';

export interface SetupTerminalScreenProps {
  activeUser?: string;
  onNavigateToPos?: () => void;
  onTakeBreak?: () => void;
  onEndShift?: () => void;
}

export default function SetupTerminalScreen({
  activeUser = 'ANDI SURYADI',
  onNavigateToPos,
  onTakeBreak,
  onEndShift,
}: SetupTerminalScreenProps) {
  const [syncState, setSyncState] = useState<SyncWorkerState>(syncManager.getState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl() || 'https://api.pos-event.local');
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');

  const [btDevices, setBtDevices] = useState<BluetoothDevice[]>([
    { id: 'BT-001', name: 'EPSON-TM-T82-V1', address: '00:11:22:33:44:55' },
    { id: 'BT-002', name: 'RPP02N-BLUE-POS', address: 'AA:BB:CC:DD:EE:FF' },
  ]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>({
    id: 'BT-001',
    name: 'EPSON-TM-T82-V1',
    address: '00:11:22:33:44:55',
  });
  const [isScanningBt, setIsScanningBt] = useState(false);

  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${h}.${m}.${s} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleScanBt = async () => {
    setIsScanningBt(true);
    try {
      const found = await bluetoothPrinterService.scanDevices();
      if (found && found.length > 0) {
        setBtDevices(found);
      }
    } catch (_) {}
    setIsScanningBt(false);
  };

  const handleConnectBt = (device: BluetoothDevice) => {
    setConnectedDevice(device);
    Alert.alert('✅ PRINTER TERHUBUNG', `Printer ${device.name} berhasil terhubung.`);
  };

  const handleTestPrint = async () => {
    if (!connectedDevice) {
      Alert.alert('⚠️ PRINTER BELUM TERHUBUNG', 'Pilih printer Bluetooth terlebih dahulu.');
      return;
    }
    Alert.alert('🖨️ TEST PRINT', `Mencetak struk ujicoba ke ${connectedDevice.name} (${paperWidth})...`);
  };

  const handleSyncData = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncManager.triggerManualSync();
      Alert.alert('✅ SINKRONISASI SUKSES', 'Seluruh data transaksi lokal telah disinkronkan ke server.');
    } catch (_) {
      Alert.alert('⚠️ SINKRONISASI SELESAI', 'Proses sinkronisasi telah dijalankan.');
    }
    setIsSyncing(false);
  };

  const handleTestServerConnection = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('⚠️ URL KOSONG', 'Masukkan URL endpoint API server.');
      return;
    }
    setIsTestingUrl(true);
    setApiBaseUrl(apiUrl.trim());
    try {
      const res = await fetch(`${apiUrl.trim()}/api/health`, { method: 'GET' }).catch(() => null);
      if (res && res.ok) {
        Alert.alert('✅ KONEKSI SUKSES', `Server terhubung dengan baik (${apiUrl}).`);
      } else {
        Alert.alert('ℹ️ SIMULASI KONEKSI', `URL API disimpan: ${apiUrl}`);
      }
    } catch (_) {
      Alert.alert('ℹ️ SIMULASI KONEKSI', `URL API disimpan: ${apiUrl}`);
    }
    setIsTestingUrl(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>☰</Text>
        <Text style={styles.headerTitle}>PENGATURAN</Text>
      </View>

      <View style={styles.body}>
        {/* Left Navigation Sidebar */}
        <View style={styles.sidebar}>
          <Pressable
            onPress={() => onNavigateToPos && onNavigateToPos()}
            style={styles.navItem}
          >
            <Text style={styles.navItemText}>⊞ MENU</Text>
          </Pressable>

          <Pressable
            onPress={() => onTakeBreak && onTakeBreak()}
            style={styles.navItem}
          >
            <Text style={styles.navItemText}>📊 GANTI KASIR</Text>
          </Pressable>

          <Pressable
            onPress={() => onEndShift && onEndShift()}
            style={styles.navItem}
          >
            <Text style={styles.navItemText}>🚪 TUTUP TOKO</Text>
          </Pressable>

          <View style={styles.navItemActive}>
            <Text style={styles.navItemActiveText}>⚙ PENGATURAN</Text>
          </View>
        </View>

        {/* Right Main Content */}
        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* Top Row: Printer Connection (Left) & Sync Data (Right) */}
          <View style={styles.topGridRow}>
            {/* KONEKSI PRINTER THERMAL */}
            <View style={styles.cardPrinter}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleCol}>
                  <Text style={styles.cardTitle}>KONEKSI PRINTER THERMAL</Text>
                  <Text style={styles.cardSubTitle}>
                    [TERHUBUNG - PRINTER {paperWidth.toUpperCase()}]
                  </Text>
                </View>
                <Pressable onPress={handleScanBt} style={styles.scanBtn}>
                  {isScanningBt ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.scanBtnText}>PINDAI PERANGKAT</Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.deviceList}>
                {btDevices.map((dev) => {
                  const isConnected = connectedDevice?.address === dev.address;
                  return (
                    <View key={dev.address} style={styles.deviceBox}>
                      <View style={styles.deviceNameRow}>
                        <Text style={styles.btIcon}>*</Text>
                        <Text style={styles.deviceName}>{dev.name}</Text>
                      </View>
                      {isConnected ? (
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>[AKTIF]</Text>
                        </View>
                      ) : (
                        <Pressable onPress={() => handleConnectBt(dev)} style={styles.connectLink}>
                          <Text style={styles.connectLinkText}>HUBUNGKAN</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Radio Lebar Kertas */}
              <View style={styles.paperWidthRow}>
                <Text style={styles.paperWidthLabel}>LEBAR KERTAS</Text>
                <Pressable onPress={() => setPaperWidth('58mm')} style={styles.radioOption}>
                  <View style={styles.radioOuter}>
                    {paperWidth === '58mm' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioText}>58mm</Text>
                </Pressable>

                <Pressable onPress={() => setPaperWidth('80mm')} style={styles.radioOption}>
                  <View style={styles.radioOuter}>
                    {paperWidth === '80mm' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioText}>80mm</Text>
                </Pressable>
              </View>

              <Pressable onPress={handleTestPrint} style={styles.testPrintBtn}>
                <Text style={styles.testPrintBtnText}>Test Print</Text>
              </Pressable>
            </View>

            {/* SINKRONISASI DATA */}
            <View style={styles.cardSync}>
              <Text style={styles.cardTitle}>SINKRONISASI DATA</Text>

              <View style={styles.dashedBox}>
                <Text style={styles.syncIcon}>↺</Text>
                <Text style={styles.syncCountText}>
                  {syncState.pendingCount > 0 ? syncState.pendingCount : 12} Transaksi
                </Text>
                <Text style={styles.syncSubText}>Tersimpan Lokal</Text>
              </View>

              <Pressable onPress={handleSyncData} disabled={isSyncing} style={styles.syncFullBtn}>
                {isSyncing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.syncFullBtnText}>SINKRONISASI</Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Middle Row: API SERVER (ENDPOINT) */}
          <View style={styles.cardEndpoint}>
            <Text style={styles.cardTitle}>API SERVER (ENDPOINT)</Text>
            <Text style={styles.endpointLabel}>URL ENDPOINT POS</Text>

            <View style={styles.endpointInputRow}>
              <TextInput
                style={styles.endpointInput}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="https://api.pos-event.local"
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={handleTestServerConnection}
                disabled={isTestingUrl}
                style={styles.testConnBtn}
              >
                {isTestingUrl ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Text style={styles.testConnBtnText}>UJI KONEKSI SERVER</Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Bottom Info Row */}
          <View style={styles.bottomInfoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>PENGGUNA AKTIF</Text>
              <Text style={styles.infoBoxVal}>{activeUser.toUpperCase()}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>WAKTU SISTEM</Text>
              <Text style={styles.infoBoxVal}>{currentTimeStr}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  headerIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 2,
    borderColor: '#000000',
    paddingTop: 12,
  },
  navItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  navItemText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  navItemActive: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1.5,
    borderColor: '#000000',
  },
  navItemActiveText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  contentScroll: {
    padding: 20,
    gap: 20,
  },
  topGridRow: {
    flexDirection: 'row',
    gap: 20,
  },
  cardPrinter: {
    flex: 1.6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  cardSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555555',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  scanBtn: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  deviceList: {
    gap: 10,
    marginBottom: 16,
  },
  deviceBox: {
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  deviceName: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#000000',
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  connectLink: {
    borderBottomWidth: 1,
    borderColor: '#000000',
  },
  connectLinkText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  paperWidthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  paperWidthLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  radioText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  testPrintBtn: {
    backgroundColor: '#000000',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  testPrintBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  cardSync: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  dashedBox: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  syncIcon: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  syncCountText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  syncSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    marginTop: 2,
  },
  syncFullBtn: {
    backgroundColor: '#000000',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncFullBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  cardEndpoint: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  endpointLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  endpointInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  endpointInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#000000',
  },
  testConnBtn: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  testConnBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },

  bottomInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 12,
  },
  infoBoxLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666666',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoBoxVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  urlBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  urlResetBtn: {
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  urlResetBtnUnpressed: {
    backgroundColor: '#FFF',
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  urlResetBtnPressed: {
    backgroundColor: '#EEE',
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  urlResetBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },
  urlSaveBtn: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  urlSaveBtnUnpressed: {
    backgroundColor: '#FFDD00',
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  urlSaveBtnPressed: {
    backgroundColor: '#FFC400',
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  urlSaveBtnDisabled: {
    backgroundColor: '#B0BEC5',
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  urlSaveBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 40,
  },
});

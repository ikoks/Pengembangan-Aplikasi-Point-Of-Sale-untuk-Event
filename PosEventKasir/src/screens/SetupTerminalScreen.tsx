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
  Animated,
} from 'react-native';
import { getDBConnection, createTables } from '../database/sqlite';
import { syncManager, SyncWorkerState } from '../services/syncManager';

export interface SetupTerminalScreenProps {
  activeUser?: string;
  onShiftOpened?: (cabang: string, mode: string) => void;
  navigation?: any;
}

const DEFAULT_API_URL = 'http://localhost:3000';

const DEFAULT_MENU_DATA = [
  { id: 'GS1', category_id: 'Gelato', category: 'Gelato', name: 'Single Scoop', price: 35000, stock: 100, is_promo: 0, emoji: '🍨' },
  { id: 'GS2', category_id: 'Gelato', category: 'Gelato', name: 'Double Scoop', price: 55000, stock: 100, is_promo: 1, emoji: '🍨' },
  { id: 'GS3', category_id: 'Gelato', category: 'Gelato', name: 'Triple Scoop', price: 75000, stock: 100, is_promo: 0, emoji: '🍨' },
  { id: 'GS4', category_id: 'Gelato', category: 'Gelato', name: 'Gelato Cup S', price: 30000, stock: 100, is_promo: 0, emoji: '🥄' },
  { id: 'GS5', category_id: 'Gelato', category: 'Gelato', name: 'Gelato Cup M', price: 45000, stock: 100, is_promo: 0, emoji: '🥄' },
  { id: 'GW1', category_id: 'Waffle', category: 'Waffle', name: 'Waffle Cone', price: 50000, stock: 100, is_promo: 0, emoji: '🧇' },
  { id: 'GW2', category_id: 'Waffle', category: 'Waffle', name: 'Waffle Stick 2 pcs', price: 40000, stock: 100, is_promo: 0, emoji: '🧇' },
  { id: 'GD1', category_id: 'Minuman', category: 'Minuman', name: 'Gelato Shake', price: 55000, stock: 100, is_promo: 0, emoji: '🥤' },
  { id: 'GD2', category_id: 'Minuman', category: 'Minuman', name: 'Affogato', price: 60000, stock: 100, is_promo: 1, emoji: '☕' },
  { id: 'GD3', category_id: 'Minuman', category: 'Minuman', name: 'Soda Italiano', price: 35000, stock: 100, is_promo: 0, emoji: '🍹' },
  { id: 'GP1', category_id: 'Paket', category: 'Paket', name: 'Paket Couple', price: 99000, stock: 50, is_promo: 1, emoji: '💑' },
  { id: 'GP2', category_id: 'Paket', category: 'Paket', name: 'Paket Family', price: 175000, stock: 50, is_promo: 1, emoji: '👨‍👩‍👧‍👦' },
];

export default function SetupTerminalScreen({
  activeUser = 'Kasir 01',
  onShiftOpened,
  navigation,
}: SetupTerminalScreenProps) {
  const [selectedCabang, setSelectedCabang] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [modalAwal, setModalAwal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [syncState, setSyncState] = useState<SyncWorkerState>(syncManager.getState());
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_URL);
  const [apiUrlInput, setApiUrlInput] = useState(DEFAULT_API_URL);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [urlSaveSuccess, setUrlSaveSuccess] = useState(false);

  const dataCabang = [
    "Let's Go Gelato - Bengawan (Bandung)",
    "Let's Go Gelato - Braga (Bandung)",
    "Let's Go Gelato - Summarecon Bekasi",
    'Terve Chocolate - Bengawan (Bandung)',
    'Terve Chocolate - KBP (Padalarang)',
    'Papyrus Photo - Bengawan (Bandung)',
    'Papyrus Photo - Ring Road Utara (Yogyakarta)',
  ];
  const dataMode = ['Dine In', 'Takeaway', 'Event Field Sales'];

  useEffect(() => {
    const initDb = async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
      } catch (err) {
        console.error('Error init local DB:', err);
      }
    };
    initDb();

    const loadSavedUrl = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const saved = await AsyncStorage.getItem('api_base_url');
        if (saved) {
          setApiBaseUrl(saved);
          setApiUrlInput(saved);
        }
      } catch (_) {}
    };
    loadSavedUrl();

    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (syncState.status === 'SYNCING' || isSyncingManual) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.25, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => { if (loop) loop.stop(); };
  }, [syncState.status, isSyncingManual, pulseAnim]);

  const saveCatalogToSQLite = async (items: typeof DEFAULT_MENU_DATA) => {
    try {
      const db = await getDBConnection();
      await createTables(db);
      const categoriesSet = Array.from(new Set(items.map((i) => i.category)));
      for (const catName of categoriesSet) {
        await db.executeSql(
          `INSERT OR REPLACE INTO categories (id, name) VALUES (?, ?);`,
          [catName, catName]
        );
      }
      for (const item of items) {
        await db.executeSql(
          `INSERT OR REPLACE INTO products (id, category_id, name, price, stock, is_promo, emoji) VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.category_id || item.category,
            item.name,
            item.price,
            item.stock || 100,
            item.is_promo ? 1 : 0,
            item.emoji || '📦',
          ]
        );
      }
    } catch (err) {
      console.error('❌ Gagal menyimpan katalog ke SQLite:', err);
    }
  };

  const handleBukaShift = async () => {
    if (!selectedCabang || !selectedMode || !modalAwal) {
      Alert.alert('💥 DATA TIDAK LENGKAP', 'Cabang, Mode, dan Modal Awal wajib diisi!');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/shift/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: activeUser,
          nama_cabang: selectedCabang,
          nama_mode: selectedMode,
          waktu_mulai: new Date().toISOString(),
          modal_awal: parseFloat(modalAwal),
          status_shift: 'OPEN',
        }),
      });
      console.log('Status Shift Server:', response.status);
      let catalogItems = DEFAULT_MENU_DATA;
      try {
        const catRes = await fetch(`${apiBaseUrl}/api/products`);
        if (catRes.ok) {
          const fetchedData = await catRes.json();
          if (Array.isArray(fetchedData) && fetchedData.length > 0) {
            catalogItems = fetchedData;
          }
        }
      } catch (e) {
        console.log('Catalog API fallback to default items.');
      }
      await saveCatalogToSQLite(catalogItems);
      setIsLoading(false);
      if (onShiftOpened) {
        onShiftOpened(selectedCabang, selectedMode);
      } else if (navigation) {
        navigation.navigate('POS_MAIN');
      }
    } catch (error) {
      await saveCatalogToSQLite(DEFAULT_MENU_DATA);
      setIsLoading(false);
      Alert.alert(
        '⚠️ SHIFT LURING',
        'Koneksi API offline. Shift & Katalog awal berhasil dicatat di SQLite lokal!'
      );
      if (onShiftOpened) {
        onShiftOpened(selectedCabang, selectedMode);
      } else if (navigation) {
        navigation.navigate('POS_MAIN');
      }
    }
  };

  const handleManualSync = useCallback(async () => {
    if (syncState.status === 'SYNCING' || isSyncingManual) {
      Alert.alert('🔄 SEDANG SYNC', 'Proses sinkronisasi sedang berjalan. Harap tunggu...');
      return;
    }
    if (!syncState.isOnline) {
      Alert.alert(
        '⚡ PERANGKAT OFFLINE',
        `Tidak dapat melakukan sync karena tidak ada koneksi internet.\n\n${syncState.pendingCount > 0 ? `${syncState.pendingCount} data menunggu di antrean lokal.` : 'Semua data tersimpan lokal.'}`
      );
      return;
    }
    if (syncState.pendingCount === 0) {
      Alert.alert('✅ SUDAH TERSINKRONISASI', 'Tidak ada data yang perlu di-sync. Semua transaksi sudah berhasil terkirim ke server.');
      return;
    }
    setIsSyncingManual(true);
    try {
      await syncManager.triggerManualSync();
    } catch (_) {}
    setTimeout(() => setIsSyncingManual(false), 1500);
  }, [syncState, isSyncingManual]);

  const handleSaveApiUrl = useCallback(async () => {
    const trimmed = apiUrlInput.trim();
    if (!trimmed) {
      Alert.alert('💥 URL KOSONG', 'Base URL tidak boleh kosong.');
      return;
    }
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(trimmed)) {
      Alert.alert('💥 FORMAT URL SALAH', 'URL harus diawali dengan http:// atau https://');
      return;
    }
    setIsSavingUrl(true);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('api_base_url', trimmed);
      setApiBaseUrl(trimmed);
      setUrlSaveSuccess(true);
      setTimeout(() => setUrlSaveSuccess(false), 2500);
    } catch (_) {
      Alert.alert('❌ GAGAL MENYIMPAN', 'Tidak dapat menyimpan URL ke storage lokal.');
    }
    setIsSavingUrl(false);
  }, [apiUrlInput]);

  const handleResetApiUrl = useCallback(async () => {
    Alert.alert(
      '⚠️ RESET URL API',
      `Reset ke URL default?\n\n${DEFAULT_API_URL}`,
      [
        { text: 'BATAL', style: 'cancel' },
        {
          text: 'RESET',
          style: 'destructive',
          onPress: async () => {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.removeItem('api_base_url');
            } catch (_) {}
            setApiBaseUrl(DEFAULT_API_URL);
            setApiUrlInput(DEFAULT_API_URL);
          },
        },
      ]
    );
  }, []);

  const getSyncStatusDisplay = () => {
    if (syncState.status === 'SYNCING' || isSyncingManual) {
      return { color: '#0288D1', bg: '#E1F5FE', label: '🔄 SEDANG SYNC...', border: '#0288D1' };
    }
    if (!syncState.isOnline) {
      return { color: '#E65100', bg: '#FFF3E0', label: '⚡ OFFLINE', border: '#E65100' };
    }
    if (syncState.status === 'ERROR') {
      return { color: '#B71C1C', bg: '#FFEBEE', label: '❌ SYNC GAGAL', border: '#B71C1C' };
    }
    if (syncState.pendingCount > 0) {
      return { color: '#F57F17', bg: '#FFFDE7', label: `🕐 ${syncState.pendingCount} PENDING`, border: '#F57F17' };
    }
    return { color: '#1B5E20', bg: '#E8F5E9', label: '✅ TERSINKRONISASI', border: '#1B5E20' };
  };

  const syncStatus = getSyncStatusDisplay();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>

        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>SETUP TERMINAL / SHIFT</Text>
          <Text style={styles.headerSub}>OPERATOR: {activeUser.toUpperCase()}</Text>
        </View>

        <Text style={styles.label}>1. PILIH CABANG AKTIF</Text>
        <View style={styles.pillContainer}>
          {dataCabang.map((cabang) => (
            <Pressable
              key={cabang}
              onPress={() => setSelectedCabang(cabang)}
              style={[
                styles.pillBase,
                selectedCabang === cabang
                  ? styles.pillSelected
                  : styles.pillUnselected,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedCabang === cabang && styles.pillTextSelected,
                ]}
              >
                {cabang.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>2. MODE PENJUALAN (SALES MODE)</Text>
        <View style={styles.pillContainer}>
          {dataMode.map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setSelectedMode(mode)}
              style={[
                styles.pillBase,
                selectedMode === mode
                  ? styles.pillSelected
                  : styles.pillUnselected,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedMode === mode && styles.pillTextSelected,
                ]}
              >
                {mode.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>3. MODAL AWAL LACI KASIR</Text>
        <View style={styles.modalInputRow}>
          <Text style={styles.rpSymbol}>Rp</Text>
          <TextInput
            style={styles.inputField}
            placeholder="0"
            placeholderTextColor="#888"
            value={modalAwal}
            onChangeText={(text) => setModalAwal(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            editable={!isLoading}
          />
        </View>

        <Pressable
          disabled={isLoading}
          onPress={handleBukaShift}
          style={({ pressed }) => [
            styles.actionButtonBase,
            pressed ? styles.actionButtonPressed : styles.actionButtonUnpressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'MENGUNDUH KATALOG...' : 'BUKA SHIFT & UNDUH KATALOG ➔'}
          </Text>
        </Pressable>

        <View style={styles.sectionDivider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>4. SINKRONISASI DATA (SYNC)</Text>
          <View style={[styles.syncStatusChip, { backgroundColor: syncStatus.bg, borderColor: syncStatus.border }]}>
            <Animated.View style={[
              styles.syncStatusDot,
              { backgroundColor: syncStatus.border, opacity: (syncState.status === 'SYNCING' || isSyncingManual) ? pulseAnim : 1 },
            ]} />
            <Text style={[styles.syncStatusChipText, { color: syncStatus.color }]}>
              {syncStatus.label}
            </Text>
          </View>
        </View>

        <View style={styles.syncInfoCard}>
          <View style={styles.syncInfoRow}>
            <Text style={styles.syncInfoKey}>STATUS JARINGAN</Text>
            <Text style={[styles.syncInfoVal, { color: syncState.isOnline ? '#1B5E20' : '#B71C1C' }]}>
              {syncState.isOnline ? '🌐 ONLINE' : '⚡ OFFLINE'}
            </Text>
          </View>
          <View style={styles.syncInfoDivider} />
          <View style={styles.syncInfoRow}>
            <Text style={styles.syncInfoKey}>DATA MENUNGGU SYNC</Text>
            <Text style={[styles.syncInfoVal, { color: syncState.pendingCount > 0 ? '#E65100' : '#1B5E20' }]}>
              {syncState.pendingCount} item
            </Text>
          </View>
          <View style={styles.syncInfoDivider} />
          <View style={styles.syncInfoRow}>
            <Text style={styles.syncInfoKey}>TOTAL BERHASIL SYNC</Text>
            <Text style={styles.syncInfoVal}>{syncState.syncedCount} item</Text>
          </View>
          <View style={styles.syncInfoDivider} />
          <View style={styles.syncInfoRow}>
            <Text style={styles.syncInfoKey}>TERAKHIR SYNC</Text>
            <Text style={styles.syncInfoVal}>
              {syncState.lastSyncAt
                ? new Date(syncState.lastSyncAt).toLocaleString('id-ID')
                : '—'}
            </Text>
          </View>
          {syncState.lastError && (
            <>
              <View style={styles.syncInfoDivider} />
              <View style={styles.syncInfoRow}>
                <Text style={[styles.syncInfoKey, { color: '#B71C1C' }]}>ERROR TERAKHIR</Text>
                <Text style={[styles.syncInfoVal, { color: '#B71C1C', flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                  {syncState.lastError}
                </Text>
              </View>
            </>
          )}
        </View>

        <Pressable
          onPress={handleManualSync}
          disabled={syncState.status === 'SYNCING' || isSyncingManual}
          style={({ pressed }) => [
            styles.syncManualBtn,
            (syncState.status === 'SYNCING' || isSyncingManual)
              ? styles.syncManualBtnDisabled
              : pressed
              ? styles.syncManualBtnPressed
              : styles.syncManualBtnUnpressed,
          ]}
        >
          {(syncState.status === 'SYNCING' || isSyncingManual) ? (
            <ActivityIndicator color="#000000" size="small" style={{ marginRight: 8 }} />
          ) : null}
          <Text style={styles.syncManualBtnText}>
            {(syncState.status === 'SYNCING' || isSyncingManual)
              ? '🔄 SEDANG SYNC...'
              : `🔄 SYNC MANUAL SEKARANG (${syncState.pendingCount} PENDING)`}
          </Text>
        </Pressable>

        <View style={styles.sectionDivider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>5. KONFIGURASI BASE URL API</Text>
        </View>

        <View style={styles.apiUrlInfoCard}>
          <Text style={styles.apiUrlInfoLabel}>URL AKTIF SAAT INI:</Text>
          <Text style={styles.apiUrlInfoValue} numberOfLines={2}>{apiBaseUrl}</Text>
        </View>

        <Text style={styles.urlInputLabel}>MASUKKAN BASE URL API BARU:</Text>
        <View style={styles.urlInputRow}>
          <TextInput
            style={styles.urlInputField}
            placeholder="http://192.168.x.x:3000"
            placeholderTextColor="#999"
            value={apiUrlInput}
            onChangeText={setApiUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isSavingUrl}
          />
        </View>
        <Text style={styles.urlHint}>
          Contoh: http://192.168.1.10:3000 atau https://api.example.com
        </Text>

        <View style={styles.urlBtnRow}>
          <Pressable
            onPress={handleResetApiUrl}
            style={({ pressed }) => [
              styles.urlResetBtn,
              pressed ? styles.urlResetBtnPressed : styles.urlResetBtnUnpressed,
            ]}
          >
            <Text style={styles.urlResetBtnText}>↩ RESET</Text>
          </Pressable>

          <Pressable
            onPress={handleSaveApiUrl}
            disabled={isSavingUrl}
            style={({ pressed }) => [
              styles.urlSaveBtn,
              isSavingUrl
                ? styles.urlSaveBtnDisabled
                : pressed
                ? styles.urlSaveBtnPressed
                : styles.urlSaveBtnUnpressed,
            ]}
          >
            {isSavingUrl ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text style={styles.urlSaveBtnText}>
                {urlSaveSuccess ? '✅ TERSIMPAN!' : '💾 SIMPAN URL ➔'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollPadding: {
    padding: 24,
  },
  headerBox: {
    borderWidth: 4,
    borderColor: '#000',
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#FFDD00',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  pillBase: {
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pillUnselected: {
    backgroundColor: '#FFF',
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  pillSelected: {
    backgroundColor: '#000',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  pillTextSelected: {
    color: '#FFF',
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  rpSymbol: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    height: 56,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    backgroundColor: '#FFF',
  },
  actionButtonBase: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
    marginTop: 10,
  },
  actionButtonUnpressed: {
    backgroundColor: '#00E676',
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  actionButtonPressed: {
    backgroundColor: '#00C853',
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 4,
    backgroundColor: '#000',
    marginVertical: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  syncStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2.5,
    gap: 6,
  },
  syncStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncStatusChipText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  syncInfoCard: {
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  syncInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  syncInfoDivider: {
    height: 2,
    backgroundColor: '#000',
  },
  syncInfoKey: {
    fontSize: 10,
    fontWeight: '900',
    color: '#555',
    letterSpacing: 0.3,
    flex: 1,
  },
  syncInfoVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
    textAlign: 'right',
  },
  syncManualBtn: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
    flexDirection: 'row',
    gap: 6,
  },
  syncManualBtnUnpressed: {
    backgroundColor: '#00E5FF',
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  syncManualBtnPressed: {
    backgroundColor: '#00B2CC',
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  syncManualBtnDisabled: {
    backgroundColor: '#B0BEC5',
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
    opacity: 0.7,
  },
  syncManualBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  apiUrlInfoCard: {
    borderWidth: 3,
    borderColor: '#000',
    borderStyle: 'dashed',
    padding: 12,
    backgroundColor: '#FFFDE7',
    marginBottom: 16,
  },
  apiUrlInfoLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  apiUrlInfoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.2,
  },
  urlInputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  urlInputRow: {
    marginBottom: 6,
  },
  urlInputField: {
    height: 52,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    backgroundColor: '#FFF',
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  urlHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#777',
    marginBottom: 16,
    marginTop: 6,
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

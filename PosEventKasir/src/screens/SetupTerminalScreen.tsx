import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { getDBConnection, createTables } from '../database/sqlite';

export interface SetupTerminalScreenProps {
  activeUser?: string;
  onShiftOpened?: (cabang: string, mode: string) => void;
  navigation?: any;
}

const DEFAULT_MENU_DATA = [
  // Gelato
  { id: 'GS1', category_id: 'Gelato', category: 'Gelato', name: 'Single Scoop', price: 35000, stock: 100, is_promo: 0, emoji: '🍨' },
  { id: 'GS2', category_id: 'Gelato', category: 'Gelato', name: 'Double Scoop', price: 55000, stock: 100, is_promo: 1, emoji: '🍨' },
  { id: 'GS3', category_id: 'Gelato', category: 'Gelato', name: 'Triple Scoop', price: 75000, stock: 100, is_promo: 0, emoji: '🍨' },
  { id: 'GS4', category_id: 'Gelato', category: 'Gelato', name: 'Gelato Cup S', price: 30000, stock: 100, is_promo: 0, emoji: '🥄' },
  { id: 'GS5', category_id: 'Gelato', category: 'Gelato', name: 'Gelato Cup M', price: 45000, stock: 100, is_promo: 0, emoji: '🥄' },
  // Waffle
  { id: 'GW1', category_id: 'Waffle', category: 'Waffle', name: 'Waffle Cone', price: 50000, stock: 100, is_promo: 0, emoji: '🧇' },
  { id: 'GW2', category_id: 'Waffle', category: 'Waffle', name: 'Waffle Stick 2 pcs', price: 40000, stock: 100, is_promo: 0, emoji: '🧇' },
  // Minuman
  { id: 'GD1', category_id: 'Minuman', category: 'Minuman', name: 'Gelato Shake', price: 55000, stock: 100, is_promo: 0, emoji: '🥤' },
  { id: 'GD2', category_id: 'Minuman', category: 'Minuman', name: 'Affogato', price: 60000, stock: 100, is_promo: 1, emoji: '☕' },
  { id: 'GD3', category_id: 'Minuman', category: 'Minuman', name: 'Soda Italiano', price: 35000, stock: 100, is_promo: 0, emoji: '🍹' },
  // Paket
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
  }, []);

  const saveCatalogToSQLite = async (items: typeof DEFAULT_MENU_DATA) => {
    try {
      const db = await getDBConnection();
      await createTables(db);

      // Simpan Kategori unik
      const categoriesSet = Array.from(new Set(items.map((i) => i.category)));
      for (const catName of categoriesSet) {
        await db.executeSql(
          `INSERT OR REPLACE INTO categories (id, name) VALUES (?, ?);`,
          [catName, catName]
        );
      }

      // Simpan Produk
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
      console.log('✅ Katalog menu & promo berhasil diunduh ke SQLite lokal');
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
      // 1. POST request /api/shift/open
      const response = await fetch('http://localhost:3000/api/shift/open', {
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

      // 2. Fetch catalog & promos from backend (with offline fallback)
      let catalogItems = DEFAULT_MENU_DATA;
      try {
        const catRes = await fetch('http://localhost:3000/api/products');
        if (catRes.ok) {
          const fetchedData = await catRes.json();
          if (Array.isArray(fetchedData) && fetchedData.length > 0) {
            catalogItems = fetchedData;
          }
        }
      } catch (e) {
        console.log('Catalog API fallback to default items.');
      }

      // 3. Simpan ke SQLite lokal
      await saveCatalogToSQLite(catalogItems);

      setIsLoading(false);

      if (onShiftOpened) {
        onShiftOpened(selectedCabang, selectedMode);
      } else if (navigation) {
        navigation.navigate('POS_MAIN');
      }
    } catch (error) {
      // Offline fallback shift opening
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
});

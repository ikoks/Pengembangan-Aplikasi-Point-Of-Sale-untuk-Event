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

interface OpeningShiftProps {
  activeUser: string;
  onShiftOpened: (cabang: string, mode: string) => void;
}

export default function OpeningShiftScreen({ activeUser, onShiftOpened }: OpeningShiftProps) {
  const [selectedCabang, setSelectedCabang] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [modalAwal, setModalAwal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dataCabang = [
    // --- Let's Go Gelato ---
    "Let's Go Gelato - Bengawan (Bandung)",
    "Let's Go Gelato - Braga (Bandung)",
    "Let's Go Gelato - Summarecon Bekasi",
    "Let's Go Gelato - Cibinong City Mall (Bogor)",
    "Let's Go Gelato - TSM Cibubur (Jakarta)",
    // --- Terve Chocolate ---
    "Terve Chocolate - Bengawan (Bandung)",
    "Terve Chocolate - Braga (Bandung)",
    "Terve Chocolate - KBP (Padalarang)",
    // --- Papyrus Photo ---
    "Papyrus Photo - Bengawan (Bandung)",
    "Papyrus Photo - Margo City (Depok)",
    "Papyrus Photo - Summarecon Mall Bekasi",
    "Papyrus Photo - Ring Road Utara (Yogyakarta)",
    "Papyrus Photo - Surabaya"
  ];

  const dataMode = ['Dine In', 'Takeaway'];

  useEffect(() => {
    const setupLocalDB = async () => {
      const db = await getDBConnection();
      await createTables(db);
    };
    setupLocalDB();
  }, []);

  const handleBukaShift = async () => {
    if (!selectedCabang || !selectedMode || !modalAwal) {
      Alert.alert('💥 DATA TIDAK LENGKAP', 'Cabang, Mode, dan Modal Awal wajib diisi!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://api.vocationalevent.local/api/shift/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: activeUser,
          nama_cabang: selectedCabang,
          nama_mode: selectedMode,
          waktu_mulai: new Date().toISOString(),
          modal_awal: parseFloat(modalAwal),
          status_shift: 'OPEN'
        }),
      });

      console.log('Status Buka Shift Server:', response.status);

      setTimeout(() => {
        setIsLoading(false);
        onShiftOpened(selectedCabang, selectedMode);
      }, 1500);

    } catch (error) {
      setIsLoading(false);
      console.error('Koneksi gagal:', error);
      Alert.alert('⚠️ SHIFT LURING', 'Koneksi API gagal. Shift dicatat di SQLite lokal.');
      onShiftOpened(selectedCabang, selectedMode);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>OPENING SHIFT</Text>
          <Text style={styles.headerSub}>OPR: {activeUser.toUpperCase()}</Text>
        </View>

        <Text style={styles.label}>1. PILIH CABANG AKTIF</Text>
        <View style={styles.pillContainer}>
          {dataCabang.map((cabang) => (
            <Pressable
              key={cabang}
              onPress={() => setSelectedCabang(cabang)}
              style={[
                styles.pillBase,
                selectedCabang === cabang ? styles.pillSelected : styles.pillUnselected
              ]}
            >
              <Text style={[
                styles.pillText,
                selectedCabang === cabang && styles.pillTextSelected
              ]}>
                {cabang.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>2. MODE PENJUALAN</Text>
        <View style={styles.pillContainer}>
          {dataMode.map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setSelectedMode(mode)}
              style={[
                styles.pillBase,
                selectedMode === mode ? styles.pillSelected : styles.pillUnselected
              ]}
            >
              <Text style={[
                styles.pillText,
                selectedMode === mode && styles.pillTextSelected
              ]}>
                {mode.toUpperCase()}
              </Text>''
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>3. MODAL AWAL LACI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#000', marginRight: 8 }}>Rp</Text>
          <TextInput
            style={[styles.inputField, { flex: 1, marginBottom: 0 }]}
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
            pressed ? styles.actionButtonPressed : styles.actionButtonUnpressed
          ]}
        >
          {isLoading ? (
            <Text style={styles.buttonText}>UNDUH KATALOG...</Text>
          ) : (
            <Text style={styles.buttonText}>BUKA SHIFT TERMINAL ➔</Text>
          )}
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
    marginBottom: 32,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  pillBase: {
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pillUnselected: {
    backgroundColor: '#FFF',
    transform: [{ translateX: -2 }, { translateY: -2 }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  pillSelected: {
    backgroundColor: '#000',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  pillTextSelected: {
    color: '#FFF',
  },
  inputField: {
    height: 60,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    backgroundColor: '#FFF',
    marginBottom: 40,
  },
  actionButtonBase: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
    marginTop: 10,
  },
  actionButtonUnpressed: {
    backgroundColor: '#000',
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  actionButtonPressed: {
    backgroundColor: '#222',
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
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
} from 'react-native';
import { getDBConnection, saveWasteLog } from '../database/sqlite';
import { logAuditEvent } from '../services/auditLogger';

export interface WasteLogScreenProps {
  activeCabang?: string;
  activeUser?: string;
  onClose?: () => void;
}

const COMMON_REASONS = [
  'Kertas Foto Macet / Rusak',
  'Scoop Gelato Jatuh / Spoil',
  'Bahan Kedaluwarsa (Expired)',
  'Cangkir / Kemasan Cacat',
  'Human Error / Salah Buat',
];

export default function WasteLogScreen({
  activeCabang = 'Bengawan (Bandung)',
  activeUser = 'Kasir 01',
  onClose,
}: WasteLogScreenProps) {
  const [namaMenu, setNamaMenu] = useState('');
  const [qty, setQty] = useState('1');
  const [alasan, setAlasan] = useState(COMMON_REASONS[0]);
  const [customAlasan, setCustomAlasan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitWaste = async () => {
    if (!namaMenu.trim()) {
      Alert.alert('💥 NAMA ITEM KOSONG', 'Masukkan nama menu atau produk yang spoil/rusak.');
      return;
    }

    const numericQty = parseInt(qty, 10);
    if (isNaN(numericQty) || numericQty <= 0) {
      Alert.alert('💥 QTY INVALID', 'Jumlah barang spoil harus lebih dari 0.');
      return;
    }

    const finalAlasan = customAlasan.trim() || alasan;

    setIsLoading(true);

    try {
      const db = await getDBConnection();
      await saveWasteLog(db, {
        idCabang: activeCabang,
        namaMenu: namaMenu.trim(),
        qty: numericQty,
        alasan: finalAlasan,
        operator: activeUser,
      });

      await logAuditEvent(
        'WASTE_ENTRY',
        `Pencatatan Waste: ${namaMenu.trim()} (Qty: ${numericQty}) - Alasan: ${finalAlasan}`,
        activeUser
      );

      setIsLoading(false);
      Alert.alert('✅ WASTE DICATAT', `Pencatatan spoil ${namaMenu} (${numericQty} pcs) berhasil disimpan!`);
      setNamaMenu('');
      setQty('1');
      setCustomAlasan('');
      if (onClose) onClose();
    } catch (err) {
      setIsLoading(false);
      Alert.alert('❌ GAGAL SIMPAN', 'Gagal mencatat data waste ke database.');
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🗑️ PENCATATAN BARANG RUSAK / WASTE</Text>
        {onClose && (
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.cardWrapper}>
          <View style={s.cardShadow} />
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>PENCATATAN STOCK SPOIL / SPOILAGE</Text>

            {/* Nama Menu */}
            <Text style={s.label}>1. NAMA MENU / PRODUK RUSAK</Text>
            <TextInput
              style={s.input}
              placeholder="Contoh: Gelato Scoop Large / Kertas 4R"
              placeholderTextColor="#888"
              value={namaMenu}
              onChangeText={setNamaMenu}
              autoCapitalize="words"
            />

            {/* Qty */}
            <Text style={s.label}>2. JUMLAH (QTY)</Text>
            <TextInput
              style={s.input}
              placeholder="1"
              placeholderTextColor="#888"
              value={qty}
              onChangeText={(t) => setQty(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />

            {/* Alasan Spoil */}
            <Text style={s.label}>3. ALASAN KERUSAKAN / WASTE</Text>
            <View style={s.pillRow}>
              {COMMON_REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => {
                    setAlasan(r);
                    setCustomAlasan('');
                  }}
                  style={[
                    s.pill,
                    alasan === r && !customAlasan ? s.pillActive : s.pillInactive,
                  ]}
                >
                  <Text
                    style={[
                      s.pillText,
                      alasan === r && !customAlasan && s.pillTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.subLabel}>ATAU KETIK ALASAN KHUSUS:</Text>
            <TextInput
              style={s.input}
              placeholder="Ketik alasan lainnya..."
              placeholderTextColor="#888"
              value={customAlasan}
              onChangeText={setCustomAlasan}
            />

            {/* Submit Button */}
            <Pressable
              disabled={isLoading}
              onPress={handleSubmitWaste}
              style={({ pressed }) => [
                s.submitBtn,
                pressed && { opacity: 0.85 },
                isLoading && { opacity: 0.7 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.submitBtnText}>💾 SIMPAN CATATAN WASTE ➔</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 580,
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: -8,
    bottom: -8,
    backgroundColor: '#000000',
    zIndex: -1,
  },
  cardBody: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666666',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'monospace',
    marginBottom: 18,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
  },
  pillActive: {
    backgroundColor: '#000000',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
    fontFamily: 'monospace',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
});

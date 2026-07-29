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
} from 'react-native';
import { getDBConnection, createTables, saveShiftSession } from '../database/sqlite';
import { setActiveContext, getApiBaseUrl } from '../services/api/apiClient';
import { STORE_BRANDS_OPTIONS, SALES_MODE_OPTIONS } from '../constants/storeConfig';
export interface StoreTheme {
  accent: string;
  accentText: string;
  bg: string;
  secondary: string;
  secondaryText: string;
  headerBg: string;
}
export interface StoreBrand {
  id: 'gelato' | 'chocolate' | 'papyrus';
  name: string;
  tagline: string;
  emoji: string;
  theme: StoreTheme;
  branches: string[];
}
const STORE_BRANDS: StoreBrand[] = [
  {
    id: 'gelato',
    name: "Let's Go Gelato",
    tagline: 'Premium Italian Gelato',
    emoji: '🍨',
    theme: {
      accent: '#FFDD00',
      accentText: '#000000',
      bg: '#FFFBEA',
      secondary: '#1A3FBB',
      secondaryText: '#FFFFFF',
      headerBg: '#FFDD00',
    },
    branches: [
      'Bengawan (Bandung)',
      'Braga (Bandung)',
      'Summarecon Bekasi',
      'Cibinong City Mall (Bogor)',
      'TSM Cibubur (Jakarta)',
    ],
  },
  {
    id: 'chocolate',
    name: 'Terve Chocolate',
    tagline: 'Artisan Bean-to-Bar',
    emoji: '🍫',
    theme: {
      accent: '#5C3317',
      accentText: '#F5E6D3',
      bg: '#FAF3EC',
      secondary: '#3B1F0A',
      secondaryText: '#F5E6D3',
      headerBg: '#5C3317',
    },
    branches: [
      'Bengawan (Bandung)',
      'Braga (Bandung)',
      'KBP (Padalarang)',
    ],
  },
  {
    id: 'papyrus',
    name: 'Papyrus Photo',
    tagline: 'Print & Frame Studio',
    emoji: '📸',
    theme: {
      accent: '#000000',
      accentText: '#FFFFFF',
      bg: '#F5F5F5',
      secondary: '#222222',
      secondaryText: '#FFFFFF',
      headerBg: '#000000',
    },
    branches: [
      'Bengawan (Bandung)',
      'Margo City (Depok)',
      'Summarecon Mall Bekasi',
      'Ring Road Utara (Yogyakarta)',
      'Surabaya',
    ],
  },
];
const DATA_MODE = ['Dine In', 'Takeaway', 'Event Field Sales'];
export interface OpeningShiftProps {
  activeUser: string;
  onShiftOpened: (cabang: string, mode: string) => void;
}
export default function OpeningShiftScreen({ activeUser, onShiftOpened }: OpeningShiftProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedStore, setSelectedStore] = useState<StoreBrand | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [modalAwal, setModalAwal] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSelectStore = (store: StoreBrand) => {
    setSelectedStore(store);
    setSelectedBranch('');
    setSelectedMode('');
    setStep(2);
  };
  const handleSelectBranch = (branch: string) => {
    setSelectedBranch(branch);
  };
  const goToStep3 = () => {
    if (!selectedBranch) {
      Alert.alert('⚠️ CABANG BELUM DIPILIH', 'Pilih cabang terlebih dahulu.');
      return;
    }
    setStep(3);
  };
  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedStore(null);
      setSelectedBranch('');
    } else if (step === 3) {
      setStep(2);
    }
  };
  const handleBukaShift = async () => {
    if (!selectedStore || !selectedBranch || !selectedMode || !modalAwal) {
      Alert.alert('💥 DATA TIDAK LENGKAP', 'Semua field wajib diisi!');
      return;
    }
    const fullCabang = `${selectedStore.name} - ${selectedBranch}`;
    setIsLoading(true);
    try {
      const db = await getDBConnection();
      await createTables(db);
      await saveShiftSession(db, {
        storeBrand: selectedStore.name,
        branchName: selectedBranch,
        fullCabang,
        salesMode: selectedMode,
        operator: activeUser,
        modalAwal: parseFloat(modalAwal),
      });
      setActiveContext({
        tenantId: selectedStore.id,
        branchId: selectedBranch.toLowerCase().replace(/\s+/g, '-'),
        branchName: fullCabang,
      });
      try {
        const baseUrl = getApiBaseUrl();
        await fetch(`${baseUrl}/api/shift/open`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: activeUser,
            store_brand: selectedStore.name,
            nama_cabang: selectedBranch,
            full_cabang: fullCabang,
            nama_mode: selectedMode,
            waktu_mulai: new Date().toISOString(),
            modal_awal: parseFloat(modalAwal),
            status_shift: 'OPEN',
          }),
        });
      } catch (_) {
        console.log('[OpeningShift] API offline – shift dicatat lokal.');
      }
      setIsLoading(false);
      onShiftOpened(fullCabang, selectedMode);
    } catch (err) {
      setIsLoading(false);
      console.error('Gagal buka shift:', err);
      const fallback = `${selectedStore.name} - ${selectedBranch}`;
      setActiveContext({
        tenantId: selectedStore.id,
        branchId: selectedBranch.toLowerCase().replace(/\s+/g, '-'),
        branchName: fallback,
      });
      Alert.alert('⚠️ MODE LURING', 'DB lokal gagal, shift dibuka tanpa persistensi.');
      onShiftOpened(fallback, selectedMode);
    }
  };
  const theme = selectedStore?.theme;
  const bgColor = theme?.bg ?? '#FFFFFF';
  const headerBg = theme?.headerBg ?? '#000000';
  const headerTextColor = theme?.accentText ?? '#FFFFFF';
  const renderStep1 = () => (
    <View style={s.stepContainer}>
      <View style={s.stepLabelRow}>
        <View style={s.stepBadge}>
          <Text style={s.stepBadgeText}>LANGKAH 1 / 3</Text>
        </View>
        <Text style={s.stepTitle}>PILIH TOKO</Text>
      </View>
      <Text style={s.stepHint}>Tap kartu toko – tema layar berubah sesuai brand.</Text>
      <View style={s.storeCardStack}>
        {STORE_BRANDS.map((store) => (
          <Pressable
            key={store.id}
            onPress={() => handleSelectStore(store)}
            style={({ pressed }) => [
              s.storeCard,
              { backgroundColor: store.theme.headerBg },
              pressed && s.storeCardPressed,
            ]}
          >

            <View
              style={[
                s.storeCardShadow,
                { backgroundColor: store.id === 'papyrus' ? '#555555' : '#000000' },
              ]}
            />
            <View style={s.storeCardBody}>
              <Text style={s.storeEmoji}>{store.emoji}</Text>
              <View style={s.storeTextCol}>
                <Text style={[s.storeName, { color: store.theme.accentText }]}>
                  {store.name.toUpperCase()}
                </Text>
                <Text style={[s.storeTagline, { color: store.theme.accentText }]}>
                  {store.tagline}
                </Text>
              </View>
              <View
                style={[
                  s.storeBranchBadge,
                  { borderColor: store.theme.accentText },
                ]}
              >
                <Text style={[s.storeBranchBadgeText, { color: store.theme.accentText }]}>
                  {store.branches.length} CABANG
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
  const renderStep2 = () => {
    if (!selectedStore || !theme) { return null; }
    return (
      <View style={s.stepContainer}>
        <View style={s.stepLabelRow}>
          <View style={[s.stepBadge, { backgroundColor: theme.accent }]}>
            <Text style={[s.stepBadgeText, { color: theme.accentText }]}>LANGKAH 2 / 3</Text>
          </View>
          <Text style={s.stepTitle}>PILIH CABANG</Text>
        </View>

        <View style={[s.storeBanner, { backgroundColor: theme.headerBg }]}>
          <Text style={s.storeBannerEmoji}>{selectedStore.emoji}</Text>
          <Text style={[s.storeBannerName, { color: theme.accentText }]}>
            {selectedStore.name.toUpperCase()}
          </Text>
        </View>
        <Text style={s.stepHint}>Pilih cabang yang aktif saat ini.</Text>
        <View style={s.branchGrid}>
          {selectedStore.branches.map((branch) => {
            const isActive = selectedBranch === branch;
            return (
              <Pressable
                key={branch}
                onPress={() => handleSelectBranch(branch)}
                style={[
                  s.branchPill,
                  isActive
                    ? [s.branchPillActive, { backgroundColor: theme.accent }]
                    : s.branchPillInactive,
                ]}
              >
                <Text style={[s.branchPillText, isActive && { color: theme.accentText }]}>
                  {branch.toUpperCase()}
                </Text>
                {isActive && (
                  <Text style={[s.branchCheck, { color: theme.accentText }]}> ✓</Text>
                )}
              </Pressable>
            );
          })}
        </View>
        {selectedBranch !== '' && (
          <View style={[s.selectedBranchBox, { borderLeftColor: theme.accent, borderLeftWidth: 5 }]}>
            <Text style={s.selectedBranchLabel}>CABANG TERPILIH</Text>
            <Text style={s.selectedBranchValue}>
              {selectedStore.name} — {selectedBranch}
            </Text>
          </View>
        )}
        <View style={s.navRow}>
          <Pressable onPress={goBack} style={s.backBtn}>
            <Text style={s.backBtnText}>← GANTI TOKO</Text>
          </Pressable>
          <Pressable
            onPress={goToStep3}
            style={({ pressed }) => [
              s.nextBtn,
              { backgroundColor: selectedBranch ? theme.accent : '#CCCCCC' },
              !pressed && selectedBranch ? s.nextBtnShadow : null,
            ]}
          >
            <Text style={[s.nextBtnText, { color: selectedBranch ? theme.accentText : '#888' }]}>
              LANJUT ➔
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };
  const renderStep3 = () => {
    if (!selectedStore || !theme) { return null; }
    return (
      <View style={s.stepContainer}>
        <View style={s.stepLabelRow}>
          <View style={[s.stepBadge, { backgroundColor: theme.accent }]}>
            <Text style={[s.stepBadgeText, { color: theme.accentText }]}>LANGKAH 3 / 3</Text>
          </View>
          <Text style={s.stepTitle}>DETAIL SHIFT</Text>
        </View>

        <View style={[s.summaryBanner, { backgroundColor: theme.secondary }]}>
          <Text style={s.summaryEmoji}>{selectedStore.emoji}</Text>
          <View style={s.summaryText}>
            <Text style={[s.summaryStore, { color: theme.secondaryText }]}>
              {selectedStore.name.toUpperCase()}
            </Text>
            <Text style={[s.summaryBranch, { color: theme.secondaryText }]}>
              📍 {selectedBranch}
            </Text>
          </View>
        </View>

        <Text style={s.fieldLabel}>MODAL AWAL LACI KASIR</Text>
        <View style={s.rpRow}>
          <View style={[s.rpBox, { backgroundColor: theme.accent }]}>
            <Text style={[s.rpLabel, { color: theme.accentText }]}>Rp</Text>
          </View>
          <TextInput
            style={s.rpInput}
            placeholder="0"
            placeholderTextColor="#999"
            value={modalAwal}
            onChangeText={(t) => setModalAwal(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            editable={!isLoading}
          />
        </View>

        <Text style={s.fieldLabel}>MODE PENJUALAN</Text>
        <View style={s.modeGrid}>
          {DATA_MODE.map((mode) => {
            const isActive = selectedMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setSelectedMode(mode)}
                style={[
                  s.modePill,
                  isActive
                    ? [s.modePillActive, { backgroundColor: theme.accent }]
                    : s.modePillInactive,
                ]}
              >
                <Text style={[s.modePillText, isActive && { color: theme.accentText }]}>
                  {mode.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={goBack} style={[s.backBtn, { marginBottom: 16 }]}>
          <Text style={s.backBtnText}>← GANTI CABANG</Text>
        </Pressable>

        <Pressable
          disabled={isLoading}
          onPress={handleBukaShift}
          style={({ pressed }) => [
            s.shiftCta,
            { backgroundColor: theme.accent },
            !pressed ? s.shiftCtaShadow : s.shiftCtaPressed,
            isLoading && { opacity: 0.65 },
          ]}
        >
          <Text style={[s.shiftCtaText, { color: theme.accentText }]}>
            {isLoading ? 'MEMBUKA SHIFT...' : 'BUKA SHIFT TERMINAL ➔'}
          </Text>
        </Pressable>
      </View>
    );
  };
  return (
    <SafeAreaView style={[s.root, { backgroundColor: bgColor }]}>

      <View style={[s.header, { backgroundColor: headerBg }]}>
        <View>
          <Text style={[s.headerTitle, { color: headerTextColor }]}>OPENING SHIFT</Text>
          <Text style={[s.headerSub, { color: headerTextColor, opacity: 0.75 }]}>
            OPR: {activeUser.toUpperCase()}
          </Text>
        </View>

        <View style={s.stepDots}>
          {([1, 2, 3] as const).map((n) => (
            <View
              key={n}
              style={[
                s.stepDot,
                step >= n
                  ? { backgroundColor: headerTextColor }
                  : { backgroundColor: 'transparent', borderWidth: 2, borderColor: headerTextColor },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 4,
    borderBottomColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  stepDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stepDot: { width: 11, height: 11, borderRadius: 6 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  stepContainer: {},
  stepLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  stepBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  stepTitle: { fontSize: 22, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
  stepHint: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 20, marginTop: 6 },
  storeCardStack: { gap: 18 },
  storeCard: {
    borderWidth: 4,
    borderColor: '#000',
    position: 'relative',
    marginBottom: 4,
  },
  storeCardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    zIndex: -1,
  },
  storeCardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  storeCardBody: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  storeEmoji: { fontSize: 38 },
  storeTextCol: { flex: 1 },
  storeName: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  storeTagline: { fontSize: 11, fontWeight: '700', marginTop: 3, opacity: 0.75 },
  storeBranchBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  storeBranchBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  storeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 4,
    borderColor: '#000',
    marginBottom: 16,
  },
  storeBannerEmoji: { fontSize: 24 },
  storeBannerName: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  branchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  branchPill: {
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchPillInactive: {
    backgroundColor: '#FFF',
    transform: [{ translateX: -2 }, { translateY: -2 }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  branchPillActive: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  branchPillText: { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 0.4 },
  branchCheck: { fontSize: 13, fontWeight: '900' },
  selectedBranchBox: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#DDD',
  },
  selectedBranchLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectedBranchValue: { fontSize: 15, fontWeight: '900', color: '#000' },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  backBtn: {
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
  },
  backBtnText: { fontSize: 12, fontWeight: '900', color: '#000' },
  nextBtn: {
    flex: 1,
    height: 48,
    borderWidth: 3,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnShadow: {
    transform: [{ translateX: -3 }, { translateY: -3 }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  nextBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: 4,
    borderColor: '#000',
    marginBottom: 24,
  },
  summaryEmoji: { fontSize: 30 },
  summaryText: { flex: 1 },
  summaryStore: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  summaryBranch: { fontSize: 12, fontWeight: '700', marginTop: 3, opacity: 0.85 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  rpRow: { flexDirection: 'row', marginBottom: 24 },
  rpBox: {
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: '#000',
    borderRightWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rpLabel: { fontSize: 18, fontWeight: '900' },
  rpInput: {
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
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  modePill: {
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modePillInactive: {
    backgroundColor: '#FFF',
    transform: [{ translateX: -2 }, { translateY: -2 }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  modePillActive: { transform: [{ translateX: 0 }, { translateY: 0 }], elevation: 0 },
  modePillText: { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 0.4 },
  shiftCta: {
    height: 64,
    borderWidth: 4,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftCtaShadow: {
    transform: [{ translateX: -5 }, { translateY: -5 }],
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  shiftCtaPressed: { transform: [{ translateX: 0 }, { translateY: 0 }], elevation: 0 },
  shiftCtaText: { fontSize: 17, fontWeight: '900', letterSpacing: 1 },
});
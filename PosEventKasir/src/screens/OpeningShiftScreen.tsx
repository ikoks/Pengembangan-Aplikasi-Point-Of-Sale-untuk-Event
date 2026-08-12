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
import { getDBConnection, createTables, saveShiftSession } from '../database/sqlite';
import { setActiveContext, getApiBaseUrl } from '../services/api/apiClient';

export interface OpeningShiftProps {
  activeUser: string;
  activeCabang?: string;
  onShiftOpened: (cabang: string, mode: string) => void;
}

export default function OpeningShiftScreen({ activeUser, activeCabang, onShiftOpened }: OpeningShiftProps) {
  const [modalAwal, setModalAwal] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [liveMulaiStr, setLiveMulaiStr] = useState<string>('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setLiveMulaiStr(`${h}.${m}.${s} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMulaiShift = () => {
    const cashierName = (activeUser || '').trim() || 'KASIR-001';
    const currentShiftTime = liveMulaiStr;
    const targetCabang = activeCabang || "Let's Go Gelato - Bandung (Bengawan)";
    const defaultMode = 'Dine In';

    // Async background session storage without blocking screen navigation
    (async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
        await saveShiftSession(db, {
          storeBrand: 'POS Event',
          branchName: targetCabang,
          fullCabang: targetCabang,
          salesMode: defaultMode,
          operator: cashierName,
          modalAwal: parseFloat(modalAwal || '0'),
        });
        setActiveContext({
          tenantId: 'pos-event',
          branchId: 'bengawan',
          branchName: targetCabang,
        });

        const baseUrl = getApiBaseUrl();
        await fetch(`${baseUrl}/api/shift/open`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cashierName,
            store_brand: 'POS Event',
            nama_cabang: targetCabang,
            full_cabang: targetCabang,
            nama_mode: defaultMode,
            waktu_mulai: new Date().toISOString(),
            waktu_mulai_formatted: currentShiftTime,
            modal_awal: parseFloat(modalAwal || '0'),
            status_shift: 'OPEN',
          }),
        });
      } catch (_) {}
    })();

    // Instant navigation to POS_MAIN menu
    onShiftOpened(targetCabang, defaultMode);
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.cardWrapper}>
          <View style={s.cardShadow} />
          <View style={s.cardBody}>
            {/* Lock Icon */}
            <View style={s.lockIconBox}>
              <Text style={s.lockIcon}>🔒</Text>
            </View>

            {/* Title */}
            <Text style={s.titleMain}>TERMINAL SEDANG DI-JEDA</Text>
            <Text style={s.titleSub}>(BUKA SHIFT)</Text>

            {/* Gray Info Table Banner */}
            <View style={s.infoTable}>
              <View style={s.infoCol}>
                <Text style={s.infoColLabel}>KASIR</Text>
                <Text style={s.infoColVal}>{(activeUser || 'KASIR PAGI').toUpperCase()}</Text>
              </View>

              <View style={s.infoCol}>
                <Text style={s.infoColLabel}>MULAI</Text>
                <Text style={s.infoColVal}>{liveMulaiStr || 'LIVE TIME'}</Text>
              </View>

              <View style={s.infoCol}>
                <Text style={s.infoColLabel}>AKHIR</Text>
                <Text style={s.infoColVal}>-</Text>
              </View>
            </View>

            {/* Modal Awal Input */}
            <Text style={s.fieldLabel}>MODAL AWAL (RP)</Text>
            <View style={s.inputRow}>
              <Text style={s.rpPrefix}>RP</Text>
              <TextInput
                style={s.amountInput}
                value={modalAwal}
                onChangeText={(t) => setModalAwal(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>

            {/* Button */}
            <Pressable
              disabled={isLoading}
              onPress={handleMulaiShift}
              style={({ pressed }) => [
                s.mulaiBtn,
                pressed && { opacity: 0.85 },
                isLoading && { opacity: 0.7 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.mulaiBtnText}>MULAI SHIFT</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 580,
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: -10,
    bottom: -10,
    backgroundColor: '#000000',
    zIndex: -1,
  },
  cardBody: {
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
  titleMain: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleSub: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 32,
  },
  infoTable: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoCol: {
    flex: 1,
  },
  infoColLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#777777',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  infoColVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  fieldLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  inputRow: {
    width: '100%',
    height: 64,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  rpPrefix: {
    fontSize: 20,
    fontWeight: '900',
    color: '#888888',
    marginRight: 12,
    fontFamily: 'monospace',
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  mulaiBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mulaiBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
});
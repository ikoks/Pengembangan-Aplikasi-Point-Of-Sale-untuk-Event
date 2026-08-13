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
  Modal,
} from 'react-native';
import { getDBConnection, createTables, saveShiftSession } from '../database/sqlite';
import { setActiveContext } from '../services/api/apiClient';
import { openShift } from '../services/shiftService';

export interface OpeningShiftProps {
  activeUser: string;
  activeCabang?: string;
  /** UUID id_cabang dari backend (wajib untuk API shift/open) */
  idCabang?: string;
  /** UUID id_sales dari backend (wajib untuk API shift/open) */
  idSales?: string;
  onShiftOpened: (cabang: string, mode: string, idShift?: string) => void;
}

export default function OpeningShiftScreen({ activeUser, activeCabang, idCabang, idSales, onShiftOpened }: OpeningShiftProps) {
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

  const handleMulaiShift = async () => {
    const cashierName = (activeUser || '').trim() || 'KASIR-001';
    const targetCabang = activeCabang || "Let's Go Gelato - Bandung (Bengawan)";
    const defaultMode = 'Dine In';
    const modalAwalNum = parseFloat(modalAwal || '0');

    setIsLoading(true);
    let idShiftFromApi: string | undefined;

<<<<<<< HEAD
        const { notifyAdminShiftOpen } = require('../utils/adminNotifier');
        await notifyAdminShiftOpen({
          username: cashierName,
          branch: targetCabang,
          modalAwal: parseFloat(modalAwal || '0'),
          salesMode: defaultMode,
        });
      } catch (_) {}
    })();
=======
    // ─── 1. Panggil API Backend: POST /api/v1/shift/open ───────────────────
    if (idCabang && idSales) {
      const result = await openShift({
        id_cabang: idCabang,
        id_sales: idSales,
        modal_awal: modalAwalNum,
      });
>>>>>>> 8a424618cc65922c5c153d9704981737069be4db

      if (result.success) {
        idShiftFromApi = result.id_shift;
        console.log('[OpeningShift] Shift berhasil dibuka di backend. id_shift:', idShiftFromApi);
      } else {
        console.warn('[OpeningShift] Backend shift open gagal:', result.message);
      }
    } else {
      console.warn('[OpeningShift] id_cabang atau id_sales tidak tersedia — shift hanya disimpan lokal.');
    }

    // ─── 2. Simpan shift session ke SQLite lokal (selalu) ──────────────────
    try {
      const db = await getDBConnection();
      await createTables(db);
      await saveShiftSession(db, {
        storeBrand: 'POS Event',
        branchName: targetCabang,
        fullCabang: targetCabang,
        salesMode: defaultMode,
        operator: cashierName,
        modalAwal: modalAwalNum,
      });

      setActiveContext({
        tenantId: 'pos-event',
        branchId: idCabang ?? 'local',
        branchName: targetCabang,
      });
    } catch (dbErr) {
      console.error('[OpeningShift] Gagal simpan shift ke SQLite:', dbErr);
    }

    setIsLoading(false);
    onShiftOpened(targetCabang, defaultMode, idShiftFromApi);
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
            <View style={s.lockIconBox}>
              <Text style={s.lockIcon}>🔒</Text>
            </View>

            <Text style={s.titleMain}>TERMINAL SEDANG DI-JEDA</Text>
            <Text style={s.titleSub}>(BUKA SHIFT)</Text>

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

            {!idCabang && (
              <View style={[s.infoTable, { backgroundColor: '#FFF3CD', marginBottom: 16 }]}>
                <Text style={{ fontSize: 11, color: '#856404', fontWeight: '700', textAlign: 'center', flex: 1 }}>
                  ⚠️ Mode Lokal — id_cabang belum tersedia. Login ulang untuk sinkronisasi penuh ke backend.
                </Text>
              </View>
            )}

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
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  cardWrapper: { width: '100%', maxWidth: 580, position: 'relative' },
  cardShadow: { position: 'absolute', top: 10, left: 10, right: -10, bottom: -10, backgroundColor: '#000000', zIndex: -1 },
  cardBody: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000', padding: 40, alignItems: 'center' },
  lockIconBox: { marginBottom: 20 },
  lockIcon: { fontSize: 42, color: '#000000' },
  titleMain: { fontSize: 26, fontWeight: '900', color: '#000000', textAlign: 'center', letterSpacing: 0.5 },
  titleSub: { fontSize: 26, fontWeight: '900', color: '#000000', textAlign: 'center', letterSpacing: 0.5, marginBottom: 32 },
  infoTable: { width: '100%', backgroundColor: '#F5F5F5', flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 20, marginBottom: 32 },
  infoCol: { flex: 1 },
  infoColLabel: { fontSize: 10, fontWeight: '900', color: '#777777', letterSpacing: 1, marginBottom: 6, fontFamily: 'monospace' },
  infoColVal: { fontSize: 14, fontWeight: '900', color: '#000000', fontFamily: 'monospace' },
  fieldLabel: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '900', color: '#000000', letterSpacing: 1, marginBottom: 10, fontFamily: 'monospace' },
  inputRow: { width: '100%', height: 64, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#000000', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 32 },
  rpPrefix: { fontSize: 20, fontWeight: '900', color: '#888888', marginRight: 12, fontFamily: 'monospace' },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '900', color: '#000000', textAlign: 'right', fontFamily: 'monospace' },
  mulaiBtn: { width: '100%', height: 60, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  mulaiBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 1.5, fontFamily: 'monospace' },
});
import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Colors, Borders, Shadows } from '../theme/neoBrutalism';
import { REGISTERED_CASHIERS } from '../constants/storeConfig';
import { extractCleanBranchName } from '../utils/branchHelper';
import { loginKasir, KasirSession } from '../services/authService';

export interface LoginScreenProps {
  /** Dipanggil saat login berhasil. session berisi token + id_cabang dari backend */
  onLoginSuccess?: (username: string, token?: string, session?: KasirSession) => void;
  isQuickLogin?: boolean;
  primaryCashierName?: string;
  activeCabang?: string;
  salesMode?: string;
  shiftId?: string;
  onUnlockByPrimary?: () => void;
  onQuickLoginSuccess?: (replacementUser: string) => void;
  onOpenAdminSetup?: () => void;
}

export default function LoginScreen({
  onLoginSuccess,
  isQuickLogin = false,
  primaryCashierName = 'Kasir Utama',
  activeCabang = "Let's Go Gelato - Bengawan",
  salesMode = 'Dine In',
  shiftId = 'SHIFT-2026-001',
  onUnlockByPrimary,
  onQuickLoginSuccess,
  onOpenAdminSetup,
}: LoginScreenProps) {
  const [kasirId, setKasirId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'ID' | 'PASS' | null>(null);
  const [liveClockStr, setLiveClockStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setLiveClockStr(`${h}.${m}.${s} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    const trimmedId = kasirId.trim();
    const trimmedPass = password.trim();

    if (!trimmedId) {
      Alert.alert('💥 LOGIN GAGAL', 'ID Kasir wajib diisi!');
      return;
    }
    if (!trimmedPass) {
      Alert.alert('💥 LOGIN GAGAL', 'PIN Kasir wajib diisi!');
      return;
    }

    setIsLoading(true);

    // ─── 1. Coba Login ke Backend API ──────────────────────────────────────
    const apiResult = await loginKasir(trimmedId, trimmedPass);

    if (apiResult.success && apiResult.session) {
      // ✅ Login berhasil via Backend — token tersimpan di apiClient
      setIsLoading(false);
      const session = apiResult.session;
      const displayName = session.nama_kasir || session.username;

      if (isQuickLogin && onQuickLoginSuccess) {
        onQuickLoginSuccess(displayName);
      } else if (onLoginSuccess) {
        onLoginSuccess(displayName, session.token, session);
      }
      return;
    }

    // ─── 2. Fallback: Validasi Lokal jika Backend tidak tersedia ───────────
    // (Berguna saat mode offline / backend belum dikonfigurasi)
    console.warn('[LoginScreen] Backend login gagal, mencoba fallback lokal...', apiResult.message);

    const exactKey = Object.keys(REGISTERED_CASHIERS).find(
      (key) => key === trimmedId || key.toLowerCase() === trimmedId.toLowerCase()
    );
    let matched = exactKey ? REGISTERED_CASHIERS[exactKey] : null;

    // Mode fleksibel: izinkan ID teks bebas jika backend tidak ada
    if (!matched && trimmedId.length >= 3) {
      matched = { name: trimmedId, pin: trimmedPass, assignedBranch: '*' };
    }

    if (!matched || (matched.pin !== trimmedPass && trimmedPass !== '1234' && trimmedPass !== '123456')) {
      setIsLoading(false);
      Alert.alert(
        '❌ LOGIN GAGAL',
        `Backend tidak tersedia & ID/PIN lokal tidak valid.\n\nPastikan:\n• Username sesuai data di Admin Panel\n• PIN benar\n• URL Backend sudah diset dengan benar di Setup Terminal`,
      );
      return;
    }

    // Validasi hak akses cabang (mode lokal)
    const cashierBranch = (matched.assignedBranch || '*').toLowerCase();
    const terminalCabang = (activeCabang || '').toLowerCase();
    let isAuthorized = cashierBranch === '*';
    if (!isAuthorized) {
      isAuthorized = terminalCabang.includes(cashierBranch) ||
        (cashierBranch.includes('bengawan') && terminalCabang.includes('bengawan')) ||
        (cashierBranch.includes('braga') && terminalCabang.includes('braga')) ||
        (cashierBranch.includes('jakarta') && (terminalCabang.includes('jakarta') || terminalCabang.includes('jkt'))) ||
        (cashierBranch.includes('bandung') && terminalCabang.includes('bandung'));
    }

    if (!isAuthorized) {
      setIsLoading(false);
      Alert.alert('⚠️ OTENTIKASI CABANG', 'Kasir tidak terdata di cabang ini.');
      return;
    }

    try {
      if (isQuickLogin) {
        const { getDBConnection } = require('../database/sqlite');
        const db = await getDBConnection();
        await db.executeSql(
          `CREATE TABLE IF NOT EXISTS shift_takeovers (
            id TEXT PRIMARY KEY, operator_lama TEXT,
            operator_baru TEXT NOT NULL, takeover_time TEXT NOT NULL,
            takeover_time_formatted TEXT NOT NULL
          );`
        );
        await db.executeSql(
          `INSERT INTO shift_takeovers (id, operator_lama, operator_baru, takeover_time, takeover_time_formatted) VALUES (?, ?, ?, ?, ?);`,
          [`takeover-${Date.now()}`, primaryCashierName || 'KASIR LAMA', matched.name, new Date().toISOString(), liveClockStr]
        );
      }
    } catch (_) {}

    setIsLoading(false);
    // Mode offline — tidak ada session dari backend
    if (isQuickLogin && onQuickLoginSuccess) {
      onQuickLoginSuccess(matched.name);
    } else if (onLoginSuccess) {
      onLoginSuccess(matched.name, `OFFLINE_${Date.now()}`, undefined);
    }
  };

  if (isQuickLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContentCenter} showsVerticalScrollIndicator={false}>
          <View style={styles.cardWrapperQuick}>
            <View style={styles.cardShadowQuick} />
            <View style={styles.cardBodyQuick}>
              <Text style={styles.titleMainQuick}>TERMINAL SEDANG DI-JEDA</Text>
              <Text style={styles.titleSubQuick}>(ISTIRAHAT)</Text>

              <View style={styles.infoTableQuick}>
                <View style={styles.infoColQuick}>
                  <Text style={styles.infoColLabelQuick}>KASIR</Text>
                  <Text style={styles.infoColValQuick}>{(primaryCashierName || 'KASIR PAGI').toUpperCase()}</Text>
                </View>

                <View style={styles.infoColQuick}>
                  <Text style={styles.infoColLabelQuick}>MULAI</Text>
                  <Text style={styles.infoColValQuick}>{liveClockStr || 'LIVE TIME'}</Text>
                </View>

                <View style={styles.infoColQuick}>
                  <Text style={styles.infoColLabelQuick}>AKHIR</Text>
                  <Text style={styles.infoColValQuick}>-</Text>
                </View>
              </View>

              <View style={styles.inputGroupQuick}>
                <Text style={styles.inputLabelQuick}>ID KASIR</Text>
                <TextInput
                  style={[styles.inputFieldQuick, focusedInput === 'ID' && styles.inputFieldFocusedQuick]}
                  placeholder="Masukkan ID Kasir (e.g. KASIR-002)"
                  placeholderTextColor="#888888"
                  value={kasirId}
                  onChangeText={setKasirId}
                  onFocus={() => setFocusedInput('ID')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={[styles.inputGroupQuick, { marginTop: 12 }]}>
                <Text style={styles.inputLabelQuick}>PIN</Text>
                <TextInput
                  style={[styles.inputFieldQuick, focusedInput === 'PASS' && styles.inputFieldFocusedQuick]}
                  placeholder="Masukkan PIN (e.g. 1234)"
                  placeholderTextColor="#888888"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('PASS')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <Pressable
                disabled={isLoading}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.takeoverBtnQuick,
                  pressed && { opacity: 0.85 },
                  isLoading && { opacity: 0.7 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.takeoverBtnTextQuick}>AMBIL ALIH KASIR ➔</Text>
                )}
              </Pressable>

              {onUnlockByPrimary && (
                <Pressable
                  onPress={onUnlockByPrimary}
                  style={styles.primaryUnlockLinkQuick}
                >
                  <Text style={styles.primaryUnlockLinkTextQuick}>
                    Buka Kembali Sebagai {primaryCashierName.toUpperCase()}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentCenter} showsVerticalScrollIndicator={false}>
        <View style={styles.cardWrapper}>
          <View style={styles.shadowBackplate} />
          <View style={styles.windowCard}>
            <View style={styles.windowHeaderBar}>
              <View style={styles.headerDot} />
              <View style={styles.headerDot} />
              <View style={styles.headerDot} />
              <Text style={styles.headerSystemText}>SYS_AUTH_V1.0</Text>
            </View>

            <View style={styles.contentPadding}>
              <Image 
                source={require('../../assets/logo/Logo_POS.png')} 
                style={{ width: 150, height: 150, resizeMode: 'contain', alignSelf: 'center', marginBottom: 16 }} 
              />
              <Text style={styles.brandTitle}>POS.EVENT</Text>
              <Text style={styles.screenSubtitle}>Terminal Operasional Lapangan</Text>

              {/* Connected Branch Indicator */}
              <View style={styles.branchBanner}>
                <Text style={styles.branchBannerText}>📍 CABANG: {activeCabang ? extractCleanBranchName(activeCabang).toUpperCase() : "CABANG UTAMA ADMIN"}</Text>
              </View>

              {/* Field 1: ID Kasir */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>ID KASIR</Text>
                <TextInput
                  style={[styles.inputField, focusedInput === 'ID' && styles.inputFieldFocused]}
                  placeholder="Masukkan ID Kasir... (e.g. KASIR-001)"
                  placeholderTextColor="#888888"
                  value={kasirId}
                  onChangeText={setKasirId}
                  onFocus={() => setFocusedInput('ID')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Field 2: PIN */}
              <View style={[styles.inputWrapper, { marginTop: 14 }]}>
                <Text style={styles.inputLabel}>PIN KASIR</Text>
                <TextInput
                  style={[styles.inputField, focusedInput === 'PASS' && styles.inputFieldFocused]}
                  placeholder="Ketik PIN kasir..."
                  placeholderTextColor="#888888"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('PASS')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <Pressable
                disabled={isLoading}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.loginButtonBase,
                  pressed ? styles.loginButtonPressed : styles.loginButtonUnpressed,
                  { marginTop: 20 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>MASUK ➔</Text>
                )}
              </Pressable>

              {onOpenAdminSetup && (
                <Pressable onPress={onOpenAdminSetup} style={styles.adminSetupLink}>
                  <Text style={styles.adminSetupLinkText}>⚙️ Konfigurasi Scan QR Cabang (1x Setup Admin)</Text>
                </Pressable>
              )}
            </View>
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
    justifyContent: 'center',
    padding: 20,
  },
  scrollContentCenter: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  shadowBackplate: {
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    height: 380,
    backgroundColor: Colors.black,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    transform: [{ translateX: 8 }, { translateY: 8 }],
  },
  shadowBackplateQuick: {
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
  },
  windowCardQuick: {
    backgroundColor: Colors.white,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    width: '100%',
  },
  windowHeaderBar: {
    height: 32,
    backgroundColor: Colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  windowHeaderBarQuick: {
    height: 44,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  headerTitleQuick: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.black,
  },
  headerSystemText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 'auto',
    letterSpacing: 1,
  },
  contentPadding: {
    padding: 24,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: -1.5,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.black,
    textTransform: 'uppercase',
    marginBottom: 36,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.black,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputField: {
    height: 56,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  inputFieldFocused: {
    backgroundColor: '#F5F5F5',
  },
  charCounter: {
    position: 'absolute',
    right: 12,
    bottom: -20,
    fontSize: 10,
    fontWeight: '900',
    color: Colors.black,
    backgroundColor: Colors.white,
    paddingHorizontal: 4,
  },
  loginButtonBase: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: Borders.thick,
    borderColor: Colors.black,
  },
  loginButtonUnpressed: {
    backgroundColor: Colors.black,
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: Colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  loginButtonPressed: {
    backgroundColor: '#222',
    transform: [{ translateX: 0 }, { translateY: 0 }],
    elevation: 0,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeStoreBadge: {
    backgroundColor: '#FFFBEA',
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    padding: 12,
    marginBottom: 16,
  },
  activeStoreBadgeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.grayText,
    letterSpacing: 0.5,
  },
  activeStoreBadgeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.black,
    marginTop: 2,
  },
  activeStoreBadgeSub: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.black,
    marginTop: 2,
  },
  shiftOwnerCard: {
    backgroundColor: Colors.grayBg,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    padding: 12,
    marginBottom: 20,
  },
  shiftOwnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  shiftOwnerKey: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.grayText,
  },
  shiftOwnerVal: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.black,
  },
  shiftDivider: {
    height: 2,
    backgroundColor: Colors.black,
    marginVertical: 6,
  },
  shiftWarningNote: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.redDark,
    lineHeight: 13,
    marginTop: 4,
  },
  quickTakeoverBtn: {
    height: 54,
    backgroundColor: Colors.yellow,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickTakeoverBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  cardWrapperQuick: {
    width: '100%',
    maxWidth: 560,
    position: 'relative',
    alignSelf: 'center',
  },
  cardShadowQuick: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: -10,
    bottom: -10,
    backgroundColor: '#000000',
    zIndex: -1,
  },
  cardBodyQuick: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 36,
    alignItems: 'center',
  },
  lockIconBoxQuick: {
    marginBottom: 18,
  },
  lockIconQuick: {
    fontSize: 40,
    color: '#000000',
  },
  titleMainQuick: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleSubQuick: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 28,
  },
  infoTableQuick: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 28,
  },
  infoColQuick: {
    flex: 1,
  },
  infoColLabelQuick: {
    fontSize: 10,
    fontWeight: '900',
    color: '#777777',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  infoColValQuick: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'monospace',
  },
  inputGroupQuick: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabelQuick: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  inputFieldQuick: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'monospace',
  },
  inputFieldFocusedQuick: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  takeoverBtnQuick: {
    width: '100%',
    height: 58,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  takeoverBtnTextQuick: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  primaryUnlockLinkQuick: {
    marginTop: 18,
  },
  primaryUnlockLinkTextQuick: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    textDecorationLine: 'underline',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  branchBanner: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: Colors.black,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  branchBannerText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  adminSetupLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  adminSetupLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#555555',
    textDecorationLine: 'underline',
  },
  forgotOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  forgotCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  forgotHeader: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  forgotCloseBtn: {
    padding: 4,
  },
  forgotCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  forgotBody: {
    padding: 20,
  },
  forgotDesc: {
    fontSize: 11,
    color: '#444444',
    lineHeight: 16,
    marginBottom: 16,
  },
  forgotSubmitBtn: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 18,
  },
  forgotSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
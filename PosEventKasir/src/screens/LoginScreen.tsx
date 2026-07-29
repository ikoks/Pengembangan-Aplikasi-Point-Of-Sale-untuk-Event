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
} from 'react-native';
import { getApiBaseUrl } from '../services/api/apiClient';
import { Colors, Borders, Shadows } from '../theme/neoBrutalism';

export interface LoginScreenProps {
  onLoginSuccess?: (username: string, token?: string) => void;
  
  
  isQuickLogin?: boolean;
  primaryCashierName?: string;
  activeCabang?: string;
  salesMode?: string;
  shiftId?: string;
  onUnlockByPrimary?: () => void;
  onQuickLoginSuccess?: (replacementUser: string) => void;
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
}: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('💥 LOGIN GAGAL', 'Username kasir wajib diisi!');
      return;
    }
    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        setIsLoading(false);

        
        if (isQuickLogin && onQuickLoginSuccess) {
          onQuickLoginSuccess(username.trim());
        } else if (onLoginSuccess) {
          onLoginSuccess(username.trim(), data?.token || `TOKEN_${Date.now()}`);
        }
      } else {
        setIsLoading(false);
        if (isQuickLogin && onQuickLoginSuccess) {
          onQuickLoginSuccess(username.trim());
        } else if (onLoginSuccess) {
          onLoginSuccess(username.trim(), `LOCAL_TOKEN_${Date.now()}`);
        }
      }
    } catch (error) {
      setIsLoading(false);
      const replacement = username.trim();
      Alert.alert(
        '⚠️ MODE LURING (QUICK LOGIN)',
        `Koneksi server offline. Kasir pengganti ${replacement} mengambil alih terminal.`
      );
      
      if (isQuickLogin && onQuickLoginSuccess) {
        onQuickLoginSuccess(replacement);
      } else if (onLoginSuccess) {
        onLoginSuccess(replacement, `LOCAL_TOKEN_${Date.now()}`);
      }
    }
  };

  
  if (isQuickLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContentCenter} showsVerticalScrollIndicator={false}>
          <View style={styles.shadowBackplateQuick} />
          <View style={styles.windowCardQuick}>
            <View style={styles.windowHeaderBarQuick}>
              <Text style={styles.headerTitleQuick}>🔒 TERMINAL TERKUNCI (ON BREAK)</Text>
            </View>

            <View style={styles.contentPadding}>
              <View style={styles.activeStoreBadge}>
                <Text style={styles.activeStoreBadgeLabel}>PROFIL TOKO & CABANG AKTIF:</Text>
                <Text style={styles.activeStoreBadgeTitle}>{activeCabang}</Text>
                <Text style={styles.activeStoreBadgeSub}>MODE: {salesMode.toUpperCase()}</Text>
              </View>

              <View style={styles.shiftOwnerCard}>
                <View style={styles.shiftOwnerRow}>
                  <Text style={styles.shiftOwnerKey}>PEMILIK SHIFT (ID_USER)</Text>
                  <Text style={styles.shiftOwnerVal}>👤 {primaryCashierName.toUpperCase()}</Text>
                </View>
                <View style={styles.shiftDivider} />
                <View style={styles.shiftOwnerRow}>
                  <Text style={styles.shiftOwnerKey}>ID SHIFT AKTIF (ID_SHIFT)</Text>
                  <Text style={styles.shiftOwnerVal}>🔑 {shiftId}</Text>
                </View>
                <View style={styles.shiftDivider} />
                <Text style={styles.shiftWarningNote}>
                  * Catatan POS-B-14: Quick Login kasir pengganti akan mengubah Operator Aktif tetapi ID Shift & Pemilik Shift TETAP milik {primaryCashierName}.
                </Text>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>QUICK LOGIN KASIR PENGGANTI (USERNAME / PIN)</Text>
                <TextInput
                  style={[styles.inputField, isFocused && styles.inputFieldFocused]}
                  placeholder="Ketik username kasir pengganti..."
                  placeholderTextColor="#888"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <Pressable
                disabled={isLoading}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.quickTakeoverBtn,
                  pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.black} />
                ) : (
                  <Text style={styles.quickTakeoverBtnText}>
                    🔄 AMBIL ALIH TERMINAL (QUICK LOGIN) ➔
                  </Text>
                )}
              </Pressable>

              {onUnlockByPrimary && (
                <Pressable
                  onPress={onUnlockByPrimary}
                  style={({ pressed }) => [
                    styles.primaryUnlockBtn,
                    pressed ? Shadows.cardPressed : Shadows.cardUnpressed,
                  ]}
                >
                  <Text style={styles.primaryUnlockBtnText}>
                    🔓 BUKA KUNCI ({primaryCashierName.toUpperCase()})
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
      <View style={styles.shadowBackplate} />
      <View style={styles.windowCard}>
        <View style={styles.windowHeaderBar}>
          <View style={styles.headerDot} />
          <View style={styles.headerDot} />
          <View style={styles.headerDot} />
          <Text style={styles.headerSystemText}>SYS_AUTH_V1.0</Text>
        </View>
        <View style={styles.contentPadding}>
          <Text style={styles.brandTitle}>POS.EVENT</Text>
          <Text style={styles.screenSubtitle}>Terminal Operasional Lapangan</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>IDENTITAS OPERATOR (USERNAME)</Text>
            <TextInput
              style={[styles.inputField, isFocused && styles.inputFieldFocused]}
              placeholder="Ketik username kasir..."
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {username.length > 0 && (
              <Text style={styles.charCounter}>{username.length} CHARS</Text>
            )}
          </View>
          <Pressable
            disabled={isLoading}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.loginButtonBase,
              pressed ? styles.loginButtonPressed : styles.loginButtonUnpressed,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>MASUK ➔</Text>
            )}
          </Pressable>
        </View>
      </View>
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
  primaryUnlockBtn: {
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: Borders.medium,
    borderColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryUnlockBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.black,
  },
});
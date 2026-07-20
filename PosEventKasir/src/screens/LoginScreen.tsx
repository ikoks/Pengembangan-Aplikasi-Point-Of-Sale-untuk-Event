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
} from 'react-native';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('💥 SYSTEM ERROR', 'Username kasir wajib diisi untuk inisialisasi terminal!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://api.vocationalevent.local/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      console.log('Status HTTP Server:', response.status);

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(username.trim());
      }, 1200);

    } catch (error) {
      setIsLoading(false);
      console.error('Koneksi staging gagal, beralih ke luring:', error);
      
      Alert.alert('⚠️ TERMINAL OFFLINE', `Koneksi lokal aktif. Selamat bertugas, ${username}!`);
      onLoginSuccess(username.trim());
    }
  };

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
              style={[
                styles.inputField,
                isFocused && styles.inputFieldFocused
              ]}
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
              pressed ? styles.loginButtonPressed : styles.loginButtonUnpressed
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>MASUK SYSTEM ➔</Text>
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
    backgroundColor: '#FFF',
    justifyContent: 'center',
    padding: 20,
  },
  shadowBackplate: {
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    height: 380,
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: '#000',
    transform: [{ translateX: 8 }, { translateY: 8 }],
  },
  windowCard: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
  },
  windowHeaderBar: {
    height: 32,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  headerSystemText: {
    color: '#FFF',
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
    color: '#000',
    letterSpacing: -1.5,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textTransform: 'uppercase',
    marginBottom: 36,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputField: {
    height: 56,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    backgroundColor: '#FFF',
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
    color: '#000',
    backgroundColor: '#FFF',
    paddingHorizontal: 4,
  },
  loginButtonBase: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
  },
  loginButtonUnpressed: {
    backgroundColor: '#000',
    transform: [{ translateX: -4 }, { translateY: -4 }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  loginButtonPressed: {
    backgroundColor: '#222',
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  NativeModules,
  PermissionsAndroid,
  Animated,
} from 'react-native';
import { Colors, Borders, Shadows } from '../theme/neoBrutalism';

export interface SetupTerminalScreenProps {
  activeUser?: string;
  activeCabang?: string;
  onNavigateToPos?: (cabangName?: string) => void;
  onTakeBreak?: () => void;
  onEndShift?: () => void;
  onOpenSalesHistory?: () => void;
  onOpenKanban?: () => void;
}

export default function SetupTerminalScreen({
  activeCabang = '',
  onNavigateToPos,
}: SetupTerminalScreenProps) {
  const [manualQrCode, setManualQrCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenHardwareCamera = async () => {
    setIsProcessing(true);
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Izin Kamera HP POS',
          message: 'Aplikasi Kasir POS membutuhkan izin akses kamera HP untuk memindai QR Code Admin.',
          buttonPositive: 'IZINKAN',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        if (NativeModules.NativeQrScanner && NativeModules.NativeQrScanner.openCameraScanner) {
          const qrResult = await NativeModules.NativeQrScanner.openCameraScanner();
          if (qrResult) {
            if (qrResult.includes('TERVE') || qrResult.includes('CHOCO') || qrResult.includes('JKT')) {
              handleBindDeviceBranch('Terve Chocolate - Jakarta (Pop-Up Event)');
            } else {
              handleBindDeviceBranch("Let's Go Gelato - Bandung (Bengawan)");
            }
            return;
          }
        }
      }
    } catch (err) {
      console.log('Camera execution:', err);
    }
    // Fallback: Bind Gelato branch directly and navigate to LOGIN!
    handleBindDeviceBranch("Let's Go Gelato - Bandung (Bengawan)");
  };

  const handleBindDeviceBranch = async (cabangName: string) => {
    setIsProcessing(true);
    try {
      const { terminalConfigService } = require('../services/terminalConfigService');
      await terminalConfigService.saveTerminalConfig({
        branch: cabangName,
        boundCabangFull: cabangName,
        isConfigured: true,
      });
    } catch (_) {}

    setIsProcessing(false);
    if (onNavigateToPos) {
      onNavigateToPos(cabangName);
    }
  };

  const handleManualScanSubmit = () => {
    const code = manualQrCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('⚠️ QR KODE KOSONG', 'Ketik atau pindai kode QR Admin.');
      return;
    }

    if (code.includes('TERVE') || code.includes('CHOCO') || code.includes('JKT')) {
      handleBindDeviceBranch('Terve Chocolate - Jakarta (Pop-Up Event)');
    } else {
      handleBindDeviceBranch("Let's Go Gelato - Bandung (Bengawan)");
    }
  };

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
              <Text style={styles.headerSystemText}>SYS_ADMIN_QR_SETUP_V1.0</Text>
            </View>

            <View style={styles.contentPadding}>
              <Text style={styles.brandTitle}>POS.EVENT</Text>
              <Text style={styles.screenSubtitle}>KONFIGURASI BINDING QR CABANG (1X ADMIN SETUP)</Text>

              <Text style={styles.instructionText}>
                Silakan pindai / scan QR Code Admin dari Manajemen Event. Konfigurasi ini hanya dilakukan <Text style={{ fontWeight: '900', color: Colors.black }}>1x di awal pemasangan perangkat</Text> untuk menentukan cabang.
              </Text>

              {/* Button Buka Kamera Scanner QR */}
              <Pressable
                disabled={isProcessing}
                onPress={handleOpenHardwareCamera}
                style={({ pressed }) => [
                  styles.openCameraBtn,
                  pressed && { opacity: 0.85 },
                  { marginTop: 12, marginBottom: 18 },
                ]}
              >
                <Text style={styles.openCameraBtnIcon}>📷</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.openCameraBtnTitle}>BUKA KAMERA HP UNTUK SCAN QR ADMIN</Text>
                  <Text style={styles.openCameraBtnSub}>Gunakan kamera HP untuk memindai QR Code Cabang dari Admin</Text>
                </View>
                <Text style={styles.openCameraBtnArrow}>➔</Text>
              </Pressable>

              {/* Input Code or Scanner Field */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>PINDAI / KETIK KODE QR ADMIN:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Scan atau ketik kode QR Admin..."
                    placeholderTextColor="#888888"
                    value={manualQrCode}
                    onChangeText={setManualQrCode}
                    autoCapitalize="characters"
                    editable={!isProcessing}
                  />
                  <Pressable
                    disabled={isProcessing}
                    onPress={handleManualScanSubmit}
                    style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={styles.submitBtnText}>OK</Text>
                  </Pressable>
                </View>
              </View>

              {activeCabang ? (
                <Pressable onPress={() => onNavigateToPos && onNavigateToPos()} style={styles.skipLink}>
                  <Text style={styles.skipLinkText}>← Kembali ke Layar Login Kasir ({activeCabang.toUpperCase()})</Text>
                </Pressable>
              ) : null}
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
  cardWrapper: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  shadowBackplate: {
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.black,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    transform: [{ translateX: 8 }, { translateY: 8 }],
  },
  windowCard: {
    backgroundColor: Colors.white,
    borderWidth: Borders.thick,
    borderColor: Colors.black,
    width: '100%',
  },
  windowHeaderBar: {
    height: 36,
    backgroundColor: Colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    color: Colors.yellow,
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 'auto',
    letterSpacing: 1,
  },
  contentPadding: {
    padding: 22,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.black,
    letterSpacing: -1,
  },
  screenSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.black,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  instructionText: {
    fontSize: 12,
    color: '#444444',
    lineHeight: 18,
    marginBottom: 16,
  },
  cameraBox: {
    height: 140,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 18,
    overflow: 'hidden',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  cameraText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.yellow,
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  laserLine: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#FF3333',
  },
  cornerBracket: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: Colors.yellow,
  },
  topLeft: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3 },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.black,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputField: {
    flex: 1,
    height: 46,
    borderWidth: 2,
    borderColor: Colors.black,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.black,
  },
  submitBtn: {
    width: 60,
    height: 46,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  simTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#777777',
    textAlign: 'center',
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  simButtonsRow: {
    gap: 10,
    marginBottom: 10,
  },
  simBtnGelato: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  simBtnTerve: {
    backgroundColor: '#4E2A1E',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  simBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  skipLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  skipLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.black,
    textDecorationLine: 'underline',
  },
  openCameraBtn: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
  },
  openCameraBtnIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  openCameraBtnTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  openCameraBtnSub: {
    color: '#FFDD00',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  openCameraBtnArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
  cameraModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
  },
  fullScreenScannerContainer: {
    flex: 1,
    backgroundColor: '#0F1115',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  scannerTopControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 100,
  },
  scannerCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCircleBtnActive: {
    backgroundColor: '#FFDD00',
    borderColor: '#FFFFFF',
  },
  scannerBtnIconText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  scannerHeaderTitleBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scannerHeaderTitleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scannerViewportWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scannerBoxViewfinder: {
    width: 270,
    height: 270,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scannerCornerBracket: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FFDD00',
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 18,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 18,
  },
  scannerLaserLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: '#00FF66',
  },
  scannerInsideFrameIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  scannerInsideFrameText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scannerInstructionSubText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 28,
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});

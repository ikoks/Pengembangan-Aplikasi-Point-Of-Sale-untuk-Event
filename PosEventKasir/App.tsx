import React, { useState, useEffect } from 'react';
import { StatusBar, SafeAreaView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import OpeningShiftScreen from './src/screens/OpeningShiftScreen';
import BranchSetupScreen from './src/screens/BranchSetupScreen';
import PosMainScreen from './src/screens/PosMainScreen';
import ClosingShiftScreen from './src/screens/ClosingShiftScreen';
import { BluetoothPrinterModal } from './src/components/BluetoothPrinterModal';
import { getDBConnection, createTables } from './src/database/sqlite';
import { syncManager } from './src/services/syncManager';
import { bluetoothPrinterService, BluetoothDevice } from './src/services/bluetoothService';
import { restoreSession, clearSession, KasirSession } from './src/services/authService';

type AppState = 'LOGIN' | 'OPENING_SHIFT' | 'POS_MAIN' | 'ON_BREAK' | 'CLOSING_SHIFT' | 'SETUP_TERMINAL';

export default function App() {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [currentScreen, setCurrentScreen] = useState<AppState>('LOGIN');
  const [activeUser, setActiveUser] = useState<string>('');
  const [activeCabang, setActiveCabang] = useState<string>('');
  const [salesMode, setSalesMode] = useState<string>('');

  const [shiftOwnerUser, setShiftOwnerUser] = useState<string>('');
  const [shiftId, setShiftId] = useState<string>('');

  // Data dari backend session setelah login
  const [kasirSession, setKasirSession] = useState<KasirSession | null>(null);

  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [btDevices, setBtDevices] = useState<BluetoothDevice[]>([]);
  const [isScanningBt, setIsScanningBt] = useState(false);
  const [connectedBtDevice, setConnectedBtDevice] = useState<BluetoothDevice | null>(null);

  useEffect(() => {
    syncManager.start();
    const initApp = async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);

        // ─── Restore sesi kasir dari AsyncStorage jika ada ───────────────
        const existingSession = await restoreSession();
        if (existingSession) {
          setKasirSession(existingSession);
          try {
            const { setAccessToken, setActiveContext } = require('./src/services/api/apiClient');
            setAccessToken(existingSession.token);
            setActiveContext({
              branchId: existingSession.id_cabang,
              branchName: existingSession.nama_cabang,
            });
          } catch (_) {}
          console.log('[App] Sesi kasir dipulihkan:', existingSession.username);
        }

        const { terminalConfigService } = require('./src/services/terminalConfigService');
        const config = await terminalConfigService.loadTerminalConfig();

        if (config) {
          if (config.apiBaseUrl) {
            const { setApiBaseUrl } = require('./src/services/api/apiClient');
            setApiBaseUrl(config.apiBaseUrl);
          }
          if (config.branch) {
            setActiveCabang(config.branch);
          }
        }

        // Langsung arahkan ke LOGIN tanpa scan QR di awal
        setCurrentScreen('LOGIN');

        try {
          const { cleanupSyncedQueue } = require('./src/database/offlineQueueManager');
          await cleanupSyncedQueue(30);
        } catch (_) {}
      } catch (err) {
        console.error('❌ [App] Failed to initialize App database/syncManager:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();

    return () => {
      syncManager.stop();
    };
  }, []);

  const handleScanBt = async () => {
    setIsScanningBt(true);
    const found = await bluetoothPrinterService.scanDevices();
    setBtDevices(found);
    setIsScanningBt(false);
  };

  const handleConnectBt = async (device: BluetoothDevice) => {
    const success = await bluetoothPrinterService.connectDevice(device);
    if (success) {
      setConnectedBtDevice(device);
      setIsPrinterModalOpen(false);
    }
  };

  const handleDisconnectBt = async () => {
    await bluetoothPrinterService.disconnect();
    setConnectedBtDevice(null);
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#111827" />
        <ActivityIndicator size="large" color="#FFDD00" />
        <Text style={{ color: '#FFFFFF', fontWeight: '900', marginTop: 16, fontSize: 16, letterSpacing: 0.5 }}>
          ⚡ MEMUAT POS EVENT...
        </Text>
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LOGIN':
        return (
          <LoginScreen
            activeCabang={activeCabang || 'Cabang Utama'}
            onLoginSuccess={(username, token, session) => {
              setActiveUser(username);
              // Simpan session dari backend (berisi id_cabang, id_sales, dll)
              if (session) {
                setKasirSession(session);
                // Jika backend memberi nama_cabang, update activeCabang dan persist ke SQLite
                if (session.nama_cabang) {
                  setActiveCabang(session.nama_cabang);
                  try {
                    const { terminalConfigService } = require('./src/services/terminalConfigService');
                    terminalConfigService.saveTerminalConfig({
                      branch: session.nama_cabang,
                      boundCabangFull: session.nama_cabang,
                      isConfigured: true,
                    });
                  } catch (_) {}
                }
              }
              setCurrentScreen('OPENING_SHIFT');
            }}
          />
        );

      case 'OPENING_SHIFT':
        return (
          <OpeningShiftScreen
            activeUser={activeUser}
            activeCabang={activeCabang}
            idCabang={kasirSession?.id_cabang ?? undefined}
            idSales={kasirSession ? 'd1e2f3a4-0004-0004-0004-000000000004' /* UUID Dine In */ : undefined}
            onShiftOpened={(cabang, mode, idShift) => {
              if (cabang) setActiveCabang(cabang);
              if (mode) setSalesMode(mode);
              setShiftOwnerUser(activeUser);
              // Gunakan id_shift dari backend jika ada, fallback ke lokal
              setShiftId(idShift ?? `SHIFT-${Date.now().toString().slice(-6)}`);
              setCurrentScreen('POS_MAIN');
            }}
          />
        );

      case 'SETUP_TERMINAL':
        return (
          <BranchSetupScreen
            onSetupComplete={async (boundCabangName) => {
              setActiveCabang(boundCabangName);
              try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem('@last_bound_branch', boundCabangName);
                await AsyncStorage.setItem('device_bound_config', JSON.stringify({ activeCabang: boundCabangName, isBound: true }));
              } catch (_) {}
              setCurrentScreen('LOGIN');
            }}
          />
        );

      case 'POS_MAIN':
        return (
          <>
            <PosMainScreen
              activeCabang={activeCabang}
              activeUser={activeUser}
              salesMode={salesMode}
              onTakeBreak={() => setCurrentScreen('ON_BREAK')}
              onOpenSetupTerminal={() => setCurrentScreen('SETUP_TERMINAL')}
              onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
              onEndShift={() => setCurrentScreen('CLOSING_SHIFT')}
            />
            <BluetoothPrinterModal
              visible={isPrinterModalOpen}
              devices={btDevices}
              isScanning={isScanningBt}
              connectedDevice={connectedBtDevice}
              onScan={handleScanBt}
              onConnect={handleConnectBt}
              onDisconnect={handleDisconnectBt}
              onClose={() => setIsPrinterModalOpen(false)}
            />
          </>
        );

      case 'CLOSING_SHIFT':
        return (
          <ClosingShiftScreen
            activeUser={activeUser}
            activeCabang={activeCabang}
            salesMode={salesMode}
            shiftId={shiftId || 'SHIFT-2026-001'}
            onCancelClosing={() => setCurrentScreen('POS_MAIN')}
            onClosingSuccess={async () => {
              // Bersihkan sesi setelah shift ditutup
              await clearSession();
              setKasirSession(null);
              setActiveUser('');
              // Preserve activeCabang so terminal stays bound to configured branch
              setSalesMode('');
              setShiftOwnerUser('');
              setShiftId('');
              setCurrentScreen('LOGIN');
            }}
          />
        );

      case 'ON_BREAK':
        return (
          <LoginScreen
            isQuickLogin
            primaryCashierName={shiftOwnerUser || activeUser}
            activeCabang={activeCabang}
            salesMode={salesMode}
            shiftId={shiftId || 'SHIFT-2026-001'}
            onUnlockByPrimary={() => {
              setActiveUser(shiftOwnerUser || activeUser);
              setCurrentScreen('POS_MAIN');
            }}
            onQuickLoginSuccess={(replacementUser) => {
              setActiveUser(replacementUser);
              setCurrentScreen('POS_MAIN');
            }}
          />
        );

      default:
        return (
          <LoginScreen
            activeCabang={activeCabang}
            onLoginSuccess={(username) => {
              setActiveUser(username);
              setCurrentScreen('OPENING_SHIFT');
            }}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});
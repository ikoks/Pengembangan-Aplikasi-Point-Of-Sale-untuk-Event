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
<<<<<<< HEAD
import { extractCleanBranchName } from './src/utils/branchHelper';
=======
import { restoreSession, clearSession, KasirSession } from './src/services/authService';
>>>>>>> 8a424618cc65922c5c153d9704981737069be4db

type AppState = 'LOGIN' | 'OPENING_SHIFT' | 'POS_MAIN' | 'ON_BREAK' | 'CLOSING_SHIFT' | 'SETUP_TERMINAL';

export default function App() {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [currentScreen, setCurrentScreen] = useState<AppState>('SETUP_TERMINAL');
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

<<<<<<< HEAD
        const { terminalConfigService } = require('./src/services/terminalConfigService');
        const config = await terminalConfigService.loadTerminalConfig();
=======
        // ─── Restore sesi kasir dari AsyncStorage jika ada ───────────────
        const existingSession = await restoreSession();
        if (existingSession) {
          setKasirSession(existingSession);
          console.log('[App] Sesi kasir dipulihkan:', existingSession.username);
        }

        const terminalConfigRaw = await AsyncStorage.getItem('@terminal_branch_config');
        const boundConfigRaw = await AsyncStorage.getItem('device_bound_config');
>>>>>>> 8a424618cc65922c5c153d9704981737069be4db

        if (config && config.isConfigured && config.branch) {
          if (config.apiBaseUrl) {
            const { setApiBaseUrl } = require('./src/services/api/apiClient');
            setApiBaseUrl(config.apiBaseUrl);
          }
          console.log('✅ [App] Terminal configured. Auto-Bypass to LOGIN. Active Branch:', config.branch);
          setActiveCabang(config.branch);
          setCurrentScreen('LOGIN');
        } else {
          console.log('⚠️ [App] Terminal NOT configured. Launching SetupTerminalScreen.');
          setActiveCabang('');
          setCurrentScreen('SETUP_TERMINAL');
        }

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
<<<<<<< HEAD
            activeCabang={activeCabang || 'Cabang Utama Admin'}
            onLoginSuccess={(username) => {
=======
            activeCabang={activeCabang || "Let's Go Gelato - Bandung (Bengawan)"}
            onLoginSuccess={(username, token, session) => {
>>>>>>> 8a424618cc65922c5c153d9704981737069be4db
              setActiveUser(username);
              // Simpan session dari backend (berisi id_cabang, id_sales, dll)
              if (session) {
                setKasirSession(session);
                // Jika backend memberi nama_cabang, update activeCabang
                if (session.nama_cabang) {
                  setActiveCabang(session.nama_cabang);
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
<<<<<<< HEAD
            onShiftOpened={(cabang, mode) => {
              const newShiftId = `SHIFT-${Date.now().toString().slice(-6)}`;
              if (cabang) setActiveCabang(extractCleanBranchName(cabang));
              if (mode) setSalesMode(mode);

=======
            idCabang={kasirSession?.id_cabang ?? undefined}
            idSales={kasirSession ? 'd1e2f3a4-0001-0001-0001-000000000001' /* UUID Offline */ : undefined}
            onShiftOpened={(cabang, mode, idShift) => {
              if (cabang) setActiveCabang(cabang);
              if (mode) setSalesMode(mode);
>>>>>>> 8a424618cc65922c5c153d9704981737069be4db
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
              const cleanBranch = extractCleanBranchName(boundCabangName);
              setActiveCabang(cleanBranch);
              try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem('@last_bound_branch', cleanBranch);
                await AsyncStorage.setItem('device_bound_config', JSON.stringify({ activeCabang: cleanBranch, isBound: true }));
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
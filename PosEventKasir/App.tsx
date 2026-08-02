import React, { useState, useEffect } from 'react';
import { StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import OpeningShiftScreen from './src/screens/OpeningShiftScreen';
import SetupTerminalScreen from './src/screens/SetupTerminalScreen';
import PosMainScreen from './src/screens/PosMainScreen';
import ClosingShiftScreen from './src/screens/ClosingShiftScreen';
import { BluetoothPrinterModal } from './src/components/BluetoothPrinterModal';
import { getDBConnection, createTables } from './src/database/sqlite';
import { syncManager } from './src/services/syncManager';
import { bluetoothPrinterService, BluetoothDevice } from './src/services/bluetoothService';

type AppState = 'LOGIN' | 'OPENING_SHIFT' | 'POS_MAIN' | 'ON_BREAK' | 'CLOSING_SHIFT' | 'SETUP_TERMINAL';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppState>('LOGIN');
  const [activeUser, setActiveUser] = useState<string>('');
  const [activeCabang, setActiveCabang] = useState<string>('');
  const [salesMode, setSalesMode] = useState<string>('');

  
  const [shiftOwnerUser, setShiftOwnerUser] = useState<string>('');
  const [shiftId, setShiftId] = useState<string>('');

  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [btDevices, setBtDevices] = useState<BluetoothDevice[]>([]);
  const [isScanningBt, setIsScanningBt] = useState(false);
  const [connectedBtDevice, setConnectedBtDevice] = useState<BluetoothDevice | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const savedUrl = await AsyncStorage.getItem('api_base_url');
          if (savedUrl) {
            const { setApiBaseUrl } = require('./src/services/api/apiClient');
            setApiBaseUrl(savedUrl);
          }
        } catch (_) {}

        const db = await getDBConnection();
        await createTables(db);
        console.log('✅ [App] SQLite database initialized');
        await syncManager.start();
        console.log('✅ [App] SyncManager background worker started');

        try {
          const { cleanupSyncedQueue } = require('./src/database/offlineQueueManager');
          await cleanupSyncedQueue(30);
        } catch (_) {}
      } catch (err) {
        console.error('❌ [App] Failed to initialize App database/syncManager:', err);
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

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LOGIN':
        return (
          <LoginScreen
            onLoginSuccess={(username) => {
              setActiveUser(username);
              setCurrentScreen('OPENING_SHIFT');
            }}
          />
        );

      case 'OPENING_SHIFT':
        return (
          <OpeningShiftScreen
            activeUser={activeUser}
            onShiftOpened={(cabang, mode) => {
              const newShiftId = `SHIFT-${Date.now().toString().slice(-6)}`;
              setActiveCabang(cabang);
              setSalesMode(mode);
              
              setShiftOwnerUser(activeUser);
              setShiftId(newShiftId);
              setCurrentScreen('POS_MAIN');
            }}
          />
        );

      case 'SETUP_TERMINAL':
        return (
          <SetupTerminalScreen
            activeUser={activeUser || 'ANDI SURYADI'}
            onNavigateToPos={() => setCurrentScreen('POS_MAIN')}
            onTakeBreak={() => setCurrentScreen('ON_BREAK')}
            onEndShift={() => setCurrentScreen('CLOSING_SHIFT')}
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
            onClosingSuccess={() => {
              setActiveUser('');
              setActiveCabang('');
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
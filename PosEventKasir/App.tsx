import React, { useState, useEffect } from 'react';
import { StatusBar, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import OpeningShiftScreen from './src/screens/OpeningShiftScreen';
import PosMainScreen from './src/screens/PosMainScreen';
import { getDBConnection, createTables } from './src/database/sqlite';
import { syncManager } from './src/services/syncManager';

type AppState = 'LOGIN' | 'OPENING_SHIFT' | 'POS_MAIN' | 'ON_BREAK' | 'CLOSING_SHIFT';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppState>('LOGIN');
  const [activeUser, setActiveUser] = useState<string>('');
  const [activeCabang, setActiveCabang] = useState<string>('');
  const [salesMode, setSalesMode] = useState<string>('');

  // === [UPDATE POS-B-10] === Inisialisasi Database SQLite & SyncManager Background Worker
  useEffect(() => {
    const initApp = async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
        console.log('✅ [App] SQLite database initialized');
        await syncManager.start();
        console.log('✅ [App] SyncManager background worker started');
      } catch (err) {
        console.error('❌ [App] Failed to initialize App database/syncManager:', err);
      }
    };
    initApp();

    return () => {
      syncManager.stop();
    };
  }, []);

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
              setActiveCabang(cabang);
              setSalesMode(mode);
              setCurrentScreen('POS_MAIN');
            }}
          />
        );

      case 'POS_MAIN':
        return (
          <PosMainScreen
            activeCabang={activeCabang}
            activeUser={activeUser}
            salesMode={salesMode}
            onEndShift={() => setCurrentScreen('LOGIN')}
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    borderWidth: 3,
    borderColor: '#000',
    padding: 16,
    textTransform: 'uppercase',
  },
  placeholderSubtext: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginTop: 12,
  },
});
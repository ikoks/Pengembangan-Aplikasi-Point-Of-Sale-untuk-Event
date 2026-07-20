import React, { useState } from 'react';
import { StatusBar, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import OpeningShiftScreen from './src/screens/OpeningShiftScreen';

type AppState = 'LOGIN' | 'OPENING_SHIFT' | 'POS_MAIN' | 'ON_BREAK' | 'CLOSING_SHIFT';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppState>('LOGIN');
  const [activeUser, setActiveUser] = useState<string>('');
  const [activeCabang, setActiveCabang] = useState<string>('');
  const [salesMode, setSalesMode] = useState<string>('');

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
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>POS MAIN SCREEN</Text>
            <Text style={styles.placeholderSubtext}>
              Kasir: {activeUser} | Cabang: {activeCabang} | Mode: {salesMode}
            </Text>
          </View>
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
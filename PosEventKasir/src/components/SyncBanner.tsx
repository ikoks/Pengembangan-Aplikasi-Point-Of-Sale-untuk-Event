import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity, Alert } from 'react-native';
import { syncManager, SyncWorkerState } from '../services/syncManager';

interface SyncBannerProps {
  syncState: SyncWorkerState;
}

export const SyncBanner = ({ syncState }: SyncBannerProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (syncState.status === 'SYNCING' || syncState.pendingCount > 0 || syncState.status === 'ERROR') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 650, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => { if (loop) loop.stop(); };
  }, [syncState.status, syncState.pendingCount, pulseAnim]);

  const handleSyncBannerPress = useCallback(() => {
    if (syncState.status === 'SYNCING') {
      Alert.alert('🔄 SEDANG SYNC', 'Proses sinkronisasi sedang berjalan. Harap tunggu...');
      return;
    }
    if (!syncState.isOnline) {
      Alert.alert(
        '⚡ PERANGKAT OFFLINE',
        `Tidak ada koneksi internet.\n${syncState.pendingCount > 0 ? `${syncState.pendingCount} data menunggu di antrean lokal dan akan otomatis di-sync saat online kembali.` : 'Semua transaksi dicatat di SQLite lokal.'}`,
        [{ text: 'MENGERTI' }]
      );
      return;
    }
    if (syncState.lastError) {
      Alert.alert(
        '❌ SYNC GAGAL',
        `Error terakhir: ${syncState.lastError}\n\nTap OK untuk mencoba sync ulang.`,
        [
          { text: 'BATAL', style: 'cancel' },
          { text: 'COBA LAGI', onPress: () => syncManager.triggerManualSync() },
        ]
      );
      return;
    }
    syncManager.triggerManualSync();
  }, [syncState]);

  const getSyncBannerConfig = () => {
    if (syncState.status === 'SYNCING') {
      return { bg: '#00B0FF', icon: '🔄', label: 'SEDANG SYNC DATA...', sub: null, isPulse: true };
    }
    if (!syncState.isOnline) {
      return {
        bg: '#FF6D00',
        icon: '⚡',
        label: 'PERANGKAT OFFLINE',
        sub: syncState.pendingCount > 0 ? `${syncState.pendingCount} data menunggu sync` : 'Semua data tersimpan lokal',
        isPulse: syncState.pendingCount > 0,
      };
    }
    if (syncState.status === 'ERROR') {
      return {
        bg: '#D50000',
        icon: '❌',
        label: 'SYNC GAGAL — TAP UNTUK COBA LAGI',
        sub: syncState.lastError ? syncState.lastError.slice(0, 60) : null,
        isPulse: true,
      };
    }
    if (syncState.pendingCount > 0) {
      return {
        bg: '#F9A825',
        icon: '🕐',
        label: `${syncState.pendingCount} DATA MENUNGGU SYNC`,
        sub: 'Tap untuk sync sekarang',
        isPulse: true,
      };
    }
    return {
      bg: '#1B5E20',
      icon: '✅',
      label: 'SEMUA DATA TERSINKRONISASI',
      sub: syncState.lastSyncAt ? `Terakhir: ${new Date(syncState.lastSyncAt).toLocaleTimeString('id-ID')}` : 'Online & siap',
      isPulse: false,
    };
  };

  const bannerConfig = getSyncBannerConfig();

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handleSyncBannerPress}
      style={[styles.syncBannerStrip, { backgroundColor: bannerConfig.bg }]}
    >
      <Animated.View style={[
        styles.syncBannerPulseRing,
        { opacity: bannerConfig.isPulse ? pulseAnim : 0, borderColor: '#FFFFFF' },
      ]} />
      <Text style={styles.syncBannerIcon}>{bannerConfig.icon}</Text>
      <View style={styles.syncBannerTextGroup}>
        <Text style={styles.syncBannerLabel} numberOfLines={1}>
          {bannerConfig.label}
        </Text>
        {bannerConfig.sub && (
          <Text style={styles.syncBannerSub} numberOfLines={1}>
            {bannerConfig.sub}
          </Text>
        )}
      </View>
      {syncState.pendingCount > 0 && (
        <View style={styles.syncQueueBadge}>
          <Text style={styles.syncQueueBadgeText}>{syncState.pendingCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  syncBannerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 38,
  },
  syncBannerPulseRing: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    zIndex: 0,
  },
  syncBannerIcon: {
    fontSize: 14,
    marginRight: 8,
    zIndex: 1,
  },
  syncBannerTextGroup: {
    flex: 1,
    zIndex: 1,
  },
  syncBannerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  syncBannerSub: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  syncQueueBadge: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  syncQueueBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});

import { getApiBaseUrl } from '../services/api/apiClient';

/**
 * Memeriksa konektivitas jaringan untuk POS Event.
 * Mengutamakan ketersediaan server backend lokal (LAN/Wi-Fi) tanpa bergantung pada internet publik.
 */
export async function checkRealInternetConnection(): Promise<boolean> {
  // Test 1: Backend API health check (prioritas tertinggi untuk jaringan lokal / offline event)
  try {
    const { buildFullUrl } = require('../services/api/apiClient');
    const healthUrl = buildFullUrl('/api/v1/health');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status > 0) return true;
  } catch (_) {}

  // Test 2: Status Jaringan Perangkat via NetInfo (Wi-Fi lokal / Hotspot / LAN)
  try {
    const NetInfo = require('@react-native-community/netinfo').default;
    if (NetInfo && typeof NetInfo.fetch === 'function') {
      const state = await NetInfo.fetch();
      if (state && (state.isConnected || state.isInternetReachable)) {
        return true;
      }
    }
  } catch (_) {}

  // Test 3: Fallback cek publik (jika ada internet eksternal)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch('https://www.google.com/favicon.ico', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status > 0) return true;
  } catch (_) {}

  return false;
}

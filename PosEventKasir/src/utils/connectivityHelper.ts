import { getApiBaseUrl } from '../services/api/apiClient';

export async function checkRealInternetConnection(): Promise<boolean> {
  // Test 1: Google favicon GET
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://www.google.com/favicon.ico', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status > 0) return true;
  } catch (_) {}

  // Test 2: Cloudflare web check
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://www.cloudflare.com', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status > 0) return true;
  } catch (_) {}

  // Test 3: Backend API check
  try {
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
    const healthUrl = baseUrl.endsWith('/api/v1') ? `${baseUrl}/health` : `${baseUrl}/api/v1/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'ngrok-skip-browser-warning': 'true', Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status > 0) return true;
  } catch (_) {}

  // Test 4: Android System ConnectivityManager via NetInfo
  try {
    const NetInfo = require('@react-native-community/netinfo').default;
    if (NetInfo && typeof NetInfo.fetch === 'function') {
      const state = await NetInfo.fetch();
      if (state && (state.isConnected || state.isInternetReachable)) {
        return true;
      }
    }
  } catch (_) {}

  return false;
}

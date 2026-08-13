/**
 * authService.ts
 * Layanan autentikasi kasir ke backend API.
 * Endpoint: POST /api/v1/auth/login/kasir
 *
 * Flow:
 *  1. Kirim username + pin ke backend
 *  2. Terima Bearer Token + data kasir (id_kasir, id_cabang, nama_cabang, dll)
 *  3. Simpan token ke apiClient via setAccessToken()
 *  4. Simpan data sesi ke AsyncStorage untuk persistensi
 */

import apiClient, { setAccessToken, clearApiContext } from './api/apiClient';

const STORAGE_KEY_SESSION = '@kasir_session';

export interface KasirSession {
  token: string;
  id_kasir: string;
  username: string;
  nama_kasir: string;
  role: string;
  id_cabang: string | null;
  nama_cabang: string | null;
}

export interface LoginResult {
  success: boolean;
  session?: KasirSession;
  message?: string;
}

/**
 * Login kasir ke backend API.
 * Jika berhasil, menyimpan token ke apiClient dan AsyncStorage.
 */
export async function loginKasir(username: string, pin: string): Promise<LoginResult> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        token: string;
        token_type: string;
        user: {
          id_kasir: string;
          username: string;
          nama_kasir: string;
          role: string;
          id_cabang: string | null;
          nama_cabang: string | null;
        };
      };
    }>('/api/v1/auth/login/kasir', { username, pin });

    const { token, user } = response.data.data;

    // Simpan token ke in-memory apiClient state
    setAccessToken(token);

    const session: KasirSession = {
      token,
      id_kasir: user.id_kasir,
      username: user.username,
      nama_kasir: user.nama_kasir,
      role: user.role,
      id_cabang: user.id_cabang,
      nama_cabang: user.nama_cabang,
    };

    // Persistensi sesi ke AsyncStorage agar tidak logout saat app di-restart
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    } catch (storageErr) {
      console.warn('[authService] Gagal simpan sesi ke AsyncStorage:', storageErr);
    }

    return { success: true, session };
  } catch (error: any) {
    const message =
      error?.payload?.message ||
      error?.message ||
      'Username atau PIN tidak valid.';
    console.warn('[authService] loginKasir gagal:', message);
    return { success: false, message };
  }
}

/**
 * Memuat sesi dari AsyncStorage saat app restart.
 * Jika ada sesi valid, restore token ke apiClient.
 */
export async function restoreSession(): Promise<KasirSession | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;

    const session: KasirSession = JSON.parse(raw);
    if (session?.token) {
      setAccessToken(session.token);
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Logout lokal: bersihkan token dari apiClient + AsyncStorage.
 * Backend token revoke dilakukan oleh closeShift (POST /api/v1/shift/close).
 */
export async function clearSession(): Promise<void> {
  clearApiContext();
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
  } catch {
    // silent
  }
}

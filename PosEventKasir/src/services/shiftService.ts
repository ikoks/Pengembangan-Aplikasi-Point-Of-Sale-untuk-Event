/**
 * shiftService.ts
 * Layanan untuk mengelola siklus hidup shift kasir ke backend API.
 * Endpoint: POST /api/v1/shift/open | /close | /break | /resume
 */

import apiClient from './api/apiClient';

export interface OpenShiftPayload {
  id_cabang: string;
  id_sales: string;
  modal_awal: number;
}

export interface CloseShiftPayload {
  uang_fisik_akhir: number;
}

export interface ShiftSessionData {
  id_shift: string;
  status_shift: 'OPEN' | 'ON_BREAK' | 'CLOSED';
  waktu_mulai: string;
  modal_awal: number;
  id_cabang: string;
  id_sales: string;
}

/**
 * Membuka shift baru di backend.
 * Memerlukan Bearer Token yang sudah di-set via setAccessToken().
 */
export async function openShift(payload: OpenShiftPayload): Promise<{ success: boolean; id_shift?: string; message?: string }> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: ShiftSessionData;
    }>('/api/v1/shift/open', payload);

    return {
      success: true,
      id_shift: response.data?.data?.id_shift,
      message: response.data?.message,
    };
  } catch (error: any) {
    console.error('[shiftService] openShift error:', error?.message ?? error);
    return {
      success: false,
      message: error?.message ?? 'Gagal membuka shift ke backend.',
    };
  }
}

/**
 * Menutup shift aktif di backend.
 * Memerlukan Bearer Token yang sudah di-set via setAccessToken().
 * Backend akan me-revoke token → kasir otomatis logout.
 */
export async function closeShift(payload: CloseShiftPayload): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>('/api/v1/shift/close', payload);

    return {
      success: true,
      message: response.data?.message,
    };
  } catch (error: any) {
    console.error('[shiftService] closeShift error:', error?.message ?? error);
    return {
      success: false,
      message: error?.message ?? 'Gagal menutup shift ke backend.',
    };
  }
}

/**
 * Menjeda shift aktif (OPEN → ON_BREAK).
 */
export async function breakShift(catatan?: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/api/v1/shift/break',
      catatan ? { catatan } : {}
    );
    return { success: true, message: response.data?.message };
  } catch (error: any) {
    console.error('[shiftService] breakShift error:', error?.message ?? error);
    return { success: false, message: error?.message ?? 'Gagal menjeda shift.' };
  }
}

/**
 * Melanjutkan shift dari ON_BREAK → OPEN.
 */
export async function resumeShift(catatan?: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/api/v1/shift/resume',
      catatan ? { catatan } : {}
    );
    return { success: true, message: response.data?.message };
  } catch (error: any) {
    console.error('[shiftService] resumeShift error:', error?.message ?? error);
    return { success: false, message: error?.message ?? 'Gagal melanjutkan shift.' };
  }
}

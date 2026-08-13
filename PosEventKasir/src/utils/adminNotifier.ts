import { getApiBaseUrl, getApiContextSnapshot } from '../services/api/apiClient';
import { getDBConnection } from '../database/sqlite';

export interface ShiftOpenNotifyPayload {
  username: string;
  branch: string;
  modalAwal?: number;
  salesMode?: string;
  pin?: string;
}

export async function notifyAdminShiftOpen(payload: ShiftOpenNotifyPayload): Promise<boolean> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const cashierName = payload.username.trim() || 'Kasir';
  const branchName = payload.branch.trim() || 'Bengawan (Bandung)';
  const nowIso = new Date().toISOString();
  const ctx = getApiContextSnapshot();
  const token = ctx.accessToken;

  // Default UUIDs for Cabang & Sales Mode from Laravel Seeders
  const DEFAULT_CABANG_ID = 'b1c2d3e4-0001-0001-0001-000000000001';
  const DEFAULT_SALES_ID = 'd1e2f3a4-0001-0001-0001-000000000001';

  const fullBody = {
    id_cabang: ctx.branchId || DEFAULT_CABANG_ID,
    id_sales: DEFAULT_SALES_ID,
    modal_awal: payload.modalAwal || 100000,
    username: cashierName,
    kasir_id: cashierName,
    id_kasir: cashierName,
    nama_kasir: cashierName,
    operator: cashierName,
    nama_cabang: branchName,
    branch: branchName,
    full_cabang: branchName,
    nama_mode: payload.salesMode || 'Offline',
    status: 'OPEN',
    status_shift: 'OPEN',
    shift_status: 'OPEN',
    status_kasir: 'AKTIF',
    status_aktif: 'AKTIF',
    is_active: 1,
    waktu_mulai: nowIso,
    logged_in_at: nowIso,
    updated_at: nowIso,
  };

  // 1. Sync to local SQLite database shift_sessions table
  try {
    const db = await getDBConnection();
    await db.executeSql(
      `CREATE TABLE IF NOT EXISTS shift_sessions (
        id TEXT PRIMARY KEY,
        store_brand TEXT,
        branch_name TEXT,
        full_cabang TEXT,
        sales_mode TEXT,
        operator TEXT,
        modal_awal REAL,
        status_shift TEXT,
        waktu_mulai TEXT,
        waktu_selesai TEXT
      );`
    );
    await db.executeSql(
      `INSERT OR REPLACE INTO shift_sessions (id, store_brand, branch_name, full_cabang, sales_mode, operator, modal_awal, status_shift, waktu_mulai)
       VALUES ('ACTIVE_SHIFT', 'POS EVENT', ?, ?, ?, ?, ?, 'OPEN', ?);`,
      [branchName, branchName, payload.salesMode || 'Offline', cashierName, payload.modalAwal || 100000, nowIso]
    );
  } catch (dbErr) {
    console.warn('SQLite shift_sessions sync error:', dbErr);
  }

  // 2. Notify Laravel Admin API endpoints
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoints = [
    '/api/v1/shift/open',
    '/api/v1/auth/login/kasir',
    '/api/v1/shift/status',
    '/api/v1/kasir/status',
    '/shift/open',
    '/auth/login/kasir',
    '/shift/status',
    '/kasir/status',
  ];

  let successCount = 0;
  for (const ep of endpoints) {
    try {
      const url = baseUrl.endsWith('/api/v1') && ep.startsWith('/api/v1')
        ? baseUrl + ep.replace('/api/v1', '')
        : baseUrl + ep;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(fullBody),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status >= 200 && res.status < 300) {
        successCount++;
      }
    } catch (_) {}
  }

  return successCount > 0;
}

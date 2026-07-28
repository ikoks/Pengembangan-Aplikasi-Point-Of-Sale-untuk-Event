// =============================================================================
// src/database/offlineQueueManager.ts
// === [UPDATE POS-B-10] === Offline Queue Manager — Enhanced Multi-Tenant
//
// Perubahan dari versi sebelumnya:
//   1. Interface DraftTransactionRecord diperluas dengan kolom multi-tenant
//      (id_cabang, nama_cabang) dan kolom non-cash (reference_number).
//   2. Menambahkan fungsi saveDraftToNewSchema() untuk menyimpan ke tabel
//      transaksi_draft (skema baru POS-B-09) sekaligus draft_transactions (lama).
//   3. Menambahkan fungsi getPendingSyncQueue() untuk sync_queue (POS-B-09).
//   4. Menambahkan fungsi enqueueForSync() untuk menambah item ke sync_queue.
//   5. Semua fungsi lama dipertahankan untuk kompatibilitas mundur (backward compat).
// =============================================================================

import { getDBConnection, generateUUIDv4 } from './sqlite';

// =============================================================================
// INTERFACES & TIPE DATA
// =============================================================================

export interface DraftTransactionItem {
  productId: string;
  name?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface SaveDraftTransactionInput {
  id?: string;
  totalAmount: number;
  paymentType: 'CASH' | 'NON_CASH';
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  referenceNumber?: string;
  // === [UPDATE POS-B-10] === Kolom Multi-Tenant
  idCabang?: string;
  namaCabang?: string;
  salesMode?: string;
  operator?: string;
  items: DraftTransactionItem[];
}

export interface DraftTransactionRecord {
  id: string;
  total_amount: number;
  payment_type: 'CASH' | 'NON_CASH';
  payment_method: string;
  paid_amount: number;
  change_amount: number;
  reference_number?: string;
  // === [UPDATE POS-B-10] === Kolom Multi-Tenant
  id_cabang?: string;
  nama_cabang?: string;
  sales_mode?: string;
  operator?: string;
  items_json: string;
  items?: DraftTransactionItem[];
  sync_status: 'PendingSync' | 'Synced' | 'Failed';
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  id_transaksi: string;
  payload_json: string;
  endpoint: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retry_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// INISIALISASI TABEL
// =============================================================================

export const initDraftTransactionsTable = async (): Promise<void> => {
  try {
    const db = await getDBConnection();
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS draft_transactions (
        id TEXT PRIMARY KEY,
        total_amount REAL NOT NULL,
        payment_type TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        paid_amount REAL NOT NULL,
        change_amount REAL NOT NULL,
        reference_number TEXT,
        items_json TEXT NOT NULL,
        sync_status TEXT DEFAULT 'PendingSync',
        created_at TEXT NOT NULL
      );
    `);
    // === [UPDATE POS-B-10] === Tambahkan kolom multi-tenant jika belum ada
    const alterCols = [
      `ALTER TABLE draft_transactions ADD COLUMN id_cabang TEXT;`,
      `ALTER TABLE draft_transactions ADD COLUMN nama_cabang TEXT;`,
      `ALTER TABLE draft_transactions ADD COLUMN sales_mode TEXT;`,
      `ALTER TABLE draft_transactions ADD COLUMN operator TEXT;`,
    ];
    for (const q of alterCols) {
      try { await db.executeSql(q); } catch { /* kolom sudah ada */ }
    }
    console.log('✅ Tabel draft_transactions berhasil diinisialisasi');
  } catch (error) {
    console.error('❌ Gagal inisialisasi tabel draft_transactions:', error);
    throw error;
  }
};

// =============================================================================
// CRUD FUNGSI DRAFT TRANSACTIONS (TABEL LAMA — BACKWARD COMPAT)
// =============================================================================

export const saveDraftTransaction = async (
  input: SaveDraftTransactionInput,
): Promise<DraftTransactionRecord> => {
  try {
    await initDraftTransactionsTable();
    const db = await getDBConnection();
    const id = input.id || generateUUIDv4();
    const createdAt = new Date().toISOString();
    const itemsJson = JSON.stringify(input.items || []);
    const refNum = input.referenceNumber || '';

    await db.executeSql(
      `INSERT OR REPLACE INTO draft_transactions (
        id, total_amount, payment_type, payment_method, paid_amount,
        change_amount, reference_number, items_json, sync_status, created_at,
        id_cabang, nama_cabang, sales_mode, operator
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PendingSync', ?, ?, ?, ?, ?);`,
      [
        id,
        input.totalAmount,
        input.paymentType,
        input.paymentMethod,
        input.paidAmount,
        input.changeAmount,
        refNum,
        itemsJson,
        createdAt,
        input.idCabang ?? null,
        input.namaCabang ?? null,
        input.salesMode ?? null,
        input.operator ?? null,
      ],
    );

    // === [UPDATE POS-B-10] === Tambahkan juga ke sync_queue untuk SyncManager
    await enqueueForSync(id, {
      id,
      totalAmount: input.totalAmount,
      paymentType: input.paymentType,
      paymentMethod: input.paymentMethod,
      paidAmount: input.paidAmount,
      changeAmount: input.changeAmount,
      referenceNumber: refNum,
      idCabang: input.idCabang,
      namaCabang: input.namaCabang,
      salesMode: input.salesMode,
      operator: input.operator,
      items: input.items,
      createdAt,
    });

    console.log(`✅ Transaksi draft [${id}] berhasil disimpan ke SQLite`);
    return {
      id,
      total_amount: input.totalAmount,
      payment_type: input.paymentType,
      payment_method: input.paymentMethod,
      paid_amount: input.paidAmount,
      change_amount: input.changeAmount,
      reference_number: refNum,
      id_cabang: input.idCabang,
      nama_cabang: input.namaCabang,
      sales_mode: input.salesMode,
      operator: input.operator,
      items_json: itemsJson,
      items: input.items,
      sync_status: 'PendingSync',
      created_at: createdAt,
    };
  } catch (error) {
    console.error('❌ Gagal menyimpan transaksi draft ke SQLite:', error);
    throw error;
  }
};

export const getPendingDraftTransactions = async (): Promise<DraftTransactionRecord[]> => {
  try {
    await initDraftTransactionsTable();
    const db = await getDBConnection();
    const [results] = await db.executeSql(`
      SELECT * FROM draft_transactions
      WHERE sync_status = 'PendingSync'
      ORDER BY created_at ASC;
    `);
    const pendingList: DraftTransactionRecord[] = [];
    const len = results.rows.length;
    for (let i = 0; i < len; i++) {
      const row = results.rows.item(i);
      let parsedItems: DraftTransactionItem[] = [];
      try { parsedItems = JSON.parse(row.items_json); } catch { parsedItems = []; }
      pendingList.push({
        id: row.id,
        total_amount: row.total_amount,
        payment_type: row.payment_type,
        payment_method: row.payment_method,
        paid_amount: row.paid_amount,
        change_amount: row.change_amount,
        reference_number: row.reference_number,
        id_cabang: row.id_cabang,
        nama_cabang: row.nama_cabang,
        sales_mode: row.sales_mode,
        operator: row.operator,
        items_json: row.items_json,
        items: parsedItems,
        sync_status: row.sync_status,
        created_at: row.created_at,
      });
    }
    return pendingList;
  } catch (error) {
    console.error('❌ Gagal mengambil pending draft transactions:', error);
    return [];
  }
};

export const updateDraftSyncStatus = async (
  id: string,
  syncStatus: 'PendingSync' | 'Synced' | 'Failed',
): Promise<void> => {
  try {
    const db = await getDBConnection();
    await db.executeSql(
      `UPDATE draft_transactions SET sync_status = ? WHERE id = ?;`,
      [syncStatus, id],
    );
    console.log(`✅ Status sync draft [${id}] diperbarui menjadi '${syncStatus}'`);
  } catch (error) {
    console.error(`❌ Gagal update status sync draft [${id}]:`, error);
    throw error;
  }
};

export const deleteDraftTransaction = async (id: string): Promise<void> => {
  try {
    const db = await getDBConnection();
    await db.executeSql(`DELETE FROM draft_transactions WHERE id = ?;`, [id]);
    console.log(`✅ Transaksi draft [${id}] dihapus dari SQLite`);
  } catch (error) {
    console.error(`❌ Gagal menghapus transaksi draft [${id}]:`, error);
    throw error;
  }
};

export const clearSyncedDrafts = async (): Promise<void> => {
  try {
    const db = await getDBConnection();
    await db.executeSql(`DELETE FROM draft_transactions WHERE sync_status = 'Synced';`);
    console.log('✅ Semua transaksi draft berstatus Synced telah dibersihkan');
  } catch (error) {
    console.error('❌ Gagal membersihkan synced drafts:', error);
    throw error;
  }
};

// =============================================================================
// === [UPDATE POS-B-10] === FUNGSI SYNC QUEUE (TABEL BARU DARI POS-B-09)
// =============================================================================

/**
 * Menambahkan item transaksi ke tabel sync_queue.
 * Fungsi ini dipanggil setiap kali transaksi disimpan dalam keadaan offline.
 */
export const enqueueForSync = async (
  idTransaksi: string,
  payload: Record<string, unknown>,
  endpoint = '/sync',
): Promise<void> => {
  try {
    const db = await getDBConnection();
    // Pastikan tabel sync_queue tersedia (guard init)
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        id_transaksi TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Idempotent: cek apakah sudah ada di queue sebelum insert
    const [check] = await db.executeSql(
      `SELECT id FROM sync_queue WHERE id_transaksi = ? AND status IN ('PENDING','SYNCING');`,
      [idTransaksi],
    );
    if (check.rows.length > 0) {
      console.log(`ℹ️ [SyncQueue] Transaksi [${idTransaksi}] sudah ada di antrean, skip enqueue.`);
      return;
    }

    const queueId = generateUUIDv4();
    const now = new Date().toISOString();
    await db.executeSql(
      `INSERT INTO sync_queue (id, id_transaksi, payload_json, endpoint, status, retry_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'PENDING', 0, ?, ?);`,
      [queueId, idTransaksi, JSON.stringify(payload), endpoint, now, now],
    );
    console.log(`✅ [SyncQueue] Transaksi [${idTransaksi}] masuk antrean sync [${queueId}]`);
  } catch (error) {
    console.error('❌ Gagal menambahkan ke sync_queue:', error);
  }
};

/**
 * Mengambil semua item sync_queue yang masih menunggu (PENDING / FAILED).
 */
export const getPendingSyncQueue = async (
  limit = 50,
): Promise<SyncQueueItem[]> => {
  try {
    const db = await getDBConnection();
    const [results] = await db.executeSql(
      `SELECT * FROM sync_queue
       WHERE status IN ('PENDING', 'FAILED')
       ORDER BY retry_count ASC, created_at ASC
       LIMIT ?;`,
      [limit],
    );
    const items: SyncQueueItem[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      items.push({
        id: row.id,
        id_transaksi: row.id_transaksi,
        payload_json: row.payload_json,
        endpoint: row.endpoint,
        status: row.status,
        retry_count: row.retry_count,
        last_error: row.last_error,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }
    return items;
  } catch (error) {
    console.error('❌ Gagal mengambil pending sync queue:', error);
    return [];
  }
};

/**
 * Memperbarui status item di sync_queue (SYNCING, SYNCED, FAILED).
 */
export const updateSyncQueueStatus = async (
  id: string,
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED',
  lastError?: string,
): Promise<void> => {
  try {
    const db = await getDBConnection();
    await db.executeSql(
      `UPDATE sync_queue
       SET status = ?,
           last_error = ?,
           retry_count = retry_count + CASE WHEN ? = 'FAILED' THEN 1 ELSE 0 END,
           updated_at = ?
       WHERE id = ?;`,
      [status, lastError ?? null, status, new Date().toISOString(), id],
    );
  } catch (error) {
    console.error(`❌ Gagal update sync_queue [${id}]:`, error);
  }
};

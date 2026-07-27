import { getDBConnection } from './sqlite';

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
  items_json: string;
  items?: DraftTransactionItem[];
  sync_status: 'PendingSync' | 'Synced' | 'Failed';
  created_at: string;
}

/**
 * Generate a unique ID (UUID v4 style / fallback random string)
 */
const generateUUID = (): string => {
  return 'draft-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 1. Inisialisasi Skema Tabel draft_transactions di SQLite
 */
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
    console.log('✅ Tabel draft_transactions berhasil diinisialisasi');
  } catch (error) {
    console.error('❌ Gagal inisialisasi tabel draft_transactions:', error);
    throw error;
  }
};

/**
 * 2. Menyimpan Transaksi Draft ke SQLite
 */
export const saveDraftTransaction = async (
  input: SaveDraftTransactionInput
): Promise<DraftTransactionRecord> => {
  try {
    await initDraftTransactionsTable();
    const db = await getDBConnection();

    const id = input.id || generateUUID();
    const createdAt = new Date().toISOString();
    const itemsJson = JSON.stringify(input.items || []);
    const refNum = input.referenceNumber || '';

    await db.executeSql(
      `
      INSERT OR REPLACE INTO draft_transactions (
        id,
        total_amount,
        payment_type,
        payment_method,
        paid_amount,
        change_amount,
        reference_number,
        items_json,
        sync_status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        id,
        input.totalAmount,
        input.paymentType,
        input.paymentMethod,
        input.paidAmount,
        input.changeAmount,
        refNum,
        itemsJson,
        'PendingSync',
        createdAt,
      ]
    );

    console.log(`✅ Transaksi draft [${id}] berhasil disimpan ke SQLite`);

    return {
      id,
      total_amount: input.totalAmount,
      payment_type: input.paymentType,
      payment_method: input.paymentMethod,
      paid_amount: input.paidAmount,
      change_amount: input.changeAmount,
      reference_number: refNum,
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

/**
 * 3. Mengambil Semua Transaksi Draft dengan status 'PendingSync'
 */
export const getPendingDraftTransactions = async (): Promise<
  DraftTransactionRecord[]
> => {
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
      try {
        parsedItems = JSON.parse(row.items_json);
      } catch (e) {
        parsedItems = [];
      }

      pendingList.push({
        id: row.id,
        total_amount: row.total_amount,
        payment_type: row.payment_type,
        payment_method: row.payment_method,
        paid_amount: row.paid_amount,
        change_amount: row.change_amount,
        reference_number: row.reference_number,
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

/**
 * 4. Update status sinkronisasi transaksi draft ('PendingSync' | 'Synced' | 'Failed')
 */
export const updateDraftSyncStatus = async (
  id: string,
  syncStatus: 'PendingSync' | 'Synced' | 'Failed'
): Promise<void> => {
  try {
    const db = await getDBConnection();
    await db.executeSql(
      `
      UPDATE draft_transactions 
      SET sync_status = ? 
      WHERE id = ?;
      `,
      [syncStatus, id]
    );
    console.log(`✅ Status sync draft [${id}] diperbarui menjadi '${syncStatus}'`);
  } catch (error) {
    console.error(`❌ Gagal update status sync draft [${id}]:`, error);
    throw error;
  }
};

/**
 * 5. Menghapus Transaksi Draft berdasarkan ID
 */
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

/**
 * 6. Membersihkan transaksi yang sudah berhasil disinkronisasi ('Synced')
 */
export const clearSyncedDrafts = async (): Promise<void> => {
  try {
    const db = await getDBConnection();
    await db.executeSql(
      `DELETE FROM draft_transactions WHERE sync_status = 'Synced';`
    );
    console.log('✅ Semua transaksi draft berstatus Synced telah dibersihkan');
  } catch (error) {
    console.error('❌ Gagal membersihkan synced drafts:', error);
    throw error;
  }
};

import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export const DATABASE_NAME = 'posevent.db';
export const CURRENT_SCHEMA_VERSION = 3;

export const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface SaveShiftSessionInput {
  storeBrand: string;
  branchName: string;
  fullCabang: string;
  salesMode: string;
  operator: string;
  modalAwal: number;
}

export interface MenuReplicaRecord {
  id_menu: string;
  id_cabang: string;
  nama_cabang: string;
  nama_menu: string;
  kategori: string;
  harga: number;
  stok: number;
  is_promo: number;
  emoji?: string;
  updated_at: string;
}

export interface TransaksiDraftRecord {
  id_transaksi: string;
  id_cabang: string;
  nama_cabang: string;
  total_harga: number;
  metode_pembayaran: string;
  jenis_pembayaran: 'CASH' | 'NON_CASH';
  uang_diterima: number;
  kembalian: number;
  nomor_referensi?: string;
  items_json: string;
  sales_mode?: string;
  operator?: string;
  status: 'UNPAID' | 'DRAFT' | 'PAID' | 'PENDING_SYNC' | 'SYNCED';
  created_at: string;
}

export interface SyncQueueRecord {
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

export const getDBConnection = async (): Promise<SQLite.SQLiteDatabase> => {
  return SQLite.openDatabase({ name: DATABASE_NAME, location: 'default' });
};

export const executeBatchTransaction = async (
  db: SQLite.SQLiteDatabase,
  queries: Array<{ sql: string; params?: any[] }>
): Promise<void> => {
  await db.transaction(async (tx) => {
    for (const q of queries) {
      await tx.executeSql(q.sql, q.params || []);
    }
  });
};

export const migrateDatabaseSchema = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);

    const [versionRes] = await db.executeSql(
      `SELECT MAX(version) as current_version FROM schema_migrations;`
    );

    const currentVersion =
      versionRes.rows.length > 0 && versionRes.rows.item(0).current_version != null
        ? versionRes.rows.item(0).current_version
        : 0;

    console.log(`v${currentVersion} -> v${CURRENT_SCHEMA_VERSION}`);

    if (currentVersion < 1) {
      const alterQueries = [
        `ALTER TABLE transaksi_draft ADD COLUMN id_cabang TEXT NOT NULL DEFAULT 'CBG-001';`,
        `ALTER TABLE transaksi_draft ADD COLUMN nama_cabang TEXT NOT NULL DEFAULT 'Bengawan (Bandung)';`,
        `ALTER TABLE transaksi_draft ADD COLUMN total_harga REAL DEFAULT 0;`,
        `ALTER TABLE transaksi_draft ADD COLUMN metode_pembayaran TEXT DEFAULT 'CASH';`,
        `ALTER TABLE transaksi_draft ADD COLUMN jenis_pembayaran TEXT DEFAULT 'CASH';`,
        `ALTER TABLE transaksi_draft ADD COLUMN uang_diterima REAL DEFAULT 0;`,
        `ALTER TABLE transaksi_draft ADD COLUMN kembalian REAL DEFAULT 0;`,
        `ALTER TABLE transaksi_draft ADD COLUMN nomor_referensi TEXT;`,
        `ALTER TABLE transaksi_draft ADD COLUMN items_json TEXT DEFAULT '[]';`,
        `ALTER TABLE transaksi_draft ADD COLUMN sales_mode TEXT DEFAULT 'Dine In';`,
        `ALTER TABLE transaksi_draft ADD COLUMN operator TEXT;`,
      ];

      for (const query of alterQueries) {
        try {
          await db.executeSql(query);
        } catch {
        }
      }

      await db.executeSql(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (1, ?);`,
        [new Date().toISOString()]
      );
    }

    if (currentVersion < 2) {
      try {
        await db.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_transaksi_draft_cabang 
          ON transaksi_draft (id_cabang, status);
        `);
        await db.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_sync_queue_status 
          ON sync_queue (status, retry_count);
        `);
        await db.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_menu_replica_cabang 
          ON menu_replica (id_cabang, kategori);
        `);
      } catch (idxErr) {
      }

      await db.executeSql(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (2, ?);`,
        [new Date().toISOString()]
      );
    }

    if (currentVersion < 3) {
      try {
        await db.executeSql(`
          CREATE TABLE IF NOT EXISTS waste_logs (
            id TEXT PRIMARY KEY,
            id_cabang TEXT NOT NULL,
            nama_menu TEXT NOT NULL,
            qty INTEGER NOT NULL,
            alasan TEXT NOT NULL,
            operator TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await db.executeSql(`
          CREATE TABLE IF NOT EXISTS booking_appointments (
            id TEXT PRIMARY KEY,
            id_cabang TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            booking_date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            dp_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'CONFIRMED',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await db.executeSql(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            action_type TEXT NOT NULL,
            description TEXT NOT NULL,
            operator TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } catch (_) {}

      await db.executeSql(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (3, ?);`,
        [new Date().toISOString()]
      );
    }

  } catch (error) {
    console.error(error);
  }
};

export const createTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS menu_replica (
        id_menu TEXT PRIMARY KEY,
        id_cabang TEXT NOT NULL,
        nama_cabang TEXT NOT NULL,
        nama_menu TEXT NOT NULL,
        kategori TEXT NOT NULL,
        harga REAL NOT NULL,
        stok INTEGER DEFAULT 0,
        is_promo INTEGER DEFAULT 0,
        emoji TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS transaksi_draft (
        id_transaksi TEXT PRIMARY KEY NOT NULL,
        id_cabang TEXT NOT NULL,
        nama_cabang TEXT NOT NULL,
        total_harga REAL NOT NULL DEFAULT 0,
        metode_pembayaran TEXT NOT NULL DEFAULT 'CASH',
        jenis_pembayaran TEXT NOT NULL DEFAULT 'CASH',
        uang_diterima REAL DEFAULT 0,
        kembalian REAL DEFAULT 0,
        nomor_referensi TEXT,
        items_json TEXT NOT NULL DEFAULT '[]',
        sales_mode TEXT DEFAULT 'Dine In',
        operator TEXT,
        status TEXT DEFAULT 'UNPAID',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_transaksi) REFERENCES transaksi_draft (id_transaksi) ON DELETE CASCADE
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        category_id TEXT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        is_promo INTEGER DEFAULT 0,
        emoji TEXT
      );
    `);

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

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS shift_sessions (
        id TEXT PRIMARY KEY,
        store_brand TEXT NOT NULL,
        branch_name TEXT NOT NULL,
        full_cabang TEXT NOT NULL,
        sales_mode TEXT NOT NULL,
        operator TEXT NOT NULL,
        modal_awal REAL DEFAULT 0,
        opened_at TEXT NOT NULL,
        status TEXT DEFAULT 'OPEN'
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS waste_logs (
        id TEXT PRIMARY KEY,
        id_cabang TEXT NOT NULL,
        nama_menu TEXT NOT NULL,
        qty INTEGER NOT NULL,
        alasan TEXT NOT NULL,
        operator TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS booking_appointments (
        id TEXT PRIMARY KEY,
        id_cabang TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        booking_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        dp_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'CONFIRMED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action_type TEXT NOT NULL,
        description TEXT NOT NULL,
        operator TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await migrateDatabaseSchema(db);
  } catch (error) {
    console.error(error);
  }
};

export const saveShiftSession = async (
  db: SQLite.SQLiteDatabase,
  input: SaveShiftSessionInput,
): Promise<string> => {
  try {
    const id = `shift-${Date.now()}-${generateUUIDv4().slice(0, 8)}`;
    const openedAt = new Date().toISOString();
    await db.executeSql(
      `UPDATE shift_sessions SET status = 'CLOSED' WHERE status = 'OPEN';`,
    );
    await db.executeSql(
      `INSERT INTO shift_sessions
        (id, store_brand, branch_name, full_cabang, sales_mode, operator, modal_awal, opened_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN');`,
      [
        id,
        input.storeBrand,
        input.branchName,
        input.fullCabang,
        input.salesMode,
        input.operator,
        input.modalAwal,
        openedAt,
      ],
    );
    return id;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getActiveShiftSession = async (
  db: SQLite.SQLiteDatabase,
): Promise<(SaveShiftSessionInput & { id: string; openedAt: string }) | null> => {
  try {
    const [result] = await db.executeSql(
      `SELECT * FROM shift_sessions WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1;`,
    );
    if (result.rows.length === 0) return null;
    const row = result.rows.item(0);
    return {
      id: row.id,
      storeBrand: row.store_brand,
      branchName: row.branch_name,
      fullCabang: row.full_cabang,
      salesMode: row.sales_mode,
      operator: row.operator,
      modalAwal: row.modal_awal,
      openedAt: row.opened_at,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const saveWasteLog = async (
  db: SQLite.SQLiteDatabase,
  item: { idCabang: string; namaMenu: string; qty: number; alasan: string; operator: string }
): Promise<string> => {
  const id = `waste-${Date.now()}-${generateUUIDv4().slice(0, 6)}`;
  await db.executeSql(
    `INSERT INTO waste_logs (id, id_cabang, nama_menu, qty, alasan, operator, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, item.idCabang, item.namaMenu, item.qty, item.alasan, item.operator, new Date().toISOString()]
  );
  return id;
};

export const saveBookingAppointment = async (
  db: SQLite.SQLiteDatabase,
  item: { idCabang: string; customerName: string; phone: string; bookingDate: string; timeSlot: string; dpAmount: number; status?: string }
): Promise<string> => {
  const id = `book-${Date.now()}-${generateUUIDv4().slice(0, 6)}`;
  await db.executeSql(
    `INSERT INTO booking_appointments (id, id_cabang, customer_name, phone, booking_date, time_slot, dp_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, item.idCabang, item.customerName, item.phone, item.bookingDate, item.timeSlot, item.dpAmount, item.status || 'CONFIRMED', new Date().toISOString()]
  );
  return id;
};

export const saveAuditLog = async (
  db: SQLite.SQLiteDatabase,
  item: { actionType: string; description: string; operator: string }
): Promise<string> => {
  const id = `audit-${Date.now()}-${generateUUIDv4().slice(0, 6)}`;
  const createdAt = new Date().toISOString();
  await db.executeSql(
    `INSERT INTO audit_logs (id, action_type, description, operator, created_at) VALUES (?, ?, ?, ?, ?);`,
    [id, item.actionType, item.description, item.operator, createdAt]
  );
  try {
    const queueId = `sync-audit-${Date.now()}-${generateUUIDv4().slice(0, 6)}`;
    const payloadJson = JSON.stringify({
      id,
      actionType: item.actionType,
      description: item.description,
      operator: item.operator,
      createdAt,
    });
    await db.executeSql(
      `INSERT INTO sync_queue (id, id_transaksi, payload_json, endpoint, status, retry_count, created_at, updated_at) VALUES (?, ?, ?, ?, 'PENDING', 0, ?, ?);`,
      [queueId, id, payloadJson, '/api/audit/log', createdAt, createdAt]
    );
  } catch (_) {}
  return id;
};

export const getAuditLogs = async (
  db: SQLite.SQLiteDatabase
): Promise<Array<{ id: string; actionType: string; description: string; operator: string; createdAt: string }>> => {
  try {
    const [result] = await db.executeSql(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;`
    );
    const logs: Array<{ id: string; actionType: string; description: string; operator: string; createdAt: string }> = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      logs.push({
        id: row.id,
        actionType: row.action_type || row.actionType || 'AUDIT',
        description: row.description || '',
        operator: row.operator || 'SYSTEM',
        createdAt: row.created_at || row.createdAt || '',
      });
    }
    return logs;
  } catch (e) {
    return [];
  }
};
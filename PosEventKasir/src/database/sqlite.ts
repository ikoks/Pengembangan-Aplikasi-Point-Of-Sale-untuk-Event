import SQLite from 'react-native-sqlite-storage';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SaveShiftSessionInput {
  storeBrand: string;    // "Let's Go Gelato"
  branchName: string;    // "Bengawan (Bandung)"
  fullCabang: string;    // "Let's Go Gelato - Bengawan (Bandung)"
  salesMode: string;     // "Dine In" / "Takeaway" / "Event Field Sales"
  operator: string;      // username kasir
  modalAwal: number;     // modal awal dalam rupiah
}

SQLite.enablePromise(true);

export const getDBConnection = async () => {
  return SQLite.openDatabase({ name: 'posevent.db', location: 'default' });
};

export const createTables = async (db: SQLite.SQLiteDatabase) => {
  try {
    // 1. Tabel Kategori
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

    // 2. Tabel Produk / Replika Katalog
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

    // 3. Tabel Draft Transactions (Queue Offline)
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

    // Tabel Transaksi Draft legacy (kompatibilitas)
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS transaksi_draft (
        id_transaksi TEXT PRIMARY KEY, 
        id_sales INTEGER,
        id_cabang INTEGER,
        modal_awal REAL,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Tabel Shift Sessions (context cabang/tenant per shift)
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

    console.log('✅ Skema SQLite Lokal (categories, products, draft_transactions, shift_sessions) Berhasil Diinisialisasi');
  } catch (error) {
    console.error('❌ Gagal membuat tabel SQLite:', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SHIFT SESSION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simpan sesi shift baru ke tabel shift_sessions.
 * Otomatis menutup (update status='CLOSED') semua sesi sebelumnya.
 */
export const saveShiftSession = async (
  db: SQLite.SQLiteDatabase,
  input: SaveShiftSessionInput,
): Promise<string> => {
  try {
    const id = `shift-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const openedAt = new Date().toISOString();

    // Tutup sesi lama yang masih OPEN
    await db.executeSql(
      `UPDATE shift_sessions SET status = 'CLOSED' WHERE status = 'OPEN';`,
    );

    // Insert sesi baru
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

    console.log(`✅ Shift session [${id}] dibuka: ${input.fullCabang} (${input.salesMode})`);
    return id;
  } catch (error) {
    console.error('❌ Gagal menyimpan shift session:', error);
    throw error;
  }
};

/**
 * Ambil sesi shift yang sedang aktif (status OPEN).
 */
export const getActiveShiftSession = async (
  db: SQLite.SQLiteDatabase,
): Promise<SaveShiftSessionInput & { id: string; openedAt: string } | null> => {
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
    console.error('❌ Gagal mengambil shift session aktif:', error);
    return null;
  }
};
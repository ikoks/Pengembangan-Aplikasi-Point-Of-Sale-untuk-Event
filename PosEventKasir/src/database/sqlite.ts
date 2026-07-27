import SQLite from 'react-native-sqlite-storage';

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

    console.log('✅ Skema SQLite Lokal (categories, products, draft_transactions) Berhasil Diinisialisasi');
  } catch (error) {
    console.error('❌ Gagal membuat tabel SQLite:', error);
  }
};
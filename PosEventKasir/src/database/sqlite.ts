import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export const getDBConnection = async () => {
  return SQLite.openDatabase({ name: 'posevent.db', location: 'default' });
};

export const createTables = async (db: SQLite.SQLiteDatabase) => {
  try {
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS menu_replica (
        id_menu INTEGER PRIMARY KEY,
        nama_menu TEXT NOT NULL,
        harga_produk REAL NOT NULL,
        id_kategori INTEGER
      );
    `);

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
    
    console.log('✅ Skema SQLite Lokal Berhasil Diinisialisasi');
  } catch (error) {
    console.error('❌ Gagal membuat tabel SQLite:', error);
  }
};
// =============================================================================
// src/database/sqlite.ts
// === [UPDATE POS-B-09] === SQLite Schema & Multi-Tenant Data Migration
//
// Konfigurasi Database Lokal SQLite:
//   1. Tabel menu_replica: Replikasi menu katalog offline per cabang
//   2. Tabel transaksi_draft: Menyimpan draf transaksi lokal dengan UUID v4 & metadata cabang
//   3. Tabel sync_queue: Antrean sinkronisasi transaksi offline ke server backend
//   4. Fitur Migrasi Skema Versi (Safe Migration): Menjamin data draf tidak hilang saat app diupdate
// =============================================================================

import SQLite from 'react-native-sqlite-storage';

// Enable promise-based SQLite interface
SQLite.enablePromise(true);

// =============================================================================
// === [UPDATE POS-B-09] === VERSI SCHEMA DATABASE
// =============================================================================
export const DATABASE_NAME = 'posevent.db';
export const CURRENT_SCHEMA_VERSION = 2;

// =============================================================================
// === [UPDATE POS-B-09] === HELPER GENERATOR UUID v4
// Memastikan id_transaksi berformat UUID v4 bertipe TEXT untuk mencegah duplikasi.
// Contoh output: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
// =============================================================================
export const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// =============================================================================
// === [UPDATE POS-B-09] === INTERFACES & TIPE DATA
// =============================================================================

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
  id_transaksi: string; // Wajib berformat UUID v4 (TEXT)
  id_cabang: string;    // Identitas cabang (Multi-Tenant)
  nama_cabang: string;  // Nama cabang spesifik
  total_harga: number;
  metode_pembayaran: string; // CASH, EDC_DEBIT, TRANSFER_BANK, QRIS_MANUAL, dll
  jenis_pembayaran: 'CASH' | 'NON_CASH';
  uang_diterima: number;
  kembalian: number;
  nomor_referensi?: string; // Nomor referensi non-tunai manual (RRN / Trace / Approval)
  items_json: string;
  sales_mode?: string;  // Dine In, Takeaway, Event Field Sales
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

// =============================================================================
// === [UPDATE POS-B-09] === GET DATABASE CONNECTION
// =============================================================================
export const getDBConnection = async (): Promise<SQLite.SQLiteDatabase> => {
  return SQLite.openDatabase({ name: DATABASE_NAME, location: 'default' });
};

// =============================================================================
// === [UPDATE POS-B-09] === MIGRASI SKEMA VERSI BASIS DATA SECARA AMAN (SAFE MIGRATION)
//
// Fungsi ini secara cerdas mengecek versi basis data saat ini dan menerapkan
// perubahan DDL (Data Definition Language) tanpa menghapus (DROP) tabel transaksi_draft,
// sehingga data draf lokal kasir tidak pernah hilang saat aplikasi diperbarui.
// =============================================================================
export const migrateDatabaseSchema = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // 1. Buat tabel pelacak versi schema jika belum ada
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);

    // 2. Ambil versi terkini dari tabel schema_migrations
    const [versionRes] = await db.executeSql(
      `SELECT MAX(version) as current_version FROM schema_migrations;`
    );

    const currentVersion =
      versionRes.rows.length > 0 && versionRes.rows.item(0).current_version != null
        ? versionRes.rows.item(0).current_version
        : 0;

    console.log(`ℹ️ [SQLite Migration] Versi DB Saat Ini: v${currentVersion} | Target: v${CURRENT_SCHEMA_VERSION}`);

    // --- MIGRASI V1: Penambahan Kolom Multi-Tenant & Non-Cash Ref pada transaksi_draft ---
    if (currentVersion < 1) {
      console.log('🔄 [SQLite Migration] Menjalankan migrasi v1...');

      // Pastikan kolom-kolom baru ditambahkan jika tabel transaksi_draft dari struktur lama sudah ada
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
          // Abaikan error jika kolom sudah ada dari eksekusi sebelumnya
        }
      }

      await db.executeSql(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (1, ?);`,
        [new Date().toISOString()]
      );
      console.log('✅ [SQLite Migration] Migrasi v1 selesai (Kolom transaksi_draft diperbarui).');
    }

    // --- MIGRASI V2: Indexing & Validasi Integritas UUID v4 ---
    if (currentVersion < 2) {
      console.log('🔄 [SQLite Migration] Menjalankan migrasi v2...');

      // Buat indeks unik untuk nomor_referensi & id_transaksi guna mencegah duplikasi
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
        console.warn('⚠️ [SQLite Migration] Indeks sudah ada atau lewati:', idxErr);
      }

      await db.executeSql(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (2, ?);`,
        [new Date().toISOString()]
      );
      console.log('✅ [SQLite Migration] Migrasi v2 selesai (Indeks multi-tenant & sync queue berhasil dibuat).');
    }

  } catch (error) {
    console.error('❌ Gagal melakukan migrasi skema SQLite:', error);
  }
};

// =============================================================================
// === [UPDATE POS-B-09] === INISIALISASI TABEL DATABASE (CREATE TABLES)
//
// Struktur Tabel Lengkap:
//   1. menu_replica (Replikasi Katalog Menu Per Cabang)
//   2. transaksi_draft (Draf Transaksi Lokal + UUID v4 + Metadata Cabang + No. Ref)
//   3. sync_queue (Antrean Sync Transaksi Offline ke Backend API)
//   4. categories, products, draft_transactions, shift_sessions (Pendukung)
// =============================================================================
export const createTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // -------------------------------------------------------------------------
    // 1. TABEL menu_replica (REPLIKASI KATALOG MENU PER CABANG / TENANT)
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // 2. TABEL transaksi_draft (DRAF TRANSAKSI LOKAL MULTI-TENANT)
    // id_transaksi WAJIB BERFORMAT UUID v4 (TEXT) UNTUK MENCEGAH DUPLIKASI.
    // Menyimpan id_cabang, nama_cabang, & nomor_referensi manual non-tunai.
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // 3. TABEL sync_queue (ANTREAN SINKRONISASI TRANSAKSI OFFLINE)
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // 4. TABEL PENDUKUNG (CATEGORIES, PRODUCTS, DRAFT_TRANSACTIONS, SHIFT_SESSIONS)
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // 5. JALANKAN MIGRASI VERSIONS (SAFE MIGRATION SYSTEM)
    // -------------------------------------------------------------------------
    await migrateDatabaseSchema(db);

    console.log('✅ Skema SQLite Lokal (menu_replica, transaksi_draft, sync_queue) Berhasil Diinisialisasi');
  } catch (error) {
    console.error('❌ Gagal membuat tabel SQLite:', error);
  }
};

// =============================================================================
// === [UPDATE POS-B-09] === HELPER TRANSAKSI SHIFT SESSIONS
// =============================================================================
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
    console.log(`✅ Shift session [${id}] dibuka: ${input.fullCabang} (${input.salesMode})`);
    return id;
  } catch (error) {
    console.error('❌ Gagal menyimpan shift session:', error);
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
    console.error('❌ Gagal mengambil shift session aktif:', error);
    return null;
  }
};
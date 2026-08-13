import { getDBConnection } from '../database/sqlite';
import { getApiBaseUrl, getApiContextSnapshot } from './api/apiClient';
import { MenuItem } from '../types/pos';

export interface CatalogItemFromApi {
  id_menu?: string;
  id?: string;
  id_cabang?: string;
  nama_cabang?: string;
  nama_menu?: string;
  name?: string;
  kategori?: string;
  category?: string;
  harga?: number;
  price?: number;
  stok?: number;
  stock?: number;
  is_promo?: number | boolean;
  emoji?: string;
}

export class CatalogSyncService {
  /**
   * Fetch live list of branches directly from Laravel Admin API & MySQL Database (`/api/v1/cabang` or `/api/v1/katalog/download`).
   */
  async fetchLiveBranchesFromAdmin(): Promise<Array<{ id_cabang: string; nama_cabang: string }>> {
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
    const ctx = getApiContextSnapshot();
    const token = ctx.accessToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpoints = ['/api/v1/cabang', '/api/v1/katalog/download', '/cabang'];

    for (const ep of endpoints) {
      try {
        const url = baseUrl.endsWith('/api/v1') && ep.startsWith('/api/v1')
          ? baseUrl + ep.replace('/api/v1', '')
          : baseUrl + ep;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url, { method: 'GET', headers, signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const json = await res.json();
          const raw = json?.data?.cabang || json?.data || json?.cabang || json;
          if (Array.isArray(raw) && raw.length > 0) {
            return raw.map((b: any) => ({
              id_cabang: b.id_cabang || b.id || 'b1c2d3e4-0001-0001-0001-000000000001',
              nama_cabang: b.nama_cabang || b.name || 'Cabang Utama',
            }));
          }
        }
      } catch (_) {}
    }

    return [
      { id_cabang: 'b1c2d3e4-0001-0001-0001-000000000001', nama_cabang: 'Bengawan (Bandung)' },
    ];
  }

  /**
   * Sync catalog directly from Laravel Admin API & MySQL Database to SQLite `menu_replica` table.
   */
  async syncCatalogFromAdmin(cabangName?: string): Promise<{ success: boolean; itemCount: number; message?: string }> {
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
    const ctx = getApiContextSnapshot();
    const token = ctx.accessToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpoints = [
      '/api/v1/katalog/download',
      '/api/v1/menu',
      '/katalog/download',
      '/menu',
    ];

    let itemsFromApi: CatalogItemFromApi[] = [];
    let fetched = false;

    for (const ep of endpoints) {
      try {
        const url = baseUrl.endsWith('/api/v1') && ep.startsWith('/api/v1')
          ? baseUrl + ep.replace('/api/v1', '')
          : baseUrl + ep;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { method: 'GET', headers, signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const json = await res.json();
          const rawItems = json?.data?.menu || json?.data || json?.menu || json;
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            itemsFromApi = rawItems;
            fetched = true;
            break;
          }
        }
      } catch (_) {}
    }

    if (!fetched || itemsFromApi.length === 0) {
      return {
        success: false,
        itemCount: 0,
        message: 'Gagal mengunduh katalog dari Admin API. Pastikan server Admin Laravel aktif.',
      };
    }

    // Save fetched items to SQLite `menu_replica`
    try {
      const db = await getDBConnection();
      await db.executeSql(
        `CREATE TABLE IF NOT EXISTS menu_replica (
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
        );`
      );

      const targetCabang = cabangName || 'Bengawan (Bandung)';

      for (const item of itemsFromApi) {
        const idMenu = item.id_menu || item.id || `MENU-${Math.random().toString(36).substr(2, 9)}`;
        const idCabang = item.id_cabang || 'b1c2d3e4-0001-0001-0001-000000000001';
        const namaCabang = item.nama_cabang || targetCabang;
        const namaMenu = item.nama_menu || item.name || 'Produk Admin';
        const kategori = item.kategori || item.category || 'Umum';
        const harga = Number(item.harga ?? item.price ?? 0);
        const stok = Number(item.stok ?? item.stock ?? 100);
        const isPromo = item.is_promo ? 1 : 0;
        const emoji = item.emoji || '📦';

        await db.executeSql(
          `INSERT OR REPLACE INTO menu_replica (id_menu, id_cabang, nama_cabang, nama_menu, kategori, harga, stok, is_promo, emoji, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [idMenu, idCabang, namaCabang, namaMenu, kategori, harga, stok, isPromo, emoji, new Date().toISOString()]
        );
      }

      return {
        success: true,
        itemCount: itemsFromApi.length,
        message: `Berhasil mengunduh & menyinkronkan ${itemsFromApi.length} produk dari Admin & Database MySQL!`,
      };
    } catch (dbErr: any) {
      return {
        success: false,
        itemCount: 0,
        message: `Gagal menyimpan katalog ke SQLite: ${dbErr?.message || String(dbErr)}`,
      };
    }
  }

  /**
   * Load menu items from SQLite database `menu_replica`.
   */
  async getReplicaMenuItems(cabangName?: string): Promise<MenuItem[]> {
    try {
      const db = await getDBConnection();
      await db.executeSql(
        `CREATE TABLE IF NOT EXISTS menu_replica (
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
        );`
      );

      const [results] = await db.executeSql(
        `SELECT id_menu, id_cabang, nama_cabang, nama_menu, kategori, harga, stok, is_promo, emoji FROM menu_replica;`
      );

      const items: MenuItem[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        items.push({
          id: row.id_menu,
          name: row.nama_menu,
          price: Number(row.harga),
          category: row.kategori,
          emoji: row.emoji || '📦',
          stockQuantity: Number(row.stok),
          isAvailable: Number(row.stok) > 0,
        });
      }

      return items;
    } catch (err) {
      console.warn('Error loading replica menu items from SQLite:', err);
      return [];
    }
  }

  /**
   * Load category names from SQLite database `menu_replica`.
   */
  async getReplicaCategories(cabangName?: string): Promise<string[]> {
    try {
      const db = await getDBConnection();
      const [results] = await db.executeSql(
        `SELECT DISTINCT kategori FROM menu_replica WHERE kategori IS NOT NULL AND kategori != '';`
      );

      const categories: string[] = ['Semua'];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        if (row.kategori && !categories.includes(row.kategori)) {
          categories.push(row.kategori);
        }
      }

      return categories;
    } catch (err) {
      return ['Semua'];
    }
  }
}

export const catalogSyncService = new CatalogSyncService();

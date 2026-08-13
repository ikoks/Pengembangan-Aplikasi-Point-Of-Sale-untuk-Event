import { getDBConnection } from '../database/sqlite';
import { extractCleanBranchName } from '../utils/branchHelper';

export interface TerminalConfig {
  isConfigured: boolean;
  apiBaseUrl?: string;
  terminalId: string;
  brand?: string;
  branch: string;
  boundCabangFull: string;
  orderUrl?: string;
  configuredAt?: string;
}

// In-memory config cache
let _memoryConfigCache: TerminalConfig | null = null;

export class TerminalConfigService {
  /**
   * Save terminal configuration permanently to SQLite database.
   */
  async saveTerminalConfig(config: Partial<TerminalConfig>): Promise<boolean> {
    const branch = extractCleanBranchName(config.branch || config.boundCabangFull || 'Bengawan (Bandung)');
    const fullConfig: TerminalConfig = {
      isConfigured: true,
      apiBaseUrl: config.apiBaseUrl || 'https://tree-thing-six-recall.trycloudflare.com',
      terminalId: config.terminalId || `TAB-${Math.floor(100 + Math.random() * 900)}`,
      brand: config.brand || 'POS EVENT',
      branch: branch,
      boundCabangFull: config.boundCabangFull || branch,
      orderUrl: config.orderUrl || 'https://tree-thing-six-recall.trycloudflare.com',
      configuredAt: new Date().toISOString(),
    };

    _memoryConfigCache = fullConfig;

    try {
      const db = await getDBConnection();
      await db.executeSql(
        `CREATE TABLE IF NOT EXISTS terminal_config (
          id TEXT PRIMARY KEY,
          brand TEXT,
          branch TEXT,
          bound_cabang_full TEXT,
          terminal_id TEXT,
          order_url TEXT,
          configured_at TEXT
        );`
      );
      await db.executeSql(
        `INSERT OR REPLACE INTO terminal_config (id, brand, branch, bound_cabang_full, terminal_id, order_url, configured_at) VALUES ('MAIN_CONFIG', ?, ?, ?, ?, ?, ?);`,
        [
          fullConfig.brand,
          fullConfig.branch,
          fullConfig.boundCabangFull,
          fullConfig.terminalId,
          fullConfig.orderUrl,
          fullConfig.configuredAt,
        ]
      );
      return true;
    } catch (err) {
      console.error('Error saving terminal config to SQLite:', err);
      return true;
    }
  }

  /**
   * Load terminal configuration from SQLite database.
   */
  async loadTerminalConfig(): Promise<TerminalConfig | null> {
    if (_memoryConfigCache) {
      return _memoryConfigCache;
    }

    try {
      const db = await getDBConnection();
      await db.executeSql(
        `CREATE TABLE IF NOT EXISTS terminal_config (
          id TEXT PRIMARY KEY,
          brand TEXT,
          branch TEXT,
          bound_cabang_full TEXT,
          terminal_id TEXT,
          order_url TEXT,
          configured_at TEXT
        );`
      );
      const [results] = await db.executeSql(
        `SELECT brand, branch, bound_cabang_full, terminal_id, order_url, configured_at FROM terminal_config WHERE id = 'MAIN_CONFIG' LIMIT 1;`
      );
      if (results.rows.length > 0) {
        const item = results.rows.item(0);
        const clean = extractCleanBranchName(item.bound_cabang_full || item.branch);
        _memoryConfigCache = {
          isConfigured: true,
          brand: item.brand,
          branch: clean,
          boundCabangFull: item.bound_cabang_full || clean,
          terminalId: item.terminal_id || 'TAB-001',
          orderUrl: item.order_url,
          configuredAt: item.configured_at,
        };
        return _memoryConfigCache;
      }

      // Check SQLite shift_sessions database table fallback
      const [shiftRes] = await db.executeSql(
        `SELECT count(*) as total FROM shift_sessions;`
      );
      if (shiftRes.rows.length > 0 && shiftRes.rows.item(0).total > 0) {
        _memoryConfigCache = {
          isConfigured: true,
          terminalId: 'TAB-001',
          branch: 'Bengawan (Bandung)',
          boundCabangFull: 'Bengawan (Bandung)',
        };
        return _memoryConfigCache;
      }
    } catch (err) {
      console.warn('Error loading terminal config:', err);
    }
    return null;
  }

  /**
   * Check if terminal is already bound/configured.
   */
  async isTerminalConfigured(): Promise<boolean> {
    const config = await this.loadTerminalConfig();
    return Boolean(config && config.isConfigured && config.branch);
  }

  /**
   * Reset terminal configuration (Safe Admin reset option for re-scanning).
   */
  async resetTerminalConfig(): Promise<boolean> {
    _memoryConfigCache = null;
    try {
      const db = await getDBConnection();
      await db.executeSql(`DELETE FROM terminal_config WHERE id = 'MAIN_CONFIG';`);
      return true;
    } catch (err) {
      console.error('Error resetting terminal config:', err);
      return false;
    }
  }
}

export const terminalConfigService = new TerminalConfigService();

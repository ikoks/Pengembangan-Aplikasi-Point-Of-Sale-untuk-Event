// =============================================================================
// src/services/syncManager.ts
// === [POS-B-10] === SyncManager Background Worker
//
// Modul pengunggah data latar belakang otomatis yang mengelola siklus penuh
// sinkronisasi transaksi offline ke server backend, mencakup:
//
//   1. NetInfo Listener  — Memantau status koneksi internet secara real-time.
//   2. Background Worker — Otomatis memproses sync_queue saat internet menyala.
//   3. Batch Processing  — Mengelompokkan transaksi dalam batch 10 item per siklus.
//   4. Exponential Backoff Retry — Menunggu 2^n detik sebelum retry.
//   5. Idempotent Guard  — Header X-Idempotency-Key mencegah duplikasi data di server.
//   6. State Listener    — Komponen React dapat subscribe ke status worker.
// =============================================================================

import {
  getPendingSyncQueue,
  updateSyncQueueStatus,
  updateDraftSyncStatus,
  SyncQueueItem,
} from '../database/offlineQueueManager';
import apiClient from './api/apiClient';

// =============================================================================
// === [POS-B-10] === KONFIGURASI WORKER
// =============================================================================

/** Endpoint server untuk menerima payload transaksi offline */
const SYNC_ENDPOINT = '/sync';

/** Jumlah item transaksi per satu batch upload */
const BATCH_SIZE = 10;

/** Delay awal (ms) sebelum retry pertama (basis untuk exponential backoff) */
const BACKOFF_BASE_MS = 2_000; // 2 detik

/** Maksimal retry per item sebelum ditandai FAILED permanen */
const MAX_RETRY_PER_ITEM = 5;

/** Interval polling worker (ms) saat tidak ada listener jaringan */
const FALLBACK_POLL_INTERVAL_MS = 60_000; // 60 detik

// =============================================================================
// === [POS-B-10] === TIPE STATUS & EVENTS
// =============================================================================

export type SyncWorkerStatus =
  | 'IDLE'       // Worker tidak aktif
  | 'WATCHING'   // Memantau koneksi jaringan
  | 'SYNCING'    // Sedang mengunggah batch
  | 'ERROR'      // Terjadi kesalahan fatal
  | 'STOPPED';   // Worker dihentikan

export interface SyncWorkerState {
  status: SyncWorkerStatus;
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  syncedCount: number;
  failedCount: number;
}

export interface SyncBatchResult {
  attempted: number;
  synced: number;
  failed: number;
  skipped: number;
}

export interface SyncItemPayload {
  id: string;
  id_transaksi: string;
  [key: string]: unknown;
}

export interface SyncServerResponse {
  success: boolean;
  synced: string[];
  failed?: Array<{ id: string; reason: string }>;
  message?: string;
}

// =============================================================================
// === [POS-B-10] === SYNC MANAGER CLASS (SINGLETON)
//
// Kelas ini merupakan singleton yang diakses via SyncManager.getInstance().
// =============================================================================
export class SyncManager {
  private static _instance: SyncManager | null = null;

  private _state: SyncWorkerState = {
    status: 'IDLE',
    isOnline: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
    syncedCount: 0,
    failedCount: 0,
  };

  private _stateListeners: Array<(s: SyncWorkerState) => void> = [];
  private _netInfoUnsubscribe: (() => void) | null = null;
  private _fallbackTimer: ReturnType<typeof setInterval> | null = null;
  private _isSyncing = false;

  // --- Singleton accessor ---
  static getInstance(): SyncManager {
    if (!SyncManager._instance) {
      SyncManager._instance = new SyncManager();
    }
    return SyncManager._instance;
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  getState(): SyncWorkerState {
    return { ...this._state };
  }

  private _setState(patch: Partial<SyncWorkerState>): void {
    this._state = { ...this._state, ...patch };
    this._stateListeners.forEach((fn) => fn(this.getState()));
  }

  /**
   * Berlangganan ke perubahan status SyncManager.
   * Mengembalikan fungsi unsubscribe.
   */
  subscribe(listener: (s: SyncWorkerState) => void): () => void {
    this._stateListeners.push(listener);
    // Kirim state saat ini langsung ke subscriber baru
    listener(this.getState());
    return () => {
      this._stateListeners = this._stateListeners.filter((l) => l !== listener);
    };
  }

  // ===========================================================================
  // === [POS-B-10] === MEMULAI WORKER (START)
  //
  // Mendaftarkan listener NetInfo untuk memantau koneksi jaringan.
  // Jika NetInfo tidak tersedia, beralih ke mode polling interval.
  // ===========================================================================
  async start(): Promise<void> {
    if (this._state.status === 'WATCHING' || this._state.status === 'SYNCING') {
      console.log('[SyncManager] Worker sudah berjalan, skip start.');
      return;
    }

    console.log('[SyncManager] 🚀 Memulai SyncManager background worker...');
    this._setState({ status: 'WATCHING', lastError: null });

    const netInfoModule = this._loadNetInfo();

    if (netInfoModule) {
      // === [POS-B-10] === NETINFO LISTENER — Pantau jaringan secara real-time
      this._netInfoUnsubscribe = netInfoModule.addEventListener(
        (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
          const isOnline = !!(state.isConnected && state.isInternetReachable !== false);
          const wasOnline = this._state.isOnline;

          this._setState({ isOnline });

          // Saat jaringan BARU MENYALA → segera trigger sync
          if (isOnline && !wasOnline) {
            console.log('[SyncManager] 🌐 Koneksi internet terdeteksi. Memulai sinkronisasi...');
            this._triggerSync();
          } else if (!isOnline && wasOnline) {
            console.log('[SyncManager] 📵 Koneksi internet terputus. Menunggu...');
          }
        },
      );

      // Cek status awal koneksi saat start
      const initial = await netInfoModule.fetch();
      const isOnline = !!(initial.isConnected && initial.isInternetReachable !== false);
      this._setState({ isOnline });
      if (isOnline) {
        this._triggerSync();
      }
    } else {
      // Fallback: gunakan polling interval jika NetInfo tidak tersedia
      console.warn(
        '[SyncManager] ⚠️ NetInfo tidak tersedia. Menggunakan polling interval ' +
        `(${FALLBACK_POLL_INTERVAL_MS / 1000}s).`,
      );
      this._startFallbackPolling();
    }
  }

  // ===========================================================================
  // === [POS-B-10] === MENGHENTIKAN WORKER (STOP)
  // ===========================================================================
  stop(): void {
    if (this._netInfoUnsubscribe) {
      this._netInfoUnsubscribe();
      this._netInfoUnsubscribe = null;
    }
    if (this._fallbackTimer) {
      clearInterval(this._fallbackTimer);
      this._fallbackTimer = null;
    }
    this._setState({ status: 'STOPPED' });
    console.log('[SyncManager] 🛑 Worker dihentikan.');
  }

  // ===========================================================================
  // === [POS-B-10] === TRIGGER SINKRONISASI (MANUAL ATAU OTOMATIS)
  // ===========================================================================
  private async _triggerSync(): Promise<void> {
    if (this._isSyncing) {
      console.log('[SyncManager] Sinkronisasi sedang berjalan, skip trigger baru.');
      return;
    }
    this._isSyncing = true;
    this._setState({ status: 'SYNCING' });

    try {
      await this._runSyncCycle();
    } finally {
      this._isSyncing = false;
      this._setState({
        status: this._state.isOnline ? 'WATCHING' : 'WATCHING',
      });
    }
  }

  /**
   * Panggil fungsi ini dari luar untuk memaksa sinkronisasi manual.
   */
  async triggerManualSync(): Promise<SyncBatchResult> {
    if (!this._state.isOnline) {
      console.warn('[SyncManager] Tidak dapat sync: offline.');
      return { attempted: 0, synced: 0, failed: 0, skipped: 0 };
    }
    if (this._isSyncing) {
      console.warn('[SyncManager] Sync sudah berjalan.');
      return { attempted: 0, synced: 0, failed: 0, skipped: 0 };
    }
    this._isSyncing = true;
    this._setState({ status: 'SYNCING' });
    try {
      return await this._runSyncCycle();
    } finally {
      this._isSyncing = false;
      this._setState({ status: 'WATCHING' });
    }
  }

  // ===========================================================================
  // === [POS-B-10] === SIKLUS SINKRONISASI UTAMA (DENGAN BATCHING)
  //
  // Mengambil transaksi PendingSync dari SQLite, mengelompokkannya dalam batch
  // sebanyak BATCH_SIZE item, lalu mengunggah ke endpoint /api/v1/sync.
  // ===========================================================================
  private async _runSyncCycle(): Promise<SyncBatchResult> {
    const result: SyncBatchResult = { attempted: 0, synced: 0, failed: 0, skipped: 0 };

    try {
      // 1. Ambil semua item yang menunggu sinkronisasi
      const pendingItems = await getPendingSyncQueue(BATCH_SIZE * 3);
      this._setState({ pendingCount: pendingItems.length });

      if (pendingItems.length === 0) {
        console.log('[SyncManager] ✅ Tidak ada transaksi yang perlu disinkronkan.');
        return result;
      }

      console.log(`[SyncManager] 📦 Ditemukan ${pendingItems.length} item, mulai batch processing...`);

      // 2. Bagi menjadi batch sesuai BATCH_SIZE
      const batches = this._chunkArray(pendingItems, BATCH_SIZE);

      for (const batch of batches) {
        if (!this._state.isOnline) {
          console.log('[SyncManager] Koneksi terputus saat batching. Hentikan siklus.');
          break;
        }
        const batchResult = await this._uploadBatch(batch);
        result.attempted += batchResult.attempted;
        result.synced += batchResult.synced;
        result.failed += batchResult.failed;
        result.skipped += batchResult.skipped;
      }

      // 3. Perbarui state global setelah siklus selesai
      this._setState({
        syncedCount: this._state.syncedCount + result.synced,
        failedCount: this._state.failedCount + result.failed,
        lastSyncAt: new Date().toISOString(),
        lastError: result.failed > 0
          ? `${result.failed} transaksi gagal disinkronkan.`
          : null,
      });

      console.log(
        `[SyncManager] ✅ Siklus selesai: ${result.synced} synced, ` +
        `${result.failed} failed, ${result.skipped} skipped.`,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[SyncManager] ❌ Error siklus sync:', error);
      this._setState({ lastError: msg, status: 'ERROR' });
    }

    return result;
  }

  // ===========================================================================
  // === [POS-B-10] === UPLOAD SATU BATCH KE SERVER
  //
  // Idempotent: setiap item disertai header X-Idempotency-Key (UUID id_transaksi)
  // agar server dapat mendeteksi dan mengabaikan pengiriman duplikat.
  //
  // Exponential Backoff: jika server mengembalikan error 5xx atau jaringan
  // putus, sistem menunggu 2^n detik sebelum mencoba ulang.
  // ===========================================================================
  private async _uploadBatch(batch: SyncQueueItem[]): Promise<SyncBatchResult> {
    const result: SyncBatchResult = { attempted: 0, synced: 0, failed: 0, skipped: 0 };

    for (const item of batch) {
      result.attempted++;

      // Lewati item yang retry_count sudah melebihi maksimal
      if (item.retry_count >= MAX_RETRY_PER_ITEM) {
        console.warn(
          `[SyncManager] ⚠️ Item [${item.id_transaksi}] melebihi batas retry ` +
          `(${item.retry_count}/${MAX_RETRY_PER_ITEM}). Tandai FAILED permanen.`,
        );
        await updateSyncQueueStatus(item.id, 'FAILED', 'Exceeded max retry limit.');
        await updateDraftSyncStatus(item.id_transaksi, 'Failed');
        result.failed++;
        result.skipped++;
        continue;
      }

      // Tandai sebagai SYNCING
      await updateSyncQueueStatus(item.id, 'SYNCING');

      let payload: SyncItemPayload;
      try {
        payload = JSON.parse(item.payload_json) as SyncItemPayload;
      } catch {
        console.error(`[SyncManager] Gagal parse payload JSON [${item.id_transaksi}]`);
        await updateSyncQueueStatus(item.id, 'FAILED', 'Invalid JSON payload');
        result.failed++;
        continue;
      }

      // === [POS-B-10] === KIRIM KE SERVER DENGAN EXPONENTIAL BACKOFF RETRY
      const success = await this._uploadWithRetry(item, payload);

      if (success) {
        await updateSyncQueueStatus(item.id, 'SYNCED');
        await updateDraftSyncStatus(item.id_transaksi, 'Synced');
        result.synced++;
      } else {
        // updateSyncQueueStatus sudah dilakukan di dalam _uploadWithRetry
        await updateDraftSyncStatus(item.id_transaksi, 'Failed');
        result.failed++;
      }
    }

    return result;
  }

  // ===========================================================================
  // === [POS-B-10] === UPLOAD SATU ITEM DENGAN EXPONENTIAL BACKOFF RETRY
  //
  // Algoritma:
  //   - Percobaan ke-1: langsung kirim
  //   - Percobaan ke-2: tunggu 2^1 = 2 detik
  //   - Percobaan ke-3: tunggu 2^2 = 4 detik
  //   - Percobaan ke-4: tunggu 2^3 = 8 detik
  //   - dst. hingga MAX_RETRY_PER_ITEM
  //
  // Idempotent:
  //   Header X-Idempotency-Key = id_transaksi (UUID v4) dikirim di setiap request.
  //   Server yang mendukung idempotency akan mengabaikan pengiriman ulang transaksi
  //   yang sudah pernah diproses sebelumnya, mencegah data duplikat.
  // ===========================================================================
  private async _uploadWithRetry(
    queueItem: SyncQueueItem,
    payload: SyncItemPayload,
  ): Promise<boolean> {
    const MAX_ATTEMPT = 3; // Retry dalam satu siklus upload ini

    for (let attempt = 1; attempt <= MAX_ATTEMPT; attempt++) {
      try {
        const response = await apiClient.post<SyncServerResponse>(
          SYNC_ENDPOINT,
          {
            transactions: [payload],
          },
          {
            // === [POS-B-10] === IDEMPOTENT KEY HEADER
            // Server menggunakan kunci ini untuk mendeteksi request duplikat.
            headers: {
              'X-Idempotency-Key': queueItem.id_transaksi,
            },
            timeoutMs: 20_000,
            maxRetries: 0, // Retry dikelola sendiri oleh backoff di sini
          },
        );

        if (response.data?.success) {
          console.log(
            `[SyncManager] ✅ Berhasil sync [${queueItem.id_transaksi}] ` +
            `(attempt ${attempt}/${MAX_ATTEMPT})`,
          );
          return true;
        }

        // Server merespons tapi menolak (business logic error)
        const serverMsg = response.data?.message || 'Server menolak transaksi.';
        console.warn(
          `[SyncManager] ⚠️ Server menolak [${queueItem.id_transaksi}]: ${serverMsg}`,
        );
        await updateSyncQueueStatus(queueItem.id, 'FAILED', serverMsg);
        return false;

      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);

        if (attempt === MAX_ATTEMPT) {
          // Sudah mencapai batas percobaan dalam siklus ini
          console.error(
            `[SyncManager] ❌ Gagal sync [${queueItem.id_transaksi}] ` +
            `setelah ${MAX_ATTEMPT} percobaan: ${errMsg}`,
          );
          await updateSyncQueueStatus(queueItem.id, 'FAILED', errMsg);
          return false;
        }

        // === [POS-B-10] === EXPONENTIAL BACKOFF DELAY
        const delayMs = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
        console.warn(
          `[SyncManager] 🔄 Retry ${attempt}/${MAX_ATTEMPT} untuk [${queueItem.id_transaksi}] ` +
          `— error: ${errMsg}. Menunggu ${delayMs / 1000}s...`,
        );
        await this._sleep(delayMs);

        // Batalkan jika koneksi sudah offline lagi
        if (!this._state.isOnline) {
          console.log('[SyncManager] Koneksi terputus saat retry. Batalkan.');
          await updateSyncQueueStatus(queueItem.id, 'FAILED', 'Connection lost during retry.');
          return false;
        }
      }
    }

    return false;
  }

  // ===========================================================================
  // FALLBACK POLLING (jika NetInfo tidak tersedia)
  // ===========================================================================
  private _startFallbackPolling(): void {
    if (this._fallbackTimer) return;

    this._fallbackTimer = setInterval(async () => {
      const isOnline = await this._checkConnectivityFallback();
      const wasOnline = this._state.isOnline;
      this._setState({ isOnline });

      if (isOnline && !wasOnline) {
        this._triggerSync();
      } else if (isOnline && this._state.pendingCount > 0) {
        // Coba sync periodik jika ada pending item
        this._triggerSync();
      }
    }, FALLBACK_POLL_INTERVAL_MS);

    console.log(`[SyncManager] 🔄 Polling aktif setiap ${FALLBACK_POLL_INTERVAL_MS / 1000}s`);
  }

  /** Cek koneksi dengan fetch ringan ke Google (fallback tanpa NetInfo) */
  private async _checkConnectivityFallback(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3_000);
      const res = await fetch('https://clients3.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.status === 204 || res.ok;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // UTILITIES INTERNAL
  // ===========================================================================

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private _chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  /** Lazy-load @react-native-community/netinfo */
  private _loadNetInfo(): any {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('@react-native-community/netinfo').default;
    } catch {
      console.warn(
        '[SyncManager] @react-native-community/netinfo tidak ditemukan. ' +
        'Install dengan: npm install @react-native-community/netinfo',
      );
      return null;
    }
  }
}

// =============================================================================
// Export singleton instance
// =============================================================================
export const syncManager = SyncManager.getInstance();

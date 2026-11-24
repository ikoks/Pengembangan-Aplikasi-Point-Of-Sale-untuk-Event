import {
  getPendingSyncQueue,
  updateSyncQueueStatus,
  updateDraftSyncStatus,
  resetFailedSyncQueue,
  SyncQueueItem,
} from '../database/offlineQueueManager';
import apiClient from './api/apiClient';

const SYNC_ENDPOINT = '/api/v1/checkout/sync';
const BATCH_SIZE = 10;
const BACKOFF_BASE_MS = 2_000;
const MAX_RETRY_PER_ITEM = 5;
const FALLBACK_POLL_INTERVAL_MS = 3_000;

export type SyncWorkerStatus =
  | 'IDLE'
  | 'WATCHING'
  | 'SYNCING'
  | 'ERROR'
  | 'STOPPED';

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

  static getInstance(): SyncManager {
    if (!SyncManager._instance) {
      SyncManager._instance = new SyncManager();
    }
    return SyncManager._instance;
  }

  getState(): SyncWorkerState {
    return { ...this._state };
  }

  private _setState(patch: Partial<SyncWorkerState>): void {
    this._state = { ...this._state, ...patch };
    this._stateListeners.forEach((fn) => fn(this.getState()));
  }

  subscribe(listener: (s: SyncWorkerState) => void): () => void {
    this._stateListeners.push(listener);
    listener(this.getState());
    return () => {
      this._stateListeners = this._stateListeners.filter((l) => l !== listener);
    };
  }

  async start(): Promise<void> {
    if (this._state.status === 'WATCHING' || this._state.status === 'SYNCING') {
      return;
    }

    this._setState({ status: 'WATCHING', lastError: null });
    const netInfoModule = this._loadNetInfo();

    if (netInfoModule) {
      this._netInfoUnsubscribe = netInfoModule.addEventListener(
        async (state: { isConnected: boolean | null }) => {
          let isOnline = Boolean(state?.isConnected);
          if (!isOnline) {
            isOnline = await this._checkConnectivityFallback();
          }
          const wasOnline = this._state.isOnline;
          this._setState({ isOnline });

          if (isOnline && !wasOnline) {
            this._triggerSync();
          }
        },
      );

      netInfoModule.fetch().then((state: { isConnected: boolean | null }) => {
        if (state?.isConnected) {
          this._setState({ isOnline: true });
          this._triggerSync();
        }
      }).catch(() => null);
    }

    // Perform immediate connectivity check on start
    this._checkConnectivityFallback().then((isOnline) => {
      if (isOnline) {
        this._setState({ isOnline: true });
        this._triggerSync();
      }
    });
    this._startFallbackPolling();
  }

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
  }

  private async _triggerSync(): Promise<void> {
    if (this._isSyncing) {
      return;
    }
    this._isSyncing = true;
    this._setState({ status: 'SYNCING' });

    try {
      await this._runSyncCycle();
    } finally {
      this._isSyncing = false;
      this._setState({
        status: 'WATCHING',
      });
    }
  }

  async triggerManualSync(): Promise<SyncBatchResult> {
    if (this._isSyncing) {
      return { attempted: 0, synced: 0, failed: 0, skipped: 0 };
    }

    // Reset antrean transaksi FAILED agar dapat dicoba ulang saat user menekan sync
    try {
      await resetFailedSyncQueue();
    } catch (_) {}

    this._isSyncing = true;
    this._setState({ status: 'SYNCING' });
    try {
      const isNowOnline = await this._checkConnectivityFallback();
      this._setState({ isOnline: isNowOnline });
      return await this._runSyncCycle();
    } finally {
      this._isSyncing = false;
      this._setState({ status: 'WATCHING' });
    }
  }

  private async _runSyncCycle(): Promise<SyncBatchResult> {
    const result: SyncBatchResult = { attempted: 0, synced: 0, failed: 0, skipped: 0 };

    try {
      const pendingItems = await getPendingSyncQueue(BATCH_SIZE * 3);
      this._setState({ pendingCount: pendingItems.length });

      if (pendingItems.length === 0) {
        return result;
      }

      const batches = this._chunkArray(pendingItems, BATCH_SIZE);

      for (const batch of batches) {
        const batchResult = await this._uploadBatch(batch);
        result.attempted += batchResult.attempted;
        result.synced += batchResult.synced;
        result.failed += batchResult.failed;
        result.skipped += batchResult.skipped;
      }

      // Hitung sisa antrean aktual setelah siklus upload
      const remainingItems = await getPendingSyncQueue(100);
      const newPendingCount = remainingItems.length;

      this._setState({
        pendingCount: newPendingCount,
        syncedCount: this._state.syncedCount + result.synced,
        failedCount: this._state.failedCount + result.failed,
        lastSyncAt: new Date().toISOString(),
        lastError: result.failed > 0
          ? `${result.failed} transaksi gagal disinkronkan.`
          : null,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this._setState({ lastError: msg, status: 'ERROR' });
    }

    return result;
  }

  private async _uploadBatch(batch: SyncQueueItem[]): Promise<SyncBatchResult> {
    const result: SyncBatchResult = { attempted: 0, synced: 0, failed: 0, skipped: 0 };

    for (const item of batch) {
      result.attempted++;

      if (item.retry_count >= MAX_RETRY_PER_ITEM) {
        await updateSyncQueueStatus(item.id, 'FAILED', 'Exceeded max retry limit.');
        await updateDraftSyncStatus(item.id_transaksi, 'Failed');
        result.failed++;
        result.skipped++;
        continue;
      }

      await updateSyncQueueStatus(item.id, 'SYNCING');

      let payload: SyncItemPayload;
      try {
        payload = JSON.parse(item.payload_json) as SyncItemPayload;
      } catch {
        await updateSyncQueueStatus(item.id, 'FAILED', 'Invalid JSON payload');
        result.failed++;
        continue;
      }

      const success = await this._uploadWithRetry(item, payload);

      if (success) {
        await updateSyncQueueStatus(item.id, 'SYNCED');
        await updateDraftSyncStatus(item.id_transaksi, 'Synced');
        result.synced++;
      } else {
        await updateDraftSyncStatus(item.id_transaksi, 'Failed');
        result.failed++;
      }
    }

    return result;
  }

  private async _uploadWithRetry(
    queueItem: SyncQueueItem,
    payload: SyncItemPayload,
  ): Promise<boolean> {
    const MAX_ATTEMPT = 3;

    // Normalisasi payload agar 100% kompatibel dengan skema SyncBatchRequest backend Laravel
    const rawAny = payload as any;
    const normalizedPayload = {
      id_transaksi: rawAny.id_transaksi || rawAny.id || queueItem.id_transaksi,
      id_shift: rawAny.id_shift || rawAny.idShift || undefined,
      id_cabang:
        typeof rawAny.id_cabang === 'string' && rawAny.id_cabang.length === 36
          ? rawAny.id_cabang
          : typeof rawAny.idCabang === 'string' && rawAny.idCabang.length === 36
          ? rawAny.idCabang
          : 'b1c2d3e4-0001-0001-0001-000000000001',
      id_sales:
        typeof rawAny.id_sales === 'string' && rawAny.id_sales.length === 36
          ? rawAny.id_sales
          : typeof rawAny.idSales === 'string' && rawAny.idSales.length === 36
          ? rawAny.idSales
          : 'd1e2f3a4-0001-0001-0001-000000000001',
      id_metode:
        rawAny.id_metode ||
        rawAny.idMetode ||
        (rawAny.paymentType === 'CASH'
          ? 'e5f6a7b8-0001-0001-0001-000000000001'
          : 'e5f6a7b8-0002-0002-0002-000000000002'),
      id_promo: rawAny.id_promo ?? null,
      nominal_promo: Number(rawAny.nominal_promo ?? 0),
      nama_pelanggan: rawAny.nama_pelanggan || rawAny.customerName || 'Pelanggan POS',
      nomor_referensi: rawAny.nomor_referensi || rawAny.referenceNumber || null,
      status: rawAny.status || 'Success',
      items: Array.isArray(rawAny.items)
        ? rawAny.items.map((i: any) => ({
            id_produk: i.id_produk || i.productId,
            quantity: Number(i.quantity) || 1,
            harga_produk: Number(i.harga_produk ?? i.price ?? i.subtotal) || 0,
            id_promo: i.id_promo ?? null,
            nominal_promo: Number(i.nominal_promo ?? 0),
          }))
        : [],
    };

    for (let attempt = 1; attempt <= MAX_ATTEMPT; attempt++) {
      try {
        const response = await apiClient.post<any>(
          SYNC_ENDPOINT,
          {
            transactions: [normalizedPayload],
          },
          {
            headers: {
              'X-Idempotency-Key': queueItem.id_transaksi,
            },
            timeoutMs: 15_000,
            maxRetries: 0,
          },
        );

        const resData = response.data;
        const isOk =
          resData?.success === true ||
          (Array.isArray(resData?.data?.synced_ids) &&
            resData.data.synced_ids.includes(queueItem.id_transaksi));

        if (isOk) {
          this._setState({ isOnline: true });
          return true;
        }

        const serverMsg = resData?.message || 'Server menolak transaksi.';
        await updateSyncQueueStatus(queueItem.id, 'FAILED', serverMsg);
        return false;

      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);

        if (attempt === MAX_ATTEMPT) {
          await updateSyncQueueStatus(queueItem.id, 'FAILED', errMsg);
          return false;
        }

        const delayMs = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
        await this._sleep(delayMs);

        if (!this._state.isOnline) {
          await updateSyncQueueStatus(queueItem.id, 'FAILED', 'Connection lost during retry.');
          return false;
        }
      }
    }

    return false;
  }

  private _startFallbackPolling(): void {
    if (this._fallbackTimer) return;

    this._fallbackTimer = setInterval(async () => {
      const isOnline = await this._checkConnectivityFallback();
      const wasOnline = this._state.isOnline;
      this._setState({ isOnline });

      if (isOnline && !wasOnline) {
        this._triggerSync();
      } else if (isOnline && this._state.pendingCount > 0) {
        this._triggerSync();
      }
    }, FALLBACK_POLL_INTERVAL_MS);
  }

  private async _checkConnectivityFallback(): Promise<boolean> {
    const { checkRealInternetConnection } = require('../utils/connectivityHelper');
    return await checkRealInternetConnection();
  }

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

  private _loadNetInfo(): any {
    try {
      
      return require('@react-native-community/netinfo').default;
    } catch {
      return null;
    }
  }
}

export const syncManager = SyncManager.getInstance();

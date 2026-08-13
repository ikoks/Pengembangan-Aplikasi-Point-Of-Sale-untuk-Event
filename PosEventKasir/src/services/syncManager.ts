import {
  getPendingSyncQueue,
  updateSyncQueueStatus,
  updateDraftSyncStatus,
  SyncQueueItem,
} from '../database/offlineQueueManager';
import apiClient from './api/apiClient';

const SYNC_ENDPOINT = '/api/v1/checkout/sync';
const BATCH_SIZE = 10;
const BACKOFF_BASE_MS = 2_000;
const MAX_RETRY_PER_ITEM = 5;
const FALLBACK_POLL_INTERVAL_MS = 5_000;

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
    const isNowOnline = await this._checkConnectivityFallback();
    this._setState({ isOnline: isNowOnline });

    if (!isNowOnline) {
      return { attempted: 0, synced: 0, failed: 0, skipped: 0 };
    }
    if (this._isSyncing) {
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
        if (!this._state.isOnline) {
          break;
        }
        const batchResult = await this._uploadBatch(batch);
        result.attempted += batchResult.attempted;
        result.synced += batchResult.synced;
        result.failed += batchResult.failed;
        result.skipped += batchResult.skipped;
      }

      this._setState({
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

    for (let attempt = 1; attempt <= MAX_ATTEMPT; attempt++) {
      try {
        const response = await apiClient.post<SyncServerResponse>(
          SYNC_ENDPOINT,
          {
            transactions: [payload],
          },
          {
            headers: {
              'X-Idempotency-Key': queueItem.id_transaksi,
            },
            timeoutMs: 20_000,
            maxRetries: 0,
          },
        );

        if (response.data?.success) {
          return true;
        }

        const serverMsg = response.data?.message || 'Server menolak transaksi.';
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

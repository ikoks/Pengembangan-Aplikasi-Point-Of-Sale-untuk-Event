import {
  CreateDraftPayload,
  ConfirmCheckoutPayload,
  DraftResponseData,
  ConfirmResponseData,
  createCheckoutDraft,
  confirmCheckout,
} from './api/checkoutApi';
import {
  saveDraftTransaction,
  DraftTransactionRecord,
} from '../database/offlineQueueManager';

export interface ProcessCheckoutPaymentData {
  tenantId?: string;
  items: Array<{
    productId: string;
    name?: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  totalAmount: number;
  paymentType: 'CASH' | 'NON_CASH';
  paymentMethod: string; // 'CASH', 'QRIS', 'EDC_DEBIT', 'TRANSFER', dll.
  paidAmount: number;
  changeAmount: number;
  referenceNumber?: string;
}

export interface ProcessCheckoutResult {
  success: boolean;
  mode: 'ONLINE' | 'OFFLINE';
  draftData?: DraftResponseData;
  transactionData?: ConfirmResponseData;
  offlineRecord?: DraftTransactionRecord;
  error?: string;
}

/**
 * 1. saveDraftLocal(cartData):
 * Generate ID unik (UUID v4) dan simpan payload keranjang ke tabel draft_transactions di SQLite
 * dengan status sync_status = 'PendingSync'.
 */
export async function saveDraftLocal(
  paymentData: ProcessCheckoutPaymentData
): Promise<DraftTransactionRecord> {
  const savedRecord = await saveDraftTransaction({
    totalAmount: paymentData.totalAmount,
    paymentType: paymentData.paymentType,
    paymentMethod: paymentData.paymentMethod,
    paidAmount: paymentData.paidAmount,
    changeAmount: paymentData.changeAmount,
    referenceNumber: paymentData.referenceNumber,
    items: paymentData.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      subtotal: i.subtotal,
    })),
  });

  return savedRecord;
}

/**
 * Helper untuk mengecek koneksi internet menggunakan NetInfo atau ping fallback
 */
export async function checkIsOnline(): Promise<boolean> {
  try {
    const NetInfo = require('@react-native-community/netinfo');
    if (NetInfo && typeof NetInfo.fetch === 'function') {
      const state = await NetInfo.fetch();
      return !!state.isConnected;
    }
  } catch (e) {
    // Fallback ping jika NetInfo tidak tersedia
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

/**
 * 2. processCheckout(cartData):
 * Cek koneksi internet:
 * - Jika ONLINE: Tembak POST request checkout ke API backend.
 * - Jika OFFLINE / GAGAL KONEKSI: Panggil saveDraftLocal untuk menyimpan transaksi
 *   ke buffer SQLite offline tanpa menghentikan proses kasir.
 */
export async function processCheckout(
  paymentData: ProcessCheckoutPaymentData
): Promise<ProcessCheckoutResult> {
  try {
    const isOnline = await checkIsOnline();

    if (isOnline) {
      try {
        // Step 1: Create draft on backend
        const draftPayload: CreateDraftPayload = {
          tenantId: paymentData.tenantId,
          items: paymentData.items,
          totalAmount: paymentData.totalAmount,
          paymentType: paymentData.paymentType,
        };

        const draftResponse = await createCheckoutDraft(draftPayload);

        // Step 2: Confirm checkout on backend
        const confirmPayload: ConfirmCheckoutPayload = {
          draftId: draftResponse.draftId,
          paymentMethod: paymentData.paymentMethod,
          paidAmount: paymentData.paidAmount,
          changeAmount: paymentData.changeAmount,
          referenceNumber: paymentData.referenceNumber,
        };

        const confirmResponse = await confirmCheckout(confirmPayload);

        return {
          success: true,
          mode: 'ONLINE',
          draftData: draftResponse,
          transactionData: confirmResponse,
        };
      } catch (httpError: any) {
        console.warn(
          'HTTP Checkout API Error, beralih ke penyimpanan draft offline SQLite:',
          httpError?.message || httpError
        );

        // Save to SQLite buffer
        const offlineRec = await saveDraftLocal(paymentData);

        return {
          success: true,
          mode: 'OFFLINE',
          offlineRecord: offlineRec,
          transactionData: {
            transactionId: offlineRec.id,
            receiptNumber: `REC-OFF-${offlineRec.id.slice(0, 8).toUpperCase()}`,
            status: 'SUCCESS',
            timestamp: offlineRec.created_at,
            paymentMethod: paymentData.paymentMethod,
            totalAmount: paymentData.totalAmount,
            paidAmount: paymentData.paidAmount,
            changeAmount: paymentData.changeAmount,
          },
        };
      }
    } else {
      // OFFLINE Mode
      const offlineRec = await saveDraftLocal(paymentData);

      return {
        success: true,
        mode: 'OFFLINE',
        offlineRecord: offlineRec,
        transactionData: {
          transactionId: offlineRec.id,
          receiptNumber: `REC-OFF-${offlineRec.id.slice(0, 8).toUpperCase()}`,
          status: 'SUCCESS',
          timestamp: offlineRec.created_at,
          paymentMethod: paymentData.paymentMethod,
          totalAmount: paymentData.totalAmount,
          paidAmount: paymentData.paidAmount,
          changeAmount: paymentData.changeAmount,
        },
      };
    }
  } catch (error: any) {
    console.error('Checkout processing error:', error);

    try {
      const offlineRec = await saveDraftLocal(paymentData);
      return {
        success: true,
        mode: 'OFFLINE',
        offlineRecord: offlineRec,
        transactionData: {
          transactionId: offlineRec.id,
          receiptNumber: `REC-OFF-${offlineRec.id.slice(0, 8).toUpperCase()}`,
          status: 'SUCCESS',
          timestamp: offlineRec.created_at,
          paymentMethod: paymentData.paymentMethod,
          totalAmount: paymentData.totalAmount,
          paidAmount: paymentData.paidAmount,
          changeAmount: paymentData.changeAmount,
        },
      };
    } catch (dbErr: any) {
      return {
        success: false,
        mode: 'OFFLINE',
        error: dbErr?.message || 'Gagal menyimpan transaksi draft offline.',
      };
    }
  }
}

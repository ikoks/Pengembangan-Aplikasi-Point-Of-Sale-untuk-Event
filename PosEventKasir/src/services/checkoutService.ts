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
  paymentMethod: string; 
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
let _netInfoCached: any = null;
export async function checkIsOnline(): Promise<boolean> {
  try {
    if (!_netInfoCached) {
      _netInfoCached = require('@react-native-community/netinfo');
    }
    if (_netInfoCached && typeof _netInfoCached.fetch === 'function') {
      const state = await _netInfoCached.fetch();
      return !!state.isConnected;
    }
  } catch (e) {
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
export async function processCheckout(
  paymentData: ProcessCheckoutPaymentData
): Promise<ProcessCheckoutResult> {
  try {
    const isOnline = await checkIsOnline();
    if (isOnline) {
      try {
        const draftPayload: CreateDraftPayload = {
          tenantId: paymentData.tenantId,
          items: paymentData.items,
          totalAmount: paymentData.totalAmount,
          paymentType: paymentData.paymentType,
        };
        const draftResponse = await createCheckoutDraft(draftPayload);
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

import { getApiBaseUrl, getApiContextSnapshot, ApiError } from './apiClient';

export interface CheckoutItemPayload {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreateDraftPayload {
  tenantId?: string;
  idCabang?: string;
  idSales?: string;
  idShift?: string;
  idMetode?: string;
  namaCabang?: string;
  customerName?: string;
  queueNumber?: string;
  salesMode?: string;
  operator?: string;
  notes?: string;
  items: CheckoutItemPayload[];
  totalAmount: number;
  paymentType: 'CASH' | 'NON_CASH';
}

export interface ConfirmCheckoutPayload {
  draftId: string;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  referenceNumber?: string;
  customerName?: string;
  queueNumber?: string;
  idCabang?: string;
  namaCabang?: string;
  salesMode?: string;
  operator?: string;
  notes?: string;
}

export interface DraftResponseData {
  draftId: string;
  totalAmount: number;
  status: 'DRAFT';
  createdAt?: string;
}

export interface ConfirmResponseData {
  transactionId: string;
  receiptNumber: string;
  status: 'SUCCESS';
  timestamp: string;
  draftId?: string;
  paymentMethod?: string;
  totalAmount?: number;
  paidAmount?: number;
  changeAmount?: number;
}

export interface RefundPayload {
  transactionId: string;
  otpAdmin: string;
  refundReason: string;
  refundAmount: number;
  cashierUser: string;
}

export interface RefundResponseData {
  refundId: string;
  transactionId: string;
  refundAmount: number;
  status: 'REFUNDED';
  timestamp: string;
}

const getBaseUrl = (): string => {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
};

function getAuthHeaders(): Record<string, string> {
  const ctx = getApiContextSnapshot();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  if (ctx.accessToken) {
    headers['Authorization'] = `Bearer ${ctx.accessToken}`;
  }
  return headers;
}

export async function createCheckoutDraft(
  payload: CreateDraftPayload
): Promise<DraftResponseData> {
  try {
    const ctx = getApiContextSnapshot();
    const DEFAULT_CABANG_ID = 'b1c2d3e4-0001-0001-0001-000000000001';
    const DEFAULT_SALES_ID = 'd1e2f3a4-0001-0001-0001-000000000001';

    const snakeBody = {
      id_cabang: payload.idCabang || ctx.branchId || DEFAULT_CABANG_ID,
      id_sales: payload.idSales || DEFAULT_SALES_ID,
      id_shift: payload.idShift || 'SHIFT-ACTIVE',
      id_metode: payload.idMetode || 'PAY-CASH-001',
      total_harga: payload.totalAmount,
      jenis_pembayaran: payload.paymentType,
      catatan: payload.notes || '',
      nama_pelanggan: payload.customerName || 'Pelanggan POS',
      items: payload.items.map((item) => ({
        id_produk: item.productId,
        harga_produk: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
    };

    const response = await fetch(`${getBaseUrl()}/checkout/draft`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(snakeBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new ApiError(
        `Gagal membuat draft checkout (HTTP ${response.status}): ${errorText}`,
        'SERVER_ERROR',
        response.status
      );
    }
    const json = await response.json();
    return {
      draftId: json?.data?.id_transaksi || json?.draftId || `TRX-${Date.now()}`,
      totalAmount: json?.data?.total_harga || payload.totalAmount,
      status: 'DRAFT',
      createdAt: json?.data?.created_at || new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error createCheckoutDraft:', error);
    throw error;
  }
}

export async function confirmCheckout(
  payload: ConfirmCheckoutPayload
): Promise<ConfirmResponseData> {
  try {
    const snakeBody = {
      metode_pembayaran: payload.paymentMethod,
      uang_diterima: payload.paidAmount,
      kembalian: payload.changeAmount,
      nomor_referensi: payload.referenceNumber || '',
    };

    const response = await fetch(
      `${getBaseUrl()}/checkout/${payload.draftId}/confirm`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(snakeBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new ApiError(
        `Gagal mengonfirmasi checkout (HTTP ${response.status}): ${errorText}`,
        'SERVER_ERROR',
        response.status
      );
    }
    const json = await response.json();
    return {
      transactionId: json?.data?.id_transaksi || payload.draftId,
      receiptNumber: json?.data?.nomor_struk || `NOTA-${Date.now().toString().slice(-6)}`,
      status: 'SUCCESS',
      timestamp: json?.data?.created_at || new Date().toISOString(),
      draftId: payload.draftId,
      paymentMethod: payload.paymentMethod,
      totalAmount: json?.data?.total_harga,
      paidAmount: payload.paidAmount,
      changeAmount: payload.changeAmount,
    };
  } catch (error: any) {
    console.error('Error confirmCheckout:', error);
    throw error;
  }
}

/**
 * Process Void/Refund Transaction calling official Laravel route POST /api/v1/checkout/{id}/void
 */
export async function processRefundTransaction(
  payload: RefundPayload
): Promise<RefundResponseData> {
  try {
    const snakeBody = {
      otp_admin: payload.otpAdmin,
      alasan_void: payload.refundReason,
      operator: payload.cashierUser,
    };

    const response = await fetch(`${getBaseUrl()}/checkout/${payload.transactionId}/void`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(snakeBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new ApiError(
        `Gagal memproses void/refund transaksi (HTTP ${response.status}): ${errorText}`,
        'SERVER_ERROR',
        response.status
      );
    }

    const json = await response.json();
    return {
      refundId: json?.data?.id_void || `VOID-${Date.now().toString().slice(-6)}`,
      transactionId: payload.transactionId,
      refundAmount: payload.refundAmount,
      status: 'REFUNDED',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new ApiError(`Gagal void transaksi: ${error?.message || String(error)}`, 'NETWORK_ERROR');
  }
}

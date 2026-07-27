export interface CheckoutItemPayload {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreateDraftPayload {
  tenantId?: string;
  items: CheckoutItemPayload[];
  totalAmount: number;
  paymentType: 'CASH' | 'NON_CASH';
}

export interface ConfirmCheckoutPayload {
  draftId: string;
  paymentMethod: string; // 'CASH', 'QRIS', 'EDC_DEBIT', 'TRANSFER', dll.
  paidAmount: number;
  changeAmount: number;
  referenceNumber?: string;
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

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * 1. Panggil HTTP POST ke /checkout/draft
 * Mengembalikan response data berisi { draftId, totalAmount, status: 'DRAFT' }
 */
export async function createCheckoutDraft(
  payload: CreateDraftPayload
): Promise<DraftResponseData> {
  try {
    const response = await fetch(`${API_BASE_URL}/checkout/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Gagal membuat draft checkout (HTTP ${response.status}): ${errorText}`
      );
    }

    const data: DraftResponseData = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error createCheckoutDraft:', error);
    throw error;
  }
}

/**
 * 2. Panggil HTTP POST ke /checkout/${payload.draftId}/confirm
 * Mengembalikan response data berisi detail transaksi sukses { transactionId, receiptNumber, status: 'SUCCESS', timestamp }
 */
export async function confirmCheckout(
  payload: ConfirmCheckoutPayload
): Promise<ConfirmResponseData> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/checkout/${payload.draftId}/confirm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Gagal mengonfirmasi checkout (HTTP ${response.status}): ${errorText}`
      );
    }

    const data: ConfirmResponseData = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error confirmCheckout:', error);
    throw error;
  }
}

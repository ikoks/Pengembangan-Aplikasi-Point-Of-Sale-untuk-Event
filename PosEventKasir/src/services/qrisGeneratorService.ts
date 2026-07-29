import { getApiBaseUrl } from './api/apiClient';

export interface QrisDataPayload {
  qrisRefId: string;
  merchantName: string;
  totalAmount: number;
  qrPayloadString: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export interface QrisPaymentStatusResponse {
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
  paidAt?: string;
  paymentMethod?: string;
  referenceNumber?: string;
}

export function generateDynamicQrisPayload(
  merchantName: string,
  totalAmount: number
): QrisDataPayload {
  const timestamp = Date.now();
  const qrisRefId = `QRIS-${timestamp.toString().slice(-8)}`;
  
  const formattedMerchant = merchantName.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 25);
  const qrPayloadString = `00020101021226670016COM.QRIS.ID01189360000000000000000215ID10200000000000303UMI51440014ID.CO.QRIS.WWW0215ID1020000000000052045812530336054${totalAmount.toString().padStart(6, '0')}5802ID59${formattedMerchant.length.toString().padStart(2, '0')}${formattedMerchant}6007BANDUNG61054011562170713${qrisRefId}6304A9C2`;

  const expiresInSeconds = 300;
  const expiresAt = new Date(timestamp + expiresInSeconds * 1000).toISOString();

  return {
    qrisRefId,
    merchantName,
    totalAmount,
    qrPayloadString,
    expiresAt,
    expiresInSeconds,
  };
}

export async function checkQrisPaymentStatus(
  qrisRefId: string
): Promise<QrisPaymentStatusResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/qris/status?ref=${qrisRefId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json();
      return {
        status: data.status || 'PAID',
        paidAt: data.paidAt || new Date().toISOString(),
        paymentMethod: 'QRIS_DINAMIS',
        referenceNumber: qrisRefId,
      };
    }

    return {
      status: 'PENDING',
      referenceNumber: qrisRefId,
    };
  } catch (error) {
    return {
      status: 'PENDING',
      referenceNumber: qrisRefId,
    };
  }
}

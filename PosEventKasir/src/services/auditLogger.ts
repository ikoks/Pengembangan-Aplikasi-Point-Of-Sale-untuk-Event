import { getDBConnection, saveAuditLog } from '../database/sqlite';
import { getApiBaseUrl } from './api/apiClient';

export type AuditActionType =
  | 'VOID_ORDER'
  | 'MANUAL_DISCOUNT'
  | 'PRICE_OVERRIDE'
  | 'SHIFT_OPEN'
  | 'SHIFT_CLOSE'
  | 'WASTE_ENTRY';

export const logAuditEvent = async (
  actionType: AuditActionType,
  description: string,
  operator: string = 'Kasir'
): Promise<string | null> => {
  try {
    const db = await getDBConnection();
    const logId = await saveAuditLog(db, {
      actionType,
      description,
      operator,
    });

    console.log(`[AuditLogger] Event logged: ${actionType} - ${description} (by ${operator})`);

    // Async sync to server
    try {
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/api/audit/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_id: logId,
          action_type: actionType,
          description,
          operator,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => null);
    } catch (_) {}

    return logId;
  } catch (err) {
    console.error('Failed to write audit log:', err);
    return null;
  }
};

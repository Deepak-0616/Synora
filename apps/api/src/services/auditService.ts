import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';

export interface AuditLogParams {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const id = uuidv4();
    const oldValuesStr = params.oldValues ? JSON.stringify(params.oldValues) : null;
    const newValuesStr = params.newValues ? JSON.stringify(params.newValues) : null;

    await db.execute(
      `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
      [
        id,
        params.actorId || null,
        params.action,
        params.entityType,
        params.entityId,
        oldValuesStr,
        newValuesStr,
        params.ipAddress || null
      ]
    );
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err);
  }
}

import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { Escalation, UserRole } from '../types/index.js';
import { ComplaintService } from './complaintService.js';
import { logAudit } from './auditService.js';
import { notifyUser } from './notificationService.js';

export class EscalationService {
  /**
   * Escalates an active case due to missed SLA, lack of institutional response, or high complexity
   */
  public static async escalateCase(
    complaintId: string,
    escalatedById: string,
    escalatedByRole: UserRole,
    reason: string,
    toBureauId?: string | null,
    ipAddress?: string
  ): Promise<Escalation> {
    if (escalatedByRole === 'complainant') {
      const err: any = new Error('Complainants cannot trigger administrative case escalation directly.');
      err.statusCode = 403;
      throw err;
    }

    const complaint = await db.queryOne<{ id: string; reference_number: string; bureau_id: string; complainant_id: string }>(
      'SELECT id, reference_number, bureau_id, complainant_id FROM complaints WHERE id = ?;',
      [complaintId]
    );

    if (!complaint) {
      const err: any = new Error('Complaint not found');
      err.statusCode = 404;
      throw err;
    }

    const id = uuidv4();
    await db.execute(
      `INSERT INTO escalations (id, complaint_id, escalated_by_id, from_bureau_id, to_bureau_id, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP);`,
      [id, complaintId, escalatedById, complaint.bureau_id, toBureauId || null, reason.trim()]
    );

    // Update complaint escalation flags
    await db.execute(
      `UPDATE complaints
       SET is_escalated = 1,
           escalation_reason = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [reason.trim(), complaintId]
    );

    // Transition status to ESCALATED
    await ComplaintService.transitionStatus(
      complaintId,
      'ESCALATED',
      escalatedById,
      escalatedByRole,
      `Case escalated: ${reason.trim()}`,
      undefined,
      ipAddress
    );

    await logAudit({
      actorId: escalatedById,
      action: 'CASE_ESCALATED',
      entityType: 'escalation',
      entityId: id,
      newValues: { complaintId, reason, toBureauId },
      ipAddress
    });

    // Notify all system admins and relevant bureau admins
    const admins = await db.query<{ id: string }>(
      `SELECT id FROM users WHERE role IN ('system_admin', 'bureau_admin') AND is_active = 1;`
    );
    for (const admin of admins) {
      await notifyUser({
        userId: admin.id,
        complaintId,
        type: 'CASE_ESCALATED',
        title: `Priority Case Escalated: ${complaint.reference_number}`,
        message: `Reason: ${reason.trim()}`,
        link: `/complaints/${complaintId}`
      });
    }

    const escalation = await db.queryOne<Escalation>(
      `SELECT e.*,
              u.full_name as escalated_by_name,
              fb.name as from_bureau_name,
              tb.name as to_bureau_name
       FROM escalations e
       LEFT JOIN users u ON e.escalated_by_id = u.id
       LEFT JOIN bureaus fb ON e.from_bureau_id = fb.id
       LEFT JOIN bureaus tb ON e.to_bureau_id = tb.id
       WHERE e.id = ?;`,
      [id]
    );

    if (!escalation) throw new Error('Failed to retrieve created escalation');
    return escalation;
  }

  public static async getComplaintEscalations(complaintId: string): Promise<Escalation[]> {
    return db.query<Escalation>(
      `SELECT e.*,
              u.full_name as escalated_by_name,
              fb.name as from_bureau_name,
              tb.name as to_bureau_name
       FROM escalations e
       LEFT JOIN users u ON e.escalated_by_id = u.id
       LEFT JOIN bureaus fb ON e.from_bureau_id = fb.id
       LEFT JOIN bureaus tb ON e.to_bureau_id = tb.id
       WHERE e.complaint_id = ?
       ORDER BY e.created_at DESC;`,
      [complaintId]
    );
  }
}

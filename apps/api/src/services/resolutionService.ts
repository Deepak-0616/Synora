import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { Resolution, UserRole } from '../types/index.js';
import { ComplaintService } from './complaintService.js';
import { logAudit } from './auditService.js';
import { notifyUser } from './notificationService.js';

export interface ProposeResolutionDto {
  findings: string;
  resolution_summary: string;
  complainant_visible_summary: string;
}

export class ResolutionService {
  /**
   * Proposes a formal resolution (Officer or Administrator)
   */
  public static async proposeResolution(
    complaintId: string,
    proposedById: string,
    proposedByRole: UserRole,
    dto: ProposeResolutionDto,
    ipAddress?: string
  ): Promise<Resolution> {
    if (proposedByRole === 'complainant') {
      const err: any = new Error('Complainants cannot propose official complaint resolutions.');
      err.statusCode = 403;
      throw err;
    }

    const complaint = await db.queryOne<{ id: string; reference_number: string; complainant_id: string }>(
      'SELECT id, reference_number, complainant_id FROM complaints WHERE id = ?;',
      [complaintId]
    );

    if (!complaint) {
      const err: any = new Error('Complaint not found');
      err.statusCode = 404;
      throw err;
    }

    const id = uuidv4();
    await db.execute(
      `INSERT INTO resolutions (
        id, complaint_id, proposed_by_id, approved_by_id, findings, resolution_summary, complainant_visible_summary, created_at
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, CURRENT_TIMESTAMP);`,
      [id, complaintId, proposedById, dto.findings.trim(), dto.resolution_summary.trim(), dto.complainant_visible_summary.trim()]
    );

    // If submitted by bureau_admin or system_admin, auto-approve directly;
    // If proposed by case officer, transition to AWAITING_INTERNAL_REVIEW for administrator signoff!
    if (proposedByRole === 'bureau_admin' || proposedByRole === 'system_admin') {
      return this.approveResolution(id, proposedById, proposedByRole, ipAddress);
    } else {
      await ComplaintService.transitionStatus(
        complaintId,
        'AWAITING_INTERNAL_REVIEW',
        proposedById,
        proposedByRole,
        'Resolution proposed by case officer; submitted for administrative approval',
        undefined,
        ipAddress
      );
    }

    await logAudit({
      actorId: proposedById,
      action: 'RESOLUTION_PROPOSED',
      entityType: 'resolution',
      entityId: id,
      newValues: { complaintId },
      ipAddress
    });

    const resolution = await this.getResolutionById(id, proposedByRole);
    if (!resolution) throw new Error('Failed to retrieve proposed resolution');
    return resolution;
  }

  /**
   * Approves resolution (Bureau Admin or System Admin only)
   */
  public static async approveResolution(
    resolutionId: string,
    approvedById: string,
    approvedByRole: UserRole,
    ipAddress?: string
  ): Promise<Resolution> {
    if (approvedByRole !== 'bureau_admin' && approvedByRole !== 'system_admin') {
      const err: any = new Error('Only bureau administrators or system administrators can formally approve resolutions.');
      err.statusCode = 403;
      throw err;
    }

    const resolution = await db.queryOne<Resolution>('SELECT * FROM resolutions WHERE id = ?;', [resolutionId]);
    if (!resolution) {
      const err: any = new Error('Resolution not found');
      err.statusCode = 404;
      throw err;
    }

    await db.execute(
      `UPDATE resolutions 
       SET approved_by_id = ?, approved_at = CURRENT_TIMESTAMP 
       WHERE id = ?;`,
      [approvedById, resolutionId]
    );

    // Transition complaint status to RESOLVED
    await ComplaintService.transitionStatus(
      resolution.complaint_id,
      'RESOLVED',
      approvedById,
      approvedByRole,
      'Formal resolution approved and finalized by competent administrative authority',
      undefined,
      ipAddress
    );

    await logAudit({
      actorId: approvedById,
      action: 'RESOLUTION_APPROVED',
      entityType: 'resolution',
      entityId: resolutionId,
      newValues: { complaintId: resolution.complaint_id },
      ipAddress
    });

    // Notify complainant
    const comp = await db.queryOne<{ reference_number: string; complainant_id: string }>(
      'SELECT reference_number, complainant_id FROM complaints WHERE id = ?;',
      [resolution.complaint_id]
    );

    if (comp) {
      await notifyUser({
        userId: comp.complainant_id,
        complaintId: resolution.complaint_id,
        type: 'RESOLUTION',
        title: 'Complaint Resolved',
        message: `Your grievance ${comp.reference_number} has been investigated and resolved. Please check the resolution details in your portal.`,
        link: `/complaints/${resolution.complaint_id}`
      });
    }

    const updated = await this.getResolutionById(resolutionId, approvedByRole);
    if (!updated) throw new Error('Failed to retrieve approved resolution');
    return updated;
  }

  public static async getComplaintResolution(complaintId: string, requesterRole: UserRole): Promise<Resolution | null> {
    const resolution = await db.queryOne<Resolution>(
      `SELECT r.*,
              p.full_name as proposed_by_name,
              a.full_name as approved_by_name
       FROM resolutions r
       LEFT JOIN users p ON r.proposed_by_id = p.id
       LEFT JOIN users a ON r.approved_by_id = a.id
       WHERE r.complaint_id = ?
       ORDER BY r.created_at DESC
       LIMIT 1;`,
      [complaintId]
    );

    if (!resolution) return null;

    // Strict privacy boundary: If complainant, hide internal findings & internal resolution summary
    if (requesterRole === 'complainant') {
      return {
        ...resolution,
        findings: '[Protected internal investigative finding]',
        resolution_summary: resolution.complainant_visible_summary
      };
    }

    return resolution;
  }

  public static async getResolutionById(id: string, requesterRole: UserRole): Promise<Resolution | null> {
    const res = await db.queryOne<Resolution>(
      `SELECT r.*,
              p.full_name as proposed_by_name,
              a.full_name as approved_by_name
       FROM resolutions r
       LEFT JOIN users p ON r.proposed_by_id = p.id
       LEFT JOIN users a ON r.approved_by_id = a.id
       WHERE r.id = ?;`,
      [id]
    );

    if (!res) return null;

    if (requesterRole === 'complainant') {
      return {
        ...res,
        findings: '[Protected internal investigative finding]',
        resolution_summary: res.complainant_visible_summary
      };
    }

    return res;
  }
}

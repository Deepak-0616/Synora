import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { InformationRequest, UserRole } from '../types/index.js';
import { ComplaintService } from './complaintService.js';
import { logAudit } from './auditService.js';
import { notifyUser } from './notificationService.js';

export class RFIService {
  /**
   * Officer requests additional information or proof from complainant
   */
  public static async createRFI(
    complaintId: string,
    officerId: string,
    officerRole: UserRole,
    requestDetails: string,
    ipAddress?: string
  ): Promise<InformationRequest> {
    if (officerRole === 'complainant') {
      const err: any = new Error('Complainants cannot issue information requests to themselves.');
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
      `INSERT INTO information_requests (
        id, complaint_id, officer_id, complainant_id, request_details, status, requested_at
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP);`,
      [id, complaintId, officerId, complaint.complainant_id, requestDetails.trim()]
    );

    // Transition complaint status to AWAITING_COMPLAINANT_RESPONSE
    await ComplaintService.transitionStatus(
      complaintId,
      'AWAITING_COMPLAINANT_RESPONSE',
      officerId,
      officerRole,
      'Information Request (RFI) dispatched to complainant',
      undefined,
      ipAddress
    );

    await logAudit({
      actorId: officerId,
      action: 'RFI_CREATED',
      entityType: 'information_request',
      entityId: id,
      newValues: { complaintId, requestDetails },
      ipAddress
    });

    await notifyUser({
      userId: complaint.complainant_id,
      complaintId,
      type: 'RFI_REQUESTED',
      title: 'Action Required: Additional Information Requested',
      message: `The case officer investigating your complaint ${complaint.reference_number} has requested additional information. Please provide your response.`,
      link: `/complaints/${complaintId}`
    });

    const rfi = await this.getRFIById(id);
    if (!rfi) throw new Error('Failed to retrieve created RFI');
    return rfi;
  }

  /**
   * Complainant responds to information request
   */
  public static async respondRFI(
    rfiId: string,
    complainantId: string,
    responseDetails: string,
    ipAddress?: string
  ): Promise<InformationRequest> {
    const rfi = await this.getRFIById(rfiId);
    if (!rfi) {
      const err: any = new Error('Information request not found');
      err.statusCode = 404;
      throw err;
    }

    if (rfi.complainant_id !== complainantId) {
      const err: any = new Error('Access denied. You can only respond to requests addressed to you.');
      err.statusCode = 403;
      throw err;
    }

    if (rfi.status !== 'PENDING') {
      const err: any = new Error(`This information request has already been ${rfi.status.toLowerCase()}.`);
      err.statusCode = 400;
      throw err;
    }

    await db.execute(
      `UPDATE information_requests
       SET response_details = ?,
           status = 'RESPONDED',
           responded_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [responseDetails.trim(), rfiId]
    );

    // Transition complaint status back to IN_PROGRESS
    await ComplaintService.transitionStatus(
      rfi.complaint_id,
      'IN_PROGRESS',
      complainantId,
      'complainant',
      'Complainant provided response to information request',
      undefined,
      ipAddress
    );

    await logAudit({
      actorId: complainantId,
      action: 'RFI_RESPONDED',
      entityType: 'information_request',
      entityId: rfiId,
      newValues: { complaintId: rfi.complaint_id },
      ipAddress
    });

    // Notify officer
    await notifyUser({
      userId: rfi.officer_id,
      complaintId: rfi.complaint_id,
      type: 'RFI_RESPONDED',
      title: 'Complainant Responded to Information Request',
      message: `Complainant has submitted response for case information request.`,
      link: `/complaints/${rfi.complaint_id}`
    });

    const updated = await this.getRFIById(rfiId);
    if (!updated) throw new Error('Failed to retrieve updated RFI');
    return updated;
  }

  public static async getComplaintRFIs(complaintId: string): Promise<InformationRequest[]> {
    return db.query<InformationRequest>(
      `SELECT r.*,
              o.full_name as officer_name,
              c.full_name as complainant_name
       FROM information_requests r
       LEFT JOIN users o ON r.officer_id = o.id
       LEFT JOIN users c ON r.complainant_id = c.id
       WHERE r.complaint_id = ?
       ORDER BY r.requested_at DESC;`,
      [complaintId]
    );
  }

  public static async getRFIById(id: string): Promise<InformationRequest | null> {
    return db.queryOne<InformationRequest>(
      `SELECT r.*,
              o.full_name as officer_name,
              c.full_name as complainant_name
       FROM information_requests r
       LEFT JOIN users o ON r.officer_id = o.id
       LEFT JOIN users c ON r.complainant_id = c.id
       WHERE r.id = ?;`,
      [id]
    );
  }
}

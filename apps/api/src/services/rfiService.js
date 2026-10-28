import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import { ComplaintService } from "./complaintService.js";
import { logAudit } from "./auditService.js";
import { notifyUser } from "./notificationService.js";
export class RFIService {
  /**
   * Officer requests additional information or proof from complainant
   */
  static async createRFI(complaintId, officerId, officerRole, requestDetails, ipAddress) {
    if (officerRole === "complainant") {
      const err = new Error("Complainants cannot issue information requests to themselves.");
      err.statusCode = 403;
      throw err;
    }
    const complaint = await db.queryOne(
      "SELECT id, reference_number, complainant_id FROM complaints WHERE id = ?;",
      [complaintId]
    );
    if (!complaint) {
      const err = new Error("Complaint not found");
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
    await ComplaintService.transitionStatus(
      complaintId,
      "AWAITING_COMPLAINANT_RESPONSE",
      officerId,
      officerRole,
      "Information Request (RFI) dispatched to complainant",
      void 0,
      ipAddress
    );
    await logAudit({
      actorId: officerId,
      action: "RFI_CREATED",
      entityType: "information_request",
      entityId: id,
      newValues: { complaintId, requestDetails },
      ipAddress
    });
    await notifyUser({
      userId: complaint.complainant_id,
      complaintId,
      type: "RFI_REQUESTED",
      title: "Action Required: Additional Information Requested",
      message: `The case officer investigating your complaint ${complaint.reference_number} has requested additional information. Please provide your response.`,
      link: `/complaints/${complaintId}`
    });
    const rfi = await this.getRFIById(id);
    if (!rfi) throw new Error("Failed to retrieve created RFI");
    return rfi;
  }
  /**
   * Complainant or authorized staff responds to information request
   */
  static async respondRFI(rfiId, userId, userRole, responseDetails, ipAddress) {
    const rfi = await this.getRFIById(rfiId);
    if (!rfi) {
      const err = new Error("Information request not found");
      err.statusCode = 404;
      throw err;
    }
    const isOwner = rfi.complainant_id === userId;
    const isStaffOrAdmin = userRole === "system_admin" || userRole === "bureau_admin" || userRole === "officer";
    if (!isOwner && !isStaffOrAdmin) {
      const err = new Error("Access denied. You can only respond to requests addressed to you.");
      err.statusCode = 403;
      throw err;
    }
    const isUpdate = rfi.status === "RESPONDED";
    await db.execute(
      `UPDATE information_requests
       SET response_details = ?,
           status = 'RESPONDED',
           responded_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [responseDetails.trim(), rfiId]
    );

    // If complaint was awaiting complainant response, transition to IN_PROGRESS
    const complaint = await db.queryOne("SELECT status FROM complaints WHERE id = ?;", [rfi.complaint_id]);
    if (complaint && complaint.status === "AWAITING_COMPLAINANT_RESPONSE") {
      await ComplaintService.transitionStatus(
        rfi.complaint_id,
        "IN_PROGRESS",
        userId,
        userRole || "complainant",
        isStaffOrAdmin && !isOwner
          ? "Investigation team recorded response to information request"
          : "Complainant provided response to information request",
        void 0,
        ipAddress
      );
    }

    await logAudit({
      actorId: userId,
      action: isUpdate ? "RFI_RESPONSE_UPDATED" : "RFI_RESPONDED",
      entityType: "information_request",
      entityId: rfiId,
      newValues: { complaintId: rfi.complaint_id, isUpdate },
      ipAddress
    });

    if (rfi.officer_id && !isStaffOrAdmin) {
      await notifyUser({
        userId: rfi.officer_id,
        complaintId: rfi.complaint_id,
        type: isUpdate ? "RFI_UPDATED" : "RFI_RESPONDED",
        title: isUpdate ? "Complainant Updated Information Response" : "Complainant Responded to Information Request",
        message: `Response details have been updated for case clarification inquiry.`,
        link: `/complaints/${rfi.complaint_id}`
      });
    } else if (rfi.complainant_id && isStaffOrAdmin) {
      await notifyUser({
        userId: rfi.complainant_id,
        complaintId: rfi.complaint_id,
        type: "RFI_RECORDED_BY_OFFICER",
        title: "Official Response Statement Recorded",
        message: `The vigilance desk recorded a statement regarding case clarification.`,
        link: `/complaints/${rfi.complaint_id}`
      });
    }

    const updated = await this.getRFIById(rfiId);
    if (!updated) throw new Error("Failed to retrieve updated RFI");
    return updated;
  }
  static async getComplaintRFIs(complaintId) {
    return db.query(
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
  static async getRFIById(id) {
    return db.queryOne(
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

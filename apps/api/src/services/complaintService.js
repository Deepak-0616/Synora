import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import { generateComplaintReference } from "../utils/referenceGenerator.js";
import { calculateSLATarget, evaluateSLAStatus } from "../utils/sla.js";
import { logAudit } from "./auditService.js";
import { notifyUser } from "./notificationService.js";
import { AIService } from "./aiService.js";
export class ComplaintService {
  /**
   * Submits a new complaint with automatic reference number, SLA target date, and initial history
   */
  static async createComplaint(input) {
    const id = uuidv4();
    const referenceNumber = await generateComplaintReference();
    const { targetResolutionDate } = calculateSLATarget(input.priority);
    let bureauId = input.bureau_id || null;
    let classification = null;
    try {
      classification = await AIService.classifyComplaint(input.title, input.description);
      if (!bureauId && classification.suggested_bureau_id) {
        bureauId = classification.suggested_bureau_id;
      }
    } catch (e) {
      console.warn("AI classification failed gracefully:", e);
    }
    await db.execute(
      `INSERT INTO complaints (
        id, reference_number, complainant_id, title, description, category, priority, status,
        institution_name, institution_id, incident_date, bureau_id, assigned_officer_id,
        target_resolution_date, is_escalated, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, ?, ?, NULL, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      [
        id,
        referenceNumber,
        input.complainantId,
        input.title.trim(),
        input.description.trim(),
        input.category,
        input.priority,
        input.institution_name.trim(),
        input.institution_id || null,
        input.incident_date || null,
        bureauId,
        targetResolutionDate
      ]
    );
    await db.execute(
      `INSERT INTO complaint_status_history (id, complaint_id, actor_id, from_status, to_status, note, created_at)
       VALUES (?, ?, ?, NULL, 'SUBMITTED', 'Grievance submitted by complainant', CURRENT_TIMESTAMP);`,
      [uuidv4(), id, input.complainantId]
    );
    if (classification) {
      try {
        const summary = AIService.summarizeComplaint(input.title, input.description);
        await db.execute(
          `INSERT INTO ai_analyses (id, complaint_id, suggested_category, suggested_bureau_id, confidence, summary, model_name, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'synora-heuristics-v1', CURRENT_TIMESTAMP);`,
          [
            uuidv4(),
            id,
            classification.suggested_category,
            classification.suggested_bureau_id,
            classification.confidence,
            JSON.stringify(summary)
          ]
        );
      } catch (err) {
        console.error("Failed to save initial AI analysis:", err);
      }
    }
    await logAudit({
      actorId: input.complainantId,
      action: "COMPLAINT_CREATED",
      entityType: "complaint",
      entityId: id,
      newValues: { referenceNumber, priority: input.priority, category: input.category },
      ipAddress: input.ipAddress
    });
    await notifyUser({
      userId: input.complainantId,
      complaintId: id,
      type: "SUBMISSION_CONFIRMED",
      title: "Complaint Registered Successfully",
      message: `Your grievance has been registered with reference ID: ${referenceNumber}. You can monitor its investigation progress in real time.`,
      link: `/complaints/${id}`
    });
    const complaint = await this.getComplaintById(id, input.complainantId, "complainant");
    if (!complaint) throw new Error("Failed to retrieve newly created complaint");
    return complaint;
  }
  /**
   * Retrieves complaints matching role-scoped authorization boundaries, search, and filters
   */
  static async listComplaints(options) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 15));
    const offset = (page - 1) * limit;
    const whereClauses = [];
    const params = [];
    if (options.userRole === "complainant") {
      whereClauses.push("c.complainant_id = ?");
      params.push(options.userId);
    } else if (options.userRole === "officer") {
      if (options.userBureauId) {
        whereClauses.push("(c.assigned_officer_id = ? OR (c.bureau_id = ? AND c.assigned_officer_id IS NULL))");
        params.push(options.userId, options.userBureauId);
      } else {
        whereClauses.push("c.assigned_officer_id = ?");
        params.push(options.userId);
      }
    } else if (options.userRole === "bureau_admin") {
      if (options.userBureauId) {
        whereClauses.push("c.bureau_id = ?");
        params.push(options.userBureauId);
      }
    }
    if (options.status) {
      whereClauses.push("c.status = ?");
      params.push(options.status);
    }
    if (options.category) {
      whereClauses.push("c.category = ?");
      params.push(options.category);
    }
    if (options.priority) {
      whereClauses.push("c.priority = ?");
      params.push(options.priority);
    }
    if (options.bureau_id && (options.userRole === "system_admin" || options.userRole === "reviewer")) {
      whereClauses.push("c.bureau_id = ?");
      params.push(options.bureau_id);
    }
    if (options.search && options.search.trim().length > 0) {
      const searchPattern = `%${options.search.trim()}%`;
      whereClauses.push("(c.reference_number LIKE ? OR c.title LIKE ? OR c.institution_name LIKE ?)");
      params.push(searchPattern, searchPattern, searchPattern);
    }
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const countQuery = `SELECT COUNT(*) as count FROM complaints c ${whereSql};`;
    const countRes = await db.queryOne(countQuery, params);
    const total = countRes?.count || 0;
    const dataQuery = `
      SELECT c.*,
             u.full_name as complainant_name,
             u.email as complainant_email,
             b.name as bureau_name,
             b.code as bureau_code,
             o.full_name as assigned_officer_name
      FROM complaints c
      LEFT JOIN users u ON c.complainant_id = u.id
      LEFT JOIN bureaus b ON c.bureau_id = b.id
      LEFT JOIN users o ON c.assigned_officer_id = o.id
      ${whereSql}
      ORDER BY 
        CASE WHEN c.priority = 'CRITICAL' THEN 1
             WHEN c.priority = 'HIGH' THEN 2
             WHEN c.priority = 'MEDIUM' THEN 3
             ELSE 4 END,
        c.created_at DESC
      LIMIT ? OFFSET ?;
    `;
    const complaints = await db.query(dataQuery, [...params, limit, offset]);
    const enhanced = complaints.map((c) => {
      const isResolved = c.status === "RESOLVED" || c.status === "CLOSED";
      const sla = evaluateSLAStatus(c.target_resolution_date, c.created_at, isResolved);
      return {
        ...c,
        sla_status: sla.status,
        days_remaining: sla.daysRemaining
      };
    });
    return {
      complaints: enhanced,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  /**
   * Retrieves single complaint details after checking user permission scope
   */
  static async getComplaintById(id, userId, userRole, userBureauId) {
    if (!userBureauId && userId && (userRole === "officer" || userRole === "bureau_admin")) {
      const userRec = await db.queryOne("SELECT bureau_id FROM users WHERE id = ?;", [userId]);
      if (userRec) {
        userBureauId = userRec.bureau_id;
      }
    }
    const complaint = await db.queryOne(
      `SELECT c.*,
              u.full_name as complainant_name,
              u.email as complainant_email,
              b.name as bureau_name,
              b.code as bureau_code,
              o.full_name as assigned_officer_name
       FROM complaints c
       LEFT JOIN users u ON c.complainant_id = u.id
       LEFT JOIN bureaus b ON c.bureau_id = b.id
       LEFT JOIN users o ON c.assigned_officer_id = o.id
       WHERE c.id = ?;`,
      [id]
    );
    if (!complaint) return null;
    if (userRole === "complainant" && complaint.complainant_id !== userId) {
      const err = new Error("Access denied. You are not authorized to view this complaint.");
      err.statusCode = 403;
      throw err;
    }
    if (userRole === "officer") {
      const isAssigned = complaint.assigned_officer_id === userId;
      const isInBureau = userBureauId && complaint.bureau_id === userBureauId;
      if (!isAssigned && !isInBureau) {
        const err = new Error("Access denied. This complaint is not assigned to you or your bureau.");
        err.statusCode = 403;
        throw err;
      }
    }
    if (userRole === "bureau_admin") {
      if (userBureauId && complaint.bureau_id !== userBureauId) {
        const err = new Error("Access denied. This complaint belongs to another bureau.");
        err.statusCode = 403;
        throw err;
      }
    }
    const isResolved = complaint.status === "RESOLVED" || complaint.status === "CLOSED";
    const sla = evaluateSLAStatus(complaint.target_resolution_date, complaint.created_at, isResolved);
    return {
      ...complaint,
      sla_status: sla.status,
      days_remaining: sla.daysRemaining,
      allowed_transitions: this.getAllowedTransitions(complaint.status, userRole)
    };
  }
  /**
   * Retrieves public timeline / status transitions for a complaint
   */
  static async getStatusHistory(complaintId) {
    return db.query(
      `SELECT h.*, u.full_name as actor_name, u.role as actor_role
       FROM complaint_status_history h
       LEFT JOIN users u ON h.actor_id = u.id
       WHERE h.complaint_id = ?
       ORDER BY h.created_at ASC;`,
      [complaintId]
    );
  }
  /**
   * Executes a controlled workflow status transition with state-machine validation
   */
  static async transitionStatus(complaintId, toStatus, actorId, actorRole, note, rejectionReason, ipAddress) {
    const complaint = await db.queryOne("SELECT * FROM complaints WHERE id = ?;", [complaintId]);
    if (!complaint) {
      const err = new Error("Complaint not found");
      err.statusCode = 404;
      throw err;
    }
    const currentStatus = complaint.status;
    if (currentStatus === toStatus) {
      return complaint;
    }
    this.validateTransition(currentStatus, toStatus, actorRole);
    let resolvedAt = complaint.resolved_at || null;
    let closedAt = complaint.closed_at || null;
    if (toStatus === "RESOLVED") {
      resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
    } else if (toStatus === "CLOSED") {
      closedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    await db.execute(
      `UPDATE complaints
       SET status = ?,
           resolved_at = COALESCE(?, resolved_at),
           closed_at = COALESCE(?, closed_at),
           rejection_reason = COALESCE(?, rejection_reason),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [toStatus, resolvedAt, closedAt, rejectionReason || null, complaintId]
    );
    await db.execute(
      `INSERT INTO complaint_status_history (id, complaint_id, actor_id, from_status, to_status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
      [uuidv4(), complaintId, actorId, currentStatus, toStatus, note || null]
    );
    await logAudit({
      actorId,
      action: "STATUS_TRANSITION",
      entityType: "complaint",
      entityId: complaintId,
      oldValues: { status: currentStatus },
      newValues: { status: toStatus, note },
      ipAddress
    });
    await notifyUser({
      userId: complaint.complainant_id,
      complaintId,
      type: "STATUS_UPDATE",
      title: `Case Status Updated: ${toStatus.replace(/_/g, " ")}`,
      message: `Your grievance ${complaint.reference_number} has been updated to '${toStatus.replace(/_/g, " ")}'.`,
      link: `/complaints/${complaintId}`
    });
    const updated = await this.getComplaintById(complaintId, actorId, actorRole);
    if (!updated) throw new Error("Failed to retrieve updated complaint");
    return updated;
  }
  /**
   * Assigns or reassigns complaint to a bureau and officer
   */
  static async assignComplaint(complaintId, bureauId, officerId, assignedById, assignedByRole, notes, ipAddress) {
    const complaint = await db.queryOne("SELECT * FROM complaints WHERE id = ?;", [complaintId]);
    if (!complaint) {
      const err = new Error("Complaint not found");
      err.statusCode = 404;
      throw err;
    }
    if (assignedByRole !== "system_admin" && assignedByRole !== "bureau_admin") {
      const err = new Error("Only administrators can assign or reassign complaint cases.");
      err.statusCode = 403;
      throw err;
    }
    if (officerId) {
      const officer = await db.queryOne(
        "SELECT id, role, bureau_id, is_active FROM users WHERE id = ?;",
        [officerId]
      );
      if (!officer || officer.role !== "officer" || !officer.is_active) {
        const err = new Error("Selected user is not an active case officer.");
        err.statusCode = 400;
        throw err;
      }
      if (bureauId && officer.bureau_id && officer.bureau_id !== bureauId) {
        const err = new Error("Selected case officer does not belong to the chosen bureau.");
        err.statusCode = 400;
        throw err;
      }
    }
    const newBureauId = bureauId !== void 0 ? bureauId : complaint.bureau_id;
    const newOfficerId = officerId !== void 0 ? officerId : complaint.assigned_officer_id;
    await db.execute(
      `UPDATE complaints
       SET bureau_id = ?,
           assigned_officer_id = ?,
           status = CASE WHEN status = 'SUBMITTED' THEN 'UNDER_REVIEW' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [newBureauId, newOfficerId, complaintId]
    );
    await db.execute(
      `INSERT INTO assignments (id, complaint_id, bureau_id, officer_id, assigned_by_id, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
      [uuidv4(), complaintId, newBureauId, newOfficerId, assignedById, notes || null]
    );
    await logAudit({
      actorId: assignedById,
      action: "CASE_ASSIGNMENT",
      entityType: "complaint",
      entityId: complaintId,
      oldValues: { bureau_id: complaint.bureau_id, assigned_officer_id: complaint.assigned_officer_id },
      newValues: { bureau_id: newBureauId, assigned_officer_id: newOfficerId, notes },
      ipAddress
    });
    if (newOfficerId) {
      await notifyUser({
        userId: newOfficerId,
        complaintId,
        type: "CASE_ASSIGNED",
        title: "New Case Assigned to You",
        message: `You have been assigned to investigate case ${complaint.reference_number}.`,
        link: `/complaints/${complaintId}`
      });
    }
    const updated = await this.getComplaintById(complaintId, assignedById, assignedByRole);
    if (!updated) throw new Error("Failed to retrieve updated complaint");
    return updated;
  }
  /**
   * Returns list of allowed next status values from a given status for a given actor role
   */
  static getAllowedTransitions(from, actorRole) {
    const isAdmin = actorRole === "system_admin" || actorRole === "bureau_admin";

    const standardTransitions = {
      SUBMITTED: [
        "ACKNOWLEDGED",
        "UNDER_REVIEW",
        "IN_PROGRESS",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED",
        "REJECTED"
      ],
      ACKNOWLEDGED: [
        "UNDER_REVIEW",
        "IN_PROGRESS",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED",
        "REJECTED"
      ],
      UNDER_REVIEW: [
        "ACKNOWLEDGED",
        "IN_PROGRESS",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED",
        "REJECTED"
      ],
      IN_PROGRESS: [
        "ACKNOWLEDGED",
        "UNDER_REVIEW",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED",
        "CLOSED"
      ],
      AWAITING_COMPLAINANT_RESPONSE: [
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "ACKNOWLEDGED",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED"
      ],
      AWAITING_INTERNAL_REVIEW: [
        "RESOLVED",
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "ACKNOWLEDGED",
        "AWAITING_COMPLAINANT_RESPONSE",
        "ESCALATED",
        "CLOSED"
      ],
      RESOLVED: [
        "CLOSED",
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "ACKNOWLEDGED",
        "AWAITING_INTERNAL_REVIEW"
      ],
      CLOSED: isAdmin ? ["IN_PROGRESS", "UNDER_REVIEW", "ACKNOWLEDGED", "RESOLVED"] : [],
      ESCALATED: [
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "ACKNOWLEDGED",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "CLOSED"
      ],
      REJECTED: isAdmin ? ["UNDER_REVIEW", "IN_PROGRESS", "ACKNOWLEDGED"] : []
    };

    let allowed = standardTransitions[from] || [];

    // Filter out REJECTED and CLOSED if not an administrator
    if (!isAdmin) {
      allowed = allowed.filter((s) => s !== "REJECTED" && s !== "CLOSED");
    }

    // Complainants cannot unilaterally resolve cases
    if (actorRole === "complainant") {
      allowed = allowed.filter((s) => s !== "RESOLVED");
    }

    return allowed;
  }

  /**
   * Internal validation of the lifecycle state machine
   */
  static validateTransition(from, to, actorRole) {
    const allowed = this.getAllowedTransitions(from, actorRole);
    if (!allowed.includes(to)) {
      const err = new Error(
        `Invalid workflow transition: Cannot move complaint status from '${from}' to '${to}'. Allowed next states: [${allowed.join(", ") || "None"}]`
      );
      err.statusCode = 400;
      throw err;
    }
    if (to === "REJECTED" || to === "CLOSED") {
      if (actorRole !== "system_admin" && actorRole !== "bureau_admin") {
        const err = new Error(`Only bureau or system administrators have authority to mark a case as '${to}'.`);
        err.statusCode = 403;
        throw err;
      }
    }
    if (to === "RESOLVED" && actorRole === "complainant") {
      const err = new Error("Complainants cannot unilaterally mark a complaint as resolved.");
      err.statusCode = 403;
      throw err;
    }
  }
}

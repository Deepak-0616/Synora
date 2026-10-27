import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import { logAudit } from "./auditService.js";
export class NotesService {
  /**
   * Adds an internal confidential investigation note.
   * STRICT ACCESS CONTROL: Complainants are permanently forbidden from creating or reading internal notes.
   */
  static async addNote(complaintId, authorId, authorRole, noteText, ipAddress) {
    if (authorRole === "complainant") {
      const err = new Error("Access denied. Complainants are not permitted to add internal investigation notes.");
      err.statusCode = 403;
      throw err;
    }
    const id = uuidv4();
    await db.execute(
      `INSERT INTO internal_notes (id, complaint_id, author_id, note, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);`,
      [id, complaintId, authorId, noteText.trim()]
    );
    await logAudit({
      actorId: authorId,
      action: "INTERNAL_NOTE_ADDED",
      entityType: "internal_note",
      entityId: id,
      newValues: { complaintId },
      ipAddress
    });
    const note = await db.queryOne(
      `SELECT n.*, u.full_name as author_name, u.role as author_role
       FROM internal_notes n
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.id = ?;`,
      [id]
    );
    if (!note) throw new Error("Failed to retrieve created note");
    return note;
  }
  /**
   * Retrieves internal notes for a case.
   * STRICT ACCESS CONTROL: Complainants receive a 403 error.
   */
  static async getNotes(complaintId, requesterRole) {
    if (requesterRole === "complainant") {
      const err = new Error("Access denied. Complainants are not permitted to access internal investigation notes.");
      err.statusCode = 403;
      throw err;
    }
    return db.query(
      `SELECT n.*, u.full_name as author_name, u.role as author_role
       FROM internal_notes n
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.complaint_id = ?
       ORDER BY n.created_at DESC;`,
      [complaintId]
    );
  }
}

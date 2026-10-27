import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import { ComplaintService } from "../services/complaintService.js";
import { logAudit } from "../services/auditService.js";
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /pdf|jpg|jpeg|png|doc|docx|txt|zip/i;
    const ext = path.extname(file.originalname).slice(1);
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed formats: PDF, JPG, PNG, DOCX, TXT, ZIP."));
    }
  }
});
export async function uploadDocument(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { id } = req.params;
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }
    const complaint = await ComplaintService.getComplaintById(id, req.user.userId, req.user.role, req.user.bureauId);
    if (!complaint) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }
    const isInternalOnly = req.body.is_internal_only === "true" && req.user.role !== "complainant";
    const docId = uuidv4();
    await db.execute(
      `INSERT INTO complaint_documents (id, complaint_id, uploader_id, file_name, file_size, mime_type, file_path, is_internal_only, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
      [
        docId,
        id,
        req.user.userId,
        file.originalname,
        file.size,
        file.mimetype,
        file.filename,
        isInternalOnly ? 1 : 0
      ]
    );
    await logAudit({
      actorId: req.user.userId,
      action: "DOCUMENT_UPLOADED",
      entityType: "document",
      entityId: docId,
      newValues: { fileName: file.originalname, fileSize: file.size, isInternalOnly },
      ipAddress: req.ip || req.socket.remoteAddress
    });
    res.status(201).json({
      id: docId,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      is_internal_only: isInternalOnly ? 1 : 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    next(err);
  }
}
export async function getDocuments(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { id } = req.params;
    const complaint = await ComplaintService.getComplaintById(id, req.user.userId, req.user.role, req.user.bureauId);
    if (!complaint) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }
    const query = req.user.role === "complainant" ? `SELECT id, complaint_id, uploader_id, file_name, file_size, mime_type, is_internal_only, created_at
         FROM complaint_documents
         WHERE complaint_id = ? AND is_internal_only = 0
         ORDER BY created_at ASC;` : `SELECT d.id, d.complaint_id, d.uploader_id, d.file_name, d.file_size, d.mime_type, d.is_internal_only, d.created_at, u.full_name as uploader_name
         FROM complaint_documents d
         LEFT JOIN users u ON d.uploader_id = u.id
         WHERE d.complaint_id = ?
         ORDER BY d.created_at ASC;`;
    const docs = await db.query(query, [id]);
    res.status(200).json(docs);
  } catch (err) {
    next(err);
  }
}
export async function downloadDocument(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { docId } = req.params;
    const doc = await db.queryOne(
      "SELECT * FROM complaint_documents WHERE id = ?;",
      [docId]
    );
    if (!doc) {
      res.status(404).json({ error: "Document not found." });
      return;
    }
    const complaint = await ComplaintService.getComplaintById(doc.complaint_id, req.user.userId, req.user.role, req.user.bureauId);
    if (!complaint) {
      res.status(403).json({ error: "Access denied to document complaint." });
      return;
    }
    if (req.user.role === "complainant" && doc.is_internal_only) {
      res.status(403).json({ error: "Access denied. This document is restricted for internal vigilance review." });
      return;
    }
    const filePath = path.resolve(uploadDir, doc.file_path);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Physical file not found in storage vault." });
      return;
    }
    res.download(filePath, doc.file_name);
  } catch (err) {
    next(err);
  }
}

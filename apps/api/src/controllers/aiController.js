import { AIService } from "../services/aiService.js";
import { db } from "../db/connection.js";
export async function classifyText(req, res, next) {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: "Both title and description are required for classification." });
      return;
    }
    const result = await AIService.classifyComplaint(title, description);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
export async function checkDuplicates(req, res, next) {
  try {
    const { title, description, institution_name, excludeId } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: "Title and description are required for duplicate matching." });
      return;
    }
    const duplicates = await AIService.detectDuplicates(title, description, institution_name || "", excludeId);
    res.status(200).json(duplicates);
  } catch (err) {
    next(err);
  }
}
export async function summarizeText(req, res, next) {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: "Title and description are required for summarization." });
      return;
    }
    const summary = AIService.summarizeComplaint(title, description);
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}
export async function getComplaintRisk(req, res, next) {
  try {
    const { id } = req.params;
    const complaint = await db.queryOne("SELECT * FROM complaints WHERE id = ?;", [id]);
    if (!complaint) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }
    const risk = AIService.analyzeRisk(
      complaint.priority,
      complaint.created_at,
      complaint.target_resolution_date,
      complaint.description
    );
    res.status(200).json(risk);
  } catch (err) {
    next(err);
  }
}

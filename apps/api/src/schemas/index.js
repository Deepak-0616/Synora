import { z } from "zod";
export const registerSchema = z.object({
  email: z.string().email("Invalid email address format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  full_name: z.string().min(2, "Full name is required (minimum 2 characters)"),
  phone: z.string().optional(),
  designation: z.string().optional()
});
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
export const createComplaintSchema = z.object({
  title: z.string().min(2, "Title is required (at least 2 characters)").max(255),
  description: z.string().min(2, "Description is required (at least 2 characters)"),
  category: z.string().min(2, "Category is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  institution_name: z.string().min(2, "Institution name is required"),
  institution_id: z.preprocess((v) => (!v ? null : v), z.string().optional().nullable()),
  incident_date: z.preprocess((v) => (!v ? null : v), z.string().optional().nullable()),
  bureau_id: z.preprocess((v) => (!v ? null : v), z.string().min(5).optional().nullable())
});
export const updateComplaintSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  institution_name: z.string().optional()
});
export const assignComplaintSchema = z.object({
  bureau_id: z.preprocess((v) => (!v ? null : v), z.string().min(5).optional().nullable()),
  officer_id: z.preprocess((v) => (!v ? null : v), z.string().min(5).optional().nullable()),
  notes: z.string().optional()
});
export const transitionStatusSchema = z.object({
  to_status: z.enum([
    "SUBMITTED",
    "ACKNOWLEDGED",
    "UNDER_REVIEW",
    "IN_PROGRESS",
    "AWAITING_COMPLAINANT_RESPONSE",
    "AWAITING_INTERNAL_REVIEW",
    "RESOLVED",
    "CLOSED",
    "ESCALATED",
    "REJECTED"
  ]),
  note: z.string().optional(),
  rejection_reason: z.string().optional()
});
export const internalNoteSchema = z.object({
  note: z.string().min(1, "Internal note cannot be empty")
});
export const rfiRequestSchema = z.object({
  request_details: z.string().min(1, "Request details cannot be empty")
});
export const rfiResponseSchema = z.object({
  response_details: z.string().min(1, "Response details cannot be empty")
});
export const proposeResolutionSchema = z.object({
  findings: z.string().min(1, "Investigation findings cannot be empty"),
  resolution_summary: z.string().min(1, "Internal resolution summary cannot be empty"),
  complainant_visible_summary: z.string().min(1, "Complainant-visible resolution statement cannot be empty")
});
export const escalateComplaintSchema = z.object({
  reason: z.string().min(1, "Detailed escalation reason is required"),
  to_bureau_id: z.preprocess((v) => (!v ? null : v), z.string().min(5).optional().nullable())
});

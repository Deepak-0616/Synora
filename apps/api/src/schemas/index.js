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
  title: z.string().min(5, "Title must be at least 5 characters long").max(255),
  description: z.string().min(20, "Description must be at least 20 characters long"),
  category: z.string().min(2, "Category is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  institution_name: z.string().min(3, "Institution name is required"),
  institution_id: z.string().optional().nullable(),
  incident_date: z.string().optional().nullable(),
  bureau_id: z.string().uuid().optional().nullable()
});
export const updateComplaintSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(20).optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  institution_name: z.string().optional()
});
export const assignComplaintSchema = z.object({
  bureau_id: z.string().uuid().optional().nullable(),
  officer_id: z.string().uuid().optional().nullable(),
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
  note: z.string().min(3, "Internal note cannot be empty")
});
export const rfiRequestSchema = z.object({
  request_details: z.string().min(5, "Request details must be at least 5 characters")
});
export const rfiResponseSchema = z.object({
  response_details: z.string().min(5, "Response details must be at least 5 characters")
});
export const proposeResolutionSchema = z.object({
  findings: z.string().min(10, "Investigation findings are required"),
  resolution_summary: z.string().min(10, "Internal resolution summary is required"),
  complainant_visible_summary: z.string().min(10, "Complainant-visible resolution statement is required")
});
export const escalateComplaintSchema = z.object({
  reason: z.string().min(10, "Detailed escalation reason is required"),
  to_bureau_id: z.string().uuid().optional().nullable()
});

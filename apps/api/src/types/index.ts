export type UserRole = 'complainant' | 'officer' | 'bureau_admin' | 'system_admin' | 'reviewer';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'AWAITING_COMPLAINANT_RESPONSE'
  | 'AWAITING_INTERNAL_REVIEW'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED'
  | 'REJECTED';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  bureau_id?: string | null;
  bureau_code?: string | null;
  bureau_name?: string | null;
  designation?: string | null;
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface Bureau {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean | number;
  routing_keywords?: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  reference_number: string;
  complainant_id: string;
  complainant_name?: string;
  complainant_email?: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  institution_name: string;
  institution_id?: string | null;
  incident_date?: string | null;
  bureau_id?: string | null;
  bureau_name?: string | null;
  bureau_code?: string | null;
  assigned_officer_id?: string | null;
  assigned_officer_name?: string | null;
  target_resolution_date: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  is_escalated: boolean | number;
  escalation_reason?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  sla_status?: 'NORMAL' | 'APPROACHING_DEADLINE' | 'OVERDUE';
  days_remaining?: number;
}

export interface ComplaintStatusHistory {
  id: string;
  complaint_id: string;
  actor_id: string;
  actor_name?: string;
  actor_role?: string;
  from_status?: ComplaintStatus | null;
  to_status: ComplaintStatus;
  note?: string | null;
  created_at: string;
}

export interface InternalNote {
  id: string;
  complaint_id: string;
  author_id: string;
  author_name?: string;
  author_role?: string;
  note: string;
  created_at: string;
}

export interface InformationRequest {
  id: string;
  complaint_id: string;
  officer_id: string;
  officer_name?: string;
  complainant_id: string;
  complainant_name?: string;
  request_details: string;
  response_details?: string | null;
  status: 'PENDING' | 'RESPONDED' | 'CANCELLED';
  requested_at: string;
  responded_at?: string | null;
}

export interface Resolution {
  id: string;
  complaint_id: string;
  proposed_by_id: string;
  proposed_by_name?: string;
  approved_by_id?: string | null;
  approved_by_name?: string | null;
  findings: string;
  resolution_summary: string;
  complainant_visible_summary: string;
  approved_at?: string | null;
  created_at: string;
}

export interface Escalation {
  id: string;
  complaint_id: string;
  escalated_by_id: string;
  escalated_by_name?: string;
  from_bureau_id?: string | null;
  from_bureau_name?: string | null;
  to_bureau_id?: string | null;
  to_bureau_name?: string | null;
  reason: string;
  status: 'ACTIVE' | 'ADDRESSED' | 'DISMISSED';
  resolved_at?: string | null;
  created_at: string;
}

export interface ComplaintDocument {
  id: string;
  complaint_id: string;
  uploader_id: string;
  uploader_name?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  is_internal_only: boolean | number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  complaint_id?: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean | number;
  link?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: string | null;
  new_values?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  complaint_id: string;
  suggested_category?: string | null;
  suggested_bureau_id?: string | null;
  confidence?: number | null;
  summary?: string | null;
  duplicate_matches?: string | null;
  risk_factors?: string | null;
  is_accepted?: boolean | number | null;
  model_name?: string | null;
  created_at: string;
}

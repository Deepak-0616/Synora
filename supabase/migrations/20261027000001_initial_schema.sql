-- ====================================================================
-- SYNORA: AICTE Institutional Grievance & Complaint Tracking Platform
-- Migration: 20261027000001_initial_schema.sql
-- Description: Complete initial schema with RLS, constraints & indexes
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUREAUS & CELLS TABLE
CREATE TABLE IF NOT EXISTS bureaus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    routing_keywords TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('complainant', 'officer', 'bureau_admin', 'system_admin', 'reviewer')),
    bureau_id UUID REFERENCES bureaus(id) ON DELETE SET NULL,
    designation VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(30) UNIQUE NOT NULL,
    complainant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
        'SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'IN_PROGRESS',
        'AWAITING_COMPLAINANT_RESPONSE', 'AWAITING_INTERNAL_REVIEW',
        'RESOLVED', 'CLOSED', 'ESCALATED', 'REJECTED'
    )),
    institution_name VARCHAR(255) NOT NULL,
    institution_id VARCHAR(50),
    incident_date DATE,
    bureau_id UUID REFERENCES bureaus(id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_resolution_date TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    is_escalated BOOLEAN DEFAULT FALSE NOT NULL,
    escalation_reason TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. CASE ASSIGNMENTS HISTORY TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    bureau_id UUID REFERENCES bureaus(id),
    officer_id UUID REFERENCES users(id),
    assigned_by_id UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. COMPLAINT STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id),
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. COMPLAINT DOCUMENTS (VAULT) TABLE
CREATE TABLE IF NOT EXISTS complaint_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    is_internal_only BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. INTERNAL NOTES TABLE (STRICTLY PRIVATE TO STAFF)
CREATE TABLE IF NOT EXISTS internal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. INFORMATION REQUESTS (RFI - OFFICER <-> COMPLAINANT)
CREATE TABLE IF NOT EXISTS information_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES users(id),
    complainant_id UUID NOT NULL REFERENCES users(id),
    request_details TEXT NOT NULL,
    response_details TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'RESPONDED', 'CANCELLED')),
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    responded_at TIMESTAMPTZ
);

-- 9. RESOLUTIONS TABLE
CREATE TABLE IF NOT EXISTS resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    proposed_by_id UUID NOT NULL REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    findings TEXT NOT NULL,
    resolution_summary TEXT NOT NULL,
    complainant_visible_summary TEXT NOT NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. ESCALATIONS TABLE
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    escalated_by_id UUID NOT NULL REFERENCES users(id),
    from_bureau_id UUID REFERENCES bureaus(id),
    to_bureau_id UUID REFERENCES bureaus(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'ADDRESSED', 'DISMISSED')),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 12. AUDIT LOGS (IMMUTABLE)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 13. AI ANALYSIS & SUGGESTIONS TABLE
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    suggested_category VARCHAR(100),
    suggested_bureau_id UUID REFERENCES bureaus(id),
    confidence REAL,
    summary TEXT,
    duplicate_matches TEXT, -- JSON array of candidate matches
    risk_factors TEXT,      -- JSON array of risk factors
    is_accepted BOOLEAN DEFAULT NULL,
    model_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_complainant ON complaints(complainant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_bureau ON complaints(bureau_id);
CREATE INDEX IF NOT EXISTS idx_complaints_officer ON complaints(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_reference ON complaints(reference_number);
CREATE INDEX IF NOT EXISTS idx_complaints_deadline ON complaints(target_resolution_date);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON complaint_status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_complaint ON internal_notes(complaint_id);
CREATE INDEX IF NOT EXISTS idx_rfi_complaint ON information_requests(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: In production Supabase environment, auth.uid() provides current user id
-- RLS Policy: Complainant can only select their own complaints
CREATE POLICY complainant_own_complaints ON complaints
    FOR SELECT USING (
        auth.uid() = complainant_id OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('officer', 'bureau_admin', 'system_admin', 'reviewer'))
    );

-- RLS Policy: Complainant cannot see internal notes
CREATE POLICY internal_notes_staff_only ON internal_notes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('officer', 'bureau_admin', 'system_admin', 'reviewer'))
    );

-- RLS Policy: Complainants cannot download internal-only documents
CREATE POLICY documents_access_policy ON complaint_documents
    FOR SELECT USING (
        (is_internal_only = FALSE AND EXISTS (SELECT 1 FROM complaints WHERE id = complaint_documents.complaint_id AND complainant_id = auth.uid()))
        OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('officer', 'bureau_admin', 'system_admin', 'reviewer'))
    );

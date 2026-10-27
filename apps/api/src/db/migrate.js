import { db } from "./connection.js";
export async function runMigrations() {
  console.log("[Migrate] Checking and applying database schema migrations...");
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS bureaus (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1 NOT NULL,
      routing_keywords TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK (role IN ('complainant', 'officer', 'bureau_admin', 'system_admin', 'reviewer')),
      bureau_id TEXT REFERENCES bureaus(id) ON DELETE SET NULL,
      designation TEXT,
      is_active INTEGER DEFAULT 1 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      reference_number TEXT UNIQUE NOT NULL,
      complainant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
        'SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'IN_PROGRESS',
        'AWAITING_COMPLAINANT_RESPONSE', 'AWAITING_INTERNAL_REVIEW',
        'RESOLVED', 'CLOSED', 'ESCALATED', 'REJECTED'
      )),
      institution_name TEXT NOT NULL,
      institution_id TEXT,
      incident_date TEXT,
      bureau_id TEXT REFERENCES bureaus(id) ON DELETE SET NULL,
      assigned_officer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      target_resolution_date TEXT NOT NULL,
      resolved_at TEXT,
      closed_at TEXT,
      is_escalated INTEGER DEFAULT 0 NOT NULL,
      escalation_reason TEXT,
      rejection_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      bureau_id TEXT REFERENCES bureaus(id),
      officer_id TEXT REFERENCES users(id),
      assigned_by_id TEXT NOT NULL REFERENCES users(id),
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS complaint_status_history (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      actor_id TEXT NOT NULL REFERENCES users(id),
      from_status TEXT,
      to_status TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS complaint_documents (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      uploader_id TEXT NOT NULL REFERENCES users(id),
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      is_internal_only INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS internal_notes (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id),
      note TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS information_requests (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      officer_id TEXT NOT NULL REFERENCES users(id),
      complainant_id TEXT NOT NULL REFERENCES users(id),
      request_details TEXT NOT NULL,
      response_details TEXT,
      status TEXT DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'RESPONDED', 'CANCELLED')),
      requested_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      responded_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS resolutions (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      proposed_by_id TEXT NOT NULL REFERENCES users(id),
      approved_by_id TEXT REFERENCES users(id),
      findings TEXT NOT NULL,
      resolution_summary TEXT NOT NULL,
      complainant_visible_summary TEXT NOT NULL,
      approved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS escalations (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      escalated_by_id TEXT NOT NULL REFERENCES users(id),
      from_bureau_id TEXT REFERENCES bureaus(id),
      to_bureau_id TEXT REFERENCES bureaus(id),
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'ADDRESSED', 'DISMISSED')),
      resolved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      complaint_id TEXT REFERENCES complaints(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0 NOT NULL,
      link TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS ai_analyses (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      suggested_category TEXT,
      suggested_bureau_id TEXT REFERENCES bureaus(id),
      confidence REAL,
      summary TEXT,
      duplicate_matches TEXT,
      risk_factors TEXT,
      is_accepted INTEGER DEFAULT NULL,
      model_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,
    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_comp_complainant ON complaints(complainant_id);`,
    `CREATE INDEX IF NOT EXISTS idx_comp_bureau ON complaints(bureau_id);`,
    `CREATE INDEX IF NOT EXISTS idx_comp_officer ON complaints(assigned_officer_id);`,
    `CREATE INDEX IF NOT EXISTS idx_comp_status ON complaints(status);`,
    `CREATE INDEX IF NOT EXISTS idx_comp_priority ON complaints(priority);`,
    `CREATE INDEX IF NOT EXISTS idx_comp_ref ON complaints(reference_number);`,
    `CREATE INDEX IF NOT EXISTS idx_comp_target ON complaints(target_resolution_date);`,
    `CREATE INDEX IF NOT EXISTS idx_history_comp ON complaint_status_history(complaint_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notes_comp ON internal_notes(complaint_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);`
  ];
  for (const statement of ddlStatements) {
    await db.execute(statement);
  }
  db.save();
  console.log("[Migrate] Migrations applied successfully.");
}

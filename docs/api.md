# SYNORA: REST API Specification (v1)

Base URL: `http://localhost:4000/api/v1`

---

## 1. Authentication & Profile

### `POST /auth/register`
- **Purpose**: Public registration for complainants.
- **Authentication**: None.
- **Request Body**:
  ```json
  {
    "full_name": "Rahul Kumar",
    "email": "rahul.student@example.com",
    "password": "Password@123",
    "phone": "+91 98110 00000",
    "designation": "Undergraduate Student"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "u100...",
      "email": "rahul.student@example.com",
      "full_name": "Rahul Kumar",
      "role": "complainant"
    }
  }
  ```

### `POST /auth/login`
- **Purpose**: Authenticate user and issue JWT token.
- **Request Body**:
  ```json
  {
    "email": "rahul.student@example.com",
    "password": "Password@123"
  }
  ```
- **Response** `200 OK`: Returns JWT token and sanitized user profile with role.

### `GET /auth/me`
- **Purpose**: Retrieve authenticated user profile.
- **Authentication**: Required (`Bearer <token>`).

---

## 2. Complaints

### `POST /complaints`
- **Purpose**: Register a new institutional complaint.
- **Authentication**: Required.
- **Request Body**:
  ```json
  {
    "title": "Unlawful retention of certificates",
    "description": "Institution refuses to return original 10th and 12th marksheets...",
    "category": "Faculty & Staff Grievance",
    "priority": "MEDIUM",
    "institution_name": "Apex Institute of Technology",
    "institution_id": "1-10492831",
    "incident_date": "2026-10-15",
    "bureau_id": "b100..."
  }
  ```
- **Side Effects**: Generates unique `SYN-YYYY-XXXXX` reference, computes target SLA date, creates initial status log, notifies user, records audit log.

### `GET /complaints`
- **Purpose**: List complaints with pagination, search, and filters.
- **Data Scopes**:
  - `complainant`: Only complaints where `complainant_id = user.id`.
  - `officer`: Only complaints assigned to officer or unassigned in their bureau.
  - `bureau_admin`: Only complaints in their bureau.
  - `system_admin`, `reviewer`: All complaints across AICTE.
- **Query Parameters**: `status`, `category`, `priority`, `bureau_id`, `search`, `page`, `limit`.

### `GET /complaints/:id`
- **Purpose**: Retrieve single complaint case dossier.
- **Security**: Verifies caller permission scope; returns 403 Forbidden if accessing another user's private complaint.

### `GET /complaints/:id/timeline`
- **Purpose**: Chronological status transition history and audit timestamps.

### `POST /complaints/:id/transitions`
- **Purpose**: Execute a controlled lifecycle transition.
- **Request Body**:
  ```json
  {
    "to_status": "IN_PROGRESS",
    "note": "Confidential enquiry commenced"
  }
  ```
- **Validation**: Enforces state machine transition rules and role authorization.

### `POST /complaints/:id/assignments`
- **Purpose**: Assign or reassign complaint to bureau and officer.
- **Authorized Roles**: `bureau_admin`, `system_admin`.
- **Request Body**:
  ```json
  {
    "bureau_id": "b100...",
    "officer_id": "u100...",
    "notes": "Direct inspection required"
  }
  ```

---

## 3. Confidential Notes (Staff Only)

### `POST /complaints/:id/internal-notes`
- **Purpose**: Record confidential investigation findings.
- **Authorized Roles**: `officer`, `bureau_admin`, `system_admin`. Complainants are rejected with 403.

### `GET /complaints/:id/internal-notes`
- **Purpose**: Retrieve internal notes. Never exposed to complainants.

---

## 4. Information Requests (RFI)

### `POST /complaints/:id/rfis`
- **Purpose**: Officer requests additional evidence or clarification from complainant.
- **Side Effect**: Moves case to `AWAITING_COMPLAINANT_RESPONSE`.

### `POST /complaints/:id/rfis/:rfiId/respond`
- **Purpose**: Complainant submits formal written reply.
- **Side Effect**: Moves case back to `IN_PROGRESS`.

---

## 5. Resolutions & Escalations

### `POST /complaints/:id/resolutions`
- **Purpose**: Propose formal findings and relief statement.

### `POST /complaints/:id/resolutions/:resolutionId/approve`
- **Purpose**: Bureau Administrator authorizes and finalizes resolution.
- **Side Effect**: Moves case to `RESOLVED`, timestamps `resolved_at`, dispatches outcome statement to complainant.

### `POST /complaints/:id/escalations`
- **Purpose**: Escalate delayed or critical case to higher cell.

---

## 6. Documents & Evidence Vault

### `POST /complaints/:id/documents`
- **Purpose**: Upload evidence document (multipart/form-data).
- **Security**: Validates file size (max 10MB) and allowed extensions (PDF, PNG, JPG, DOCX, ZIP).

### `GET /complaints/documents/:docId/download`
- **Purpose**: Securely download attached document. Role-scoped verification.

---

## 7. Reports & Analytics

### `GET /analytics/overview`
- **KPI Metrics**: Total Cases, Active Cases, Pending Cases, Overdue Cases, Resolved Cases, Resolution Rate, Average Resolution Days.

### `GET /analytics/trends`
- Submissions and resolutions over time.

### `GET /analytics/bureaus`
- Workload, overdue counts, and SLA compliance percentage across bureaus.

### `GET /analytics/export-csv`
- Protected CSV download with spreadsheet formula injection protection.

---

## 8. AI Capabilities

### `POST /ai/classify`
- Suggests category, bureau, confidence score, and matched keywords.

### `POST /ai/duplicates`
- Detects existing complaints with high semantic and entity similarity.

### `POST /ai/summarize`
- Generates structured 3-part summary (Core Issue, Impact, Redress).

### `GET /ai/complaints/:id/risk`
- Analyzes SLA time remaining and urgency factors.

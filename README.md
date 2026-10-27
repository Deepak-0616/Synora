# SYNORA
### AI-Powered Institutional Complaint Monitoring, Tracking & Resolution Platform
> **Intelligent Oversight. Transparent Resolution.**

---

## 1. Project Overview

**SYNORA** is a full-stack institutional complaint and grievance management platform designed for monitoring, tracking, and resolving institution-related cases across AICTE specialized bureaus and cells.

The platform establishes a centralized digital ecosystem connecting **Complainants** (Students, Faculty, Staff, Parents), **Case Officers**, **Bureau Administrators**, and **System Administrators** with strict role-based access, cryptographic data isolation, deterministic SLA deadline tracking, and modular AI-assisted capabilities.

---

## 2. Core Capabilities

- **Centralized Complaint Registration**: Progressive 4-step disclosure protocol generating human-readable sequential references (e.g. `SYN-2026-00101`).
- **Cryptographic Access Boundaries**: Complainants can only view their own cases; internal investigation notes and restricted staff comments are permanently isolated from complainants.
- **Workflow State Machine**: Strictly validated transitions (`SUBMITTED` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `AWAITING_COMPLAINANT_RESPONSE` $\rightarrow$ `AWAITING_INTERNAL_REVIEW` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED` $\rightarrow$ `ESCALATED`).
- **Deterministic SLA Engine**: Service Level Agreements based on priority (48h for Critical/Anti-Ragging, 7d for High, 14d for Medium, 30d for Standard) with automated risk alerts (`NORMAL`, `APPROACHING_DEADLINE`, `OVERDUE`).
- **Information Request (RFI) Cycle**: Two-way clarification mechanism between Case Officers and Complainants with automatic status transitions and notifications.
- **Modular AI Assistance**:
  - **Complaint Classification**: NLP routing keywords suggest category and bureau with confidence scoring.
  - **Duplicate Detection**: Cross-references active complaints using token overlap and institution entity matching.
  - **Structured Summarization**: Generates 3-part summaries (Core Issue, Claimed Impact, Requested Redress).
  - **Deadline Risk & Urgency Analysis**: Flags high-urgency keywords and overdue milestones.
  - **Human-in-the-Loop Safeguards**: AI never decides case validity, never rejects, and never issues resolutions independently.
- **Operational Analytics & Safe Export**: Real-time KPI cards, complaint trends line chart, bureau workload comparison bar chart, and CSV export protected against spreadsheet formula injection.
- **Immutable Audit Trail**: Append-only log recording actor, action, target entity, timestamp, IP address, and payload diffs.

---

## 3. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Web** | React 18, Vite, JavaScript (JSX), Tailwind CSS, React Router, Lucide Icons, Recharts |
| **Backend REST API** | Node.js 22/24 (Native ESM `"type": "module"`), Express.js, JavaScript, Zod Schema Validation, Multer |
| **Database & Persistence** | Dual-mode: SQLite (`sql.js` WebAssembly relational DB, zero-config native engine) & PostgreSQL / Supabase with Row Level Security (RLS) |
| **Authentication & Security** | JWT (JSON Web Tokens), Bcrypt password hashing, RBAC middleware, In-memory rate limiting |
| **Testing** | Vitest, Supertest (15/15 automated unit & security integration tests passing in pure JS) |

---

## 4. Pre-Configured Demo Accounts

All seed accounts share the standard password: **`Synora@2026!`**

| Persona | Email | Role | Scope |
| :--- | :--- | :--- | :--- |
| **Rahul Kumar (Student)** | `rahul.student@example.com` | `complainant` | Own submitted complaints only |
| **Dr. Sunita Rao (Faculty)** | `dr.sunita.faculty@example.com` | `complainant` | Own submitted complaints only |
| **Pooja Deshmukh** | `officer.arc@synora.aicte.gov.in` | `officer` | Anti-Ragging Cell (ARC) investigation queue |
| **Vikram Malhotra** | `officer.ab@synora.aicte.gov.in` | `officer` | Approval Bureau (AB) investigation queue |
| **Prof. Meenakshi Sundaram** | `bureau.admin@synora.aicte.gov.in` | `bureau_admin` | Approval Bureau oversight, assignments, approvals |
| **Dr. Rajesh Sharma** | `admin@synora.aicte.gov.in` | `system_admin` | System-wide management, roles, and audit trail |
| **Justice K. Swaminathan** | `reviewer@synora.aicte.gov.in` | `reviewer` | Read-only ombudsman & council oversight |

*(The login page features a one-click Quick Demo Switcher to pre-fill credentials instantly)*

---

## 5. Quickstart & Localhost Execution

### 1. Prerequisites
- **Node.js**: `v20.x`, `v22.x`, or `v24.x` (verified on Node `v24.22.0`)
- **Package Manager**: npm `v10+` or `v11+`

> [!TIP]
> **Windows PowerShell Users**: If PowerShell displays an execution policy error (`npm.ps1 cannot be loaded because running scripts is disabled`), use **`npm.cmd`** instead of `npm`, or run in standard Command Prompt (`cmd`).

---

### 2. Install Workspace Dependencies
Run from the repository root:
```powershell
# Windows (PowerShell / CMD):
npm.cmd install

# macOS / Linux:
npm install
```

---

### 3. Initialize & Seed Database
The local SQLite relational database (`data/synora.db`) is automatically migrated and seeded with 8 users, bureaus, and realistic complaints on first server launch. You can also seed or reset manually at any time:

```powershell
# Windows (PowerShell / CMD):
npm.cmd --workspace=apps/api run seed

# Or run directly with Node:
node apps/api/src/db/seed.js

# macOS / Linux:
npm --workspace=apps/api run seed
```

---

### 4. Start Localhost Servers

#### Option A: Run Both Services Concurrently (Recommended)
Starts the backend API on **port 4000** and the React frontend Vite dev server on **port 5173**:

```powershell
# Windows (PowerShell / CMD):
npm.cmd run dev

# macOS / Linux:
npm run dev
```

#### Option B: Run in Separate Terminals

**Terminal 1 — Backend REST API:**
```powershell
# Windows (PowerShell / CMD):
npm.cmd --workspace=apps/api run dev

# Or run directly with native Node 24 watch mode:
node --watch apps/api/src/index.js

# macOS / Linux:
npm --workspace=apps/api run dev
```
*API will start on `http://localhost:4000` with live database connection.*

**Terminal 2 — Frontend Web Application:**
```powershell
# Windows (PowerShell / CMD):
npm.cmd --workspace=apps/web run dev

# macOS / Linux:
npm --workspace=apps/web run dev
```
*Frontend will start on `http://localhost:5173` with instant HMR and automatic API proxying.*

---

### 5. Localhost Access Endpoints

| Service | Localhost URL | Description |
| :--- | :--- | :--- |
| **Frontend Portal** | [http://localhost:5173](http://localhost:5173) | Main application web interface (Citizen & Admin portals) |
| **Backend Health** | [http://localhost:4000/health](http://localhost:4000/health) | API health check (`{"status":"healthy","database":"sqlite"}`) |
| **REST API Base** | [http://localhost:4000/api/v1](http://localhost:4000/api/v1) | Backend routes (Auth, Complaints, Bureaus, Analytics, AI) |

---

## 6. Running Automated Tests

Run the complete Vitest test suite (15 unit, integration, and security authorization tests):

```powershell
# Windows (PowerShell / CMD):
npm.cmd test

# macOS / Linux:
npm test
```

### Test Coverage Breakdown:
- **`tests/sla.test.js`**: Verifies 48h critical SLAs, 7d/14d/30d targets, overdue calculations, and approaching deadline flags.
- **`tests/ai.test.js`**: Verifies classification heuristics, duplicate matching across institutions, and structured 3-part summarization.
- **`tests/security.test.js`**: Verifies:
  - Unauthenticated requests rejected with 401.
  - Cross-user isolation: Complainant A is rejected with 403 when requesting Complainant B's private complaint.
  - Confidential notes isolation: Complainants receive 403 when requesting internal investigation notes.
  - Role elevation prevention: Complainants cannot assign cases or alter roles.
  - State machine transition rules: Invalid status transitions (e.g., `SUBMITTED` directly to `CLOSED`) are rejected with 400.

---

## 7. Production Build & Docker

### Build Bundles
```powershell
# Windows (PowerShell / CMD):
npm.cmd --workspace=apps/web run build
npm.cmd --workspace=apps/api run build

# macOS / Linux:
npm --workspace=apps/web run build
npm --workspace=apps/api run build
```

### Docker Deployment
```powershell
docker compose up -d --build
```

---

## 8. Documentation Index

- **[System Architecture & Lifecycle Blueprint](file:///d:/Github/SYNORA/docs/architecture.md)**
- **[REST API Specification & Contracts](file:///d:/Github/SYNORA/docs/api.md)**
- **[Production Deployment & Security Checklist](file:///d:/Github/SYNORA/docs/deployment.md)**
- **[Database Migration Script](file:///d:/Github/SYNORA/supabase/migrations/20261027000001_initial_schema.sql)**
- **[Fictional Seed Dataset](file:///d:/Github/SYNORA/supabase/seed.sql)**

---

## 9. Regulatory & Integration Disclaimer
SYNORA is designed as an institutional demonstration platform. It does not claim official, authorized integration with government AICTE servers, nor does it issue binding legal decrees. Any external production integration requires authorized government credentials, approved APIs, and institutional oversight.

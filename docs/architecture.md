# SYNORA: System Architecture & Implementation Blueprint

## 1. Executive Summary
**SYNORA** is an institutional complaint monitoring, tracking, and resolution platform designed for AICTE bureaus and cells. It provides a centralized, transparent, and secure ecosystem connecting Complainants, Case Officers, Bureau Administrators, and System Administrators.

---

## 2. Architecture Overview

```mermaid
graph TD
    Client[Web Frontend: React + TypeScript + Tailwind + Lucide + Recharts]
    API[REST API: Node.js + Express + TypeScript + Zod Validation]
    DB[(Database: Supabase PostgreSQL / Local Persistent Relational SQLite)]
    AI[AI Engine: Modular Classification, Duplicate Detection & Summarization]
    Storage[Storage: Secure Document Vault with Role-Scoped Access]

    Client -->|JWT Auth & REST API| API
    API -->|SQL Queries & Transactions| DB
    API -->|Protected File Access| Storage
    API -->|Inference & Heuristics| AI
```

---

## 3. Role & Permission Matrix

| Role | Submit Complaint | View Own | View Bureau | View Assigned | Internal Notes | Reassign Case | Approve Resolution | Manage Users & Bureaus |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Complainant** | Yes | Yes | No | No | No (Hidden) | No | No | No |
| **Case Officer** | No | No | No | Yes | Yes (Read/Write) | No | Propose | No |
| **Bureau Admin** | No | No | Yes | Yes | Yes (Read/Write) | Yes | Yes | No |
| **System Admin** | No | No | Yes (Audit) | No | Audit Only | Yes | Audit | Yes |
| **Oversight Reviewer** | No | No | Read-only | Read-only | Read-only | No | No | No |

---

## 4. Complaint Lifecycle & State Machine

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED: Complainant Submits
    SUBMITTED --> ACKNOWLEDGED: System/Admin Acknowledges
    ACKNOWLEDGED --> UNDER_REVIEW: Assigned to Bureau/Officer
    UNDER_REVIEW --> IN_PROGRESS: Investigation Commences
    IN_PROGRESS --> AWAITING_COMPLAINANT_RESPONSE: Officer Requests Info (RFI)
    AWAITING_COMPLAINANT_RESPONSE --> IN_PROGRESS: Complainant Submits Evidence
    IN_PROGRESS --> AWAITING_INTERNAL_REVIEW: Officer Recommends Resolution
    AWAITING_INTERNAL_REVIEW --> RESOLVED: Bureau Admin Approves
    AWAITING_INTERNAL_REVIEW --> IN_PROGRESS: Bureau Admin Rejects/Requests More Proof
    RESOLVED --> CLOSED: Case Formally Closed
    UNDER_REVIEW --> ESCALATED: SLA Breached or High Complexity
    IN_PROGRESS --> ESCALATED: Bureau Admin Escalates
    ESCALATED --> IN_PROGRESS: Reassigned / Appellate Review
    UNDER_REVIEW --> REJECTED: Inadmissible / Duplicate with Justification
```

---

## 5. Directory Layout
```
SYNORA/
├── apps/
│   ├── web/                     # React + Vite + TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/      # UI component library & brand assets
│   │   │   ├── layouts/         # Client & Admin layout shells
│   │   │   ├── pages/           # Portals (Complainant, Officer, Bureau Admin, System Admin)
│   │   │   ├── context/         # Auth & Notification contexts
│   │   │   ├── services/        # API client bindings
│   │   │   └── types/           # Shared TypeScript interfaces
│   │   └── package.json
│   └── api/                     # Node.js + Express backend
│       ├── src/
│       │   ├── controllers/     # Route handlers
│       │   ├── middleware/      # Auth, RBAC, error handling, rate limiting
│       │   ├── services/        # Business logic, workflows, SLA, AI engine
│       │   ├── db/              # Migrations, seed data, database adapter
│       │   ├── routes/          # Express route definitions
│       │   └── schemas/         # Zod schemas for validation
│       └── package.json
├── supabase/
│   ├── migrations/              # SQL migrations with RLS policies
│   └── seed.sql                 # Fictional seed dataset
├── docs/                        # API spec, architecture documentation
├── .env.example
├── package.json                 # Monorepo orchestration
└── README.md
```

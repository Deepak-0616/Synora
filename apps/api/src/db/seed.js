import bcrypt from "bcryptjs";
import { db } from "./connection.js";
import { runMigrations } from "./migrate.js";

export async function seedDatabase(force = false) {
  await runMigrations();

  const complaintCount = await db.queryOne("SELECT count(*) as count FROM complaints;");
  if (complaintCount && complaintCount.count >= 10 && !force) {
    console.log(`[Seed] Database already contains ${complaintCount.count} complaints. Skipping seed.`);
    return;
  }

  console.log("[Seed] Seeding database with comprehensive AICTE institutional test dataset...");

  // Default demo password for all seed accounts
  const defaultHash = bcrypt.hashSync("Synora@2026!", 10);

  // 1. AICTE Specialized Bureaus & Cells
  const bureaus = [
    {
      id: "b1000000-0000-0000-0000-000000000001",
      code: "AB",
      name: "Approval Bureau",
      description: "Handles institutional approvals, extension of approval (EOA), course additions, and intake variations.",
      keywords: "approval,eoa,intake,affiliation,unapproved,accreditation,aicte approval,closure,second shift"
    },
    {
      id: "b1000000-0000-0000-0000-000000000002",
      code: "GRC",
      name: "Grievance Redressal Cell",
      description: "Oversees institutional Ombudsman compliance and general student/faculty complaints.",
      keywords: "ombudsman,grievance committee,victimization,harassment,complaint cell,dpc,promotion"
    },
    {
      id: "b1000000-0000-0000-0000-000000000003",
      code: "ARC",
      name: "Anti-Ragging Cell",
      description: "Investigates and enforces zero-tolerance anti-ragging measures and safety violations.",
      keywords: "ragging,bullying,physical abuse,hostel harassment,threat,senior bullying,assault,parade,hazing"
    },
    {
      id: "b1000000-0000-0000-0000-000000000004",
      code: "SFWC",
      name: "Student & Faculty Welfare Cell",
      description: "Addresses certificate retention, faculty pay scale anomalies, scholarship stipends, and termination disputes.",
      keywords: "certificate,retention of documents,withholding marksheets,salary,unpaid stipend,provident fund,termination,scholarship"
    },
    {
      id: "b1000000-0000-0000-0000-000000000005",
      code: "FAC",
      name: "Finance & Auditing Cell",
      description: "Audits capitation fees, unauthorized fees, and refund violations on admission cancellations.",
      keywords: "capitation fee,overcharging,tuition fee,refund,admission cancellation,caution deposit,donation"
    },
    {
      id: "b1000000-0000-0000-0000-000000000006",
      code: "QAIB",
      name: "Quality Assurance & Inspection Bureau",
      description: "Audits infrastructure deficiencies, ghost faculty, and laboratory equipment compliance.",
      keywords: "infrastructure,lab equipment,library books,ghost faculty,cadre ratio,campus safety,workshop,fire safety"
    }
  ];

  for (const b of bureaus) {
    await db.execute(
      `INSERT OR REPLACE INTO bureaus (id, code, name, description, is_active, routing_keywords)
       VALUES (?, ?, ?, ?, 1, ?);`,
      [b.id, b.code, b.name, b.description, b.keywords]
    );
  }

  // 2. Persona Users (Demo accounts across all roles)
  const users = [
    {
      id: "u1000000-0000-0000-0000-000000000001",
      email: "admin@synora.aicte.gov.in",
      name: "Dr. Rajesh Sharma",
      phone: "+91 98110 23456",
      role: "system_admin",
      bureau_id: null,
      designation: "Chief Information Officer & Administrator"
    },
    {
      id: "u1000000-0000-0000-0000-000000000002",
      email: "bureau.admin@synora.aicte.gov.in",
      name: "Prof. Meenakshi Sundaram",
      phone: "+91 98220 34567",
      role: "bureau_admin",
      bureau_id: "b1000000-0000-0000-0000-000000000001",
      designation: "Director (Approval Bureau)"
    },
    {
      id: "u1000000-0000-0000-0000-000000000003",
      email: "arc.admin@synora.aicte.gov.in",
      name: "Dr. Anand Verma",
      phone: "+91 98330 45678",
      role: "bureau_admin",
      bureau_id: "b1000000-0000-0000-0000-000000000003",
      designation: "Head, National Anti-Ragging Monitoring Cell"
    },
    {
      id: "u1000000-0000-0000-0000-000000000004",
      email: "officer.ab@synora.aicte.gov.in",
      name: "Vikram Malhotra",
      phone: "+91 98440 56789",
      role: "officer",
      bureau_id: "b1000000-0000-0000-0000-000000000001",
      designation: "Senior Vigilance & Case Officer"
    },
    {
      id: "u1000000-0000-0000-0000-000000000005",
      email: "officer.arc@synora.aicte.gov.in",
      name: "Pooja Deshmukh",
      phone: "+91 98550 67890",
      role: "officer",
      bureau_id: "b1000000-0000-0000-0000-000000000003",
      designation: "Rapid Response Officer (ARC)"
    },
    {
      id: "u1000000-0000-0000-0000-000000000009",
      email: "officer.sfwc@synora.aicte.gov.in",
      name: "Kavita Iyer",
      phone: "+91 98660 78901",
      role: "officer",
      bureau_id: "b1000000-0000-0000-0000-000000000004",
      designation: "Welfare & Compliance Investigator"
    },
    {
      id: "u1000000-0000-0000-0000-000000000006",
      email: "rahul.student@example.com",
      name: "Rahul Kumar",
      phone: "+91 99110 11223",
      role: "complainant",
      bureau_id: null,
      designation: "Undergraduate Engineering Student"
    },
    {
      id: "u1000000-0000-0000-0000-000000000007",
      email: "dr.sunita.faculty@example.com",
      name: "Dr. Sunita Rao",
      phone: "+91 99220 22334",
      role: "complainant",
      bureau_id: null,
      designation: "Assistant Professor (Computer Science)"
    },
    {
      id: "u1000000-0000-0000-0000-000000000008",
      email: "reviewer@synora.aicte.gov.in",
      name: "Justice (Retd.) K. Swaminathan",
      phone: "+91 99330 33445",
      role: "reviewer",
      bureau_id: null,
      designation: "Independent Ombudsman Reviewer"
    }
  ];

  for (const u of users) {
    await db.execute(
      `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, phone, role, bureau_id, designation, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);`,
      [u.id, u.email, defaultHash, u.name, u.phone, u.role, u.bureau_id, u.designation]
    );
  }

  const now = new Date();

  // 3. Realistic Complaints Covering All Bureaus, Priorities, and Workflows
  const complaints = [
    // Case 1: Critical In-Progress Case with Responded RFI & Internal Note
    {
      id: "c1000000-0000-0000-0000-000000000001",
      ref: "SYN-2026-00101",
      complainant_id: "u1000000-0000-0000-0000-000000000006",
      title: "Severe physical hazing and psychological harassment in Block B hostel",
      description: "First-year students in Block B boys hostel are being forcibly detained past midnight by senior students, subjected to verbal abuse and forced tasks. Despite notifying the hostel warden on Oct 14, no disciplinary action has been initiated and threats continue.",
      category: "Ragging / Harassment",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      institution: "Apex Institute of Engineering & Technology, Bengaluru",
      inst_id: "1-10492831",
      incident_date: "2026-10-14",
      bureau_id: "b1000000-0000-0000-0000-000000000003",
      officer_id: "u1000000-0000-0000-0000-000000000005",
      target_date: new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 36 * 3600 * 1000).toISOString()
    },
    // Case 2: High Under-Review Case
    {
      id: "c1000000-0000-0000-0000-000000000002",
      ref: "SYN-2026-00102",
      complainant_id: "u1000000-0000-0000-0000-000000000007",
      title: "Unauthorized admission of 60 additional students in Artificial Intelligence program",
      description: "The institution was sanctioned an intake of 60 seats by AICTE EOA for B.Tech AI & Data Science for 2026-27. However, the management has admitted 120 students by running an unapproved second shift without requisite faculty or lab facilities.",
      category: "Approval & Accreditation",
      priority: "HIGH",
      status: "UNDER_REVIEW",
      institution: "National School of Management & Technology, Pune",
      inst_id: "1-28491023",
      incident_date: "2026-09-28",
      bureau_id: "b1000000-0000-0000-0000-000000000001",
      officer_id: "u1000000-0000-0000-0000-000000000004",
      target_date: new Date(now.getTime() + 5 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 48 * 3600 * 1000).toISOString()
    },
    // Case 3: Resolved Case with Approved Resolution
    {
      id: "c1000000-0000-0000-0000-000000000003",
      ref: "SYN-2026-00089",
      complainant_id: "u1000000-0000-0000-0000-000000000006",
      title: "Unlawful retention of original 10th and 12th certificates upon voluntary discontinuation",
      description: "Student requested discontinuation of studies due to medical reasons within the permitted notice period. Administration demanded payment of remaining 3 years tuition fees before releasing original mark sheets in direct violation of AICTE guidelines.",
      category: "Faculty & Staff Grievance",
      priority: "MEDIUM",
      status: "RESOLVED",
      institution: "Saraswati College of Polytechnic & Architecture, Bhopal",
      inst_id: "1-39481029",
      incident_date: "2026-09-10",
      bureau_id: "b1000000-0000-0000-0000-000000000004",
      officer_id: "u1000000-0000-0000-0000-000000000009",
      target_date: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 20 * 24 * 3600 * 1000).toISOString(),
      resolved_at: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString()
    },
    // Case 4: Overdue Escalated Case
    {
      id: "c1000000-0000-0000-0000-000000000004",
      ref: "SYN-2026-00094",
      complainant_id: "u1000000-0000-0000-0000-000000000007",
      title: "Mandatory cash capitation fee of INR 2,50,000 disguised as building development fund",
      description: "Institution is compelling students under government quota counseling to submit mandatory cash receipts without proper tax invoices under the pretext of an unaudited development fund, failing which laboratory access is withheld.",
      category: "Fee & Financial Malpractice",
      priority: "HIGH",
      status: "ESCALATED",
      institution: "Imperial Institute of Computer Applications, Lucknow",
      inst_id: "1-48291048",
      incident_date: "2026-09-15",
      bureau_id: "b1000000-0000-0000-0000-000000000005",
      officer_id: null,
      target_date: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(), // Overdue!
      created_at: new Date(now.getTime() - 18 * 24 * 3600 * 1000).toISOString(),
      is_escalated: 1,
      escalation_reason: "Institution failed to provide financial ledger upon statutory 14-day notice; referred to State Oversight Committee."
    },
    // Case 5: Fresh Submitted Case (Waiting for Triage / Assignment)
    {
      id: "c1000000-0000-0000-0000-000000000005",
      ref: "SYN-2026-00105",
      complainant_id: "u1000000-0000-0000-0000-000000000006",
      title: "Defective civil laboratory and absent emergency fire exit in engineering workshop",
      description: "Workshop ceiling has severe structural leaks and concrete spalling. Fire extinguishers expired in 2024 with no fire department clearance for the main workshop building housing heavy machinery.",
      category: "Infrastructure & Safety",
      priority: "MEDIUM",
      status: "SUBMITTED",
      institution: "Vanguard Technical University Affiliated College, Chennai",
      inst_id: "1-59281039",
      incident_date: "2026-10-25",
      bureau_id: "b1000000-0000-0000-0000-000000000006",
      officer_id: null,
      target_date: new Date(now.getTime() + 12 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString()
    },
    // Case 6: Action Required for Complainant (Pending RFI from Officer)
    {
      id: "c1000000-0000-0000-0000-000000000006",
      ref: "SYN-2026-00106",
      complainant_id: "u1000000-0000-0000-0000-000000000006",
      title: "Coercive night-time parade and senior intimidation at sports complex dormitory",
      description: "Senior athletes in the college sports wing force junior hostellers to participate in midnight physical exercises in the quadrangle under threat of expulsion from the college team. We seek immediate Anti-Ragging squad intervention.",
      category: "Ragging / Harassment",
      priority: "HIGH",
      status: "AWAITING_COMPLAINANT_RESPONSE",
      institution: "Apex Institute of Engineering & Technology, Bengaluru",
      inst_id: "1-10492831",
      incident_date: "2026-10-23",
      bureau_id: "b1000000-0000-0000-0000-000000000003",
      officer_id: "u1000000-0000-0000-0000-000000000005",
      target_date: new Date(now.getTime() + 4 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString()
    },
    // Case 7: Action Required for Bureau Admin (Proposed Resolution Awaiting Approval)
    {
      id: "c1000000-0000-0000-0000-000000000007",
      ref: "SYN-2026-00107",
      complainant_id: "u1000000-0000-0000-0000-000000000007",
      title: "Operation of unapproved off-campus study center without AICTE and University sanction",
      description: "College management opened an unapproved annex 25 km away in a commercial complex offering unaccredited MBA certificates while collecting full university tuition fees. We request inspection and shutdown.",
      category: "Approval & Accreditation",
      priority: "HIGH",
      status: "AWAITING_INTERNAL_REVIEW",
      institution: "National School of Management & Technology, Pune",
      inst_id: "1-28491023",
      incident_date: "2026-10-01",
      bureau_id: "b1000000-0000-0000-0000-000000000001",
      officer_id: "u1000000-0000-0000-0000-000000000004",
      target_date: new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString()
    },
    // Case 8: Acknowledged Grievance Case
    {
      id: "c1000000-0000-0000-0000-000000000008",
      ref: "SYN-2026-00108",
      complainant_id: "u1000000-0000-0000-0000-000000000007",
      title: "Arbitrary delay in convening annual Departmental Promotion Committee (DPC) meetings",
      description: "Assistant professors completing mandatory 5 years with qualifying API scores under AICTE 7th Pay guidelines have not been scheduled for assessment for over 18 months, causing financial loss.",
      category: "Faculty & Staff Grievance",
      priority: "LOW",
      status: "AWAITING_COMPLAINANT_RESPONSE",
      institution: "Delhi Polytechnic Institute of Technology, New Delhi",
      inst_id: "1-68291011",
      incident_date: "2026-10-10",
      bureau_id: "b1000000-0000-0000-0000-000000000002",
      officer_id: null,
      target_date: new Date(now.getTime() + 25 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
    },
    // Case 9: Completed & Closed Case
    {
      id: "c1000000-0000-0000-0000-000000000009",
      ref: "SYN-2026-00109",
      complainant_id: "u1000000-0000-0000-0000-000000000006",
      title: "Non-disbursement of national post-matric technical scholarship stipend for 6 months",
      description: "Eligible SC/ST scholarship grant released by Ministry was withheld by college accounting portal. Complainant petitioned for immediate release of stipend to settle semester examination fees.",
      category: "Faculty & Staff Grievance",
      priority: "MEDIUM",
      status: "CLOSED",
      institution: "Saraswati College of Polytechnic & Architecture, Bhopal",
      inst_id: "1-39481029",
      incident_date: "2026-08-15",
      bureau_id: "b1000000-0000-0000-0000-000000000004",
      officer_id: "u1000000-0000-0000-0000-000000000009",
      target_date: new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString(),
      resolved_at: new Date(now.getTime() - 8 * 24 * 3600 * 1000).toISOString(),
      closed_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString()
    },
    // Case 10: Unassigned Approval Bureau Case (Allows Bureau Director Meenakshi to test Assign / Reassign!)
    {
      id: "c1000000-0000-0000-0000-000000000010",
      ref: "SYN-2026-00110",
      complainant_id: "u1000000-0000-0000-0000-000000000007",
      title: "Unapproved establishment of second campus without AICTE Extension of Approval (EOA)",
      description: "Institution has commenced admitting students for an unapproved extension campus in Coimbatore claiming AICTE affiliation without mandatory inspection or EOA sanction order.",
      category: "Approval & Accreditation",
      priority: "HIGH",
      status: "SUBMITTED",
      institution: "Kovai Technical Institute, Coimbatore",
      inst_id: "1-92837102",
      incident_date: "2026-10-26",
      bureau_id: "b1000000-0000-0000-0000-000000000001",
      officer_id: null,
      target_date: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString()
    }
  ];

  for (const c of complaints) {
    await db.execute(
      `INSERT OR REPLACE INTO complaints (
        id, reference_number, complainant_id, title, description, category, priority, status,
        institution_name, institution_id, incident_date, bureau_id, assigned_officer_id,
        target_resolution_date, resolved_at, closed_at, is_escalated, escalation_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        c.id,
        c.ref,
        c.complainant_id,
        c.title,
        c.description,
        c.category,
        c.priority,
        c.status,
        c.institution,
        c.inst_id,
        c.incident_date,
        c.bureau_id,
        c.officer_id,
        c.target_date,
        c.resolved_at || null,
        c.closed_at || null,
        c.is_escalated || 0,
        c.escalation_reason || null,
        c.created_at,
        c.created_at
      ]
    );
  }

  // 4. Status History (Timeline records for every complaint)
  const historyEntries = [
    // Case 1 timeline
    { id: "h1001", cid: "c1000000-0000-0000-0000-000000000001", actor: "u1000000-0000-0000-0000-000000000006", from: null, to: "SUBMITTED", note: "Grievance submitted by complainant", date: new Date(now.getTime() - 36 * 3600 * 1000).toISOString() },
    { id: "h1002", cid: "c1000000-0000-0000-0000-000000000001", actor: "u1000000-0000-0000-0000-000000000003", from: "SUBMITTED", to: "ACKNOWLEDGED", note: "Acknowledged by Anti-Ragging Cell triage desk", date: new Date(now.getTime() - 32 * 3600 * 1000).toISOString() },
    { id: "h1003", cid: "c1000000-0000-0000-0000-000000000001", actor: "u1000000-0000-0000-0000-000000000003", from: "ACKNOWLEDGED", to: "UNDER_REVIEW", note: "Assigned to Rapid Response Officer Pooja Deshmukh", date: new Date(now.getTime() - 28 * 3600 * 1000).toISOString() },
    { id: "h1004", cid: "c1000000-0000-0000-0000-000000000001", actor: "u1000000-0000-0000-0000-000000000005", from: "UNDER_REVIEW", to: "IN_PROGRESS", note: "Active inquiry commenced with institutional anti-ragging squad", date: new Date(now.getTime() - 20 * 3600 * 1000).toISOString() },

    // Case 2 timeline
    { id: "h2001", cid: "c1000000-0000-0000-0000-000000000002", actor: "u1000000-0000-0000-0000-000000000007", from: null, to: "SUBMITTED", note: "Grievance submitted by complainant", date: new Date(now.getTime() - 48 * 3600 * 1000).toISOString() },
    { id: "h2002", cid: "c1000000-0000-0000-0000-000000000002", actor: "u1000000-0000-0000-0000-000000000002", from: "SUBMITTED", to: "ACKNOWLEDGED", note: "Official intake records summoned from state counseling authority", date: new Date(now.getTime() - 40 * 3600 * 1000).toISOString() },
    { id: "h2003", cid: "c1000000-0000-0000-0000-000000000002", actor: "u1000000-0000-0000-0000-000000000002", from: "ACKNOWLEDGED", to: "UNDER_REVIEW", note: "Assigned to Case Officer Vikram Malhotra", date: new Date(now.getTime() - 30 * 3600 * 1000).toISOString() },

    // Case 3 timeline
    { id: "h3001", cid: "c1000000-0000-0000-0000-000000000003", actor: "u1000000-0000-0000-0000-000000000006", from: null, to: "SUBMITTED", note: "Complaint submitted", date: new Date(now.getTime() - 20 * 24 * 3600 * 1000).toISOString() },
    { id: "h3002", cid: "c1000000-0000-0000-0000-000000000003", actor: "u1000000-0000-0000-0000-000000000001", from: "SUBMITTED", to: "IN_PROGRESS", note: "Investigation notice served to college principal", date: new Date(now.getTime() - 15 * 24 * 3600 * 1000).toISOString() },
    { id: "h3003", cid: "c1000000-0000-0000-0000-000000000003", actor: "u1000000-0000-0000-0000-000000000009", from: "IN_PROGRESS", to: "RESOLVED", note: "Certificates returned; compliance confirmed", date: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString() },

    // Case 6 timeline
    { id: "h6001", cid: "c1000000-0000-0000-0000-000000000006", actor: "u1000000-0000-0000-0000-000000000006", from: null, to: "SUBMITTED", note: "Complaint filed", date: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString() },
    { id: "h6002", cid: "c1000000-0000-0000-0000-000000000006", actor: "u1000000-0000-0000-0000-000000000005", from: "SUBMITTED", to: "AWAITING_COMPLAINANT_RESPONSE", note: "RFI issued to complainant for CCTV coverage verification", date: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString() },

    // Case 7 timeline
    { id: "h7001", cid: "c1000000-0000-0000-0000-000000000007", actor: "u1000000-0000-0000-0000-000000000007", from: null, to: "SUBMITTED", note: "Grievance submitted", date: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString() },
    { id: "h7002", cid: "c1000000-0000-0000-0000-000000000007", actor: "u1000000-0000-0000-0000-000000000004", from: "SUBMITTED", to: "IN_PROGRESS", note: "Surprise campus inspection conducted", date: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString() },
    { id: "h7003", cid: "c1000000-0000-0000-0000-000000000007", actor: "u1000000-0000-0000-0000-000000000004", from: "IN_PROGRESS", to: "AWAITING_INTERNAL_REVIEW", note: "Formal closure notice drafted; submitted for Bureau Admin approval", date: new Date(now.getTime() - 12 * 3600 * 1000).toISOString() },
    // Case 8 timeline
    { id: "h8001", cid: "c1000000-0000-0000-0000-000000000008", actor: "u1000000-0000-0000-0000-000000000007", from: null, to: "SUBMITTED", note: "Faculty promotion grievance submitted", date: new Date(now.getTime() - 24 * 3600 * 1000).toISOString() },
    { id: "h8002", cid: "c1000000-0000-0000-0000-000000000008", actor: "u1000000-0000-0000-0000-000000000001", from: "SUBMITTED", to: "AWAITING_COMPLAINANT_RESPONSE", note: "RFI issued requesting annual API appraisal scorecards", date: new Date(now.getTime() - 12 * 3600 * 1000).toISOString() },
    // Case 10 timeline
    { id: "h10001", cid: "c1000000-0000-0000-0000-000000000010", actor: "u1000000-0000-0000-0000-000000000007", from: null, to: "SUBMITTED", note: "Grievance submitted by complainant", date: new Date(now.getTime() - 2 * 3600 * 1000).toISOString() }
  ];

  for (const h of historyEntries) {
    await db.execute(
      `INSERT OR REPLACE INTO complaint_status_history (id, complaint_id, actor_id, from_status, to_status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [h.id, h.cid, h.actor, h.from, h.to, h.note, h.date]
    );
  }

  // 5. Internal Confidential Notes (Staff only)
  await db.execute(
    `INSERT OR REPLACE INTO internal_notes (id, complaint_id, author_id, note, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    [
      "n1000000-0000-0000-0000-000000000001",
      "c1000000-0000-0000-0000-000000000001",
      "u1000000-0000-0000-0000-000000000005",
      "Contacted Local District Magistrate and Anti-Ragging Squad. Institutional warden admitted receiving verbal notice. Inspection scheduled for tomorrow morning.",
      new Date(now.getTime() - 18 * 3600 * 1000).toISOString()
    ]
  );
  await db.execute(
    `INSERT OR REPLACE INTO internal_notes (id, complaint_id, author_id, note, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    [
      "n1000000-0000-0000-0000-000000000002",
      "c1000000-0000-0000-0000-000000000002",
      "u1000000-0000-0000-0000-000000000004",
      "Cross-referenced AICTE EOA portal portal database. Total sanctioned intake is strictly 60. State DTE confirmed receipt of additional 60 admissions on provisional list. Notice drafted.",
      new Date(now.getTime() - 22 * 3600 * 1000).toISOString()
    ]
  );

  // 6. Information Requests (RFIs)
  // RFI 1: Case 1 - Responded
  await db.execute(
    `INSERT OR REPLACE INTO information_requests (
      id, complaint_id, officer_id, complainant_id, request_details, response_details, status, requested_at, responded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      "r1000000-0000-0000-0000-000000000001",
      "c1000000-0000-0000-0000-000000000001",
      "u1000000-0000-0000-0000-000000000005",
      "u1000000-0000-0000-0000-000000000006",
      "Please confirm the room numbers in Block B where the incident occurred and provide the date on which the written complaint was given to the hostel warden.",
      "Room numbers are 304 and 308 on 3rd floor. Written copy was handed to Warden Dr. R. K. Nair on Oct 14 at 10:30 AM.",
      "RESPONDED",
      new Date(now.getTime() - 19 * 3600 * 1000).toISOString(),
      new Date(now.getTime() - 17 * 3600 * 1000).toISOString()
    ]
  );

  // RFI 2: Case 6 - OPEN PENDING (Allows Rahul Kumar to test responding to RFI!)
  await db.execute(
    `INSERT OR REPLACE INTO information_requests (
      id, complaint_id, officer_id, complainant_id, request_details, response_details, status, requested_at, responded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      "r1000000-0000-0000-0000-000000000002",
      "c1000000-0000-0000-0000-000000000006",
      "u1000000-0000-0000-0000-000000000005",
      "u1000000-0000-0000-0000-000000000006",
      "Please provide the names or jersey numbers of the senior students involved, and specify if you have copies of previous emails sent to the Sports Director.",
      null,
      "PENDING",
      new Date(now.getTime() - 20 * 3600 * 1000).toISOString(),
      null
    ]
  );

  // RFI 3: Case 8 - OPEN PENDING for Dr. Sunita Rao (Allows Dr. Sunita to test responding to RFI!)
  await db.execute(
    `INSERT OR REPLACE INTO information_requests (
      id, complaint_id, officer_id, complainant_id, request_details, response_details, status, requested_at, responded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      "r1000000-0000-0000-0000-000000000003",
      "c1000000-0000-0000-0000-000000000008",
      "u1000000-0000-0000-0000-000000000001",
      "u1000000-0000-0000-0000-000000000007",
      "Please upload certified copies of your annual API appraisal scorecards for years 2021-2025 and endorsement from Department Head.",
      null,
      "PENDING",
      new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      null
    ]
  );

  // 7. Resolutions
  // Resolution 1: Case 3 - APPROVED
  await db.execute(
    `INSERT OR REPLACE INTO resolutions (
      id, complaint_id, proposed_by_id, approved_by_id, findings, resolution_summary, complainant_visible_summary, approved_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      "s1000000-0000-0000-0000-000000000001",
      "c1000000-0000-0000-0000-000000000003",
      "u1000000-0000-0000-0000-000000000009",
      "u1000000-0000-0000-0000-000000000002",
      "Investigation verified that complainant had submitted formal withdrawal within 15 days of admission commencement. Withholding certificates violates AICTE Approval Process Handbook Appendix 8.",
      "Statutory notice issued to Principal. Institution returned original 10th and 12th certificates to student on Oct 20 with zero financial penalty.",
      "Your original certificates have been successfully retrieved and returned to you by the institution following AICTE directive. No penalty was levied.",
      new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
      new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString()
    ]
  );

  // Resolution 2: Case 7 - PROPOSED / PENDING APPROVAL (Allows Bureau Admin to test approving resolution!)
  await db.execute(
    `INSERT OR REPLACE INTO resolutions (
      id, complaint_id, proposed_by_id, approved_by_id, findings, resolution_summary, complainant_visible_summary, approved_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      "s1000000-0000-0000-0000-000000000002",
      "c1000000-0000-0000-0000-000000000007",
      "u1000000-0000-0000-0000-000000000004",
      null, // Not approved yet!
      "On-site inspection team visited the commercial complex at 4th Cross Road on Oct 22 and confirmed unapproved classroom operations without mandatory fire exit, lab facilities, or AICTE Extension of Approval.",
      "Order institution to shut down unauthorized commercial annex immediately and refund all 48 enrolled students within 14 business days under penalty of total EOA withdrawal.",
      "Your complaint regarding the unapproved off-campus center has been substantiated. AICTE has ordered the center closed and full fee refund to all affected students.",
      null,
      new Date(now.getTime() - 12 * 3600 * 1000).toISOString()
    ]
  );

  // 8. Supporting Evidence Documents
  await db.execute(
    `INSERT OR REPLACE INTO complaint_documents (id, complaint_id, uploader_id, file_name, file_size, mime_type, file_path, is_internal_only, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      "d1000000-0000-0000-0000-000000000001",
      "c1000000-0000-0000-0000-000000000001",
      "u1000000-0000-0000-0000-000000000006",
      "affidavit_hostel_incident_oct2026.pdf",
      418,
      "application/pdf",
      "affidavit_hostel_incident_oct2026.pdf",
      0,
      new Date(now.getTime() - 35 * 3600 * 1000).toISOString()
    ]
  );
  await db.execute(
    `INSERT OR REPLACE INTO complaint_documents (id, complaint_id, uploader_id, file_name, file_size, mime_type, file_path, is_internal_only, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      "d1000000-0000-0000-0000-000000000002",
      "c1000000-0000-0000-0000-000000000002",
      "u1000000-0000-0000-0000-000000000007",
      "aicte_eoa_sanction_order_2026.pdf",
      512,
      "application/pdf",
      "aicte_eoa_sanction_order_2026.pdf",
      0,
      new Date(now.getTime() - 47 * 3600 * 1000).toISOString()
    ]
  );
  await db.execute(
    `INSERT OR REPLACE INTO complaint_documents (id, complaint_id, uploader_id, file_name, file_size, mime_type, file_path, is_internal_only, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      "d1000000-0000-0000-0000-000000000003",
      "c1000000-0000-0000-0000-000000000004",
      "u1000000-0000-0000-0000-000000000007",
      "capitation_cash_receipt_scans.pdf",
      385,
      "application/pdf",
      "capitation_cash_receipt_scans.pdf",
      0,
      new Date(now.getTime() - 17 * 24 * 3600 * 1000).toISOString()
    ]
  );

  // 9. AI Analyses (Rich Summaries & Urgency)
  const aiAnalyses = [
    {
      id: "ai1001",
      cid: "c1000000-0000-0000-0000-000000000001",
      cat: "Ragging / Harassment",
      bid: "b1000000-0000-0000-0000-000000000003",
      conf: 0.96,
      summary: {
        core_issue: "Physical hazing and psychological harassment of first-year students in Block B hostel.",
        claimed_impact: "Students subjected to forced midnight detention, sleep deprivation, and psychological trauma with ongoing threats.",
        requested_redress: "Immediate disciplinary action against perpetrators and enforcement of zero-tolerance anti-ragging measures."
      }
    },
    {
      id: "ai1002",
      cid: "c1000000-0000-0000-0000-000000000002",
      cat: "Approval & Accreditation",
      bid: "b1000000-0000-0000-0000-000000000001",
      conf: 0.93,
      summary: {
        core_issue: "Unauthorized enrollment of 60 students beyond the AICTE sanctioned intake in AI program.",
        claimed_impact: "Overcrowded classrooms, severe deficiency in laboratory computing resources, and compromised academic standards.",
        requested_redress: "Audit of institutional admission records and enforcement of statutory intake limits."
      }
    },
    {
      id: "ai1006",
      cid: "c1000000-0000-0000-0000-000000000006",
      cat: "Ragging / Harassment",
      bid: "b1000000-0000-0000-0000-000000000003",
      conf: 0.94,
      summary: {
        core_issue: "Senior athletes intimidating junior students in sports dormitory during night-time parades.",
        claimed_impact: "Fear of academic reprisal and athletic benching preventing juniors from freely utilizing hostel facilities.",
        requested_redress: "Anti-Ragging squad surprise inspection and protection for affected student athletes."
      }
    }
  ];

  for (const a of aiAnalyses) {
    await db.execute(
      `INSERT OR REPLACE INTO ai_analyses (id, complaint_id, suggested_category, suggested_bureau_id, confidence, summary, model_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'synora-heuristics-v1', CURRENT_TIMESTAMP);`,
      [a.id, a.cid, a.cat, a.bid, a.conf, JSON.stringify(a.summary)]
    );
  }

  // 10. Role-Tailored Notifications
  const notifications = [
    // Complainant Rahul notifications
    {
      id: "m1000000-0000-0000-0000-000000000001",
      user_id: "u1000000-0000-0000-0000-000000000006",
      complaint_id: "c1000000-0000-0000-0000-000000000006",
      type: "RFI_REQUESTED",
      title: "Action Required: Clarification Requested",
      message: "Case Officer Pooja Deshmukh requested additional details for complaint SYN-2026-00106.",
      is_read: 0,
      link: "/complaints/c1000000-0000-0000-0000-000000000006",
      created_at: new Date(now.getTime() - 1 * 3600 * 1000).toISOString()
    },
    {
      id: "m1000000-0000-0000-0000-000000000002",
      user_id: "u1000000-0000-0000-0000-000000000006",
      complaint_id: "c1000000-0000-0000-0000-000000000003",
      type: "RESOLUTION_APPROVED",
      title: "Grievance Successfully Resolved",
      message: "Statutory notice enforced: Original certificates returned with zero financial penalty (SYN-2026-00089).",
      is_read: 1,
      link: "/complaints/c1000000-0000-0000-0000-000000000003",
      created_at: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString()
    },

    // Bureau Admin Meenakshi notifications
    {
      id: "m1000000-0000-0000-0000-000000000003",
      user_id: "u1000000-0000-0000-0000-000000000002",
      complaint_id: "c1000000-0000-0000-0000-000000000007",
      type: "RESOLUTION_PENDING_APPROVAL",
      title: "Proposed Resolution Awaiting Your Approval",
      message: "Officer Vikram Malhotra submitted a closure recommendation for off-campus center case SYN-2026-00107.",
      is_read: 0,
      link: "/complaints/c1000000-0000-0000-0000-000000000007",
      created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: "m1000000-0000-0000-0000-000000000005",
      user_id: "u1000000-0000-0000-0000-000000000002",
      complaint_id: "c1000000-0000-0000-0000-000000000010",
      type: "UNASSIGNED_CASE_ALERT",
      title: "New Unassigned Case in Approval Bureau",
      message: "Unapproved campus case SYN-2026-00110 requires vigilance officer assignment.",
      is_read: 0,
      link: "/complaints/c1000000-0000-0000-0000-000000000010",
      created_at: new Date(now.getTime() - 1 * 3600 * 1000).toISOString()
    },

    // System Admin Rajesh notifications
    {
      id: "m1000000-0000-0000-0000-000000000004",
      user_id: "u1000000-0000-0000-0000-000000000001",
      complaint_id: "c1000000-0000-0000-0000-000000000004",
      type: "SLA_BREACH_ALERT",
      title: "Overdue Case Escalation Alert",
      message: "Financial capitation case SYN-2026-00094 exceeded statutory 14-day SLA window and is escalated.",
      is_read: 0,
      link: "/complaints/c1000000-0000-0000-0000-000000000004",
      created_at: new Date(now.getTime() - 6 * 3600 * 1000).toISOString()
    },

    // Complainant Dr. Sunita notifications
    {
      id: "m1000000-0000-0000-0000-000000000006",
      user_id: "u1000000-0000-0000-0000-000000000007",
      complaint_id: "c1000000-0000-0000-0000-000000000008",
      type: "RFI_REQUESTED",
      title: "Action Required: Clarification Requested",
      message: "Grievance Redressal Cell requested API appraisal documentation for complaint SYN-2026-00108.",
      is_read: 0,
      link: "/complaints/c1000000-0000-0000-0000-000000000008",
      created_at: new Date(now.getTime() - 10 * 3600 * 1000).toISOString()
    }
  ];

  for (const n of notifications) {
    await db.execute(
      `INSERT OR REPLACE INTO notifications (id, user_id, complaint_id, type, title, message, is_read, link, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [n.id, n.user_id, n.complaint_id, n.type, n.title, n.message, n.is_read, n.link, n.created_at]
    );
  }

  // 11. Audit Security Logs
  const auditEntries = [
    { id: "a1001", actor: "u1000000-0000-0000-0000-000000000006", action: "COMPLAINT_SUBMITTED", type: "complaint", eid: "c1000000-0000-0000-0000-000000000001", newV: { reference_number: "SYN-2026-00101", priority: "CRITICAL" }, ip: "103.21.58.12", date: new Date(now.getTime() - 36 * 3600 * 1000).toISOString() },
    { id: "a1002", actor: "u1000000-0000-0000-0000-000000000003", action: "CASE_ASSIGNED", type: "complaint", eid: "c1000000-0000-0000-0000-000000000001", newV: { officer: "Pooja Deshmukh", bureau: "Anti-Ragging Cell" }, ip: "14.139.122.5", date: new Date(now.getTime() - 28 * 3600 * 1000).toISOString() },
    { id: "a1003", actor: "u1000000-0000-0000-0000-000000000005", action: "INTERNAL_NOTE_ADDED", type: "note", eid: "n1000000-0000-0000-0000-000000000001", newV: { confidential: true }, ip: "14.139.122.18", date: new Date(now.getTime() - 18 * 3600 * 1000).toISOString() },
    { id: "a1004", actor: "u1000000-0000-0000-0000-000000000002", action: "RESOLUTION_APPROVED", type: "resolution", eid: "s1000000-0000-0000-0000-000000000001", newV: { approved_by: "Prof. Meenakshi Sundaram" }, ip: "14.139.122.9", date: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString() }
  ];

  for (const a of auditEntries) {
    await db.execute(
      `INSERT OR REPLACE INTO audit_logs (id, actor_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [a.id, a.actor, a.action, a.type, a.eid, null, JSON.stringify(a.newV), a.ip, a.date]
    );
  }

  db.save();
  console.log("[Seed] Database successfully seeded with 9 comprehensive cases, timeline events, documents, and notifications.");
}

if (process.argv[1] && (process.argv[1].includes("seed.js") || process.argv[1].includes("seed.ts") || process.argv[1].endsWith("seed"))) {
  seedDatabase(true).then(() => {
    console.log("Seed command completed.");
    process.exit(0);
  }).catch((err) => {
    console.error("Seed command failed:", err);
    process.exit(1);
  });
}

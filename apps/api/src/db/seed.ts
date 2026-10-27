import bcrypt from 'bcryptjs';
import { db } from './connection.js';
import { runMigrations } from './migrate.js';

export async function seedDatabase(force: boolean = false): Promise<void> {
  await runMigrations();

  const userCount = await db.queryOne<{ count: number }>('SELECT count(*) as count FROM users;');
  if (userCount && userCount.count > 0 && !force) {
    console.log(`[Seed] Database already contains ${userCount.count} users. Skipping seed.`);
    return;
  }

  console.log('[Seed] Seeding database with fictional AICTE test dataset...');

  // Hash standard password: Synora@2026!
  const defaultHash = bcrypt.hashSync('Synora@2026!', 10);

  // 1. Bureaus
  const bureaus = [
    {
      id: 'b1000000-0000-0000-0000-000000000001',
      code: 'AB',
      name: 'Approval Bureau',
      description: 'Handles institutional approvals, extension of approval (EOA), course additions, and intake variations.',
      keywords: 'approval,eoa,intake,affiliation,unapproved,accreditation,aicte approval,closure'
    },
    {
      id: 'b1000000-0000-0000-0000-000000000002',
      code: 'GRC',
      name: 'Grievance Redressal Cell',
      description: 'Oversees institutional Ombudsman compliance and general student/faculty complaints.',
      keywords: 'ombudsman,grievance committee,victimization,harassment,complaint cell'
    },
    {
      id: 'b1000000-0000-0000-0000-000000000003',
      code: 'ARC',
      name: 'Anti-Ragging Cell',
      description: 'Investigates and enforces zero-tolerance anti-ragging measures and safety violations.',
      keywords: 'ragging,bullying,physical abuse,hostel harassment,threat,senior bullying,assault'
    },
    {
      id: 'b1000000-0000-0000-0000-000000000004',
      code: 'SFWC',
      name: 'Student & Faculty Welfare Cell',
      description: 'Addresses certificate retention, faculty pay scale anomalies, and termination disputes.',
      keywords: 'certificate,retention of documents,withholding marksheets,salary,unpaid stipend,provident fund,termination'
    },
    {
      id: 'b1000000-0000-0000-0000-000000000005',
      code: 'FAC',
      name: 'Finance & Auditing Cell',
      description: 'Audits capitation fees, unauthorized fees, and refund violations on admission cancellations.',
      keywords: 'capitation fee,overcharging,tuition fee,refund,admission cancellation,caution deposit'
    },
    {
      id: 'b1000000-0000-0000-0000-000000000006',
      code: 'QAIB',
      name: 'Quality Assurance & Inspection Bureau',
      description: 'Audits infrastructure deficiencies, ghost faculty, and laboratory equipment compliance.',
      keywords: 'infrastructure,lab equipment,library books,ghost faculty,cadre ratio,campus safety'
    }
  ];

  for (const b of bureaus) {
    await db.execute(
      `INSERT OR REPLACE INTO bureaus (id, code, name, description, is_active, routing_keywords)
       VALUES (?, ?, ?, ?, 1, ?);`,
      [b.id, b.code, b.name, b.description, b.keywords]
    );
  }

  // 2. Users
  const users = [
    {
      id: 'u1000000-0000-0000-0000-000000000001',
      email: 'admin@synora.aicte.gov.in',
      name: 'Dr. Rajesh Sharma',
      phone: '+91 98110 23456',
      role: 'system_admin',
      bureau_id: null,
      designation: 'Chief Information Officer & Administrator'
    },
    {
      id: 'u1000000-0000-0000-0000-000000000002',
      email: 'bureau.admin@synora.aicte.gov.in',
      name: 'Prof. Meenakshi Sundaram',
      phone: '+91 98220 34567',
      role: 'bureau_admin',
      bureau_id: 'b1000000-0000-0000-0000-000000000001',
      designation: 'Director (Approval Bureau)'
    },
    {
      id: 'u1000000-0000-0000-0000-000000000003',
      email: 'arc.admin@synora.aicte.gov.in',
      name: 'Dr. Anand Verma',
      phone: '+91 98330 45678',
      role: 'bureau_admin',
      bureau_id: 'b1000000-0000-0000-0000-000000000003',
      designation: 'Head, National Anti-Ragging Monitoring Cell'
    },
    {
      id: 'u1000000-0000-0000-0000-000000000004',
      email: 'officer.ab@synora.aicte.gov.in',
      name: 'Vikram Malhotra',
      phone: '+91 98440 56789',
      role: 'officer',
      bureau_id: 'b1000000-0000-0000-0000-000000000001',
      designation: 'Senior Vigilance & Case Officer'
    },
    {
      id: 'u1000000-0000-0000-0000-000000000005',
      email: 'officer.arc@synora.aicte.gov.in',
      name: 'Pooja Deshmukh',
      phone: '+91 98550 67890',
      role: 'officer',
      bureau_id: 'b1000000-0000-0000-0000-000000000003',
      designation: 'Rapid Response Officer'
    },
    {
      id: 'u1000000-0000-0000-0000-000000000006',
      email: 'rahul.student@example.com',
      name: 'Rahul Kumar',
      phone: '+91 99110 11223',
      role: 'complainant',
      bureau_id: null,
      designation: 'Undergraduate Engineering Student'
    },
    {
      id: 'u1000000-0000-0000-0000-000000000007',
      email: 'dr.sunita.faculty@example.com',
      name: 'Dr. Sunita Rao',
      phone: '+91 99220 22334',
      role: 'complainant',
      bureau_id: null,
      designation: 'Assistant Professor (Computer Science)'
    },
    {
      id: 'u1000000-0000-0000-0000-000000000008',
      email: 'reviewer@synora.aicte.gov.in',
      name: 'Justice (Retd.) K. Swaminathan',
      phone: '+91 99330 33445',
      role: 'reviewer',
      bureau_id: null,
      designation: 'Independent Ombudsman Reviewer'
    }
  ];

  for (const u of users) {
    await db.execute(
      `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, phone, role, bureau_id, designation, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);`,
      [u.id, u.email, defaultHash, u.name, u.phone, u.role, u.bureau_id, u.designation]
    );
  }

  // 3. Complaints
  const now = new Date();
  const complaints = [
    {
      id: 'c1000000-0000-0000-0000-000000000001',
      ref: 'SYN-2026-00101',
      complainant_id: 'u1000000-0000-0000-0000-000000000006',
      title: 'Severe physical hazing and psychological harassment in Block B hostel',
      description: 'First-year students in Block B boys hostel are being forcibly detained past midnight by senior students, subjected to verbal abuse and forced tasks. Despite notifying the hostel warden on Oct 14, no disciplinary action has been initiated and threats continue.',
      category: 'Ragging / Harassment',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      institution: 'Apex Institute of Engineering & Technology, Bengaluru',
      inst_id: '1-10492831',
      incident_date: '2026-10-14',
      bureau_id: 'b1000000-0000-0000-0000-000000000003',
      officer_id: 'u1000000-0000-0000-0000-000000000005',
      target_date: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000002',
      ref: 'SYN-2026-00102',
      complainant_id: 'u1000000-0000-0000-0000-000000000007',
      title: 'Unauthorized admission of 60 additional students in Artificial Intelligence program',
      description: 'The institution was sanctioned an intake of 60 seats by AICTE EOA for B.Tech AI & Data Science for 2026-27. However, the management has admitted 120 students by running an unapproved second shift without requisite faculty or lab facilities.',
      category: 'Approval & Accreditation',
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      institution: 'National School of Management & Technology, Pune',
      inst_id: '1-28491023',
      incident_date: '2026-09-28',
      bureau_id: 'b1000000-0000-0000-0000-000000000001',
      officer_id: 'u1000000-0000-0000-0000-000000000004',
      target_date: new Date(now.getTime() + 6 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000003',
      ref: 'SYN-2026-00089',
      complainant_id: 'u1000000-0000-0000-0000-000000000006',
      title: 'Unlawful retention of original 10th and 12th certificates upon voluntary discontinuation',
      description: 'Student requested discontinuation of studies due to medical reasons within the permitted notice period. Administration demanded payment of remaining 3 years tuition fees before releasing original mark sheets in direct violation of AICTE guidelines.',
      category: 'Faculty & Staff Grievance',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      institution: 'Saraswati College of Polytechnic & Architecture, Bhopal',
      inst_id: '1-39481029',
      incident_date: '2026-09-10',
      bureau_id: 'b1000000-0000-0000-0000-000000000004',
      officer_id: null,
      target_date: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 20 * 24 * 3600 * 1000).toISOString(),
      resolved_at: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000004',
      ref: 'SYN-2026-00094',
      complainant_id: 'u1000000-0000-0000-0000-000000000007',
      title: 'Mandatory cash capitation fee of INR 2,50,000 disguised as building development fund',
      description: 'Institution is compelling students under government quota counseling to submit mandatory cash receipts without proper tax invoices under the pretext of an unaudited development fund, failing which laboratory access is withheld.',
      category: 'Fee & Financial Malpractice',
      priority: 'HIGH',
      status: 'ESCALATED',
      institution: 'Imperial Institute of Computer Applications, Lucknow',
      inst_id: '1-48291048',
      incident_date: '2026-09-15',
      bureau_id: 'b1000000-0000-0000-0000-000000000005',
      officer_id: null,
      target_date: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 16 * 24 * 3600 * 1000).toISOString(),
      is_escalated: 1,
      escalation_reason: 'Institution failed to provide financial ledger upon statutory 14-day notice; referred to State Oversight Committee.'
    },
    {
      id: 'c1000000-0000-0000-0000-000000000005',
      ref: 'SYN-2026-00105',
      complainant_id: 'u1000000-0000-0000-0000-000000000006',
      title: 'Defective civil laboratory and absent emergency fire exit in engineering workshop',
      description: 'Workshop ceiling has severe structural leaks and concrete spalling. Fire extinguishers expired in 2024 with no fire department clearance for the main workshop building housing heavy machinery.',
      category: 'Infrastructure & Safety',
      priority: 'MEDIUM',
      status: 'SUBMITTED',
      institution: 'Vanguard Technical University Affiliated College, Chennai',
      inst_id: '1-59281039',
      incident_date: '2026-10-25',
      bureau_id: 'b1000000-0000-0000-0000-000000000006',
      officer_id: null,
      target_date: new Date(now.getTime() + 13 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString()
    }
  ];

  for (const c of complaints) {
    await db.execute(
      `INSERT OR REPLACE INTO complaints (
        id, reference_number, complainant_id, title, description, category, priority, status,
        institution_name, institution_id, incident_date, bureau_id, assigned_officer_id,
        target_resolution_date, resolved_at, is_escalated, escalation_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        c.id, c.ref, c.complainant_id, c.title, c.description, c.category, c.priority, c.status,
        c.institution, c.inst_id, c.incident_date, c.bureau_id, c.officer_id,
        c.target_date, c.resolved_at || null, c.is_escalated || 0, c.escalation_reason || null,
        c.created_at, c.created_at
      ]
    );
  }

  // 4. Internal notes
  await db.execute(
    `INSERT OR REPLACE INTO internal_notes (id, complaint_id, author_id, note, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    [
      'n1000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000001',
      'u1000000-0000-0000-0000-000000000005',
      'Contacted Local District Magistrate and Anti-Ragging Squad. Institutional warden admitted receiving verbal notice. Inspection scheduled for tomorrow morning.',
      new Date(now.getTime() - 18 * 3600 * 1000).toISOString()
    ]
  );

  // 5. RFIs
  await db.execute(
    `INSERT OR REPLACE INTO information_requests (
      id, complaint_id, officer_id, complainant_id, request_details, response_details, status, requested_at, responded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'r1000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000001',
      'u1000000-0000-0000-0000-000000000005',
      'u1000000-0000-0000-0000-000000000006',
      'Please confirm the room numbers in Block B where the incident occurred and provide the date on which the written complaint was given to the hostel warden.',
      'Room numbers are 304 and 308 on 3rd floor. Written copy was handed to Warden Dr. R. K. Nair on Oct 14 at 10:30 AM.',
      'RESPONDED',
      new Date(now.getTime() - 19 * 3600 * 1000).toISOString(),
      new Date(now.getTime() - 17 * 3600 * 1000).toISOString()
    ]
  );

  // 6. Resolutions
  await db.execute(
    `INSERT OR REPLACE INTO resolutions (
      id, complaint_id, proposed_by_id, approved_by_id, findings, resolution_summary, complainant_visible_summary, approved_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      's1000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000003',
      'u1000000-0000-0000-0000-000000000004',
      'u1000000-0000-0000-0000-000000000002',
      'Investigation verified that complainant had submitted formal withdrawal within 15 days of admission commencement. Withholding certificates violates AICTE Approval Process Handbook Appendix 8.',
      'Statutory notice issued to Principal. Institution returned original 10th and 12th certificates to student on Oct 20 with zero financial penalty.',
      'Your original certificates have been successfully retrieved and returned to you by the institution following AICTE directive. No penalty was levied.',
      new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
      new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString()
    ]
  );

  // 7. Notifications
  await db.execute(
    `INSERT OR REPLACE INTO notifications (id, user_id, complaint_id, type, title, message, is_read, link, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?);`,
    [
      'm1000000-0000-0000-0000-000000000001',
      'u1000000-0000-0000-0000-000000000006',
      'c1000000-0000-0000-0000-000000000001',
      'STATUS_UPDATE',
      'Case Status Updated to In Progress',
      'Your complaint SYN-2026-00101 is actively being investigated by the Anti-Ragging Cell.',
      '/complaints/c1000000-0000-0000-0000-000000000001',
      new Date(now.getTime() - 20 * 3600 * 1000).toISOString()
    ]
  );

  // 8. Audit Logs
  await db.execute(
    `INSERT OR REPLACE INTO audit_logs (id, actor_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'a1000000-0000-0000-0000-000000000001',
      'u1000000-0000-0000-0000-000000000006',
      'COMPLAINT_SUBMITTED',
      'complaint',
      'c1000000-0000-0000-0000-000000000001',
      null,
      JSON.stringify({ reference_number: 'SYN-2026-00101', priority: 'CRITICAL' }),
      '127.0.0.1',
      new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
    ]
  );

  db.save();
  console.log('[Seed] Database successfully seeded with AICTE fictional institutional data.');
}

if (process.argv[1] && process.argv[1].includes('seed.ts')) {
  seedDatabase(true).then(() => {
    console.log('Seed command completed.');
    process.exit(0);
  }).catch((err) => {
    console.error('Seed command failed:', err);
    process.exit(1);
  });
}

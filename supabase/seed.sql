-- ====================================================================
-- SYNORA: AICTE Institutional Grievance & Complaint Tracking Platform
-- Seed Data: Development & Testing (All data strictly fictional)
-- ====================================================================

-- 1. SEED BUREAUS & CELLS
INSERT INTO bureaus (id, code, name, description, is_active, routing_keywords) VALUES
('b1000000-0000-0000-0000-000000000001', 'AB', 'Approval Bureau', 'Handles institutional approvals, extension of approval (EOA), course additions, and intake variations.', true, 'approval,eoa,intake,affiliation,unapproved,accreditation,aicte approval,closure'),
('b1000000-0000-0000-0000-000000000002', 'GRC', 'Grievance Redressal Cell', 'Oversees institutional Ombudsman compliance and general student/faculty complaints.', true, 'ombudsman,grievance committee,victimization,harassment,complaint cell'),
('b1000000-0000-0000-0000-000000000003', 'ARC', 'Anti-Ragging Cell', 'Investigates and enforces zero-tolerance anti-ragging measures and safety violations.', true, 'ragging,bullying,physical abuse,hostel harassment,threat,senior bullying,assault'),
('b1000000-0000-0000-0000-000000000004', 'SFWC', 'Student & Faculty Welfare Cell', 'Addresses certificate retention, faculty pay scale anomalies, and termination disputes.', true, 'certificate,retention of documents,withholding marksheets,salary,unpaid stipend,provident fund,termination'),
('b1000000-0000-0000-0000-000000000005', 'FAC', 'Finance & Auditing Cell', 'Audits capitation fees, unauthorized fees, and refund violations on admission cancellations.', true, 'capitation fee,overcharging,tuition fee,refund,admission cancellation,caution deposit'),
('b1000000-0000-0000-0000-000000000006', 'QAIB', 'Quality Assurance & Inspection Bureau', 'Audits infrastructure deficiencies, ghost faculty, and laboratory equipment compliance.', true, 'infrastructure,lab equipment,library books,ghost faculty,cadre ratio,campus safety');

-- 2. SEED USERS
-- Default password for all seed accounts is: Synora@2026!
-- Bcrypt hash generated with 10 salt rounds:
-- $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi (standard test hash) or Synora generated
INSERT INTO users (id, email, password_hash, full_name, phone, role, bureau_id, designation, is_active) VALUES
-- System Administrator
('u1000000-0000-0000-0000-000000000001', 'admin@synora.aicte.gov.in', '$2a$10$7Z8q2U/3y8Vq4DqU7r3bseL35E8lqK5x9tE1p5J6y7v4O1w2X3z4y', 'Dr. Rajesh Sharma', '+91 98110 23456', 'system_admin', NULL, 'Chief Information Officer & Administrator', true),

-- Bureau Admins
('u1000000-0000-0000-0000-000000000002', 'bureau.admin@synora.aicte.gov.in', '$2a$10$7Z8q2U/3y8Vq4DqU7r3bseL35E8lqK5x9tE1p5J6y7v4O1w2X3z4y', 'Prof. Meenakshi Sundaram', '+91 98220 34567', 'bureau_admin', 'b1000000-0000-0000-0000-000000000001', 'Director (Approval Bureau)', true),
('u1000000-0000-0000-0000-000000000003', 'arc.admin@synora.aicte.gov.in', '$2a$10$7Z8q2U/3y8Vq4DqU7r3bseL35E8lqK5x9tE1p5J6y7v4O1w2X3z4y', 'Dr. Anand Verma', '+91 98330 45678', 'bureau_admin', 'b1000000-0000-0000-0000-000000000003', 'Head, National Anti-Ragging Monitoring Cell', true),

-- Case Officers
('u1000000-0000-0000-0000-000000000004', 'officer.ab@synora.aicte.gov.in', '$2a$10$7Z8q2U/3y8Vq4DqU7r3bseL35E8lqK5x9tE1p5J6y7v4O1w2X3z4y', 'Vikram Malhotra', '+91 98440 56789', 'officer', 'b1000000-0000-0000-0000-000000000001', 'Senior Vigilance & Case Officer', true),
('u1000000-0000-0000-0000-000000000005', 'officer.arc@synora.aicte.gov.in', '$2a$10$7Z8q2U/3y8Vq4DqU7r3bseL35E8lqK5x9tE1p5J6y7v4O1w2X3z4y', 'Pooja Deshmukh', '+91 98550 67890', 'officer', 'b1000000-0000-0000-0000-000000000003', 'Rapid Response Officer', true),

-- Complainants
('u1000000-0000-0000-0000-000000000006', 'rahul.student@example.com', '$2a$10$7Z8q2U/3y8Vq4DqU7r3bseL35E8lqK5x9tE1p5J6y7v4O1w2X3z4y', 'Rahul Kumar', '+91 99110 11223', 'complainant', NULL, 'Undergraduate Engineering Student', true),
('u1000000-0000-0000-0000-000000000007', 'dr.sunita.faculty@example.com', '$2a$10$7Z8q2U/3y8Vq4DqU7r3bseL35E8lqK5x9tE1p5J6y7v4O1w2X3z4y', 'Dr. Sunita Rao', '+91 99220 22334', 'complainant', NULL, 'Assistant Professor (Computer Science)', true),

-- Reviewer / Oversight
('u1000000-0000-0000-0000-000000000008', 'reviewer@synora.aicte.gov.in', '$2a$10$7Z8q2U/3y8Vq4DqU7r3bseL35E8lqK5x9tE1p5J6y7v4O1w2X3z4y', 'Justice (Retd.) K. Swaminathan', '+91 99330 33445', 'reviewer', NULL, 'Independent Ombudsman & Council Reviewer', true);

-- 3. SEED COMPLAINTS
INSERT INTO complaints (
    id, reference_number, complainant_id, title, description, category, priority, status,
    institution_name, institution_id, incident_date, bureau_id, assigned_officer_id,
    target_resolution_date, is_escalated, escalation_reason, created_at, updated_at
) VALUES
-- Case 1: Active Anti-Ragging Case
('c1000000-0000-0000-0000-000000000001', 'SYN-2026-00101', 'u1000000-0000-0000-0000-000000000006',
'Severe physical hazing and psychological harassment in Block B hostel',
'First-year students in Block B boys hostel are being forcibly detained past midnight by senior students, subjected to verbal abuse and forced tasks. Despite notifying the hostel warden on Oct 14, no disciplinary action has been initiated and threats continue.',
'Ragging / Harassment', 'CRITICAL', 'IN_PROGRESS',
'Apex Institute of Engineering & Technology, Bengaluru', '1-10492831',
'2026-10-14', 'b1000000-0000-0000-0000-000000000003', 'u1000000-0000-0000-0000-000000000005',
CURRENT_TIMESTAMP + INTERVAL '2 days', false, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '2 hours'),

-- Case 2: Approval Bureau - Unapproved intake
('c1000000-0000-0000-0000-000000000002', 'SYN-2026-00102', 'u1000000-0000-0000-0000-000000000007',
'Unauthorized admission of 60 additional students in Artificial Intelligence program',
'The institution was sanctioned an intake of 60 seats by AICTE EOA for B.Tech AI & Data Science for 2026-27. However, the management has admitted 120 students by running an unapproved second shift without requisite faculty or lab facilities.',
'Approval & Accreditation', 'HIGH', 'UNDER_REVIEW',
'National School of Management & Technology, Pune', '1-28491023',
'2026-09-28', 'b1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000004',
CURRENT_TIMESTAMP + INTERVAL '6 days', false, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '1 day'),

-- Case 3: Student Welfare - Withholding original certificates (Resolved)
('c1000000-0000-0000-0000-000000000003', 'SYN-2026-00089', 'u1000000-0000-0000-0000-000000000006',
'Unlawful retention of original 10th and 12th certificates upon voluntary discontinuation',
'Student requested discontinuation of studies due to medical reasons within the permitted notice period. Administration demanded payment of remaining 3 years tuition fees before releasing original mark sheets in direct violation of AICTE guidelines.',
'Faculty & Staff Grievance', 'MEDIUM', 'RESOLVED',
'Saraswati College of Polytechnic & Architecture, Bhopal', '1-39481029',
'2026-09-10', 'b1000000-0000-0000-0000-000000000004', NULL,
CURRENT_TIMESTAMP - INTERVAL '5 days', false, NULL, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- Case 4: Finance Cell - Escalated fee discrepancy
('c1000000-0000-0000-0000-000000000004', 'SYN-2026-00094', 'u1000000-0000-0000-0000-000000000007',
'Mandatory cash capitation fee of INR 2,50,000 disguised as building development fund',
'Institution is compelling students under government quota counseling to submit mandatory cash receipts without proper tax invoices under the pretext of an unaudited development fund, failing which laboratory access is withheld.',
'Fee & Financial Malpractice', 'HIGH', 'ESCALATED',
'Imperial Institute of Computer Applications, Lucknow', '1-48291048',
'2026-09-15', 'b1000000-0000-0000-0000-000000000005', NULL,
CURRENT_TIMESTAMP - INTERVAL '2 days', true, 'Institution failed to provide financial ledger upon statutory 14-day notice; referred to State Oversight Committee.', CURRENT_TIMESTAMP - INTERVAL '16 days', CURRENT_TIMESTAMP - INTERVAL '1 day'),

-- Case 5: New Submitted Complaint awaiting triage
('c1000000-0000-0000-0000-000000000005', 'SYN-2026-00105', 'u1000000-0000-0000-0000-000000000006',
'Defective civil laboratory and absent emergency fire exit in engineering workshop',
'Workshop ceiling has severe structural leaks and concrete spalling. Fire extinguishers expired in 2024 with no fire department clearance for the main workshop building housing heavy machinery.',
'Infrastructure & Safety', 'MEDIUM', 'SUBMITTED',
'Vanguard Technical University Affiliated College, Chennai', '1-59281039',
'2026-10-25', 'b1000000-0000-0000-0000-000000000006', NULL,
CURRENT_TIMESTAMP + INTERVAL '13 days', false, NULL, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- 4. SEED INTERNAL NOTES (Confidential - Staff Only)
INSERT INTO internal_notes (id, complaint_id, author_id, note, created_at) VALUES
('n1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000005',
'Contacted Local District Magistrate and Anti-Ragging Squad. Institutional warden admitted receiving verbal notice. Inspection scheduled for tomorrow morning.', CURRENT_TIMESTAMP - INTERVAL '18 hours'),
('n1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'u1000000-0000-0000-0000-000000000004',
'Cross-verified AICTE EOA portal record for 2026-27. Sanctioned seat count is strictly 60. College portal advertises two sections of 60. Clear prima facie violation of approval handbook.', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- 5. SEED STATUS HISTORY
INSERT INTO complaint_status_history (id, complaint_id, actor_id, from_status, to_status, note, created_at) VALUES
('h1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000006', NULL, 'SUBMITTED', 'Grievance submitted by complainant', CURRENT_TIMESTAMP - INTERVAL '24 hours'),
('h1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003', 'SUBMITTED', 'ACKNOWLEDGED', 'Case prioritized and assigned to Anti-Ragging Cell Rapid Response Officer', CURRENT_TIMESTAMP - INTERVAL '22 hours'),
('h1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000005', 'ACKNOWLEDGED', 'IN_PROGRESS', 'Active investigation commenced. Confidential inquiry underway.', CURRENT_TIMESTAMP - INTERVAL '20 hours');

-- 6. SEED INFORMATION REQUESTS (RFI)
INSERT INTO information_requests (id, complaint_id, officer_id, complainant_id, request_details, response_details, status, requested_at, responded_at) VALUES
('r1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000005', 'u1000000-0000-0000-0000-000000000006',
'Please confirm the room numbers in Block B where the incident occurred and provide the date on which the written complaint was given to the hostel warden.',
'Room numbers are 304 and 308 on 3rd floor. Written copy was handed to Warden Dr. R. K. Nair on Oct 14 at 10:30 AM.', 'RESPONDED', CURRENT_TIMESTAMP - INTERVAL '19 hours', CURRENT_TIMESTAMP - INTERVAL '17 hours');

-- 7. SEED RESOLUTIONS
INSERT INTO resolutions (id, complaint_id, proposed_by_id, approved_by_id, findings, resolution_summary, complainant_visible_summary, approved_at, created_at) VALUES
('s1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'u1000000-0000-0000-0000-000000000004', 'u1000000-0000-0000-0000-000000000002',
'Investigation verified that complainant had submitted formal withdrawal within 15 days of admission commencement. Withholding certificates violates AICTE Approval Process Handbook Appendix 8.',
'Statutory notice issued to Principal. Institution returned original 10th and 12th certificates to student on Oct 20 with zero financial penalty.',
'Your original certificates have been successfully retrieved and returned to you by the institution following AICTE directive. No penalty was levied.',
CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '4 days');

-- 8. SEED NOTIFICATIONS
INSERT INTO notifications (id, user_id, complaint_id, type, title, message, is_read, link, created_at) VALUES
('m1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001',
'STATUS_UPDATE', 'Case Status Updated to In Progress', 'Your complaint SYN-2026-00101 is actively being investigated by the Anti-Ragging Cell.', false, '/complaints/c1000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP - INTERVAL '20 hours'),
('m1000000-0000-0000-0000-000000000002', 'u1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003',
'RESOLUTION', 'Complaint Resolved: Certificates Released', 'Your complaint SYN-2026-00089 has been successfully resolved. Please review the resolution summary.', true, '/complaints/c1000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- 9. SEED AUDIT LOG
INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at) VALUES
('a1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000006', 'COMPLAINT_SUBMITTED', 'complaint', 'c1000000-0000-0000-0000-000000000001', NULL, '{"reference_number": "SYN-2026-00101", "priority": "CRITICAL"}', '10.0.4.12', CURRENT_TIMESTAMP - INTERVAL '24 hours'),
('a1000000-0000-0000-0000-000000000002', 'u1000000-0000-0000-0000-000000000003', 'COMPLAINT_ASSIGNED', 'complaint', 'c1000000-0000-0000-0000-000000000001', '{"assigned_officer_id": null}', '{"assigned_officer_id": "u1000000-0000-0000-0000-000000000005"}', '10.0.1.5', CURRENT_TIMESTAMP - INTERVAL '22 hours');

import { db } from "./connection.js";

export async function clearComplaints() {
  await db.initialize();
  console.log("[Clean] Removing all existing complaints and associated transactional records...");

  await db.execute("DELETE FROM complaint_status_history;");
  await db.execute("DELETE FROM internal_notes;");
  await db.execute("DELETE FROM information_requests;");
  await db.execute("DELETE FROM resolutions;");
  await db.execute("DELETE FROM escalations;");
  await db.execute("DELETE FROM complaint_documents;");
  await db.execute("DELETE FROM ai_analyses;");
  await db.execute("DELETE FROM notifications;");
  await db.execute("DELETE FROM audit_logs;");
  await db.execute("DELETE FROM assignments;");
  await db.execute("DELETE FROM complaints;");

  db.save();

  const count = await db.queryOne("SELECT count(*) as count FROM complaints;");
  console.log(`[Clean] Done! Complaints remaining: ${count.count}`);
}

if (process.argv[1] && process.argv[1].includes("clear")) {
  clearComplaints().then(() => {
    console.log("[Clean] Database is now completely clean of any cases or complaints.");
    process.exit(0);
  }).catch((err) => {
    console.error("[Clean] Error clearing complaints:", err);
    process.exit(1);
  });
}

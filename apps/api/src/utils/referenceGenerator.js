import { db } from "../db/connection.js";
export async function generateComplaintReference() {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const prefix = `SYN-${currentYear}-%`;
  const latest = await db.queryOne(
    `SELECT reference_number FROM complaints 
     WHERE reference_number LIKE ? 
     ORDER BY reference_number DESC 
     LIMIT 1;`,
    [prefix]
  );
  let nextSequence = 101;
  if (latest && latest.reference_number) {
    const parts = latest.reference_number.split("-");
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq)) {
        nextSequence = seq + 1;
      }
    }
  }
  const paddedSequence = String(nextSequence).padStart(5, "0");
  return `SYN-${currentYear}-${paddedSequence}`;
}

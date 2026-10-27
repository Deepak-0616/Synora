import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
export async function notifyUser(params) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO notifications (id, user_id, complaint_id, type, title, message, is_read, link, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP);`,
    [
      id,
      params.userId,
      params.complaintId || null,
      params.type,
      params.title,
      params.message,
      params.link || null
    ]
  );
  return {
    id,
    user_id: params.userId,
    complaint_id: params.complaintId,
    type: params.type,
    title: params.title,
    message: params.message,
    is_read: 0,
    link: params.link,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
export async function getUserNotifications(userId, limit = 20) {
  return db.query(
    `SELECT * FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ?;`,
    [userId, limit]
  );
}
export async function markNotificationAsRead(id, userId) {
  const result = await db.execute(
    `UPDATE notifications 
     SET is_read = 1 
     WHERE id = ? AND user_id = ?;`,
    [id, userId]
  );
  return result.changes > 0;
}
export async function markAllNotificationsAsRead(userId) {
  const result = await db.execute(
    `UPDATE notifications 
     SET is_read = 1 
     WHERE user_id = ? AND is_read = 0;`,
    [userId]
  );
  return result.changes;
}

import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { Notification } from '../types/index.js';

export interface CreateNotificationParams {
  userId: string;
  complaintId?: string | null;
  type: string;
  title: string;
  message: string;
  link?: string | null;
}

export async function notifyUser(params: CreateNotificationParams): Promise<Notification> {
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
    created_at: new Date().toISOString()
  };
}

export async function getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
  return db.query<Notification>(
    `SELECT * FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ?;`,
    [userId, limit]
  );
}

export async function markNotificationAsRead(id: string, userId: string): Promise<boolean> {
  const result = await db.execute(
    `UPDATE notifications 
     SET is_read = 1 
     WHERE id = ? AND user_id = ?;`,
    [id, userId]
  );
  return result.changes > 0;
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await db.execute(
    `UPDATE notifications 
     SET is_read = 1 
     WHERE user_id = ? AND is_read = 0;`,
    [userId]
  );
  return result.changes;
}

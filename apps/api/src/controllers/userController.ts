import { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { User, AuditLog } from '../types/index.js';
import { logAudit } from '../services/auditService.js';

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, bureau_id, search } = req.query;
    const where: string[] = [];
    const params: any[] = [];

    if (role) {
      where.push('u.role = ?');
      params.push(role);
    }
    if (bureau_id) {
      where.push('u.bureau_id = ?');
      params.push(bureau_id);
    }
    if (search) {
      where.push('(u.full_name LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const users = await db.query<User>(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.bureau_id, u.designation, u.is_active, u.created_at,
              b.name as bureau_name, b.code as bureau_code
       FROM users u
       LEFT JOIN bureaus b ON u.bureau_id = b.id
       ${whereSql}
       ORDER BY u.created_at DESC;`,
      params
    );

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'system_admin') {
      res.status(403).json({ error: 'Only system administrators can modify user roles and assignments.' });
      return;
    }

    const { userId } = req.params;
    const { role, bureau_id, is_active } = req.body;

    // Prevent admin from deactivating themselves
    if (userId === req.user.userId && is_active === 0) {
      res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
      return;
    }

    const existing = await db.queryOne<User>('SELECT * FROM users WHERE id = ?;', [userId]);
    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await db.execute(
      `UPDATE users
       SET role = COALESCE(?, role),
           bureau_id = ?,
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [role || null, bureau_id !== undefined ? bureau_id : existing.bureau_id, is_active !== undefined ? is_active : null, userId]
    );

    await logAudit({
      actorId: req.user.userId,
      action: 'USER_ROLE_UPDATED',
      entityType: 'user',
      entityId: userId,
      oldValues: { role: existing.role, bureau_id: existing.bureau_id, is_active: existing.is_active },
      newValues: { role, bureau_id, is_active },
      ipAddress: req.ip || req.socket.remoteAddress
    });

    const updated = await db.queryOne<User>('SELECT id, email, full_name, role, bureau_id, is_active FROM users WHERE id = ?;', [userId]);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user || (req.user.role !== 'system_admin' && req.user.role !== 'reviewer')) {
      res.status(403).json({ error: 'Access denied. Audit logs require system administrator or oversight reviewer permissions.' });
      return;
    }

    const logs = await db.query<AuditLog>(
      `SELECT a.*, u.full_name as actor_name, u.role as actor_role
       FROM audit_logs a
       LEFT JOIN users u ON a.actor_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 100;`
    );

    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
}

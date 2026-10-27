import { Request, Response, NextFunction } from 'express';
import * as notifService from '../services/notificationService.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const notifs = await notifService.getUserNotifications(req.user.userId);
    res.status(200).json(notifs);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    await notifService.markNotificationAsRead(id, req.user.userId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const count = await notifService.markAllNotificationsAsRead(req.user.userId);
    res.status(200).json({ success: true, markedCount: count });
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import { createComplaintSchema, assignComplaintSchema, transitionStatusSchema } from '../schemas/index.js';
import { ComplaintService } from '../services/complaintService.js';
import { ComplaintPriority, ComplaintStatus } from '../types/index.js';

export async function createComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const validated = createComplaintSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;

    const complaint = await ComplaintService.createComplaint({
      complainantId: req.user.userId,
      title: validated.title,
      description: validated.description,
      category: validated.category,
      priority: validated.priority as ComplaintPriority,
      institution_name: validated.institution_name,
      institution_id: validated.institution_id,
      incident_date: validated.incident_date,
      bureau_id: validated.bureau_id,
      ipAddress: ip
    });

    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
}

export async function listComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { status, category, priority, bureau_id, search, page, limit } = req.query;

    const result = await ComplaintService.listComplaints({
      userRole: req.user.role,
      userId: req.user.userId,
      userBureauId: req.user.bureauId,
      status: status as string,
      category: category as string,
      priority: priority as string,
      bureau_id: bureau_id as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 15
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const complaint = await ComplaintService.getComplaintById(id, req.user.userId, req.user.role, req.user.bureauId);

    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    res.status(200).json(complaint);
  } catch (err) {
    next(err);
  }
}

export async function getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    // Verify user can access this complaint first
    const complaint = await ComplaintService.getComplaintById(id, req.user.userId, req.user.role, req.user.bureauId);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    const history = await ComplaintService.getStatusHistory(id);
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}

export async function transitionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const validated = transitionStatusSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;

    const updated = await ComplaintService.transitionStatus(
      id,
      validated.to_status as ComplaintStatus,
      req.user.userId,
      req.user.role,
      validated.note,
      validated.rejection_reason,
      ip
    );

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export async function assignComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const validated = assignComplaintSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;

    const updated = await ComplaintService.assignComplaint(
      id,
      validated.bureau_id,
      validated.officer_id,
      req.user.userId,
      req.user.role,
      validated.notes,
      ip
    );

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import { rfiRequestSchema, rfiResponseSchema } from '../schemas/index.js';
import { RFIService } from '../services/rfiService.js';

export async function createRFI(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const validated = rfiRequestSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;

    const rfi = await RFIService.createRFI(id, req.user.userId, req.user.role, validated.request_details, ip);
    res.status(201).json(rfi);
  } catch (err) {
    next(err);
  }
}

export async function respondRFI(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { rfiId } = req.params;
    const validated = rfiResponseSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;

    const rfi = await RFIService.respondRFI(rfiId, req.user.userId, validated.response_details, ip);
    res.status(200).json(rfi);
  } catch (err) {
    next(err);
  }
}

export async function getRFIs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const rfis = await RFIService.getComplaintRFIs(id);
    res.status(200).json(rfis);
  } catch (err) {
    next(err);
  }
}

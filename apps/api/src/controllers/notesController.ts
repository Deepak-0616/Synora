import { Request, Response, NextFunction } from 'express';
import { internalNoteSchema } from '../schemas/index.js';
import { NotesService } from '../services/notesService.js';

export async function addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const validated = internalNoteSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;

    const note = await NotesService.addNote(id, req.user.userId, req.user.role, validated.note, ip);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

export async function getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const notes = await NotesService.getNotes(id, req.user.role);
    res.status(200).json(notes);
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.js';

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized to perform this operation. Required: [${allowedRoles.join(', ')}]`
      });
      return;
    }

    next();
  };
}

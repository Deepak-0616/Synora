import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  logger.error(`Error in ${req.method} ${req.path}: ${err.message}`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected internal server error occurred. Please try again later.'
    : err.message || 'An internal error occurred.';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

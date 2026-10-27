import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(windowMs: number = 60 * 1000, maxRequests: number = 30) {
  const clients = new Map<string, RateLimitRecord>();

  // Periodically clean expired keys
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(ip);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const client = clients.get(ip);

    if (!client || now > client.resetTime) {
      clients.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    client.count++;
    if (client.count > maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please slow down and try again shortly.'
      });
      return;
    }

    next();
  };
}

export function createRateLimiter(windowMs = 60 * 1e3, maxRequests = 30) {
  const clients = /* @__PURE__ */ new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(ip);
      }
    }
  }, windowMs);
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
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
        error: "Too many requests. Please slow down and try again shortly."
      });
      return;
    }
    next();
  };
}

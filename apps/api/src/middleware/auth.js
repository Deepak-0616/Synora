import { verifyToken } from "../utils/jwt.js";
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.status(401).json({ error: "Authentication required. Authorization header missing." });
    return;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Invalid authorization format. Expected: Bearer <token>" });
    return;
  }
  const token = parts[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Session expired or invalid token. Please sign in again." });
    return;
  }
}

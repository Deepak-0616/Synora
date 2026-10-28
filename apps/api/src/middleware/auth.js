import { verifyToken } from "../utils/jwt.js";
export function authenticateToken(req, res, next) {
  let token = null;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: "Authentication required. Authorization token missing." });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Session expired or invalid token. Please sign in again." });
    return;
  }
}

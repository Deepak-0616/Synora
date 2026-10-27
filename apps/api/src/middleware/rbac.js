export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized to perform this operation. Required: [${allowedRoles.join(", ")}]`
      });
      return;
    }
    next();
  };
}

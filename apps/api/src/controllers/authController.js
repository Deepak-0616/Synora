import { registerSchema, loginSchema } from "../schemas/index.js";
import * as authService from "../services/authService.js";
export async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;
    const result = await authService.register(validated, ip);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
export async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;
    const result = await authService.login({ ...validated, ipAddress: ip });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
export async function getMe(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}
export async function updateMe(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { full_name, phone, designation } = req.body;
    const updated = await authService.updateUserProfile(req.user.userId, { full_name, phone, designation });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

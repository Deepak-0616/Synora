import { proposeResolutionSchema } from "../schemas/index.js";
import { ResolutionService } from "../services/resolutionService.js";
export async function proposeResolution(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { id } = req.params;
    const validated = proposeResolutionSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;
    const resolution = await ResolutionService.proposeResolution(
      id,
      req.user.userId,
      req.user.role,
      validated,
      ip
    );
    res.status(201).json(resolution);
  } catch (err) {
    next(err);
  }
}
export async function approveResolution(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { resolutionId } = req.params;
    const ip = req.ip || req.socket.remoteAddress;
    const resolution = await ResolutionService.approveResolution(
      resolutionId,
      req.user.userId,
      req.user.role,
      ip
    );
    res.status(200).json(resolution);
  } catch (err) {
    next(err);
  }
}
export async function getResolution(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { id } = req.params;
    const resolution = await ResolutionService.getComplaintResolution(id, req.user.role);
    if (!resolution) {
      res.status(404).json({ error: "No resolution documented for this complaint yet." });
      return;
    }
    res.status(200).json(resolution);
  } catch (err) {
    next(err);
  }
}

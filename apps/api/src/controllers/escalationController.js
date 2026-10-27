import { escalateComplaintSchema } from "../schemas/index.js";
import { EscalationService } from "../services/escalationService.js";
export async function escalateCase(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { id } = req.params;
    const validated = escalateComplaintSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress;
    const escalation = await EscalationService.escalateCase(
      id,
      req.user.userId,
      req.user.role,
      validated.reason,
      validated.to_bureau_id,
      ip
    );
    res.status(201).json(escalation);
  } catch (err) {
    next(err);
  }
}
export async function getEscalations(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { id } = req.params;
    const escalations = await EscalationService.getComplaintEscalations(id);
    res.status(200).json(escalations);
  } catch (err) {
    next(err);
  }
}

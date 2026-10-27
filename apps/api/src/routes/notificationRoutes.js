import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as notifCtrl from "../controllers/notificationController.js";
const router = Router();
router.use(authenticateToken);
router.get("/", notifCtrl.getNotifications);
router.patch("/:id/read", notifCtrl.markAsRead);
router.post("/read-all", notifCtrl.markAllAsRead);
export default router;

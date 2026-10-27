import { AnalyticsService } from "../services/analyticsService.js";
export async function getOverview(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const kpis = await AnalyticsService.getOverviewKPIs(req.user.role, req.user.userId, req.user.bureauId);
    res.status(200).json(kpis);
  } catch (err) {
    next(err);
  }
}
export async function getTrends(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const trends = await AnalyticsService.getComplaintTrends(
      req.user.role === "bureau_admin" ? req.user.bureauId : null
    );
    res.status(200).json(trends);
  } catch (err) {
    next(err);
  }
}
export async function getBureausPerformance(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const perf = await AnalyticsService.getBureauPerformance();
    res.status(200).json(perf);
  } catch (err) {
    next(err);
  }
}
export async function getStatusDistribution(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const dist = await AnalyticsService.getStatusDistribution(
      req.user.role === "bureau_admin" ? req.user.bureauId : null
    );
    res.status(200).json(dist);
  } catch (err) {
    next(err);
  }
}
export async function getCategoryDistribution(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const dist = await AnalyticsService.getCategoryDistribution(
      req.user.role === "bureau_admin" ? req.user.bureauId : null
    );
    res.status(200).json(dist);
  } catch (err) {
    next(err);
  }
}
export async function exportCsv(req, res, next) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (req.user.role === "complainant") {
      res.status(403).json({ error: "Complainants cannot export system-wide reports." });
      return;
    }
    const csvContent = await AnalyticsService.exportComplaintsCsv(
      req.user.role === "bureau_admin" ? req.user.bureauId : null
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="synora_complaints_export_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}

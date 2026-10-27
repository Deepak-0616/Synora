export const SLA_DAYS_BY_PRIORITY = {
  CRITICAL: 2,
  // 48 hours
  HIGH: 7,
  // 7 calendar days
  MEDIUM: 14,
  // 14 calendar days
  LOW: 30
  // 30 calendar days
};
export function calculateSLATarget(priority, fromDate = /* @__PURE__ */ new Date()) {
  const slaDays = SLA_DAYS_BY_PRIORITY[priority] || 14;
  const target = new Date(fromDate.getTime() + slaDays * 24 * 60 * 60 * 1e3);
  return {
    targetResolutionDate: target.toISOString(),
    slaDays
  };
}
export function evaluateSLAStatus(targetDateStr, createdDateStr, isResolvedOrClosed = false) {
  const now = (/* @__PURE__ */ new Date()).getTime();
  const target = new Date(targetDateStr).getTime();
  const created = new Date(createdDateStr).getTime();
  const totalDurationHours = Math.max(1, (target - created) / (1e3 * 60 * 60));
  const diffMs = target - now;
  const hoursRemaining = Math.round(diffMs / (1e3 * 60 * 60));
  const daysRemaining = Number((diffMs / (1e3 * 60 * 60 * 24)).toFixed(1));
  if (isResolvedOrClosed) {
    return {
      status: "NORMAL",
      daysRemaining: Math.max(0, daysRemaining),
      hoursRemaining: Math.max(0, hoursRemaining),
      totalDurationHours
    };
  }
  if (diffMs <= 0) {
    return {
      status: "OVERDUE",
      daysRemaining,
      hoursRemaining,
      totalDurationHours
    };
  }
  const timeRemainingRatio = diffMs / (1e3 * 60 * 60) / totalDurationHours;
  if (timeRemainingRatio <= 0.4) {
    return {
      status: "APPROACHING_DEADLINE",
      daysRemaining,
      hoursRemaining,
      totalDurationHours
    };
  }
  return {
    status: "NORMAL",
    daysRemaining,
    hoursRemaining,
    totalDurationHours
  };
}

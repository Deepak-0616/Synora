import { describe, it, expect } from "vitest";
import { calculateSLATarget, evaluateSLAStatus } from "../src/utils/sla.js";
describe("SLA Deadline Evaluation", () => {
  it("calculates 48-hour SLA for CRITICAL priority", () => {
    const from = /* @__PURE__ */ new Date("2026-10-01T10:00:00Z");
    const res = calculateSLATarget("CRITICAL", from);
    expect(res.slaDays).toBe(2);
    expect(res.targetResolutionDate).toBe((/* @__PURE__ */ new Date("2026-10-03T10:00:00Z")).toISOString());
  });
  it("calculates 7-day SLA for HIGH priority", () => {
    const from = /* @__PURE__ */ new Date("2026-10-01T10:00:00Z");
    const res = calculateSLATarget("HIGH", from);
    expect(res.slaDays).toBe(7);
  });
  it("flags past target dates as OVERDUE", () => {
    const pastTarget = new Date(Date.now() - 3600 * 1e3 * 5).toISOString();
    const created = new Date(Date.now() - 3600 * 1e3 * 48).toISOString();
    const result = evaluateSLAStatus(pastTarget, created);
    expect(result.status).toBe("OVERDUE");
    expect(result.hoursRemaining).toBeLessThan(0);
  });
  it("flags cases as APPROACHING_DEADLINE when <= 40% time remaining", () => {
    const totalHours = 100;
    const remainingHours = 30;
    const now = Date.now();
    const created = new Date(now - (totalHours - remainingHours) * 3600 * 1e3).toISOString();
    const target = new Date(now + remainingHours * 3600 * 1e3).toISOString();
    const result = evaluateSLAStatus(target, created);
    expect(result.status).toBe("APPROACHING_DEADLINE");
  });
  it("marks resolved cases as NORMAL", () => {
    const pastTarget = new Date(Date.now() - 3600 * 1e3 * 5).toISOString();
    const created = new Date(Date.now() - 3600 * 1e3 * 48).toISOString();
    const result = evaluateSLAStatus(pastTarget, created, true);
    expect(result.status).toBe("NORMAL");
  });
});

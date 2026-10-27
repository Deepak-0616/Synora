import { ComplaintPriority } from '../types/index.js';

export interface SLACalculation {
  targetResolutionDate: string;
  slaDays: number;
}

export const SLA_DAYS_BY_PRIORITY: Record<ComplaintPriority, number> = {
  CRITICAL: 2,  // 48 hours
  HIGH: 7,      // 7 calendar days
  MEDIUM: 14,   // 14 calendar days
  LOW: 30       // 30 calendar days
};

export function calculateSLATarget(priority: ComplaintPriority, fromDate: Date = new Date()): SLACalculation {
  const slaDays = SLA_DAYS_BY_PRIORITY[priority] || 14;
  const target = new Date(fromDate.getTime() + slaDays * 24 * 60 * 60 * 1000);
  return {
    targetResolutionDate: target.toISOString(),
    slaDays
  };
}

export function evaluateSLAStatus(
  targetDateStr: string,
  createdDateStr: string,
  isResolvedOrClosed: boolean = false
): {
  status: 'NORMAL' | 'APPROACHING_DEADLINE' | 'OVERDUE';
  daysRemaining: number;
  hoursRemaining: number;
  totalDurationHours: number;
} {
  const now = new Date().getTime();
  const target = new Date(targetDateStr).getTime();
  const created = new Date(createdDateStr).getTime();

  const totalDurationHours = Math.max(1, (target - created) / (1000 * 60 * 60));
  const diffMs = target - now;
  const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));
  const daysRemaining = Number((diffMs / (1000 * 60 * 60 * 24)).toFixed(1));

  if (isResolvedOrClosed) {
    return {
      status: 'NORMAL',
      daysRemaining: Math.max(0, daysRemaining),
      hoursRemaining: Math.max(0, hoursRemaining),
      totalDurationHours
    };
  }

  if (diffMs <= 0) {
    return {
      status: 'OVERDUE',
      daysRemaining,
      hoursRemaining,
      totalDurationHours
    };
  }

  // Approaching deadline if 40% or less of the allowed time remains
  const timeRemainingRatio = (diffMs / (1000 * 60 * 60)) / totalDurationHours;
  if (timeRemainingRatio <= 0.4) {
    return {
      status: 'APPROACHING_DEADLINE',
      daysRemaining,
      hoursRemaining,
      totalDurationHours
    };
  }

  return {
    status: 'NORMAL',
    daysRemaining,
    hoursRemaining,
    totalDurationHours
  };
}

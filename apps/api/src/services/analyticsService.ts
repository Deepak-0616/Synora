import { db } from '../db/connection.js';
import { UserRole } from '../types/index.js';

export interface OverviewKPIs {
  totalCases: number;
  activeCases: number;
  pendingCases: number;
  overdueCases: number;
  resolvedCases: number;
  resolutionRate: number; // percentage
  avgResolutionDays: number;
}

export interface BureauPerformanceRecord {
  bureau_id: string;
  code: string;
  name: string;
  total_cases: number;
  active_cases: number;
  resolved_cases: number;
  overdue_cases: number;
  compliance_rate: number;
}

export class AnalyticsService {
  /**
   * Computes primary operational KPIs strictly from actual database records
   */
  public static async getOverviewKPIs(
    userRole: UserRole,
    userId: string,
    userBureauId?: string | null
  ): Promise<OverviewKPIs> {
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (userRole === 'complainant') {
      whereClauses.push('complainant_id = ?');
      params.push(userId);
    } else if (userRole === 'bureau_admin' && userBureauId) {
      whereClauses.push('bureau_id = ?');
      params.push(userBureauId);
    } else if (userRole === 'officer') {
      whereClauses.push('(assigned_officer_id = ? OR bureau_id = ?)');
      params.push(userId, userBureauId || '');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_cases,
        SUM(CASE WHEN status IN ('SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'IN_PROGRESS', 'AWAITING_COMPLAINANT_RESPONSE', 'AWAITING_INTERNAL_REVIEW') THEN 1 ELSE 0 END) as active_cases,
        SUM(CASE WHEN status IN ('SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW') THEN 1 ELSE 0 END) as pending_cases,
        SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved_cases,
        SUM(CASE WHEN status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') AND target_resolution_date < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as overdue_cases
      FROM complaints
      ${whereSql};
    `;

    const result = await db.queryOne<{
      total_cases: number;
      active_cases: number;
      pending_cases: number;
      resolved_cases: number;
      overdue_cases: number;
    }>(summaryQuery, params);

    const total = result?.total_cases || 0;
    const resolved = result?.resolved_cases || 0;
    const resolutionRate = total > 0 ? Number(((resolved / total) * 100).toFixed(1)) : 0;

    // Calculate average resolution days
    const avgDaysQuery = `
      SELECT AVG(
        (julianday(COALESCE(resolved_at, updated_at)) - julianday(created_at))
      ) as avg_days
      FROM complaints
      ${whereSql ? `${whereSql} AND status IN ('RESOLVED', 'CLOSED')` : "WHERE status IN ('RESOLVED', 'CLOSED')"};
    `;

    let avgResolutionDays = 0;
    try {
      const avgRes = await db.queryOne<{ avg_days: number }>(avgDaysQuery, params);
      avgResolutionDays = avgRes?.avg_days ? Number(avgRes.avg_days.toFixed(1)) : 0;
    } catch {
      avgResolutionDays = 0;
    }

    return {
      totalCases: total,
      activeCases: result?.active_cases || 0,
      pendingCases: result?.pending_cases || 0,
      overdueCases: result?.overdue_cases || 0,
      resolvedCases: resolved,
      resolutionRate,
      avgResolutionDays: Math.max(0, avgResolutionDays)
    };
  }

  /**
   * Retrieves complaint submission and resolution trends over time
   */
  public static async getComplaintTrends(userBureauId?: string | null): Promise<Array<{ date: string; submitted: number; resolved: number }>> {
    const whereSql = userBureauId ? 'WHERE bureau_id = ?' : '';
    const params = userBureauId ? [userBureauId] : [];

    const query = `
      SELECT 
        substr(created_at, 1, 10) as day_date,
        COUNT(*) as submitted,
        SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved
      FROM complaints
      ${whereSql}
      GROUP BY substr(created_at, 1, 10)
      ORDER BY day_date DESC
      LIMIT 14;
    `;

    const rows = await db.query<{ day_date: string; submitted: number; resolved: number }>(query, params);
    return rows.reverse().map(r => ({
      date: r.day_date,
      submitted: r.submitted || 0,
      resolved: r.resolved || 0
    }));
  }

  /**
   * Bureau-wise comparison report
   */
  public static async getBureauPerformance(): Promise<BureauPerformanceRecord[]> {
    const query = `
      SELECT 
        b.id as bureau_id,
        b.code,
        b.name,
        COUNT(c.id) as total_cases,
        SUM(CASE WHEN c.status IN ('SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'IN_PROGRESS', 'AWAITING_COMPLAINANT_RESPONSE', 'AWAITING_INTERNAL_REVIEW') THEN 1 ELSE 0 END) as active_cases,
        SUM(CASE WHEN c.status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved_cases,
        SUM(CASE WHEN c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') AND c.target_resolution_date < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as overdue_cases
      FROM bureaus b
      LEFT JOIN complaints c ON b.id = c.bureau_id
      WHERE b.is_active = 1
      GROUP BY b.id, b.code, b.name
      ORDER BY total_cases DESC;
    `;

    const records = await db.query<any>(query);
    return records.map(r => {
      const total = r.total_cases || 0;
      const overdue = r.overdue_cases || 0;
      const compliance = total > 0 ? Number((((total - overdue) / total) * 100).toFixed(1)) : 100;
      return {
        bureau_id: r.bureau_id,
        code: r.code,
        name: r.name,
        total_cases: total,
        active_cases: r.active_cases || 0,
        resolved_cases: r.resolved_cases || 0,
        overdue_cases: overdue,
        compliance_rate: compliance
      };
    });
  }

  /**
   * Status distribution
   */
  public static async getStatusDistribution(userBureauId?: string | null): Promise<Array<{ status: string; count: number }>> {
    const whereSql = userBureauId ? 'WHERE bureau_id = ?' : '';
    const params = userBureauId ? [userBureauId] : [];

    const query = `
      SELECT status, COUNT(*) as count
      FROM complaints
      ${whereSql}
      GROUP BY status
      ORDER BY count DESC;
    `;

    return db.query<{ status: string; count: number }>(query, params);
  }

  /**
   * Category distribution
   */
  public static async getCategoryDistribution(userBureauId?: string | null): Promise<Array<{ category: string; count: number }>> {
    const whereSql = userBureauId ? 'WHERE bureau_id = ?' : '';
    const params = userBureauId ? [userBureauId] : [];

    const query = `
      SELECT category, COUNT(*) as count
      FROM complaints
      ${whereSql}
      GROUP BY category
      ORDER BY count DESC;
    `;

    return db.query<{ category: string; count: number }>(query, params);
  }

  /**
   * Generates a safe CSV export with formula injection protection
   */
  public static async exportComplaintsCsv(userBureauId?: string | null): Promise<string> {
    const whereSql = userBureauId ? 'WHERE c.bureau_id = ?' : '';
    const params = userBureauId ? [userBureauId] : [];

    const complaints = await db.query<any>(
      `SELECT c.reference_number, c.title, c.category, c.priority, c.status,
              c.institution_name, b.code as bureau, c.created_at, c.target_resolution_date, c.resolved_at
       FROM complaints c
       LEFT JOIN bureaus b ON c.bureau_id = b.id
       ${whereSql}
       ORDER BY c.created_at DESC;`,
      params
    );

    const headers = [
      'Reference Number',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Institution Name',
      'Bureau',
      'Submission Date',
      'SLA Due Date',
      'Resolved Date'
    ];

    const sanitizeCell = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      // Protect against CSV formula injection: escape =, +, -, @
      if (/^[=+\-@]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const csvLines = [
      headers.join(','),
      ...complaints.map(c => [
        sanitizeCell(c.reference_number),
        sanitizeCell(c.title),
        sanitizeCell(c.category),
        sanitizeCell(c.priority),
        sanitizeCell(c.status),
        sanitizeCell(c.institution_name),
        sanitizeCell(c.bureau || 'Unassigned'),
        sanitizeCell(c.created_at),
        sanitizeCell(c.target_resolution_date),
        sanitizeCell(c.resolved_at || 'Pending')
      ].join(','))
    ];

    return csvLines.join('\n');
  }
}

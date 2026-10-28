import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { StatusBadge, PriorityBadge, SLABadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  FolderKanban,
  Clock,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
export const AdminDashboard = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({
    totalCases: 0,
    activeCases: 0,
    pendingCases: 0,
    overdueCases: 0,
    resolvedCases: 0,
    resolutionRate: 0,
    avgResolutionDays: 0
  });
  const [complaints, setComplaints] = useState([]);
  const [urgentCases, setUrgentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadDashboard();
  }, [user?.id, user?.bureau_id, user?.role]);
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [kpiRes, compRes] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/complaints?limit=10")
      ]);
      setKpis(kpiRes);
      const allComp = compRes.complaints || [];
      setComplaints(allComp);
      const urgent = allComp.filter(
        (c) => c.sla_status === "OVERDUE" || c.priority === "CRITICAL" || c.is_escalated
      );
      setUrgentCases(urgent);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <LoadingSpinner message="Calculating real-time bureau telemetry..." size="lg" />;
  }
  return <div className="space-y-8 animate-in fade-in duration-150">
      {
    /* Bureau / Scope Header Banner */
  }
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AICTE Regulatory Operations Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Institutional Grievance Monitoring Console
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Operational telemetry for: <strong className="text-cyan-300">{user?.bureau_name || "All AICTE Bureaus & National Oversight Cells"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
    to="/admin/complaints"
    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
  >
            Manage Case Queue &rarr;
          </Link>
          <Link
    to="/admin/reports"
    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
  >
            Performance Analytics
          </Link>
        </div>
      </div>

      {
    /* 4 Primary KPI Cards (Direct DB Aggregation) */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="synora-card p-5 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Cases</span>
            <FolderKanban className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{kpis.totalCases}</span>
            <span className="text-xs text-slate-500 font-medium">in database</span>
          </div>
        </div>

        <div className="synora-card p-5 border-l-4 border-l-cyan-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Assignment</span>
            <Clock className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{kpis.pendingCases}</span>
            <span className="text-xs text-cyan-700 font-medium">awaiting triage</span>
          </div>
        </div>

        <div className="synora-card p-5 border-l-4 border-l-rose-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue SLA Cases</span>
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700">{kpis.overdueCases}</span>
            <span className="text-xs text-rose-600 font-medium">breached deadline</span>
          </div>
        </div>

        <div className="synora-card p-5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved Cases</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">{kpis.resolvedCases}</span>
            <span className="text-xs text-emerald-600 font-medium">{kpis.resolutionRate}% rate</span>
          </div>
        </div>
      </div>

      {
    /* Cases Requiring Immediate Attention */
  }
      {urgentCases.length > 0 && <div className="synora-card p-6 border-l-4 border-l-rose-500 bg-rose-50/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-rose-950">
                Cases Requiring Immediate Attention ({urgentCases.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
              High Priority / Overdue SLA
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentCases.slice(0, 4).map((c) => <div key={c.id} className="p-4 bg-white rounded-xl border border-rose-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                    {c.reference_number}
                  </span>
                  <SLABadge status={c.sla_status} daysRemaining={c.days_remaining} />
                </div>
                <Link
    to={`/complaints/${c.id}`}
    className="font-bold text-sm text-slate-900 hover:text-rose-600 line-clamp-1"
  >
                  {c.title}
                </Link>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="truncate max-w-[200px]">{c.institution_name}</span>
                  <Link
    to={`/complaints/${c.id}`}
    className="font-bold text-rose-600 hover:underline"
  >
                    Investigate &rarr;
                  </Link>
                </div>
              </div>)}
          </div>
        </div>}

      {
    /* Active Case Queue Table */
  }
      <div className="synora-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Complaint Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live investigations scoped to your administrative credentials
            </p>
          </div>
          <Link
    to="/admin/complaints"
    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
  >
            Open Complete Queue &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Reference ID</th>
                <th className="px-5 py-3">Complaint Title</th>
                <th className="px-5 py-3">Institution</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">SLA Due</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {complaints.slice(0, 7).map((c) => <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {c.reference_number}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <Link
    to={`/complaints/${c.id}`}
    className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
  >
                      {c.title}
                    </Link>
                    <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                      {c.category} • {c.bureau_name || "Unassigned"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 max-w-[180px] truncate text-slate-700">
                    {c.institution_name}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <SLABadge status={c.sla_status} daysRemaining={c.days_remaining} />
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Link
    to={`/complaints/${c.id}`}
    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
  >
                      Inspect
                    </Link>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};

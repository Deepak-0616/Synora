import { useState, useEffect } from "react";
import { api } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Download,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle
} from "lucide-react";
const COLORS = ["#2563EB", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#64748B"];
export const ReportsPage = () => {
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [bureauPerf, setBureauPerf] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  useEffect(() => {
    loadAnalytics();
  }, []);
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [kpiRes, trendRes, bureauRes, statusRes] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/trends"),
        api.get("/analytics/bureaus"),
        api.get("/analytics/status-distribution")
      ]);
      setKpis(kpiRes);
      setTrends(trendRes || []);
      setBureauPerf(bureauRes || []);
      setStatusDist(statusRes || []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      setExportError(null);
      const blob = await api.get("/analytics/export-csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `synora_institutional_cases_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message || "Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };
  if (loading) {
    return <LoadingSpinner message="Aggregating statutory reporting metrics..." size="lg" />;
  }
  return <div className="space-y-8">
      {exportError && (
        <div className="p-3 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{exportError}</span>
          </div>
          <button onClick={() => setExportError(null)} className="text-rose-600 hover:text-rose-900 font-bold text-xs">
            ✕
          </button>
        </div>
      )}
      {
    /* Header & Export Action */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Performance & Resolution Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Factual reports computed exclusively from authorized, persistent database records
          </p>
        </div>

        <button
    onClick={handleExportCsv}
    disabled={exporting}
    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm disabled:opacity-50 transition-colors"
  >
          <Download className="w-4 h-4" />
          {exporting ? "Generating CSV..." : "Export Audit Dossier (CSV)"}
        </button>
      </div>

      {
    /* Compliance Metric Cards */
  }
      {kpis && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="synora-card p-5 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Overall Resolution Rate</span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{kpis.resolutionRate}%</span>
              <span className="text-xs text-emerald-600 font-semibold">of filed cases</span>
            </div>
          </div>

          <div className="synora-card p-5 border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Average Resolution Speed</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{kpis.avgResolutionDays}</span>
              <span className="text-xs text-slate-500 font-medium">calendar days</span>
            </div>
          </div>

          <div className="synora-card p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Active Investigation Queue</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{kpis.activeCases}</span>
              <span className="text-xs text-amber-700 font-medium">cases in progress</span>
            </div>
          </div>

          <div className="synora-card p-5 border-l-4 border-l-rose-600">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>SLA Target Breaches</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-700">{kpis.overdueCases}</span>
              <span className="text-xs text-rose-600 font-medium">overdue cases</span>
            </div>
          </div>
        </div>}

      {
    /* Visual Analytics Charts Grid */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {
    /* CHART 1: COMPLAINT TRENDS */
  }
        <div className="synora-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Complaint Submissions & Resolutions Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Submissions vs successful closures</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {trends.length === 0 ? <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Insufficient temporal history for trend graph.
              </div> : <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="submitted" name="Submissions" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="resolved" name="Resolutions" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>}
          </div>
        </div>

        {
    /* CHART 2: BUREAU PERFORMANCE */
  }
        <div className="synora-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bureau-wise Case Workload & Resolution Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Total volume vs resolved cases by bureau</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {bureauPerf.length === 0 ? <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No bureau data available.
              </div> : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bureauPerf} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="code" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="total_cases" name="Total Cases" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved_cases" name="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overdue_cases" name="Overdue" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>}
          </div>
        </div>
      </div>

      {
    /* Bureau Compliance Breakdown Table */
  }
      <div className="synora-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Statutory Bureau SLA Compliance Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit of operational turnaround compliance across accredited organizational units
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Bureau Code</th>
                <th className="px-5 py-3">Bureau Name</th>
                <th className="px-5 py-3 text-center">Total Volume</th>
                <th className="px-5 py-3 text-center">Active Cases</th>
                <th className="px-5 py-3 text-center">Resolved</th>
                <th className="px-5 py-3 text-center">Overdue</th>
                <th className="px-5 py-3 text-right">Compliance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {bureauPerf.map((b) => <tr key={b.bureau_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-blue-700">
                    <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {b.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-800 font-semibold">{b.name}</td>
                  <td className="px-5 py-3.5 text-center">{b.total_cases}</td>
                  <td className="px-5 py-3.5 text-center text-amber-700 font-semibold">{b.active_cases}</td>
                  <td className="px-5 py-3.5 text-center text-emerald-700 font-semibold">{b.resolved_cases}</td>
                  <td className="px-5 py-3.5 text-center text-rose-700 font-semibold">{b.overdue_cases}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                    <span className={`px-2 py-0.5 rounded text-xs ${b.compliance_rate >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {b.compliance_rate}%
                    </span>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};

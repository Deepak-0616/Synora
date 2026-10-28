import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { StatusBadge, PriorityBadge, SLABadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import {
  Search,
  Filter,
  FilePlus2,
  Building,
  Calendar,
  ArrowRight
} from "lucide-react";
export const MyComplaintsPage = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  useEffect(() => {
    loadComplaints();
  }, [statusFilter, priorityFilter, user?.id]);
  const loadComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (search) params.append("search", search);
      const res = await api.get(`/complaints?${params.toString()}`);
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadComplaints();
  };
  return <div className="space-y-6">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Registered Complaints
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official record of grievances filed under your verified complainant profile
          </p>
        </div>

        <Link
    to="/submit"
    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
  >
          <FilePlus2 className="w-4 h-4" /> File New Grievance
        </Link>
      </div>

      {
    /* Filter and Search Bar */
  }
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search reference ID or title..."
    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
  />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-600"
  >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="AWAITING_COMPLAINANT_RESPONSE">Awaiting Response</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          <select
    value={priorityFilter}
    onChange={(e) => setPriorityFilter(e.target.value)}
    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-600"
  >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {
    /* Complaints List Container */
  }
      {loading ? <LoadingSpinner message="Retrieving your complaints..." size="lg" /> : complaints.length === 0 ? <EmptyState
    title="No complaints matching criteria"
    description="Try clearing search filters or file a new institutional grievance."
    action={<Link
      to="/submit"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
    >
              <FilePlus2 className="w-4 h-4" /> Submit Complaint
            </Link>}
  /> : <div className="space-y-3">
          {complaints.map((complaint) => <div
    key={complaint.id}
    className="synora-card p-5 hover:border-blue-300 transition-all"
  >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded text-xs border border-blue-200">
                      {complaint.reference_number}
                    </span>
                    <StatusBadge status={complaint.status} size="sm" />
                    <PriorityBadge priority={complaint.priority} />
                    <SLABadge status={complaint.sla_status} daysRemaining={complaint.days_remaining} />
                  </div>

                  <Link
    to={`/complaints/${complaint.id}`}
    className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors block"
  >
                    {complaint.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{complaint.institution_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Filed: {new Date(complaint.created_at).toLocaleDateString()}</span>
                    </div>
                    {complaint.bureau_name && <span className="text-cyan-800 font-semibold bg-cyan-50 px-2 py-0.5 rounded text-[11px]">
                        {complaint.bureau_name}
                      </span>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
    to={`/complaints/${complaint.id}`}
    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap"
  >
                    View Status Timeline <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>)}
        </div>}
    </div>;
};

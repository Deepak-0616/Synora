import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint, Bureau } from '../types';
import { StatusBadge, PriorityBadge, SLABadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Building
} from 'lucide-react';

export const AdminComplaintsPage: React.FC = () => {
  const { user, isSystemAdmin, isReviewer } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [bureauFilter, setBureauFilter] = useState('');
  const [bureaus, setBureaus] = useState<Bureau[]>([]);

  useEffect(() => {
    loadBureaus();
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [page, statusFilter, priorityFilter, categoryFilter, bureauFilter]);

  const loadBureaus = async () => {
    try {
      const data = await api.get<Bureau[]>('/bureaus');
      setBureaus(data || []);
    } catch {
      // Non-blocking
    }
  };

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '12');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (bureauFilter) params.append('bureau_id', bureauFilter);

      const res = await api.get<{
        complaints: Complaint[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/complaints?${params.toString()}`);

      setComplaints(res.complaints || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadComplaints();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Case Management Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of all complaints across AICTE monitoring jurisdictions ({total} total records)
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference ID, title, or institution..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="AWAITING_COMPLAINANT_RESPONSE">Awaiting Response</option>
              <option value="AWAITING_INTERNAL_REVIEW">Awaiting Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="ESCALATED">Escalated</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {(isSystemAdmin || isReviewer) && (
              <select
                value={bureauFilter}
                onChange={(e) => {
                  setBureauFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All Bureaus</option>
                {bureaus.map(b => (
                  <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                ))}
              </select>
            )}

            {(statusFilter || priorityFilter || categoryFilter || bureauFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPriorityFilter('');
                  setCategoryFilter('');
                  setBureauFilter('');
                  setSearch('');
                  setPage(1);
                }}
                className="text-xs text-rose-600 hover:underline font-bold px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Case Table Container */}
      <div className="synora-card overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Querying case records..." size="lg" />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No matching complaints in queue"
            description="Try modifying search keywords or clearing active filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Reference ID</th>
                  <th className="px-5 py-3.5">Complaint Title</th>
                  <th className="px-5 py-3.5">Institution</th>
                  <th className="px-5 py-3.5">Bureau / Cell</th>
                  <th className="px-5 py-3.5">Assigned Officer</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">SLA Target</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {complaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.reference_number}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                      >
                        {c.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                        {c.category} • Submitted {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-[180px] truncate text-slate-700">
                      {c.institution_name}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                      {c.bureau_name ? (
                        <span className="font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded">
                          {c.bureau_code}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                      {c.assigned_officer_name || (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <SLABadge status={c.sla_status} daysRemaining={c.days_remaining} />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Inspect Dossier &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {page} of {totalPages} ({total} complaints)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

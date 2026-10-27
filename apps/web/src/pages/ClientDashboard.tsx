import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint, Notification } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  FilePlus2,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Building,
  Sparkles
} from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [compRes, notifRes] = await Promise.all([
        api.get<{ complaints: Complaint[]; total: number }>('/complaints?limit=5'),
        api.get<Notification[]>('/notifications')
      ]);
      setComplaints(compRes.complaints || []);
      setNotifications(notifRes || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCount = complaints.length;
  const activeCount = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
  const pendingRfiCases = complaints.filter(c => c.status === 'AWAITING_COMPLAINANT_RESPONSE');

  if (loading) {
    return <LoadingSpinner message="Loading your grievance dashboard..." size="lg" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Greeting & Primary CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 md:p-8 shadow-md">
        <div className="absolute right-0 top-0 w-96 h-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>National Institutional Grievance System</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl leading-relaxed">
              Track the live progress of your complaints across AICTE monitoring cells, reply to officer information requests, and review resolution records.
            </p>
          </div>

          <Link
            to="/submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <FilePlus2 className="w-4 h-4" />
            Submit New Complaint
          </Link>
        </div>
      </div>

      {/* Action Required Alert for RFI */}
      {pendingRfiCases.length > 0 && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-purple-900">
                Action Required: Additional Information Requested
              </h4>
              <p className="text-xs text-purple-700 mt-0.5">
                The investigating officer for case <strong className="font-semibold">{pendingRfiCases[0].reference_number}</strong> has requested additional clarification or supporting proof.
              </p>
            </div>
          </div>
          <Link
            to={`/complaints/${pendingRfiCases[0].id}`}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
          >
            Respond Now &rarr;
          </Link>
        </div>
      )}

      {/* Primary KPI Cards (Live from DB records) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="synora-card p-5 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Complaints
            </span>
            <FolderKanban className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-500 font-medium">registered cases</span>
          </div>
        </div>

        <div className="synora-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Investigations
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeCount}</span>
            <span className="text-xs text-amber-700 font-medium">under active review</span>
          </div>
        </div>

        <div className="synora-card p-5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Resolved Complaints
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{resolvedCount}</span>
            <span className="text-xs text-emerald-700 font-medium">successfully closed</span>
          </div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="synora-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Recent Complaints</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status updates direct from AICTE investigation bureaus
            </p>
          </div>
          <Link
            to="/complaints"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            View All ({totalCount}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {complaints.length === 0 ? (
          <EmptyState
            title="No complaints filed yet"
            description="You have not submitted any institutional grievances. If you face irregularities regarding fees, admissions, ragging, or facilities, submit a complaint."
            action={
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
              >
                <FilePlus2 className="w-4 h-4" /> Submit First Grievance
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Reference ID</th>
                  <th className="px-5 py-3">Complaint Details</th>
                  <th className="px-5 py-3">Institution</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {complaints.map(complaint => (
                  <tr key={complaint.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                        {complaint.reference_number}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <Link
                        to={`/complaints/${complaint.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                      >
                        {complaint.title}
                      </Link>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {complaint.category} • Submitted on {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-700 max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{complaint.institution_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <PriorityBadge priority={complaint.priority} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={complaint.status} />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link
                        to={`/complaints/${complaint.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Track Case <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help & Protocol Guidance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="synora-card p-5">
          <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>AICTE Redressal Process Timeline</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Every submitted grievance is assigned a statutory deadline (SLA) based on priority:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
            <li><strong className="text-slate-800">Critical Priority (Anti-Ragging / Safety):</strong> 48 hours rapid response.</li>
            <li><strong className="text-slate-800">High Priority (Severe Harassment, Fee Capitation):</strong> 7 days investigation.</li>
            <li><strong className="text-slate-800">Standard Academic / Infrastructure:</strong> 14 to 30 days statutory review.</li>
          </ul>
        </div>

        <div className="synora-card p-5">
          <div className="flex items-center gap-2 mb-2 text-cyan-700 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Complainant Security Guarantee</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            SYNORA implements strict cryptographic data isolation. Your identity and submitted evidence are protected against unauthorized institutional retribution.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Zero-Tolerance Retaliation Protection Act Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

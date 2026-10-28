import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { StatusBadge, PriorityBadge, SLABadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Modal } from "../components/Modal";
import {
  ArrowLeft,
  Clock,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Send,
  Sparkles,
  Download,
  Flame
} from "lucide-react";

const STATUS_LABELS = {
  SUBMITTED: "Submitted (Fresh Case)",
  ACKNOWLEDGED: "Acknowledged (Formal Receipt)",
  UNDER_REVIEW: "Under Review (Preliminary Triage)",
  IN_PROGRESS: "In Progress (Active Investigation)",
  AWAITING_COMPLAINANT_RESPONSE: "Awaiting Complainant Response (RFI)",
  AWAITING_INTERNAL_REVIEW: "Awaiting Internal Review (Resolution Audit)",
  RESOLVED: "Resolved (Investigation Findings Finalized)",
  CLOSED: "Closed (Archived Formal Record)",
  ESCALATED: "Escalated (Higher Council Oversight)",
  REJECTED: "Rejected (Ineligible / Frivolous)"
};

const STATUS_DESCRIPTIONS = {
  ACKNOWLEDGED: "Formally acknowledges grievance receipt and generates audit verification timestamps.",
  UNDER_REVIEW: "Case assigned for preliminary scrutiny, evidence correlation, and jurisdiction review.",
  IN_PROGRESS: "Active investigation underway by assigned vigilance officer and inspection cell.",
  AWAITING_COMPLAINANT_RESPONSE: "Temporarily holds SLA while awaiting crucial documentary clarification from complainant.",
  AWAITING_INTERNAL_REVIEW: "Findings recorded; pending Bureau Director review and sign-off on proposed resolution.",
  RESOLVED: "Investigation concluded. Directives and remedial action issued to institution and complainant.",
  CLOSED: "Final administrative closeout. All relief or enforcement penalties executed.",
  ESCALATED: "Transfers priority handling to Directorate, Ombudsman, and State Supervisory Committee.",
  REJECTED: "Formal rejection due to lack of jurisdiction, duplicate filing, or malicious petition."
};

export const ComplaintDetailPage = () => {
  const { id } = useParams();
  const { user, token, isStaff, isComplainant, canAssignCase, canApproveResolution } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [internalNotes, setInternalNotes] = useState([]);
  const [rfis, setRfis] = useState([]);
  const [resolution, setResolution] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [bureaus, setBureaus] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [aiRisk, setAiRisk] = useState(null);
  const [aiDuplicates, setAiDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline");
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [rfiReply, setRfiReply] = useState("");
  const [submittingRfi, setSubmittingRfi] = useState(false);
  const [showRfiModal, setShowRfiModal] = useState(false);
  const [rfiQuestion, setRfiQuestion] = useState("");
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [selectedNextStatus, setSelectedNextStatus] = useState("IN_PROGRESS");
  const [transitionNote, setTransitionNote] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignBureauId, setAssignBureauId] = useState("");
  const [assignOfficerId, setAssignOfficerId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [findings, setFindings] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [complainantSummary, setComplainantSummary] = useState("");
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [downloadingDocId, setDownloadingDocId] = useState(null);
  const [rfiMessage, setRfiMessage] = useState(null);
  const [editingRfiId, setEditingRfiId] = useState(null);
  const [editingRfiReply, setEditingRfiReply] = useState("");
  const [transitionError, setTransitionError] = useState(null);
  const [assignError, setAssignError] = useState(null);
  const [rfiModalError, setRfiModalError] = useState(null);
  const [resolutionError, setResolutionError] = useState(null);
  const [escalateError, setEscalateError] = useState(null);
  const [noteError, setNoteError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (id) {
      loadComplaintData();
    }
  }, [id, user?.id]);
  const loadComplaintData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [compRes, histRes, rfiRes, docRes] = await Promise.all([
        api.get(`/complaints/${id}`),
        api.get(`/complaints/${id}/timeline`),
        api.get(`/complaints/${id}/rfis`),
        api.get(`/complaints/${id}/documents`)
      ]);
      setComplaint(compRes);
      setHistory(histRes || []);
      setRfis(rfiRes || []);
      setDocuments(docRes || []);
      if (isStaff) {
        try {
          const [notesRes, riskRes] = await Promise.all([
            api.get(`/complaints/${id}/internal-notes`),
            api.get(`/ai/complaints/${id}/risk`)
          ]);
          setInternalNotes(notesRes || []);
          setAiRisk(riskRes || null);
          const dupRes = await api.post("/ai/duplicates", {
            title: compRes.title,
            description: compRes.description,
            institution_name: compRes.institution_name,
            excludeId: compRes.id
          });
          setAiDuplicates(dupRes || []);
        } catch {
        }
      }
      try {
        const resRes = await api.get(`/complaints/${id}/resolutions`);
        setResolution(resRes || null);
      } catch {
        setResolution(null);
      }
      if (canAssignCase) {
        const bureauList = await api.get("/bureaus");
        setBureaus(bureauList || []);
      }
    } catch (err) {
      console.error("Failed to load complaint data:", err);
    } finally {
      setLoading(false);
    }
  };
  const loadBureauOfficers = async (bId) => {
    if (!bId) {
      setOfficers([]);
      return;
    }
    try {
      const data = await api.get(`/bureaus/${bId}/officers`);
      setOfficers(data || []);
    } catch {
      setOfficers([]);
    }
  };
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    setSubmittingNote(true);
    setNoteError(null);
    try {
      const note = await api.post(`/complaints/${id}/internal-notes`, { note: newNote });
      setInternalNotes([note, ...internalNotes]);
      setNewNote("");
    } catch (err) {
      setNoteError(err.message || "Failed to add note");
    } finally {
      setSubmittingNote(false);
    }
  };
  const handleCreateRfi = async () => {
    if (!rfiQuestion.trim() || !id) return;
    setRfiModalError(null);
    try {
      const rfi = await api.post(`/complaints/${id}/rfis`, { request_details: rfiQuestion });
      setRfis([rfi, ...rfis]);
      setShowRfiModal(false);
      setRfiQuestion("");
      loadComplaintData();
    } catch (err) {
      setRfiModalError(err.message || "Failed to create request");
    }
  };
  const handleRespondRfi = async (rfiId, overrideText) => {
    const textToSubmit = (overrideText !== undefined ? overrideText : rfiReply).trim();
    if (!textToSubmit) {
      setRfiMessage({ type: "error", text: "Please enter your response before submitting." });
      return;
    }
    setSubmittingRfi(true);
    setRfiMessage(null);
    try {
      await api.post(`/complaints/${id}/rfis/${rfiId}/respond`, { response_details: textToSubmit });
      setRfiReply("");
      setEditingRfiId(null);
      setEditingRfiReply("");
      setRfiMessage({ type: "success", text: "Response recorded and complaint updated successfully!" });
      await loadComplaintData();
    } catch (err) {
      setRfiMessage({ type: "error", text: err.message || "Failed to submit response" });
    } finally {
      setSubmittingRfi(false);
    }
  };

  const getAvailableTransitions = () => {
    if (!complaint) return [];
    if (complaint.allowed_transitions && Array.isArray(complaint.allowed_transitions)) {
      return complaint.allowed_transitions;
    }
    const isAdmin = user?.role === "system_admin" || user?.role === "bureau_admin";
    const transitions = {
      SUBMITTED: [
        "ACKNOWLEDGED",
        "UNDER_REVIEW",
        "IN_PROGRESS",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED",
        "REJECTED"
      ],
      ACKNOWLEDGED: [
        "UNDER_REVIEW",
        "IN_PROGRESS",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED",
        "REJECTED"
      ],
      UNDER_REVIEW: [
        "ACKNOWLEDGED",
        "IN_PROGRESS",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED",
        "REJECTED"
      ],
      IN_PROGRESS: [
        "ACKNOWLEDGED",
        "UNDER_REVIEW",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED",
        "CLOSED"
      ],
      AWAITING_COMPLAINANT_RESPONSE: [
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "ACKNOWLEDGED",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "ESCALATED"
      ],
      AWAITING_INTERNAL_REVIEW: [
        "RESOLVED",
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "ACKNOWLEDGED",
        "AWAITING_COMPLAINANT_RESPONSE",
        "ESCALATED",
        "CLOSED"
      ],
      RESOLVED: [
        "CLOSED",
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "ACKNOWLEDGED",
        "AWAITING_INTERNAL_REVIEW"
      ],
      CLOSED: isAdmin ? ["IN_PROGRESS", "UNDER_REVIEW", "ACKNOWLEDGED", "RESOLVED"] : [],
      ESCALATED: [
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "ACKNOWLEDGED",
        "AWAITING_COMPLAINANT_RESPONSE",
        "AWAITING_INTERNAL_REVIEW",
        "RESOLVED",
        "CLOSED"
      ],
      REJECTED: isAdmin ? ["UNDER_REVIEW", "IN_PROGRESS", "ACKNOWLEDGED"] : []
    };
    let allowed = transitions[complaint.status] || [];
    if (!isAdmin) {
      allowed = allowed.filter((s) => s !== "REJECTED" && s !== "CLOSED");
    }
    return allowed;
  };

  const handleOpenTransitionModal = () => {
    setTransitionError(null);
    setTransitionNote("");
    const available = getAvailableTransitions();
    if (available.length > 0) {
      setSelectedNextStatus(available[0]);
    } else {
      setSelectedNextStatus("");
    }
    setShowTransitionModal(true);
  };

  const handleTransitionStatus = async () => {
    if (!id) return;
    setTransitionError(null);
    try {
      await api.post(`/complaints/${id}/transitions`, {
        to_status: selectedNextStatus,
        note: transitionNote
      });
      setShowTransitionModal(false);
      setTransitionNote("");
      loadComplaintData();
    } catch (err) {
      setTransitionError(err.message || "Failed to transition status");
    }
  };
  const handleAssignSubmit = async () => {
    if (!id) return;
    setAssignError(null);
    try {
      await api.post(`/complaints/${id}/assignments`, {
        bureau_id: assignBureauId ? assignBureauId : null,
        officer_id: assignOfficerId ? assignOfficerId : null,
        notes: assignNotes || ""
      });
      setShowAssignModal(false);
      loadComplaintData();
    } catch (err) {
      setAssignError(err.message || "Failed to assign complaint");
    }
  };
  const handleProposeResolution = async () => {
    if (!id) return;
    setResolutionError(null);
    try {
      await api.post(`/complaints/${id}/resolutions`, {
        findings,
        resolution_summary: resolutionSummary,
        complainant_visible_summary: complainantSummary
      });
      setShowResolutionModal(false);
      loadComplaintData();
    } catch (err) {
      setResolutionError(err.message || "Failed to propose resolution");
    }
  };
  const handleApproveResolution = async (resId) => {
    if (!id) return;
    setActionError(null);
    try {
      await api.post(`/complaints/${id}/resolutions/${resId}/approve`);
      loadComplaintData();
    } catch (err) {
      setActionError(err.message || "Failed to approve resolution");
    }
  };
  const handleEscalateCase = async () => {
    if (!id || !escalateReason.trim()) return;
    setEscalateError(null);
    try {
      await api.post(`/complaints/${id}/escalations`, { reason: escalateReason });
      setShowEscalateModal(false);
      setEscalateReason("");
      loadComplaintData();
    } catch (err) {
      setEscalateError(err.message || "Failed to escalate case");
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      setDownloadingDocId(doc.id);
      const blob = await api.get(`/complaints/documents/${doc.id}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setActionError(err.message || "Failed to download document");
    } finally {
      setDownloadingDocId(null);
    }
  };
  if (loading) {
    return <LoadingSpinner message="Retrieving complaint case dossier..." size="lg" />;
  }
  if (!complaint) {
    return <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800">Complaint Record Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">This grievance may not exist or you lack permission to view it.</p>
        <Link to="/" className="inline-block mt-4 text-xs font-bold text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>;
  }
  const pendingRfi = rfis.find((r) => r.status === "PENDING");
  const canRespondToRfi = pendingRfi && (
    (isComplainant && pendingRfi.complainant_id === user?.id) ||
    isStaff
  );
  return <div className="space-y-6">
      {
    /* Top Breadcrumb & Controls */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
    to={isStaff ? "/admin/complaints" : "/complaints"}
    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
  >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {complaint.reference_number}
              </span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1 leading-snug">
              {complaint.title}
            </h1>
          </div>
        </div>

        {
    /* Staff Action Buttons */
  }
        {isStaff && <div className="flex flex-wrap items-center gap-2">
            {canAssignCase && <button
    onClick={() => {
      setAssignBureauId(complaint.bureau_id || "");
      loadBureauOfficers(complaint.bureau_id || "");
      setAssignError(null);
      setShowAssignModal(true);
    }}
    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
  >
                Assign / Reassign
              </button>}

            <button
    onClick={handleOpenTransitionModal}
    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
  >
              Update Status
            </button>

            <button
    onClick={() => {
      setRfiModalError(null);
      setShowRfiModal(true);
    }}
    className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
  >
              Request Proof (RFI)
            </button>

            {complaint.status !== "RESOLVED" && complaint.status !== "CLOSED" && <button
    onClick={() => {
      setResolutionError(null);
      setShowResolutionModal(true);
    }}
    className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
  >
                Propose Resolution
              </button>}

            {!complaint.is_escalated && <button
    onClick={() => {
      setEscalateError(null);
      setShowEscalateModal(true);
    }}
    className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
    title="Escalate to Supervisory Cell"
  >
                <Flame className="w-4 h-4" />
              </button>}
          </div>}
      </div>

      {actionError && (
        <div className="p-3 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-900 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {
    /* SLA Alert Header */
  }
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Institution</span>
            <span className="font-bold text-slate-800">{complaint.institution_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
            <span className="font-semibold text-slate-700">{complaint.category}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Bureau</span>
            <span className="font-semibold text-cyan-800">{complaint.bureau_name || "Routing Cell"}</span>
          </div>
          {complaint.assigned_officer_name && <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Case Officer</span>
              <span className="font-semibold text-slate-800">{complaint.assigned_officer_name}</span>
            </div>}
        </div>

        <div className="flex items-center gap-3">
          <SLABadge status={complaint.sla_status} daysRemaining={complaint.days_remaining} />
        </div>
      </div>

      {
    /* Complainant RFI Alert & Inline Response Form */
  }
      {canRespondToRfi && <div className="p-6 rounded-2xl bg-purple-50 border-2 border-purple-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
            <span>
              {isComplainant
                ? "Action Required: Investigating Officer Has Requested Information"
                : "Active Inquiry: Provide or Record Response to Clarification Request"}
            </span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-purple-100 text-xs text-slate-800 font-medium leading-relaxed">
            "{pendingRfi.request_details}"
          </div>

          {rfiMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                rfiMessage.type === "success"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-rose-100 text-rose-800 border border-rose-200"
              }`}
            >
              <span>{rfiMessage.text}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-purple-900 uppercase">
              {isComplainant ? "Your Written Response" : "Official Response Statement"}
            </label>
            <textarea
              rows={3}
              value={rfiReply}
              onChange={(e) => {
                setRfiReply(e.target.value);
                if (rfiMessage) setRfiMessage(null);
              }}
              placeholder="Provide requested details, room numbers, dates, or clarify statements..."
              className="w-full p-3 bg-white border border-purple-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={submittingRfi || !rfiReply.trim()}
                onClick={() => handleRespondRfi(pendingRfi.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> {submittingRfi ? "Submitting..." : "Submit Response"}
              </button>
            </div>
          </div>
        </div>}

      {
    /* Formal Resolution Display (if resolved) */
  }
      {resolution && <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Official Institutional Resolution Record</span>
            </div>
            {resolution.approved_at && <span className="text-xs text-emerald-700 font-semibold bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                Approved: {new Date(resolution.approved_at).toLocaleDateString()}
              </span>}
          </div>

          <div className="p-4 bg-white rounded-xl border border-emerald-100 text-xs text-slate-800 leading-relaxed space-y-2">
            <p className="font-bold text-slate-900">Outcome & Relief Accorded:</p>
            <p>{resolution.complainant_visible_summary}</p>
          </div>

          {
    /* If staff and internal review pending */
  }
          {isStaff && !resolution.approved_at && canApproveResolution && <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-emerald-800">
                Pending Bureau Director Final Approval
              </span>
              <button
    onClick={() => handleApproveResolution(resolution.id)}
    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm"
  >
                Authorize & Finalize Resolution
              </button>
            </div>}
        </div>}

      {
    /* Tab Navigation */
  }
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-bold">
        <button
    onClick={() => setActiveTab("timeline")}
    className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${activeTab === "timeline" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
          <Clock className="w-4 h-4" /> Status Timeline
        </button>

        <button
    onClick={() => setActiveTab("rfis")}
    className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${activeTab === "rfis" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
          <MessageSquare className="w-4 h-4" /> Information Requests ({rfis.length})
        </button>

        <button
    onClick={() => setActiveTab("documents")}
    className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${activeTab === "documents" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
          <FileText className="w-4 h-4" /> Evidence Documents ({documents.length})
        </button>

        {isStaff && <button
    onClick={() => setActiveTab("internal_notes")}
    className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${activeTab === "internal_notes" ? "border-amber-600 text-amber-800 bg-amber-50/40" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
            <Lock className="w-4 h-4 text-amber-600" /> Internal Notes (Staff Only)
          </button>}

        {isStaff && <button
    onClick={() => setActiveTab("ai_insights")}
    className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${activeTab === "ai_insights" ? "border-cyan-600 text-cyan-800 bg-cyan-50/40" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
            <Sparkles className="w-4 h-4 text-cyan-600" /> AI Case Intelligence
          </button>}
      </div>

      {
    /* TAB CONTENT PANELS */
  }
      <div className="synora-card p-6">
        {
    /* TAB 1: STATUS TIMELINE */
  }
        {activeTab === "timeline" && <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Chronological Status History & Audit Log
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {history.map((stepItem, idx) => <div key={stepItem.id} className="relative flex items-start gap-4">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={stepItem.to_status} size="sm" />
                        {stepItem.from_status && <span className="text-xs text-slate-400">
                            (from {stepItem.from_status.replace(/_/g, " ")})
                          </span>}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(stepItem.created_at).toLocaleString()}
                      </span>
                    </div>

                    {stepItem.note && <p className="text-xs text-slate-700 leading-relaxed mt-1 font-medium">
                        {stepItem.note}
                      </p>}

                    <div className="text-[10px] text-slate-400 mt-2">
                      Recorded by: {stepItem.actor_name || "System Workflow Engine"}
                    </div>
                  </div>
                </div>)}
            </div>
          </div>}

        {
    /* TAB 2: INFORMATION REQUESTS */
  }
        {activeTab === "rfis" && <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Information & Clarification Inquiries
              </h3>
              {isStaff && <button
                onClick={() => {
                  setRfiModalError(null);
                  setShowRfiModal(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-700 hover:bg-purple-800"
              >
                  + New Information Request
                </button>}
            </div>

            {rfiMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                  rfiMessage.type === "success"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                <span>{rfiMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setRfiMessage(null)}
                  className="font-bold text-xs hover:opacity-75"
                >
                  ✕
                </button>
              </div>
            )}

            {rfis.length === 0 ? <p className="text-xs text-slate-400 py-6 text-center">
                No information requests issued for this complaint.
              </p> : rfis.map((rfi) => {
                const canRespond = (isComplainant && rfi.complainant_id === user?.id) || isStaff;
                const isEditingThis = editingRfiId === rfi.id;

                return (
                  <div key={rfi.id} className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Inquiry by Officer:</span>
                        <span className="text-slate-600">{rfi.officer_name || "Investigative Officer"}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rfi.status === "RESPONDED" ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"}`}>
                        {rfi.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      "{rfi.request_details}"
                    </p>

                    {rfi.response_details && !isEditingThis && (
                      <div className="pl-4 border-l-2 border-emerald-500 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-800">
                            Recorded Response:
                          </span>
                          {canRespond && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRfiId(rfi.id);
                                setEditingRfiReply(rfi.response_details);
                                if (rfiMessage) setRfiMessage(null);
                              }}
                              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:underline"
                            >
                              Edit / Update Response
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/40 p-3 rounded-lg border border-emerald-100">
                          {rfi.response_details}
                        </p>
                        <span className="text-[10px] text-slate-400 block">
                          Responded: {new Date(rfi.responded_at || "").toLocaleString()}
                        </span>
                      </div>
                    )}

                    {(!rfi.response_details || isEditingThis) && canRespond && (
                      <div className="pt-2 pl-4 border-l-2 border-purple-400 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-purple-900">
                            {isEditingThis
                              ? "Update Written Response / Supporting Details:"
                              : (isComplainant ? "Provide Your Written Response:" : "Record / Submit Response to this Inquiry:")}
                          </span>
                          {isEditingThis && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRfiId(null);
                                setEditingRfiReply("");
                              }}
                              className="text-[11px] text-slate-500 hover:text-slate-800"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={isEditingThis ? editingRfiReply : rfiReply}
                          onChange={(e) => {
                            if (isEditingThis) {
                              setEditingRfiReply(e.target.value);
                            } else {
                              setRfiReply(e.target.value);
                            }
                            if (rfiMessage) setRfiMessage(null);
                          }}
                          placeholder="Type your response to this clarification inquiry..."
                          className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={submittingRfi || !(isEditingThis ? editingRfiReply.trim() : rfiReply.trim())}
                            onClick={() => handleRespondRfi(rfi.id, isEditingThis ? editingRfiReply : rfiReply)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-sm disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" /> {submittingRfi ? "Submitting..." : (isEditingThis ? "Update Response" : "Submit Response")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>}

        {
    /* TAB 3: DOCUMENTS */
  }
        {activeTab === "documents" && <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Evidence & Attached Documentation Vault
            </h3>

            {documents.length === 0 ? <p className="text-xs text-slate-400 py-6 text-center">
                No documents uploaded for this case.
              </p> : <div className="divide-y divide-slate-100">
                {documents.map((doc) => <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{doc.file_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {(doc.file_size / 1024).toFixed(1)} KB • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                          {doc.is_internal_only ? " (Internal Only)" : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      disabled={downloadingDocId === doc.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloadingDocId === doc.id ? "Downloading..." : "Download"}
                    </button>
                  </div>)}
              </div>}
          </div>}

        {
    /* TAB 4: INTERNAL NOTES (STAFF ONLY) */
  }
        {activeTab === "internal_notes" && isStaff && <div className="space-y-5">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>
                Confidential Investigation Log: Internal notes are strictly restricted to authorized staff and are never exposed to complainants.
              </span>
            </div>

            {noteError && (
              <div className="p-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{noteError}</span>
              </div>
            )}

            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
    rows={3}
    required
    value={newNote}
    onChange={(e) => setNewNote(e.target.value)}
    placeholder="Record witness statements, evidence inspection findings, or statutory directives..."
    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
  />
              <div className="flex justify-end">
                <button
    type="submit"
    disabled={submittingNote || !newNote.trim()}
    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm disabled:opacity-50"
  >
                  {submittingNote ? "Recording..." : "Add Confidential Note"}
                </button>
              </div>
            </form>

            <div className="space-y-3 pt-2">
              {internalNotes.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">
                  No internal notes recorded yet.
                </p> : internalNotes.map((n) => <div key={n.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-slate-800">
                        {n.author_name} ({n.author_role?.replace(/_/g, " ")})
                      </span>
                      <span className="text-[10px]">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{n.note}</p>
                  </div>)}
            </div>
          </div>}

        {
    /* TAB 5: AI CASE INTELLIGENCE (STAFF ONLY) */
  }
        {activeTab === "ai_insights" && isStaff && <div className="space-y-6">
            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-950 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>SYNORA AI Heuristic Analysis & Regulatory Safety Checks</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded">
                Human Oversight Required
              </span>
            </div>

            {
    /* AI Urgency & Risk */
  }
            {aiRisk && <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase">Assessed Urgency Level</span>
                  <span className={`px-2 py-0.5 rounded font-extrabold ${aiRisk.urgency_level === "CRITICAL" ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"}`}>
                    {aiRisk.urgency_level}
                  </span>
                </div>
                {aiRisk.risk_factors.length > 0 && <div>
                    <span className="font-semibold text-slate-600 block mb-1">Detected Risk Factors:</span>
                    <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                      {aiRisk.risk_factors.map((rf, idx) => <li key={idx}>{rf}</li>)}
                    </ul>
                  </div>}
                {aiRisk.recommended_actions.length > 0 && <div className="pt-2">
                    <span className="font-semibold text-slate-600 block mb-1">Recommended Next Steps:</span>
                    <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                      {aiRisk.recommended_actions.map((ra, idx) => <li key={idx}>{ra}</li>)}
                    </ul>
                  </div>}
              </div>}

            {
    /* Potential Duplicate Matches */
  }
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Potential Duplicate Cases ({aiDuplicates.length})
              </h4>
              {aiDuplicates.length === 0 ? <p className="text-xs text-slate-400">No matching duplicates detected.</p> : <div className="space-y-2">
                  {aiDuplicates.map((dup) => <div key={dup.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700">{dup.reference_number}</span>
                          <span className="font-bold text-slate-800">{dup.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{dup.match_reason}</p>
                      </div>
                      <Link
    to={`/complaints/${dup.id}`}
    className="text-xs font-bold text-blue-600 hover:underline"
  >
                        Inspect
                      </Link>
                    </div>)}
                </div>}
            </div>
          </div>}
      </div>

      {
    /* MODAL: ASSIGN CASE */
  }
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign / Reassign Complaint">
        <div className="space-y-4 text-xs">
          {assignError && (
            <div className="p-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{assignError}</span>
            </div>
          )}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Bureau</label>
            <select
    value={assignBureauId}
    onChange={(e) => {
      setAssignBureauId(e.target.value);
      loadBureauOfficers(e.target.value);
    }}
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  >
              <option value="">Select Bureau</option>
              {bureaus.map((b) => <option key={b.id} value={b.id}>{b.code} - {b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Case Officer</label>
            <select
    value={assignOfficerId}
    onChange={(e) => setAssignOfficerId(e.target.value)}
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  >
              <option value="">Unassigned (Bureau Pool)</option>
              {officers.map((o) => <option key={o.id} value={o.id}>{o.full_name} ({o.designation})</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assignment Directive / Notes</label>
            <textarea
    rows={2}
    value={assignNotes}
    onChange={(e) => setAssignNotes(e.target.value)}
    placeholder="Instructions for the assigned vigilance officer..."
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
    onClick={() => setShowAssignModal(false)}
    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
  >
              Cancel
            </button>
            <button
    onClick={handleAssignSubmit}
    className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold"
  >
              Confirm Assignment
            </button>
          </div>
        </div>
      </Modal>

      {
    /* MODAL: STATUS TRANSITION */
  }
      <Modal isOpen={showTransitionModal} onClose={() => setShowTransitionModal(false)} title="Update Workflow Status">
        <div className="space-y-4 text-xs">
          {transitionError && (
            <div className="p-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{transitionError}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
              <span className="font-bold text-slate-800 text-xs">{complaint.status.replace(/_/g, " ")}</span>
            </div>
            <StatusBadge status={complaint.status} />
          </div>

          {getAvailableTransitions().length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <p className="font-bold">Case Lifecycle Concluded</p>
              <p className="text-[11px] text-amber-800">
                This grievance is currently in <strong>{complaint.status}</strong>, which is a terminal state. No further status changes can be performed.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Permitted Next Workflow Status *</label>
                <select
                  value={selectedNextStatus}
                  onChange={(e) => {
                    setSelectedNextStatus(e.target.value);
                    if (transitionError) setTransitionError(null);
                  }}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 shadow-sm"
                >
                  {getAvailableTransitions().map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABELS[st] || st.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  {STATUS_DESCRIPTIONS[selectedNextStatus] || "Advance the case through the statutory institutional grievance lifecycle."}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Note / Milestone Justification (Public Log)</label>
                <textarea
                  rows={2}
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  placeholder="Document the milestone reason for updating the workflow status..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransitionModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransitionStatus}
                  disabled={!selectedNextStatus}
                  className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold disabled:opacity-50 shadow-sm"
                >
                  Confirm Transition
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {
    /* MODAL: RFI REQUEST */
  }
      <Modal isOpen={showRfiModal} onClose={() => setShowRfiModal(false)} title="Request Additional Proof / Clarification">
        <div className="space-y-4 text-xs">
          {rfiModalError && (
            <div className="p-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{rfiModalError}</span>
            </div>
          )}
          <p className="text-slate-500">
            This will place the complaint in <strong className="font-bold text-purple-700">Awaiting Complainant Response</strong> status until the complainant responds.
          </p>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Question / Requested Documents *</label>
            <textarea
    rows={4}
    value={rfiQuestion}
    onChange={(e) => setRfiQuestion(e.target.value)}
    placeholder="Please provide copy of fee receipt and date of withdrawal submission..."
    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
    onClick={() => setShowRfiModal(false)}
    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
  >
              Cancel
            </button>
            <button
    onClick={handleCreateRfi}
    disabled={!rfiQuestion.trim()}
    className="px-4 py-2 rounded-lg text-white bg-purple-700 hover:bg-purple-800 font-bold disabled:opacity-50"
  >
              Dispatch Inquiry
            </button>
          </div>
        </div>
      </Modal>

      {
    /* MODAL: PROPOSE RESOLUTION */
  }
      <Modal isOpen={showResolutionModal} onClose={() => setShowResolutionModal(false)} title="Document Case Resolution">
        <div className="space-y-4 text-xs">
          {resolutionError && (
            <div className="p-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{resolutionError}</span>
            </div>
          )}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Investigation Findings *</label>
            <textarea
    rows={2}
    value={findings}
    onChange={(e) => setFindings(e.target.value)}
    placeholder="Factual findings from inspection and college compliance review..."
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Internal Resolution Summary *</label>
            <textarea
    rows={2}
    value={resolutionSummary}
    onChange={(e) => setResolutionSummary(e.target.value)}
    placeholder="Directives issued to institution and disciplinary actions taken..."
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Complainant-Visible Outcome Statement *</label>
            <textarea
    rows={2}
    value={complainantSummary}
    onChange={(e) => setComplainantSummary(e.target.value)}
    placeholder="Clear statement sent to complainant explaining relief accorded..."
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
    onClick={() => setShowResolutionModal(false)}
    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
  >
              Cancel
            </button>
            <button
    onClick={handleProposeResolution}
    disabled={!findings || !resolutionSummary || !complainantSummary}
    className="px-4 py-2 rounded-lg text-white bg-emerald-700 hover:bg-emerald-800 font-bold disabled:opacity-50"
  >
              Submit Resolution
            </button>
          </div>
        </div>
      </Modal>

      {
    /* MODAL: ESCALATION */
  }
      <Modal isOpen={showEscalateModal} onClose={() => setShowEscalateModal(false)} title="Escalate Case to Higher Authority">
        <div className="space-y-4 text-xs">
          {escalateError && (
            <div className="p-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{escalateError}</span>
            </div>
          )}
          <p className="text-slate-600">
            Escalation triggers priority notifications to Bureau Heads and Council Ombudsman for emergency regulatory intervention.
          </p>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Escalation Justification *</label>
            <textarea
    rows={3}
    value={escalateReason}
    onChange={(e) => setEscalateReason(e.target.value)}
    placeholder="Explain why deadline was missed or why higher council authority is required..."
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
    onClick={() => setShowEscalateModal(false)}
    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
  >
              Cancel
            </button>
            <button
    onClick={handleEscalateCase}
    disabled={!escalateReason.trim()}
    className="px-4 py-2 rounded-lg text-white bg-rose-700 hover:bg-rose-800 font-bold disabled:opacity-50"
  >
              Authorize Escalation
            </button>
          </div>
        </div>
      </Modal>
    </div>;
};

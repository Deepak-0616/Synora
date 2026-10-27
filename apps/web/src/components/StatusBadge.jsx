import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  RotateCcw,
  ShieldCheck,
  Flame,
  XCircle,
  Archive,
  Hourglass
} from "lucide-react";
export const StatusBadge = ({ status, size = "md" }) => {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  switch (status) {
    case "SUBMITTED":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          Submitted
        </span>;
    case "ACKNOWLEDGED":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
          Acknowledged
        </span>;
    case "UNDER_REVIEW":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 ${sizeClasses}`}>
          <FileSearch className="w-3.5 h-3.5 text-cyan-600" />
          Under Review
        </span>;
    case "IN_PROGRESS":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <Hourglass className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
          In Progress
        </span>;
    case "AWAITING_COMPLAINANT_RESPONSE":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
          Awaiting Response
        </span>;
    case "AWAITING_INTERNAL_REVIEW":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Pending Signoff
        </span>;
    case "RESOLVED":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Resolved
        </span>;
    case "CLOSED":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-300 ${sizeClasses}`}>
          <Archive className="w-3.5 h-3.5 text-gray-500" />
          Closed
        </span>;
    case "ESCALATED":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-300 ${sizeClasses}`}>
          <Flame className="w-3.5 h-3.5 text-rose-600" />
          Escalated
        </span>;
    case "REJECTED":
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          Rejected
        </span>;
    default:
      return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <RotateCcw className="w-3.5 h-3.5" />
          {status}
        </span>;
  }
};
export const PriorityBadge = ({ priority }) => {
  switch (priority) {
    case "CRITICAL":
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          CRITICAL
        </span>;
    case "HIGH":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
          HIGH
        </span>;
    case "MEDIUM":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          MEDIUM
        </span>;
    case "LOW":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          LOW
        </span>;
  }
};
export const SLABadge = ({ status = "NORMAL", daysRemaining = 0 }) => {
  if (status === "OVERDUE") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300">
        <AlertCircle className="w-3 h-3 text-red-600" />
        OVERDUE ({Math.abs(daysRemaining)}d ago)
      </span>;
  }
  if (status === "APPROACHING_DEADLINE") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
        <Clock className="w-3 h-3 text-amber-600" />
        Due in {daysRemaining}d
      </span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
      <Clock className="w-3 h-3 text-slate-400" />
      {daysRemaining}d remaining
    </span>;
};

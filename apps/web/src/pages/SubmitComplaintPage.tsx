import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Bureau, ComplaintPriority } from '../types';
import {
  FilePlus2,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Building2,
  Calendar,
  Upload,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Copy,
  Check
} from 'lucide-react';

const CATEGORIES = [
  'Ragging / Harassment',
  'Fee & Financial Malpractice',
  'Admission Irregularity',
  'Faculty & Staff Grievance',
  'Infrastructure & Safety',
  'Approval & Accreditation',
  'Academic Malpractice',
  'General Administrative'
];

export const SubmitComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [bureauId, setBureauId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  // AI & Feedback states
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [submittedComplaint, setSubmittedComplaint] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadBureaus();
  }, []);

  const loadBureaus = async () => {
    try {
      const data = await api.get<Bureau[]>('/bureaus');
      setBureaus(data);
    } catch {
      // Non-blocking
    }
  };

  // AI Assist Classification
  const handleAiClassify = async () => {
    if (!title && !description) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/classify', { title, description });
      setAiSuggestion(res);
      if (res.suggested_category) {
        setCategory(res.suggested_category);
      }
      if (res.suggested_bureau_id) {
        setBureauId(res.suggested_bureau_id);
      }

      // Check duplicates
      if (institutionName) {
        const dupRes = await api.post('/ai/duplicates', {
          title,
          description,
          institution_name: institutionName
        });
        setDuplicateWarning(dupRes || []);
      }
    } catch (err) {
      console.warn('AI suggestion fallback:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      // 1. Create Complaint
      const complaint = await api.post('/complaints', {
        title,
        description,
        category,
        priority,
        institution_name: institutionName,
        institution_id: institutionId || null,
        incident_date: incidentDate || null,
        bureau_id: bureauId || null
      });

      // 2. Upload Evidence Document if attached
      if (file && complaint.id) {
        try {
          await api.upload(`/complaints/${complaint.id}/documents`, file, {
            is_internal_only: 'false'
          });
        } catch (uploadErr) {
          console.warn('Document upload warning:', uploadErr);
        }
      }

      setSubmittedComplaint(complaint);
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (!submittedComplaint?.reference_number) return;
    navigator.clipboard.writeText(submittedComplaint.reference_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // CONFIRMATION SCREEN
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-in zoom-in-95 duration-200">
        <div className="synora-card p-8 text-center border-t-4 border-t-emerald-500 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Grievance Formally Registered
          </span>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-3">
            Complaint Reference Generated
          </h2>

          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            Your complaint has been timestamped and encrypted in the official AICTE oversight database.
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 inline-flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold uppercase">Case ID:</span>
            <span className="text-xl font-mono font-extrabold text-blue-700">
              {submittedComplaint.reference_number}
            </span>
            <button
              onClick={handleCopyRef}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200 transition-colors"
              title="Copy Reference"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs mb-8">
            <div>
              <span className="text-slate-500 block">Assigned Bureau:</span>
              <strong className="text-slate-800 font-bold">
                {submittedComplaint.bureau_name || 'Routing via AICTE National Cell'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Statutory Resolution Target:</span>
              <strong className="text-slate-800 font-bold">
                {new Date(submittedComplaint.target_resolution_date).toLocaleDateString()} ({submittedComplaint.priority} Priority)
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              to={`/complaints/${submittedComplaint.id}`}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
            >
              Track Case Live &rarr;
            </Link>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          File an Institutional Grievance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Structured 4-step progressive disclosure protocol for AICTE bureau investigation
        </p>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80">
        {[
          { num: 1, title: 'Issue Details' },
          { num: 2, title: 'Institution Info' },
          { num: 3, title: 'Evidence Vault' },
          { num: 4, title: 'Review & Verify' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s.num
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === s.num ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <strong className="font-bold">Submission Validation Error</strong>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="synora-card p-6 md:p-8">
        {/* STEP 1: ISSUE DETAILS */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Complaint Title *
                </label>
                <span className="text-[11px] text-slate-400">Concise summary of the grievance</span>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unlawful retention of original 10th and 12th marksheet certificates"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Comprehensive Description *
                </label>
                <span className="text-[11px] text-slate-400">State dates, personnel involved, and specific impact</span>
              </div>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a factual, detailed statement of the incident, names of institutional authorities contacted, and how AICTE rules were breached..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white leading-relaxed"
              />
            </div>

            {/* AI Assistant Button */}
            <div className="p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <span className="text-xs text-cyan-950 font-medium">
                  {aiSuggestion
                    ? `AI Analysis: Best match is ${aiSuggestion.suggested_category} (${(aiSuggestion.confidence * 100).toFixed(0)}% confidence)`
                    : 'Analyze complaint text to suggest the best AICTE bureau & category'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAiClassify}
                disabled={aiLoading || (!title && !description)}
                className="text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 px-3.5 py-1.5 rounded-lg shadow-sm disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {aiLoading ? 'Analyzing...' : 'AI Assist: Suggest Bureau'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Assigned AICTE Bureau (Optional)
                </label>
                <select
                  value={bureauId}
                  onChange={(e) => setBureauId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Let AICTE Routing Cell Assign</option>
                  {bureaus.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (title.length < 5 || description.length < 20) {
                    setError('Please provide a title (min 5 chars) and description (min 20 chars).');
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next: Institution Info <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: INSTITUTION INFO */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Institution Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Apex Institute of Engineering & Technology, Bengaluru"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  AICTE Permanent Institute ID (PID)
                </label>
                <input
                  type="text"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  placeholder="e.g. 1-10492831 (Optional)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Incident Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Urgency Priority *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { p: 'LOW', label: 'Low (30 Days)', desc: 'General queries' },
                  { p: 'MEDIUM', label: 'Medium (14 Days)', desc: 'Admin discrepancies' },
                  { p: 'HIGH', label: 'High (7 Days)', desc: 'Fee fraud, harassment' },
                  { p: 'CRITICAL', label: 'Critical (48h)', desc: 'Ragging / Safety risk' }
                ].map(({ p, label, desc }) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p as ComplaintPriority)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      priority === p
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duplicate Notice */}
            {duplicateWarning.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Existing Complaints Detected at this Institution:</span>
                </div>
                <p className="text-amber-700 leading-snug">
                  SYNORA AI detected {duplicateWarning.length} existing complaint(s) with similar descriptions for this college.
                  Your complaint will still be recorded, but cross-referenced to assist the investigation squad.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (institutionName.length < 3) {
                    setError('Please provide the institution name.');
                    return;
                  }
                  setError(null);
                  setStep(3);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next: Evidence Vault <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EVIDENCE VAULT */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Upload Corroborating Evidence (Optional)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload fee receipts, official emails, rejection letters, or photos. Documents are stored in an encrypted vault accessible solely to assigned investigative officers.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-xs font-semibold text-slate-700 mb-1">
                {file ? file.name : 'Choose file or drag & drop here'}
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                Supported formats: PDF, JPG, PNG, DOCX, ZIP (Max 10MB)
              </p>
              <input
                type="file"
                id="file-upload"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.txt,.zip"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                Browse Files
              </label>
            </div>

            {file && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{file.name}</span>
                  <span className="text-slate-400 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-rose-600 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next: Final Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: VERIFICATION REVIEW BEFORE SUBMIT */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Verification Review Before Official Filing
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Please verify that the details below are accurate and truthful before final submission.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="p-4 grid grid-cols-3">
                <span className="font-bold text-slate-500">Title</span>
                <span className="col-span-2 text-slate-900 font-semibold">{title}</span>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="font-bold text-slate-500">Category & Priority</span>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{category}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    {priority} Priority
                  </span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="font-bold text-slate-500">Institution</span>
                <span className="col-span-2 text-slate-900 font-semibold">
                  {institutionName} {institutionId ? `(PID: ${institutionId})` : ''}
                </span>
              </div>
              {incidentDate && (
                <div className="p-4 grid grid-cols-3">
                  <span className="font-bold text-slate-500">Incident Date</span>
                  <span className="col-span-2 text-slate-900 font-semibold">{incidentDate}</span>
                </div>
              )}
              <div className="p-4 grid grid-cols-3">
                <span className="font-bold text-slate-500">Statement</span>
                <p className="col-span-2 text-slate-700 leading-relaxed max-h-32 overflow-y-auto">
                  {description}
                </p>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="font-bold text-slate-500">Attached Evidence</span>
                <span className="col-span-2 text-slate-700">
                  {file ? file.name : 'No documents attached'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Complainant Undertaking:</p>
              <p>
                By submitting this form, I affirm that the information furnished is authentic to the best of my knowledge. Submitting knowingly false statements is subject to penalty under AICTE statutory provisions.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Registering Grievance...' : 'Submit Grievance Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

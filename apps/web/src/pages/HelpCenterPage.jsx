import { useState } from "react";
import {
  HelpCircle,
  Building2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
const FAQS = [
  {
    q: "Can an institution lawfully retain my original 10th or 12th certificates?",
    a: "No. As per AICTE Approval Process Handbook (Appendix 8) and UGC directives, institutions are strictly prohibited from retaining original educational certificates or mark sheets under any pretext, including withdrawal of admission or fee disputes."
  },
  {
    q: "What is the mandatory timeline for Anti-Ragging complaints?",
    a: "Anti-Ragging grievances are designated as CRITICAL priority under the Supreme Court of India directives and AICTE Anti-Ragging Regulations. Investigation and preliminary protective action must commence within 48 hours of filing."
  },
  {
    q: "What happens if a complaint SLA deadline is missed?",
    a: "The SYNORA system automatically flags the case as OVERDUE, calculates penalty days, and generates an automated supervisory escalation alert to the respective AICTE Bureau Head and Council Ombudsman for emergency regulatory review."
  },
  {
    q: "How does SYNORA protect complainants against institutional retribution?",
    a: "SYNORA utilizes cryptographically secure, role-scoped data vaults. Sensitive whistleblower details and preliminary inquiry evidence remain isolated from non-authorized personnel."
  },
  {
    q: "Can I submit additional evidence after filing my complaint?",
    a: "Yes. If a case officer issues an Information Request (RFI), you can submit supplementary documents and clarification directly from your complaint tracking dashboard."
  }
];
export const HelpCenterPage = () => {
  const [openFaq, setOpenFaq] = useState(0);
  return <div className="max-w-4xl mx-auto space-y-8">
      {
    /* Header */
  }
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          AICTE Grievance Redressal Manual & FAQ
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Statutory guidance on complaint filing, bureau jurisdiction, and regulatory enforcement
        </p>
      </div>

      {
    /* SLA Standard Reference Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
          <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Critical SLA</div>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">48 Hours</div>
          <p className="text-[11px] text-rose-700 mt-1">Anti-Ragging, safety threats, hostel violence</p>
        </div>

        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
          <div className="text-xs font-bold text-orange-800 uppercase tracking-wider">High SLA</div>
          <div className="text-2xl font-extrabold text-orange-900 mt-1">7 Days</div>
          <p className="text-[11px] text-orange-700 mt-1">Capitation fee fraud, certificate retention</p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Medium SLA</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">14 Days</div>
          <p className="text-[11px] text-blue-700 mt-1">Infrastructure deficiencies, faculty ratio</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Standard SLA</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">30 Days</div>
          <p className="text-[11px] text-slate-600 mt-1">General administrative queries & procedures</p>
        </div>
      </div>

      {
    /* AICTE Bureau Jurisdictions */
  }
      <div className="synora-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>AICTE Specialized Bureaus & Competent Cells</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="text-blue-700 font-bold block">Approval Bureau (AB)</strong>
            <p className="text-slate-600">
              Enforces Extension of Approval (EOA), course approvals, sanctioned student intake ceilings, and unapproved shifts.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="text-rose-700 font-bold block">Anti-Ragging Monitoring Cell (ARC)</strong>
            <p className="text-slate-600">
              Conducts expedited emergency investigations and coordinates zero-tolerance safety measures with district authorities.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="text-cyan-700 font-bold block">Student & Faculty Welfare Cell (SFWC)</strong>
            <p className="text-slate-600">
              Adjudicates unlawful retention of student mark sheets, faculty pay scale anomalies, and arbitrary terminations.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="text-purple-700 font-bold block">Finance & Auditing Cell (FAC)</strong>
            <p className="text-slate-600">
              Investigates illegal capitation fees, unauthorized fees disguised as development funds, and refund non-compliance.
            </p>
          </div>
        </div>
      </div>

      {
    /* Frequently Asked Questions Accordion */
  }
      <div className="synora-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-cyan-600" />
          <span>Frequently Asked Questions (FAQ)</span>
        </div>

        <div className="divide-y divide-slate-100">
          {FAQS.map((faq, idx) => <div key={idx} className="py-3">
              <button
    type="button"
    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
    className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
  >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>
              {openFaq === idx && <p className="text-xs text-slate-600 mt-2 leading-relaxed pl-2 border-l-2 border-cyan-500 animate-in fade-in duration-100">
                  {faq.a}
                </p>}
            </div>)}
        </div>
      </div>

      {
    /* Statutory Contact Support */
  }
      <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm">Need Additional Assistance?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            AICTE National Grievance Redressal Cell, Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
          </p>
        </div>
        <div className="text-xs font-mono text-cyan-400 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 whitespace-nowrap">
          Toll-Free Helpline: 1800-11-2026
        </div>
      </div>
    </div>;
};

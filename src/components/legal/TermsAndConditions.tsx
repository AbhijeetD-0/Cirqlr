import React, { useEffect } from 'react';
import { 
  ArrowLeft, 
  X, 
  FileText, 
  Clock, 
  ShieldCheck, 
  Users, 
  Building2, 
  AlertTriangle,
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface LegalModalProps {
  onClose: () => void;
}

export const TermsAndConditions: React.FC<LegalModalProps> = ({ onClose }) => {
  // Prevent background body scrolling when modal is open and handle Escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Return to platform"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                  Cirqlr Governance & Legal
                </span>
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Terms & Conditions
                </h1>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed scrollbar-thin">
          {/* Metadata Card */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-indigo-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Effective Date: October 2026. Operated by SUDARSAN HUB.</span>
            </div>
            <span className="text-[10px] bg-indigo-600/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider shrink-0">
              Verified 21+
            </span>
          </div>

          {/* Clause 1 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Clause 1: Binding Agreement, Active OTP Consent &amp; Strict 21+ Eligibility</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              By generating and verifying a One-Time Password (OTP) on Cirqlr, users enter into a legally binding digital contract governed by Section 10A of the Information Technology Act, 2000. Registration and platform access are strictly restricted to verified adults aged 21 years or older. Any attempt by minors or unauthorized third parties to register constitutes an unlawful breach of terms, subject to immediate account termination and legal action.
            </p>
          </div>

          {/* Clause 2 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Clause 2: Intermediary Status &amp; Limitation of Liability</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Cirqlr functions solely as a technology intermediary under Section 79 of the Information Technology Act, 2000, facilitating introductory arrangements between independent consenting adults for platonic companionship. Cirqlr does not employ companions, does not direct outings, and assumes zero liability for personal interactions, civil disputes, emotional distress, or off-platform actions of its users.
            </p>
          </div>

          {/* Clause 3 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Clause 3: 100% Public Commercial Venue Mandate &amp; 7-Day Automated Restricted Mode</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              All outings must take place strictly in approved, commercial public spaces (cafes, restaurants, malls, registered cultural venues). Arranging or proposing private residences, hotel/resort rooms, or secluded venues is strictly forbidden. The system scans outing communications; detection of prohibited keywords triggers an immediate automated 7-Day Restricted Mode, revoking booking capabilities and triggering security escalation.
            </p>
          </div>

          {/* Clause 4 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Clause 4: Unconditional Law Enforcement &amp; FIR Data Disclosure Authority</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Cirqlr maintains a zero-tolerance policy for criminal solicitation, harassment, extortion, or non-platonic exploitation. Cirqlr reserves unconditional authority under Indian law to disclose user credentials, government ID records, chat audit trails, geolocation stamps, and financial payment references to law enforcement agencies upon receipt of formal police requisition or First Information Report (FIR) filing.
            </p>
          </div>

          {/* Clause 5 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Clause 5: Account Termination, 1-Year Mandatory Legal Archive Freeze &amp; Jurisdiction</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Upon account deletion or sanction for safety violations, user account identifiers, contact records, and communication audits are placed into a 1-Year Mandatory Legal Archive Freeze pursuant to statutory compliance and IT Act guidelines, after which non-regulatory personal data is scrubbed. All platform disputes are subject to the exclusive jurisdiction of the competent courts in West Bengal, India.
            </p>
          </div>

          {/* Bottom Back Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Cirqlr Terms • SUDARSAN HUB
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

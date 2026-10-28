import React, { useEffect } from 'react';
import { 
  ArrowLeft, 
  X, 
  Lock, 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  Mail, 
  Trash2
} from 'lucide-react';

interface LegalModalProps {
  onClose: () => void;
}

export const PrivacyPolicy: React.FC<LegalModalProps> = ({ onClose }) => {
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
              <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                  Cirqlr Data Security
                </span>
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Privacy Policy
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
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-emerald-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Effective Date: October 2026. Operated by SUDARSAN HUB.</span>
            </div>
            <span className="text-[10px] bg-emerald-600/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider shrink-0">
              Zero Data Sale
            </span>
          </div>

          {/* Clause 1 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Clause 1: Personal Data Collected &amp; Lawful Purpose (DPDP Act 2023)</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              In accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, Cirqlr processes user personal data (mobile phone numbers, email addresses, government photo identification, user photos, and venue preferences) solely for identity verification, transaction authentication, booking coordination, and platform safety enforcement.
            </p>
          </div>

          {/* Clause 2 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Clause 2: Data Security &amp; Zero Commercial Monetization</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Personal data is encrypted in transit and at rest using modern cryptographic protocols. Cirqlr enforces strict operational firewalls: user contact information (phone numbers and residential addresses) is masked and never exposed to other platform members or sold to third-party commercial brokers or advertisers.
            </p>
          </div>

          {/* Clause 3 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Clause 3: User Rights, Consent Withdrawal &amp; 1-Year Archive Retention Policy</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Users hold the right to access, rectify, or withdraw consent for data processing under DPDP Act provisions. However, upon account deactivation or termination, critical audit trails—including verified mobile numbers, ID verification logs, safety reports, and financial payment references—are securely preserved for a mandatory 1-Year Legal Archive Freeze to prevent recidivist fraud, facilitate law enforcement investigations, and comply with statutory retention standards under Indian law.
            </p>
          </div>

          {/* Clause 4 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Clause 4: Cookies &amp; Persistent Session Storage</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Cirqlr utilizes persistent local storage and essential session tokens strictly for session continuity, multi-factor authentication persistence, and platform preference maintenance. No cross-site third-party tracking or advertising surveillance cookies are deployed.
            </p>
          </div>

          {/* Bottom Back Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Cirqlr Privacy • SUDARSAN HUB
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
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

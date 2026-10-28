import React, { useEffect, useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  FileText, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  RotateCcw, 
  Clock, 
  Building2, 
  Users, 
  AlertTriangle,
  Info
} from 'lucide-react';

export type LegalDocType = 'terms' | 'privacy' | 'safety';

interface SignUpLegalReaderModalProps {
  initialDoc?: LegalDocType;
  isOpen: boolean;
  onClose: () => void;
}

export const SignUpLegalReaderModal: React.FC<SignUpLegalReaderModalProps> = ({
  initialDoc = 'terms',
  isOpen,
  onClose,
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900/95 border border-slate-700/90 text-slate-100 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with "Close & Return to Sign Up" */}
        <div className="bg-slate-950/95 px-5 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
              title="Close & Return to Sign Up"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Close &amp; Return to Sign Up</span>
            </button>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <span className="text-xs text-slate-400 hidden sm:inline">
              Registration Legal Document Viewer
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Switcher Tab Bar */}
        <div className="bg-slate-950/80 px-4 sm:px-6 py-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveDoc('terms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeDoc === 'terms'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms &amp; Refund Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeDoc === 'privacy'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc('safety')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeDoc === 'safety'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Public Safety Charter</span>
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
          {/* ======================================================== */}
          {/* DOC 1: TERMS & CONDITIONS (INCLUDING REFUND POLICY)       */}
          {/* ======================================================== */}
          {activeDoc === 'terms' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 p-4 rounded-2xl border border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                      Cirqlr Governance &amp; Escrow
                    </span>
                    <h2 className="text-base font-bold text-white">
                      Terms &amp; Conditions (including Refund Policy)
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-600/20 text-indigo-300 font-bold px-2.5 py-1 rounded-full border border-indigo-500/30 uppercase tracking-wider self-start sm:self-auto">
                  Strictly 21+ Verified
                </span>
              </div>

              {/* Summary note */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Effective Date: 2026. Operated by SUDARSAN HUB across West Bengal &amp; Odisha.</span>
              </div>

              {/* Clause 1 */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Clause 1: Binding Agreement, Active OTP Consent &amp; Strict 21+ Eligibility</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm pl-6 leading-relaxed">
                  By generating and verifying a One-Time Password (OTP) on Cirqlr, users enter into a legally binding digital contract governed by Section 10A of the Information Technology Act, 2000. Registration and platform access are strictly restricted to verified adults aged 21 years or older. Any attempt by minors or unauthorized third parties to register constitutes an unlawful breach of terms, subject to immediate account termination and legal action.
                </p>
              </div>

              {/* Clause 2 */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Clause 2: Intermediary Status &amp; Limitation of Liability</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm pl-6 leading-relaxed">
                  Cirqlr functions solely as a technology intermediary under Section 79 of the Information Technology Act, 2000, facilitating introductory arrangements between independent consenting adults for platonic companionship. Cirqlr does not employ companions, does not direct outings, and assumes zero liability for personal interactions, civil disputes, emotional distress, or off-platform actions of its users.
                </p>
              </div>

              {/* Clause 3 */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Clause 3: 100% Public Commercial Venue Mandate &amp; 7-Day Automated Restricted Mode</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm pl-6 leading-relaxed">
                  All outings must take place strictly in approved, commercial public spaces (cafes, restaurants, malls, registered cultural venues). Arranging or proposing private residences, hotel/resort rooms, or secluded venues is strictly forbidden. The system scans outing communications; detection of prohibited keywords triggers an immediate automated 7-Day Restricted Mode, revoking booking capabilities and triggering security escalation.
                </p>
              </div>

              {/* Clause 4 */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Clause 4: Unconditional Law Enforcement &amp; FIR Data Disclosure Authority</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm pl-6 leading-relaxed">
                  Cirqlr maintains a zero-tolerance policy for criminal solicitation, harassment, extortion, or non-platonic exploitation. Cirqlr reserves unconditional authority under Indian law to disclose user credentials, government ID records, chat audit trails, geolocation stamps, and financial payment references to law enforcement agencies upon receipt of formal police requisition or First Information Report (FIR) filing.
                </p>
              </div>

              {/* Clause 5 */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Clause 5: Account Termination, 1-Year Mandatory Legal Archive Freeze &amp; Jurisdiction</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm pl-6 leading-relaxed">
                  Upon account deletion or sanction for safety violations, user account identifiers, contact records, and communication audits are placed into a 1-Year Mandatory Legal Archive Freeze pursuant to statutory compliance and IT Act guidelines, after which non-regulatory personal data is scrubbed. All platform disputes are subject to the exclusive jurisdiction of the competent courts in West Bengal, India.
                </p>
              </div>

              {/* Clause 6: Cancellation, Dynamic Pricing & Refund Policies */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-emerald-900/50 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Clause 6: Comprehensive Cancellation, Dynamic Pricing &amp; Refund Policy</span>
                </div>
                <div className="pl-6 space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <p>
                    <strong>• Dynamic Platform Fee:</strong> Cirqlr charges a Platform Acceptance Fee dynamically computed from the live platform settings (standard 15% base fee). Cirqlr reserves the dynamic right to adjust platform fee percentages via founder administrative settings.
                  </p>
                  <p>
                    <strong>• 100% Free Outing Rescheduling:</strong> Either party may mutually reschedule an outing to a new date/time prior to the scheduled meetup without penalty. Rescheduling is 100% free with zero fee deductions.
                  </p>
                  <p>
                    <strong>• Cancellation by Booker (100% Wallet Credit):</strong> If a confirmed booking is cancelled by the Booker, 100% of the paid Platform Acceptance Fee is immediately credited to the Companion's Fee Wallet for future booking acceptances. Zero lifeline is deducted from the Companion.
                  </p>
                  <p>
                    <strong>• Cancellation by Companion &amp; 3-Hour Emergency Lifeline:</strong> Companions receive 1 Monthly Emergency Lifeline. Cancellations requested &gt;3 hours prior to meetup credit 100% of the fee into their Fee Wallet using their lifeline. Cancellations &lt;3 hours or with exhausted lifeline forfeit the fee.
                  </p>
                  <p>
                    <strong>• Wallet Credit Usage &amp; 15-Working-Day Bank Refund:</strong> Fee wallet balances are non-transferable and can be redeemed exclusively against future platform acceptance fees. For technical duplicate charges or billing errors processed via Razorpay, verified bank account refunds are processed within 15 working days back to the original payment source.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* DOC 2: PRIVACY POLICY                                     */}
          {/* ======================================================== */}
          {activeDoc === 'privacy' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 p-4 rounded-2xl border border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                      Data Privacy &amp; DPDP Act Compliance
                    </span>
                    <h2 className="text-base font-bold text-white">
                      Privacy Policy &amp; Data Protection (DPDP Act 2023)
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-600/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider self-start sm:self-auto">
                  DPDP Act Compliant
                </span>
              </div>

              {/* Clause 1 */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Clause 1: Personal Data Collected &amp; Lawful Purpose (DPDP Act 2023)</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm pl-6 leading-relaxed">
                  In accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, Cirqlr processes user personal data (mobile phone numbers, email addresses, government photo identification, user photos, and venue preferences) solely for identity verification, transaction authentication, booking coordination, and platform safety enforcement.
                </p>
              </div>

              {/* Clause 2 */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Clause 2: Data Security &amp; Zero Commercial Monetization</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm pl-6 leading-relaxed">
                  Personal data is encrypted in transit and at rest using modern cryptographic protocols. Cirqlr enforces strict operational firewalls: user contact information (phone numbers and residential addresses) is masked and never exposed to other platform members or sold to third-party commercial brokers or advertisers.
                </p>
              </div>

              {/* Clause 3 */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Clause 3: User Rights, Consent Withdrawal &amp; 1-Year Archive Retention Policy</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm pl-6 leading-relaxed">
                  Users hold the right to access, rectify, or withdraw consent for data processing under DPDP Act provisions. However, upon account deactivation or termination, critical audit trails—including verified mobile numbers, ID verification logs, safety reports, and financial payment references—are securely preserved for a mandatory 1-Year Legal Archive Freeze to prevent recidivist fraud, facilitate law enforcement investigations, and comply with statutory retention standards under Indian law.
                </p>
              </div>

              {/* Clause 4 */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Clause 4: Cookies &amp; Persistent Session Storage</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm pl-6 leading-relaxed">
                  Cirqlr utilizes persistent local storage and essential session tokens strictly for session continuity, multi-factor authentication persistence, and platform preference maintenance. No cross-site third-party tracking or advertising surveillance cookies are deployed.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* DOC 3: 100% PUBLIC VENUE SAFETY CHARTER                   */}
          {/* ======================================================== */}
          {activeDoc === 'safety' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/60 p-4 rounded-2xl border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-600/60 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                      Zero-Tolerance Safety Protocol
                    </span>
                    <h2 className="text-base font-bold text-white">
                      100% Public Venue Safety Charter
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 uppercase tracking-wider self-start sm:self-auto">
                  Strictly Enforced
                </span>
              </div>

              {/* Allowed vs Disallowed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Strictly Permitted Public Outings</span>
                  </div>
                  <ul className="space-y-1.5 text-emerald-100/90 text-xs">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Registered Multiplexes &amp; Cinema Halls (Inox, PVR, Cinepolis, etc.)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Verified Commercial Cafes, Tea Rooms, &amp; Fine Dining Restaurants</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Shopping Malls &amp; Commercial Plazas (South City, Esplanade One, etc.)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Public State Museums, Cultural Fairs, Libraries &amp; Art Galleries</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-rose-300 text-xs sm:text-sm">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Zero-Tolerance Violations (Immediate Ban)</span>
                  </div>
                  <ul className="space-y-1.5 text-rose-100/90 text-xs">
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>Private homes, apartments, guest houses, lodges, or PG rooms</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>Hotel rooms, resort villas, motel rooms, or couple boxes</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>Private vehicles, secluded drives, or isolated farmhouses</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>Any dating solicitation, romance requests, or physical intimacy demands</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Automated Keyword Detection Notice */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Real-Time Prohibited Keyword Safety Scanner</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Our system scans all outing booking requests and Companion Studio activity cards for prohibited venue keywords (such as <em>hotel, oyo, room, lodge, private</em>). Detected attempts automatically trigger a <strong>7-Day Restricted Mode Suspension</strong> and alert platform security.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="bg-slate-950/90 px-5 sm:px-6 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Cirqlr Legal Standards • 100% Platonic &amp; Verified
          </span>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Close &amp; Return to Sign Up</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { 
  ArrowLeft, 
  X, 
  RotateCcw, 
  Clock, 
  CreditCard, 
  RefreshCw, 
  Mail, 
  ShieldCheck 
} from 'lucide-react';

interface LegalModalProps {
  onClose: () => void;
}

export const RefundPolicy: React.FC<LegalModalProps> = ({ onClose }) => {
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
              <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                  Cirqlr Financial Escrow
                </span>
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Refund Policy
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
          <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Effective Date: October 2026. Operated by SUDARSAN HUB.</span>
            </div>
            <span className="text-[10px] bg-amber-600/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider shrink-0">
              Escrow Protection
            </span>
          </div>

          {/* Clause 1 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Clause 1: Digital Service Marketplace &amp; Dynamic Fee Revision Rights</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Cirqlr provides a platform acceptance mechanism. Outing amounts are agreed upon between bookers and companions. Cirqlr charges a Platform Acceptance Fee dynamically computed from the live platform settings (standard 15% base fee). Cirqlr reserves the dynamic right to adjust platform fee percentages via founder administrative settings.
            </p>
          </div>

          {/* Clause 2 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Clause 2: 100% Free Outing Rescheduling</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Either party may mutually reschedule an outing to a new date/time prior to the scheduled meetup without penalty. Rescheduling is 100% free with zero fee deductions.
            </p>
          </div>

          {/* Clause 3 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Clause 3: Cancellation by Booker (100% Rupee Fee Credit to Companion Wallet)</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              If a confirmed booking is cancelled by the Booker, 100% of the paid Platform Acceptance Fee is immediately credited to the Companion's Fee Wallet for future booking acceptances. Zero lifeline is deducted from the Companion.
            </p>
          </div>

          {/* Clause 4 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Clause 4: Cancellation by Companion &amp; Strict 3-Hour Emergency Lifeline Rule</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Companions are allotted exactly one (1) Monthly Emergency Lifeline per calendar month for unforeseen emergencies. If a Companion cancels a confirmed outing more than three (&gt;3) hours prior to the scheduled meetup time, their 1/1 Monthly Lifeline is utilized and 100% of the Platform Acceptance Fee is credited to their Fee Wallet. If a Companion cancels with less than three (&lt;3) hours notice, or if their monthly lifeline has already been exhausted, the Platform Acceptance Fee is strictly forfeited as a non-refundable cancellation penalty.
            </p>
          </div>

          {/* Clause 5 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Clause 5: Wallet Credit Usage &amp; 15-Working-Day Bank Refund Policy for Technical Errors</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
              Fee wallet balances are non-transferable and can be redeemed exclusively against future platform acceptance fees. For technical duplicate charges or billing errors processed via Razorpay, users may submit transaction details for manual verification; approved bank account refunds are processed within 15 working days back to the original payment source.
            </p>
          </div>

          {/* Bottom Back Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Cirqlr Refund Policy • SUDARSAN HUB
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
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

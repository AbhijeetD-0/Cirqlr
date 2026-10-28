import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  Calendar,
  Clock,
  Building2,
  X,
  LogOut,
  Info
} from 'lucide-react';
import { CopyUserIdButton } from './CopyUserIdButton';

export const SuspensionNoticeModal: React.FC = () => {
  const { activeSuspensionNotice, closeSuspensionNotice, logOutUser } = useMarketplace();

  if (!activeSuspensionNotice || !activeSuspensionNotice.isOpen) {
    return null;
  }

  const handleContinueRestricted = () => {
    closeSuspensionNotice();
  };

  const handleLogOut = () => {
    closeSuspensionNotice();
    logOutUser();
  };

  const formattedExpiry = (() => {
    try {
      const d = new Date(activeSuspensionNotice.suspensionExpiryDate);
      return d.toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return activeSuspensionNotice.suspensionExpiryDate;
    }
  })();

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl w-full max-w-full sm:max-w-lg md:max-w-xl overflow-hidden shadow-2xl border border-rose-500/40 text-slate-100 flex flex-col relative m-2 sm:m-4">
        
        {/* Warning Accent Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black/30 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-rose-200 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest font-black text-rose-200 block">
                Security &amp; Safety Enforcement
              </span>
              <h3 className="font-extrabold text-base text-white tracking-tight leading-tight">
                Account in 7-Day Restricted Mode
              </h3>
            </div>
          </div>

          <span className="text-[10px] font-black uppercase bg-black/40 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-full font-mono">
            Safety Hold
          </span>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Infraction Banner */}
          <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-start gap-2.5 text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <span className="font-bold text-white text-xs block">
                  Violation of 100% Commercial Public Venues Policy
                </span>
                <p className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">
                  Your submission was intercepted because our automated venue safety scanner detected prohibited private accommodation keywords.
                </p>
              </div>
            </div>

            {activeSuspensionNotice.detectedKeyword && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-rose-900/60 flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-400 text-[11px]">Prohibited Keyword Detected:</span>
                <span className="font-mono font-bold text-xs bg-rose-900/80 text-rose-200 border border-rose-600/70 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                  "{activeSuspensionNotice.detectedKeyword}"
                </span>
              </div>
            )}

            {activeSuspensionNotice.prohibitedText && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-rose-900/60 space-y-1">
                <span className="text-slate-400 text-[11px] block">Attempted Submission Details:</span>
                <span className="font-mono text-rose-300 text-[11px] block break-words italic">
                  "{activeSuspensionNotice.prohibitedText}"
                </span>
              </div>
            )}
          </div>

          {/* User & Suspension Status Summary */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-slate-300">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Account User Token:</span>
              <div className="flex items-center gap-1.5 font-mono text-white font-bold">
                <span>{activeSuspensionNotice.userToken}</span>
                <CopyUserIdButton userId={activeSuspensionNotice.userToken} iconOnly />
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Restricted Mode Duration:</span>
              <span className="font-bold text-rose-400">7 Consecutive Days</span>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span className="text-slate-400">Automated Re-activation Date:</span>
              <span className="font-bold text-amber-300 font-mono text-[11px]">
                {formattedExpiry}
              </span>
            </div>
          </div>

          {/* Protected Active Bookings vs Blocked Actions Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 space-y-1 text-[11px]">
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected &amp; Accessible</span>
              </span>
              <p className="text-slate-300 leading-snug">
                Existing <strong>Confirmed Bookings</strong> and <strong>E2E Encrypted Chat</strong> remain 100% active so ongoing paid outings are never disrupted.
              </p>
            </div>

            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 space-y-1 text-[11px]">
              <span className="font-bold text-rose-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Restricted for 7 Days</span>
              </span>
              <p className="text-slate-300 leading-snug">
                Submitting new booking requests, creating/editing companion cards, and accepting new bookings are blocked until hold expires.
              </p>
            </div>
          </div>

          {/* Legal / Policy Disclosure */}
          <div className="bg-slate-950/40 border border-slate-800/70 rounded-xl p-3.5 space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Strict Public Venue Mandate</span>
            </div>
            <p>
              Cirqlr is strictly a public platonic companionship marketplace. Hotels, lodges, OYO rooms, resorts, private villas, and apartments are legally forbidden under platform governance.
            </p>
          </div>

        </div>

        {/* Action Button Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLogOut}
            className="text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer order-2 sm:order-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out Session</span>
          </button>

          <button
            type="button"
            onClick={handleContinueRestricted}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
          >
            <span>I Understand — Continue in Restricted Mode</span>
          </button>
        </div>

      </div>
    </div>
  );
};

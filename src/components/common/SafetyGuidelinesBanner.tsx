import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export const SafetyGuidelinesBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4 border border-indigo-700/40 shadow-sm relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">
                Official Marketplace Safety Charter
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                100% Platonic
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed max-w-2xl">
              Cirqlr provides trusted companions for public recreational outings (cinema, art galleries, cafes, malls) across West Bengal & Odisha. Private residences and hotel visits are strictly prohibited.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors border border-white/10 shrink-0"
        >
          <span>{isExpanded ? 'Hide Safety Rules' : 'Review Allowed Venues'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-indigo-800/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-fadeIn">
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3.5">
            <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Strictly Permitted Public Outings</span>
            </div>
            <ul className="space-y-1.5 text-emerald-100/90 text-[11px]">
              <li className="flex items-center gap-1.5">• Registered Multiplexes & Cinema Halls (e.g., Inox, PVR, Cinepolis)</li>
              <li className="flex items-center gap-1.5">• Verified Public Cafes, Tea Rooms & Restaurants</li>
              <li className="flex items-center gap-1.5">• Reputable Shopping Malls (South City, Esplanade One, etc.)</li>
              <li className="flex items-center gap-1.5">• Public State Museums, Book Fairs & Cultural Halls</li>
            </ul>
          </div>

          <div className="bg-rose-950/40 border border-rose-800/40 rounded-xl p-3.5">
            <div className="flex items-center gap-2 font-semibold text-rose-300 mb-2">
              <XCircle className="w-4 h-4" />
              <span>Zero-Tolerance Violations (Immediate Ban)</span>
            </div>
            <ul className="space-y-1.5 text-rose-100/90 text-[11px]">
              <li className="flex items-center gap-1.5">• Private homes, apartments, guest houses or villas</li>
              <li className="flex items-center gap-1.5">• Hotel rooms or private resort suites</li>
              <li className="flex items-center gap-1.5">• Private vehicles or unauthorized remote drives</li>
              <li className="flex items-center gap-1.5">• Any romantic, dating, or physical intimacy solicitation</li>
            </ul>
          </div>

          <div className="md:col-span-2 bg-slate-800/60 rounded-lg p-2.5 text-[11px] text-slate-300 flex items-center gap-2 border border-slate-700/50">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Bookers pay Companions directly in cash or UPI upon meeting at the public venue. All outings are strictly platonic, public, and secure.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

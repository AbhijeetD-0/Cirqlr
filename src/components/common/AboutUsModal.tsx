import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import {
  X,
  ShieldCheck,
  Building2,
  HeartHandshake,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Users,
  Compass,
  Coffee,
  Film,
  ShoppingBag,
  Palette
} from 'lucide-react';

export const AboutUsModal: React.FC = () => {
  const { isAboutUsModalOpen, setIsAboutUsModalOpen } = useMarketplace();

  if (!isAboutUsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-2xl md:max-w-3xl overflow-hidden shadow-2xl border border-slate-800 text-slate-100 flex flex-col max-h-[90vh] m-2 sm:m-4">
        
        {/* Header */}
        <div className="bg-slate-950/90 text-white px-5 sm:px-7 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-900/40 border border-indigo-400/30">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                <span>About Cirqlr</span>
                <span className="text-[10px] bg-indigo-950/80 text-cyan-300 border border-indigo-700/60 px-2 py-0.5 rounded-full font-mono font-normal">
                  SUDARSAN HUB
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                India's 100% Platonic &amp; Government-ID Verified Social Outings Network
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAboutUsModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 text-slate-200">
          
          {/* Section 1: Our Mission */}
          <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-2.5 mb-3 text-cyan-400">
              <Sparkles className="w-5 h-5" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Our Mission</h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong>Cirqlr</strong> is India's premier 100% Platonic &amp; Government-ID Verified Social Outing and Activity Companionship Network. Whether exploring specialty cafes, movies at multiplexes, museums, shopping malls, or general festivals &amp; cultural walks, Cirqlr connects you with verified local company.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 text-slate-300 text-xs">
                <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Specialty Cafes</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 text-slate-300 text-xs">
                <Film className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Cinema / Multiplex</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 text-slate-300 text-xs">
                <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Shopping Malls</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 text-slate-300 text-xs">
                <Palette className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Festivals &amp; Walks</span>
              </div>
            </div>
          </div>

          {/* Section 2: 3 Pillars of Safety */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">3 Non-Negotiable Pillars of Safety</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Pillar 1 */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-2 hover:border-emerald-500/40 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h5 className="font-bold text-xs text-white">Strictly 21+ Verified Members</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every user must be at least 21 years old. Companion profiles require government-issued photo ID verification (Voter ID, Driving License, or PAN Card) before appearing on live public discovery.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-2 hover:border-cyan-500/40 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h5 className="font-bold text-xs text-white">100% Commercial Public Venues Only</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Zero private residences, hotel rooms, or secluded venues allowed under any circumstances. Outings occur solely inside verified public commercial locations such as registered cafes, malls, and theaters.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-2 hover:border-indigo-500/40 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h5 className="font-bold text-xs text-white">Zero Romance / Dating Policy</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cirqlr is strictly a platonic companionship network. Dating solicitation, romantic advances, or off-platform harassment trigger immediate permanent account suspension and ID blacklisting.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Empowering Companions */}
          <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Users className="w-5 h-5" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Empowering Verified Companions</h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Cirqlr empowers verified individuals to monetize their free time safely and transparently by offering curated activity packages. Companions retain 100% sovereignty over their schedules, select their preferred public venue categories, and receive transparent payments with complete peace of mind.
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transparent Hourly Pricing (Min ₹300/hr)</span>
              </span>
              <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>End-to-End In-App Encrypted Chat</span>
              </span>
              <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Private Information Leakage</span>
              </span>
            </div>
          </div>

          {/* Section 4: Company & Operational Hubs */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <Building2 className="w-5 h-5" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Company Information &amp; Hubs</h4>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Operating Entity:</span>
                <span className="font-bold text-white tracking-wide">SUDARSAN HUB</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Official Support Email:</span>
                <a href="mailto:cirqlr.support@gmail.com" className="text-cyan-400 hover:underline font-mono">
                  cirqlr.support@gmail.com
                </a>
              </div>
              <div className="pt-1">
                <span className="text-slate-400 block mb-1.5 font-semibold">Active Operational Hubs:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white text-xs block">West Bengal Public Hubs</span>
                      <span className="text-[11px] text-slate-400">Kolkata, Siliguri, Durgapur</span>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white text-xs block">Odisha Public Hubs</span>
                      <span className="text-[11px] text-slate-400">Bhubaneswar, Cuttack, Puri</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <HeartHandshake className="w-3.5 h-3.5 text-cyan-400" />
            <span>Curated Social Outings with Verified Peers</span>
          </span>

          <button
            type="button"
            onClick={() => setIsAboutUsModalOpen(false)}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};

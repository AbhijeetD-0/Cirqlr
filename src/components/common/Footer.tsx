import React, { useState, useEffect, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { CirqlrLogo } from './CirqlrLogo';
import { 
  ShieldCheck, 
  PhoneCall, 
  Building2, 
  Lock, 
  HeartHandshake,
  Instagram,
  Facebook
} from 'lucide-react';

interface FooterProps {
  onRequestFounderAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onRequestFounderAuth }) => {
  const { openLegalModal, openAboutUsModal, openFeedbackModal } = useMarketplace();
  const [clickCount, setClickCount] = useState<number>(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle secret 3-click trigger on "v3.0"
  const handleVersionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (nextCount >= 3) {
      setClickCount(0);
      onRequestFounderAuth();
    } else {
      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1800);
    }
  };

  // Keyboard shortcut: Alt + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        onRequestFounderAuth();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, [onRequestFounderAuth]);

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      {/* Safety Protocol Highlight Strip */}
      <div className="border-b border-slate-800 bg-slate-950/60 py-6 px-4">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-xs mb-1">
                Strictly Public Venues Only
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                All social outings must occur exclusively in approved, public commercial venues (multiplexes, registered cafes, shopping malls, galleries). Private residences and hotel visits are permanently prohibited.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-xs mb-1">
                Zero Romance & Dating Policy
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Cirqlr is strictly for platonic activity companionship (going to movies, art walks, food tasting, work cafe sessions). Any romantic solicitation violates platform terms and triggers immediate banning.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-xs mb-1">
                Regional Safety & Emergency Helplines
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                National SOS: <span className="text-slate-200 font-mono">112</span> • Kolkata Police: <span className="text-slate-200 font-mono">100</span> • WB Women Helpline: <span className="text-slate-200 font-mono">1090 / 181</span> • Odisha Helpline: <span className="text-slate-200 font-mono">181</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Details */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 font-medium">Official Launch Cities:</span>
            <span className="text-slate-400 text-[11px]">
              Kolkata, Siliguri, Durgapur (West Bengal) • Bhubaneswar, Cuttack, Puri (Odisha)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <Lock className="w-3 h-3 text-emerald-500" />
              Verified Government ID Escrow
            </span>
            <span className="text-slate-600">•</span>
            <span>Zero Platform Bypass Guarantee</span>
          </div>
        </div>

        {/* Quick Links & Social Media Icons Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
          {/* Essential Quick Links */}
          <nav className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-xs font-medium text-slate-400">
            <button 
              type="button"
              onClick={openAboutUsModal}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              About Us
            </button>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <button 
              type="button"
              onClick={openFeedbackModal}
              className="hover:text-cyan-400 text-slate-300 font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>💬</span>
              <span>Give Feedback</span>
            </button>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <a 
              href="mailto:cirqlr.support@gmail.com" 
              className="hover:text-indigo-400 transition-colors cursor-pointer"
              title="Official Platform Support: cirqlr.support@gmail.com"
            >
              Contact Us
            </a>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <button 
              type="button"
              onClick={() => openLegalModal('terms')}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
              title="View Terms & Conditions"
            >
              Terms & Conditions
            </button>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <button 
              type="button"
              onClick={() => openLegalModal('privacy')}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
              title="View Privacy Policy & ID Escrow"
            >
              Privacy Policy
            </button>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <button 
              type="button"
              onClick={() => openLegalModal('refund')}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
              title="View Cancellation & Refund Policy"
            >
              Refund Policy
            </button>
          </nav>

          {/* Social Media Icons */}
          <div className="flex items-center gap-2.5">
            <a
              href="https://www.instagram.com/cirqlr.app?srtk=MXMwN2xtYjlwMGx5bA=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Official Cirqlr Instagram"
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-pink-600/20 hover:text-pink-400 hover:border-pink-500/40 text-slate-400 flex items-center justify-center transition-all border border-slate-700/60 shadow-xs cursor-pointer"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.facebook.com/share/1C68AzJsQw/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Official Cirqlr Facebook"
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/40 text-slate-400 flex items-center justify-center transition-all border border-slate-700/60 shadow-xs cursor-pointer"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom copyright row with secret subtle version trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2.5 text-center sm:text-left flex-wrap justify-center sm:justify-start">
            <CirqlrLogo className="w-5 h-5 rounded-md shrink-0 shadow-xs" />
            <span className="text-slate-400 font-medium">© 2026 Cirqlr. Operated by SUDARSAN HUB. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700 mx-1">•</span>
            <span className="text-slate-500 block sm:inline">Strictly Platonic P2P Social Outings.</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Secret Founder Vault Trigger: click 3 times quickly */}
            <span
              onClick={handleVersionClick}
              title="Version Tag"
              className="cursor-pointer select-none text-slate-600 hover:text-slate-400 transition-colors font-mono text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              v3.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { Megaphone, Gift, X, Copy, Check, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';

export const AdminLiveBroadcastModal: React.FC = () => {
  const { activeLiveBroadcast, dismissLiveBroadcast, setActiveTab } = useMarketplace();
  const [copied, setCopied] = useState(false);

  if (!activeLiveBroadcast) return null;

  const handleCopyCoupon = () => {
    if (activeLiveBroadcast.couponCode) {
      navigator.clipboard.writeText(activeLiveBroadcast.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaim = () => {
    if (activeLiveBroadcast.couponCode) {
      navigator.clipboard.writeText(activeLiveBroadcast.couponCode);
    }
    dismissLiveBroadcast(activeLiveBroadcast.id);
    setActiveTab('explore');
  };

  const isPersonal = activeLiveBroadcast.target !== 'ALL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200">
        {/* Modal Top Banner */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${
          isPersonal
            ? 'bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/60 border-amber-900/60'
            : 'bg-gradient-to-r from-indigo-950/80 via-slate-950 to-cyan-950/60 border-indigo-900/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md ${
              isPersonal
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-indigo-500/20 border-indigo-500/40 text-cyan-300'
            }`}>
              {isPersonal ? <Gift className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border tracking-wider ${
                  isPersonal
                    ? 'bg-amber-950 text-amber-300 border-amber-700/80'
                    : 'bg-indigo-950 text-cyan-300 border-indigo-700/80'
                }`}>
                  {isPersonal ? 'Personal Exclusive Offer' : 'Platform Broadcast'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
                {activeLiveBroadcast.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismissLiveBroadcast(activeLiveBroadcast.id)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Dismiss notice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300 overflow-y-auto max-h-[70vh]">
          {/* Main Message */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-slate-200 leading-relaxed text-sm whitespace-pre-line">
            {activeLiveBroadcast.message}
          </div>

          {/* Optional Coupon Code Box */}
          {activeLiveBroadcast.couponCode && (
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950 p-4 rounded-2xl border border-indigo-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Promo / Discount Voucher Code</span>
                </span>
                {activeLiveBroadcast.expiryDate && (
                  <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{activeLiveBroadcast.expiryDate}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-indigo-900/80">
                <span className="font-mono text-base font-extrabold text-amber-300 tracking-wider">
                  {activeLiveBroadcast.couponCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCoupon}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Delivery Note */}
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>Sent by Cirqlr Platform Administration</span>
            <span className="font-mono text-[10px]">
              {new Date(activeLiveBroadcast.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => dismissLiveBroadcast(activeLiveBroadcast.id)}
            className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleClaim}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all ${
              isPersonal
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-950'
                : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-950'
            }`}
          >
            <span>{activeLiveBroadcast.couponCode ? 'Copy & Explore' : 'Got It, Thanks!'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

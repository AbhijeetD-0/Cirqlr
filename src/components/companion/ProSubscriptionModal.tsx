import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { X, Sparkles, CheckCircle2, Clock, Zap, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useRazorpayPayment } from '../../hooks/useRazorpayPayment';

interface ProSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProSubscriptionModal: React.FC<ProSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { platformSettings, currentUser, submitProSubscriptionPayment } = useMarketplace();
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { openCheckout, isLoading: isRazorpayLoading } = useRazorpayPayment();

  if (!isOpen || !currentUser) return null;

  const basePrice = platformSettings.proSubscriptionMonthlyPrice;
  const discountPercent = platformSettings.proOccasionDiscountPercent;
  const finalPrice = Math.round(basePrice * (1 - discountPercent / 100));

  const handleSubscribe = () => {
    setErrorMessage(null);

    openCheckout({
      amount: finalPrice,
      currency: 'INR',
      name: 'Cirqlr by SUDARSAN HUB',
      description: 'Companion Pro Subscription (30 Days)',
      prefill: {
        name: currentUser.fullName,
        email: currentUser.email,
        contact: currentUser.phoneNumber,
      },
      notes: {
        userToken: currentUser.userToken,
        plan: 'Companion Pro (1-Month Pass)',
      },
      onSuccess: (paymentId) => {
        const refId = submitProSubscriptionPayment(currentUser.userToken, paymentId);
        setSubmittedRefId(refId);
      },
      onError: (err) => {
        setErrorMessage(
          typeof err === 'string'
            ? err
            : 'Razorpay checkout cancelled or failed. Please retry.'
        );
      },
    });
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/40 text-slate-100 rounded-3xl w-full max-w-full sm:max-w-lg md:max-w-xl m-2 sm:m-4 md:m-6 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Glow */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Companion Pro Upgrade
              </h3>
              <span className="text-[10px] text-indigo-400 font-medium">
                1-Month Plan (30 Days Validity)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {submittedRefId ? (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">
                  Companion Pro Activated Instantly!
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                  Payment confirmed via Razorpay. Unlimited Activity Package Cards are now active immediately.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Razorpay Ref ID:</span>
                  <span className="font-mono font-bold text-emerald-400">{submittedRefId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Subscription Plan:</span>
                  <span className="font-bold text-white">Companion Pro (1-Month Pass)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Plan Validity:</span>
                  <span className="font-bold text-emerald-400">Active (30 Days Validity)</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-extrabold text-white text-sm">₹{finalPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status:</span>
                  <span className="bg-emerald-950 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                    VERIFIED &amp; ACTIVE
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleComplete}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Companion Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="text-center py-1">
                {discountPercent > 0 && (
                  <span className="inline-block bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 mb-2">
                    🎉 Festive Occasion Offer: {discountPercent}% OFF
                  </span>
                )}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-extrabold text-white">₹{finalPrice}</span>
                  {discountPercent > 0 && (
                    <span className="text-slate-400 text-sm line-through">₹{basePrice}</span>
                  )}
                  <span className="text-slate-300 text-xs font-semibold">/ 1 Month (30 Days)</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-indigo-300 mt-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Pass valid for exactly 30 days from approval date</span>
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Unlimited Custom Activity Package Cards</strong> for 30 days (no 3-card cap)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority placement in West Bengal & Odisha Explore searches</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Special "Companion Pro" verification badge on public profile</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Routed through Admin Hold Ledger with Razorpay reference verification</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center font-medium">
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                disabled={isRazorpayLoading}
                onClick={handleSubscribe}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRazorpayLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Opening Razorpay Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Pay & Subscribe with Razorpay (₹{finalPrice} / 30 Days)</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
          Strict production workflow: Verified by Founder before granting unlimited cards.
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { BookingRecord } from '../../types/marketplace';
import { X, CreditCard, Loader2, Wallet, CheckCircle2, Zap } from 'lucide-react';
import { useRazorpayPayment } from '../../hooks/useRazorpayPayment';
import { computeLiveBookingFee } from '../../utils/feeCalculator';

interface AcceptanceFeePaymentModalProps {
  booking: BookingRecord;
  onClose: () => void;
  onSubmitted: () => void;
}

export const AcceptanceFeePaymentModal: React.FC<AcceptanceFeePaymentModalProps> = ({
  booking,
  onClose,
  onSubmitted,
}) => {
  const { submitAcceptanceFeePayment, currentUser, bookings, platformSettings } = useMarketplace();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingFree, setIsProcessingFree] = useState<boolean>(false);

  // DUAL PAYMENT CHOICE FOR COMPANIONS:
  // Option 1: 'use_credit' (apply wallet balance first)
  // Option 2: 'save_credit' (keep wallet credit untouched and pay full fee via Razorpay)
  const [paymentMode, setPaymentMode] = useState<'use_credit' | 'save_credit'>('use_credit');

  const { openCheckout, isLoading: isRazorpayLoading } = useRazorpayPayment();

  // 1. NEVER READ STALE SAVED FEE NUMBERS FROM BOOKING OBJECTS:
  // Compute strictly live on render using the pure helper function
  const liveFee = computeLiveBookingFee(booking, bookings, currentUser, platformSettings);
  const finalPlatformFee = liveFee.finalPlatformFee;
  const cancellationCreditBalance = currentUser?.cancellationCreditBalance || 0;

  // Wallet deduction calculations when 'use_credit' is chosen
  const walletDeduction = Math.min(cancellationCreditBalance, finalPlatformFee);
  const netPayableFee = Math.max(0, finalPlatformFee - cancellationCreditBalance);
  const remainingWalletBalance = Math.max(0, cancellationCreditBalance - finalPlatformFee);
  const isFullCreditCoverage = netPayableFee === 0 && walletDeduction > 0;

  // Active amounts based on selected payment mode:
  const isUsingCredit = paymentMode === 'use_credit' && cancellationCreditBalance > 0;
  const activeCreditDeduction = isUsingCredit ? walletDeduction : 0;
  const activeNetPayable = isUsingCredit ? netPayableFee : finalPlatformFee;
  const activeRemainingWallet = isUsingCredit ? remainingWalletBalance : cancellationCreditBalance;

  // SCENARIO 1: 100% Free Acceptance using Credit Wallet (₹0 Gateway Payment)
  const handleAcceptFreeWithCredit = () => {
    setErrorMessage(null);
    setIsProcessingFree(true);

    try {
      const creditTxnId = `wlt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      submitAcceptanceFeePayment(booking.id, creditTxnId, activeCreditDeduction);
      setTimeout(() => {
        setIsProcessingFree(false);
        onSubmitted();
      }, 700);
    } catch {
      setIsProcessingFree(false);
      setErrorMessage('Could not apply fee credit. Please try again.');
    }
  };

  // SCENARIO 2 & 3: Pay via Razorpay Secure Gateway (partial difference or full fee)
  const handlePayViaRazorpay = () => {
    setErrorMessage(null);
    const amountToCharge = activeNetPayable;
    const creditUsed = activeCreditDeduction;

    openCheckout({
      amount: amountToCharge,
      currency: 'INR',
      name: 'Cirqlr by SUDARSAN HUB',
      description: `Acceptance Fee: Booking ${booking.bookingToken}${creditUsed > 0 ? ` (₹${creditUsed} Credit Applied)` : ''}`,
      prefill: {
        name: currentUser?.fullName || '',
        email: currentUser?.email || '',
        contact: currentUser?.phoneNumber || '',
      },
      notes: {
        bookingToken: booking.bookingToken,
        bookingId: booking.id,
        paymentMode,
        creditAppliedRupees: String(creditUsed),
        netPayableRupees: String(amountToCharge),
      },
      onSuccess: (paymentId, response) => {
        const finalPaymentId = response?.razorpay_payment_id || paymentId;
        submitAcceptanceFeePayment(booking.id, finalPaymentId, creditUsed);
        onSubmitted();
      },
      onError: (err) => {
        setErrorMessage(
          typeof err === 'string'
            ? err
            : 'Razorpay checkout was cancelled or could not be completed.'
        );
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-lg md:max-w-xl m-2 sm:m-4 md:m-6 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-750 text-white">
        {/* Header */}
        <div className="bg-slate-950/90 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Platform Acceptance Fee Payment
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Booking Ref: {booking.bookingToken}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 bg-slate-900/90 text-white">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-white">
            <div className="flex justify-between text-slate-400">
              <span>Booker Name:</span>
              <span className="font-bold text-white">{booking.bookerName}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Selected Activity:</span>
              <span className="font-semibold text-white">{booking.activityTitle}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Outing Schedule:</span>
              <span className="text-slate-200">{booking.outingDate} ({booking.hours} hrs)</span>
            </div>
            <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
              <span>Gross Outing Value (Collected from Booker in person):</span>
              <span className="font-bold text-white">₹{booking.totalOutingCost}</span>
            </div>

            {/* Platform Fee Row */}
            <div className="flex justify-between items-center text-slate-300">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>Platform Acceptance Fee ({liveFee.effectiveFeePercent}%):</span>
                {liveFee.discountApplied === 'Referral Credit (5%)' && (
                  <span className="text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/60 px-1.5 py-0.2 rounded-full">
                    🎁 5% Referral Credit
                  </span>
                )}
              </div>
              <span className="font-semibold text-xs text-slate-200 font-mono">₹{finalPlatformFee}</span>
            </div>

            {/* Credit Wallet Deduction Row (if using credit) */}
            {isUsingCredit && activeCreditDeduction > 0 && (
              <div className="flex justify-between items-center text-emerald-400 border-t border-slate-800/80 pt-2 font-medium">
                <span className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Fee Credit Applied (Wallet Balance: ₹{cancellationCreditBalance}):</span>
                </span>
                <span className="font-mono font-bold">-₹{activeCreditDeduction}</span>
              </div>
            )}

            {/* Save Wallet Notice Row (if saving credit) */}
            {!isUsingCredit && cancellationCreditBalance > 0 && (
              <div className="flex justify-between items-center text-cyan-400 border-t border-slate-800/80 pt-2 text-[11px]">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Wallet Balance Saved for Later:</span>
                </span>
                <span className="font-mono font-bold">₹{cancellationCreditBalance} (Untouched)</span>
              </div>
            )}

            {/* Remaining Wallet Balance Row */}
            {cancellationCreditBalance > 0 && (
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Remaining Wallet Balance After Acceptance:</span>
                <span className="font-mono font-semibold text-slate-300">₹{activeRemainingWallet}</span>
              </div>
            )}

            {/* Net Payable Row */}
            <div className="flex justify-between items-center border-t border-slate-800 pt-2.5 text-cyan-300">
              <span className="font-bold text-xs uppercase tracking-wide">
                Net Payable Acceptance Fee:
              </span>
              <span className="font-black text-base text-cyan-300 font-mono">
                ₹{activeNetPayable}
              </span>
            </div>
          </div>

          {/* DUAL PAYMENT CHOICE CONTROLS (IF COMPANION HAS WALLET BALANCE > 0) */}
          {cancellationCreditBalance > 0 && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-200 block">
                Choose Payment Mode:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Use Wallet Credit */}
                <button
                  type="button"
                  onClick={() => setPaymentMode('use_credit')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMode === 'use_credit'
                      ? 'bg-emerald-950/70 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Use Wallet Credit</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-emerald-900/60 text-emerald-300 rounded border border-emerald-700">
                      Avail: ₹{cancellationCreditBalance}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                    {isFullCreditCoverage
                      ? `Deducts ₹${walletDeduction} credit. Net Payable: ₹0 (Instant confirmation).`
                      : `Deducts ₹${walletDeduction} credit. Pay remaining ₹${netPayableFee} via Razorpay.`}
                  </p>
                </button>

                {/* Option 2: Save Wallet Credit for Later */}
                <button
                  type="button"
                  onClick={() => setPaymentMode('save_credit')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMode === 'save_credit'
                      ? 'bg-cyan-950/70 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Save Credit for Later</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-cyan-900/60 text-cyan-300 rounded border border-cyan-700">
                      Pay ₹{finalPlatformFee}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                    Keeps full ₹{cancellationCreditBalance} untouched in wallet. Pay ₹{finalPlatformFee} fee via Razorpay.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Instant confirmation notice */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <CreditCard className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>Instant Confirmation &amp; Sealed E2E Chat Activation</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Upon acceptance, your outing is immediately marked as <strong>Confirmed</strong>, encrypted chat unlocks instantly, and a confirmed HTML receipt is automatically dispatched to {booking.bookerName}'s Gmail.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-semibold text-center animate-fadeIn">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {isUsingCredit && isFullCreditCoverage ? (
              <button
                type="button"
                onClick={handleAcceptFreeWithCredit}
                disabled={isProcessingFree}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingFree ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Confirming Outing using Fee Credit...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>✓ Accept Free using ₹{walletDeduction} Credit (₹0 Payable)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePayViaRazorpay}
                disabled={isRazorpayLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRazorpayLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Opening Razorpay Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isUsingCredit && activeCreditDeduction > 0
                        ? `Pay Remaining ₹${activeNetPayable} via Razorpay (₹${activeCreditDeduction} Credit Applied)`
                        : cancellationCreditBalance > 0
                        ? `Pay Full Fee (₹${finalPlatformFee}) via Razorpay (Keep ₹${cancellationCreditBalance} in Wallet)`
                        : `Pay Fee via Razorpay (₹${finalPlatformFee})`}
                    </span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isRazorpayLoading || isProcessingFree}
              className="w-full py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center block"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

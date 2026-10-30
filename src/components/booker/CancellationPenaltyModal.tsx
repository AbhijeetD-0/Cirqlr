import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { BookingRecord } from '../../types/marketplace';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Loader2
} from 'lucide-react';
import { useRazorpayPayment } from '../../hooks/useRazorpayPayment';
import { Calendar } from 'lucide-react';

interface CancellationPenaltyModalProps {
  booking: BookingRecord;
  onClose: () => void;
  onCancelledSuccess: () => void;
  onOpenReschedule?: () => void;
}

const CANCELLATION_REASONS = [
  'Personal Emergency / Urgent Schedule Conflict',
  'Change of Travel or Outing Plans',
  'Selected Wrong Public Venue / Date / Time',
  'Unable to Reach Outing Location',
  'Mutual Agreement with Companion to Postpone',
  'Other Personal Reasons'
];

export const CancellationPenaltyModal: React.FC<CancellationPenaltyModalProps> = ({
  booking,
  onClose,
  onCancelledSuccess,
  onOpenReschedule,
}) => {
  const { cancelBookingByBooker, currentUser } = useMarketplace();

  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [razorpayRefId, setRazorpayRefId] = useState<string>(
    () => `pay_CANCEL_${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { openCheckout, isLoading: isRazorpayLoading } = useRazorpayPayment();

  const handlePayPenaltyAndCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    setErrorMessage(null);

    const fullReason = customNotes.trim()
      ? `${selectedReason}: ${customNotes.trim()}`
      : selectedReason;

    openCheckout({
      amount: 20,
      currency: 'INR',
      name: 'Cirqlr by SUDARSAN HUB',
      description: `Cancellation Penalty Fee - Booking ${booking.bookingToken}`,
      prefill: {
        name: currentUser?.fullName || '',
        email: currentUser?.email || '',
        contact: currentUser?.phoneNumber || '',
      },
      notes: {
        bookingToken: booking.bookingToken,
        reason: fullReason,
      },
      onSuccess: (paymentId) => {
        setRazorpayRefId(paymentId);
        cancelBookingByBooker(booking.id, fullReason, paymentId);
        setIsSuccess(true);
        setTimeout(() => {
          onCancelledSuccess();
        }, 1200);
      },
      onError: (err) => {
        setErrorMessage(
          typeof err === 'string'
            ? err
            : 'Payment was cancelled or could not be completed.'
        );
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-rose-900/50 flex flex-col m-2 sm:m-4 md:m-6 text-white">
        {/* Header */}
        <div className="bg-slate-950/90 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Booker Cancellation &amp; Penalty
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Booking Ref: {booking.bookingToken} • {booking.companionName}
              </span>
            </div>
          </div>
          {!isRazorpayLoading && !isSuccess && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4 bg-slate-900/90 text-white">
            <div className="w-14 h-14 bg-emerald-950/80 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-700/60 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Booking Cancelled Successfully
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                ₹20 Platform Cancellation Fee recorded (<span className="font-mono text-cyan-400 font-semibold">{razorpayRefId}</span>). 
                The E2E chat has been terminated and the Companion's acceptance fee refund has been queued.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePayPenaltyAndCancel} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-slate-900/90 text-white">
            {/* Warning Banner */}
            <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200 leading-relaxed">
                <span className="font-bold block text-white">
                  Strict Cancellation Policy
                </span>
                Cancelling a confirmed booking requires payment of a strict 
                <span className="font-extrabold text-rose-300"> ₹20 Platform Penalty Fee</span>. 
                Once cancelled, the E2E encrypted chat channel will be immediately closed and locked.
              </div>
            </div>

            {/* Outing Context Summary */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1 text-white">
              <div className="flex justify-between text-slate-400">
                <span>Companion:</span>
                <span className="font-bold text-white">{booking.companionName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Activity:</span>
                <span className="font-semibold text-slate-200">{booking.activityTitle}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Scheduled For:</span>
                <span className="text-slate-200">{booking.outingDate} at {booking.outingTime}</span>
              </div>
            </div>

            {/* Reason Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                Select Cancellation Reason <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-all font-medium cursor-pointer"
              >
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional notes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Additional Details (Optional)
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Briefly state reason for the Founder review ledger..."
                rows={2}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-all resize-none"
              />
            </div>

            {/* Free Reschedule Alternative Option */}
            {onOpenReschedule && (
              <div className="p-3.5 bg-cyan-950/70 border border-cyan-700/80 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-cyan-300 text-xs block">
                      Need to Change Date or Time? Rescheduling is 100% Free!
                    </span>
                    <p className="text-[11px] text-cyan-100/90 mt-0.5 leading-relaxed">
                      You can move this outing to a new date or time with zero cancellation penalties and keep your confirmed companion.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenReschedule}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>🗓️ Reschedule Outing Instead (100% Free)</span>
                </button>
              </div>
            )}

            {/* Razorpay Simulation Box */}
            <div className="bg-slate-950/90 rounded-xl p-4 text-white space-y-3 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold">Razorpay Simulated Gateway</span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-400/30">
                  Live Test Mode
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Cancellation Penalty Due
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-400">
                    ₹20.00
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Transaction Reference</span>
                  <span className="text-[11px] font-mono text-indigo-300 font-semibold">
                    {razorpayRefId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  Booking CANNOT be cancelled without paying this mandatory ₹20 fee.
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs text-center font-medium animate-fadeIn">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isRazorpayLoading}
                className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Keep Booking Active
              </button>
              <button
                type="submit"
                disabled={isRazorpayLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isRazorpayLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Opening Razorpay...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹20 via Razorpay &amp; Cancel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

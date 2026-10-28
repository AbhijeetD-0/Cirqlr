import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { BookingRecord } from '../../types/marketplace';
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Wallet, 
  CheckCircle2, 
  Building2, 
  Sparkles,
  AlertOctagon
} from 'lucide-react';
import { getTimeUntilOutingHours, formatTimeRemainingText, getCurrentCalendarMonth } from '../../utils/dateUtils';
import { computeLiveBookingFee } from '../../utils/feeCalculator';

interface CompanionCancellationModalProps {
  booking: BookingRecord;
  onClose: () => void;
  onOpenReschedule: () => void;
  onCancelledSuccess?: () => void;
}

export const CompanionCancellationModal: React.FC<CompanionCancellationModalProps> = ({
  booking,
  onClose,
  onOpenReschedule,
  onCancelledSuccess,
}) => {
  const { cancelBookingByCompanionWithLifeline, currentUser, bookings, platformSettings } = useMarketplace();

  const [reason, setReason] = useState<string>('Personal Emergency / Schedule Conflict');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [cancellationResult, setCancellationResult] = useState<{ eligibleForCredit: boolean; creditedAmount: number } | null>(null);

  const liveFee = computeLiveBookingFee(booking, bookings, currentUser, platformSettings);
  const feeAmount = liveFee.finalPlatformFee;
  const currentMonth = getCurrentCalendarMonth();
  const lifelinesUsedThisMonth = currentUser?.monthlyLifelineMonth === currentMonth
    ? currentUser?.monthlyLifelineUsed || 0
    : 0;
  const hasLifelineAvailable = lifelinesUsedThisMonth < 1;

  const hoursUntilOuting = getTimeUntilOutingHours(booking.outingDate, booking.outingTime);
  const isMoreThan3Hours = hoursUntilOuting > 3;
  const isEligibleForLifeline = isMoreThan3Hours && hasLifelineAvailable;

  const handleConfirmCancellation = () => {
    const fullReason = customNotes.trim() ? `${reason}: ${customNotes.trim()}` : reason;
    const res = cancelBookingByCompanionWithLifeline(booking.id, fullReason);
    setCancellationResult(res);
    setIsCancelled(true);
    setTimeout(() => {
      if (onCancelledSuccess) onCancelledSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-lg md:max-w-xl m-2 sm:m-4 overflow-hidden shadow-2xl border border-slate-750 flex flex-col text-white">
        {/* Header */}
        <div className="bg-slate-950/90 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isEligibleForLifeline 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Companion Cancellation Policy &amp; Lifeline Review
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Booking: {booking.bookingToken} • {booking.bookerName}
              </span>
            </div>
          </div>
          {!isCancelled && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        {isCancelled ? (
          <div className="p-8 text-center space-y-4 bg-slate-900/90 text-white animate-fadeIn">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border shadow-inner ${
              cancellationResult?.eligibleForCredit
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
                : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
            }`}>
              {cancellationResult?.eligibleForCredit ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <AlertOctagon className="w-8 h-8" />
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {cancellationResult?.eligibleForCredit
                  ? 'Booking Cancelled — Emergency Lifeline Credited!'
                  : 'Booking Cancelled (Platform Fee Forfeited)'}
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                {cancellationResult?.eligibleForCredit ? (
                  <>
                    Your 1/1 Monthly Emergency Lifeline was applied. <strong>₹{cancellationResult.creditedAmount}</strong> has been safely deposited into your <strong>Fee Credit Wallet</strong> for your next booking acceptance!
                  </>
                ) : (
                  <>
                    The booking is cancelled and chat is locked. As notice was under 3 hours or your monthly lifeline was exhausted, the ₹{feeAmount} acceptance fee was forfeited.
                  </>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh] text-xs">
            {/* STEP 1: FREE RESCHEDULE SUGGESTION BANNER */}
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/80 border border-indigo-700/60 rounded-2xl p-4 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Have a Timing or Schedule Conflict?</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600/60 px-2 py-0.5 rounded-full font-bold">
                  100% Free
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You can freely reschedule the meetup date and time with {booking.bookerName} at zero cost. No fees, no lifeline usage, and your confirmed booking stays active.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReschedule();
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-950/50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>🗓️ Reschedule Date &amp; Time Instead (Free)</span>
              </button>
            </div>

            {/* Outing Context Summary */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Booker:</span>
                <span className="font-semibold text-white">{booking.bookerName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Activity &amp; Venue:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                  {booking.activityTitle} • {booking.venueName}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Scheduled Time:</span>
                <span className="font-bold text-white">
                  {booking.outingDate} at {booking.outingTime}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px] border-t border-slate-800 pt-1.5">
                <span>Time Until Outing:</span>
                <span className={`font-mono font-bold ${
                  isMoreThan3Hours ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatTimeRemainingText(hoursUntilOuting)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Paid Acceptance Fee:</span>
                <span className="font-bold text-cyan-400 font-mono">₹{feeAmount}</span>
              </div>
            </div>

            {/* STEP 2: EMERGENCY LIFELINE ELIGIBILITY REVIEW */}
            {isEligibleForLifeline ? (
              <div className="bg-emerald-950/50 border border-emerald-700/70 rounded-2xl p-4 space-y-2 text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✓ 1/1 Monthly Emergency Lifeline Eligible</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-200/90">
                  You are giving <strong>more than 3 hours notice</strong> ({formatTimeRemainingText(hoursUntilOuting)} remaining) and have your <strong>1/1 Monthly Emergency Lifeline</strong> available.
                </p>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Refund to Fee Credit Wallet:</span>
                  </span>
                  <span className="font-extrabold text-cyan-400 font-mono">
                    +₹{feeAmount} (100% Refunded)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Note: Using this will exhaust your 1 emergency cancellation for {currentMonth}. Subsequent cancellations this month will forfeit the acceptance fee.
                </p>
              </div>
            ) : (
              <div className="bg-rose-950/60 border border-rose-800 rounded-2xl p-4 space-y-2 text-rose-200">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>⚠️ Non-Refundable Cancellation Warning</span>
                </div>
                <div className="text-[11px] leading-relaxed text-rose-200/90 space-y-1">
                  {!isMoreThan3Hours && (
                    <p>
                      • <strong>Less than 3 hours remaining:</strong> The outing is scheduled in {formatTimeRemainingText(hoursUntilOuting)}. Emergency lifelines are only available when cancelling &gt;3 hours prior to meetup.
                    </p>
                  )}
                  {!hasLifelineAvailable && (
                    <p>
                      • <strong>Monthly lifeline exhausted:</strong> You have already used your 1/1 emergency cancellation for {currentMonth}.
                    </p>
                  )}
                  <p className="font-semibold text-rose-300 pt-1">
                    Cancelling now will strictly forfeit your ₹{feeAmount} Platform Acceptance Fee. 0 credit will be returned.
                  </p>
                </div>
              </div>
            )}

            {/* Reason selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">
                Cancellation Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="Personal Emergency / Schedule Conflict">Personal Emergency / Schedule Conflict</option>
                <option value="Health / Medical Issue">Health / Medical Issue</option>
                <option value="Severe Weather or Transport Delay">Severe Weather or Transport Delay</option>
                <option value="Mutual Agreement with Booker to Cancel">Mutual Agreement with Booker to Cancel</option>
                <option value="Other Unforeseen Reason">Other Unforeseen Reason</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">
                Additional Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Brief reason for cancellation record"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                maxLength={100}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Keep Outing Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  isEligibleForLifeline
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-950/40'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-950/40'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {isEligibleForLifeline
                    ? `Use Lifeline & Credit ₹${feeAmount}`
                    : `Forfeit ₹${feeAmount} & Cancel`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

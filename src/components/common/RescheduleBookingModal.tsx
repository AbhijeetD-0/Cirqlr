import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { BookingRecord } from '../../types/marketplace';
import { 
  X, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Building2,
  CalendarCheck
} from 'lucide-react';

interface RescheduleBookingModalProps {
  booking: BookingRecord;
  onClose: () => void;
  onRescheduled?: () => void;
  onRescheduledSuccess?: () => void;
}

export const RescheduleBookingModal: React.FC<RescheduleBookingModalProps> = ({
  booking,
  onClose,
  onRescheduled,
  onRescheduledSuccess,
}) => {
  const { rescheduleBooking } = useMarketplace();

  const [newDate, setNewDate] = useState<string>(booking.outingDate || '');
  const [newTime, setNewTime] = useState<string>(booking.outingTime || '11:00 AM');
  const [note, setNote] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate.trim()) {
      setError('Please select a valid new date for the outing.');
      return;
    }
    if (!newTime.trim()) {
      setError('Please select a valid new time for the outing.');
      return;
    }
    if (newDate === booking.outingDate && newTime === booking.outingTime) {
      setError('Please select a different date or time to reschedule.');
      return;
    }

    const success = rescheduleBooking(booking.id, newDate.trim(), newTime.trim(), note.trim());
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        if (onRescheduled) onRescheduled();
        if (onRescheduledSuccess) onRescheduledSuccess();
        onClose();
      }, 1500);
    } else {
      setError('Failed to reschedule outing. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-md md:max-w-lg m-2 sm:m-4 overflow-hidden shadow-2xl border border-cyan-800/60 flex flex-col text-white">
        {/* Header */}
        <div className="bg-slate-950/90 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Free Date &amp; Time Reschedule
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Booking: {booking.bookingToken}
              </span>
            </div>
          </div>
          {!isSuccess && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4 bg-slate-900/90 text-white animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-950/80 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-700/60 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Outing Rescheduled Successfully!
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                Updated to <strong className="text-cyan-300">{newDate} at {newTime}</strong>. 
                Both you and your outing partner have been notified in encrypted chat. 
                Zero additional fees charged.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh] text-xs">
            {/* 100% Free Guarantee Banner */}
            <div className="bg-gradient-to-r from-cyan-950/60 via-indigo-950/60 to-emerald-950/60 border border-cyan-700/50 rounded-2xl p-3.5 space-y-1 shadow-sm">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>100% Free Rescheduling (Zero Extra Platform Fee)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Genuine schedule conflicts shouldn't force cancellations. You can freely update your meetup date and time without forfeiting fees or deducting emergency lifelines.
              </p>
            </div>

            {/* Current Schedule Summary */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Outing Activity:</span>
                <span className="font-semibold text-white">{booking.activityTitle}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Public Venue:</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-400" />
                  <span>{booking.venueName}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px] border-t border-slate-800/80 pt-1.5">
                <span>Current Schedule:</span>
                <span className="font-bold text-amber-300">
                  {booking.outingDate} at {booking.outingTime}
                </span>
              </div>
            </div>

            {/* New Date and Time inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>New Outing Date <span className="text-cyan-400">*</span></span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>New Outing Time <span className="text-cyan-400">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 03:00 PM or 15:00"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>
            </div>

            {/* Note input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">
                Reason / Note for Partner (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Rescheduling by 1 hour due to traffic / office work"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={120}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-semibold rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Keep Current Time
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-900/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Free Reschedule</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Send, 
  Building2, 
  Calendar, 
  Clock 
} from 'lucide-react';
import { BookingRecord } from '../../types/marketplace';

export interface TwoWayReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRecord;
  targetRole: 'companion' | 'booker';
  targetName: string;
  targetToken: string;
  targetAvatarUrl?: string;
  onSubmitRating: (bookingId: string, rating: number, review: string) => void;
}

export const TwoWayReviewModal: React.FC<TwoWayReviewModalProps> = ({
  isOpen,
  onClose,
  booking,
  targetRole,
  targetName,
  targetToken,
  targetAvatarUrl,
  onSubmitRating,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const effectiveRating = hoverRating || rating;

  const getStarLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return '1/5 • Poor Experience';
      case 2:
        return '2/5 • Below Expectations';
      case 3:
        return '3/5 • Satisfactory & Polite';
      case 4:
        return '4/5 • Very Good & Engaging';
      case 5:
        return '5/5 • Exceptional & Highly Professional';
      default:
        return 'Select a Star Rating';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitRating(booking.id, rating, reviewText.trim());
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  const isRatingCompanion = targetRole === 'companion';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-xl md:max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-750 flex flex-col m-2 sm:m-4 md:m-6 text-white">
        {/* Modal Header */}
        <div className="bg-slate-950/90 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{isRatingCompanion ? 'Rate Companion' : 'Rate Booker'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Completed Outing
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Official Post-Outing Feedback &amp; Reputation Score
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Profile Summary Strip */}
        <div className="bg-slate-950/70 px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {targetAvatarUrl ? (
                <img
                  src={targetAvatarUrl}
                  alt={targetName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {targetName || 'User'}
                </span>
                <span className="font-mono text-[10px] text-slate-300 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded">
                  {targetToken}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {isRatingCompanion ? 'Verified Companion' : 'Verified Booker'}
              </span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400 hidden sm:block">
            <span className="font-semibold text-slate-200 block truncate max-w-[160px]">
              {booking.activityTitle}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {booking.bookingToken}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 bg-slate-900/90 text-white">
          {/* Outing Context */}
          <div className="bg-indigo-950/60 border border-indigo-700/60 rounded-xl p-3 text-xs text-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-medium truncate text-white">{booking.venueName}</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300 shrink-0 font-medium text-[11px]">
              <span>{booking.outingDate}</span>
              <span>•</span>
              <span>{booking.outingTime}</span>
            </div>
          </div>

          {/* Star Selection Area */}
          <div className="text-center space-y-2 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              {isRatingCompanion ? 'How was your outing experience?' : 'How was the Booker’s conduct & etiquette?'}
            </span>
            
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      s <= effectiveRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="inline-block bg-amber-950/80 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-700/60">
              {getStarLabel(effectiveRating)}
            </div>
          </div>

          {/* Text Review Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Feedback &amp; Review Comments (Optional)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {isRatingCompanion ? 'Punctuality, conversation, vibe' : 'Respectfulness, venue etiquette'}
              </span>
            </label>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={
                isRatingCompanion
                  ? "Describe your experience with this companion. Did they adhere to public venue guidelines? Were they engaging and polite?"
                  : "How was the Booker during the outing? Were they respectful, on time, and adhering to platonic public venue etiquette?"
              }
              className="w-full text-xs p-3 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none text-white placeholder:text-slate-400 bg-slate-950/80"
            />
          </div>

          {/* Trust & Safety Banner */}
          <div className="flex items-start gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Two-Way ratings build trust on Cirqlr. This rating immediately recalculates {targetName}’s public star rating and permanent dossier reputation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating < 1}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Verified Rating'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

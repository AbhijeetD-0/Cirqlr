import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { FeedbackCategory } from '../../types/marketplace';
import {
  X,
  MessageSquare,
  Star,
  CheckCircle2,
  Sparkles,
  Bug,
  ThumbsUp,
  Lightbulb,
  Send,
  Loader2
} from 'lucide-react';

export const FeedbackModal: React.FC = () => {
  const { isFeedbackModalOpen, setIsFeedbackModalOpen, submitFeedback, currentUser } = useMarketplace();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>('Feature Suggestion');
  const [message, setMessage] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isFeedbackModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!message.trim()) {
      setErrorMsg('Please enter your feedback message.');
      return;
    }

    if (message.trim().length < 10) {
      setErrorMsg('Please write at least 10 characters so our team can understand your feedback.');
      return;
    }

    setIsSubmitting(true);

    const userToken = currentUser?.userToken || 'GUEST-' + Math.floor(1000 + Math.random() * 9000);
    const userName = currentUser?.fullName || 'Platform Visitor';
    const userEmail = currentUser?.email || guestEmail.trim() || undefined;

    setTimeout(() => {
      submitFeedback({
        userToken,
        userName,
        userEmail,
        rating,
        category,
        message: message.trim(),
      });

      setIsSubmitting(false);
      setSuccessToast(true);

      setTimeout(() => {
        setSuccessToast(false);
        setMessage('');
        setIsFeedbackModalOpen(false);
      }, 1500);
    }, 400);
  };

  const categories: Array<{ id: FeedbackCategory; label: string; icon: React.ReactNode; color: string }> = [
    {
      id: 'Feature Suggestion',
      label: 'Feature Suggestion',
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      color: 'hover:border-purple-500/60 focus:border-purple-500',
    },
    {
      id: 'Bug / Issue Report',
      label: 'Bug / Issue Report',
      icon: <Bug className="w-3.5 h-3.5" />,
      color: 'hover:border-rose-500/60 focus:border-rose-500',
    },
    {
      id: 'General Appreciation',
      label: 'General Appreciation',
      icon: <ThumbsUp className="w-3.5 h-3.5" />,
      color: 'hover:border-emerald-500/60 focus:border-emerald-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-lg md:max-w-xl overflow-hidden shadow-2xl border border-slate-800 text-slate-100 flex flex-col max-h-[92vh] m-2 sm:m-4">
        
        {/* Header */}
        <div className="bg-slate-950/90 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/40 border border-cyan-400/30">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                <span>Share Your Feedback</span>
              </h3>
              <p className="text-xs text-slate-400">
                Help us refine Cirqlr's safety and companion experience
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close feedback modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {successToast ? (
            <div className="py-12 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Your thoughts have been logged in the founder audit center to help us keep improving Cirqlr.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Star Rating Section */}
              <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 text-center space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  How was your platform experience?
                </label>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = hoverRating ? star <= hoverRating : star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 rounded-xl hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                        aria-label={`Rate ${star} star`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            active
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-amber-300 font-semibold">
                  {rating === 5 && '⭐⭐⭐⭐⭐ Exceptional (5 / 5)'}
                  {rating === 4 && '⭐⭐⭐⭐ Very Good (4 / 5)'}
                  {rating === 3 && '⭐⭐⭐ Average (3 / 5)'}
                  {rating === 2 && '⭐⭐ Needs Improvement (2 / 5)'}
                  {rating === 1 && '⭐ Poor Experience (1 / 5)'}
                </div>
              </div>

              {/* Feedback Category Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Feedback Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600/40 to-cyan-600/40 border-cyan-400 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className={isSelected ? 'text-cyan-400' : 'text-slate-500'}>
                          {cat.icon}
                        </span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="feedback-message" className="text-xs font-bold text-slate-300">
                    Your Thoughts or Suggestions
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {message.length} characters
                  </span>
                </div>
                <textarea
                  id="feedback-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === 'Feature Suggestion'
                      ? 'What feature, tool, or venue category would you like us to add next?'
                      : category === 'Bug / Issue Report'
                      ? 'Please describe what went wrong or which screen needs fixing...'
                      : 'Share your experience, shout out a great companion, or tell us what you love!'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none transition-colors"
                  required
                />
              </div>

              {/* Guest / User Info */}
              {currentUser ? (
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Submitting as:</span>
                  <span className="font-semibold text-slate-200">
                    {currentUser.fullName} ({currentUser.userToken})
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Your Gmail / Email (Optional, if you'd like a follow-up)
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-semibold animate-fadeIn">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};

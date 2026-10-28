import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMarketplace } from '../../context/MarketplaceContext';
import { 
  CalendarCheck, 
  Clock, 
  MapPin, 
  Lock, 
  MessageSquare, 
  ShieldAlert, 
  CheckCircle2, 
  Building2,
  Calendar,
  Star,
  CheckCheck,
  Send,
  Sparkles,
  AlertOctagon,
  Heart,
  Eye,
  Compass,
  User,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { BookingRecord, UserProfile } from '../../types/marketplace';
import { CancellationPenaltyModal } from './CancellationPenaltyModal';
import { TwoWayReviewModal } from '../common/TwoWayReviewModal';
import { ChatModal } from '../common/ChatModal';
import { PublicProfileModal } from './PublicProfileModal';
import { BookingRequestModal } from './BookingRequestModal';
import { CopyUserIdButton } from '../common/CopyUserIdButton';
import { RescheduleBookingModal } from '../common/RescheduleBookingModal';
import { computeLiveBookingFee } from '../../utils/feeCalculator';

export const MyBookingsView: React.FC = () => {
  const { 
    bookings, 
    currentUser, 
    platformSettings,
    usersAndCompanions,
    savedCompanionTokens,
    toggleSaveCompanion,
    setActiveChatBookingId, 
    setActiveReportUserToken,
    submitBookingRating,
    cancelBooking,
    cancelBookingByBookerWithCredit,
    getUserByToken,
    openAuthModal,
    openSuspensionNotice,
    setActiveTab: setAppActiveTab
  } = useMarketplace();

  // Active section toggle: 'bookings' | 'saved'
  const [viewSection, setViewSection] = useState<'bookings' | 'saved'>('bookings');

  // Selected companion for profile modal
  const [selectedCompanionForProfile, setSelectedCompanionForProfile] = useState<UserProfile | null>(null);

  // Selected companion for booking request modal
  const [selectedCompanionForBooking, setSelectedCompanionForBooking] = useState<{
    companion: UserProfile;
    cardId?: string;
  } | null>(null);

  // Chat modal state
  const [activeChatBooking, setActiveChatBooking] = useState<BookingRecord | null>(null);

  // Rating modal state
  const [ratingBooking, setRatingBooking] = useState<BookingRecord | null>(null);

  // Cancellation penalty modal state (legacy / confirmed with fee hold)
  const [cancellingBooking, setCancellingBooking] = useState<BookingRecord | null>(null);

  // Quick cancellation prompt state for all active requests
  const [bookingToCancelPrompt, setBookingToCancelPrompt] = useState<BookingRecord | null>(null);
  const [bookingToReschedule, setBookingToReschedule] = useState<BookingRecord | null>(null);
  const [cancelToast, setCancelToast] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xl animate-fadeIn my-6 text-white">
        <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-indigo-700/60 shadow-inner">
          <CalendarCheck className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white">Sign In to View Your Bookings</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Track your sent outing requests, view approval statuses, communicate via encrypted chat, and leave verified ratings.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
        >
          Sign Up / Log In (OTP)
        </button>
      </div>
    );
  }

  // STRICT MULTI-USER ISOLATION:
  // Bookings requested by current user as Booker
  const myBookings = bookings.filter(
    (b) => (b.bookerId || b.bookerToken) === currentUser.userToken
  );

  // Saved Companions List derived from saved tokens
  const savedCompanions = savedCompanionTokens
    .map((tok) => getUserByToken(tok) || usersAndCompanions.find((u) => u.userToken === tok))
    .filter((c): c is UserProfile => Boolean(c));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top View Toggle: Bookings vs Saved Companions */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-2 shadow-xl flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewSection('bookings')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            viewSection === 'bookings'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>My Outings &amp; Bookings</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            viewSection === 'bookings' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-800 text-slate-400'
          }`}>
            {myBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewSection('saved')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            viewSection === 'saved'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Heart className={`w-4 h-4 ${viewSection === 'saved' ? 'fill-white text-white' : 'text-rose-400'}`} />
          <span>Saved Companions</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            viewSection === 'saved' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-400'
          }`}>
            {savedCompanions.length}
          </span>
        </button>
      </div>

      {/* VIEW SECTION A: MY BOOKINGS */}
      {viewSection === 'bookings' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-cyan-400" />
                <span>My Public Social Outings &amp; Bookings</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Strictly showing outings requested by your account ({currentUser.userToken} • {currentUser.fullName}).
              </p>
            </div>

            <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-700/60 px-3 py-1.5 rounded-xl text-xs text-cyan-300 font-bold self-start sm:self-auto shadow-xs">
              <span>{myBookings.length} Total Bookings</span>
            </div>
          </div>

          {/* Cancellation Toast Feedback */}
          {cancelToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs font-semibold rounded-2xl flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{cancelToast}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setCancelToast(null)}
                className="text-emerald-400 hover:text-emerald-200 text-xs font-bold px-1.5 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {myBookings.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-10 sm:p-12 text-center shadow-xl text-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 text-cyan-400 flex items-center justify-center mx-auto mb-3 border border-indigo-700/60 shadow-inner">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-white text-base">No Outings Requested Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Discover verified companions in Kolkata, Bhubaneswar, and other launch hubs in the Explore tab.
              </p>
              <button
                type="button"
                onClick={() => setAppActiveTab('explore')}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Browse Verified Companions in Explore</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((booking) => {
                // STRICT CHAT LOCK: Encrypted chat is ONLY unlocked during 'Confirmed' status.
                // The exact moment it updates to 'Completed', chat is strictly sealed.
                const isChatUnlocked = booking.status === 'Confirmed';
                const hasSubmittedRating = booking.ratingSubmitted || booking.bookerRatingSubmitted;
                const isCancellable = 
                  booking.status === 'Pending Companion Acceptance' || 
                  booking.status === 'Payment On Hold - Admin Verifying' || 
                  booking.status === 'Confirmed';

                // BOOKER PRIVACY FILTER: Strictly hide Companion fee/wallet notes from Booker view
                const isCancelledByCompanion = booking.status.includes('Cancelled by Companion');
                const isCancelledByBooker = booking.status.includes('Cancelled by Booker') || booking.status === 'Cancelled';
                const isRejectedByCompanion = booking.status.includes('Rejected by Companion') || booking.status === 'Rejected';
                
                const bookerStatusDisplay = isCancelledByCompanion
                  ? 'Cancelled by Companion'
                  : isCancelledByBooker
                  ? 'Cancelled by Booker'
                  : isRejectedByCompanion
                  ? 'Rejected by Companion'
                  : booking.status;

            return (
              <motion.div
                key={booking.id}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="bg-slate-900 rounded-2xl border border-slate-700/80 p-6 shadow-xl space-y-4 hover:border-indigo-400/50 hover:shadow-[0_12px_35px_rgba(99,102,241,0.2)] transition-all text-white"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-white text-sm">
                      {booking.companionName}
                    </span>
                    <CopyUserIdButton
                      userId={booking.companionToken}
                      showText={true}
                      className="text-[10px] font-mono text-slate-300 bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-700"
                    />
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {booking.bookingToken}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      booking.status === 'Confirmed' || booking.status === 'Accepted'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-xs'
                        : booking.status === 'Payment On Hold - Admin Verifying'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse'
                        : booking.status === 'Pending Companion Acceptance'
                        ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                        : booking.status === 'Completed'
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : (isCancelledByCompanion || isCancelledByBooker)
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold'
                        : isRejectedByCompanion
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold'
                        : 'bg-rose-950/80 text-rose-300'
                    }`}>
                      {bookerStatusDisplay}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Outing Amount to Pay in Person</span>
                    <span className="text-sm font-extrabold text-cyan-400">₹{booking.totalOutingCost}</span>
                  </div>
                </div>

                {/* Middle details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Activity Package
                      </span>
                      <span className="font-bold text-white text-sm">
                        {booking.activityTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        {booking.outingDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {booking.outingTime} ({booking.hours} hours)
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      "{booking.purpose}"
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{booking.venueName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pl-5">
                      {booking.venueAddress}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold pl-5 pt-1">
                      Category: {booking.venueCategory} (100% Commercial Public Venue)
                    </div>
                  </div>
                </div>

                {/* COMPLETED STATUS: TWO-WAY RATING WORKFLOW FOR BOOKER */}
                {booking.status === 'Completed' && (
                  <div>
                    {hasSubmittedRating ? (
                      <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Your Verified Rating for {booking.companionName}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= (booking.bookerRating || booking.userRating || 5)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                            <span className="font-extrabold text-xs text-amber-300 ml-1">
                              ({booking.bookerRating || booking.userRating}/5)
                            </span>
                          </div>
                        </div>

                        {(booking.bookerReview || booking.userReview) && (
                          <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 italic">
                            "{booking.bookerReview || booking.userReview}"
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 block">
                          Recorded on platform. Contributed to Companion's public reputation score.
                        </span>
                      </div>
                    ) : (
                      <div className="bg-amber-950/40 rounded-2xl p-4 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>Outing Completed with {booking.companionName}</span>
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Rate your companion's punctuality, etiquette, and professionalism to update their public rating.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRatingBooking(booking)}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <Star className="w-4 h-4 fill-white" />
                          <span>Rate Companion</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Encrypted Chat Button - Strictly Confirmed Only */}
                    {isChatUnlocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatBooking(booking);
                          setActiveChatBookingId(booking.id);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Open 🔒 E2E Encrypted Outing Chat</span>
                      </button>
                    ) : booking.status === 'Completed' ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 w-fit">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-[11px] text-slate-300">
                          🔒 Chat Closed &amp; Sealed (Outing Completed)
                        </span>
                      </div>
                    ) : (isCancelledByCompanion || isCancelledByBooker || booking.status.includes('Cancelled')) ? (
                      <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-800/60 w-fit">
                        <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-semibold text-[11px]">
                          🔒 Chat Locked ({bookerStatusDisplay})
                        </span>
                      </div>
                    ) : (booking.status === 'Rejected by Companion' || booking.status === 'Rejected') ? (
                      <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-800/60 flex-wrap">
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-semibold text-[11px]">
                          Outing Declined by Companion
                        </span>
                        <button
                          type="button"
                          onClick={() => setAppActiveTab('explore')}
                          className="ml-2 text-[11px] font-bold text-cyan-300 hover:text-white underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Explore Other Companions</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 w-fit">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-medium text-[11px]">
                          🔒 Encrypted Chat Locked (Unlocks instantly upon companion acceptance)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions: Reschedule, Cancel Booking & Report Companion */}
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {booking.status === 'Confirmed' && (
                      <button
                        type="button"
                        onClick={() => setBookingToReschedule(booking)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-cyan-300 hover:text-white border border-cyan-700/80 hover:bg-cyan-700 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                        title="Free Date & Time Reschedule"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>🗓️ Reschedule Date/Time</span>
                      </button>
                    )}

                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => setBookingToCancelPrompt(booking)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:text-white border border-rose-800/80 hover:bg-rose-600 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                        title="Cancel this booking request"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>Cancel Booking</span>
                      </button>
                    )}

                    {/* Report Companion Button */}
                    <button
                      type="button"
                      onClick={() => setActiveReportUserToken(booking.companionToken)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-rose-400 text-xs font-semibold rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Report Companion</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* VIEW SECTION B: SAVED COMPANIONS */}
      {viewSection === 'saved' && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>Saved Companions</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Verified companions bookmarked by your account ({currentUser.userToken} • {currentUser.fullName}). View verified profiles or initiate outing requests.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-800/80 px-3 py-1.5 rounded-xl text-xs text-rose-300 font-bold self-start sm:self-auto shadow-xs">
              <span>{savedCompanions.length} Saved Profile{savedCompanions.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {savedCompanions.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center space-y-4 text-white shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/80 text-rose-400 flex items-center justify-center mx-auto border border-rose-800/80 shadow-inner">
                <Heart className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">No Saved Companions Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Browse verified profiles in the Explore directory. Click the ❤️ Save button on any companion profile to bookmark them here for quick booking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAppActiveTab('explore')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Browse Verified Companions in Explore</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
              {savedCompanions.map((comp) => {
                const liveComp = getUserByToken(comp.userToken) || comp;
                return (
                  <motion.div
                    key={liveComp.userToken}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="bg-slate-900 rounded-2xl border border-slate-700/80 hover:border-rose-400/50 hover:shadow-[0_16px_40px_-10px_rgba(244,63,94,0.2)] p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 group relative text-white"
                  >
                    {/* Top Row: Avatar + Details + Unsave button */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        {liveComp.avatarUrl && liveComp.avatarUrl.trim() !== '' ? (
                          <img
                            src={liveComp.avatarUrl}
                            alt={liveComp.fullName}
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] group-hover:scale-102 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold items-center justify-center text-lg ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] ${
                            liveComp.avatarUrl && liveComp.avatarUrl.trim() !== '' ? 'hidden' : 'flex'
                          }`}
                        >
                          {liveComp.fullName ? liveComp.fullName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full ring-2 ring-slate-900 flex items-center justify-center text-[9px] text-white" title="Identity Verified">
                          ✓
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-bold text-white text-sm truncate">
                            {liveComp.fullName}
                          </h3>
                          <button
                            type="button"
                            onClick={() => toggleSaveCompanion(liveComp.userToken)}
                            title="Remove from saved"
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer shrink-0"
                          >
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-300">
                          <span>{liveComp.age} yrs</span>
                          <span>•</span>
                          <span>{liveComp.gender}</span>
                          <CopyUserIdButton
                            userId={liveComp.userToken}
                            className="text-[10px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 px-1.5 py-0.2 rounded ml-auto border border-slate-700"
                          />
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{liveComp.city}, {liveComp.state}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Box */}
                    <div className="bg-slate-950/70 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Standard Rate</span>
                        <span className="font-bold text-cyan-400">₹{liveComp.hourlyRate} / hr</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Rating</span>
                        <span className="font-bold text-amber-300 flex items-center justify-end gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{liveComp.rating.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal text-[10px]">({liveComp.reviewCount})</span>
                        </span>
                      </div>
                    </div>

                    {/* Bio snippet */}
                    {liveComp.bio && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {liveComp.bio}
                      </p>
                    )}

                    {/* Action Buttons: View Profile & Book Outing */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedCompanionForProfile(liveComp)}
                        className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser.accountStatus === 'Suspended') {
                            openSuspensionNotice(currentUser);
                            return;
                          }
                          setSelectedCompanionForBooking({ companion: liveComp });
                        }}
                        className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-900/30"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Outing</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Public Profile View Modal */}
      {selectedCompanionForProfile && (
        <PublicProfileModal
          companion={selectedCompanionForProfile}
          onClose={() => setSelectedCompanionForProfile(null)}
          onRequestOuting={(comp, cardId) => {
            setSelectedCompanionForProfile(null);
            if (currentUser.accountStatus === 'Suspended') {
              openSuspensionNotice(currentUser);
              return;
            }
            setSelectedCompanionForBooking({ companion: comp, cardId });
          }}
        />
      )}

      {/* Quick Confirmation Prompt Modal for Cancel Booking */}
      {bookingToCancelPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-sm sm:max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-750 m-2 text-white">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 text-rose-400 flex items-center justify-center mx-auto border border-rose-800/80 shadow-inner">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">
                Cancel Booking Request?
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {bookingToCancelPrompt.status === 'Confirmed' 
                  ? 'Are you sure you want to cancel this confirmed outing?'
                  : 'Are you sure you want to cancel this booking request?'}
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Booking Ref:</span>
                <span className="font-mono font-bold text-white">{bookingToCancelPrompt.bookingToken}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Companion:</span>
                <span className="font-semibold text-slate-200">{bookingToCancelPrompt.companionName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Activity:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[180px]">{bookingToCancelPrompt.activityTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-medium text-slate-200">{bookingToCancelPrompt.outingDate} at {bookingToCancelPrompt.outingTime}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/60 text-[11px]">
                  {bookingToCancelPrompt.status}
                </span>
              </div>
            </div>

            {/* Smart Cancellation & Rescheduling Guidance for Confirmed Bookings */}
            {bookingToCancelPrompt.status === 'Confirmed' ? (
              <div className="space-y-2.5 text-left">
                {/* Free Reschedule Recommendation Banner */}
                <div className="p-3 bg-cyan-950/50 border border-cyan-800/80 rounded-xl flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-cyan-300">Rescheduling is 100% Free</p>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      Need to move your meetup? You can update the date & time for free with zero cancellation penalties.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const target = bookingToCancelPrompt;
                        setBookingToCancelPrompt(null);
                        setBookingToReschedule(target);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>🗓️ Reschedule Date/Time (100% Free)</span>
                    </button>
                  </div>
                </div>

                {/* 100% Companion Fee Credit Protection Notice */}
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-300">100% Companion Fee Protection</p>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      Because this cancellation is initiated by you (Zero Companion Fault), <strong>100% of {bookingToCancelPrompt.companionName}'s Platform Acceptance Fee (₹{computeLiveBookingFee(bookingToCancelPrompt, bookings, null, platformSettings).finalPlatformFee})</strong> will be automatically credited to their Fee Credit Wallet for their next booking.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 leading-normal">
                This action will withdraw the outing request and mark the booking as Cancelled for both you and {bookingToCancelPrompt.companionName}.
              </p>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setBookingToCancelPrompt(null)}
                className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={() => {
                  const token = bookingToCancelPrompt.bookingToken;
                  if (bookingToCancelPrompt.status === 'Confirmed') {
                    cancelBookingByBookerWithCredit(bookingToCancelPrompt.id, 'Cancelled by Booker');
                  } else {
                    cancelBooking(bookingToCancelPrompt.id, 'Cancelled by Booker');
                  }
                  setBookingToCancelPrompt(null);
                  setCancelToast(`Booking ${token} has been cancelled.`);
                  setTimeout(() => setCancelToast(null), 3500);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Yes, Cancel Booking</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free Reschedule Date & Time Modal */}
      {bookingToReschedule && (
        <RescheduleBookingModal
          booking={bookingToReschedule}
          onClose={() => setBookingToReschedule(null)}
          onRescheduledSuccess={() => setBookingToReschedule(null)}
        />
      )}

      {/* Booking Request Modal */}
      {selectedCompanionForBooking && (
        <BookingRequestModal
          companion={selectedCompanionForBooking.companion}
          initialCardId={selectedCompanionForBooking.cardId}
          onClose={() => setSelectedCompanionForBooking(null)}
        />
      )}

      {/* Booker Rating Modal (Rate Companion) */}
      {ratingBooking && (
        <TwoWayReviewModal
          isOpen={!!ratingBooking}
          onClose={() => setRatingBooking(null)}
          booking={ratingBooking}
          targetRole="companion"
          targetName={ratingBooking.companionName}
          targetToken={ratingBooking.companionToken}
          targetAvatarUrl={getUserByToken(ratingBooking.companionToken)?.avatarUrl}
          onSubmitRating={(bId, stars, review) => {
            submitBookingRating(bId, stars, review);
          }}
        />
      )}

      {/* Booker Cancellation & Penalty Modal */}
      {cancellingBooking && (
        <CancellationPenaltyModal
          booking={cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onCancelledSuccess={() => setCancellingBooking(null)}
        />
      )}

      {/* E2E Encrypted Chat Modal */}
      {activeChatBooking && (
        <ChatModal
          booking={activeChatBooking}
          onClose={() => {
            setActiveChatBooking(null);
            setActiveChatBookingId(null);
          }}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ActivityPackageCard, BookingRecord } from '../../types/marketplace';
import { ActivityCardModal } from './ActivityCardModal';
import { ProSubscriptionModal } from './ProSubscriptionModal';
import { AcceptanceFeePaymentModal } from './AcceptanceFeePaymentModal';
import { TwoWayReviewModal } from '../common/TwoWayReviewModal';
import { ChatModal } from '../common/ChatModal';
import { CopyUserIdButton } from '../common/CopyUserIdButton';
import { RescheduleBookingModal } from '../common/RescheduleBookingModal';
import { CompanionCancellationModal } from './CompanionCancellationModal';
import { computeLiveBookingFee } from '../../utils/feeCalculator';
import { 
  Sparkles, 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  CalendarCheck, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  Zap, 
  AlertTriangle,
  Building2,
  Lock,
  ArrowRight,
  CheckCheck,
  Calendar,
  Star,
  XCircle,
  Wallet,
} from 'lucide-react';

export const CompanionStudioView: React.FC = () => {
  const { 
    currentUser, 
    updateCurrentUserProfile,
    platformSettings, 
    getCompanionActivityCards, 
    deleteActivityCard,
    bookings, 
    rejectBooking,
    markOutingCompleted,
    submitCompanionRatingForBooker,
    getUserByToken,
    setActiveChatBookingId,
    openProfileModal,
    openAuthModal,
    openSuspensionNotice
  } = useMarketplace();

  // Modals
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<ActivityPackageCard | null>(null);
  const [activePaymentBooking, setActivePaymentBooking] = useState<BookingRecord | null>(null);
  const [activeChatBooking, setActiveChatBooking] = useState<BookingRecord | null>(null);
  const [ratingBooking, setRatingBooking] = useState<BookingRecord | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<BookingRecord | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<BookingRecord | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-800/80 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xl animate-fadeIn my-6 text-white">
        <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-700/60 shadow-inner">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white">Companion Studio</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Offer your time for agreed hourly rates in strictly public venues. Create your 3 Free Activity Cards, manage your schedule, and accept outing requests.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
        >
          Sign Up / Log In as Companion (OTP)
        </button>
      </div>
    );
  }

  // My Activity Cards
  const myCards = getCompanionActivityCards(currentUser.userToken);
  const isPro = Boolean(currentUser.isProCompanion || currentUser.isPremiumCompanion);
  const isPendingVerification = currentUser.subscriptionStatus === 'pending_verification';
  const cardsCount = myCards.length;

  // STRICT MULTI-USER ISOLATION:
  // Incoming bookings where current user is the target Companion
  const myCompanionBookings = bookings.filter(
    (b) => (b.companionId || b.companionToken) === currentUser.userToken
  );

  const handleCreateCardClick = () => {
    if (currentUser.accountStatus === 'Suspended') {
      openSuspensionNotice(currentUser);
      return;
    }
    // Strictly block 4th card creation if on Free Tier
    if (cardsCount >= 3 && !isPro) {
      openProfileModal('subscription');
    } else {
      setCardToEdit(null);
      setIsActivityModalOpen(true);
    }
  };

  const handleEditCardClick = (card: ActivityPackageCard) => {
    if (currentUser.accountStatus === 'Suspended') {
      openSuspensionNotice(currentUser);
      return;
    }
    setCardToEdit(card);
    setIsActivityModalOpen(true);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const hasIdDoc = Boolean((currentUser.documentImageUrl || currentUser.idDocumentUrl || '').trim());

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Capability Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-3xl p-5 sm:p-8 border border-emerald-800/40 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Companion Studio • One Account, Two Capabilities</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
            Offer Safe Social Outings & Activity Packages
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Welcome, {currentUser.fullName}. Create specialized public activity packages (movies, museum walks, cafe talks), receive outing requests, and collect payments directly from Bookers when meeting at the venue.
          </p>

          {/* Subscription Validity Bar if Pro */}
          {isPro && (
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-600/60 px-3 py-1.5 rounded-xl text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span><strong>Companion Pro (1-Month Pass) Active:</strong> 30 Days Validity (Expires {formatDate(currentUser.subscriptionExpiryDate)})</span>
            </div>
          )}

          {/* Instant Government ID Verification Status */}
          {currentUser.accountStatus === 'Suspended' ? (
            <div className="mt-3 p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-xl text-xs text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white text-xs block">
                    Account in 7-Day Restricted Mode (Safety Policy Hold)
                  </span>
                  <p className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">
                    Card creation/editing and accepting new booking requests are restricted until {formatDate(currentUser.suspensionExpiryDate)}. Existing <strong>Confirmed Outings</strong> and <strong>Encrypted Chats</strong> remain 100% active and protected.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openSuspensionNotice(currentUser)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-all shrink-0 self-start sm:self-auto cursor-pointer shadow-xs"
              >
                View Safety Hold Details
              </button>
            </div>
          ) : !hasIdDoc ? (
            <div className="mt-3 p-3 bg-amber-950/80 border border-amber-600/70 rounded-xl text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Government ID Required:</strong> Upload your ID (Voter ID, Driving License, or PAN Card) in Profile Settings for instant automated verification.
                </span>
              </div>
              <button
                type="button"
                onClick={() => openProfileModal('profile')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shrink-0 self-start sm:self-auto cursor-pointer"
              >
                Upload ID in Profile →
              </button>
            </div>
          ) : myCards.length === 0 ? (
            <div className="mt-3 p-3 bg-indigo-900/60 border border-indigo-500/60 rounded-xl text-xs text-indigo-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>
                <strong>ID Auto-Verified (Ready to Go Live):</strong> Your government ID is verified! Create at least 1 Activity Package Card below to make your profile live in public Explore.
              </span>
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/60 px-3 py-1 rounded-xl text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span><strong>Government ID Verified & Live:</strong> Visible in Public Explore with {myCards.length} Activity Package{myCards.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* COMPONENT 1: Activity Package Cards Manager with Card Quota Badge */}
      <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>Your Custom Activity Package Cards</span>
              </h2>

              {/* User Card Quota Badge */}
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                isPro
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                  : isPendingVerification
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                  : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
              }`}>
                {isPro
                  ? 'Companion Pro: Unlimited Cards (30 Days Active)'
                  : isPendingVerification
                  ? 'Pro Payment On Hold (Admin Verifying)'
                  : `Free Plan: ${cardsCount} / 3 Free Cards Used`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Every Companion can create up to <strong>3 Activity Cards for FREE</strong>. Upgrade to Companion Pro (1-Month Plan / 30 Days Validity) to publish unlimited packages.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateCardClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/30 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Activity Card</span>
          </button>
        </div>

        {myCards.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-dashed border-slate-700/80 text-white">
            <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-white">No Activity Package Cards Created Yet</p>
            <p className="text-[11px] text-slate-400 mt-1 mb-4 max-w-md mx-auto leading-relaxed">
              Your profile will remain hidden from the public Explore grid until you create at least 1 Activity Package Card. Create your first card below (e.g. Cinema at INOX, Museum Tour, Specialty Coffee Talk) to go live!
            </p>
            <button
              type="button"
              onClick={handleCreateCardClick}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Create Free Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {myCards.map((card) => (
              <div
                key={card.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700/60 p-4 flex flex-col justify-between space-y-3 hover:border-indigo-400/50 hover:shadow-lg transition-all text-white"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-md">
                      {card.venueCategory}
                    </span>
                    <span className="text-xs font-extrabold text-cyan-400">
                      ₹{card.hourlyRate}/hr
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-xs sm:text-sm mt-2">
                    {card.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                    {card.shortDescription}
                  </p>

                  <div className="text-[10px] text-slate-400 mt-2">
                    Hub: {card.city} • Min 1 Hour
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => handleEditCardClick(card)}
                    className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-cyan-400 text-xs font-semibold rounded hover:bg-slate-700/60 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteActivityCard(card.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-400 text-xs font-semibold rounded hover:bg-slate-700/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* COMPONENT 2: Incoming Requests, Repeat Fee Loyalty & Payment Hold Workflow */}
      {/* COMPONENT 2: Incoming Requests, Repeat Fee Loyalty & Payment Hold Workflow */}
      <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-5 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-cyan-400" />
              <span>Your Companion Requests & Outings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly showing requests sent to your account ({currentUser.userToken}). Review venue, submit acceptance fee, and mark outings completed.
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {myCompanionBookings.length} Requests for {currentUser.fullName}
          </span>
        </div>

        {myCompanionBookings.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-dashed border-slate-700/80 text-white">
            <Clock className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">No Incoming Outing Requests for You</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When Bookers select one of your packages, they will appear here with exact meeting venue and fee breakdown.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myCompanionBookings.map((booking) => {
              const isChatUnlocked = booking.status === 'Confirmed' || booking.status === 'Completed';
              // 1. NEVER READ STALE SAVED FEE NUMBERS FROM BOOKING OBJECTS:
              // Compute live during rendering using the pure helper function:
              const liveFee = computeLiveBookingFee(booking, bookings, currentUser, platformSettings);
              const finalPlatformFee = liveFee.finalPlatformFee;
              const cancellationCreditBalance = currentUser?.cancellationCreditBalance || 0;
              const walletDeduction = Math.min(cancellationCreditBalance, finalPlatformFee);
              const netPayableFee = Math.max(0, finalPlatformFee - cancellationCreditBalance);
              const isFullCoverage = netPayableFee === 0 && walletDeduction > 0;

              return (
                <div
                  key={booking.id}
                  className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-5 space-y-3 text-white hover:border-slate-600 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        Booker: {booking.bookerName}
                      </span>
                      <CopyUserIdButton
                        userId={booking.bookerToken}
                        showText={true}
                        className="text-[10px] font-mono text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 px-2 py-0.5 rounded font-semibold"
                      />
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {booking.bookingToken}
                      </span>
                      {(booking.paymentReferenceId || booking.razorpayRefId) && (
                        <span className="text-[10px] font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1" title="Unified Transaction / Payment Reference ID">
                          <span className="text-slate-400 font-sans">Txn:</span>
                          <span className="font-bold">{booking.paymentReferenceId || booking.razorpayRefId}</span>
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        booking.status === 'Confirmed' || booking.status === 'Accepted'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-xs'
                          : booking.status === 'Payment On Hold - Admin Verifying'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse'
                          : booking.status === 'Pending Companion Acceptance'
                          ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                          : booking.status === 'Completed'
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : (booking.status === 'Cancelled by Booker' || booking.status === 'Cancelled')
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-extrabold'
                          : (booking.status === 'Rejected by Companion' || booking.status === 'Rejected')
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-extrabold'
                          : 'bg-rose-950/80 text-rose-300'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">To Collect from Booker (Cash/UPI):</span>
                      <span className="font-extrabold text-sm text-cyan-400">₹{booking.totalOutingCost}</span>
                    </div>
                  </div>

                  {/* Booking details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-white">
                        {booking.activityTitle}
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">
                        {booking.outingDate} at {booking.outingTime} ({booking.hours} hours)
                      </div>
                      <div className="text-slate-400 text-[11px] mt-1 italic">
                        "{booking.purpose}"
                      </div>
                    </div>

                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1 font-semibold text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{booking.venueName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {booking.venueAddress}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold pt-1">
                        Category: {booking.venueCategory} (100% Commercial Public Venue)
                      </div>
                    </div>
                  </div>

                    {/* Referral Credit badge & dynamic fee calculations */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        {liveFee.discountApplied === 'Referral Credit (5%)' ? (
                          <span className="bg-amber-950/80 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-600/60 flex items-center gap-1">
                            <span>🎁</span>
                            <span>5% Referral Credit Applied! (5% Waiver on {liveFee.basePercent}% Base Fee • Effective Fee: {liveFee.effectiveFeePercent}%)</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Standard Platform Fee: {liveFee.basePercent}%
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-200">
                          {booking.status === 'Confirmed' || booking.status === 'Completed'
                            ? `Platform Fee Paid: ₹${liveFee.finalPlatformFee}`
                            : `Required Platform Fee: ₹${liveFee.finalPlatformFee}`}
                        </span>

                        {booking.status === 'Pending Companion Acceptance' && cancellationCreditBalance > 0 && (
                          <span className="bg-teal-950/80 text-teal-300 text-[11px] font-medium px-2 py-0.5 rounded-md border border-teal-700/60 flex items-center gap-1">
                            <Wallet className="w-3 h-3 text-teal-400" />
                            <span>
                              Wallet Credit Available: ₹{cancellationCreditBalance} ({isFullCoverage ? '₹0 with Credit' : `Net: ₹${netPayableFee}`})
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {booking.status === 'Pending Companion Acceptance' && (
                          <>
                            <button
                              type="button"
                              onClick={() => rejectBooking(booking.id)}
                              className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/70 text-rose-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                              title="Decline this outing request and notify booker via Gmail"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>Decline / Reject Request</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (currentUser.accountStatus === 'Suspended') {
                                  openSuspensionNotice(currentUser);
                                  return;
                                }
                                setActivePaymentBooking(booking);
                              }}
                              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer"
                              title={
                                cancellationCreditBalance > 0
                                  ? `Choose: Use ₹${cancellationCreditBalance} credit (Net: ₹${netPayableFee}) or save credit and pay via Razorpay`
                                  : 'Accept request and instantly confirm outing via Razorpay'
                              }
                            >
                              {isFullCoverage ? (
                                <span>✓ Accept Outing (₹0 with Credit or Razorpay)</span>
                              ) : walletDeduction > 0 ? (
                                <span>Accept Outing (Net ₹{netPayableFee} or Razorpay)</span>
                              ) : (
                                <span>Accept & Pay Fee (₹{finalPlatformFee})</span>
                              )}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {(booking.status === 'Rejected by Companion' || booking.status === 'Rejected') && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl font-medium">
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Request Declined (Rejection email delivered to Booker)</span>
                          </div>
                        )}

                        {booking.status === 'Payment On Hold - Admin Verifying' && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/80 border border-amber-700/60 px-3 py-1.5 rounded-xl font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Payment On Hold — Admin verifying in Razorpay</span>
                          </div>
                        )}

                        {(booking.status === 'Confirmed' || booking.status === 'Accepted') && (
                          <>
                            <button
                              type="button"
                              onClick={() => setReschedulingBooking(booking)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-cyan-300 hover:text-white border border-cyan-700/80 hover:bg-cyan-700 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                              title="Free Date & Time Reschedule (0 additional platform fees)"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>🗓️ Reschedule Date/Time</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCancellingBooking(booking)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:text-white border border-rose-800/80 hover:bg-rose-600 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                              title="Cancel confirmed outing"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Cancel Booking</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => markOutingCompleted(booking.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Mark Outing Completed</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveChatBooking(booking);
                                setActiveChatBookingId(booking.id);
                              }}
                              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Open 🔒 E2E Encrypted Chat</span>
                            </button>
                          </>
                        )}

                        {booking.status === 'Completed' && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-medium">
                              🔒 Chat Closed (Outing Completed)
                            </span>

                            {booking.companionRatingSubmitted ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/80 border border-amber-700/60 px-3 py-1.5 rounded-xl font-bold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>Rated Booker ({booking.companionRating}/5)</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setRatingBooking(booking)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5 fill-white" />
                                <span>Rate Booker</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Cancellation Status Displays */}
                        {(booking.status.includes('Cancelled by Booker') || booking.status === 'Cancelled by Booker') && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1.5 rounded-xl shadow-xs">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>100% Fee (₹{liveFee.finalPlatformFee}) Credited to Your Wallet!</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg">
                              🔒 Cancelled by Booker
                            </span>
                          </div>
                        )}

                        {booking.status.includes('Cancelled by Companion') && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            {booking.status.includes('Lifeline Used') || booking.emergencyLifelineUsed ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-3 py-1.5 rounded-xl shadow-xs">
                                <span>💳 Emergency Lifeline Used — ₹{liveFee.finalPlatformFee} Fee Credited to Wallet</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 bg-rose-950/80 border border-rose-700/60 px-3 py-1.5 rounded-xl shadow-xs">
                                <span>⚠️ Outing Cancelled by You (₹{liveFee.finalPlatformFee} Fee Forfeited)</span>
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg">
                              🔒 Chat Locked
                            </span>
                          </div>
                        )}

                        {booking.status === 'Cancelled' && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg">
                              🔒 Chat Locked & Cancelled
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submodals */}
      {isActivityModalOpen && (
        <ActivityCardModal
          cardToEdit={cardToEdit}
          onClose={() => {
            setIsActivityModalOpen(false);
            setCardToEdit(null);
          }}
          onTriggerProModal={() => {
            setIsActivityModalOpen(false);
            openProfileModal('subscription');
          }}
        />
      )}

      {activePaymentBooking && (
        <AcceptanceFeePaymentModal
          booking={activePaymentBooking}
          onClose={() => setActivePaymentBooking(null)}
          onSubmitted={() => setActivePaymentBooking(null)}
        />
      )}

      {/* Free Reschedule Date & Time Modal */}
      {reschedulingBooking && (
        <RescheduleBookingModal
          booking={reschedulingBooking}
          onClose={() => setReschedulingBooking(null)}
          onRescheduledSuccess={() => setReschedulingBooking(null)}
        />
      )}

      {/* Companion Cancellation Transparency Modal */}
      {cancellingBooking && (
        <CompanionCancellationModal
          booking={cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onCancelledSuccess={() => setCancellingBooking(null)}
          onOpenReschedule={() => {
            const b = cancellingBooking;
            setCancellingBooking(null);
            setReschedulingBooking(b);
          }}
        />
      )}

      {/* Companion Rating Modal (Rate Booker) */}
      {ratingBooking && (
        <TwoWayReviewModal
          isOpen={!!ratingBooking}
          onClose={() => setRatingBooking(null)}
          booking={ratingBooking}
          targetRole="booker"
          targetName={ratingBooking.bookerName}
          targetToken={ratingBooking.bookerToken}
          targetAvatarUrl={getUserByToken(ratingBooking.bookerToken)?.avatarUrl}
          onSubmitRating={(bId, stars, review) => {
            submitCompanionRatingForBooker(bId, stars, review);
          }}
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

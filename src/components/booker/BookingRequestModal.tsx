import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { UserProfile, ActivityPackageCard } from '../../types/marketplace';
import { 
  X, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Tag,
  Minus,
  Plus
} from 'lucide-react';
import { checkVenueSafety } from '../../services/safetyFilterService';

interface BookingRequestModalProps {
  companion: UserProfile;
  initialCardId?: string;
  onClose: () => void;
}

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const formatTimeTo12Hour = (time24: string): string => {
  if (!time24) return '';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return time24;
  const minutes = parts[1] || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const formattedH = h12 < 10 ? `0${h12}` : `${h12}`;
  return `${formattedH}:${minutes} ${period}`;
};

export const BookingRequestModal: React.FC<BookingRequestModalProps> = ({ 
  companion, 
  initialCardId,
  onClose 
}) => {
  const { 
    createBooking, 
    getCompanionActivityCards,
    bookings,
    currentUser,
    suspendUserForSafetyViolation,
    openSuspensionNotice,
    openProfileModal
  } = useMarketplace();

  const companionCards = getCompanionActivityCards(companion.userToken);
  const defaultCard = initialCardId 
    ? companionCards.find(c => c.id === initialCardId) || companionCards[0]
    : companionCards[0];

  const [selectedCardId, setSelectedCardId] = useState<string>(initialCardId || defaultCard?.id || '');
  const [hours, setHours] = useState<number>(2);
  const [outingDate, setOutingDate] = useState<string>(getTomorrowDate());
  const [outingTime, setOutingTime] = useState<string>('16:00');
  const [venueName, setVenueName] = useState<string>('');
  const [venueAddress, setVenueAddress] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [hasAgreedToPlatonicPolicy, setHasAgreedToPlatonicPolicy] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedBookingToken, setConfirmedBookingToken] = useState<string | null>(null);
  const [confirmedPaymentId, setConfirmedPaymentId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Background detection: automatically check if Booker has booked this Companion before
  const isRepeatClient = currentUser
    ? bookings.some(
        (b) =>
          b.bookerToken === currentUser.userToken &&
          b.companionToken === companion.userToken &&
          b.status === 'Completed'
      )
    : false;

  // Active card details
  const selectedCard = companionCards.find((c) => c.id === selectedCardId) || defaultCard;
  const hourlyRate = selectedCard ? selectedCard.hourlyRate : (companion.hourlyRate || 400);
  const venueCategory = selectedCard ? selectedCard.venueCategory : (companion.outingCategories[0] || 'Verified Cafe & Restaurant');
  const activityTitle = selectedCard ? selectedCard.title : 'Standard Public Outing';

  // Total Outing Cost for Booker
  const totalOutingCost = Math.round(hourlyRate * hours);

  const validateForm = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.userToken === companion.userToken) {
      setFormError('Self-booking prohibited: You cannot request an outing with your own Companion account.');
      return false;
    }
    if (!hours || hours < 1 || hours > 24) {
      setFormError('Outing duration must be between 1 hour and 24 hours.');
      return false;
    }
    if (!venueName.trim() || !venueAddress.trim()) {
      setFormError('Please specify the exact public venue name and address.');
      return false;
    }
    if (!purpose.trim()) {
      setFormError('Please describe your planned activity or topic of discussion.');
      return false;
    }
    if (!hasAgreedToPlatonicPolicy) {
      setFormError('You must agree to the strictly public and platonic outing terms.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !currentUser) return;

    // Check if Booker has verified Government ID
    const isBookerVerified = Boolean(currentUser.isVerified) && (currentUser.verificationStatus === 'Verified' || currentUser.verificationStatus === 'ID Verified');
    if (!isBookerVerified) {
      setFormError('Government ID Verification Required: Please upload your PAN Card, Voter ID, or Driving License in Profile Settings to request outings.');
      return;
    }

    // Check if Booker is currently suspended
    if (currentUser.accountStatus === 'Suspended') {
      openSuspensionNotice(currentUser);
      onClose();
      return;
    }

    // Prohibited Accommodation & Venue Safety Scanner
    const safetyCheck = checkVenueSafety(venueName, venueAddress, purpose);
    if (safetyCheck.isForbidden) {
      suspendUserForSafetyViolation(
        currentUser.userToken,
        safetyCheck.detectedKeyword,
        `Venue: "${venueName.trim()}", Address: "${venueAddress.trim()}", Purpose: "${purpose.trim()}"`
      );
      onClose();
      return;
    }

    const formattedTime = formatTimeTo12Hour(outingTime) || outingTime;
    const created = createBooking({
      companionToken: companion.userToken,
      activityCardId: selectedCard?.id,
      activityTitle,
      hourlyRate,
      outingDate,
      outingTime: formattedTime,
      hours,
      venueCategory,
      venueName: venueName.trim(),
      venueAddress: venueAddress.trim(),
      purpose: purpose.trim(),
      isRepeatClient,
    });

    setConfirmedBookingToken(created.bookingToken);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl w-full max-w-full sm:max-w-xl md:max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-800 flex flex-col m-2 sm:m-4 md:m-6 text-slate-100">
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {companion.avatarUrl && companion.avatarUrl.trim() !== '' ? (
              <img
                src={companion.avatarUrl}
                alt={companion.fullName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-400 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 rounded-full bg-slate-800 text-white font-bold items-center justify-center text-sm ring-2 ring-emerald-400 shrink-0 ${
                companion.avatarUrl && companion.avatarUrl.trim() !== '' ? 'hidden' : 'flex'
              }`}
            >
              {companion.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  Request Public Outing with {companion.fullName}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  ID Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {companion.city} • Strictly Public Commercial Venues Only
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-900 text-slate-200">
          {confirmedBookingToken ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-white">
                {confirmedPaymentId ? 'Booking Paid & Request Sent!' : 'Outing Request Sent!'}
              </h4>
              <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Your request has been routed to {companion.fullName}. Once accepted and verified, you will be notified under your <strong>My Bookings</strong> tab.
              </p>

              {successToast && (
                <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl max-w-sm mx-auto text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successToast}</span>
                </div>
              )}

              <div className="mt-5 p-4 bg-slate-950 border border-slate-800 rounded-xl max-w-sm mx-auto text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Booking Token:</span>
                  <span className="font-mono font-bold text-cyan-400">{confirmedBookingToken}</span>
                </div>
                {confirmedPaymentId && (
                  <div className="flex justify-between text-xs bg-indigo-950/60 -mx-1 px-2 py-1 rounded-md border border-indigo-800/60">
                    <span className="text-indigo-300 font-semibold">Payment / Txn ID:</span>
                    <span className="font-mono font-bold text-cyan-300">{confirmedPaymentId}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Selected Package:</span>
                  <span className="font-semibold text-white truncate max-w-[200px]">{activityTitle}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Scheduled Time:</span>
                  <span className="font-semibold text-white">{outingDate} at {formatTimeTo12Hour(outingTime) || outingTime}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-semibold text-white">{hours} {hours === 1 ? 'Hour' : 'Hours'}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-800 pt-2">
                  <span className="text-slate-300 font-bold">
                    {confirmedPaymentId ? 'Total Paid via Razorpay:' : 'Total Outing Value (Pay in Person):'}
                  </span>
                  <span className="font-extrabold text-cyan-400 text-sm">₹{totalOutingCost}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Back to Explore
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                  {!currentUser?.isVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        openProfileModal('profile');
                      }}
                      className="self-start px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Verify ID in Profile Settings →
                    </button>
                  )}
                </div>
              )}

              {/* Step 1: Choose an Activity Package Offered by Companion */}
              <div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-2.5">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Step 1: Choose an Activity Package Offered by {companion.fullName}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select a custom package to book its verified public activity and hourly rate ({companionCards.length} packages available).
                  </p>
                </div>

                {companionCards.length > 0 ? (
                  <div className="space-y-2">
                    {companionCards.map((card) => (
                      <label
                        key={card.id}
                        className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedCardId === card.id
                            ? 'bg-indigo-950/50 border-indigo-500 shadow-xs ring-1 ring-indigo-500/30'
                            : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="activityCard"
                            checked={selectedCardId === card.id}
                            onChange={() => setSelectedCardId(card.id)}
                            className="w-4 h-4 text-cyan-500 accent-cyan-500 mt-0.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {card.title}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {card.shortDescription}
                            </span>
                            <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                              {card.venueCategory}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span className="text-xs font-extrabold text-cyan-400 block">
                            ₹{card.hourlyRate}
                          </span>
                          <span className="text-[10px] text-slate-500">/ hour</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                    Standard Outing Package: ₹{companion.hourlyRate}/hour
                  </div>
                )}
              </div>

              {/* b) Flexible Outing Duration (1 to 24 Hours) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Duration: {hours} {hours === 1 ? 'Hour' : 'Hours'} (1 to 24 Hours)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-cyan-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                    ₹{hourlyRate} × {hours}h = <strong>₹{totalOutingCost}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Decrement Button */}
                  <button
                    type="button"
                    onClick={() => setHours((prev) => Math.max(1, prev - 1))}
                    disabled={hours <= 1}
                    className={`w-11 h-10 rounded-xl border flex items-center justify-center font-bold text-base transition-colors ${
                      hours <= 1
                        ? 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700 cursor-pointer'
                    }`}
                    title="Decrease duration by 1 hour"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  {/* Direct Number Input (1 to 24) */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={hours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setHours(Math.max(1, Math.min(24, val)));
                        } else {
                          setHours(1);
                        }
                      }}
                      className="w-full text-center py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-sm font-extrabold text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-colors"
                      placeholder="Hours (1-24)"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium pointer-events-none">
                      hrs (1 - 24h)
                    </span>
                  </div>

                  {/* Increment Button */}
                  <button
                    type="button"
                    onClick={() => setHours((prev) => Math.max(1, Math.min(24, prev + 1)))}
                    disabled={hours >= 24}
                    className={`w-11 h-10 rounded-xl border flex items-center justify-center font-bold text-base transition-colors ${
                      hours >= 24
                        ? 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700 cursor-pointer'
                    }`}
                    title="Increase duration by 1 hour"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Book from 1 hour up to full-day 24 hours. Total cost calculated automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Outing Date
                  </label>
                  <input
                    type="date"
                    value={outingDate}
                    onChange={(e) => setOutingDate(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Start Time
                    </label>
                    {outingTime && (
                      <span className="text-[10px] font-bold text-cyan-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md shrink-0">
                        Selected: {formatTimeTo12Hour(outingTime)}
                      </span>
                    )}
                  </div>
                  <input
                    type="time"
                    value={outingTime}
                    onChange={(e) => setOutingTime(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                    required
                  />
                  {outingTime && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      <span>Selected Time:</span>
                      <strong className="text-cyan-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {formatTimeTo12Hour(outingTime)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* c) Simplified English Labels: Meeting Place Name & Area / Location & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Meeting Place Name (Mall, Cafe, Cinema, etc.)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. South City Mall, Starbucks, INOX"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Area / Location &amp; City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Park Street, Salt Lake, Kolkata"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Activity Plan / Topic */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Outing Plan / Topic
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Watching a movie, coffee chat, or pandal hopping"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Booker Payment Summary */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Outing Rate ({hours} hrs @ ₹{hourlyRate}/hr):</span>
                  <span className="font-bold text-white">₹{totalOutingCost}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block text-xs">Total Due to Companion:</span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Pay directly in Cash / UPI when you meet at the public venue.
                    </span>
                  </div>
                  <span className="font-extrabold text-base text-cyan-400">₹{totalOutingCost}</span>
                </div>
              </div>

              {/* Simplified Platonic Safety Promise */}
              <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl">
                <input
                  type="checkbox"
                  checked={hasAgreedToPlatonicPolicy}
                  onChange={(e) => setHasAgreedToPlatonicPolicy(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 accent-cyan-500 rounded mt-0.5 cursor-pointer"
                  required
                />
                <span className="text-[11px] text-amber-200/90 leading-snug">
                  <strong>Public Venue &amp; Safety Promise:</strong> I agree to meet strictly at the public place mentioned above for a decent, platonic outing. I understand that asking to meet at a private home/hotel or behaving inappropriately will permanently ban my account.
                </span>
              </label>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-800 text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Now</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

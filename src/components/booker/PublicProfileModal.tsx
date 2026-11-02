import React, { useState } from 'react';
import { UserProfile } from '../../types/marketplace';
import { useMarketplace } from '../../context/MarketplaceContext';
import { 
  X, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  MapPin, 
  Heart, 
  CheckCircle2,
  Camera,
  Calendar,
  Lock,
  Package,
  ArrowRight,
  Building2,
  Crown
} from 'lucide-react';
import { CopyUserIdButton } from '../common/CopyUserIdButton';

interface PublicProfileModalProps {
  companion: UserProfile;
  onClose: () => void;
  onRequestOuting: (companion: UserProfile, cardId?: string) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  companion,
  onClose,
  onRequestOuting
}) => {
  const { 
    bookings, 
    getCompanionActivityCards, 
    toggleSaveCompanion, 
    isCompanionSaved, 
    getUserByToken,
    currentUser,
    openAuthModal
  } = useMarketplace();

  const liveCompanion = getUserByToken(companion.userToken) || companion;
  const companionCards = getCompanionActivityCards(liveCompanion.userToken);
  const isPro = Boolean(liveCompanion.isProCompanion || liveCompanion.isPremiumCompanion);

  // Tab State: 'photos' | 'packages' | 'reviews'
  const [activeTab, setActiveTab] = useState<'photos' | 'packages' | 'reviews'>('photos');

  const isSaved = isCompanionSaved(liveCompanion.userToken);

  const toggleSave = () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    toggleSaveCompanion(liveCompanion.userToken);
  };

  // Retrieve all verified submitted reviews for this companion
  const companionReviews = bookings.filter(
    (b) =>
      (b.companionToken === liveCompanion.userToken || b.companionId === liveCompanion.userToken) &&
      (b.ratingSubmitted || b.bookerRatingSubmitted || b.bookerRating || b.userRating)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div
        className={`rounded-3xl w-full max-w-full sm:max-w-xl md:max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] m-2 sm:m-4 md:m-6 text-slate-100 ${
          isPro
            ? 'bg-slate-900/95 border-2 border-amber-400/70 shadow-[0_0_50px_-10px_rgba(245,158,11,0.4)]'
            : 'bg-slate-900 border border-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`relative text-white p-4 sm:p-6 pb-5 sm:pb-6 border-b ${
            isPro
              ? 'bg-gradient-to-r from-amber-950/70 via-slate-950 to-yellow-950/50 border-amber-500/40'
              : 'bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar with Blue/Gold Pro Ring if Pro */}
            <div
              className={`relative shrink-0 w-fit ${
                isPro
                  ? 'p-1 rounded-full bg-gradient-to-tr from-blue-500 via-cyan-400 to-amber-400 shadow-[0_0_22px_rgba(59,130,246,0.6)]'
                  : ''
              }`}
            >
              {liveCompanion.avatarUrl && liveCompanion.avatarUrl.trim() !== '' ? (
                <img
                  src={liveCompanion.avatarUrl}
                  alt={liveCompanion.fullName}
                  className={`w-20 h-20 sm:w-24 sm:h-24 object-cover shadow-lg ${
                    isPro ? 'rounded-full border-2 border-slate-950' : 'rounded-2xl ring-4 ring-emerald-400/40'
                  }`}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold items-center justify-center text-3xl shadow-lg ${
                  isPro ? 'rounded-full border-2 border-slate-950' : 'rounded-2xl ring-4 ring-emerald-400/40'
                } ${liveCompanion.avatarUrl && liveCompanion.avatarUrl.trim() !== '' ? 'hidden' : 'flex'}`}
              >
                {liveCompanion.fullName.charAt(0)}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 text-white rounded-full p-1 ring-2 ring-slate-900 shadow-xs ${
                  isPro ? 'bg-blue-500' : 'bg-emerald-500'
                }`}
                title={isPro ? 'Verified Pro Companion' : 'ID Verified'}
              >
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            {/* Profile Core Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-xl sm:text-2xl font-extrabold truncate ${isPro ? 'text-amber-200' : 'text-white'}`}>
                  {liveCompanion.fullName}
                </h2>
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                    <Crown className="w-3 h-3 fill-slate-950 text-slate-950" />
                    <span>PRO MEMBER</span>
                  </span>
                )}
                <CopyUserIdButton
                  userId={liveCompanion.userToken}
                  showText={true}
                  className="font-mono text-xs text-cyan-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300 mt-1.5">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isPro ? 'text-amber-400' : 'text-cyan-400'}`} />
                  {liveCompanion.city}, {liveCompanion.state}
                </span>
                <span className="text-slate-500">•</span>
                <span>Age: <strong className="text-white">{liveCompanion.age}</strong></span>
                <span className="text-slate-500">•</span>
                <span>Gender: <strong className="text-white">{liveCompanion.gender || 'Companion'}</strong></span>
              </div>

              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ID Verified
                </span>

                {liveCompanion.reviewCount > 0 && liveCompanion.rating > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/40">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {liveCompanion.rating.toFixed(1)} ({liveCompanion.reviewCount})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-200 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-400/40">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    New
                  </span>
                )}

                <button
                  type="button"
                  onClick={toggleSave}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-rose-600 text-white border-rose-400 shadow-xs'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-rose-300 border-rose-500/40'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white text-white' : 'text-rose-400'}`} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('packages')}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    activeTab === 'packages'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <span>🎯</span>
                  <span>{companionCards.length} {companionCards.length === 1 ? 'Package' : 'Packages'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Profile Summary / Bio Snippet */}
        <div className="bg-slate-950/90 px-6 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
          <p className="line-clamp-2 italic text-slate-200">
            "{liveCompanion.bio || 'Verified companion ready for curated public outings in cafes, museums, cultural walks, and events.'}"
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-slate-400">Languages:</span>
            <span className="font-bold text-cyan-300">{liveCompanion.languages.join(', ')}</span>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950 px-3 sm:px-6 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-1.5 sm:gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'photos'
                ? isPro ? 'border-amber-400 text-amber-300' : 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span>Verified Photos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-1.5 sm:gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'packages'
                ? isPro ? 'border-amber-400 text-amber-300' : 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Activity Packages</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-slate-800 text-cyan-300">
              {companionCards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-1.5 sm:gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? isPro ? 'border-amber-400 text-amber-300' : 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 shrink-0" />
            <span>Ratings &amp; Reviews</span>
            {companionReviews.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-amber-950 text-amber-300 border border-amber-700/60">
                {companionReviews.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 bg-slate-900">

          {/* TAB 1: VERIFIED PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Public Photo Gallery</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verified companion gallery photos.
                  </p>
                </div>
                <span className="text-[11px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Verified Only
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const galleryPhotos = liveCompanion.publicGallery && liveCompanion.publicGallery.length > 0
                    ? liveCompanion.publicGallery
                    : liveCompanion.avatarUrl
                    ? [liveCompanion.avatarUrl]
                    : [];

                  if (galleryPhotos.length === 0) {
                    return (
                      <div className="col-span-2 sm:col-span-4 p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                        <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <span className="text-xs font-semibold text-slate-400 block">No public gallery photos uploaded yet</span>
                      </div>
                    );
                  }

                  return galleryPhotos.map((photoSrc, slotIndex) => (
                    <div
                      key={slotIndex}
                      className={`aspect-square rounded-2xl overflow-hidden border-2 bg-slate-950 shadow-md relative group ${
                        isPro ? 'border-amber-500/50' : 'border-slate-700'
                      }`}
                    >
                      <img
                        src={photoSrc}
                        alt={`${liveCompanion.fullName} - Photo ${slotIndex + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2 text-white">
                        <span className="text-[10px] font-bold block">
                          {slotIndex === 0 ? 'Primary Photo' : `Photo ${slotIndex + 1}`}
                        </span>
                        <span className="text-[9px] text-emerald-300 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 mt-4">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Interests &amp; Conversation Topics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(liveCompanion.interests || ['Arts & Culture', 'Specialty Coffee', 'Books', 'City Walks']).map((interest) => (
                    <span key={interest} className="text-xs font-medium text-slate-200 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVITY PACKAGES */}
          {activeTab === 'packages' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Available Activity Outing Packages ({companionCards.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any package below to directly initiate booking for public venues.
                  </p>
                </div>
              </div>

              {companionCards.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400 space-y-2">
                  <Package className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="font-semibold text-white">No Custom Packages Published</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companionCards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-4 rounded-2xl border transition-all shadow-md space-y-3 ${
                        isPro
                          ? 'bg-gradient-to-br from-amber-950/35 via-slate-950 to-slate-900 border-amber-500/50 hover:border-amber-400'
                          : 'bg-slate-950/90 border-slate-800 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-white text-sm">
                              {card.title}
                            </h4>
                            <span className="text-[10px] font-bold text-cyan-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-700/60">
                              {card.venueCategory}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5 block">
                            {card.city} • Commercial Public Venue
                          </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">Hourly Rate</span>
                            <span className={`text-sm font-extrabold font-mono ${isPro ? 'text-amber-300' : 'text-cyan-400'}`}>
                              ₹{card.hourlyRate}/hr
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRequestOuting(liveCompanion, card.id)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                              isPro
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black'
                                : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Request Outing</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {card.shortDescription}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-200">Safety Standard:</span>
                        <span className="truncate">100% Commercial Public Venue Only</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RATINGS & REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Outing Ratings &amp; Reviews</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authentic feedback written by verified Bookers.
                  </p>
                </div>
              </div>

              {companionReviews.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
                  <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-white">No Outing Reviews Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Verified client ratings and written reviews will appear here after completed outings.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companionReviews.map((review: any) => {
                    const exactComment = (review.bookerReview || review.userReview || review.review || '').trim();
                    const stars = Number(review.bookerRating || review.userRating || 5);
                    return (
                      <div
                        key={review.id}
                        className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              {review.bookerName || 'Verified Booker'}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              {review.bookerToken}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-slate-200 leading-relaxed italic bg-slate-900 p-3 rounded-xl border border-slate-800">
                          "{exactComment || `Rated ${stars} stars for this verified public outing.`}"
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>Outing Date: {review.outingDate}</span>
                          {review.activityTitle && (
                            <span className="text-cyan-400 font-semibold">
                              Package: {review.activityTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {activeTab !== 'packages' ? (
            <button
              type="button"
              onClick={() => setActiveTab('packages')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Explore {companionCards.length} Activity Packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <p className="text-xs text-slate-400">
              Select any package above to initiate a public outing request.
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


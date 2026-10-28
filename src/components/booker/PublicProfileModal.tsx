import React, { useState } from 'react';
import { UserProfile, ActivityPackageCard } from '../../types/marketplace';
import { useMarketplace } from '../../context/MarketplaceContext';
import { 
  X, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  MapPin, 
  Languages, 
  Heart, 
  CheckCircle2,
  Camera,
  Calendar,
  Lock,
  Package,
  ArrowRight,
  Building2,
  Bookmark
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
    (b) => b.companionToken === companion.userToken && b.ratingSubmitted && b.userRating
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-full sm:max-w-xl md:max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 m-2 sm:m-4 md:m-6">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 pb-5 sm:pb-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar with safe fallback (no src="" errors) */}
            <div className="relative shrink-0">
              {companion.avatarUrl && companion.avatarUrl.trim() !== '' ? (
                <img
                  src={companion.avatarUrl}
                  alt={companion.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold items-center justify-center text-3xl ring-4 ring-white/20 shadow-lg ${
                  companion.avatarUrl && companion.avatarUrl.trim() !== '' ? 'hidden' : 'flex'
                }`}
              >
                {companion.fullName.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 ring-2 ring-slate-900 shadow-xs" title="ID Verified">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            {/* Profile Core Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate">
                  {companion.fullName}
                </h2>
                <CopyUserIdButton
                  userId={companion.userToken}
                  showText={true}
                  className="font-mono text-xs text-indigo-200 bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-0.5 rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300 mt-1.5">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  {companion.city}, {companion.state}
                </span>
                <span className="text-slate-500">•</span>
                <span>Age: <strong className="text-white">{companion.age}</strong></span>
                <span className="text-slate-500">•</span>
                <span>Gender: <strong className="text-white">{companion.gender || 'Companion'}</strong></span>
              </div>

              {/* Header Badges: ID Verified, Ratings, Save Profile, and Package Count */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ID Verified
                </span>

                {companion.reviewCount > 0 && companion.rating > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/40">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {companion.rating.toFixed(1)} ({companion.reviewCount})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-200 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-400/40">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    New
                  </span>
                )}

                {/* 1.a Save Profile Toggle Button */}
                <button
                  type="button"
                  onClick={toggleSave}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-rose-500 text-white border-rose-400 shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-rose-200 border-rose-400/30'
                  }`}
                  title={isSaved ? 'Remove from Saved' : 'Save profile for later'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white text-white' : 'text-rose-300'}`} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                {/* 1.b Package Count Badge (Clickable, jumps to Activity Packages tab) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('packages')}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    activeTab === 'packages'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                      : 'bg-indigo-950/90 hover:bg-indigo-900/90 text-indigo-200 border-indigo-400/40'
                  }`}
                  title="Click to view activity packages"
                >
                  <span>🎯</span>
                  <span>{companionCards.length} {companionCards.length === 1 ? 'Package' : 'Packages'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Profile Summary / Bio Snippet */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <p className="line-clamp-1 italic text-slate-700">
            "{companion.bio || 'Verified companion ready for curated public outings in cafes, museums, cultural walks, and events.'}"
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-slate-500">Languages:</span>
            <span className="font-medium text-slate-800">{companion.languages.join(', ')}</span>
          </div>
        </div>

        {/* 2. TAB NAVIGATION (3 Clean Interactive Tabs) */}
        <div className="flex items-center border-b border-slate-200 bg-white px-3 sm:px-6 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-1.5 sm:gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'photos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
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
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Activity Packages</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'packages' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {companionCards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-1.5 sm:gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-4 h-4 shrink-0" />
            <span>Ratings & Reviews</span>
            {companion.reviewCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'reviews' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {companion.reviewCount}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body - Render Active Tab */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 bg-slate-50/40">

          {/* TAB 1: VERIFIED PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Public Photo Gallery</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-screened against government identity documents by Platform Trust & Safety.
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Verified Only
                </span>
              </div>

              {/* Unlimited Public Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const galleryPhotos = liveCompanion.publicGallery && liveCompanion.publicGallery.length > 0
                    ? liveCompanion.publicGallery
                    : liveCompanion.avatarUrl
                    ? [liveCompanion.avatarUrl]
                    : [];

                  if (galleryPhotos.length === 0) {
                    return (
                      <div className="col-span-2 sm:col-span-4 p-8 text-center bg-slate-100 rounded-2xl border border-dashed border-slate-300">
                        <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <span className="text-xs font-semibold text-slate-600 block">No public gallery photos uploaded yet</span>
                      </div>
                    );
                  }

                  return galleryPhotos.map((photoSrc, slotIndex) => (
                    <div
                      key={slotIndex}
                      className="aspect-square rounded-2xl overflow-hidden border-2 border-indigo-200 bg-slate-900 shadow-xs relative group"
                    >
                      <img
                        src={photoSrc}
                        alt={`${liveCompanion.fullName} - Photo ${slotIndex + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 text-white">
                        <span className="text-[10px] font-bold block">
                          {slotIndex === 0 ? 'Primary Photo' : `Gallery Photo ${slotIndex + 1}`}
                        </span>
                        <span className="text-[9px] text-emerald-300 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> ID Verified
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Extended Bio / Topics Info Box */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 mt-4">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Interests & Conversation Topics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(companion.interests || ['Arts & Culture', 'Specialty Coffee', 'Books', 'City Walks']).map((interest) => (
                    <span key={interest} className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVITY PACKAGES (Direct Booking From Inside Modal) */}
          {activeTab === 'packages' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Available Activity Outing Packages ({companionCards.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select any package below to directly initiate booking for public venues.
                  </p>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                  Public Venues Only
                </span>
              </div>

              {companionCards.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
                  <Package className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No Custom Packages Published</p>
                  <p>This companion has not yet published custom outing cards.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companionCards.map((card) => (
                    <div
                      key={card.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {card.title}
                            </h4>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                              {card.venueCategory}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            {card.city} • Commercial Hub
                          </span>
                        </div>

                        {/* Price & Direct Booking Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">Hourly Rate</span>
                            <span className="text-sm font-extrabold text-slate-900 font-mono">₹{card.hourlyRate}/hr</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRequestOuting(companion, card.id)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Request Outing</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {card.shortDescription}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-700">Safety Standard:</span>
                        <span className="truncate">Public commercial establishment (Cafes, art halls, food streets, malls)</span>
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
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Outing Ratings & Reviews</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Feedback submitted by verified Bookers upon completing outings.
                  </p>
                </div>

                {companion.reviewCount > 0 && companion.rating > 0 ? (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= Math.round(companion.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono font-extrabold text-amber-800">
                      {companion.rating.toFixed(1)} / 5.0
                    </span>
                    <span className="text-[10px] text-amber-700">
                      ({companion.reviewCount})
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    No Ratings Yet
                  </span>
                )}
              </div>

              {companionReviews.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 mb-1">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    New Verified Companion
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    This companion has not yet logged a completed outing review cycle. Verified client ratings and reviews will appear here after outings conclude.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companionReviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {review.bookerName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {review.bookerToken}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (review.userRating || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {review.userReview && review.userReview.trim() !== '' ? (
                        <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          "{review.userReview}"
                        </p>
                      ) : (
                        <p className="text-slate-500 italic text-[11px]">
                          Rated {review.userRating} stars for verified public outing.
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Outing Date: {review.outingDate}
                        </span>
                        {review.activityTitle && (
                          <span className="text-indigo-600 font-medium">
                            Package: {review.activityTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          {activeTab !== 'packages' ? (
            <button
              type="button"
              onClick={() => setActiveTab('packages')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Explore {companionCards.length} Activity Packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <p className="text-xs text-slate-500">
              Select any package above to initiate a public outing request.
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

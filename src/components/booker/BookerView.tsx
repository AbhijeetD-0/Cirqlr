import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMarketplace } from '../../context/MarketplaceContext';
import { UserProfile } from '../../types/marketplace';
import { BookingRequestModal } from './BookingRequestModal';
import { PublicProfileModal } from './PublicProfileModal';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Languages, 
  Package, 
  Sparkles, 
  Info, 
  Tag, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertCircle,
  ExternalLink,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check
} from 'lucide-react';
import { CopyUserIdButton } from '../common/CopyUserIdButton';

export const BookerView: React.FC = () => {
  const { 
    usersAndCompanions, 
    platformSettings, 
    currentUser,
    getCompanionActivityCards,
    activityCards,
    openAuthModal,
    setActiveTab,
    openSuspensionNotice
  } = useMarketplace();

  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<'All' | 'Female' | 'Male'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [activeCompanionForBooking, setActiveCompanionForBooking] = useState<UserProfile | null>(null);
  const [selectedCardIdForBooking, setSelectedCardIdForBooking] = useState<string | undefined>(undefined);
  const [selectedCompanionForProfile, setSelectedCompanionForProfile] = useState<UserProfile | null>(null);

  const activeFilterCount =
    (selectedGender !== 'All' ? 1 : 0) +
    (selectedCity !== 'All' ? 1 : 0) +
    (selectedCategory !== 'All' ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedGender('All');
    setSelectedCity('All');
    setSelectedCategory('All');
  };

  const handleOpenProfile = (companion: UserProfile) => {
    setSelectedCompanionForProfile(companion);
  };

  const CITIES = ['All', 'Kolkata', 'Siliguri', 'Durgapur', 'Bhubaneswar', 'Cuttack', 'Puri'];

  // STRICT EXPLORE GRID VISIBILITY RULE:
  // A companion ONLY displays if:
  // a) verificationStatus === 'ID Verified'
  // b) accountStanding === 'Active' or 'Warned'
  // c) activityCards.length > 0 (Must have created at least 1 Activity Package Card)
  // + Explicit Gender filter, City filter, and Category filter!
  const verifiedLiveCompanions = useMemo(() => {
    return usersAndCompanions.filter((comp) => {
      // Condition a: Account must be in good standing (not Suspended or Deleted_Archived)
      const isAccountGood = comp.accountStatus !== 'Suspended' && comp.accountStatus !== 'Deleted_Archived';
      if (!isAccountGood) return false;

      // Condition b: Verification check (verified OTP signup or ID document uploaded/verified)
      const hasIdDocument = Boolean((comp.documentImageUrl || comp.idDocumentUrl || '').trim());
      const isIdVerified = comp.isVerified || comp.verificationStatus === 'Verified' || comp.verificationStatus === 'ID Verified' || hasIdDocument;
      if (!isIdVerified) return false;

      const cards = getCompanionActivityCards(comp.userToken);

      // Explicit Gender Filter (Smart Default with 100% User Override)
      if (selectedGender !== 'All' && comp.gender !== selectedGender) {
        return false;
      }

      // Filter by city
      if (selectedCity !== 'All' && comp.city !== selectedCity) return false;

      // Filter by category
      if (selectedCategory !== 'All') {
        const cardHasCategory = cards.some((c) => c.venueCategory === selectedCategory);
        const profileHasCategory = comp.outingCategories?.includes(selectedCategory);
        if (!cardHasCategory && !profileHasCategory) return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = comp.fullName.toLowerCase().includes(q);
        const matchesBio = (comp.bio || '').toLowerCase().includes(q);
        const matchesCity = (comp.city || '').toLowerCase().includes(q);
        const matchesLang = (comp.languages || []).some((l) => l.toLowerCase().includes(q));
        const matchesInterests = (comp.interests || []).some((i) => i.toLowerCase().includes(q));
        const matchesAreas = (comp.serviceAreas || []).some((a) => a.toLowerCase().includes(q));
        
        const matchesCards = cards.some(
          (c) => (c.title || '').toLowerCase().includes(q) || (c.shortDescription || '').toLowerCase().includes(q)
        );

        if (!matchesName && !matchesBio && !matchesCity && !matchesLang && !matchesInterests && !matchesAreas && !matchesCards) {
          return false;
        }
      }

      return true;
    });
  }, [
    usersAndCompanions, 
    currentUser, 
    selectedGender, 
    selectedCity, 
    selectedCategory, 
    searchQuery, 
    getCompanionActivityCards,
    activityCards
  ]);

  const handleRequestOuting = (companion: UserProfile, cardId?: string) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (currentUser.accountStatus === 'Suspended') {
      openSuspensionNotice(currentUser);
      return;
    }
    if (currentUser.userToken === companion.userToken) {
      handleOpenProfile(companion);
      return;
    }
    setSelectedCompanionForProfile(null);
    setSelectedCardIdForBooking(cardId);
    setActiveCompanionForBooking(companion);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Filter and Search Bar with Clean Solid Dark Styling */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-xl space-y-3 text-white">
        {/* Search Input Row with Compact Filter Button on Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search companions by name, public topics, interests, or activity package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sleek Filter Icon Button on Right of Search Bar */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 select-none ${
              isFilterOpen || activeFilterCount > 0
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
            }`}
            title="Toggle Gender, City Hub, and Activity Filters"
            aria-expanded={isFilterOpen}
          >
            <SlidersHorizontal className="w-4 h-4 text-white shrink-0" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                {activeFilterCount}
              </span>
            )}
            {isFilterOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            )}
          </button>
        </div>

        {/* Compact Active Filter Badges Strip (when drawer is collapsed) */}
        {!isFilterOpen && activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400 animate-fadeIn">
            <span className="font-bold text-slate-300 text-xs mr-0.5">Active Filters:</span>
            {selectedGender !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/60 font-semibold">
                <Users className="w-3 h-3 text-purple-400" />
                <span>{selectedGender}</span>
                <button
                  type="button"
                  onClick={() => setSelectedGender('All')}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Remove gender filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCity !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-semibold">
                <Building2 className="w-3 h-3 text-indigo-400" />
                <span>{selectedCity}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCity('All')}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Remove city filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold">
                <Tag className="w-3 h-3 text-emerald-400" />
                <span className="truncate max-w-[150px]">{selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Remove activity filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold ml-1 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* Collapsible Modern Filter Drawer / Popover Panel */}
        {isFilterOpen && (
          <div className="pt-3 border-t border-slate-800/90 space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Filter Companions
                </span>
                {activeFilterCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply</span>
                </button>
              </div>
            </div>

            {/* Section 1: Gender Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                Gender:
              </span>
              {(['All', 'Female', 'Male'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGender(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedGender === g
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {g === 'All' ? 'All Genders' : `${g} Companions`}
                </button>
              ))}
            </div>

            {/* Section 2: City Hub Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                City Hub:
              </span>
              {CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCity === city
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Section 3: Venue Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Activity:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                All Activities
              </button>
              {platformSettings.allowedPublicVenueCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Bottom Drawer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">
                Filters update live and are saved during your session.
              </span>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Apply &amp; Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Companions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Verified Companions Live in Public Explore</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </h2>
            <span className="text-xs bg-indigo-950/80 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-700/60 shadow-xs">
              {verifiedLiveCompanions.length} verified live
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Requires Government ID Verified status to appear
          </span>
        </div>

        {verifiedLiveCompanions.length === 0 ? (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl text-white">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-indigo-700/60 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="font-bold text-white text-base">
              No Live Verified Companions Matching Filters
            </h3>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Check back later! New companions are currently undergoing identity verification and will appear here soon.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCity('All');
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setSelectedGender('All');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-700"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
            {verifiedLiveCompanions.map((companion) => {
              const cards = getCompanionActivityCards(companion.userToken);
              const minRate = cards.length > 0 
                ? Math.min(...cards.map((c) => c.hourlyRate))
                : companion.hourlyRate;

              return (
                <motion.div
                  key={companion.userToken}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="bg-slate-900 rounded-2xl border border-slate-700/80 hover:border-cyan-500/50 hover:shadow-[0_16px_40px_-10px_rgba(6,182,212,0.25)] transition-all overflow-hidden flex flex-col justify-between text-white group/card"
                >
                  <div>
                    {/* Card Header & Avatar - CLICKABLE TO OPEN PUBLIC PROFILE */}
                    <div 
                      onClick={() => handleOpenProfile(companion)}
                      className="p-5 pb-3 cursor-pointer group/profile hover:bg-slate-800/40 transition-all rounded-t-2xl relative"
                      title="Click to view full public profile & activity packages"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="relative shrink-0">
                          {companion.avatarUrl && companion.avatarUrl.trim() !== '' ? (
                            <img
                              src={companion.avatarUrl}
                              alt={companion.fullName}
                              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.5)] group-hover/profile:ring-cyan-400 transition-all"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-600 text-white font-bold items-center justify-center text-xl ring-2 ring-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.5)] group-hover/profile:ring-cyan-400 transition-all ${
                              companion.avatarUrl && companion.avatarUrl.trim() !== '' ? 'hidden' : 'flex'
                            }`}
                          >
                            {companion.fullName.charAt(0)}
                          </div>
                          <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 ring-2 ring-slate-900 shadow-sm" title="Active">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="font-bold text-white text-sm truncate group-hover/profile:text-cyan-300 transition-colors flex items-center gap-1.5">
                              <span>{companion.fullName}</span>
                              {currentUser && companion.userToken === currentUser.userToken && (
                                <span className="px-1.5 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-500/60 text-[9px] font-black uppercase tracking-wider">
                                  You
                                </span>
                              )}
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover/profile:text-cyan-300 opacity-0 group-hover/profile:opacity-100 transition-opacity" />
                            </h3>
                            <CopyUserIdButton
                              userId={companion.userToken}
                              className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 px-1.5 py-0.5 rounded shrink-0 border border-slate-700"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
                            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="font-medium truncate">{companion.city}, {companion.state}</span>
                            <span className="text-slate-500">•</span>
                            <span>Age {companion.age}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            {companion.reviewCount > 0 && companion.rating > 0 ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/60">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {companion.rating.toFixed(1)} ({companion.reviewCount})
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-700/60" title="New companion - no completed ratings yet">
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                New
                              </span>
                            )}
                            <span className="text-[10px] text-emerald-300 bg-emerald-950/70 font-semibold px-1.5 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              ID Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio snippet */}
                      <p className="text-xs text-slate-300 mt-3 leading-relaxed line-clamp-2">
                        {companion.bio}
                      </p>

                      {/* Languages */}
                      <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-slate-400">
                        <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-300">Languages:</span>
                        <span className="truncate">{companion.languages.join(', ')}</span>
                      </div>

                      {/* Activity Packages Count & Preview */}
                      <div className="mt-3 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 group-hover/profile:border-cyan-500/30 transition-colors">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-200 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-cyan-400" />
                            {cards.length} Activity Packages
                          </span>
                        </div>
                        {cards.length > 0 ? (
                          <div className="space-y-1">
                            {cards.slice(0, 2).map((c) => (
                              <div key={c.id} className="text-[11px] text-slate-300 flex items-center justify-between">
                                <span className="truncate max-w-[180px]">• {c.title}</span>
                                <span className="font-semibold text-cyan-300">₹{c.hourlyRate}/h</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Standard outing package available</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with Rate and Action */}
                  <div className="bg-slate-950/90 p-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Starting from</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-cyan-400">₹{minRate}</span>
                        <span className="text-xs text-slate-400 font-medium">/ hr</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenProfile(companion)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-700"
                        title="View Public Profile"
                      >
                        Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestOuting(companion)}
                        className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer ${
                          currentUser && companion.userToken === currentUser.userToken
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                            : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-600/30'
                        }`}
                      >
                        {currentUser && companion.userToken === currentUser.userToken ? 'Your Profile' : 'Request Outing'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Public Profile View Modal */}
      {selectedCompanionForProfile && (
        <PublicProfileModal
          companion={selectedCompanionForProfile}
          onClose={() => setSelectedCompanionForProfile(null)}
          onRequestOuting={(comp, cardId) => handleRequestOuting(comp, cardId)}
        />
      )}

      {/* Booking Modal */}
      {activeCompanionForBooking && (
        <BookingRequestModal
          companion={activeCompanionForBooking}
          initialCardId={selectedCardIdForBooking}
          onClose={() => {
            setActiveCompanionForBooking(null);
            setSelectedCardIdForBooking(undefined);
          }}
        />
      )}
    </div>
  );
};

import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { CirqlrLogo } from './CirqlrLogo';
import { 
  Compass, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  UserCheck,
  CalendarCheck,
  LogIn,
  User
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser,
    bookings,
    openProfileModal,
    openAuthModal
  } = useMarketplace();

  // Active bookings for current user as Booker
  const myBookingsCount = currentUser
    ? bookings.filter(
        (b) =>
          (b.bookerId || b.bookerToken) === currentUser.userToken &&
          b.status !== 'Completed' &&
          b.status !== 'Rejected'
      ).length
    : 0;

  const isPro = Boolean(currentUser?.isProCompanion || currentUser?.isPremiumCompanion);

  return (
    <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800/80 shadow-md">
      {/* Top regional presence & safety guarantee */}
      <div className="bg-slate-900/90 text-slate-300 text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 font-medium border-b border-slate-800/60">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white font-semibold tracking-wide">Cirqlr</span>
            <span className="text-slate-400 hidden sm:inline">• Verified Public Outing Companionship</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-slate-400 truncate">
            <span className="flex items-center gap-1 text-emerald-400 text-[10px] sm:text-[11px] truncate">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">100% Commercial Public Venues Only</span>
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-300 shrink-0">
              <MapPin className="w-3 h-3 text-indigo-400" />
              West Bengal &amp; Odisha
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* MOBILE VIEW (< md: 768px: stacked into 2 clean rows: Top brand+auth, Bottom navigation) */}
        <div className="md:hidden flex flex-col py-2.5 gap-2">
          {/* Mobile Row 1: Brand (Left) + User Profile / Log In (Right) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 shrink-0">
              <CirqlrLogo className="w-9 h-9 rounded-xl shrink-0 shadow-xs" />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Cirqlr<span className="text-indigo-400 font-bold">.</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                  Platonic
                </span>
              </div>
            </div>

            {/* User Profile / Auth Button on Mobile Header */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => openProfileModal('profile')}
                title="Click to Edit Profile & Manage Membership"
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <div className="relative">
                  {currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '' ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500 group-hover:ring-cyan-400 transition-all"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold items-center justify-center text-xs ring-2 ring-indigo-500 group-hover:ring-cyan-400 transition-all shadow-2xs ${
                      currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '' ? 'hidden' : 'flex'
                    }`}
                  >
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                    (currentUser.documentImageUrl || currentUser.idDocumentUrl) && (currentUser.isVerified || currentUser.verificationStatus === 'Verified' || currentUser.verificationStatus === 'ID Verified') ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></span>
                </div>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                  {currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'User'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Log In</span>
              </button>
            )}
          </div>

          {/* Mobile Row 2: Full-width compact scrollable navigation row */}
          <nav className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-slate-800 shadow-inner overflow-x-auto whitespace-nowrap scrollbar-none gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('explore')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'explore'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'explore' ? 'text-white' : 'text-slate-400'}`} />
              <span>Explore &amp; Book</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my-bookings')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'my-bookings'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'my-bookings' ? 'text-white' : 'text-slate-400'}`} />
              <span>My Bookings</span>
              {myBookingsCount > 0 && (
                <span className="bg-white text-indigo-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  {myBookingsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('companion-studio')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'companion-studio'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'companion-studio' ? 'text-white' : 'text-slate-400'}`} />
              <span>Studio</span>
            </button>
          </nav>
        </div>

        {/* TABLET & DESKTOP VIEW (md:flex-row single-row horizontal layout) */}
        <div className="hidden md:flex md:flex-row md:items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <CirqlrLogo className="w-10 h-10 rounded-xl shrink-0 shadow-xs" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Cirqlr<span className="text-cyan-400 font-bold">.</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                  Platonic
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block font-medium">
                Social Outings &amp; Activity Companionship
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-slate-800 shadow-inner overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('explore')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'explore'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className={`w-4 h-4 shrink-0 ${activeTab === 'explore' ? 'text-white' : 'text-slate-400'}`} />
              <span>Explore &amp; Book</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my-bookings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'my-bookings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarCheck className={`w-4 h-4 shrink-0 ${activeTab === 'my-bookings' ? 'text-white' : 'text-slate-400'}`} />
              <span>My Bookings</span>
              {myBookingsCount > 0 && (
                <span className="bg-white text-indigo-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {myBookingsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('companion-studio')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'companion-studio'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === 'companion-studio' ? 'text-white' : 'text-slate-400'}`} />
              <span>Companion Studio</span>
            </button>
          </nav>

          {/* Desktop User Profile / Auth Trigger */}
          {currentUser ? (
            <button
              type="button"
              onClick={() => openProfileModal('profile')}
              title="Click to Edit Profile & Manage Membership"
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-900 transition-all cursor-pointer group text-left"
            >
              <div className="relative">
                {currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '' ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500 group-hover:ring-cyan-400 transition-all"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold items-center justify-center text-xs ring-2 ring-indigo-500 group-hover:ring-cyan-400 transition-all shadow-2xs ${
                    currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '' ? 'hidden' : 'flex'
                  }`}
                >
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                  (currentUser.documentImageUrl || currentUser.idDocumentUrl) && (currentUser.isVerified || currentUser.verificationStatus === 'Verified' || currentUser.verificationStatus === 'ID Verified') ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></span>
              </div>
              <div className="hidden lg:block text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {currentUser.fullName}
                  </span>
                  <UserCheck className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {currentUser.userToken}
                  </span>
                  {isPro && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1 rounded">
                      PRO (30d)
                    </span>
                  )}
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Up / Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

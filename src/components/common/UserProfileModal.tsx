import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { AllowedDocumentType, UserCity } from '../../types/marketplace';
import { saveUserToSheet } from '../../services/googleSheetsService';
import { CopyUserIdButton } from './CopyUserIdButton';
import { compressImageFile } from '../../utils/imageCompressor';
import { copyToClipboard } from '../../utils/clipboard';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Save, 
  CreditCard, 
  LogOut, 
  MapPin, 
  Mail, 
  Phone, 
  Upload, 
  AlertCircle, 
  Home, 
  FileText, 
  Camera, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Clock,
  AlertTriangle,
  Gift,
  Share2,
  Copy,
  MessageSquare,
  Wallet,
  Crown,
  ShieldAlert
} from 'lucide-react';
import { useRazorpayPayment } from '../../hooks/useRazorpayPayment';

const DEFAULT_REVIEWS: Record<string, Array<{ id: string; reviewerName: string; rating: number; date: string; outingTitle: string; comment: string }>> = {
  'USR-WB-1001': [
    {
      id: 'rev-1',
      reviewerName: 'Riya das',
      rating: 5,
      date: '18 Jan 2026',
      outingTitle: 'Park Street Heritage Cafe & Bookstore Tour',
      comment: 'Priya was an exceptional companion for our afternoon cafe hopping! Super articulate, warm, and strictly kept to public guidelines. Loved the book recommendations.',
    },
    {
      id: 'rev-2',
      reviewerName: 'Sourav M.',
      rating: 5,
      date: '25 Jan 2026',
      outingTitle: 'Oxford Bookstore & Tea Lounge Discussion',
      comment: 'Great conversationalist and completely professional. 10/10 verified experience in public venue.',
    },
    {
      id: 'rev-3',
      reviewerName: 'Anindita Sen',
      rating: 5,
      date: '04 Feb 2026',
      outingTitle: 'Museum Art Walk & South Kolkata Cafe',
      comment: 'Prompt on time, polite, and made the museum gallery visit genuinely interesting.',
    },
  ],
  'USR-OD-2002': [
    {
      id: 'rev-4',
      reviewerName: 'Debashis Panda',
      rating: 5,
      date: '08 Feb 2026',
      outingTitle: 'Kala Bhoomi Crafts Museum & Cafe Conversation',
      comment: 'Ananya is deeply knowledgeable about Odisha heritage and traditional handicrafts. Fantastic public outing companion!',
    },
    {
      id: 'rev-5',
      reviewerName: 'Priyanka Das',
      rating: 5,
      date: '14 Feb 2026',
      outingTitle: 'Patia Artisan Cafe Discussion',
      comment: 'Very polite and great energy. Punctual at the meeting venue landmark.',
    },
  ],
  'USR-WB-3003': [
    {
      id: 'rev-6',
      reviewerName: 'Ayan Roy',
      rating: 5,
      date: '15 Feb 2026',
      outingTitle: 'Multiplex Cinema & Food Court Discussion',
      comment: 'Sourav was fantastic company for the weekend film screening and post-movie food court critique. Highly recommended!',
    },
  ],
};

export type ProfileTab = 'gallery_ratings' | 'edit_profile' | 'wallet_lifeline' | 'refer_earn' | 'pro';

export const UserProfileModal: React.FC = () => {
  const { 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    profileModalInitialTab,
    currentUser, 
    updateCurrentUserProfile, 
    submitAddressVerification,
    platformSettings, 
    submitProSubscriptionPayment,
    bookings,
    paymentsLedger,
    logOutUser,
    openFeedbackModal,
    deleteUserAccountAndWithdrawConsent,
    addUserWalletMoney,
  } = useMarketplace();

  // 5 Clean Navigation Tabs: 'gallery_ratings' (default) | 'edit_profile' | 'wallet_lifeline' | 'refer_earn' | 'pro'
  const [activeTab, setActiveTab] = useState<ProfileTab>('gallery_ratings');
  const [copiedReferral, setCopiedReferral] = useState<boolean>(false);

  // Wallet Top-Up Add Money State
  const [topUpAmount, setTopUpAmount] = useState<number>(250);
  const [isAddingMoney, setIsAddingMoney] = useState<boolean>(false);
  const [walletTopUpToast, setWalletTopUpToast] = useState<string | null>(null);

  // Account Deletion & Consent Withdrawal States (DPDP Act 2023)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sync initial tab when modal opens (e.g. if opened with 'subscription' prompt, switch to 'pro')
  useEffect(() => {
    if (isProfileModalOpen) {
      if (profileModalInitialTab === 'subscription') {
        setActiveTab('pro');
      } else {
        setActiveTab('gallery_ratings');
      }
    }
  }, [isProfileModalOpen, profileModalInitialTab]);

  // Profile Form Local State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [age, setAge] = useState<number | ''>(currentUser?.age || '');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Non-Binary' | 'Non-Binary / Prefer not to say'>(
    currentUser?.gender || 'Male'
  );
  const [city, setCity] = useState<UserCity>(currentUser?.city || 'Kolkata');
  const [residentialAddress, setResidentialAddress] = useState(currentUser?.residentialAddress || '');
  const [documentType, setDocumentType] = useState<AllowedDocumentType>(currentUser?.documentType || 'Voter ID Card');
  const [documentImageUrl, setDocumentImageUrl] = useState(currentUser?.documentImageUrl || currentUser?.idDocumentUrl || '');
  const [serviceAreasStr, setServiceAreasStr] = useState(
    (currentUser?.serviceAreas || []).join(', ')
  );
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [languagesStr, setLanguagesStr] = useState((currentUser?.languages || []).join(', '));
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [galleryMsg, setGalleryMsg] = useState<string | null>(null);

  // Full-size image preview lightbox modal
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Razorpay payment hook
  const { openCheckout: openProCheckout } = useRazorpayPayment();

  // Sync state when modal opens or user updates
  useEffect(() => {
    if (isProfileModalOpen && currentUser) {
      setFullName(currentUser.fullName);
      setEmail(currentUser.email || '');
      setAge(currentUser.age);
      setGender(currentUser.gender || 'Male');
      setCity(currentUser.city);
      setResidentialAddress(currentUser.residentialAddress || '');
      setDocumentType(currentUser.documentType || 'Voter ID Card');
      setDocumentImageUrl(currentUser.documentImageUrl || currentUser.idDocumentUrl || '');
      setServiceAreasStr((currentUser.serviceAreas || []).join(', '));
      setBio(currentUser.bio);
      setLanguagesStr((currentUser.languages || []).join(', '));
      setAvatarUrl(currentUser.avatarUrl || '');
      setSaveSuccess(false);
    }
  }, [isProfileModalOpen, currentUser]);

  if (!isProfileModalOpen || !currentUser) return null;

  const isPro = Boolean(currentUser.isProCompanion || currentUser.isPremiumCompanion);
  const hasIdDoc = Boolean((documentImageUrl || currentUser.documentImageUrl || currentUser.idDocumentUrl || '').trim());
  const isVerified = hasIdDoc && (currentUser.isVerified || currentUser.verificationStatus === 'Verified' || currentUser.verificationStatus === 'ID Verified');

  const basePrice = platformSettings.proSubscriptionMonthlyPrice;
  const discountPercent = platformSettings.proOccasionDiscountPercent;
  const finalPrice = discountPercent > 0
    ? Math.round(basePrice * (1 - discountPercent / 100))
    : basePrice;

  // Gallery Photos (Unlimited)
  const galleryPhotos = currentUser.publicGallery || [];

  // Handle uploading unlimited photos to public gallery
  const handleAddGalleryPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    Promise.all(files.map((file) => compressImageFile(file, 600, 600, 0.72))).then((compressedList) => {
      const validPhotos = compressedList.filter(Boolean);
      const updatedGallery = [...galleryPhotos, ...validPhotos];
      updateCurrentUserProfile({ publicGallery: updatedGallery });
      setGalleryMsg(`${validPhotos.length} photo(s) added to your Public Gallery!`);
      setTimeout(() => setGalleryMsg(null), 3000);
    });

    e.target.value = '';
  };

  const handleDeleteGalleryPhoto = (index: number) => {
    const updatedGallery = galleryPhotos.filter((_, idx) => idx !== index);
    updateCurrentUserProfile({ publicGallery: updatedGallery });
    setGalleryMsg('Photo removed from Public Gallery.');
    setTimeout(() => setGalleryMsg(null), 2500);
  };

  // Avatar file upload with client-side canvas compression
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 500, 500, 0.72);
      if (compressed) {
        setAvatarUrl(compressed);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Document photo/scan upload with instant auto-verification and client-side canvas compression
  const handleDocImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 800, 0.75);
      if (compressed) {
        setDocumentImageUrl(compressed);
        submitAddressVerification(
          currentUser.userToken,
          documentType,
          compressed,
          residentialAddress.trim() || currentUser.residentialAddress
        );
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const uploadedDataUrl = reader.result;
          setDocumentImageUrl(uploadedDataUrl);
          submitAddressVerification(
            currentUser.userToken,
            documentType,
            uploadedDataUrl,
            residentialAddress.trim() || currentUser.residentialAddress
          );
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLanguages = languagesStr
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    const parsedAreas = serviceAreasStr
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const effectiveDocImage = (documentImageUrl || currentUser.documentImageUrl || currentUser.idDocumentUrl || '').trim();
    const isNowAutoVerified = Boolean(effectiveDocImage);

    updateCurrentUserProfile({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      age: Math.max(21, Number(age)),
      gender,
      city,
      residentialAddress: residentialAddress.trim(),
      avatarUrl: avatarUrl.trim() || currentUser.avatarUrl,
      serviceAreas: parsedAreas.length > 0 ? parsedAreas : currentUser.serviceAreas,
      bio: bio.trim(),
      languages: parsedLanguages.length > 0 ? parsedLanguages : currentUser.languages,
      documentType,
      documentImageUrl: effectiveDocImage || undefined,
      idDocumentUrl: effectiveDocImage || undefined,
      isVerified: isNowAutoVerified,
      verificationStatus: isNowAutoVerified ? 'Verified' : 'Unverified',
    });

    if (effectiveDocImage && effectiveDocImage !== (currentUser.documentImageUrl || '')) {
      submitAddressVerification(
        currentUser.userToken,
        documentType,
        effectiveDocImage,
        residentialAddress.trim() || currentUser.residentialAddress
      );
    }

    // Silently dispatch updated profile details to Google Sheets webhook in background
    saveUserToSheet({
      fullName: fullName.trim() || currentUser.fullName,
      mobile: currentUser.phoneNumber,
      email: email.trim().toLowerCase() || currentUser.email,
      age: Math.max(21, Number(age)) || currentUser.age,
      gender: gender || currentUser.gender,
      city: city || currentUser.city,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  const handleSubscribePro = () => {
    openProCheckout({
      amount: finalPrice,
      currency: 'INR',
      name: 'Cirqlr by SUDARSAN HUB',
      description: 'Companion Pro 1-Month Upgrade',
      prefill: {
        name: currentUser.fullName,
        email: currentUser.email,
        contact: currentUser.phoneNumber,
      },
      notes: {
        userToken: currentUser.userToken,
        plan: 'Companion Pro (1-Month Pass)',
      },
      onSuccess: (paymentId) => {
        submitProSubscriptionPayment(currentUser.userToken, paymentId);
      },
      onError: (err) => {
        console.error('[Razorpay Upgrade Error]', err);
      },
    });
  };

  const handleWalletTopUp = () => {
    if (!topUpAmount || topUpAmount <= 0) return;
    setIsAddingMoney(true);
    setWalletTopUpToast(null);

    openProCheckout({
      amount: topUpAmount,
      currency: 'INR',
      name: 'Cirqlr Wallet Top-Up',
      description: `Add ₹${topUpAmount} Booking Credit to Cirqlr Wallet`,
      prefill: {
        name: currentUser.fullName,
        email: currentUser.email,
        contact: currentUser.phoneNumber,
      },
      notes: {
        userToken: currentUser.userToken,
        type: 'WALLET_TOPUP',
      },
      onSuccess: async (paymentId) => {
        setIsAddingMoney(false);
        try {
          await addUserWalletMoney(currentUser.userToken, topUpAmount, `Razorpay Top-Up: ${paymentId}`);
          setWalletTopUpToast(`₹${topUpAmount} added to your wallet!`);
          setTimeout(() => setWalletTopUpToast(null), 3500);
        } catch {
          setWalletTopUpToast('Failed to update balance. Please contact admin.');
          setTimeout(() => setWalletTopUpToast(null), 3500);
        }
      },
      onError: (err) => {
        setIsAddingMoney(false);
        console.error('[Wallet Top-Up Error]', err);
        setWalletTopUpToast('Payment cancelled or incomplete.');
        setTimeout(() => setWalletTopUpToast(null), 3000);
      },
    });
  };

  // Compile received reviews
  const liveReviews = bookings
    .filter(
      (b) =>
        (b.companionToken === currentUser.userToken || b.companionId === currentUser.userToken) &&
        (b.ratingSubmitted || b.bookerRatingSubmitted)
    )
    .map((b) => ({
      id: `${b.id}-comp`,
      reviewerName: b.bookerName || 'Verified Outing Booker',
      rating: b.bookerRating || b.userRating || 5,
      date: b.outingDate || new Date().toISOString().split('T')[0],
      outingTitle: b.activityTitle || 'Verified Social Outing',
      comment: b.bookerReview || b.userReview || 'Excellent companion, polite demeanor, and strictly adhered to public venue guidelines.',
    }));

  const seedReviews = DEFAULT_REVIEWS[currentUser.userToken] || [];
  const allReviews = liveReviews.length > 0 ? liveReviews : seedReviews;

  const avgRating = currentUser.rating > 0 
    ? currentUser.rating.toFixed(1) 
    : allReviews.length > 0 
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1) 
    : '5.0';

  const totalReviewsCount = currentUser.reviewCount > 0 ? currentUser.reviewCount : allReviews.length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-xl md:max-w-3xl overflow-hidden shadow-2xl border border-slate-800 text-slate-100 flex flex-col max-h-[92vh] m-2 sm:m-4 md:m-6">
          
          {/* ========================================================= */}
          {/* TOP HEADER: Profile Photo, Name, USR ID, Verification, Pro */}
          {/* ========================================================= */}
          <div className="bg-slate-950/90 text-white px-5 sm:px-7 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="relative shrink-0">
                {currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '' ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className={`w-12 h-12 rounded-2xl object-cover ring-2 ${isVerified ? 'ring-emerald-400' : 'ring-amber-400'} shadow-md`}
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-white font-extrabold flex items-center justify-center text-lg ring-2 ${isVerified ? 'ring-emerald-400' : 'ring-amber-400'} shadow-md`}
                  >
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-slate-950 ${isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-white truncate">
                    {currentUser.fullName}
                  </h3>
                  <CopyUserIdButton
                    userId={currentUser.userToken}
                    showText={true}
                    className="text-[10px] font-mono text-cyan-300 bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700/80"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Verification Status Badge */}
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-600/60 shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified ID</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit_profile')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 hover:bg-amber-900/80 px-2.5 py-0.5 rounded-full border border-amber-600/60 transition-colors cursor-pointer"
                      title="Click to open Edit Profile and upload your government ID"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unverified (Upload ID)</span>
                    </button>
                  )}

                  {/* Companion Pro Status Pill */}
                  {isPro ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('pro')}
                      className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/50 cursor-pointer"
                      title="View active Pro membership perks"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>PRO (Unlimited Cards)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('pro')}
                      className="inline-flex items-center gap-1 bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-600/60 cursor-pointer transition-colors"
                      title="View & Upgrade to Companion Pro 1-Month Pass"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Upgrade to Pro (₹{finalPrice})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  openFeedbackModal();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                title="Give feedback about your platform experience"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Give Feedback</span>
              </button>

              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SLEEK 5-TAB HORIZONTAL GLASSY TAB BAR                     */}
          {/* ========================================================= */}
          <div className="bg-slate-950/90 px-3 sm:px-6 py-2.5 border-b border-slate-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('gallery_ratings')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'gallery_ratings'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-900/40'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>📸</span>
              <span>Gallery &amp; Ratings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('edit_profile')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'edit_profile'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-900/40'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>⚙️</span>
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wallet_lifeline')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'wallet_lifeline'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>💳</span>
              <span>Wallet &amp; Lifeline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('refer_earn')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'refer_earn'
                  ? 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white shadow-md shadow-amber-900/40'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🎁</span>
              <span>Refer &amp; Earn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pro')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'pro'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>👑</span>
              <span>Upgrade to Pro</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* SCROLLABLE MODAL BODY (3-Part Hub)                        */}
          {/* ========================================================= */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

            {saveSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile updated & auto-verified successfully! Changes are live across the platform.</span>
              </div>
            )}

            {galleryMsg && (
              <div className="p-3 bg-indigo-950/80 border border-indigo-700/60 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{galleryMsg}</span>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 1: 📸 GALLERY & RATINGS (DEFAULT ACTIVE TAB)             */}
            {/* ============================================================= */}
            {activeTab === 'gallery_ratings' && (
              <div className="space-y-6 animate-fadeIn">
                {/* ------------------------------------------------------------- */}
                {/* SECTION 1: MY PUBLIC GALLERY (UNLIMITED PHOTOS)               */}
                {/* ------------------------------------------------------------- */}
                <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-bold text-white">
                          My Public Gallery (Unlimited Photos)
                        </h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-indigo-950/80 text-cyan-300 border-indigo-700/60">
                          {galleryPhotos.length} {galleryPhotos.length === 1 ? 'Photo' : 'Photos'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Upload as many verified public outing photos as you want. Visible to Bookers exploring your profile.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor="profile-gallery-upload-input"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>+ Add Photos</span>
                      </label>
                      <input
                        id="profile-gallery-upload-input"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddGalleryPhotos}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Responsive Photo Grid */}
                  {galleryPhotos.length === 0 ? (
                    <label
                      htmlFor="profile-gallery-upload-input"
                      className="p-8 text-center bg-slate-800/40 hover:bg-slate-800/60 rounded-xl border border-dashed border-slate-700/80 hover:border-cyan-500/60 transition-all cursor-pointer block"
                    >
                      <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-white">No Public Gallery Photos Added Yet</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                        Click <strong>+ Add Photos</strong> above to upload candid outing pictures, hobby snapshots, or cafe visits.
                      </p>
                    </label>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {galleryPhotos.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-md relative group"
                        >
                          <img
                            src={photoUrl}
                            alt={`Gallery Photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-95 transition-opacity p-2.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20">
                                Photo {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteGalleryPhoto(idx)}
                                title="Delete photo"
                                className="w-6 h-6 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Live</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => setLightboxImageUrl(photoUrl)}
                                className="text-[10px] text-cyan-300 hover:text-white bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Zoom</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ------------------------------------------------------------- */}
                {/* SECTION 2: MY RATINGS & REVIEWS RECEIVED                      */}
                {/* ------------------------------------------------------------- */}
                <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <h4 className="text-sm font-bold text-white">
                          My Ratings &amp; Reviews Received
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Authentic feedback from verified public outing participants.
                      </p>
                    </div>

                    {/* Score Summary Box */}
                    <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                      <div className="flex items-center gap-1 text-amber-400 font-extrabold text-base">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{avgRating}</span>
                      </div>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs font-semibold text-slate-300">
                        {totalReviewsCount} {totalReviewsCount === 1 ? 'Review' : 'Reviews'}
                      </span>
                    </div>
                  </div>

                  {/* Scrollable list of individual reviews */}
                  {allReviews.length === 0 ? (
                    <div className="p-6 text-center bg-slate-800/40 rounded-xl border border-dashed border-slate-700/80">
                      <Star className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-300">No Outing Ratings Received Yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ratings and reviews will appear here automatically when bookers or companions complete outings with you.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {allReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-slate-800/50 rounded-xl border border-slate-700/60 p-3.5 space-y-1.5 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {rev.reviewerName}
                              </span>
                              <span className="text-[10px] bg-slate-900 text-cyan-300 border border-slate-700 px-2 py-0.2 rounded-full font-mono">
                                Verified Outing
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <div className="flex items-center text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                                  />
                                ))}
                              </div>
                              <span>•</span>
                              <span>{rev.date}</span>
                            </div>
                          </div>

                          <div className="text-[11px] font-semibold text-cyan-400">
                            Outing: {rev.outingTitle}
                          </div>

                          <p className="text-xs text-slate-300 italic leading-relaxed">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: 🎁 REFER & EARN (5% FEE WAIVER REWARD CARD)            */}
            {/* ============================================================= */}
            {activeTab === 'refer_earn' && (() => {
              const referralCode = currentUser.referralCode || `REF-${currentUser.userToken.replace('USR-', '')}`;
              const totalReferrals = currentUser.totalReferrals || 0;
              const referralCredits = currentUser.referralCredits || 0;
              const isAmbassador = Boolean(currentUser.isCommunityAmbassador || totalReferrals > 0);

              const handleCopyCode = async () => {
                await copyToClipboard(referralCode);
                setCopiedReferral(true);
                setTimeout(() => setCopiedReferral(false), 2000);
              };

              const shareText = encodeURIComponent(
                `Join me on Cirqlr - India's 100% Platonic & Government-ID Verified Social Outing Network! Use my referral code ${referralCode} when registering: ${typeof window !== 'undefined' ? window.location.origin : 'https://cirqlr.app'}`
              );
              const waShareUrl = `https://api.whatsapp.com/send?text=${shareText}`;

              return (
                <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-indigo-950/40 rounded-2xl border border-indigo-700/40 p-5 shadow-xl space-y-4 relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                        <Gift className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            🎁 Refer &amp; Earn (5% Fee Waiver)
                          </h4>
                          {isAmbassador && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-600/60 shadow-xs flex items-center gap-1">
                              <span>🌟</span>
                              <span>Community Ambassador</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Share your code with friends to unlock 5% acceptance fee waivers on upcoming outings.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2 Live Counters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-center space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Total Friends Referred
                      </span>
                      <span className="text-xl font-extrabold text-cyan-400 font-mono">
                        {totalReferrals}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Joined using your code</span>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-center space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Available 5% Discount Credits
                      </span>
                      <span className="text-xl font-extrabold text-emerald-400 font-mono">
                        {referralCredits}
                      </span>
                      <span className="text-[10px] text-slate-500 block">1 credit = 5% waiver on 1 outing</span>
                    </div>
                  </div>

                  {/* Referral Code Box & Action Buttons */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <span className="text-xs text-slate-400 font-medium">Your Unique Code:</span>
                      <span className="bg-slate-900 border border-indigo-700/60 text-cyan-300 font-mono font-extrabold text-sm px-3.5 py-1.5 rounded-xl tracking-wider select-all shadow-inner">
                        {referralCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700 shadow-xs"
                      >
                        {copiedReferral ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>

                      <a
                        href={waShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Explanatory Policy Footnote */}
                  <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                    💡 <strong>Zero-Loss Fairness Rule:</strong> Each referral credit provides a flat 5% waiver on your platform acceptance fee when accepting an outing. Apply it dynamically from your wallet during booking acceptance.
                  </p>
                </div>
              );
            })()}

            {/* ============================================================= */}
            {/* TAB 3: 💳 WALLET & LIFELINE (FEE REFUND CREDIT & LIFELINE)    */}
            {/* ============================================================= */}
            {activeTab === 'wallet_lifeline' && (() => {
              const creditBalance = currentUser.cancellationCreditBalance || 0;
              const lifelineUsed = currentUser.monthlyLifelineUsed || 0;
              const lifelinesRemaining = Math.max(0, 1 - lifelineUsed);
              const walletHistory = currentUser.walletHistory || [];

              return (
                <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-emerald-950/40 rounded-2xl border border-emerald-700/40 p-5 shadow-xl space-y-4 relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                        <Wallet className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>💳 Booking Fee Credit &amp; Lifeline Wallet</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Automated protection tracking refunded platform fees and monthly emergency cancellation lifelines.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2 Live Counters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 text-center space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Available Fee Refund Credit
                      </span>
                      <span className="text-2xl font-black text-cyan-400 font-mono">
                        ₹{creditBalance}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Apply to next booking or save for later via Razorpay choice
                      </span>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 text-center space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Monthly Emergency Lifeline
                      </span>
                      <span className={`text-2xl font-black font-mono ${
                        lifelinesRemaining > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {lifelinesRemaining} / 1 Available this month
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {lifelineUsed >= 1 
                          ? '1 emergency cancellation already used this month' 
                          : '1 penalty-free cancellation available (>3h before meetup)'}
                      </span>
                    </div>
                  </div>

                  {/* 💰 Instant Wallet Top-Up / Add Money Panel */}
                  <div className="bg-slate-950/90 border border-emerald-800/60 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">
                          Add Money / Top Up Wallet
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                        Instant Razorpay Gateway
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Add funds to your Cirqlr balance to automatically pay booking acceptance fees or cover emergency cancellation deposits with zero friction.
                    </p>

                    {walletTopUpToast && (
                      <div className="p-2.5 bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{walletTopUpToast}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {[100, 250, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTopUpAmount(amt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            topUpAmount === amt
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-600'
                          }`}
                        >
                          +₹{amt}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          min={50}
                          max={50000}
                          value={topUpAmount || ''}
                          onChange={(e) => setTopUpAmount(Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="Custom Amount"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleWalletTopUp}
                        disabled={isAddingMoney || !topUpAmount || topUpAmount <= 0}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isAddingMoney ? 'Opening Razorpay...' : `Add ₹${topUpAmount || 0} to Wallet`}</span>
                      </button>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* 📜 MY PAYMENT & WALLET TRANSACTION HISTORY                    */}
                  {/* ------------------------------------------------------------- */}
                  {(() => {
                    interface CombinedFinancialTxn {
                      id: string;
                      refId: string;
                      type: string;
                      badgeStyle: string;
                      amount: number;
                      isCredit: boolean;
                      details: string;
                      timestamp: string;
                    }

                    const combinedTransactions: CombinedFinancialTxn[] = [];

                    // 1. Wallet credits and debits from user.walletHistory
                    (currentUser.walletHistory || []).forEach((w) => {
                      const isCredit = w.type === 'credit';
                      combinedTransactions.push({
                        id: w.id,
                        refId: w.paymentReferenceId || w.id,
                        type: isCredit ? 'Wallet Credit Added' : 'Wallet Credit Redeemed',
                        badgeStyle: isCredit
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600/70'
                          : 'bg-rose-950 text-rose-300 border-rose-600/70',
                        amount: w.amount,
                        isCredit,
                        details: w.reason,
                        timestamp: w.timestamp,
                      });
                    });

                    // 2. Gateway payments from paymentsLedger (unified canonical paymentReferenceId)
                    (paymentsLedger || [])
                      .filter((p) => p.companionToken === currentUser.userToken || p.bookerToken === currentUser.userToken)
                      .forEach((p) => {
                        const isPro = p.type === '1-Month Pro Subscription';
                        const isBookerUser = p.bookerToken === currentUser.userToken && p.companionToken !== currentUser.userToken;
                        combinedTransactions.push({
                          id: p.id,
                          refId: p.paymentReferenceId || p.razorpayRefId || p.id,
                          type: isPro ? 'Cirqlr Pro Paid' : (isBookerUser ? 'Outing Fee Recorded' : 'Acceptance Fee Paid'),
                          badgeStyle: isPro
                            ? 'bg-purple-950 text-purple-300 border-purple-600/70'
                            : isBookerUser
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600/70'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-600/70',
                          amount: p.feeAmount,
                          isCredit: false,
                          details: isPro
                            ? 'Companion Pro 1-Month Unlimited Pass'
                            : `${p.outingTitle || 'Outing Acceptance'} (${p.status})`,
                          timestamp: p.timestamp,
                        });
                      });

                    // Sort newest first
                    combinedTransactions.sort(
                      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );

                    return (
                      <div className="space-y-3 pt-3 border-t border-slate-800/80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>📜 My Payment &amp; Wallet Transaction History</span>
                            </span>
                            <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-700 text-cyan-300 font-mono">
                              {combinedTransactions.length} Event{combinedTransactions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Real-time Razorpay payments, fee waivers &amp; wallet credits
                          </span>
                        </div>

                        {combinedTransactions.length === 0 ? (
                          <div className="p-5 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                            No financial transactions or wallet credits recorded yet. When you accept bookings, pay acceptance fees, or receive cancellation fee credits, they will appear chronologically here.
                          </div>
                        ) : (
                          <div className="border border-slate-800/90 rounded-xl overflow-hidden bg-slate-950/80">
                            <div className="overflow-x-auto max-h-64 scrollbar-thin">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800 sticky top-0">
                                  <tr>
                                    <th className="py-2.5 px-3">Date &amp; Time</th>
                                    <th className="py-2.5 px-3">Reference / Txn ID</th>
                                    <th className="py-2.5 px-3">Type</th>
                                    <th className="py-2.5 px-3">Details / Outing</th>
                                    <th className="py-2.5 px-3 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-medium">
                                  {combinedTransactions.map((tx) => (
                                    <tr
                                      key={tx.id}
                                      className="hover:bg-slate-900/50 transition-colors text-slate-200"
                                    >
                                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                                        {new Date(tx.timestamp).toLocaleString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </td>
                                      <td className="py-2.5 px-3 whitespace-nowrap text-[10px] font-mono text-cyan-300 font-bold">
                                        {tx.refId}
                                      </td>
                                      <td className="py-2.5 px-3 whitespace-nowrap">
                                        <span
                                          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${tx.badgeStyle}`}
                                        >
                                          {tx.type}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-xs truncate">
                                        {tx.details}
                                      </td>
                                      <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-bold text-xs">
                                        <span
                                          className={
                                            tx.isCredit ? 'text-emerald-400' : 'text-cyan-300'
                                          }
                                        >
                                          {tx.isCredit ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Anti-Abuse & Zero-Loss Rule Footnote */}
                  <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                    💡 <strong>Protection &amp; Fairness Policy:</strong> If a Booker cancels a confirmed outing, 100% of your paid Platform Fee is immediately credited to your Fee Wallet with zero lifeline deduction. If you cancel an outing with &gt;3 hours notice, your 1/1 Monthly Emergency Lifeline safeguards your fee as reusable credit for future bookings.
                  </p>
                </div>
              );
            })()}

            {/* ============================================================= */}
            {/* TAB 2: ⚙️ EDIT PROFILE & ACCOUNT SETTINGS                     */}
            {/* ============================================================= */}
            {activeTab === 'edit_profile' && (
              <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-900/80 animate-fadeIn">
                <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                      <span>⚙️</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Account Settings &amp; Edit Profile
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Edit personal details, update bio, and manage government address verification ID
                      </p>
                    </div>
                  </div>
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
                      ✓ Profile Saved
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 space-y-5">
                  
                  {/* 1. Upload / Change Profile Picture */}
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span>Profile Picture</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Native file upload (JPG, PNG, WebP)</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {avatarUrl && avatarUrl.trim() !== '' ? (
                        <img
                          src={avatarUrl}
                          alt="Profile Preview"
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-500 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xl ring-2 ring-slate-700 shrink-0">
                          {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            htmlFor="user-native-avatar-upload"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload / Change Photo</span>
                          </label>
                          <input
                            id="user-native-avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                            className="hidden"
                          />
                          {avatarUrl && avatarUrl !== currentUser.avatarUrl && (
                            <span className="text-[11px] text-emerald-300 font-semibold bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              New photo loaded
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Upload from your device. Displays on Explore profile cards.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Legal Name, Age (21+) & Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        Age (21+ Strict)
                      </label>
                      <input
                        type="number"
                        min={21}
                        max={85}
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Non-Binary / Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Gmail & Verified Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Registered Gmail Address</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified Mobile Number</span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value={currentUser.phoneNumber}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono cursor-not-allowed select-all"
                      />
                    </div>
                  </div>

                  {/* 4. Primary Regional Hub & Preferred Areas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        Primary Regional Hub
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value as UserCity)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Kolkata">Kolkata (West Bengal)</option>
                        <option value="Siliguri">Siliguri (West Bengal)</option>
                        <option value="Durgapur">Durgapur (West Bengal)</option>
                        <option value="Bhubaneswar">Bhubaneswar (Odisha)</option>
                        <option value="Cuttack">Cuttack (Odisha)</option>
                        <option value="Puri">Puri (Odisha)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Preferred Outing Hubs / Areas</span>
                      </label>
                      <input
                        type="text"
                        value={serviceAreasStr}
                        onChange={(e) => setServiceAreasStr(e.target.value)}
                        placeholder="e.g. Park Street, South City, Saheed Nagar"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* 5. Full Residential Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Full Residential Address</span>
                    </label>
                    <textarea
                      rows={2}
                      value={residentialAddress}
                      onChange={(e) => setResidentialAddress(e.target.value)}
                      placeholder="Flat / House No., Street, Area, Landmark, PIN code"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
                      required
                    />
                  </div>

                  {/* 6. Spoken Languages */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Spoken Languages (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={languagesStr}
                      onChange={(e) => setLanguagesStr(e.target.value)}
                      placeholder="Bengali, English, Hindi, Odia"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* 7. Public Bio */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Public Bio &amp; Topics of Conversation
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
                      required
                    />
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* ADDRESS VERIFICATION (GOVERNMENT ID) - 100% AUTOMATED & TRANSPARENT */}
                  {/* ------------------------------------------------------------- */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Address &amp; Government ID Verification
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Automatic instant verification: Uploading your document immediately makes your profile live in Explore.
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
                        hasIdDoc
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      }`}>
                        {hasIdDoc ? 'Verified ID (Live in Explore)' : 'Unverified (ID Required)'}
                      </span>
                    </div>

                    {/* Document Type Selector (Voter ID / Driving License / PAN Card ONLY - NO document ID number input!) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Government Document Type
                      </label>
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value as AllowedDocumentType)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Voter ID Card">Voter ID Card</option>
                        <option value="Driving License">Driving License</option>
                        <option value="PAN Card">PAN Card</option>
                      </select>
                    </div>

                    {/* Transparency Preview: Currently Uploaded ID Document */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Uploaded Government ID Document
                      </label>

                      {documentImageUrl ? (
                        <div className="bg-slate-900 rounded-2xl border border-slate-700/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                              <img
                                src={documentImageUrl}
                                alt="ID Document Scan"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">
                                {documentType} On File
                              </span>
                              <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Verified &amp; Active</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setLightboxImageUrl(documentImageUrl)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Full Document</span>
                            </button>

                            <label
                              htmlFor="user-replace-doc-upload"
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Replace</span>
                            </label>
                            <input
                              id="user-replace-doc-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleDocImageChange}
                              className="hidden"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-950/40 border border-dashed border-amber-600/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                            <div>
                              <span className="text-xs font-bold text-amber-200 block">
                                No Government ID Document Uploaded Yet
                              </span>
                              <span className="text-[10px] text-amber-300/80">
                                Upload a photo of your Voter ID, Driving License, or PAN Card to verify your account immediately.
                              </span>
                            </div>
                          </div>

                          <label
                            htmlFor="user-new-doc-upload"
                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-md"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload ID Document</span>
                          </label>
                          <input
                            id="user-new-doc-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleDocImageChange}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Bottom Actions: Save Profile */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <p className="text-[11px] text-slate-400">
                      Changes update your public companion card immediately.
                    </p>

                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/40 cursor-pointer active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>

                {/* ============================================================= */}
                {/* 🔒 DELETE ACCOUNT & WITHDRAW CONSENT (DPDP ACT 2023 1-YR HOLD) */}
                {/* ============================================================= */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-950/30 via-slate-900/80 to-slate-950 border-t border-rose-900/40 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-950/90 border border-rose-700/60 flex items-center justify-center text-rose-400 shrink-0">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-rose-200">
                            Delete Account &amp; Withdraw Consent
                          </h5>
                          <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800/80 px-2 py-0.5 rounded-full font-mono font-semibold">
                            DPDP Act 2023
                          </span>
                        </div>
                        {!showDeleteConfirm && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setDeleteError(null);
                            }}
                            className="px-3.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shrink-0"
                          >
                            Delete Account
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Under India'''s Digital Personal Data Protection (DPDP) Act 2023 and the Information Technology Act 2000, you may revoke consent and delete your account. Your profile and companion packages will be immediately removed from Public Explore.
                      </p>

                      <div className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Statutory 1-Year Legal Archive Hold (365 Days):</span>
                        </div>
                        <p className="pl-5 text-slate-400">
                          • <strong>Immediate Public Removal:</strong> Your profile, contact records, and activity packages are deleted from Public Explore immediately, and your session is terminated.
                        </p>
                        <p className="pl-5 text-slate-400">
                          • <strong>Safety &amp; Compliance Freeze:</strong> To prevent fraud and comply with statutory incident review, verified account credentials enter a 365-day legal archive hold.
                        </p>
                        <p className="pl-5 text-slate-400">
                          • <strong>Automated 1-Year Purge:</strong> Once the 365-day hold period concludes, all data is automatically and permanently purged with zero manual action required.
                        </p>
                      </div>

                      {deleteError && (
                        <div className="p-3 bg-rose-950/90 border border-rose-600 rounded-xl text-xs text-rose-200 flex items-start gap-2 animate-shake">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{deleteError}</span>
                        </div>
                      )}

                      {showDeleteConfirm && (
                        <div className="mt-3 p-4 bg-rose-950/40 border border-rose-700/80 rounded-xl space-y-3 animate-fadeIn">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-rose-200 block">
                              Optional Deletion Reason / Feedback:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Relocating to new city, taking a break, privacy preferences..."
                              value={deleteReason}
                              onChange={(e) => setDeleteReason(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-rose-800/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-rose-900/60">
                            <span className="text-[11px] text-rose-300 font-medium">
                              Are you sure? You will be logged out and public profile hidden immediately.
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDeleteConfirm(false);
                                  setDeleteError(null);
                                }}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setIsDeleting(true);
                                  const res = deleteUserAccountAndWithdrawConsent(deleteReason.trim() || undefined);
                                  setIsDeleting(false);
                                  if (!res.success) {
                                    setDeleteError(res.error || 'Failed to delete account.');
                                  }
                                }}
                                disabled={isDeleting}
                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                              >
                                {isDeleting ? 'Archiving...' : 'Yes, Delete My Account'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 5: 👑 UPGRADE TO PRO (CIRQLR PRO MEMBERSHIP)              */}
            {/* ============================================================= */}
            {activeTab === 'pro' && (
              <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-amber-950/30 rounded-2xl border border-amber-600/40 p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden animate-fadeIn">
                <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/50">
                      <Crown className="w-5 h-5 text-slate-950 fill-slate-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-white">
                          Cirqlr Pro Companion
                        </h4>
                        {isPro ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider">
                            Active Member
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/60">
                            ₹{finalPrice}/month
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Stand out with gold verification, zero platform commission, and premier client visibility.
                      </p>
                    </div>
                  </div>

                  {isPro ? (
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pro Privileges Active</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubscribePro}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-950/60 cursor-pointer active:scale-95 shrink-0"
                    >
                      <Crown className="w-4 h-4 fill-slate-950" />
                      <span>Upgrade to Pro (₹{finalPrice})</span>
                    </button>
                  )}
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3">
                    <span className="text-xl">👑</span>
                    <div>
                      <h5 className="text-xs font-bold text-white">Exclusive Gold Pro Badge</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Display a verified golden crown badge on your companion profile and search results.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3">
                    <span className="text-xl">🚀</span>
                    <div>
                      <h5 className="text-xs font-bold text-white">Top Discovery Placement</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Rank at the top of Booker search filters in your city for 3x higher outing bookings.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <h5 className="text-xs font-bold text-white">Priority Concierge Support</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        24/7 direct WhatsApp safety assistance &amp; expedited verification checks.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3">
                    <span className="text-xl">⚡</span>
                    <div>
                      <h5 className="text-xs font-bold text-white">Unlimited Gallery &amp; Custom Bio</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Showcase high-resolution photos and detailed outing specialties without restrictions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pro pricing note */}
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Billed monthly at ₹{finalPrice} • Cancel anytime from your account settings.
                  </span>
                  {!isPro && (
                    <button
                      type="button"
                      onClick={handleSubscribePro}
                      className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      Subscribe Now →
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="px-5 sm:px-7 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  logOutUser();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/80 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Platform Safety: Strictly 21+ &amp; Public Venues Only</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  openFeedbackModal();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Give Feedback</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULL-SIZE IMAGE LIGHTBOX MODAL (FOR ID SCANS & GALLERY)   */}
      {/* ========================================================= */}
      {lightboxImageUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Full-Resolution Document / Photo View</span>
              </span>
              <button
                type="button"
                onClick={() => setLightboxImageUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh] bg-black/50">
              <img
                src={lightboxImageUrl}
                alt="Full View"
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

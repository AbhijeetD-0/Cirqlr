import React, { useState, useEffect, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { AllowedDocumentType, UserCity } from '../../types/marketplace';
import { saveUserToSheet } from '../../services/googleSheetsService';
import { CopyUserIdButton } from './CopyUserIdButton';
import { compressImageFile } from '../../utils/imageCompressor';
import { copyToClipboard } from '../../utils/clipboard';
import { validateIdNumber } from '../../utils/idValidator';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Save, 
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
  Star, 
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

export type ProfileTab = 'gallery_ratings' | 'edit_profile' | 'wallet_lifeline' | 'refer_earn' | 'pro';

// Reliable Government ID Number validator supporting PAN, Voter ID, and Indian Driving License (including DigiLocker formats)
const isValidGovIdFormat = (docType: AllowedDocumentType, rawId: string): { isValid: boolean; error?: string } => {
  const clean = (rawId || '').trim().toUpperCase().replace(/[\s-]/g, '');
  if (!clean) {
    return { isValid: false, error: 'Please enter your Government ID Number.' };
  }
  if (docType === 'PAN Card') {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean)) {
      return { isValid: false, error: 'Invalid PAN format. Expected format: ABCDE1234F' };
    }
    return { isValid: true };
  }
  if (docType.includes('Voter')) {
    if (!/^[A-Z]{3}[0-9]{7}$/.test(clean)) {
      return { isValid: false, error: 'Invalid Voter ID (EPIC) format. Expected format: ABC1234567' };
    }
    return { isValid: true };
  }
  // Driving License: e.g. WB17 20250001080 or WB0120180012345 (2 state letters + 13 digits/alphanumeric)
  if (!/^[A-Z]{2}[0-9A-Z]{11,15}$/.test(clean)) {
    const fallback = validateIdNumber(docType, rawId);
    if (!fallback.isValid) {
      return { isValid: false, error: 'Invalid Driving License number. Expected format: WB17 20250001080' };
    }
  }
  return { isValid: true };
};

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
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<ProfileTab>('gallery_ratings');
  const [copiedReferral, setCopiedReferral] = useState<boolean>(false);

  // Account Deletion & Consent Withdrawal States (DPDP Act 2023)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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
  const [documentImageUrl, setDocumentImageUrl] = useState(currentUser?.idDocumentImage || currentUser?.idProofUrl || currentUser?.documentImageUrl || currentUser?.idDocumentUrl || '');
  const [documentIdNumber, setDocumentIdNumber] = useState(currentUser?.idDocumentNumber || currentUser?.documentIdNumber || '');
  const [docValidationError, setDocValidationError] = useState<string | null>(null);
  const [isValidatingDoc, setIsValidatingDoc] = useState<boolean>(false);
  const [serviceAreasStr, setServiceAreasStr] = useState(
    (currentUser?.serviceAreas || []).join(', ')
  );
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [languagesStr, setLanguagesStr] = useState((currentUser?.languages || []).join(', '));
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [galleryMsg, setGalleryMsg] = useState<string | null>(null);

  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const { openCheckout: openProCheckout } = useRazorpayPayment();

  const prevModalOpenRef = useRef(false);
  const activeUserTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const isOpening = isProfileModalOpen && !prevModalOpenRef.current;
    const isUserSwitched = currentUser && currentUser.userToken !== activeUserTokenRef.current;

    if (isProfileModalOpen && currentUser && (isOpening || isUserSwitched)) {
      activeUserTokenRef.current = currentUser.userToken;
      setFullName(currentUser.fullName);
      setEmail(currentUser.email || '');
      setAge(currentUser.age);
      setGender(currentUser.gender || 'Male');
      setCity(currentUser.city);
      setResidentialAddress(currentUser.residentialAddress || '');
      setDocumentType(currentUser.documentType || 'Voter ID Card');
      setDocumentImageUrl(currentUser.idDocumentImage || currentUser.idProofUrl || currentUser.documentImageUrl || currentUser.idDocumentUrl || '');
      setDocumentIdNumber(currentUser.idDocumentNumber || currentUser.documentIdNumber || '');
      setDocValidationError(null);
      setServiceAreasStr((currentUser.serviceAreas || []).join(', '));
      setBio(currentUser.bio);
      setLanguagesStr((currentUser.languages || []).join(', '));
      setAvatarUrl(currentUser.avatarUrl || '');
      setSaveSuccess(false);
    }
    prevModalOpenRef.current = isProfileModalOpen;
  }, [isProfileModalOpen, currentUser?.userToken]);

  if (!isProfileModalOpen || !currentUser) return null;

  const isPro = Boolean(currentUser.isProCompanion || currentUser.isPremiumCompanion);
  const hasUploadedDoc = Boolean(
    (currentUser.idDocumentImage || currentUser.idProofUrl || currentUser.documentImageUrl || currentUser.idDocumentUrl || '').trim() &&
    (currentUser.idDocumentNumber || currentUser.documentIdNumber || '').trim()
  );
  const isVerified = Boolean(
    currentUser.verificationStatus !== 'Rejected' &&
    (currentUser.isVerified || currentUser.verificationStatus === 'Verified' || hasUploadedDoc)
  );

  const basePrice = platformSettings.proSubscriptionMonthlyPrice;
  const discountPercent = platformSettings.proOccasionDiscountPercent;
  const finalPrice = discountPercent > 0
    ? Math.round(basePrice * (1 - discountPercent / 100))
    : basePrice;

  const galleryPhotos = currentUser.publicGallery || [];

  const handleAddGalleryPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    Promise.all(files.map((file) => compressImageFile(file, 600, 600, 0.6))).then((compressedList) => {
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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 500, 500, 0.6);
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

  // Reliable Document Upload (Supports DigiLocker & Camera Photos without false OCR rejection)
  const handleDocImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocValidationError(null);

    if (!file.type.startsWith('image/')) {
      setDocValidationError('Please upload a valid image file (JPG, PNG, or WebP) of your Government ID.');
      e.target.value = '';
      return;
    }

    setIsValidatingDoc(true);
    try {
      const compressed = await compressImageFile(file, 600, 600, 0.6);
      if (compressed) {
        setDocumentImageUrl(compressed);
        if (documentIdNumber.trim()) {
          const numVal = isValidGovIdFormat(documentType, documentIdNumber);
          if (numVal.isValid) {
            submitAddressVerification(
              currentUser.userToken,
              documentType,
              compressed,
              residentialAddress.trim() || currentUser.residentialAddress,
              documentIdNumber.trim().toUpperCase()
            );
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
          } else {
            setDocValidationError(numVal.error || 'Please enter a valid Government ID number above.');
          }
        }
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setDocumentImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsValidatingDoc(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocValidationError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setDocValidationError('Full Legal Name cannot be empty.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setDocValidationError('Please enter a valid Gmail / Email address (e.g. name@gmail.com).');
      return;
    }

    const parsedLanguages = languagesStr
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    const parsedAreas = serviceAreasStr
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const effectiveDocImage = (documentImageUrl || currentUser.idDocumentImage || currentUser.idProofUrl || currentUser.documentImageUrl || currentUser.idDocumentUrl || '').trim();
    const cleanIdNum = documentIdNumber.trim().toUpperCase() || (currentUser.idDocumentNumber || currentUser.documentIdNumber || '').trim().toUpperCase();

    let isNowAutoVerified = false;
    if (effectiveDocImage || cleanIdNum) {
      if (effectiveDocImage && !cleanIdNum) {
        setDocValidationError('Please enter your Government ID Number along with the uploaded document.');
        return;
      }
      if (cleanIdNum) {
        const numVal = isValidGovIdFormat(documentType, cleanIdNum);
        if (!numVal.isValid) {
          setDocValidationError(numVal.error || 'Invalid ID number format.');
          return;
        }
      }
      if (effectiveDocImage && cleanIdNum) {
        isNowAutoVerified = true;
      }
    }

    const trimmedAvatar = avatarUrl.trim() || currentUser.avatarUrl;
    const finalVerifiedState = isNowAutoVerified || Boolean(currentUser.isVerified && currentUser.verificationStatus !== 'Rejected');

    updateCurrentUserProfile({
      fullName: trimmedName,
      name: trimmedName,
      email: trimmedEmail,
      age: Math.max(21, Number(age)),
      gender,
      city,
      residentialAddress: residentialAddress.trim(),
      avatarUrl: trimmedAvatar,
      profileImage: trimmedAvatar,
      serviceAreas: parsedAreas.length > 0 ? parsedAreas : currentUser.serviceAreas,
      bio: bio.trim(),
      languages: parsedLanguages.length > 0 ? parsedLanguages : currentUser.languages,
      documentType,
      documentIdNumber: cleanIdNum || undefined,
      documentImageUrl: effectiveDocImage || undefined,
      idDocumentUrl: effectiveDocImage || undefined,
      idDocumentType: documentType,
      idDocumentNumber: cleanIdNum || undefined,
      idDocumentImage: effectiveDocImage || undefined,
      idProofUrl: effectiveDocImage || undefined,
      isVerified: finalVerifiedState,
      verificationStatus: finalVerifiedState ? 'Verified' : (currentUser.verificationStatus || 'Unverified'),
    });

    if (effectiveDocImage && cleanIdNum) {
      submitAddressVerification(
        currentUser.userToken,
        documentType,
        effectiveDocImage,
        residentialAddress.trim() || currentUser.residentialAddress,
        cleanIdNum
      );
    }

    saveUserToSheet({
      fullName: trimmedName || currentUser.fullName,
      mobile: currentUser.phoneNumber,
      email: trimmedEmail || currentUser.email,
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

  // Compile BOTH Companion & Booker received reviews so reviews are never empty!
  const companionReviews = bookings
    .filter(
      (b) =>
        (b.companionToken === currentUser.userToken || b.companionId === currentUser.userToken) &&
        (b.ratingSubmitted || b.bookerRatingSubmitted || b.bookerRating || b.userRating)
    )
    .map((b) => ({
      id: `${b.id}-comp`,
      reviewerName: b.bookerName || 'Verified Outing Booker',
      rating: b.bookerRating || b.userRating || 5,
      date: b.outingDate || new Date().toISOString().split('T')[0],
      outingTitle: b.activityTitle || 'Verified Social Outing',
      comment: b.bookerReview || b.userReview || 'Great outing experience, punctual and polite.',
    }));

  const bookerReviews = bookings
    .filter(
      (b) =>
        (b.bookerToken === currentUser.userToken || b.bookerId === currentUser.userToken) &&
        (b.companionRatingSubmitted || b.companionRating)
    )
    .map((b) => ({
      id: `${b.id}-booker`,
      reviewerName: b.companionName || 'Verified Companion',
      rating: b.companionRating || 5,
      date: b.outingDate || new Date().toISOString().split('T')[0],
      outingTitle: b.activityTitle || 'Verified Social Outing',
      comment: b.companionReview || 'Polite and respectful outing participant.',
    }));

  const allReviews = [...companionReviews, ...bookerReviews];

  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : currentUser.rating > 0
    ? currentUser.rating.toFixed(1)
    : '5.0';

  const totalReviewsCount = allReviews.length > 0 ? allReviews.length : (currentUser.reviewCount || 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-xl md:max-w-3xl overflow-hidden shadow-2xl border border-slate-800 text-slate-100 flex flex-col max-h-[92vh] m-2 sm:m-4 md:m-6">
          
          {/* TOP HEADER: Profile Photo (with Google-style Blue/Gold Pro Ring if Pro), Name, USR ID, Verification */}
          <div className="bg-slate-950/90 text-white px-5 sm:px-7 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className={`relative shrink-0 ${isPro ? 'p-0.5 rounded-full bg-gradient-to-tr from-blue-500 via-cyan-400 to-amber-400 shadow-lg shadow-blue-500/30' : ''}`}>
                {currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '' ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className={`w-12 h-12 ${isPro ? 'rounded-full border-2 border-slate-950' : `rounded-2xl ring-2 ${isVerified ? 'ring-emerald-400' : 'ring-amber-400'}`} object-cover shadow-md`}
                  />
                ) : (
                  <div
                    className={`w-12 h-12 ${isPro ? 'rounded-full border-2 border-slate-950' : `rounded-2xl ring-2 ${isVerified ? 'ring-emerald-400' : 'ring-amber-400'}`} bg-gradient-to-br from-indigo-600 to-cyan-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md`}
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
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unverified (Upload ID)</span>
                    </button>
                  )}

                  {isPro ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('pro')}
                      className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/70 cursor-pointer shadow-xs"
                    >
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>PRO MEMBER</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('pro')}
                      className="inline-flex items-center gap-1 bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-600/60 cursor-pointer transition-colors"
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
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Give Feedback</span>
              </button>

              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 5-TAB NAVIGATION BAR */}
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

          {/* SCROLLABLE MODAL BODY */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

            {saveSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile updated &amp; saved to live server successfully!</span>
              </div>
            )}

            {galleryMsg && (
              <div className="p-3 bg-indigo-950/80 border border-indigo-700/60 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{galleryMsg}</span>
              </div>
            )}

            {/* TAB 1: GALLERY & RATINGS */}
            {activeTab === 'gallery_ratings' && (
              <div className="space-y-6 animate-fadeIn">
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
                        Upload verified public outing photos visible to Bookers exploring your profile.
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

                {/* SECTION 2: MY RATINGS & REVIEWS RECEIVED */}
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

            {/* TAB 4: REFER & EARN */}
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
                </div>
              );
            })()}

            {/* TAB 3: WALLET & LIFELINE */}
            {activeTab === 'wallet_lifeline' && (() => {
              const creditBalance = currentUser.cancellationCreditBalance ?? currentUser.walletBalance ?? currentUser.creditBalance ?? 0;
              const lifelineUsed = currentUser.monthlyLifelineUsed || 0;
              const lifelinesRemaining = Math.max(0, 1 - lifelineUsed);

              return (
                <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-emerald-950/40 rounded-2xl border border-emerald-700/40 p-5 shadow-xl space-y-4 relative overflow-hidden animate-fadeIn">
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

                  {/* MY PAYMENT & WALLET TRANSACTION HISTORY (Deduplicated) */}
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
                    const seenKeys = new Set<string>();

                    (currentUser.walletHistory || []).forEach((w) => {
                      const isCredit = w.type === 'credit';
                      const key = (w.paymentReferenceId || w.id || '').trim();
                      const timeBucket = (w.timestamp || '').slice(0, 16);
                      const dedupKey = `${w.type}_${w.amount}_${timeBucket}`;
                      if (seenKeys.has(key) || seenKeys.has(dedupKey)) return;
                      if (key) seenKeys.add(key);
                      seenKeys.add(dedupKey);

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

                    (paymentsLedger || [])
                      .filter((p) => {
                        if (['TXN-WB-101', 'TXN-WB-301'].includes(p.id)) return false;
                        if (p.type === 'Admin Wallet Adjustment' || p.type === 'Wallet Credit Redeemed') return false;
                        return p.companionToken === currentUser.userToken || p.bookerToken === currentUser.userToken;
                      })
                      .forEach((p) => {
                        const refKey = (p.paymentReferenceId || p.razorpayRefId || p.id || '').trim();
                        const timeBucket = (p.timestamp || '').slice(0, 16);
                        const dedupKey = `debit_${p.feeAmount}_${timeBucket}`;
                        if (seenKeys.has(refKey) || seenKeys.has(dedupKey)) return;

                        const isPro = p.type === '1-Month Pro Subscription';
                        const isPenalty = p.type === 'Cancellation Penalty';
                        const isAcceptanceFee = p.type === 'Booking Acceptance Fee';
                        const isCompanion = p.companionToken === currentUser.userToken;
                        const isBooker = p.bookerToken === currentUser.userToken;

                        if (isAcceptanceFee && !isCompanion) return;
                        if (isPenalty && !isBooker) return;

                        if (refKey) seenKeys.add(refKey);
                        seenKeys.add(dedupKey);

                        let typeDisplay = 'Acceptance Fee Paid';
                        let badgeStyle = 'bg-cyan-950 text-cyan-300 border-cyan-600/70';
                        let details = `${p.outingTitle || 'Outing Acceptance'} (${p.status})`;

                        if (isPro) {
                          typeDisplay = 'Cirqlr Pro Paid';
                          badgeStyle = 'bg-purple-950 text-purple-300 border-purple-600/70';
                          details = 'Companion Pro 1-Month Unlimited Pass';
                        } else if (isPenalty) {
                          typeDisplay = 'Cancellation Penalty Paid';
                          badgeStyle = 'bg-rose-950 text-rose-300 border-rose-600/70';
                          details = `Cancellation Penalty Fee (₹${p.feeAmount})`;
                        }

                        combinedTransactions.push({
                          id: p.id,
                          refId: refKey,
                          type: typeDisplay,
                          badgeStyle,
                          amount: p.feeAmount,
                          isCredit: false,
                          details,
                          timestamp: p.timestamp,
                        });
                      });

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
                        </div>

                        {combinedTransactions.length === 0 ? (
                          <div className="p-5 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                            No financial transactions or wallet credits recorded yet.
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
                </div>
              );
            })()}

            {/* TAB 2: EDIT PROFILE & ACCOUNT SETTINGS */}
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
                  
                  {/* 1. Profile Picture */}
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span>Profile Picture</span>
                      </label>
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
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Legal Name, Age & Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        Full Legal Name (As per ID)
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

                  {/* 4. Regional Hub & Preferred Areas */}
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
                        placeholder="e.g. Park Street, South City"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* 5. Residential Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Full Residential Address</span>
                    </label>
                    <textarea
                      rows={2}
                      value={residentialAddress}
                      onChange={(e) => setResidentialAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
                      required
                    />
                  </div>

                  {/* 6. Languages */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Spoken Languages (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={languagesStr}
                      onChange={(e) => setLanguagesStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* 7. Bio */}
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

                  {/* ADDRESS & GOVERNMENT ID VERIFICATION */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Address &amp; Government ID Verification
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Enter valid Government ID number and upload clear ID / DigiLocker image for instant verification.
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
                        isVerified
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      }`}>
                        {isVerified ? 'Verified ID (Live in Explore)' : 'Unverified (ID Required)'}
                      </span>
                    </div>

                    {docValidationError && (
                      <div className="p-3 bg-rose-950/90 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-start gap-2 shadow-md animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-semibold">{docValidationError}</span>
                      </div>
                    )}

                    {isValidatingDoc && (
                      <div className="p-2.5 bg-indigo-950/70 border border-indigo-800 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>Compressing &amp; saving document...</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Government Document Type
                      </label>
                      <select
                        value={documentType}
                        onChange={(e) => {
                          setDocumentType(e.target.value as AllowedDocumentType);
                          setDocValidationError(null);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Voter ID Card">Voter ID Card</option>
                        <option value="Driving License">Driving License</option>
                        <option value="PAN Card">PAN Card</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 block">
                          {documentType === 'PAN Card'
                            ? 'PAN Card Number'
                            : documentType.includes('Voter')
                            ? 'Voter ID (EPIC) Number'
                            : 'Driving License Number'}
                        </label>
                        <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                          {documentType === 'PAN Card'
                            ? 'Format: ABCDE1234F'
                            : documentType.includes('Voter')
                            ? 'Format: ABC1234567'
                            : 'Format: WB17 20250001080'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={documentIdNumber}
                        onChange={(e) => {
                          setDocumentIdNumber(e.target.value.toUpperCase());
                          setDocValidationError(null);
                        }}
                        placeholder={
                          documentType === 'PAN Card'
                            ? 'ABCDE1234F'
                            : documentType.includes('Voter')
                            ? 'ABC1234567'
                            : 'WB17 20250001080'
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-cyan-500"
                      />
                    </div>

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
                                <span>Uploaded &amp; Ready</span>
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
                                Upload a photo or DigiLocker copy of your Voter ID, Driving License, or PAN Card.
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

                {/* DELETE ACCOUNT SECTION */}
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

                      {deleteError && (
                        <div className="p-3 bg-rose-950/90 border border-rose-600 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{deleteError}</span>
                        </div>
                      )}

                      {showDeleteConfirm && (
                        <div className="mt-3 p-4 bg-rose-950/40 border border-rose-700/80 rounded-xl space-y-3 animate-fadeIn">
                          <input
                            type="text"
                            placeholder="Optional Deletion Reason..."
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-rose-800/80 rounded-xl text-xs text-white"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteError(null);
                              }}
                              className="px-3 py-1.5 bg-slate-900 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
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
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              {isDeleting ? 'Archiving...' : 'Yes, Delete My Account'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: UPGRADE TO PRO */}
            {activeTab === 'pro' && (
              <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-amber-950/30 rounded-2xl border border-amber-600/40 p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
                      <Crown className="w-5 h-5 text-slate-950 fill-slate-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-white">
                          Cirqlr Pro Companion
                        </h4>
                        {isPro ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase">
                            Active Member
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/60">
                            ₹{finalPrice}/month
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Stand out with a Google-style Pro profile ring, transparent Golden Cards, and unlimited packages.
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
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg cursor-pointer shrink-0"
                    >
                      <Crown className="w-4 h-4 fill-slate-950" />
                      <span>Upgrade to Pro (₹{finalPrice})</span>
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  openFeedbackModal();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 rounded-xl text-xs font-semibold cursor-pointer"
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
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PlatformSettings,
  UserProfile,
  ActivityPackageCard,
  BookingRecord,
  PaymentLedgerEntry,
  ChatMessage,
  SafetyReport,
  AuditLog,
  AccountStatus,
  UserCity,
  FeeCalculationResult,
  AllowedDocumentType,
  IdVerificationRecord,
  VerificationStatus,
  UserFeedback,
  FeedbackCategory,
  SuspensionNoticeData,
  RescheduleHistoryEntry,
  WalletTransactionEntry,
} from '../types/marketplace';
import { collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, cleanForFirestore } from '../lib/firebase';
import { sendBookingStatusEmail } from '../services/emailWebhookService';
import { sendCancellationEmail } from '../services/cancellationAndOffersService';
import { checkVenueSafety } from '../services/safetyFilterService';
import { getTimeUntilOutingHours, getCurrentCalendarMonth } from '../utils/dateUtils';
import {
  computeLiveBookingFee,
  migrateStoredBookingsAndWallets,
  LiveBookingFeeResult,
} from '../utils/feeCalculator';
import {
  safeSetItem,
  safeGetItem,
  safeRemoveItem,
  cleanupLegacyStorage,
  sanitizeStoredData,
} from '../utils/safeStorage';

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  baseAcceptanceFeePercent: 15,
  repeatFeeReductionPercent: 5,
  proSubscriptionMonthlyPrice: 499,
  proOccasionDiscountPercent: 20,
  paymentVerificationMode: 'manual_hold',
  adminMasterPasskey: '889900',
  allowedPublicVenueCategories: [
    'Verified Cafe & Restaurant',
    'Museum / Art Gallery',
    'Shopping Mall',
    'Cinema / INOX / PVR Theater',
    'Public Cultural / Live Event',
  ],
};

const FEMALE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
];

const MALE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
];

export type PublicAppTab = 'explore' | 'my-bookings' | 'companion-studio';

interface MarketplaceContextType {
  // Navigation & Perspectives
  activeTab: PublicAppTab;
  setActiveTab: (tab: PublicAppTab) => void;
  isFounderVaultUnlocked: boolean;
  unlockFounderVault: () => void;
  lockFounderVault: () => void;

  // Platform Settings & Founder Controls
  platformSettings: PlatformSettings;
  updatePlatformSettings: (newSettings: Partial<PlatformSettings>, reason?: string) => void;
  updateAdminMasterPasskey: (newPasskey: string) => boolean;
  addAllowedVenueCategory: (category: string) => void;
  removeAllowedVenueCategory: (category: string) => void;
  resetSettingsToDefault: () => void;

  // Authentication & Users
  currentUser: UserProfile | null;
  usersAndCompanions: UserProfile[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  loginWithOtp: (phoneNumberOrEmail?: string) => { success: boolean; isNewUser: boolean; user?: UserProfile; error?: string };
  findUserByPhoneOrEmail: (identifier?: string) => UserProfile | undefined;
  loginUserAccount: (user: UserProfile) => void;
  loginWithPassword: (identifier: string, password: string) => { success: boolean; user?: UserProfile; error?: string };
  resetUserPassword: (userToken: string, newPassword: string) => { success: boolean; user?: UserProfile; error?: string };
  registerUser: (input: {
    fullName: string;
    phoneNumber: string;
    email: string;
    age: number;
    gender: 'Male' | 'Female' | 'Non-Binary' | 'Non-Binary / Prefer not to say';
    city: UserCity;
    bio?: string;
    residentialAddress?: string;
    password?: string;
    avatarUrl?: string;
    documentType?: AllowedDocumentType;
    documentIdNumber?: string;
    documentImageUrl?: string;
    referralCode?: string;
  }) => { success: boolean; user?: UserProfile; error?: string };
  submitAddressVerification: (
    userToken: string,
    documentType: AllowedDocumentType,
    documentImageUrl?: string,
    residentialAddress?: string,
    documentIdNumber?: string
  ) => { success: boolean; user?: UserProfile };
  logOutUser: () => void;
  deleteUserAccountAndWithdrawConsent: (reason?: string) => { success: boolean; error?: string };
  permanentlyPurgeArchivedUser: (userToken: string) => void;
  getUserByToken: (token: string) => UserProfile | undefined;
  updateUserAccountStatus: (userToken: string, status: AccountStatus, note?: string) => void;
  updateCurrentUserProfile: (updates: Partial<UserProfile>) => void;
  updateCurrentUserEmail: (email: string) => { success: boolean; error?: string };
  verifyUserIdentity: (userToken: string) => void;
  adjustUserWalletCredit: (userToken: string, deltaAmount: number, reason: string) => void;

  // Companion Pro 1-Month (30 Days) Membership
  submitProSubscriptionPayment: (companionToken: string, customRefId?: string) => string;
  subscribeCompanionPro: (companionToken: string) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  profileModalInitialTab: 'profile' | 'subscription';
  openProfileModal: (tab?: 'profile' | 'subscription') => void;

  // Activity Package Cards (3-card Freemium Model)
  activityCards: ActivityPackageCard[];
  getCompanionActivityCards: (companionToken: string) => ActivityPackageCard[];
  createActivityCard: (card: Omit<ActivityPackageCard, 'id' | 'createdAt'>) => {
    success: boolean;
    requiresPro?: boolean;
    card?: ActivityPackageCard;
  };
  updateActivityCard: (id: string, updates: Partial<ActivityPackageCard>) => void;
  deleteActivityCard: (id: string) => void;

  // Bookings & Outing Lifecycle
  bookings: BookingRecord[];
  isRepeatClientEligible: (bookerToken: string, companionToken: string) => boolean;
  calculateFee: (
    hourlyRate: number,
    hours: number,
    isRepeatClient?: boolean,
    companionReferralCredits?: number
  ) => FeeCalculationResult;
  computeLiveBookingFee: typeof computeLiveBookingFee;
  createBooking: (bookingInput: {
    companionToken: string;
    activityCardId?: string;
    activityTitle: string;
    hourlyRate: number;
    outingDate: string;
    outingTime: string;
    hours: number;
    venueCategory: string;
    venueName: string;
    venueAddress: string;
    purpose: string;
    isRepeatClient?: boolean;
    razorpayRefId?: string;
  }) => BookingRecord;
  rejectBooking: (bookingId: string) => void;
  markOutingCompleted: (bookingId: string) => void;
  submitBookingRating: (bookingId: string, rating: number, review: string) => void;
  submitCompanionRatingForBooker: (bookingId: string, rating: number, review: string) => void;
  cancelBooking: (bookingId: string, reason?: string) => void;
  cancelBookingByBooker: (bookingId: string, reason: string, penaltyRazorpayRefId: string) => void;
  cancelBookingByBookerWithCredit: (bookingId: string, reason?: string) => void;
  cancelBookingByCompanionWithLifeline: (bookingId: string, reason?: string) => { eligibleForCredit: boolean; creditedAmount: number };
  rescheduleBooking: (bookingId: string, newDate: string, newTime: string, note?: string) => boolean;
  resolveBookingDisputeRefundAndBlock: (bookingId: string, reason?: string) => void;

  // Payment Hold & Ledger
  paymentsLedger: PaymentLedgerEntry[];
  submitAcceptanceFeePayment: (bookingId: string, razorpayRefId: string, creditUsed?: number) => void;
  confirmPaymentAndReleaseBooking: (ledgerId: string) => void;
  rejectPaymentAndFlagBooking: (ledgerId: string) => void;

  // Encrypted Chat
  chatMessages: ChatMessage[];
  getMessagesForBooking: (bookingId: string) => ChatMessage[];
  sendChatMessage: (bookingId: string, text: string) => void;

  // Safety Reports & Reports Inspection
  safetyReports: SafetyReport[];
  fileSafetyReport: (report: {
    reportedUserToken: string;
    category: SafetyReport['category'];
    details: string;
    venueAddress: string;
  }) => void;
  resolveReport: (reportId: string, notes: string, accountStatusChange?: AccountStatus) => void;
  getReportsForUser: (userToken: string) => SafetyReport[];

  // Audits & Inspector
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;
  inspectedUserToken: string | null;
  setInspectedUserToken: (token: string | null) => void;

  // Modal Triggers
  activeChatBookingId: string | null;
  setActiveChatBookingId: (id: string | null) => void;
  activeReportUserToken: string | null;
  setActiveReportUserToken: (token: string | null) => void;

  // Legal Pages & Modals
  activeLegalModal: 'terms' | 'privacy' | 'refund' | null;
  openLegalModal: (modal: 'terms' | 'privacy' | 'refund') => void;
  closeLegalModal: () => void;

  // About Us Modal
  isAboutUsModalOpen: boolean;
  setIsAboutUsModalOpen: (open: boolean) => void;
  openAboutUsModal: () => void;

  // User Feedback System
  isFeedbackModalOpen: boolean;
  setIsFeedbackModalOpen: (open: boolean) => void;
  openFeedbackModal: () => void;
  platformFeedbacks: UserFeedback[];
  submitFeedback: (feedback: Omit<UserFeedback, 'id' | 'submittedAt'>) => void;
  deleteFeedback: (feedbackId: string) => void;

  // Saved Companions / Shortlist
  savedCompanionTokens: string[];
  toggleSaveCompanion: (companionToken: string) => void;
  isCompanionSaved: (companionToken: string) => boolean;

  // Account Suspension & Venue Safety Enforcement
  activeSuspensionNotice: SuspensionNoticeData | null;
  openSuspensionNotice: (user: UserProfile, detectedKeyword?: string, prohibitedText?: string) => void;
  closeSuspensionNotice: () => void;
  suspendUserForSafetyViolation: (
    userToken: string,
    detectedKeyword?: string,
    prohibitedText?: string
  ) => void;
  liftUserSuspension: (userToken: string) => void;
}

const INITIAL_SEED_USERS: UserProfile[] = [];
const INITIAL_SEED_CARDS: ActivityPackageCard[] = [];

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<PublicAppTab>('explore');
  const [isFounderVaultUnlocked, setIsFounderVaultUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cirqlr_admin_session') === 'true';
    } catch {
      return false;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Clean old storage versions and redundant duplicate keys if present
  useEffect(() => {
    cleanupLegacyStorage();
  }, []);

  // Platform Settings
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    try {
      const saved = safeGetItem('sangha_v4_settings');
      if (saved) {
        return { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(saved) };
      }
      return DEFAULT_PLATFORM_SETTINGS;
    } catch {
      return DEFAULT_PLATFORM_SETTINGS;
    }
  });

  // Auto-Verification & Safety Sanitizer
  const sanitizeUserVerification = (user: UserProfile): UserProfile => {
    let docUrl = (user.documentImageUrl || user.idDocumentUrl || '').trim();
    // Protect against legacy oversized base64 data URLs in local storage (>30KB)
    if (docUrl.startsWith('data:image/') && docUrl.length > 30000) {
      docUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
    }
    let avatarUrl = (user.avatarUrl || '').trim();
    if (avatarUrl.startsWith('data:image/') && avatarUrl.length > 30000) {
      avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    }

    const hasIdDoc = Boolean(docUrl);
    const cleanToken = (user.userToken || '').replace('USR-', '');

    // Auto-reinstatement check for suspended accounts after 7-day hold expires
    let currentAccountStatus: AccountStatus = user.accountStatus || 'Active';
    let suspensionExpiry = user.suspensionExpiryDate;
    let suspensionReason = user.suspensionReason;
    let suspendedAt = user.suspendedAt;
    let prohibitedVenueAttempt = user.prohibitedVenueAttempt;

    if (currentAccountStatus === 'Suspended' && suspensionExpiry) {
      const expiryTimestamp = new Date(suspensionExpiry).getTime();
      if (!isNaN(expiryTimestamp) && Date.now() >= expiryTimestamp) {
        currentAccountStatus = 'Active';
        suspensionExpiry = undefined;
        suspensionReason = undefined;
        suspendedAt = undefined;
        prohibitedVenueAttempt = undefined;
      }
    }

    const currentMonth = getCurrentCalendarMonth();
    const lifelineMonth = user.monthlyLifelineMonth || currentMonth;
    const lifelineUsed = lifelineMonth === currentMonth
      ? (typeof user.monthlyLifelineUsed === 'number' ? user.monthlyLifelineUsed : 0)
      : 0;

    // Preserve verification status if already verified, or verify if docUrl exists
    const isVerified = user.isVerified !== undefined ? Boolean(user.isVerified) : (user.verificationStatus === 'Verified' || user.verificationStatus === 'ID Verified' || hasIdDoc);
    const verificationStatus: VerificationStatus = user.verificationStatus || (isVerified ? 'Verified' : 'Unverified');

    return {
      ...user,
      avatarUrl: avatarUrl || user.avatarUrl,
      cancellationCreditBalance: typeof user.cancellationCreditBalance === 'number' ? user.cancellationCreditBalance : 0,
      monthlyLifelineUsed: lifelineUsed,
      monthlyLifelineMonth: lifelineMonth,
      accountStatus: currentAccountStatus,
      suspensionExpiryDate: suspensionExpiry,
      suspensionReason,
      suspendedAt,
      prohibitedVenueAttempt,
      documentImageUrl: docUrl || user.documentImageUrl || undefined,
      idDocumentUrl: docUrl || user.idDocumentUrl || undefined,
      isVerified,
      verificationStatus,
      publicGallery: Array.isArray(user.publicGallery) ? user.publicGallery : [],
      referralCode: user.referralCode || `REF-${cleanToken}`,
      totalReferrals: typeof user.totalReferrals === 'number' ? user.totalReferrals : 0,
      referralCredits: typeof user.referralCredits === 'number' ? user.referralCredits : 0,
      isCommunityAmbassador: Boolean(user.isCommunityAmbassador || (user.totalReferrals && user.totalReferrals > 0)),
      deletedAt: user.deletedAt,
      purgeAfter: user.purgeAfter,
      deletionReason: user.deletionReason,
    };
  };

  // Persistent Initial Storage Hydration with Strict Auto-Migration & Recalculation
  const initialStorageData = (() => {
    try {
      cleanupLegacyStorage();
      const savedBookings = safeGetItem('sangha_v4_bookings');
      const rawBookings: BookingRecord[] = savedBookings ? JSON.parse(savedBookings) : [];

      const savedUsers = safeGetItem('sangha_v4_users') || safeGetItem('vibego_v1_users');
      let rawUsers: UserProfile[] = [];
      const DUMMY_SEED_TOKENS = ['USR-WB-1001', 'USR-OD-2002', 'USR-WB-3003'];
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawUsers = parsed
            .filter((u) => u && !DUMMY_SEED_TOKENS.includes(u.userToken))
            .map(sanitizeUserVerification);
        }
      }

      // Automated 1-Year Purge: Permanently purge any user whose 365-day legal holding period has elapsed
      const currentTime = Date.now();
      rawUsers = rawUsers.filter((u) => {
        if (u.accountStatus === 'Deleted_Archived' && u.purgeAfter && currentTime >= u.purgeAfter) {
          return false; // Automatically purged from permanent database
        }
        return true;
      });

      const activeUserToken = safeGetItem('cirqlr_active_user_token');
      const savedCurrentUser = safeGetItem('sangha_v4_current_user') || safeGetItem('vibego_v1_current_user');
      let rawCurrentUser: UserProfile | null = null;
      if (activeUserToken) {
        rawCurrentUser = rawUsers.find((u) => u.userToken === activeUserToken) || null;
      }
      if (!rawCurrentUser && savedCurrentUser) {
        rawCurrentUser = sanitizeUserVerification(JSON.parse(savedCurrentUser));
      }

      // If current user is in Deleted_Archived state, clear the session
      if (rawCurrentUser && rawCurrentUser.accountStatus === 'Deleted_Archived') {
        rawCurrentUser = null;
        safeRemoveItem('cirqlr_active_user_token');
        safeRemoveItem('sangha_v4_current_user');
        safeRemoveItem('vibego_v1_current_user');
      }

      const { migratedBookings, migratedUsers } = migrateStoredBookingsAndWallets(
        rawBookings,
        rawUsers,
        DEFAULT_PLATFORM_SETTINGS
      );

      let migratedCurrentUser = rawCurrentUser;
      if (rawCurrentUser) {
        migratedCurrentUser = migratedUsers.find((u) => u.userToken === rawCurrentUser?.userToken) || rawCurrentUser;
        if (migratedCurrentUser?.accountStatus === 'Deleted_Archived') {
          migratedCurrentUser = null;
        }
      }

      return {
        bookings: migratedBookings,
        users: migratedUsers,
        currentUser: migratedCurrentUser,
      };
    } catch {
      return {
        bookings: [],
        users: INITIAL_SEED_USERS,
        currentUser: null,
      };
    }
  })();

  // Persistent Current User Session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialStorageData.currentUser);

  // Persistent Registered Users & Dummy Seed Accounts (saved in localStorage)
  const [usersAndCompanions, setUsersAndCompanions] = useState<UserProfile[]>(initialStorageData.users);

  // Activity Cards (Keyed by companion userToken)
  const [activityCards, setActivityCards] = useState<ActivityPackageCard[]>(() => {
    try {
      const saved = localStorage.getItem('sangha_v4_cards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const DUMMY_SEED_TOKENS = ['USR-WB-1001', 'USR-OD-2002', 'USR-WB-3003'];
          const DUMMY_SEED_CARD_IDS = ['CARD-WB-101', 'CARD-OD-201', 'CARD-WB-301'];
          return parsed.filter(
            (c) => c && !DUMMY_SEED_CARD_IDS.includes(c.id) && !DUMMY_SEED_TOKENS.includes(c.companionToken)
          );
        }
      }
      return INITIAL_SEED_CARDS;
    } catch {
      return INITIAL_SEED_CARDS;
    }
  });

  // Bookings
  const [bookings, setBookings] = useState<BookingRecord[]>(initialStorageData.bookings);

  // Payments Ledger
  const [paymentsLedger, setPaymentsLedger] = useState<PaymentLedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem('sangha_v4_payments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Encrypted Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('sangha_v4_chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Safety Reports
  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>(() => {
    try {
      const saved = localStorage.getItem('sangha_v4_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('sangha_v4_audit');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'LOG-001',
              action: 'Production Engine Initialized',
              details: 'Production platform initialized. 21+ Phone OTP Registration & Founder ID Gate Active.',
              timestamp: new Date().toISOString(),
              adminToken: 'FOUNDER-ROOT',
            },
          ];
    } catch {
      return [];
    }
  });

  // 3. AUTO-MIGRATE & RECALCULATE ALL EXISTING SAVED DATA IN localStorage ON APP LOAD
  useEffect(() => {
    try {
      const savedBookings = safeGetItem('sangha_v4_bookings');
      const rawBookings: BookingRecord[] = savedBookings ? JSON.parse(savedBookings) : bookings;

      const savedUsers = safeGetItem('sangha_v4_users') || safeGetItem('vibego_v1_users');
      let rawUsers: UserProfile[] = usersAndCompanions;
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawUsers = parsed
            .filter((u) => u && !['USR-WB-1001', 'USR-OD-2002', 'USR-WB-3003'].includes(u.userToken))
            .map(sanitizeUserVerification);
        }
      }

      const { migratedBookings, migratedUsers } = migrateStoredBookingsAndWallets(
        rawBookings,
        rawUsers,
        platformSettings
      );

      // Overwrite any stale 110 or 7% properties in localStorage safely
      safeSetItem('sangha_v4_bookings', JSON.stringify(migratedBookings));
      safeSetItem('sangha_v4_users', JSON.stringify(migratedUsers));
      safeRemoveItem('vibego_v1_users');
      safeRemoveItem('vibego_v1_current_user');

      setBookings(migratedBookings);
      setUsersAndCompanions(migratedUsers);

      if (currentUser) {
        const updatedCurrent = migratedUsers.find((u) => u.userToken === currentUser.userToken);
        if (updatedCurrent) {
          setCurrentUser(updatedCurrent);
          safeSetItem('sangha_v4_current_user', JSON.stringify(updatedCurrent));
        }
      }
    } catch (err) {
      console.warn('[Fee Recalculation & State Migration Handled]', err);
    }
  }, [platformSettings?.baseAcceptanceFeePercent, platformSettings?.repeatFeeReductionPercent]);

  // Real-time Production Firestore Listeners for users, bookings, activityCards, and transactions
  useEffect(() => {
    if (!db) return;

    // 1. Real-time Users & Companions Listener
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteUsers: UserProfile[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as UserProfile;
            if (data && data.userToken && !['USR-WB-1001', 'USR-OD-2002', 'USR-WB-3003'].includes(data.userToken)) {
              remoteUsers.push(sanitizeUserVerification(data));
            }
          });
          if (remoteUsers.length > 0) {
            setUsersAndCompanions(remoteUsers);
            safeSetItem('sangha_v4_users', JSON.stringify(remoteUsers));
            const activeToken = safeGetItem('cirqlr_active_user_token');
            if (activeToken) {
              const matched = remoteUsers.find((u) => u.userToken === activeToken);
              if (matched) {
                setCurrentUser(matched);
                safeSetItem('sangha_v4_current_user', JSON.stringify(matched));
              }
            }
          }
        }
      },
      (error) => {
        console.warn('[Firestore] users snapshot sync note:', error.message);
      }
    );

    // 2. Real-time Bookings Listener
    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteBookings: BookingRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as BookingRecord;
            if (data && data.id) {
              remoteBookings.push(data);
            }
          });
          setBookings(remoteBookings);
          safeSetItem('sangha_v4_bookings', JSON.stringify(remoteBookings));
        }
      },
      (error) => {
        console.warn('[Firestore] bookings snapshot sync note:', error.message);
      }
    );

    // 3. Real-time Activity Cards Listener
    const unsubCards = onSnapshot(
      collection(db, 'activityCards'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteCards: ActivityPackageCard[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ActivityPackageCard;
            if (data && data.id && !['CARD-WB-101', 'CARD-OD-201', 'CARD-WB-301'].includes(data.id)) {
              remoteCards.push(data);
            }
          });
          setActivityCards(remoteCards);
          try {
            localStorage.setItem('sangha_v4_cards', JSON.stringify(remoteCards));
          } catch {
            // ignore
          }
        }
      },
      (error) => {
        console.warn('[Firestore] activityCards snapshot sync note:', error.message);
      }
    );

    // 4. Real-time Transactions / Payments Ledger Listener
    const unsubTransactions = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteLedger: PaymentLedgerEntry[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as PaymentLedgerEntry;
            if (data && data.id) {
              remoteLedger.push(data);
            }
          });
          setPaymentsLedger(remoteLedger);
          try {
            localStorage.setItem('sangha_v4_payments', JSON.stringify(remoteLedger));
          } catch {
            // ignore
          }
        }
      },
      (error) => {
        console.warn('[Firestore] transactions snapshot sync note:', error.message);
      }
    );

    return () => {
      unsubUsers();
      unsubBookings();
      unsubCards();
      unsubTransactions();
    };
  }, []);

  // Production Firestore Async Persistence Helpers
  const syncUserToFirestore = async (user: UserProfile) => {
    try {
      if (db && user.userToken) {
        const cleanedUser = cleanForFirestore(user);
        await setDoc(doc(db, 'users', user.userToken), cleanedUser, { merge: true });
        // Also persist wallet document
        const cleanedWallet = cleanForFirestore({
          userToken: user.userToken,
          userName: user.fullName,
          cancellationCreditBalance: user.cancellationCreditBalance || 0,
          walletHistory: user.walletHistory || [],
          updatedAt: new Date().toISOString(),
        });
        await setDoc(doc(db, 'wallets', user.userToken), cleanedWallet, { merge: true });
      }
    } catch (err: any) {
      console.warn('[Firestore Sync] User write note:', err?.message);
    }
  };

  const syncBookingToFirestore = async (booking: BookingRecord) => {
    try {
      if (db && booking.id) {
        await setDoc(doc(db, 'bookings', booking.id), cleanForFirestore(booking), { merge: true });
      }
    } catch (err: any) {
      console.warn('[Firestore Sync] Booking write note:', err?.message);
    }
  };

  const syncCardToFirestore = async (card: ActivityPackageCard) => {
    try {
      if (db && card.id) {
        await setDoc(doc(db, 'activityCards', card.id), cleanForFirestore(card), { merge: true });
      }
    } catch (err: any) {
      console.warn('[Firestore Sync] Activity card write note:', err?.message);
    }
  };

  const deleteCardFromFirestore = async (cardId: string) => {
    try {
      if (db && cardId) {
        await deleteDoc(doc(db, 'activityCards', cardId));
      }
    } catch (err: any) {
      console.warn('[Firestore Sync] Card delete note:', err?.message);
    }
  };

  const syncTransactionToFirestore = async (txn: PaymentLedgerEntry) => {
    try {
      if (db && txn.id) {
        await setDoc(doc(db, 'transactions', txn.id), cleanForFirestore(txn), { merge: true });
      }
    } catch (err: any) {
      console.warn('[Firestore Sync] Transaction write note:', err?.message);
    }
  };

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'profile' | 'subscription'>('profile');
  const [inspectedUserToken, setInspectedUserToken] = useState<string | null>(null);
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);
  const [activeReportUserToken, setActiveReportUserToken] = useState<string | null>(null);

  // Legal Pages & Modals (Explicitly closed on fresh load so Home screen always defaults)
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | 'refund' | null>(null);

  const openLegalModal = (modal: 'terms' | 'privacy' | 'refund') => {
    setActiveLegalModal(modal);
  };

  const closeLegalModal = () => {
    setActiveLegalModal(null);
  };

  // About Us Modal
  const [isAboutUsModalOpen, setIsAboutUsModalOpen] = useState(false);
  const openAboutUsModal = () => setIsAboutUsModalOpen(true);

  // User Feedback System
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const openFeedbackModal = () => setIsFeedbackModalOpen(true);

  // Safety Violation Suspension Notice
  const [activeSuspensionNotice, setActiveSuspensionNotice] = useState<SuspensionNoticeData | null>(null);

  const openSuspensionNotice = (user: UserProfile, detectedKeyword?: string, prohibitedText?: string) => {
    const expiry = user.suspensionExpiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const suspendedAt = user.suspendedAt || new Date().toISOString();
    setActiveSuspensionNotice({
      isOpen: true,
      userToken: user.userToken,
      userName: user.fullName,
      detectedKeyword: detectedKeyword || user.suspensionReason || 'Prohibited Private Accommodation Keyword',
      prohibitedText: prohibitedText || user.prohibitedVenueAttempt || 'Restricted accommodation booking attempt',
      suspensionExpiryDate: expiry,
      suspendedAt,
    });
  };

  const closeSuspensionNotice = () => {
    setActiveSuspensionNotice(null);
  };

  const liftUserSuspension = (userToken: string) => {
    setUsersAndCompanions((prev) =>
      prev.map((u) => {
        if (u.userToken === userToken) {
          return {
            ...u,
            accountStatus: 'Active' as const,
            suspensionExpiryDate: undefined,
            suspensionReason: undefined,
            suspendedAt: undefined,
            prohibitedVenueAttempt: undefined,
          };
        }
        return u;
      })
    );
    if (currentUser?.userToken === userToken) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              accountStatus: 'Active' as const,
              suspensionExpiryDate: undefined,
              suspensionReason: undefined,
              suspendedAt: undefined,
              prohibitedVenueAttempt: undefined,
            }
          : null
      );
    }
    if (activeSuspensionNotice?.userToken === userToken) {
      setActiveSuspensionNotice(null);
    }
    addAuditLog('User Suspension Lifted', `Founder restored active account standing for ${userToken}.`);
  };

  const suspendUserForSafetyViolation = (
    userToken: string,
    detectedKeyword?: string,
    prohibitedText?: string
  ) => {
    const nowIso = new Date().toISOString();
    const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 Days (7 * 24 * 60 * 60 * 1000 ms)
    const expiryIso = new Date(expiryTime).toISOString();
    const reason = detectedKeyword
      ? `Prohibited keyword detected: "${detectedKeyword}"`
      : 'Prohibited private accommodation venue attempt';

    // 1. Update user account status to 'Suspended'
    setUsersAndCompanions((prev) =>
      prev.map((u) => {
        if (u.userToken === userToken) {
          return {
            ...u,
            accountStatus: 'Suspended' as const,
            suspensionExpiryDate: expiryIso,
            suspensionReason: reason,
            suspendedAt: nowIso,
            prohibitedVenueAttempt: prohibitedText || u.prohibitedVenueAttempt,
          };
        }
        return u;
      })
    );

    const targetUser = usersAndCompanions.find((u) => u.userToken === userToken) || currentUser;

    // 2. High-priority Audit Log for Admin Vault
    addAuditLog(
      '🚨 SAFETY VIOLATION: User Suspended for 7 Days',
      `User ${userToken} (${targetUser?.fullName || 'Booker'}) attempted booking with prohibited venue keyword [${detectedKeyword || 'UNKNOWN'}]. Attempted submission: "${prohibitedText || 'N/A'}". Account suspended until ${new Date(expiryTime).toLocaleDateString()}.`
    );

    // 3. File automated Safety Report so it is tracked in Safety & Violations
    const reportToken = `SAF-SUSP-${Math.floor(1000 + Math.random() * 9000)}`;
    const autoReport: SafetyReport = {
      id: `REP-AUTO-${Date.now()}`,
      reportToken,
      reportedUserToken: userToken,
      reportedByToken: 'CIRQLR-SAFETY-DAEMON',
      category: 'Private Venue Proposition',
      details: `Automated 7-day safety suspension triggered. User attempted to book prohibited accommodation containing keyword "${detectedKeyword}". Submission text: "${prohibitedText}".`,
      venueAddress: prohibitedText || 'Restricted Location Attempt',
      timestamp: nowIso,
      status: 'Action Taken',
      adminResolutionNotes: `Account automatically suspended for 7 days until ${expiryIso} by system safety filter.`,
    };
    setSafetyReports((prev) => [autoReport, ...prev]);

    // 4. Update currentUser and show suspension modal
    if (currentUser?.userToken === userToken) {
      const updatedCurrent: UserProfile = {
        ...currentUser,
        accountStatus: 'Suspended' as const,
        suspensionExpiryDate: expiryIso,
        suspensionReason: reason,
        suspendedAt: nowIso,
        prohibitedVenueAttempt: prohibitedText || currentUser.prohibitedVenueAttempt,
      };
      setCurrentUser(updatedCurrent);
      openSuspensionNotice(updatedCurrent, detectedKeyword, prohibitedText);
    } else if (targetUser) {
      openSuspensionNotice(targetUser, detectedKeyword, prohibitedText);
    }
  };

  const [platformFeedbacks, setPlatformFeedbacks] = useState<UserFeedback[]>(() => {
    try {
      const saved = localStorage.getItem('cirqlr_feedbacks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strictly filter out any legacy dummy feedback entries
          const dummyIds = new Set(['FDB-001', 'FDB-002', 'FDB-003']);
          const dummyNames = new Set(['Ananya Roy', 'Smita Dash', 'Sourav Mukherjee']);
          return parsed.filter(
            (f: UserFeedback) => !dummyIds.has(f.id) && !dummyNames.has(f.userName)
          );
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const submitFeedback = (input: Omit<UserFeedback, 'id' | 'submittedAt'>) => {
    const newFeedback: UserFeedback = {
      ...input,
      id: `FDB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      submittedAt: new Date().toISOString(),
    };

    setPlatformFeedbacks((prev) => [newFeedback, ...prev]);
    addAuditLog(
      'User Feedback Submitted',
      `${input.userName} (${input.userToken}) submitted ${input.rating}-Star [${input.category}] feedback: "${input.message.slice(0, 50)}..."`
    );
  };

  const deleteFeedback = (feedbackId: string) => {
    setPlatformFeedbacks((prev) => {
      const target = prev.find((f) => f.id === feedbackId);
      const filtered = prev.filter((f) => f.id !== feedbackId);
      if (target) {
        addAuditLog(
          'User Feedback Removed',
          `Admin deleted feedback ${feedbackId} submitted by ${target.userName} (${target.userToken}).`
        );
      }
      return filtered;
    });
  };

  // On initial mount, purge any leftover hash from previous session to ensure Home screen displays cleanly
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const lower = window.location.hash.toLowerCase();
      if (['#terms', '#terms-and-conditions', '#privacy', '#privacy-policy', '#refund', '#refund-policy', '#about'].includes(lower)) {
        try {
          window.history.replaceState('', document.title, window.location.pathname + window.location.search);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // User-Specific Saved Companions Helper
  const getSavedCompanionsKey = (user: UserProfile | null): string | null => {
    if (!user) return null;
    const userKey = user.userToken || (user as { id?: string }).id || user.phoneNumber;
    return userKey ? `cirqlr_saved_${userKey}` : null;
  };

  // Saved Companions / Shortlist - strictly user-specific
  const [savedCompanionTokens, setSavedCompanionTokens] = useState<string[]>(() => {
    try {
      const key = getSavedCompanionsKey(currentUser);
      if (!key) return [];
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-scope and synchronize saved companions whenever currentUser logs in, registers, switches, or logs out
  useEffect(() => {
    if (!currentUser) {
      setSavedCompanionTokens([]);
      return;
    }
    const key = getSavedCompanionsKey(currentUser);
    if (!key) {
      setSavedCompanionTokens([]);
      return;
    }
    try {
      const saved = localStorage.getItem(key);
      setSavedCompanionTokens(saved ? JSON.parse(saved) : []);
    } catch {
      setSavedCompanionTokens([]);
    }
  }, [currentUser?.userToken, currentUser?.phoneNumber]);

  const toggleSaveCompanion = (companionToken: string) => {
    if (!currentUser) return;
    const key = getSavedCompanionsKey(currentUser);
    if (!key) return;

    setSavedCompanionTokens((prev) => {
      const next = prev.includes(companionToken)
        ? prev.filter((t) => t !== companionToken)
        : [...prev, companionToken];
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (err) {
        console.error('[User Saved Companions Storage Error]', err);
      }
      return next;
    });
  };

  const isCompanionSaved = (companionToken: string): boolean => {
    if (!currentUser) return false;
    return savedCompanionTokens.includes(companionToken);
  };

  // Sync state to LocalStorage safely with QuotaExceededError protection
  useEffect(() => {
    safeSetItem('sangha_v4_settings', JSON.stringify(platformSettings));
  }, [platformSettings]);

  useEffect(() => {
    if (currentUser) {
      safeSetItem('cirqlr_active_user_token', currentUser.userToken);
      safeSetItem('sangha_v4_current_user', JSON.stringify(currentUser));
      safeRemoveItem('vibego_v1_current_user');
    } else {
      safeRemoveItem('cirqlr_active_user_token');
      safeRemoveItem('sangha_v4_current_user');
      safeRemoveItem('vibego_v1_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    safeSetItem('sangha_v4_users', JSON.stringify(usersAndCompanions));
    safeRemoveItem('vibego_v1_users');
  }, [usersAndCompanions]);

  useEffect(() => {
    safeSetItem('sangha_v4_cards', JSON.stringify(activityCards));
  }, [activityCards]);

  useEffect(() => {
    safeSetItem('sangha_v4_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    safeSetItem('sangha_v4_payments', JSON.stringify(paymentsLedger));
  }, [paymentsLedger]);

  useEffect(() => {
    safeSetItem('sangha_v4_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    safeSetItem('sangha_v4_reports', JSON.stringify(safetyReports));
  }, [safetyReports]);

  useEffect(() => {
    safeSetItem('sangha_v4_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    safeSetItem('cirqlr_feedbacks', JSON.stringify(platformFeedbacks));
  }, [platformFeedbacks]);

  // Audit Helper
  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      adminToken: 'FOUNDER-ROOT',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // AUTHENTICATION METHODS
  const openAuthModal = () => setIsAuthModalOpen(true);

  const findUserByPhoneOrEmail = (identifier?: string): UserProfile | undefined => {
    if (!identifier || typeof identifier !== 'string') return undefined;
    const trimmed = identifier.trim();
    if (!trimmed) return undefined;
    const cleanDigits = trimmed.replace(/\D/g, '');
    const cleanEmail = trimmed.toLowerCase();

    return usersAndCompanions.find((u) => {
      const uDigits = (u.phoneNumber || '').replace(/\D/g, '');
      const uEmail = (u.email || '').toLowerCase();

      // 10-digit mobile number match
      if (cleanDigits.length === 10) {
        if (uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits)) {
          return true;
        }
      }
      // Gmail/Email match
      if (cleanEmail.includes('@') && uEmail && uEmail === cleanEmail) {
        return true;
      }
      // Partial phone match if >= 7 digits
      if (cleanDigits.length >= 7) {
        if (uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits)) {
          return true;
        }
      }
      return false;
    });
  };

  const loginUserAccount = (user: UserProfile) => {
    setCurrentUser(user);
    addAuditLog('User Logged In', `Session authenticated for ${user.userToken} (${user.fullName}).`);
  };

  const loginWithOtp = (rawPhoneNumberOrEmail?: string) => {
    const user = findUserByPhoneOrEmail(rawPhoneNumberOrEmail);

    if (user) {
      if (user.accountStatus === 'Suspended') {
        const isExpired = user.suspensionExpiryDate && Date.now() >= new Date(user.suspensionExpiryDate).getTime();
        if (isExpired) {
          liftUserSuspension(user.userToken);
          user.accountStatus = 'Active';
        } else {
          openSuspensionNotice(user);
        }
      }
      setCurrentUser(user);
      addAuditLog('User Logged In', `Session authenticated for ${user.userToken} (${user.fullName}).`);
      return { success: true, isNewUser: false, user };
    }

    return { success: false, isNewUser: true };
  };

  const loginWithPassword = (identifier: string, password: string) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    if (!cleanId) {
      return { success: false, error: 'Please enter your User ID or Gmail address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your account password.' };
    }

    const user = usersAndCompanions.find(
      (u) =>
        u.userToken.toLowerCase() === cleanId ||
        (u.email && u.email.trim().toLowerCase() === cleanId)
    );

    if (!user) {
      return {
        success: false,
        error: 'No account found with this User ID or Gmail address. Please check your credentials or switch to Sign Up.',
      };
    }

    if (!user.password) {
      return {
        success: false,
        error: 'No password is set on this account. Please use "Forgot Password? Login via Gmail OTP" below to log in.',
      };
    }

    if (user.password !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please verify and try again, or use Gmail OTP login.',
      };
    }

    if (user.accountStatus === 'Suspended') {
      const isExpired = user.suspensionExpiryDate && Date.now() >= new Date(user.suspensionExpiryDate).getTime();
      if (isExpired) {
        liftUserSuspension(user.userToken);
        user.accountStatus = 'Active';
      } else {
        openSuspensionNotice(user);
      }
    }

    setCurrentUser(user);
    addAuditLog('User Logged In', `Session authenticated with password for ${user.userToken} (${user.fullName}).`);
    return { success: true, user };
  };

  const resetUserPassword = (userToken: string, newPassword: string): { success: boolean; user?: UserProfile; error?: string } => {
    const user = usersAndCompanions.find((u) => u.userToken === userToken);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }
    const updatedUser: UserProfile = { ...user, password: newPassword };
    setUsersAndCompanions((prev) => {
      const next = prev.map((u) => (u.userToken === userToken ? updatedUser : u));
      try {
        localStorage.setItem('vibego_v1_users', JSON.stringify(next));
        localStorage.setItem('sangha_v4_users', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to sync updated password to localStorage', e);
      }
      return next;
    });
    if (currentUser?.userToken === userToken) {
      setCurrentUser(updatedUser);
    }
    addAuditLog('Password Reset', `Password updated successfully for ${user.userToken} (${user.fullName}).`);
    return { success: true, user: updatedUser };
  };

  const submitAddressVerification = (
    userToken: string,
    documentType: AllowedDocumentType,
    documentImageUrl?: string,
    residentialAddress?: string,
    documentIdNumber?: string
  ) => {
    const user = usersAndCompanions.find((u) => u.userToken === userToken);
    if (!user) return { success: false };

    const effectiveDocImage = (documentImageUrl || user.documentImageUrl || user.idDocumentUrl || '').trim();
    const isNowVerified = Boolean(effectiveDocImage);
    const nowIso = new Date().toISOString();

    const newRecord: IdVerificationRecord = {
      id: `VERIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      documentType,
      idNumber: documentIdNumber || user.documentIdNumber,
      documentImageUrl: effectiveDocImage || undefined,
      residentialAddress: residentialAddress || user.residentialAddress || '',
      submittedAt: nowIso,
      status: isNowVerified ? 'Verified' : 'Pending Review',
    };

    // Maintain complete audit history - NEVER delete prior submissions
    const updatedHistory: IdVerificationRecord[] = [...(user.verificationHistory || []), newRecord];

    const updatedUser: UserProfile = {
      ...user,
      documentType,
      documentIdNumber: documentIdNumber || user.documentIdNumber,
      documentImageUrl: effectiveDocImage || undefined,
      idDocumentUrl: effectiveDocImage || undefined,
      residentialAddress: residentialAddress || user.residentialAddress,
      idSubmittedAt: nowIso,
      verificationHistory: updatedHistory,
      verificationStatus: isNowVerified ? 'Verified' : 'Unverified',
      isVerified: isNowVerified,
    };

    setUsersAndCompanions((prev) =>
      prev.map((u) => (u.userToken === userToken ? updatedUser : u))
    );
    if (currentUser?.userToken === userToken) {
      setCurrentUser(updatedUser);
    }
    addAuditLog(
      'ID Verification Uploaded',
      `${userToken} uploaded ${documentType} for identity verification. Automated Instant Verification: ${isNowVerified ? 'ACTIVE & VERIFIED' : 'UNVERIFIED'}. ID record added to audit log.`
    );
    return { success: true, user: updatedUser };
  };

  const registerUser = (input: {
    fullName: string;
    phoneNumber: string;
    email: string;
    age: number;
    gender: 'Female' | 'Male' | 'Non-Binary' | 'Non-Binary / Prefer not to say';
    city: UserCity;
    bio?: string;
    residentialAddress?: string;
    password?: string;
    avatarUrl?: string;
    documentType?: AllowedDocumentType;
    documentIdNumber?: string;
    documentImageUrl?: string;
    referralCode?: string;
  }) => {
    // STRICT 21+ VALIDATION
    if (input.age < 21) {
      return {
        success: false,
        error: 'Safety Rule: You must be at least 21 years old to register. Underage registrations are blocked.',
      };
    }

    const cleanDigits = input.phoneNumber.replace(/\D/g, '').slice(-10);
    const cleanEmail = input.email.trim().toLowerCase();

    // Prevent duplicate accounts if Phone or Gmail is already registered
    const phoneExists = usersAndCompanions.some((u) => {
      const uDigits = u.phoneNumber.replace(/\D/g, '');
      return uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits);
    });
    if (phoneExists) {
      return {
        success: false,
        error: 'An account with this Mobile Number is already registered. Please switch to Log In.',
      };
    }

    const emailExists = usersAndCompanions.some((u) => {
      return u.email && u.email.toLowerCase() === cleanEmail;
    });
    if (emailExists) {
      return {
        success: false,
        error: 'An account with this Gmail address is already registered. Please switch to Log In.',
      };
    }

    const isWB = ['Kolkata', 'Siliguri', 'Durgapur'].includes(input.city);
    const statePrefix = isWB ? 'WB' : 'OD';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const userToken = `USR-${statePrefix}-${randNum}`;

    // Select suitable default avatar based on gender or uploaded photo
    const avatarPool = input.gender === 'Female' ? FEMALE_AVATARS : MALE_AVATARS;
    const defaultAvatar = avatarPool[Math.floor(Math.random() * avatarPool.length)];
    const chosenAvatar = input.avatarUrl && input.avatarUrl.trim() !== '' ? input.avatarUrl.trim() : defaultAvatar;

    // Instant Auto-Verification: All successful 21+ OTP registered users are Verified
    const docImg = (input.documentImageUrl || '').trim();
    const hasDoc = Boolean(docImg);
    const isVerified = true;
    const verificationStatus: VerificationStatus = 'Verified';

    // Build initial verification history if document uploaded at signup
    const nowIso = new Date().toISOString();
    const initialHistory: IdVerificationRecord[] = [];
    if (hasDoc && input.documentType) {
      initialHistory.push({
        id: `VERIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        documentType: input.documentType,
        idNumber: input.documentIdNumber,
        documentImageUrl: docImg,
        residentialAddress: input.residentialAddress || '',
        submittedAt: nowIso,
        status: 'Verified',
      });
    }

    // Process Referral Code & Credit Referrer (+1 credit & +1 referral count)
    const cleanRefInput = (input.referralCode || '').trim().toUpperCase();
    let referredByUser: UserProfile | undefined;
    if (cleanRefInput) {
      referredByUser = usersAndCompanions.find((u) => {
        const uCode = (u.referralCode || '').toUpperCase();
        const uToken = (u.userToken || '').toUpperCase();
        const uRefToken = uToken.replace('USR-', 'REF-');
        return uCode === cleanRefInput || uRefToken === cleanRefInput || uToken === cleanRefInput;
      });
    }

    if (referredByUser) {
      const refToken = referredByUser.userToken;
      const updatedCredits = (referredByUser.referralCredits || 0) + 1;
      const updatedTotal = (referredByUser.totalReferrals || 0) + 1;
      setUsersAndCompanions((prev) =>
        prev.map((u) =>
          u.userToken === refToken
            ? { ...u, referralCredits: updatedCredits, totalReferrals: updatedTotal, isCommunityAmbassador: true }
            : u
        )
      );
      if (currentUser?.userToken === refToken) {
        setCurrentUser((prev) =>
          prev ? { ...prev, referralCredits: updatedCredits, totalReferrals: updatedTotal, isCommunityAmbassador: true } : null
        );
      }
      addAuditLog(
        'Referral Reward Credited',
        `User ${userToken} registered using referral code "${cleanRefInput}". Referrer ${referredByUser.fullName} (${refToken}) awarded +1 5% Fee Waiver discount credit (Total Credits: ${updatedCredits}) and Community Ambassador status.`
      );
    }

    const newUser: UserProfile = {
      userToken,
      fullName: input.fullName.trim(),
      age: input.age,
      gender: input.gender,
      city: input.city,
      state: isWB ? 'West Bengal' : 'Odisha',
      serviceAreas: [`${input.city} Central Hub & Commercial Centers`],
      bio:
        input.bio?.trim() ||
        'Verified community member interested in cultural outings, specialty cafes, and thoughtful conversation in public venues.',
      languages: isWB ? ['Bengali', 'Hindi', 'English'] : ['Odia', 'Hindi', 'English'],
      avatarUrl: chosenAvatar,
      phoneNumber: `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`,
      email: cleanEmail,
      password: input.password || undefined,
      residentialAddress: input.residentialAddress?.trim() || undefined,
      documentType: input.documentType,
      documentIdNumber: input.documentIdNumber,
      documentImageUrl: docImg || undefined,
      idDocumentUrl: docImg || undefined,
      idSubmittedAt: hasDoc ? nowIso : undefined,
      verificationHistory: initialHistory,
      verificationStatus,
      isVerified,
      hourlyRate: 350,
      outingCategories: ['Verified Cafe & Restaurant', 'Public Cultural / Live Event'],
      rating: 0,
      reviewCount: 0,
      completedOutingsCount: 0,
      accountStatus: 'Active',
      isCompanionAvailable: true,
      joinedDate: nowIso.split('T')[0],
      interests: ['Books & Literature', 'Specialty Tea & Coffee', 'Art Galleries'],
      isProCompanion: false,
      isPremiumCompanion: false,
      subscriptionPlan: 'Free Tier',
      subscriptionStatus: 'none',
      referralCode: `REF-${userToken.replace('USR-', '')}`,
      totalReferrals: 0,
      referralCredits: 0,
      isCommunityAmbassador: false,
      referredByCode: cleanRefInput || undefined,
      cancellationCreditBalance: 0,
      monthlyLifelineUsed: 0,
      monthlyLifelineMonth: nowIso.slice(0, 7),
    };

    // Starter Activity Package Card to guarantee immediate live visibility in Explore
    const starterCardId = `CARD-${userToken.replace('USR-', '')}-101`;
    const starterCard: ActivityPackageCard = {
      id: starterCardId,
      companionToken: userToken,
      title: `${input.city} Social Outing & Cafe Meetup`,
      venueCategory: 'Verified Cafe & Restaurant',
      shortDescription: 'Friendly conversation over coffee or tea at verified cafes, shopping malls, or cultural venues.',
      city: input.city,
      hourlyRate: 350,
      createdAt: nowIso,
    };

    setUsersAndCompanions((prev) => [newUser, ...prev.filter((u) => u.userToken !== newUser.userToken)]);
    setCurrentUser(newUser);
    safeSetItem('cirqlr_active_user_token', newUser.userToken);
    safeSetItem('sangha_v4_current_user', JSON.stringify(newUser));

    setActivityCards((prev) => [starterCard, ...prev.filter((c) => c.id !== starterCard.id)]);
    try {
      const currentCards = JSON.parse(localStorage.getItem('sangha_v4_cards') || '[]');
      localStorage.setItem('sangha_v4_cards', JSON.stringify([starterCard, ...currentCards.filter((c: any) => c?.id !== starterCard.id)]));
    } catch {
      // ignore
    }

    // Persist user and card to Firestore immediately
    syncUserToFirestore(newUser);
    syncCardToFirestore(starterCard);

    addAuditLog(
      'New User Registered',
      `Registered account ${userToken} (${input.fullName}, ${input.gender}, ${input.city}). Address verification: ${input.documentType ? `[${input.documentType}: ${input.documentIdNumber}]` : '[Pending Upload]'}.${referredByUser ? ` Referred by ${referredByUser.fullName} (${cleanRefInput}).` : ''}`
    );

    return { success: true, user: newUser };
  };

  const logOutUser = () => {
    const token = currentUser ? currentUser.userToken : 'Guest';
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    setActiveTab('explore');
    safeRemoveItem('cirqlr_active_user_token');
    safeRemoveItem('sangha_v4_current_user');
    safeRemoveItem('vibego_v1_current_user');
    addAuditLog('User Logged Out', `${token} logged out. Returned to clean public landing view.`);
  };

  const deleteUserAccountAndWithdrawConsent = (reason?: string): { success: boolean; error?: string } => {
    if (!currentUser) {
      return { success: false, error: 'No active user session found.' };
    }

    // Safety Guard: Check if the user has an active confirmed outing, pending booking, or unresolved dispute
    const activeOutingOrDispute = bookings.find((b) => {
      const isUserInvolved =
        (b.bookerId || b.bookerToken) === currentUser.userToken ||
        (b.companionId || b.companionToken) === currentUser.userToken;
      if (!isUserInvolved) return false;
      const isOutingActive = b.status === 'Accepted' || b.status === 'Pending';
      return isOutingActive;
    });

    if (activeOutingOrDispute) {
      return {
        success: false,
        error: `Account deletion blocked: You have an active ${activeOutingOrDispute.status} outing (${activeOutingOrDispute.id}) or unresolved dispute. Please complete or cancel upcoming outings before requesting deletion.`,
      };
    }

    const now = Date.now();
    const purgeTimestamp = now + 365 * 24 * 60 * 60 * 1000; // 365-day legal archive hold per DPDP Act 2023 / IT Act standards

    // 1. Immediately remove activity cards from Public Explore
    setActivityCards((prev) => prev.filter((c) => c.companionToken !== currentUser.userToken));

    // 2. Mark account as Deleted_Archived with statutory holding dates
    setUsersAndCompanions((prev) =>
      prev.map((u) =>
        u.userToken === currentUser.userToken
          ? {
              ...u,
              accountStatus: 'Deleted_Archived' as AccountStatus,
              deletedAt: now,
              purgeAfter: purgeTimestamp,
              deletionReason: reason || 'User requested account deletion and withdrawal of consent under DPDP Act 2023',
              isCompanionAvailable: false,
            }
          : u
      )
    );

    // Sync to Firestore
    syncUserToFirestore({
      ...currentUser,
      accountStatus: 'Deleted_Archived',
      deletedAt: now,
      purgeAfter: purgeTimestamp,
      deletionReason: reason || 'User requested account deletion and withdrawal of consent under DPDP Act 2023',
      isCompanionAvailable: false,
    });

    addAuditLog(
      'Account Deleted & Consent Withdrawn',
      `User ${currentUser.userToken} (${currentUser.fullName}) requested account deletion. Public profile and cards hidden immediately; account placed on 1-year statutory hold until ${new Date(purgeTimestamp).toLocaleDateString()}.`
    );

    // 3. Immediately log out and clean session
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    setActiveTab('explore');
    safeRemoveItem('cirqlr_active_user_token');
    safeRemoveItem('sangha_v4_current_user');
    safeRemoveItem('vibego_v1_current_user');

    return { success: true };
  };

  const permanentlyPurgeArchivedUser = (userToken: string) => {
    setUsersAndCompanions((prev) => prev.filter((u) => u.userToken !== userToken));
    setActivityCards((prev) => prev.filter((c) => c.companionToken !== userToken));
    if (db) {
      deleteDoc(doc(db, 'users', userToken)).catch(console.warn);
      deleteDoc(doc(db, 'wallets', userToken)).catch(console.warn);
    }
    addAuditLog(
      'Permanent Account Purge',
      `User ${userToken} permanently purged from all database records following statutory legal holding period.`
    );
  };

  const openProfileModal = (tab: 'profile' | 'subscription' = 'profile') => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setProfileModalInitialTab(tab);
    setIsProfileModalOpen(true);
  };

  // Perspective 2 Founder Vault Gate
  const unlockFounderVault = () => {
    setIsFounderVaultUnlocked(true);
    try {
      localStorage.setItem('cirqlr_admin_session', 'true');
    } catch {
      // ignore
    }
    addAuditLog('Admin Vault Unlocked', 'Founder authenticated into Root Command Center.');
  };

  const lockFounderVault = () => {
    setIsFounderVaultUnlocked(false);
    try {
      localStorage.removeItem('cirqlr_admin_session');
    } catch {
      // ignore
    }
    addAuditLog('Admin Vault Locked', 'Founder logged out of Root Command Center.');
  };

  // Platform Settings Controls
  const updatePlatformSettings = (newSettings: Partial<PlatformSettings>, reason?: string) => {
    setPlatformSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      addAuditLog(
        'Platform Settings Updated',
        `Parameters modified: ${Object.keys(newSettings).join(', ')}. ${reason ? `Reason: ${reason}` : ''}`
      );
      return updated;
    });
  };

  const updateAdminMasterPasskey = (newPasskey: string): boolean => {
    if (!newPasskey || newPasskey.trim().length < 6) return false;
    setPlatformSettings((prev) => ({ ...prev, adminMasterPasskey: newPasskey.trim() }));
    addAuditLog('Master Passkey Rotated', 'Root Founder master passkey updated successfully.');
    return true;
  };

  const addAllowedVenueCategory = (category: string) => {
    if (!category.trim()) return;
    if (platformSettings.allowedPublicVenueCategories.includes(category.trim())) return;
    const updated = [...platformSettings.allowedPublicVenueCategories, category.trim()];
    updatePlatformSettings({ allowedPublicVenueCategories: updated }, `Added venue category: ${category}`);
  };

  const removeAllowedVenueCategory = (category: string) => {
    const updated = platformSettings.allowedPublicVenueCategories.filter((c) => c !== category);
    updatePlatformSettings({ allowedPublicVenueCategories: updated }, `Removed venue category: ${category}`);
  };

  const resetSettingsToDefault = () => {
    setPlatformSettings(DEFAULT_PLATFORM_SETTINGS);
    addAuditLog('Platform Settings Reset', 'Reverted fee and rules matrix to factory defaults.');
  };

  // Users Directory & Profile Management
  const getUserByToken = (token: string): UserProfile | undefined => {
    if (currentUser?.userToken === token) return currentUser;
    return usersAndCompanions.find((u) => u.userToken === token);
  };

  const updateUserAccountStatus = (userToken: string, status: AccountStatus, note?: string) => {
    let targetUser: UserProfile | undefined;
    if (currentUser?.userToken === userToken) {
      setCurrentUser((prev) => (prev ? { ...prev, accountStatus: status } : null));
    }
    setUsersAndCompanions((prev) =>
      prev.map((u) => {
        if (u.userToken === userToken) {
          targetUser = { ...u, accountStatus: status };
          return targetUser;
        }
        return u;
      })
    );
    if (targetUser) {
      syncUserToFirestore(targetUser);
    }
    addAuditLog(
      'Account Standing Updated',
      `Account ${userToken} set to [${status}]. ${note ? `Note: ${note}` : ''}`
    );
  };

  // Direct Verify Tick (Approve ID ✔)
  const verifyUserIdentity = (userToken: string) => {
    let targetUser: UserProfile | undefined;
    if (currentUser?.userToken === userToken) {
      setCurrentUser((prev) => (prev ? { ...prev, verificationStatus: 'ID Verified' } : null));
    }
    setUsersAndCompanions((prev) =>
      prev.map((u) => {
        if (u.userToken === userToken) {
          targetUser = { ...u, verificationStatus: 'ID Verified' };
          return targetUser;
        }
        return u;
      })
    );
    if (targetUser) {
      syncUserToFirestore(targetUser);
    }
    addAuditLog(
      'User ID Verified',
      `Founder approved government ID verification for ${userToken}. User is now live in public Explore!`
    );
  };

  // ADMIN PANEL MANUAL WALLET CREDIT ADJUSTMENT (+ / - ₹)
  const adjustUserWalletCredit = (userToken: string, deltaAmount: number, reason: string) => {
    const cleanReason = (reason || '').trim() || 'Admin Manual Wallet Adjustment';
    const nowIso = new Date().toISOString();
    const wltId = `wlt_adm_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const txnEntry: WalletTransactionEntry = {
      id: wltId,
      paymentReferenceId: wltId,
      type: deltaAmount >= 0 ? 'credit' : 'debit',
      amount: Math.abs(deltaAmount),
      reason: cleanReason,
      timestamp: nowIso,
      adminToken: 'FOUNDER-ROOT',
    };

    setUsersAndCompanions((prev) =>
      prev.map((u) => {
        if (u.userToken === userToken) {
          const currentBal = u.cancellationCreditBalance || 0;
          const newBal = Math.max(0, currentBal + deltaAmount);
          const history = [txnEntry, ...(u.walletHistory || [])];
          return {
            ...u,
            cancellationCreditBalance: newBal,
            walletHistory: history,
          };
        }
        return u;
      })
    );

    if (currentUser?.userToken === userToken) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const currentBal = prev.cancellationCreditBalance || 0;
        const newBal = Math.max(0, currentBal + deltaAmount);
        const history = [txnEntry, ...(prev.walletHistory || [])];
        return {
          ...prev,
          cancellationCreditBalance: newBal,
          walletHistory: history,
        };
      });
    }

    addAuditLog(
      'Manual Wallet Credit Adjustment',
      `Admin adjusted wallet for ${userToken} by ${deltaAmount >= 0 ? '+' : ''}₹${deltaAmount}. Reason: "${cleanReason}".`
    );
  };

  const updateCurrentUserProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setUsersAndCompanions((prev) => {
      const next = prev.map((u) => (u.userToken === currentUser.userToken ? updatedUser : u));
      safeSetItem('sangha_v4_current_user', JSON.stringify(updatedUser));
      safeSetItem('sangha_v4_users', JSON.stringify(next));
      return next;
    });
    syncUserToFirestore(updatedUser);
    addAuditLog('User Profile Updated', `${currentUser.userToken} updated profile details.`);
  };

  const updateCurrentUserEmail = (newEmail: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'No user is currently logged in.' };
    const clean = (newEmail || '').trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return { success: false, error: 'Please enter a valid Gmail / Email address (e.g. name@gmail.com).' };
    }

    // Check if another account is already registered with this Gmail
    const duplicate = usersAndCompanions.some(
      (u) => u.userToken !== currentUser.userToken && (u.email || '').toLowerCase() === clean
    );
    if (duplicate) {
      return { success: false, error: 'This Gmail address is already registered to another account.' };
    }

    const updatedUser: UserProfile = { ...currentUser, email: clean };
    setCurrentUser(updatedUser);
    setUsersAndCompanions((prev) => {
      const next = prev.map((u) => (u.userToken === currentUser.userToken ? updatedUser : u));
      safeSetItem('sangha_v4_current_user', JSON.stringify(updatedUser));
      safeSetItem('sangha_v4_users', JSON.stringify(next));
      return next;
    });

    addAuditLog(
      'Gmail Address Linked',
      `${currentUser.userToken} (${currentUser.fullName}) linked Gmail address: ${clean}. Saved to localStorage.`
    );

    return { success: true };
  };

  // Companion Pro 1-Month (30 Days) Membership - Instant Automatic Activation
  const submitProSubscriptionPayment = (companionToken: string, customRefId?: string): string => {
    const basePrice = platformSettings.proSubscriptionMonthlyPrice;
    const discount = platformSettings.proOccasionDiscountPercent;
    const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
    const refId = customRefId || `pay_RZP_${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const targetUser = getUserByToken(companionToken);
    const companionName = targetUser ? targetUser.fullName : 'Companion';

    const newLedgerEntry: PaymentLedgerEntry = {
      id: `TXN-PRO-${Date.now()}`,
      razorpayRefId: refId,
      paymentReferenceId: refId,
      type: '1-Month Pro Subscription',
      companionToken,
      companionName,
      grossOutingValue: finalPrice,
      feeAmount: finalPrice,
      status: 'VERIFIED & RELEASED',
      timestamp: nowIso,
      verifiedAt: nowIso,
    };

    setPaymentsLedger((prev) => [newLedgerEntry, ...prev]);

    // Automatically activate Pro immediately upon Razorpay payment!
    subscribeCompanionPro(companionToken);

    addAuditLog(
      'Pro Subscription Paid & Activated',
      `Companion ${companionToken} upgraded to 1-Month Pro Pass via ${refId} (₹${finalPrice}). Activated automatically.`
    );

    return refId;
  };

  const subscribeCompanionPro = (companionToken: string) => {
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + 30);

    const startIso = startDate.toISOString();
    const expiryIso = expiryDate.toISOString();

    const updatedFields: Partial<UserProfile> = {
      isProCompanion: true,
      isPremiumCompanion: true,
      subscriptionPlan: 'Companion Pro (1-Month Pass)',
      subscriptionStatus: 'active',
      subscriptionStartDate: startIso,
      subscriptionExpiryDate: expiryIso,
      subscriptionActivatedOn: startIso,
      subscriptionExpiresOn: expiryIso,
      subscriptionPaymentStatus: 'verified',
    };

    if (currentUser?.userToken === companionToken) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }
    setUsersAndCompanions((prev) =>
      prev.map((u) => (u.userToken === companionToken ? { ...u, ...updatedFields } : u))
    );

    addAuditLog(
      'Companion Pro 30-Day Pass Activated',
      `Companion ${companionToken} upgraded to 1-Month Pro Pass. Valid until ${expiryIso.split('T')[0]}. Unlimited activity cards unlocked.`
    );
  };

  // Activity Cards Management
  const getCompanionActivityCards = (companionToken: string): ActivityPackageCard[] => {
    return activityCards.filter((c) => c.companionToken === companionToken);
  };

  const createActivityCard = (
    card: Omit<ActivityPackageCard, 'id' | 'createdAt'>
  ): { success: boolean; requiresPro?: boolean; card?: ActivityPackageCard } => {
    if (!currentUser) return { success: false };

    const companionToken = card.companionToken || currentUser.userToken;
    const authorUser = getUserByToken(companionToken) || currentUser;

    // Check if user is currently in 7-day restricted mode
    if (authorUser.accountStatus === 'Suspended') {
      openSuspensionNotice(authorUser);
      return { success: false };
    }

    // Safety scanner on card title, venue category, and description
    const safetyCheck = checkVenueSafety(card.title, card.venueCategory, card.shortDescription);
    if (safetyCheck.isForbidden) {
      suspendUserForSafetyViolation(
        companionToken,
        safetyCheck.detectedKeyword,
        `Activity Card: "${card.title}" | Venue: "${card.venueCategory}" | Details: "${card.shortDescription}"`
      );
      return { success: false };
    }

    const isPro = Boolean(authorUser.isProCompanion || authorUser.isPremiumCompanion);
    const existingCards = getCompanionActivityCards(companionToken);

    if (!isPro && existingCards.length >= 3) {
      return { success: false, requiresPro: true };
    }

    const newCard: ActivityPackageCard = {
      ...card,
      companionToken,
      id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    setActivityCards((prev) => [newCard, ...prev]);
    syncCardToFirestore(newCard);
    addAuditLog(
      'Activity Card Created',
      `Card "${newCard.title}" created for companion ${companionToken} at ₹${newCard.hourlyRate}/hr.`
    );

    return { success: true, card: newCard };
  };

  const updateActivityCard = (id: string, updates: Partial<ActivityPackageCard>) => {
    if (currentUser?.accountStatus === 'Suspended') {
      openSuspensionNotice(currentUser);
      return;
    }

    // Scan updated title, venue, and description if provided
    if (updates.title || updates.venueCategory || updates.shortDescription) {
      const safetyCheck = checkVenueSafety(
        updates.title || '',
        updates.venueCategory || '',
        updates.shortDescription || ''
      );
      if (safetyCheck.isForbidden && currentUser) {
        suspendUserForSafetyViolation(
          currentUser.userToken,
          safetyCheck.detectedKeyword,
          `Modified Card: "${updates.title || ''}" | Venue: "${updates.venueCategory || ''}" | Details: "${updates.shortDescription || ''}"`
        );
        return;
      }
    }

    setActivityCards((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          syncCardToFirestore(updated);
          return updated;
        }
        return c;
      })
    );
    addAuditLog('Activity Card Modified', `Card ID ${id} parameters updated.`);
  };

  const deleteActivityCard = (id: string) => {
    setActivityCards((prev) => prev.filter((c) => c.id !== id));
    deleteCardFromFirestore(id);
    addAuditLog('Activity Card Removed', `Card ID ${id} was deleted by owner.`);
  };

  // Fee Calculation Engine (Simplified: Strict 15% Base Fee + Referral Discount Only)
  const isRepeatClientEligible = (_bookerToken: string, _companionToken: string): boolean => {
    // Repeat client discount has been completely removed across the entire platform.
    return false;
  };

  const calculateFee = (
    hourlyRate: number,
    hours: number,
    _isRepeatClient: boolean = false,
    companionReferralCredits: number = 0
  ): FeeCalculationResult => {
    // 1. STRICT SIMPLIFIED FEE FORMULA:
    // baseFee = Math.round(totalBookingAmount * (adminFeePercent / 100)) (Default 15%)
    const totalOutingCost = Math.round(hourlyRate * hours);
    const adminFeePercent = platformSettings.baseAcceptanceFeePercent;
    const baseFee = Math.round(totalOutingCost * (adminFeePercent / 100));

    // 2. REFERRAL DISCOUNT ONLY:
    // If Companion has referralCredits > 0, deduct 5% from baseFee:
    // finalPlatformFee = Math.round(baseFee * 0.95)
    // Otherwise: finalPlatformFee = baseFee (strictly 15%)
    let finalPlatformFee = baseFee;
    let isReferralDiscountApplied = false;
    let discountApplied: 'Repeat Loyalty (5%)' | 'Referral Credit (5%)' | 'None' = 'None';

    if (companionReferralCredits > 0) {
      finalPlatformFee = Math.round(baseFee * 0.95);
      isReferralDiscountApplied = true;
      discountApplied = 'Referral Credit (5%)';
    } else {
      finalPlatformFee = baseFee;
      discountApplied = 'None';
    }

    const effectiveFeePercent = totalOutingCost > 0
      ? Number(((finalPlatformFee / totalOutingCost) * 100).toFixed(1))
      : adminFeePercent;
    const netCompanionEarnings = totalOutingCost - finalPlatformFee;

    return {
      totalOutingCost,
      effectiveFeePercent,
      acceptanceFee: finalPlatformFee,
      isRepeatDiscountApplied: false,
      isReferralDiscountApplied,
      discountApplied,
      netCompanionEarnings,
    };
  };

  // Bookings Lifecycle
  const createBooking = (bookingInput: {
    companionToken: string;
    activityCardId?: string;
    activityTitle: string;
    hourlyRate: number;
    outingDate: string;
    outingTime: string;
    hours: number;
    venueCategory: string;
    venueName: string;
    venueAddress: string;
    purpose: string;
    isRepeatClient?: boolean;
    razorpayRefId?: string;
  }): BookingRecord => {
    if (!currentUser) {
      throw new Error('Must be logged in to request an outing');
    }

    if (currentUser.accountStatus === 'Suspended') {
      openSuspensionNotice(currentUser);
      throw new Error('Account Suspended: You cannot submit outing requests while your 7-day safety hold is active.');
    }

    // Defense-in-depth safety scan for forbidden accommodation keywords
    const safetyCheck = checkVenueSafety(
      bookingInput.venueName,
      bookingInput.venueAddress,
      bookingInput.purpose
    );
    if (safetyCheck.isForbidden) {
      suspendUserForSafetyViolation(
        currentUser.userToken,
        safetyCheck.detectedKeyword,
        `Venue: "${bookingInput.venueName}", Address: "${bookingInput.venueAddress}", Purpose: "${bookingInput.purpose}"`
      );
      throw new Error(`Booking Blocked: Prohibited keyword "${safetyCheck.detectedKeyword}" violates our 100% Commercial Public Venues Policy. Your account has been suspended for 7 days.`);
    }

    const companion = getUserByToken(bookingInput.companionToken);
    const companionName = companion ? companion.fullName : 'Companion';
    const companionReferralCredits = companion?.referralCredits || 0;
    const feeResult = calculateFee(bookingInput.hourlyRate, bookingInput.hours, false, companionReferralCredits);

    const bookingId = `BK-${Date.now()}`;
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const statePrefix = currentUser.state === 'Odisha' ? 'OD' : 'WB';
    const bookingToken = `REQ-${statePrefix}-${randCode}`;

    const newBooking: BookingRecord = {
      id: bookingId,
      bookingToken,
      bookerToken: currentUser.userToken,
      bookerId: currentUser.userToken,
      bookerName: currentUser.fullName,
      bookerEmail: currentUser.email || 'dasabir618@gmail.com',
      companionToken: bookingInput.companionToken,
      companionId: bookingInput.companionToken,
      companionName,
      companionEmail: companion?.email || '',
      activityCardId: bookingInput.activityCardId,
      activityTitle: bookingInput.activityTitle,
      outingDate: bookingInput.outingDate,
      outingTime: bookingInput.outingTime,
      hours: bookingInput.hours,
      hourlyRate: bookingInput.hourlyRate,
      venueCategory: bookingInput.venueCategory,
      venueName: bookingInput.venueName,
      venueAddress: bookingInput.venueAddress,
      purpose: bookingInput.purpose,
      totalOutingCost: feeResult.totalOutingCost,
      feePercentSnapshot: feeResult.effectiveFeePercent,
      acceptanceFee: feeResult.acceptanceFee,
      isRepeatClient: false,
      discountApplied: feeResult.discountApplied,
      referralCreditConsumed: false,
      status: 'Pending Companion Acceptance',
      razorpayRefId: bookingInput.razorpayRefId,
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);

    syncBookingToFirestore(newBooking);

    addAuditLog(
      'Outing Request Created',
      `Booking ${newBooking.bookingToken} initiated: ${currentUser.fullName} -> ${newBooking.companionName} (${newBooking.activityTitle} at ${newBooking.venueName}). Discount applied: [${feeResult.discountApplied}]. Effective Fee: ${feeResult.effectiveFeePercent}%.`
    );

    return newBooking;
  };

  const rejectBooking = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'Rejected by Companion' as const } : b
      )
    );
    addAuditLog(
      'Outing Request Rejected',
      `Booking ${booking.bookingToken || bookingId} declined by Companion ${booking.companionName}. Rejection email webhook triggered.`
    );

    // Trigger Google Apps Script email webhook so Booker receives instant rejection notification
    const bookerUser = getUserByToken(booking.bookerToken);
    const toEmail = booking.bookerEmail || bookerUser?.email || 'dasabir618@gmail.com';

    sendBookingStatusEmail({
      toEmail,
      bookerName: booking.bookerName,
      companionName: booking.companionName,
      companionId: booking.companionId || booking.companionToken,
      activityName: booking.activityTitle,
      venue: `${booking.venueName}${booking.venueAddress ? ` (${booking.venueAddress})` : ''}`,
      dateTime: `${booking.outingDate} ${booking.outingTime ? `at ${booking.outingTime}` : ''} (${booking.hours} hrs)`.trim(),
      amount: booking.totalOutingCost,
      status: 'REJECTED',
      bookingId: booking.bookingToken || booking.id,
    });

    sendCancellationEmail({
      type: 'companion_cancelled',
      bookingToken: booking.bookingToken || booking.id,
      bookerName: booking.bookerName,
      bookerEmail: toEmail,
      companionName: booking.companionName,
      companionEmail: booking.companionEmail || getUserByToken(booking.companionToken)?.email,
      activityTitle: booking.activityTitle,
      venueName: booking.venueName,
      venueAddress: booking.venueAddress,
      outingDate: booking.outingDate,
      outingTime: booking.outingTime,
      amount: booking.totalOutingCost,
      reason: 'Declined by Companion',
      refundDetails: 'Outing request was declined by the companion.',
    });

    syncBookingToFirestore({
      ...booking,
      status: 'Rejected by Companion',
    });
  };

  const markOutingCompleted = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // STRICT CHAT LOCK: Immediately close active chat if it was open for this booking
    if (activeChatBookingId === bookingId) {
      setActiveChatBookingId(null);
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'Completed' as const } : b))
    );

    const companion = getUserByToken(booking.companionToken);
    if (companion) {
      const updatedCount = (companion.completedOutingsCount || 0) + 1;
      setUsersAndCompanions((prev) =>
        prev.map((u) => (u.userToken === companion.userToken ? { ...u, completedOutingsCount: updatedCount } : u))
      );
      if (currentUser?.userToken === companion.userToken) {
        setCurrentUser((prev) => (prev ? { ...prev, completedOutingsCount: updatedCount } : null));
      }
    }

    const booker = getUserByToken(booking.bookerToken);
    if (booker) {
      const updatedBookerCount = (booker.completedOutingsCount || 0) + 1;
      setUsersAndCompanions((prev) =>
        prev.map((u) => (u.userToken === booker.userToken ? { ...u, completedOutingsCount: updatedBookerCount } : u))
      );
      if (currentUser?.userToken === booker.userToken) {
        setCurrentUser((prev) => (prev ? { ...prev, completedOutingsCount: updatedBookerCount } : null));
      }
    }

    const systemMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      bookingId,
      senderToken: 'SYSTEM',
      senderName: 'Cirqlr Security Protocol',
      text: '🔒 Outing marked as Completed by Companion. Encrypted chat channel has permanently closed and locked. Thank you for adhering to our public platonic guidelines.',
      timestamp: new Date().toISOString(),
      isSystemNotice: true,
    };
    setChatMessages((prev) => [...prev, systemMsg]);

    addAuditLog('Outing Completed', `Booking ${booking.bookingToken} marked as Completed by Companion. Chat channel locked.`);
  };

  const submitBookingRating = (bookingId: string, rating: number, review: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              userRating: rating,
              userReview: review.trim(),
              ratingSubmitted: true,
              bookerRating: rating,
              bookerReview: review.trim(),
              bookerRatingSubmitted: true,
            }
          : b
      )
    );

    const companion = getUserByToken(booking.companionToken);
    if (companion) {
      const currentReviews = companion.reviewCount || 0;
      const currentRating = companion.rating || 0;
      const newReviewCount = currentReviews + 1;
      const newRating = currentReviews === 0 
        ? Number(rating.toFixed(2)) 
        : Number(((currentRating * currentReviews + rating) / newReviewCount).toFixed(2));

      setUsersAndCompanions((prev) =>
        prev.map((u) =>
          u.userToken === companion.userToken
            ? { ...u, rating: newRating, reviewCount: newReviewCount }
            : u
        )
      );

      if (currentUser?.userToken === companion.userToken) {
        setCurrentUser((prev) => (prev ? { ...prev, rating: newRating, reviewCount: newReviewCount } : null));
      }
    }

    addAuditLog(
      'Companion Review Submitted',
      `Booker rated Companion ${booking.companionName} (${booking.companionToken}) ${rating} Stars for booking ${booking.bookingToken}. Review: "${review.slice(0, 40)}..."`
    );
  };

  const submitCompanionRatingForBooker = (bookingId: string, rating: number, review: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              companionRating: rating,
              companionReview: review.trim(),
              companionRatingSubmitted: true,
            }
          : b
      )
    );

    const booker = getUserByToken(booking.bookerToken);
    if (booker) {
      const currentReviews = booker.reviewCount || 0;
      const currentRating = booker.rating || 0;
      const newReviewCount = currentReviews + 1;
      const newRating = currentReviews === 0 
        ? Number(rating.toFixed(2)) 
        : Number(((currentRating * currentReviews + rating) / newReviewCount).toFixed(2));

      setUsersAndCompanions((prev) =>
        prev.map((u) =>
          u.userToken === booker.userToken
            ? { ...u, rating: newRating, reviewCount: newReviewCount }
            : u
        )
      );

      if (currentUser?.userToken === booker.userToken) {
        setCurrentUser((prev) => (prev ? { ...prev, rating: newRating, reviewCount: newReviewCount } : null));
      }
    }

    addAuditLog(
      'Booker Review Submitted',
      `Companion rated Booker ${booking.bookerName} (${booking.bookerToken}) ${rating} Stars for booking ${booking.bookingToken}. Review: "${review.slice(0, 40)}..."`
    );
  };

  // Free Reschedule Engine (100% Zero-Loss / Zero-Penalty)
  const rescheduleBooking = (
    bookingId: string,
    newDate: string,
    newTime: string,
    note?: string
  ): boolean => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    const nowIso = new Date().toISOString();
    const reschedulerToken = currentUser?.userToken || booking.bookerToken;
    const reschedulerName = currentUser?.fullName || 'Member';

    const historyEntry: RescheduleHistoryEntry = {
      previousDate: booking.outingDate,
      previousTime: booking.outingTime,
      newDate,
      newTime,
      rescheduledBy: reschedulerName,
      timestamp: nowIso,
      note,
    };

    const updatedHistory = booking.rescheduleHistory
      ? [...booking.rescheduleHistory, historyEntry]
      : [historyEntry];

    setBookings((prev) => {
      const updated = prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              outingDate: newDate,
              outingTime: newTime,
              rescheduledCount: (b.rescheduledCount || 0) + 1,
              rescheduledAt: nowIso,
              rescheduledByToken: reschedulerToken,
              rescheduleHistory: updatedHistory,
            }
          : b
      );
      try {
        localStorage.setItem('sangha_v4_bookings', JSON.stringify(updated));
      } catch (err) {
        console.error('[Reschedule Booking Storage Error]', err);
      }
      return updated;
    });

    const chatNotice: ChatMessage = {
      id: `MSG-RESCHED-${Date.now()}`,
      bookingId,
      senderToken: 'SYSTEM',
      senderName: 'Cirqlr Reschedule Engine',
      text: `🗓️ Free Reschedule Confirmed: Outing updated to ${newDate} at ${newTime} by ${reschedulerName}.${note ? ` Note: "${note}"` : ''} 100% Free: No extra fee or wallet deductions applied.`,
      timestamp: nowIso,
      isSystemNotice: true,
    };
    setChatMessages((prev) => [...prev, chatNotice]);

    addAuditLog(
      'Free Outing Reschedule Executed',
      `Booking ${booking.bookingToken} rescheduled to ${newDate} at ${newTime} by ${reschedulerName} (${reschedulerToken}). Zero platform fee charged.`
    );

    return true;
  };

  // 1-CLICK DISPUTE ACTION: REFUND FEE TO COMPANION WALLET & BLOCK BOOKER
  const resolveBookingDisputeRefundAndBlock = (bookingId: string, reason?: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const companion = getUserByToken(booking.companionToken);
    const liveFee = computeLiveBookingFee(booking, bookings, companion, platformSettings);
    const feeToRefund = booking.paidPlatformFeeAmount || liveFee.finalPlatformFee;
    const disputeReason = (reason || '').trim() || 'Admin Dispute Action: Booker Non-Payment / Post-Outing Misconduct';
    const nowIso = new Date().toISOString();
    const wltId = `wlt_disp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const walletEntry: WalletTransactionEntry = {
      id: wltId,
      paymentReferenceId: wltId,
      type: 'credit',
      amount: feeToRefund,
      reason: `Admin Goodwill Credit: ${disputeReason} (Booking ${booking.bookingToken})`,
      timestamp: nowIso,
      adminToken: 'FOUNDER-ROOT',
      bookingId: booking.id,
    };

    // 1. Credit 100% Platform Fee to Companion's Fee Wallet
    setUsersAndCompanions((prev) =>
      prev.map((u) => {
        if (u.userToken === booking.companionToken) {
          const currentBal = u.cancellationCreditBalance || 0;
          const history = [walletEntry, ...(u.walletHistory || [])];
          return {
            ...u,
            cancellationCreditBalance: currentBal + feeToRefund,
            walletHistory: history,
          };
        }
        // 2. Immediately Block / Suspend Offending Booker
        if (u.userToken === booking.bookerToken) {
          return {
            ...u,
            accountStatus: 'Blocked' as AccountStatus,
            suspensionReason: disputeReason,
            suspendedAt: nowIso,
          };
        }
        return u;
      })
    );

    if (currentUser?.userToken === booking.companionToken) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const currentBal = prev.cancellationCreditBalance || 0;
        const history = [walletEntry, ...(prev.walletHistory || [])];
        return {
          ...prev,
          cancellationCreditBalance: currentBal + feeToRefund,
          walletHistory: history,
        };
      });
    } else if (currentUser?.userToken === booking.bookerToken) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          accountStatus: 'Blocked' as AccountStatus,
          suspensionReason: disputeReason,
          suspendedAt: nowIso,
        };
      });
    }

    // 3. Update Booking Status
    const newStatus = `Disputed & Fee Refunded to Companion (Booker Blocked)` as any;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: newStatus,
              cancellationReason: disputeReason,
              cancellationFeeRefundedAmount: feeToRefund,
              cancelledAt: nowIso,
            }
          : b
      )
    );

    // 4. Update Ledger Entry
    setPaymentsLedger((prev) =>
      prev.map((entry) => {
        const matchesBooking =
          (entry.bookingId && entry.bookingId === booking.id) ||
          (entry.bookingToken && entry.bookingToken === booking.bookingToken);
        if (matchesBooking && entry.type === 'Booking Acceptance Fee') {
          return {
            ...entry,
            status: 'REFUND DUE (Cancelled Booking)' as const,
            refundNotes: `Dispute Action: ₹${feeToRefund} fee refunded to Companion Fee Wallet. Booker blocked (${disputeReason}).`,
          };
        }
        return entry;
      })
    );

    // 5. Create Safety Report & Audit Trail
    const disputeReport: SafetyReport = {
      id: `REP-DISP-${Date.now()}`,
      reportToken: `SR-DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      reportedUserToken: booking.bookerToken,
      reportedByToken: 'FOUNDER-ROOT',
      category: 'No-Show at Venue',
      details: `Dispute filed on Booking ${booking.bookingToken}: ${disputeReason}. Platform fee ₹${feeToRefund} refunded to companion. Booker permanently blocked.`,
      venueAddress: booking.venueAddress,
      timestamp: nowIso,
      status: 'Action Taken',
      adminResolutionNotes: `Dispute resolved by Admin: 100% Platform Fee (₹${feeToRefund}) credited to Companion (${booking.companionToken}) wallet. Offending Booker (${booking.bookerToken}) blocked.`,
    };
    setSafetyReports((prev) => [disputeReport, ...prev]);

    addAuditLog(
      'Dispute Resolved: Fee Refunded & Booker Blocked',
      `Booking ${booking.bookingToken} disputed. Refunded ₹${feeToRefund} to Companion ${booking.companionName} (${booking.companionToken}) wallet. Offending Booker ${booking.bookerName} (${booking.bookerToken}) permanently blocked. Reason: "${disputeReason}".`
    );
  };

  // CASE A — CANCELLED BY BOOKER (Zero Companion Fault):
  // Automatically credit 100% of the exact Rupee Platform Fee paid into Companion's cancellationCreditBalance wallet.
  // Zero lifeline deducted from Companion.
  const cancelBookingByBookerWithCredit = (bookingId: string, reason: string = 'Cancelled by Booker') => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const cancelledTimestamp = new Date().toISOString();
    const companion = getUserByToken(booking.companionToken);
    const liveFee = computeLiveBookingFee(booking, bookings, companion, platformSettings);
    const feeToCredit = liveFee.finalPlatformFee;
    const companionToken = booking.companionToken;

    // 1. Credit 100% of exact rupee platform fee into Companion's cancellationCreditBalance
    if (feeToCredit > 0) {
      const wltId = `wlt_can_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      const creditTxn: WalletTransactionEntry = {
        id: wltId,
        paymentReferenceId: wltId,
        type: 'credit',
        amount: feeToCredit,
        reason: `Wallet Credit Added: Booker Cancellation (${booking.bookingToken || booking.id})`,
        timestamp: cancelledTimestamp,
        bookingId: booking.id,
      };

      setUsersAndCompanions((prev) => {
        const next = prev.map((u) => {
          if (u.userToken === companionToken) {
            const currentBal = u.cancellationCreditBalance || 0;
            const history = [creditTxn, ...(u.walletHistory || [])];
            return {
              ...u,
              cancellationCreditBalance: currentBal + feeToCredit,
              walletHistory: history,
            };
          }
          return u;
        });
        safeSetItem('sangha_v4_users', JSON.stringify(next));
        return next;
      });

      if (currentUser?.userToken === companionToken) {
        setCurrentUser((prev) => {
          if (!prev) return null;
          const currentBal = prev.cancellationCreditBalance || 0;
          const history = [creditTxn, ...(prev.walletHistory || [])];
          const updated = {
            ...prev,
            cancellationCreditBalance: currentBal + feeToCredit,
            walletHistory: history,
          };
          safeSetItem('sangha_v4_current_user', JSON.stringify(updated));
          return updated;
        });
      }
    }

    const newStatus = `Cancelled by Booker (₹${feeToCredit} Fee Credited to Companion)`;

    // 2. Update booking status
    setBookings((prev) => {
      const updated = prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: newStatus as any,
              cancellationReason: reason,
              cancelledAt: cancelledTimestamp,
              cancelledByRole: 'Booker' as const,
              cancelledByToken: currentUser?.userToken || booking.bookerToken,
              cancellationFeeRefundedAmount: feeToCredit,
            }
          : b
      );
      safeSetItem('sangha_v4_bookings', JSON.stringify(updated));
      return updated;
    });

    // 3. Lock & close chat if active
    if (activeChatBookingId === bookingId) {
      setActiveChatBookingId(null);
    }

    // 4. Chat system notice
    const systemNotice: ChatMessage = {
      id: `MSG-CANCEL-${Date.now()}`,
      bookingId,
      senderToken: 'SYSTEM',
      senderName: 'Cirqlr Security Protocol',
      text: `🛑 Outing cancelled by Booker. 100% of Platform Acceptance Fee (₹${feeToCredit}) has been automatically credited into Companion ${booking.companionName}'s Fee Credit Wallet. Zero lifeline deducted.`,
      timestamp: cancelledTimestamp,
      isSystemNotice: true,
    };
    setChatMessages((prev) => [...prev, systemNotice]);

    // 5. Update ledger entry
    setPaymentsLedger((prev) =>
      prev.map((entry) => {
        const matchesBooking =
          (entry.bookingId && entry.bookingId === booking.id) ||
          (entry.bookingToken && entry.bookingToken === booking.bookingToken);
        if (matchesBooking && entry.type === 'Booking Acceptance Fee') {
          return {
            ...entry,
            status: 'REFUND DUE (Cancelled Booking)' as const,
            refundNotes: `Booker cancelled outing. 100% Acceptance Fee (₹${feeToCredit}) auto-credited to Companion wallet.`,
          };
        }
        return entry;
      })
    );

    // 6. Audit log
    addAuditLog(
      'Booking Cancelled by Booker (Companion Auto-Credited)',
      `Booking ${booking.bookingToken} cancelled by ${booking.bookerName}. 100% Platform Fee of ₹${feeToCredit} credited to Companion ${booking.companionName} (${companionToken}) Fee Wallet. Zero lifeline deducted.`
    );

    // 7. Sync to Firestore
    syncBookingToFirestore({
      ...booking,
      status: newStatus as any,
      cancellationReason: reason,
      cancelledAt: cancelledTimestamp,
      cancelledByRole: 'Booker',
      cancelledByToken: currentUser?.userToken || booking.bookerToken,
      cancellationFeeRefundedAmount: feeToCredit,
    });
    if (companion) {
      syncUserToFirestore({
        ...companion,
        cancellationCreditBalance: (companion.cancellationCreditBalance || 0) + feeToCredit,
      });
    }

    // 8. Automatic Cancellation Email notification to Companion
    sendCancellationEmail({
      type: 'booker_cancelled',
      bookingToken: booking.bookingToken || booking.id,
      bookerName: booking.bookerName,
      bookerEmail: booking.bookerEmail || currentUser?.email,
      companionName: booking.companionName,
      companionEmail: booking.companionEmail || companion?.email,
      activityTitle: booking.activityTitle,
      venueName: booking.venueName,
      venueAddress: booking.venueAddress,
      outingDate: booking.outingDate,
      outingTime: booking.outingTime,
      amount: booking.totalOutingCost,
      reason,
      walletCreditDetails: `₹${feeToCredit} Platform Fee automatically credited to your fee wallet.`,
    });
  };

  // CASE B — CANCELLED BY COMPANION (3-Hour Notice & 1 Monthly Emergency Lifeline Parameter)
  const cancelBookingByCompanionWithLifeline = (
    bookingId: string,
    reason: string = 'Cancelled by Companion'
  ): { eligibleForCredit: boolean; creditedAmount: number } => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { eligibleForCredit: false, creditedAmount: 0 };

    const cancelledTimestamp = new Date().toISOString();
    const currentMonth = getCurrentCalendarMonth();
    const companionUser = getUserByToken(booking.companionToken) || currentUser;
    const liveFee = computeLiveBookingFee(booking, bookings, companionUser, platformSettings);
    const feeToCredit = liveFee.finalPlatformFee;

    const hoursUntilOuting = getTimeUntilOutingHours(booking.outingDate, booking.outingTime);
    const isMoreThan3Hours = hoursUntilOuting > 3;
    const lifelinesUsedThisMonth =
      companionUser?.monthlyLifelineMonth === currentMonth
        ? companionUser?.monthlyLifelineUsed || 0
        : 0;
    const hasLifelineAvailable = lifelinesUsedThisMonth < 1;

    const isEligible = isMoreThan3Hours && hasLifelineAvailable;

    if (isEligible) {
      // Eligible: Credit fee & consume 1 monthly lifeline
      const wltId = `wlt_life_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      const lifelineTxn: WalletTransactionEntry = {
        id: wltId,
        paymentReferenceId: wltId,
        type: 'credit',
        amount: feeToCredit,
        reason: `Wallet Credit Added: 1/1 Monthly Emergency Lifeline Used (${booking.bookingToken || booking.id})`,
        timestamp: cancelledTimestamp,
        bookingId: booking.id,
      };

      setUsersAndCompanions((prev) => {
        const next = prev.map((u) => {
          if (u.userToken === booking.companionToken) {
            const currentBal = u.cancellationCreditBalance || 0;
            const history = [lifelineTxn, ...(u.walletHistory || [])];
            return {
              ...u,
              cancellationCreditBalance: currentBal + feeToCredit,
              monthlyLifelineUsed: 1,
              monthlyLifelineMonth: currentMonth,
              walletHistory: history,
            };
          }
          return u;
        });
        safeSetItem('sangha_v4_users', JSON.stringify(next));
        return next;
      });

      if (currentUser?.userToken === booking.companionToken) {
        setCurrentUser((prev) => {
          if (!prev) return null;
          const currentBal = prev.cancellationCreditBalance || 0;
          const history = [lifelineTxn, ...(prev.walletHistory || [])];
          const updated = {
            ...prev,
            cancellationCreditBalance: currentBal + feeToCredit,
            monthlyLifelineUsed: 1,
            monthlyLifelineMonth: currentMonth,
            walletHistory: history,
          };
          safeSetItem('sangha_v4_current_user', JSON.stringify(updated));
          return updated;
        });
      }

      const newStatus = `Cancelled by Companion (Emergency Lifeline Used)`;

      setBookings((prev) => {
        const updated = prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: newStatus as any,
                cancellationReason: reason,
                cancelledAt: cancelledTimestamp,
                cancelledByRole: 'Companion' as const,
                cancelledByToken: booking.companionToken,
                cancellationFeeRefundedAmount: feeToCredit,
                emergencyLifelineUsed: true,
              }
            : b
        );
        try {
          localStorage.setItem('sangha_v4_bookings', JSON.stringify(updated));
        } catch (err) {
          console.error('[Cancel Booking Storage Error]', err);
        }
        return updated;
      });

      if (activeChatBookingId === bookingId) {
        setActiveChatBookingId(null);
      }

      const systemNotice: ChatMessage = {
        id: `MSG-CANCEL-${Date.now()}`,
        bookingId,
        senderToken: 'SYSTEM',
        senderName: 'Cirqlr Security Protocol',
        text: `🛑 Outing cancelled by Companion. 1/1 Monthly Emergency Lifeline used (>3 hrs notice). Platform Acceptance Fee of ₹${feeToCredit} credited to Companion's Fee Wallet.`,
        timestamp: cancelledTimestamp,
        isSystemNotice: true,
      };
      setChatMessages((prev) => [...prev, systemNotice]);

      setPaymentsLedger((prev) =>
        prev.map((entry) => {
          const matchesBooking =
            (entry.bookingId && entry.bookingId === booking.id) ||
            (entry.bookingToken && entry.bookingToken === booking.bookingToken);
          if (matchesBooking && entry.type === 'Booking Acceptance Fee') {
            return {
              ...entry,
              status: 'REFUND DUE (Cancelled Booking)' as const,
              refundNotes: `Companion cancelled using Emergency Lifeline on ${new Date(cancelledTimestamp).toLocaleDateString()}. ₹${feeToCredit} credited to wallet.`,
            };
          }
          return entry;
        })
      );

      addAuditLog(
        'Emergency Lifeline Cancellation Used',
        `Companion ${booking.companionName} (${booking.companionToken}) cancelled booking ${booking.bookingToken} using 1/1 Monthly Emergency Lifeline (>3 hrs notice). ₹${feeToCredit} credited to wallet.`
      );

      // Sync to Firestore
      syncBookingToFirestore({
        ...booking,
        status: newStatus as any,
        cancellationReason: reason,
        cancelledAt: cancelledTimestamp,
        cancelledByRole: 'Companion',
        cancelledByToken: booking.companionToken,
        cancellationFeeRefundedAmount: feeToCredit,
        emergencyLifelineUsed: true,
      });

      // Automatic Cancellation Email notification to Booker
      const bookerUser = getUserByToken(booking.bookerToken);
      sendCancellationEmail({
        type: 'companion_cancelled',
        bookingToken: booking.bookingToken || booking.id,
        bookerName: booking.bookerName,
        bookerEmail: booking.bookerEmail || bookerUser?.email,
        companionName: booking.companionName,
        companionEmail: booking.companionEmail || companionUser?.email,
        activityTitle: booking.activityTitle,
        venueName: booking.venueName,
        venueAddress: booking.venueAddress,
        outingDate: booking.outingDate,
        outingTime: booking.outingTime,
        amount: booking.totalOutingCost,
        reason,
        refundDetails: 'Outing cancelled by companion. Zero obligation; pay-in-person fee is void.',
      });

      return { eligibleForCredit: true, creditedAmount: feeToCredit };
    } else {
      // Non-refundable fee forfeiture
      const newStatus = `Cancelled by Companion (Fee Forfeited)`;

      setBookings((prev) => {
        const updated = prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: newStatus as any,
                cancellationReason: reason,
                cancelledAt: cancelledTimestamp,
                cancelledByRole: 'Companion' as const,
                cancelledByToken: booking.companionToken,
                cancellationFeeForfeited: true,
              }
            : b
        );
        safeSetItem('sangha_v4_bookings', JSON.stringify(updated));
        return updated;
      });

      if (activeChatBookingId === bookingId) {
        setActiveChatBookingId(null);
      }

      const systemNotice: ChatMessage = {
        id: `MSG-CANCEL-${Date.now()}`,
        bookingId,
        senderToken: 'SYSTEM',
        senderName: 'Cirqlr Security Protocol',
        text: `🛑 Outing cancelled by Companion (${isMoreThan3Hours ? 'Monthly lifeline already exhausted' : 'Less than 3 hours notice'}). Platform Acceptance Fee of ₹${feeToCredit} strictly forfeited to platform.`,
        timestamp: cancelledTimestamp,
        isSystemNotice: true,
      };
      setChatMessages((prev) => [...prev, systemNotice]);

      addAuditLog(
        'Non-Refundable Companion Cancellation (Fee Forfeited)',
        `Companion ${booking.companionName} (${booking.companionToken}) cancelled booking ${booking.bookingToken}. Acceptance fee of ₹${feeToCredit} forfeited (Less than 3 hrs notice or lifeline exhausted).`
      );

      // Sync to Firestore
      syncBookingToFirestore({
        ...booking,
        status: newStatus as any,
        cancellationReason: reason,
        cancelledAt: cancelledTimestamp,
        cancelledByRole: 'Companion',
        cancelledByToken: booking.companionToken,
        cancellationFeeForfeited: true,
      });

      // Automatic Cancellation Email notification to Booker
      const bookerUser = getUserByToken(booking.bookerToken);
      sendCancellationEmail({
        type: 'companion_cancelled',
        bookingToken: booking.bookingToken || booking.id,
        bookerName: booking.bookerName,
        bookerEmail: booking.bookerEmail || bookerUser?.email,
        companionName: booking.companionName,
        companionEmail: booking.companionEmail || companionUser?.email,
        activityTitle: booking.activityTitle,
        venueName: booking.venueName,
        venueAddress: booking.venueAddress,
        outingDate: booking.outingDate,
        outingTime: booking.outingTime,
        amount: booking.totalOutingCost,
        reason,
        refundDetails: 'Outing cancelled by companion. Zero obligation; pay-in-person fee is void.',
      });

      return { eligibleForCredit: false, creditedAmount: 0 };
    }
  };

  const cancelBooking = (bookingId: string, reason: string = 'Cancelled by Booker') => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // If booking was Confirmed, route through automated credit rules
    if (booking.status === 'Confirmed') {
      if (currentUser?.userToken === booking.companionToken) {
        cancelBookingByCompanionWithLifeline(bookingId, reason);
        return;
      } else {
        cancelBookingByBookerWithCredit(bookingId, reason);
        return;
      }
    }

    const cancelledTimestamp = new Date().toISOString();

    setBookings((prev) => {
      const updated = prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'Cancelled' as const,
              cancellationReason: reason,
              cancelledAt: cancelledTimestamp,
            }
          : b
      );
      safeSetItem('sangha_v4_bookings', JSON.stringify(updated));
      return updated;
    });

    if (activeChatBookingId === bookingId) {
      setActiveChatBookingId(null);
    }

    const systemNotice: ChatMessage = {
      id: `MSG-CANCEL-${Date.now()}`,
      bookingId,
      senderToken: 'SYSTEM',
      senderName: 'Cirqlr Security Protocol',
      text: `🛑 Outing request cancelled (${reason}). E2E encrypted channel terminated.`,
      timestamp: cancelledTimestamp,
      isSystemNotice: true,
    };
    setChatMessages((prev) => [...prev, systemNotice]);

    addAuditLog(
      'Booking Cancelled',
      `Booking ${booking.bookingToken} cancelled. Outing with ${booking.companionName} set to Cancelled.`
    );
  };

  const cancelBookingByBooker = (bookingId: string, reason: string, penaltyRazorpayRefId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Use smart cancellation with companion fee credit
    cancelBookingByBookerWithCredit(bookingId, reason);

    // Also record the ₹20 Booker Penalty ledger entry
    const penaltyEntryId = `TXN-PENALTY-${Date.now()}`;
    const cancelledTimestamp = new Date().toISOString();
    const penaltyLedgerEntry: PaymentLedgerEntry = {
      id: penaltyEntryId,
      razorpayRefId: penaltyRazorpayRefId,
      bookingId: booking.id,
      bookingToken: booking.bookingToken,
      type: 'Cancellation Penalty',
      companionToken: booking.companionToken,
      companionName: booking.companionName,
      bookerName: booking.bookerName,
      outingTitle: booking.activityTitle,
      grossOutingValue: booking.totalOutingCost,
      effectiveFeePercent: 0,
      feeAmount: 20,
      status: 'VERIFIED & RELEASED',
      timestamp: cancelledTimestamp,
      verifiedAt: cancelledTimestamp,
    };

    setPaymentsLedger((prev) => [penaltyLedgerEntry, ...prev]);
  };

  // Payment Hold & Ledger - Instant Automatic Confirmation with Anti-Abuse Exact Rupee Credit Redemption
  const submitAcceptanceFeePayment = (
    bookingId: string, 
    razorpayRefId: string, 
    creditUsed: number = 0
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const ledgerEntryId = `TXN-${Date.now()}`;
    const confirmedIso = new Date().toISOString();
    const liveFee = computeLiveBookingFee(booking, bookings, currentUser, platformSettings);
    const bookingAcceptanceFee = liveFee.finalPlatformFee;
    const netPaidViaGateway = Math.max(0, bookingAcceptanceFee - creditUsed);

    // Canonical unified payment/transaction ID (pay_... for gateway or wlt_... for 100% wallet redemption)
    const canonicalPaymentId = (razorpayRefId || '').startsWith('pay_') || (razorpayRefId || '').startsWith('wlt_')
      ? razorpayRefId
      : (creditUsed > 0 && netPaidViaGateway === 0
          ? `wlt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`
          : `pay_${razorpayRefId}`);

    const newLedgerEntry: PaymentLedgerEntry = {
      id: ledgerEntryId,
      razorpayRefId: canonicalPaymentId,
      paymentReferenceId: canonicalPaymentId,
      bookingId: booking.id,
      bookingToken: booking.bookingToken,
      type: 'Booking Acceptance Fee',
      companionToken: booking.companionToken,
      companionName: booking.companionName,
      bookerToken: booking.bookerToken,
      bookerName: booking.bookerName,
      outingTitle: booking.activityTitle,
      grossOutingValue: booking.totalOutingCost,
      effectiveFeePercent: liveFee.effectiveFeePercent,
      feeAmount: bookingAcceptanceFee,
      status: 'VERIFIED & RELEASED',
      timestamp: confirmedIso,
      verifiedAt: confirmedIso,
      refundNotes: creditUsed > 0 ? `₹${creditUsed} credit applied + ₹${netPaidViaGateway} via ${canonicalPaymentId}` : undefined,
    };

    setPaymentsLedger((prev) => [newLedgerEntry, ...prev]);

    // If credit was used, deduct it immediately from Companion's cancellationCreditBalance and record transaction history
    if (creditUsed > 0) {
      const compToken = booking.companionToken;
      const wltDebitId = `wlt_use_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      const debitTxn: WalletTransactionEntry = {
        id: wltDebitId,
        paymentReferenceId: wltDebitId,
        type: 'debit',
        amount: creditUsed,
        reason: `Wallet Credit Redeemed: Booking Acceptance Fee (${booking.bookingToken || booking.id})`,
        timestamp: confirmedIso,
        bookingId: booking.id,
      };

      setUsersAndCompanions((prev) => {
        const next = prev.map((u) => {
          if (u.userToken === compToken) {
            const currentCredits = u.cancellationCreditBalance || 0;
            const updatedBal = Math.max(0, currentCredits - creditUsed);
            const history = [debitTxn, ...(u.walletHistory || [])];
            return {
              ...u,
              cancellationCreditBalance: updatedBal,
              walletHistory: history,
            };
          }
          return u;
        });
        safeSetItem('sangha_v4_users', JSON.stringify(next));
        return next;
      });

      if (currentUser?.userToken === compToken) {
        setCurrentUser((prev) => {
          if (!prev) return null;
          const currentCredits = prev.cancellationCreditBalance || 0;
          const updatedBal = Math.max(0, currentCredits - creditUsed);
          const history = [debitTxn, ...(prev.walletHistory || [])];
          const updated = {
            ...prev,
            cancellationCreditBalance: updatedBal,
            walletHistory: history,
          };
          safeSetItem('sangha_v4_current_user', JSON.stringify(updated));
          return updated;
        });
      }
      addAuditLog(
        'Cancellation Fee Credit Redeemed',
        `Companion ${booking.companionName} (${compToken}) redeemed ₹${creditUsed} fee credit for Booking ${booking.bookingToken}. Net Gateway Paid: ₹${netPaidViaGateway}.`
      );
    }

    // If a 5% Referral Credit was applied to this booking, deduct 1 credit from the companion
    if (booking.discountApplied === 'Referral Credit (5%)' && !booking.referralCreditConsumed) {
      const compToken = booking.companionToken;
      setUsersAndCompanions((prev) => {
        const next = prev.map((u) => {
          if (u.userToken === compToken) {
            const currentCredits = u.referralCredits || 0;
            const updatedCredits = Math.max(0, currentCredits - 1);
            return { ...u, referralCredits: updatedCredits };
          }
          return u;
        });
        safeSetItem('sangha_v4_users', JSON.stringify(next));
        return next;
      });
      if (currentUser?.userToken === compToken) {
        setCurrentUser((prev) => {
          if (!prev) return null;
          const currentCredits = prev.referralCredits || 0;
          const updated = { ...prev, referralCredits: Math.max(0, currentCredits - 1) };
          safeSetItem('sangha_v4_current_user', JSON.stringify(updated));
          return updated;
        });
      }
      addAuditLog(
        'Referral Discount Credit Redeemed',
        `Companion ${booking.companionName} (${compToken}) redeemed 1 Referral Discount Credit for Booking ${booking.bookingToken}. 5% fee waiver executed.`
      );
    }

    setBookings((prev) => {
      const next = prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'Confirmed' as const,
              razorpayRefId: canonicalPaymentId,
              paymentReferenceId: canonicalPaymentId,
              acceptanceFee: bookingAcceptanceFee,
              feePercentSnapshot: liveFee.effectiveFeePercent,
              paidPlatformFeeAmount: bookingAcceptanceFee,
              creditUsedForAcceptance: creditUsed,
              referralCreditConsumed: true,
              referralCreditUsed: booking.discountApplied === 'Referral Credit (5%)',
            }
          : b
      );
      safeSetItem('sangha_v4_bookings', JSON.stringify(next));
      return next;
    });

    const systemMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      bookingId: booking.id,
      senderToken: 'SYSTEM',
      senderName: 'Cirqlr Security Protocol',
      text: creditUsed > 0
        ? `🔒 End-to-End Encrypted Outing Channel Active. Acceptance fee paid using ₹${creditUsed} credit balance${netPaidViaGateway > 0 ? ` + ₹${netPaidViaGateway} via Razorpay` : ''}. Coordinate your meeting landmark inside the verified public venue.`
        : '🔒 End-to-End Encrypted Outing Channel Active. Personal contact exchange is prohibited. Coordinate your meeting landmark inside the verified public venue.',
      timestamp: confirmedIso,
      isSystemNotice: true,
    };
    setChatMessages((prev) => [...prev, systemMsg]);

    addAuditLog(
      'Acceptance Fee Paid & Outing Confirmed',
      `Payment ${razorpayRefId} (₹${booking.acceptanceFee} total, ₹${creditUsed} credit applied) confirmed for booking ${booking.bookingToken}. Outing is Confirmed and chat channel unlocked immediately.`
    );

    syncTransactionToFirestore(newLedgerEntry);
    syncBookingToFirestore({
      ...booking,
      status: 'Confirmed' as const,
      razorpayRefId: canonicalPaymentId,
      paymentReferenceId: canonicalPaymentId,
      acceptanceFee: bookingAcceptanceFee,
      feePercentSnapshot: liveFee.effectiveFeePercent,
      paidPlatformFeeAmount: bookingAcceptanceFee,
      creditUsedForAcceptance: creditUsed,
      referralCreditConsumed: true,
      referralCreditUsed: booking.discountApplied === 'Referral Credit (5%)',
    });
    const updatedCompanionUser = getUserByToken(booking.companionToken);
    if (updatedCompanionUser) {
      syncUserToFirestore(updatedCompanionUser);
    }

    // Trigger Google Apps Script email webhook to deliver 100% Confirmed HTML email to Booker's Gmail
    const bookerUser = getUserByToken(booking.bookerToken);
    const toEmail = booking.bookerEmail || bookerUser?.email || 'dasabir618@gmail.com';

    sendBookingStatusEmail({
      toEmail,
      bookerName: booking.bookerName,
      companionName: booking.companionName,
      companionId: booking.companionId || booking.companionToken,
      activityName: booking.activityTitle,
      venue: `${booking.venueName}${booking.venueAddress ? ` (${booking.venueAddress})` : ''}`,
      dateTime: `${booking.outingDate} ${booking.outingTime ? `at ${booking.outingTime}` : ''} (${booking.hours} hrs)`.trim(),
      amount: booking.totalOutingCost,
      status: 'ACCEPTED',
      bookingId: booking.bookingToken || booking.id,
    });
  };

  const confirmPaymentAndReleaseBooking = (ledgerId: string) => {
    const entry = paymentsLedger.find((l) => l.id === ledgerId);
    if (!entry) return;

    setPaymentsLedger((prev) =>
      prev.map((l) =>
        l.id === ledgerId
          ? {
              ...l,
              status: 'VERIFIED & RELEASED',
              verifiedAt: new Date().toISOString(),
            }
          : l
      )
    );

    if (entry.type === '1-Month Pro Subscription') {
      subscribeCompanionPro(entry.companionToken);
      addAuditLog(
        'Pro Subscription Verified',
        `Founder approved Razorpay ${entry.razorpayRefId} (₹${entry.feeAmount}). Activated 30-Day Pro for ${entry.companionToken}.`
      );
      return;
    }

    if (entry.bookingId) {
      setBookings((prev) =>
        prev.map((b) => (b.id === entry.bookingId ? { ...b, status: 'Confirmed' as const } : b))
      );

      const systemMsg: ChatMessage = {
        id: `MSG-${Date.now()}`,
        bookingId: entry.bookingId,
        senderToken: 'SYSTEM',
        senderName: 'Cirqlr Security Protocol',
        text: '🔒 End-to-End Encrypted Outing Channel Active. Personal contact exchange is prohibited. Coordinate your meeting landmark inside the verified public venue.',
        timestamp: new Date().toISOString(),
        isSystemNotice: true,
      };
      setChatMessages((prev) => [...prev, systemMsg]);

      addAuditLog(
        'Payment Verified & Outing Confirmed',
        `Founder verified Razorpay ${entry.razorpayRefId} (₹${entry.feeAmount}). Outing confirmed and chat unlocked.`
      );
    }
  };

  const rejectPaymentAndFlagBooking = (ledgerId: string) => {
    const entry = paymentsLedger.find((l) => l.id === ledgerId);
    if (!entry) return;

    setPaymentsLedger((prev) =>
      prev.map((l) => (l.id === ledgerId ? { ...l, status: 'REJECTED' } : l))
    );

    if (entry.type === '1-Month Pro Subscription') {
      const companionToken = entry.companionToken;
      const updatedFields: Partial<UserProfile> = {
        isProCompanion: false,
        isPremiumCompanion: false,
        subscriptionStatus: 'none',
        subscriptionPlan: 'Free Tier',
        subscriptionPaymentStatus: 'rejected',
      };
      if (currentUser?.userToken === companionToken) {
        setCurrentUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
      }
      setUsersAndCompanions((prev) =>
        prev.map((u) => (u.userToken === companionToken ? { ...u, ...updatedFields } : u))
      );
      addAuditLog(
        'Pro Subscription Payment Rejected',
        `Founder rejected Razorpay ${entry.razorpayRefId} for ${companionToken}.`
      );
      return;
    }

    if (entry.bookingId) {
      setBookings((prev) =>
        prev.map((b) => (b.id === entry.bookingId ? { ...b, status: 'Rejected' as const } : b))
      );
      addAuditLog(
        'Payment Rejected & Booking Flagged',
        `Transaction ${entry.razorpayRefId} rejected. Booking flagged as unpaid.`
      );
    }
  };

  const getMessagesForBooking = (bookingId: string): ChatMessage[] => {
    if (!bookingId || !Array.isArray(chatMessages)) return [];
    return chatMessages.filter((m) => Boolean(m && m.bookingId === bookingId));
  };

  const sendChatMessage = (bookingId: string, text: string) => {
    if (!text.trim() || !currentUser) return;

    const newMessage: ChatMessage = {
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId,
      senderToken: currentUser.userToken,
      senderName: currentUser.fullName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
  };

  // Safety Reports
  const fileSafetyReport = (reportInput: {
    reportedUserToken: string;
    category: SafetyReport['category'];
    details: string;
    venueAddress: string;
  }) => {
    const reportToken = `SAF-WB-${Math.floor(100 + Math.random() * 900)}`;
    const newReport: SafetyReport = {
      id: `REP-${Date.now()}`,
      reportToken,
      reportedUserToken: reportInput.reportedUserToken,
      reportedByToken: currentUser ? currentUser.userToken : 'ANONYMOUS',
      category: reportInput.category,
      details: reportInput.details,
      venueAddress: reportInput.venueAddress,
      timestamp: new Date().toISOString(),
      status: 'Open Investigation',
    };

    setSafetyReports((prev) => [newReport, ...prev]);

    addAuditLog(
      'Safety Report Filed',
      `Report ${newReport.reportToken} submitted against ${reportInput.reportedUserToken}: ${reportInput.category}`
    );
  };

  const resolveReport = (reportId: string, notes: string, accountStatusChange?: AccountStatus) => {
    setSafetyReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'Resolved',
              adminResolutionNotes: notes,
            }
          : r
      )
    );

    if (accountStatusChange) {
      const report = safetyReports.find((r) => r.id === reportId);
      if (report) {
        updateUserAccountStatus(
          report.reportedUserToken,
          accountStatusChange,
          `Enforced via resolution of report ${report.reportToken}: ${notes}`
        );
      }
    }

    addAuditLog('Safety Report Resolved', `Report ID ${reportId} closed with resolution: ${notes}`);
  };

  const getReportsForUser = (userToken: string): SafetyReport[] => {
    return safetyReports.filter((r) => r.reportedUserToken === userToken);
  };

  return (
    <MarketplaceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isFounderVaultUnlocked,
        unlockFounderVault,
        lockFounderVault,
        platformSettings,
        updatePlatformSettings,
        updateAdminMasterPasskey,
        addAllowedVenueCategory,
        removeAllowedVenueCategory,
        resetSettingsToDefault,
        currentUser,
        usersAndCompanions,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openAuthModal,
        loginWithOtp,
        loginWithPassword,
        resetUserPassword,
        findUserByPhoneOrEmail,
        loginUserAccount,
        registerUser,
        submitAddressVerification,
        logOutUser,
        deleteUserAccountAndWithdrawConsent,
        permanentlyPurgeArchivedUser,
        getUserByToken,
        updateUserAccountStatus,
        updateCurrentUserProfile,
        updateCurrentUserEmail,
        verifyUserIdentity,
        adjustUserWalletCredit,
        submitProSubscriptionPayment,
        subscribeCompanionPro,
        isProfileModalOpen,
        setIsProfileModalOpen,
        profileModalInitialTab,
        openProfileModal,
        activityCards,
        getCompanionActivityCards,
        createActivityCard,
        updateActivityCard,
        deleteActivityCard,
        bookings,
        isRepeatClientEligible,
        calculateFee,
        computeLiveBookingFee,
        createBooking,
        rejectBooking,
        markOutingCompleted,
        submitBookingRating,
        submitCompanionRatingForBooker,
        cancelBooking,
        cancelBookingByBooker,
        cancelBookingByBookerWithCredit,
        cancelBookingByCompanionWithLifeline,
        rescheduleBooking,
        resolveBookingDisputeRefundAndBlock,
        paymentsLedger,
        submitAcceptanceFeePayment,
        confirmPaymentAndReleaseBooking,
        rejectPaymentAndFlagBooking,
        chatMessages,
        getMessagesForBooking,
        sendChatMessage,
        safetyReports,
        fileSafetyReport,
        resolveReport,
        getReportsForUser,
        auditLogs,
        addAuditLog,
        inspectedUserToken,
        setInspectedUserToken,
        activeChatBookingId,
        setActiveChatBookingId,
        activeReportUserToken,
        setActiveReportUserToken,
        savedCompanionTokens,
        toggleSaveCompanion,
        isCompanionSaved,
        activeLegalModal,
        openLegalModal,
        closeLegalModal,
        isAboutUsModalOpen,
        setIsAboutUsModalOpen,
        openAboutUsModal,
        isFeedbackModalOpen,
        setIsFeedbackModalOpen,
        openFeedbackModal,
        platformFeedbacks,
        submitFeedback,
        deleteFeedback,
        activeSuspensionNotice,
        openSuspensionNotice,
        closeSuspensionNotice,
        suspendUserForSafetyViolation,
        liftUserSuspension,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};

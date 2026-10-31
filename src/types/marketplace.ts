export type VerificationStatus = 'Verified' | 'ID Verified' | 'Unverified' | 'Pending Review' | 'Basic Contact Verified' | 'Rejected';

export type AccountStatus = 'Active' | 'Warned' | 'Suspended' | 'Blocked' | 'Deleted_Archived';

export type UserCity = 'Kolkata' | 'Siliguri' | 'Durgapur' | 'Bhubaneswar' | 'Cuttack' | 'Puri';

export interface ActivityPackageCard {
  id: string;
  companionToken: string;
  companionId?: string;
  userId?: string;
  userToken?: string;
  companionName?: string;
  title: string;
  venueCategory: string;
  shortDescription: string;
  city: UserCity;
  hourlyRate: number; // Minimum ₹300 / hr
  createdAt: string;
}

export type AllowedDocumentType = 'Voter ID Card' | 'Driving License' | 'PAN Card';

export interface IdVerificationRecord {
  id: string;
  documentType: AllowedDocumentType;
  idNumber?: string;
  documentImageUrl?: string;
  residentialAddress: string;
  submittedAt: string;
  status: 'Verified' | 'Pending Review' | 'Flagged';
}

export interface UserProfile {
  userToken: string; // e.g. "USR-WB-1042"
  fullName: string;
  age: number; // 21+
  gender: 'Female' | 'Male' | 'Non-Binary' | 'Non-Binary / Prefer not to say';
  city: UserCity;
  state: 'West Bengal' | 'Odisha';
  serviceAreas: string[];
  bio: string;
  languages: string[];
  avatarUrl: string;
  phoneNumber: string; // Masked in public view, unmasked in Admin Vault
  email: string; // Contact email address for notifications and account recovery
  password?: string; // Account login password
  residentialAddress?: string; // Full residential address
  documentType?: AllowedDocumentType; // Verified government ID document type
  documentIdNumber?: string; // ID document registration number
  documentImageUrl?: string; // Uploaded ID document preview URL
  idDocumentUrl?: string; // Alias for uploaded ID document URL
  idDocumentType?: AllowedDocumentType | string; // Canonical document type
  idDocumentNumber?: string; // Canonical ID registration number
  idDocumentImage?: string; // Canonical uploaded document image
  idProofUrl?: string; // Canonical ID proof URL
  idSubmittedAt?: string; // Timestamp of latest ID submission
  verificationHistory?: IdVerificationRecord[]; // Audit trail of all submitted IDs for fraud prevention
  verificationStatus: VerificationStatus;
  isVerified?: boolean; // Instant auto-verification flag
  hourlyRate: number; // General hourly rate (fallback)
  outingCategories: string[];
  rating: number;
  reviewCount: number;
  completedOutingsCount: number;
  accountStatus: AccountStatus;
  deletedAt?: number; // Timestamp of user deletion & consent withdrawal
  purgeAfter?: number; // Timestamp for 1-year automated permanent purge (365 days)
  deletionReason?: string;
  isCompanionAvailable: boolean;
  joinedDate: string;
  profession?: string;
  interests: string[];
  isProCompanion?: boolean; // Unlimited cards flag
  isPremiumCompanion?: boolean; // Alias for Pro tier
  subscriptionPlan?: 'Free Tier' | 'Companion Pro (1-Month Pass)';
  subscriptionStatus?: 'none' | 'pending_verification' | 'active' | 'expired';
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  subscriptionActivatedOn?: string;
  subscriptionExpiresOn?: string;
  subscriptionPaymentStatus?: string;
  publicGallery?: string[]; // Unlimited photos for companion public gallery
  referralCode?: string; // e.g. "REF-WB-1001"
  referredByCode?: string; // e.g. "REF-WB-1002"
  totalReferrals?: number; // Total users registered with this referral code
  referralCredits?: number; // Available 5% fee discount credits (1 credit = 1 booking discount)
  isCommunityAmbassador?: boolean; // Awarded upon referring friends
  isSuspended?: boolean;
  suspensionType?: '7_DAYS' | 'PERMANENT';
  suspendedUntil?: string;
  hasReferralWelcomeDiscount?: boolean;
  suspensionExpiryDate?: string; // ISO date when 7-day suspension lifts
  suspensionReason?: string; // Automated reason for suspension
  suspendedAt?: string; // Timestamp when suspension was triggered
  prohibitedVenueAttempt?: string; // Exact venue text attempted by violator
  cancellationCreditBalance?: number; // In ₹ Rupees, auto-applied to next booking acceptance fee
  monthlyLifelineUsed?: number; // Number of emergency cancellations used in current calendar month (0 or 1)
  monthlyLifelineMonth?: string; // Calendar month of last emergency lifeline usage (e.g. '2026-10')
  walletHistory?: WalletTransactionEntry[]; // Audit trail of wallet credits, debits, dispute refunds, and admin notes
}

export interface WalletTransactionEntry {
  id: string;
  paymentReferenceId?: string; // Canonical unified ID (e.g. wlt_... or pay_...)
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  timestamp: string;
  adminToken?: string;
  bookingId?: string;
}

export interface PlatformSettings {
  baseAcceptanceFeePercent: number; // default: 15
  repeatFeeReductionPercent: number; // default: 5 (so effective repeat fee is 15 - 5 = 10%)
  proSubscriptionMonthlyPrice: number; // default: 499 (1-Month / 30 Days)
  proOccasionDiscountPercent: number; // default: 20
  paymentVerificationMode: 'manual_hold' | 'auto_confirm'; // default: 'manual_hold'
  adminMasterPasskey: string; // default: "889900"
  allowedPublicVenueCategories: string[];
}

export type BookingStatus = 
  | 'Pending Companion Acceptance'
  | 'Payment On Hold - Admin Verifying'
  | 'Confirmed'
  | 'Accepted'
  | 'Cancelled'
  | 'Cancelled by Booker'
  | 'Cancelled by Companion'
  | 'Rejected'
  | 'Rejected by Companion'
  | 'Completed'
  | string;

export interface RescheduleHistoryEntry {
  previousDate: string;
  previousTime: string;
  newDate: string;
  newTime: string;
  rescheduledBy: string;
  timestamp: string;
  note?: string;
}

export interface BookingRecord {
  id: string;
  bookingToken: string;
  bookerToken: string;
  bookerId?: string; // alias for multi-user isolation
  bookerName: string;
  bookerEmail?: string;
  companionToken: string;
  companionId?: string; // alias for multi-user isolation
  companionName: string;
  companionEmail?: string;
  activityCardId?: string;
  activityTitle: string;
  outingDate: string;
  outingTime: string;
  hours: number;
  hourlyRate: number;
  venueCategory: string;
  venueName: string;
  venueAddress: string;
  purpose: string;
  totalOutingCost: number; // Outing Value to be collected directly from Booker at the meeting
  feePercentSnapshot: number; // Effective Platform Fee % snapshot
  acceptanceFee: number; // Platform fee required from Companion to accept
  paidPlatformFeeAmount?: number; // Exact Rupee Platform Fee paid upon acceptance
  creditUsedForAcceptance?: number; // Rupee credit applied from fee wallet upon acceptance
  isRepeatClient: boolean;
  status: BookingStatus;
  razorpayRefId?: string;
  paymentReferenceId?: string; // Unified canonical payment/txn ID (e.g. pay_... or wlt_...)
  createdAt: string;
  userRating?: number; // 1 to 5 stars (Booker rating Companion)
  userReview?: string;
  ratingSubmitted?: boolean;
  bookerRating?: number;
  bookerReview?: string;
  bookerRatingSubmitted?: boolean;
  companionRating?: number; // 1 to 5 stars (Companion rating Booker)
  companionReview?: string;
  companionRatingSubmitted?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledByToken?: string;
  cancelledByRole?: 'Booker' | 'Companion';
  cancellationFeeRefundedAmount?: number;
  cancellationFeeForfeited?: boolean;
  emergencyLifelineUsed?: boolean;
  cancellationPenaltyTxnId?: string;
  discountApplied?: 'Repeat Loyalty (5%)' | 'Referral Credit (5%)' | 'None';
  referralCreditConsumed?: boolean;
  referralCreditUsed?: boolean;
  rescheduledCount?: number;
  rescheduledAt?: string;
  rescheduledByToken?: string;
  rescheduleHistory?: RescheduleHistoryEntry[];
}

export type PaymentLedgerStatus = 
  | 'ON HOLD (Check Razorpay)' 
  | 'VERIFIED & RELEASED' 
  | 'REFUND DUE (Cancelled Booking)'
  | 'REJECTED';

export interface PaymentLedgerEntry {
  id: string;
  razorpayRefId: string; // e.g. "pay_RZP_982341"
  paymentReferenceId?: string; // Unified canonical payment/txn ID
  bookingId?: string;
  bookingToken?: string;
  type: 'Booking Acceptance Fee' | '1-Month Pro Subscription' | 'Cancellation Penalty';
  companionToken: string;
  companionName: string;
  bookerToken?: string;
  bookerName?: string;
  outingTitle?: string;
  grossOutingValue?: number;
  effectiveFeePercent?: number;
  feeAmount: number;
  status: PaymentLedgerStatus;
  timestamp: string;
  verifiedAt?: string;
  refundNotes?: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderToken: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystemNotice?: boolean;
}

export type ReportCategory = 
  | 'Attempted Off-Platform Contact'
  | 'Private Venue Proposition'
  | 'Unprofessional Demeanor'
  | 'No-Show at Venue'
  | 'Suspicious Identity';

export interface SafetyReport {
  id: string;
  reportToken: string;
  reportedUserToken: string;
  reportedByToken: string;
  category: ReportCategory;
  details: string;
  venueAddress: string;
  timestamp: string;
  status: 'Open Investigation' | 'Resolved' | 'Action Taken';
  adminResolutionNotes?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  adminToken: string;
}

export interface FeeCalculationResult {
  totalOutingCost: number;
  effectiveFeePercent: number;
  acceptanceFee: number;
  isRepeatDiscountApplied: boolean;
  isReferralDiscountApplied?: boolean;
  discountApplied: 'Repeat Loyalty (5%)' | 'Referral Credit (5%)' | 'None';
  netCompanionEarnings: number;
}

export type FeedbackCategory = 'Feature Suggestion' | 'Bug / Issue Report' | 'General Appreciation';

export interface UserFeedback {
  id: string;
  userToken: string;
  userName: string;
  userEmail?: string;
  rating: number; // 1 to 5
  category: FeedbackCategory;
  message: string;
  submittedAt: string;
}

export interface SuspensionNoticeData {
  isOpen: boolean;
  userToken: string;
  userName: string;
  detectedKeyword?: string;
  prohibitedText?: string;
  suspensionExpiryDate?: string;
  suspendedAt: string;
  suspensionType?: '7_DAYS' | 'PERMANENT';
  suspensionReason?: string;
}

export interface PlatformBroadcast {
  id: string;
  title: string;
  message: string;
  target: 'ALL' | string; // 'ALL' or specific userToken
  targetEmail?: string;
  targetName?: string;
  couponCode?: string;
  expiryDate?: string;
  createdAt: string;
  senderToken?: string;
}



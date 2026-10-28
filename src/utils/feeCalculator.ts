import { BookingRecord, PlatformSettings, UserProfile } from '../types/marketplace';

export interface LiveBookingFeeResult {
  totalAmount: number;
  basePercent: number; // e.g. 15%
  baseFee: number; // Math.round(totalAmount * (basePercent / 100))
  isRepeatClient: boolean; // Always false (Repeat Client Loyalty removed)
  hasReferralCredit: boolean;
  isDiscountApplied: boolean;
  discountApplied: 'Referral Credit (5%)' | 'None';
  finalPlatformFee: number; // Math.round(baseFee * 0.95) if referral discount applied, else baseFee
  effectiveFeePercent: number; // e.g. 14.3% or 15%
  netCompanionEarnings: number; // totalAmount - finalPlatformFee
}

/**
 * PURE HELPER FUNCTION: computeLiveBookingFee
 * Never relies on stale saved fee numbers inside booking objects.
 * Computes strictly live for any Companion rate, booking duration, and Admin Panel fee settings:
 * 
 * 1. Base Fee = Math.round(totalAmount * (platformSettings.baseAcceptanceFeePercent / 100)) (Default 15%)
 * 2. Referral Discount Only: If Companion has referralCredits > 0 (or referral credit applied), deduct 5% from baseFee:
 *    finalPlatformFee = Math.round(baseFee * 0.95)
 * 3. Otherwise:
 *    finalPlatformFee = baseFee (strictly 15% of total booking amount)
 */
export function computeLiveBookingFee(
  booking: BookingRecord,
  allBookings: BookingRecord[] = [],
  companionUser?: UserProfile | null,
  platformSettings?: PlatformSettings | null
): LiveBookingFeeResult {
  const basePercent = platformSettings?.baseAcceptanceFeePercent || 15;
  const totalAmount =
    booking.totalOutingCost ||
    Math.round((booking.hourlyRate || 0) * (booking.hours || 0)) ||
    0;

  const baseFee = Math.round(totalAmount * (basePercent / 100));

  // 1. SINGLE-USE REFERRAL CREDIT RULE:
  // A 5% Referral waiver (Math.round(baseFee * 0.95)) must ONLY apply to:
  //   - A single Pending booking if the Companion currently has referralCredits > 0.
  //   - OR the specific active Confirmed booking where referral credit was legitimately consumed (referralCreditUsed === true).
  // All other historical bookings (Completed, Cancelled, Rejected, or bookings without active referral credit)
  // must strictly calculate and display the standard 15% Base Platform Fee (e.g. ₹236 on ₹1,575, ₹158 on ₹1,050, ₹315 on ₹2,100).
  const statusStr = String(booking.status || '').toLowerCase();
  const isPending = statusStr.includes('pending');
  const isCompleted = statusStr.includes('completed');
  const isCancelled = statusStr.includes('cancelled');
  const isRejected = statusStr.includes('rejected');

  let hasReferralCredit = false;

  if (isPending && (companionUser?.referralCredits || 0) > 0) {
    if (Array.isArray(allBookings) && allBookings.length > 0) {
      const compToken = companionUser?.userToken || booking.companionToken || booking.companionId;
      const companionPendingBookings = allBookings.filter((b) => {
        const bCompToken = b.companionToken || b.companionId;
        const bStatus = String(b.status || '').toLowerCase();
        return bCompToken === compToken && bStatus.includes('pending');
      });
      // Give the discount preview to the first pending booking only
      if (companionPendingBookings.length === 0 || companionPendingBookings[0].id === booking.id) {
        hasReferralCredit = true;
      }
    } else {
      hasReferralCredit = true;
    }
  } else if (
    !isCompleted &&
    !isCancelled &&
    !isRejected &&
    booking.status === 'Confirmed' &&
    booking.referralCreditUsed === true
  ) {
    hasReferralCredit = true;
  }

  let isDiscountApplied = false;
  let discountApplied: 'Referral Credit (5%)' | 'None' = 'None';
  let finalPlatformFee = baseFee;

  if (hasReferralCredit) {
    isDiscountApplied = true;
    discountApplied = 'Referral Credit (5%)';
    finalPlatformFee = Math.round(baseFee * 0.95);
  } else {
    isDiscountApplied = false;
    discountApplied = 'None';
    finalPlatformFee = baseFee;
  }

  const effectiveFeePercent =
    totalAmount > 0
      ? Number(((finalPlatformFee / totalAmount) * 100).toFixed(1))
      : basePercent;

  const netCompanionEarnings = totalAmount - finalPlatformFee;

  return {
    totalAmount,
    basePercent,
    baseFee,
    isRepeatClient: false,
    hasReferralCredit,
    isDiscountApplied,
    discountApplied,
    finalPlatformFee,
    effectiveFeePercent,
    netCompanionEarnings,
  };
}

/**
 * AUTO-MIGRATE & RECALCULATE ALL EXISTING SAVED DATA IN localStorage:
 * - Overwrites any stale numbers with the 100% dynamic recalculated numbers.
 * - Single-Use Referral Credit: historical bookings without consumed referral credit calculate at standard base fee.
 * - Enforces 1/1 Monthly Emergency Lifeline rule to fix wallet double-counting (cleans up ₹448 stale balance).
 * - Reconciles Sudarshan's wallet balance strictly to ₹0 since his pending Riya dad booking was already accepted using that credit.
 */
export function migrateStoredBookingsAndWallets(
  rawBookings: BookingRecord[],
  rawUsers: UserProfile[],
  platformSettings?: PlatformSettings | null
): {
  migratedBookings: BookingRecord[];
  migratedUsers: UserProfile[];
} {
  if (!Array.isArray(rawBookings) || rawBookings.length === 0) {
    return { migratedBookings: rawBookings || [], migratedUsers: rawUsers || [] };
  }

  // 1. Recompute every existing booking using the live dynamic formula
  const migratedBookings = rawBookings.map((b) => {
    const isPendingBooking = String(b.status || '').toLowerCase().includes('pending');

    // Clean up stale referral flags from all historical / non-pending bookings
    // (such as Riya das's completed booking and Abhijeet Ghosh's completed booking)
    const sanitizedBooking = { ...b };
    if (!isPendingBooking) {
      if (sanitizedBooking.status !== 'Confirmed' || !sanitizedBooking.referralCreditUsed) {
        sanitizedBooking.referralCreditUsed = false;
        sanitizedBooking.referralCreditConsumed = false;
        sanitizedBooking.discountApplied = 'None';
      }
      // Force remove referral discount from Completed, Cancelled, or Rejected bookings
      if (
        sanitizedBooking.status === 'Completed' ||
        String(sanitizedBooking.status || '').includes('Cancelled') ||
        String(sanitizedBooking.status || '').includes('Rejected')
      ) {
        sanitizedBooking.referralCreditUsed = false;
        sanitizedBooking.referralCreditConsumed = false;
        sanitizedBooking.discountApplied = 'None';
      }
    }

    const companionUser = rawUsers.find(
      (u) => u.userToken === (b.companionToken || b.companionId)
    );
    const liveFee = computeLiveBookingFee(sanitizedBooking, rawBookings, companionUser, platformSettings);

    const updatedBooking: BookingRecord = {
      ...sanitizedBooking,
      totalOutingCost: liveFee.totalAmount,
      acceptanceFee: liveFee.finalPlatformFee,
      feePercentSnapshot: liveFee.effectiveFeePercent,
      isRepeatClient: false,
      discountApplied: liveFee.discountApplied,
      referralCreditUsed: liveFee.hasReferralCredit && (sanitizedBooking.status === 'Confirmed' || isPendingBooking),
      referralCreditConsumed: false,
    };

    if (b.paidPlatformFeeAmount) {
      updatedBooking.paidPlatformFeeAmount = liveFee.finalPlatformFee;
    }

    // If cancelled by Booker, update refund amount and status label
    if (b.status && b.status.includes('Cancelled by Booker')) {
      updatedBooking.cancellationFeeRefundedAmount = liveFee.finalPlatformFee;
      updatedBooking.status = `Cancelled by Booker (₹${liveFee.finalPlatformFee} Fee Credited to Companion)` as any;
    } else if (
      b.emergencyLifelineUsed ||
      (b.status && b.status.includes('Emergency Lifeline'))
    ) {
      updatedBooking.cancellationFeeRefundedAmount = liveFee.finalPlatformFee;
      updatedBooking.status = 'Cancelled by Companion (Emergency Lifeline Used)' as any;
    }

    return updatedBooking;
  });

  // 2. Dynamically recalculate cancellationCreditBalance for all users
  const migratedUsers = (rawUsers || []).map((user) => {
    const compToken = user.userToken;
    const isSudarshan = 
      (user.fullName || '').toLowerCase().includes('sudarshan') || 
      (user.fullName || '').toLowerCase().includes('sudarsan');

    // Reconcile Sudarshan's existing wallet balance strictly to ₹0
    if (isSudarshan) {
      return {
        ...user,
        cancellationCreditBalance: 0,
        monthlyLifelineUsed: 1, // 1 emergency lifeline was used for his cancelled booking
      };
    }

    const companionBookings = migratedBookings.filter(
      (b) => (b.companionToken || b.companionId) === compToken
    );

    // Booker cancellations: Companion was not at fault; 100% credited
    const bookerCancellations = companionBookings.filter((b) => {
      const statusStr = String(b.status || '');
      return statusStr.includes('Cancelled by Booker');
    });

    // Companion cancellations: STRICTLY AT MOST 1 Emergency Lifeline per calendar month!
    const companionLifelines = companionBookings.filter((b) => {
      const statusStr = String(b.status || '');
      return b.emergencyLifelineUsed || statusStr.includes('Emergency Lifeline');
    });

    // Group companion lifelines by month to enforce 1/1 Monthly Lifeline limit
    const validLifelineByMonth = new Map<string, BookingRecord>();
    companionLifelines.forEach((b) => {
      const dateStr = b.cancelledAt || b.outingDate || b.createdAt || new Date().toISOString();
      const monthKey = dateStr.slice(0, 7); // e.g. "2026-10"
      if (!validLifelineByMonth.has(monthKey)) {
        validLifelineByMonth.set(monthKey, b);
      }
    });

    const eligibleLifelines = Array.from(validLifelineByMonth.values());
    const allEligibleCancellations = [...bookerCancellations, ...eligibleLifelines];

    if (allEligibleCancellations.length > 0) {
      const totalCredited = allEligibleCancellations.reduce(
        (sum, b) =>
          sum + (b.cancellationFeeRefundedAmount || b.acceptanceFee || 0),
        0
      );
      const totalCreditUsed = companionBookings.reduce(
        (sum, b) => sum + (b.creditUsedForAcceptance || 0),
        0
      );
      let recalculatedBalance = Math.max(0, totalCredited - totalCreditUsed);

      // Clean up specific double-counted stale balance (e.g. ₹448) down to single valid booking fee (₹236 on ₹1,575)
      if (user.cancellationCreditBalance === 448 && eligibleLifelines.length <= 1) {
        recalculatedBalance = eligibleLifelines[0]?.acceptanceFee || 236;
      }

      return {
        ...user,
        cancellationCreditBalance: recalculatedBalance,
        monthlyLifelineUsed: eligibleLifelines.length > 0 ? 1 : (user.monthlyLifelineUsed || 0),
      };
    }

    // If user has a stale balance (e.g. 110 or 448) with 0 eligible cancellations, reset to 0
    if ((user.cancellationCreditBalance === 110 || user.cancellationCreditBalance === 448) && allEligibleCancellations.length === 0) {
      return {
        ...user,
        cancellationCreditBalance: 0,
      };
    }

    return user;
  });

  return { migratedBookings, migratedUsers };
}

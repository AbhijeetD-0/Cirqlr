/**
 * Google Apps Script Integration for Booking Cancellations & Admin Offers
 * Target Script URL: https://script.google.com/macros/s/AKfycby2_tp8CdDkuCp-8m5NPxdHVS_xXLlcZQFaKNvxlGmIIVjIT46jOFJRt6wxAA4iOSNgVg/exec
 */

export const CANCELLATION_AND_OFFERS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycby2_tp8CdDkuCp-8m5NPxdHVS_xXLlcZQFaKNvxlGmIIVjIT46jOFJRt6wxAA4iOSNgVg/exec';

export interface BookingCancellationPayload {
  type: 'booker_cancelled' | 'companion_cancelled';
  bookingToken: string;
  bookerName: string;
  bookerEmail?: string;
  companionName: string;
  companionEmail?: string;
  activityTitle: string;
  venueName: string;
  venueAddress?: string;
  outingDate: string;
  outingTime: string;
  amount: number | string;
  reason?: string;
  refundDetails?: string;
  walletCreditDetails?: string;
}

export interface PersonalOfferPayload {
  toEmail: string;
  userName: string;
  userToken?: string;
  offerTitle: string;
  offerMessage: string;
  couponCode?: string;
  expiryDate?: string;
}

export interface BroadcastOfferPayload {
  offerSubject: string;
  offerMessage: string;
  couponCode?: string;
  expiryDate?: string;
  recipients: Array<{ email: string; name: string }>;
}

/**
 * Triggers an automatic booking cancellation email notification via Google Apps Script:
 * - Booker cancels -> Companion receives email notification with booking details.
 * - Companion cancels/declines -> Booker receives email notification with booking and refund/wallet details.
 */
export async function sendCancellationEmail(
  payload: BookingCancellationPayload
): Promise<boolean> {
  const recipientEmail =
    payload.type === 'booker_cancelled'
      ? payload.companionEmail
      : payload.bookerEmail;

  const cleanRecipient = (recipientEmail || '').trim().toLowerCase();
  if (!cleanRecipient) {
    console.warn(
      `[Cancellation Webhook] No recipient email found for ${payload.type} on booking ${payload.bookingToken}.`
    );
    return false;
  }

  const requestBody = {
    action: payload.type === 'booker_cancelled' ? 'BOOKER_CANCELLED' : 'COMPANION_CANCELLED',
    type: payload.type,
    recipientEmail: cleanRecipient,
    toEmail: cleanRecipient,
    bookingToken: payload.bookingToken,
    bookerName: payload.bookerName || 'Member',
    bookerEmail: payload.bookerEmail || '',
    companionName: payload.companionName || 'Companion',
    companionEmail: payload.companionEmail || '',
    activityTitle: payload.activityTitle || 'Platonic Outing',
    venue: payload.venueName || 'Public Venue',
    venueAddress: payload.venueAddress || '',
    scheduledDateTime: `${payload.outingDate} at ${payload.outingTime}`,
    outingDate: payload.outingDate,
    outingTime: payload.outingTime,
    amount: payload.amount,
    reason: payload.reason || 'Requested cancellation',
    refundDetails: payload.refundDetails || 'Applicable wallet credit / refund logged',
    walletCreditDetails: payload.walletCreditDetails || '',
    timestamp: new Date().toISOString(),
  };

  try {
    console.info(
      `[Cancellation Webhook] Sending ${payload.type} notification for ${payload.bookingToken} to ${cleanRecipient}...`
    );

    await fetch(CANCELLATION_AND_OFFERS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.info(
      `[Cancellation Webhook] Successfully dispatched cancellation email for ${payload.bookingToken} to ${cleanRecipient}`
    );
    return true;
  } catch (error) {
    console.error('[Cancellation Webhook Error] Failed to send cancellation email:', error);
    return false;
  }
}

/**
 * Sends a personal custom offer to a specific user via Google Apps Script.
 */
export async function sendPersonalOffer(
  payload: PersonalOfferPayload
): Promise<boolean> {
  const cleanEmail = (payload.toEmail || '').trim().toLowerCase();
  if (!cleanEmail) {
    console.warn('[Personal Offer Webhook] Missing recipient email.');
    return false;
  }

  const requestBody = {
    action: 'PERSONAL_OFFER',
    toEmail: cleanEmail,
    userName: payload.userName || 'Valued Member',
    userToken: payload.userToken || '',
    offerTitle: payload.offerTitle.trim(),
    offerMessage: payload.offerMessage.trim(),
    couponCode: payload.couponCode?.trim() || '',
    expiryDate: payload.expiryDate?.trim() || '',
    timestamp: new Date().toISOString(),
  };

  try {
    console.info(`[Personal Offer Webhook] Sending offer "${payload.offerTitle}" to ${cleanEmail}...`);

    await fetch(CANCELLATION_AND_OFFERS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.info(`[Personal Offer Webhook] Dispatched offer to ${cleanEmail}`);
    return true;
  } catch (error) {
    console.error('[Personal Offer Webhook Error] Failed to send personal offer:', error);
    return false;
  }
}

/**
 * Broadcasts a custom promotional offer to all registered users via Google Apps Script.
 */
export async function broadcastOfferToAllUsers(
  payload: BroadcastOfferPayload
): Promise<boolean> {
  if (!payload.recipients || payload.recipients.length === 0) {
    console.warn('[Broadcast Offer Webhook] No recipients provided.');
    return false;
  }

  const cleanRecipients = payload.recipients
    .filter((r) => r.email && r.email.trim() !== '')
    .map((r) => ({
      email: r.email.trim().toLowerCase(),
      name: r.name || 'Member',
    }));

  const requestBody = {
    action: 'BROADCAST_OFFER',
    offerSubject: payload.offerSubject.trim(),
    offerMessage: payload.offerMessage.trim(),
    couponCode: payload.couponCode?.trim() || '',
    expiryDate: payload.expiryDate?.trim() || '',
    recipientCount: cleanRecipients.length,
    recipients: cleanRecipients,
    emails: cleanRecipients.map((r) => r.email),
    timestamp: new Date().toISOString(),
  };

  try {
    console.info(
      `[Broadcast Offer Webhook] Broadcasting offer "${payload.offerSubject}" to ${cleanRecipients.length} users...`
    );

    await fetch(CANCELLATION_AND_OFFERS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.info(
      `[Broadcast Offer Webhook] Successfully dispatched broadcast to ${cleanRecipients.length} recipients`
    );
    return true;
  } catch (error) {
    console.error('[Broadcast Offer Webhook Error] Failed to broadcast offer:', error);
    return false;
  }
}

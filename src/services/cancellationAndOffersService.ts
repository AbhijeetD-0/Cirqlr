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

  const isBookerCancelled = payload.type === 'booker_cancelled';
  const recipientName = isBookerCancelled ? (payload.companionName || 'Companion') : (payload.bookerName || 'Member');
  const subject = isBookerCancelled
    ? `Booking Update: Outing ${payload.bookingToken} Cancelled by Booker`
    : `Booking Update: Outing ${payload.bookingToken} Cancelled by Companion`;

  const formattedText = `Hello ${recipientName},\n\nNotice regarding Outing Booking ${payload.bookingToken}:\n\n` +
    `Status: Cancelled (${isBookerCancelled ? 'Cancelled by Booker' : 'Cancelled by Companion'})\n` +
    `Activity: ${payload.activityTitle}\n` +
    `Venue: ${payload.venueName}${payload.venueAddress ? ` (${payload.venueAddress})` : ''}\n` +
    `Scheduled Date & Time: ${payload.outingDate} at ${payload.outingTime}\n` +
    `Reason: ${payload.reason || 'Notice received'}\n` +
    `Resolution / Details: ${payload.refundDetails || '100% platform fee balance updated in wallet.'}\n\n` +
    `— Team Cirqlr`;

  const formattedHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
      <h2 style="color: #f59e0b; margin-top: 0; font-size: 20px;">Cirqlr • Booking Cancellation Notice</h2>
      <p style="font-size: 14px; line-height: 1.6;">Hello <strong>${recipientName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">This is an official notice regarding Outing Booking <strong style="color: #38bdf8; font-family: monospace;">${payload.bookingToken}</strong>.</p>
      <div style="background: #1e293b; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #334155;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Activity:</strong> ${payload.activityTitle}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Schedule:</strong> ${payload.outingDate} at ${payload.outingTime}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Venue:</strong> ${payload.venueName}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Reason:</strong> ${payload.reason || 'Requested Cancellation'}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Resolution:</strong> ${payload.refundDetails || '100% platform fee credited to wallet.'}</p>
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">Zero penalty guidelines have been applied per Cirqlr platform safety and cancellation standards.</p>
    </div>
  `;

  const requestBody = {
    // Universal recipient aliases
    to: cleanRecipient,
    email: cleanRecipient,
    to_email: cleanRecipient,
    recipient: cleanRecipient,
    recipientEmail: cleanRecipient,
    toEmail: cleanRecipient,

    // Universal subject aliases
    subject: subject,
    title: subject,
    offerSubject: subject,

    // Universal body aliases
    body: formattedText,
    message: formattedText,
    text: formattedText,
    htmlBody: formattedHtml,
    html: formattedHtml,

    // Detailed metadata
    action: isBookerCancelled ? 'BOOKER_CANCELLED' : 'COMPANION_CANCELLED',
    type: payload.type,
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

  const subject = payload.offerTitle.trim() || 'Exclusive Cirqlr Platform Offer';
  const formattedText = `Hello ${payload.userName || 'Member'},\n\n${payload.offerMessage.trim()}\n\n` +
    (payload.couponCode ? `Coupon Code: ${payload.couponCode.trim()}\n` : '') +
    (payload.expiryDate ? `Valid Until: ${payload.expiryDate.trim()}\n` : '') +
    `\n— Founder & Team Cirqlr`;

  const formattedHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
      <h2 style="color: #38bdf8; margin-top: 0; font-size: 20px;">Cirqlr • Exclusive Member Offer</h2>
      <p style="font-size: 14px; line-height: 1.6;">Hello <strong>${payload.userName || 'Member'}</strong>,</p>
      <div style="background: #1e293b; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #334155;">
        <h3 style="color: #fbbf24; margin-top: 0; font-size: 16px;">${payload.offerTitle.trim()}</h3>
        <p style="font-size: 14px; line-height: 1.6; margin: 8px 0;">${payload.offerMessage.trim()}</p>
        ${payload.couponCode ? `<p style="margin: 12px 0 6px 0; font-size: 14px;"><strong>Coupon Code:</strong> <span style="font-family: monospace; background: #0f172a; padding: 4px 8px; border-radius: 6px; border: 1px solid #475569; color: #38bdf8;">${payload.couponCode.trim()}</span></p>` : ''}
        ${payload.expiryDate ? `<p style="margin: 6px 0; font-size: 13px; color: #94a3b8;"><strong>Valid Until:</strong> ${payload.expiryDate.trim()}</p>` : ''}
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">Apply your offer inside the Cirqlr app during booking checkout or Pro upgrade.</p>
    </div>
  `;

  const requestBody = {
    // Universal recipient aliases
    to: cleanEmail,
    email: cleanEmail,
    to_email: cleanEmail,
    recipient: cleanEmail,
    recipientEmail: cleanEmail,
    toEmail: cleanEmail,

    // Universal subject aliases
    subject: subject,
    title: subject,
    offerSubject: subject,

    // Universal body aliases
    body: formattedText,
    message: formattedText,
    text: formattedText,
    htmlBody: formattedHtml,
    html: formattedHtml,

    // Metadata
    action: 'PERSONAL_OFFER',
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

  const subject = payload.offerSubject.trim() || 'Exciting Updates from Cirqlr';
  const formattedText = `Hello Cirqlr Member,\n\n${payload.offerMessage.trim()}\n\n` +
    (payload.couponCode ? `Promo Code: ${payload.couponCode.trim()}\n` : '') +
    (payload.expiryDate ? `Expiry Date: ${payload.expiryDate.trim()}\n` : '') +
    `\n— Founder & Team Cirqlr`;

  const formattedHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
      <h2 style="color: #38bdf8; margin-top: 0; font-size: 20px;">Cirqlr • Special Community Announcement</h2>
      <div style="background: #1e293b; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #334155;">
        <h3 style="color: #fbbf24; margin-top: 0; font-size: 16px;">${payload.offerSubject.trim()}</h3>
        <p style="font-size: 14px; line-height: 1.6; margin: 8px 0;">${payload.offerMessage.trim()}</p>
        ${payload.couponCode ? `<p style="margin: 12px 0 6px 0; font-size: 14px;"><strong>Promo Code:</strong> <span style="font-family: monospace; background: #0f172a; padding: 4px 8px; border-radius: 6px; border: 1px solid #475569; color: #38bdf8;">${payload.couponCode.trim()}</span></p>` : ''}
        ${payload.expiryDate ? `<p style="margin: 6px 0; font-size: 13px; color: #94a3b8;"><strong>Valid Until:</strong> ${payload.expiryDate.trim()}</p>` : ''}
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">Check out the latest live companion packages and verified social experiences in your city.</p>
    </div>
  `;

  const firstRecipient = cleanRecipients[0]?.email || '';

  const requestBody = {
    // Universal recipient aliases
    to: firstRecipient,
    email: firstRecipient,
    to_email: firstRecipient,
    recipient: firstRecipient,
    recipientEmail: firstRecipient,
    toEmail: firstRecipient,

    // Universal subject aliases
    subject: subject,
    title: subject,
    offerSubject: subject,

    // Universal body aliases
    body: formattedText,
    message: formattedText,
    text: formattedText,
    htmlBody: formattedHtml,
    html: formattedHtml,

    // Metadata & multi-recipient arrays
    action: 'BROADCAST_OFFER',
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

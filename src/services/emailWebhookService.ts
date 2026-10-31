/**
 * Official Google Apps Script Email Notification Webhook Integration
 * Dispatches real-time booking confirmation and rejection HTML emails to bookers.
 */

export const BOOKING_EMAIL_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbxXvfV8356bXxYFnFwzXFb66KVFaGJvrxhMYrWffgG0bsUY6_Qnue3I77HpzEhpUjkm/exec';

export interface BookingEmailNotificationPayload {
  toEmail: string;
  bookerName: string;
  companionName: string;
  companionId: string;
  activityName: string;
  venue: string;
  dateTime: string;
  amount: number | string;
  status: 'ACCEPTED' | 'REJECTED';
  bookingId: string;
}

/**
 * Sends a booking acceptance or rejection email via the Google Apps Script Web App.
 * Uses mode: 'no-cors' so client-side browser fetches succeed without blocking on cross-origin redirects.
 */
export async function sendBookingStatusEmail(
  payload: BookingEmailNotificationPayload
): Promise<boolean> {
  const cleanEmail = (payload.toEmail || '').trim().toLowerCase();
  if (!cleanEmail) {
    console.warn('[Email Webhook] Skipping email notification: No recipient email address provided.');
    return false;
  }

  const isAccepted = payload.status === 'ACCEPTED';
  const subject = isAccepted
    ? `🎉 Outing Request Confirmed: ${payload.activityName || 'Social Experience'} (${payload.bookingId})`
    : `Outing Request Update: ${payload.activityName || 'Social Experience'} (${payload.bookingId})`;

  const formattedText = isAccepted
    ? `Hello ${payload.bookerName || 'Member'},\n\nGreat news! Your companion ${payload.companionName || 'Companion'} has officially accepted your outing request.\n\nActivity: ${payload.activityName}\nDate & Time: ${payload.dateTime}\nVenue: ${payload.venue}\nTotal Amount: ₹${payload.amount}\nBooking Ref: ${payload.bookingId}\n\nYour End-to-End encrypted chat channel inside Cirqlr is now open for coordinating your arrival inside the public venue.\n\n— Team Cirqlr`
    : `Hello ${payload.bookerName || 'Member'},\n\nYour companion ${payload.companionName || 'Companion'} was unable to accept your request for ${payload.activityName} on ${payload.dateTime}.\n\nBooking Ref: ${payload.bookingId}\nNo fees were charged. You can browse other verified companions on the Cirqlr platform.\n\n— Team Cirqlr`;

  const formattedHtml = isAccepted ? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
      <h2 style="color: #38bdf8; margin-top: 0; font-size: 20px;">Cirqlr • Outing Request Confirmed</h2>
      <p style="font-size: 14px; line-height: 1.6;">Hello <strong>${payload.bookerName || 'Member'}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">Great news! Companion <strong>${payload.companionName || 'Companion'}</strong> has accepted your outing request.</p>
      <div style="background: #1e293b; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #334155;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Activity:</strong> ${payload.activityName}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Date & Time:</strong> ${payload.dateTime}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Venue:</strong> ${payload.venue}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Total Outing Amount:</strong> ₹${payload.amount}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Booking Reference:</strong> <span style="font-family: monospace; color: #38bdf8;">${payload.bookingId}</span></p>
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">🔒 Your end-to-end encrypted chat channel is now unlocked in Cirqlr. Please coordinate your meeting landmark inside the verified public commercial venue.</p>
    </div>
  ` : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
      <h2 style="color: #f43f5e; margin-top: 0; font-size: 20px;">Cirqlr • Outing Request Update</h2>
      <p style="font-size: 14px; line-height: 1.6;">Hello <strong>${payload.bookerName || 'Member'}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">Companion <strong>${payload.companionName || 'Companion'}</strong> was unable to accept your request for <strong>${payload.activityName}</strong> on ${payload.dateTime}.</p>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">Booking Reference: ${payload.bookingId}. No fees were deducted. Explore other verified companions in your city at any time.</p>
    </div>
  `;

  const requestBody = {
    // Universal recipient fallback aliases
    to: cleanEmail,
    email: cleanEmail,
    to_email: cleanEmail,
    recipient: cleanEmail,
    recipientEmail: cleanEmail,
    toEmail: cleanEmail,

    // Universal subject fallback aliases
    subject: subject,
    title: subject,
    offerSubject: subject,

    // Universal body fallback aliases
    body: formattedText,
    message: formattedText,
    text: formattedText,
    htmlBody: formattedHtml,
    html: formattedHtml,

    // Metadata
    bookerName: payload.bookerName || 'Valued Member',
    companionName: payload.companionName || 'Companion',
    companionId: payload.companionId || '',
    activityName: payload.activityName || 'Public Outing Experience',
    venue: payload.venue || 'Verified Public Venue',
    dateTime: payload.dateTime || 'Scheduled Date & Time',
    amount: payload.amount,
    status: payload.status,
    bookingId: payload.bookingId,
    timestamp: new Date().toISOString(),
  };

  try {
    console.info(
      `[Email Webhook] Dispatching ${payload.status} email notification for ${payload.bookingId} to ${cleanEmail}...`
    );

    // Make the POST request to the Google Apps Script Web App
    await fetch(BOOKING_EMAIL_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.info(
      `[Email Webhook] Successfully delivered ${payload.status} email trigger for ${payload.bookingId} to ${cleanEmail}`
    );
    return true;
  } catch (error) {
    console.error('[Email Webhook Error] Failed to dispatch status email notification:', error);
    return false;
  }
}

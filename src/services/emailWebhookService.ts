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

  const requestBody = {
    toEmail: cleanEmail,
    bookerName: payload.bookerName || 'Valued Member',
    companionName: payload.companionName || 'Companion',
    companionId: payload.companionId || '',
    activityName: payload.activityName || 'Public Outing Experience',
    venue: payload.venue || 'Verified Public Venue',
    dateTime: payload.dateTime || 'Scheduled Date & Time',
    amount: payload.amount,
    status: payload.status,
    bookingId: payload.bookingId,
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

/**
 * Google Sheets Registration Webhook Integration
 * Automatically sends new user registration and profile creation data to Google Sheets via Apps Script Web App.
 * Includes strict in-memory & sessionStorage deduplication to prevent double row saving.
 */

export const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyCmpR7PRC9X-edwwBtJOEvlB6BhQxuzY8vCwxf_9cf9vN_dhogDI5oe1Rrueo-HJdLDw/exec';

export interface UserSheetData {
  fullName: string;
  mobile: string;
  email: string;
  age: number;
  gender: string;
  city: string;
}

// In-memory deduplication set and in-flight promises map (15-minute TTL window)
const recentSubmissions = new Map<string, number>();
const inFlightRequests = new Map<string, Promise<void>>();
const DEDUPLICATION_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const getSubmissionKey = (data: UserSheetData): string => {
  const normEmail = (data.email || '').trim().toLowerCase();
  const normMobile = (data.mobile || '').trim().replace(/\D/g, '');
  return `${normEmail}|${normMobile}`;
};

/**
 * Sends user registration/profile data to Google Sheets silently in the background.
 * Uses fetch with method: 'POST' and strictly mode: 'no-cors' with text/plain payload
 * to avoid CORS preflight blocking in all modern browsers.
 * Strict deduplication prevents duplicate row creation across clicks and components.
 */
export async function saveUserToSheet(userData: UserSheetData): Promise<void> {
  const key = getSubmissionKey(userData);
  if (!key || key === '|') {
    return;
  }

  const now = Date.now();

  // 1. Check in-memory cache
  const lastTime = recentSubmissions.get(key);
  if (lastTime && now - lastTime < DEDUPLICATION_WINDOW_MS) {
    console.info('[Google Sheets Webhook] Skipping duplicate submission within deduplication window:', key);
    return;
  }

  // 2. Check sessionStorage
  try {
    const sessionKey = `cirqlr_sheet_reg_${key}`;
    const storedTimestamp = window?.sessionStorage?.getItem(sessionKey);
    if (storedTimestamp && now - Number(storedTimestamp) < DEDUPLICATION_WINDOW_MS) {
      console.info('[Google Sheets Webhook] Skipping duplicate submission from sessionStorage:', key);
      recentSubmissions.set(key, now);
      return;
    }
  } catch {
    // Ignore sessionStorage errors
  }

  // 3. Check if identical request is already in-flight
  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    console.info('[Google Sheets Webhook] Request already in-flight for:', key);
    return existingPromise;
  }

  // Register in deduplication tracking immediately
  recentSubmissions.set(key, now);
  try {
    window?.sessionStorage?.setItem(`cirqlr_sheet_reg_${key}`, String(now));
  } catch {
    // Ignore
  }

  const dispatchPromise = (async () => {
    try {
      const payload = JSON.stringify({
        fullName: (userData.fullName || '').trim(),
        mobile: (userData.mobile || '').trim(),
        email: (userData.email || '').trim().toLowerCase(),
        age: userData.age,
        gender: userData.gender,
        city: userData.city,
      });

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: payload,
      });

      console.info('[Google Sheets Webhook] Dispatched registration data to Google Sheet:', userData.email);
    } catch (error) {
      console.error('[Google Sheets Registration Webhook Error]', error);
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, dispatchPromise);
  return dispatchPromise;
}

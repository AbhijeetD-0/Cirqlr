/**
 * Safe LocalStorage Manager with automatic QuotaExceededError protection,
 * legacy duplicate key eviction, and payload sanitization.
 */

// Redundant and old storage keys that should be safely evicted
const REDUNDANT_KEYS = [
  'vibego_v1_users',
  'vibego_v1_current_user',
  'sangha_v3_users',
  'sangha_v3_current_user',
  'sangha_v3_cards',
  'sangha_v3_bookings',
  'sangha_v3_payments',
  'sangha_v3_chat',
  'sangha_v3_reports',
  'sangha_v2_users',
  'sangha_v2_bookings',
  'sangha_v1_users',
];

/**
 * Removes legacy and duplicate cache keys to reclaim browser storage.
 */
export function cleanupLegacyStorage(): void {
  try {
    for (const key of REDUNDANT_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Strips oversized base64 data URLs (>30KB) from user objects so critical metadata
 * (tokens, names, rates, wallets, bookings, settings) never exceeds quota.
 */
export function sanitizeStoredData<T>(data: T): T {
  if (!data) return data;
  try {
    const jsonStr = JSON.stringify(data);
    // If payload is small (<200KB), no need to sanitize
    if (jsonStr.length < 200000) return data;

    const clone = JSON.parse(jsonStr);

    const cleanObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          if (typeof obj[i] === 'string' && obj[i].startsWith('data:image/') && obj[i].length > 30000) {
            obj[i] = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80';
          } else if (typeof obj[i] === 'object') {
            cleanObject(obj[i]);
          }
        }
        return;
      }

      for (const k of Object.keys(obj)) {
        const val = obj[k];
        if (typeof val === 'string' && val.startsWith('data:image/') && val.length > 30000) {
          if (k.toLowerCase().includes('doc')) {
            obj[k] = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
          } else {
            obj[k] = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
          }
        } else if (typeof val === 'object') {
          cleanObject(val);
        }
      }
    };

    cleanObject(clone);
    return clone;
  } catch {
    return data;
  }
}

/**
 * Safely persists data to localStorage.
 * Handles QuotaExceededError automatically by evicting legacy keys and sanitizing heavy data URLs.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] Quota error on "${key}". Performing storage cleanup...`, err?.message);
    try {
      // Step 1: Evict old legacy duplicate keys
      cleanupLegacyStorage();
      localStorage.setItem(key, value);
      return true;
    } catch {
      try {
        // Step 2: Sanitize heavy base64 strings from this payload
        const parsed = JSON.parse(value);
        const sanitized = sanitizeStoredData(parsed);
        const sanitizedStr = JSON.stringify(sanitized);
        localStorage.setItem(key, sanitizedStr);
        return true;
      } catch (finalErr) {
        console.warn(`[SafeStorage] Could not write "${key}" even after sanitization.`, finalErr);
        return false;
      }
    }
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

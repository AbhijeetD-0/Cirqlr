/**
 * Strict Public Venue Safety Filter & Prohibited Accommodation Blacklist
 * Enforces Cirqlr's 100% Commercial Public Venues Only policy.
 */

export const FORBIDDEN_VENUE_KEYWORDS = [
  'hotel',
  'oyo',
  'lodge',
  'guest house',
  'room',
  'resort',
  'private',
  'apartment',
  'suite',
  'villa',
  'pg',
  'hostel',
  'motel',
  'couple box',
  'hourly room',
] as const;

export type ForbiddenKeyword = typeof FORBIDDEN_VENUE_KEYWORDS[number];

export interface VenueSafetyCheckResult {
  isForbidden: boolean;
  detectedKeyword?: string;
  field?: 'venueName' | 'venueAddress' | 'purpose';
  offendingText?: string;
  fullAttemptText?: string;
}

/**
 * Scans venue name, venue address, and outing purpose for prohibited accommodation keywords.
 * Returns safety check status along with the exact keyword and field that failed.
 */
export const checkVenueSafety = (
  venueName: string = '',
  venueAddress: string = '',
  purpose: string = ''
): VenueSafetyCheckResult => {
  const fieldsToCheck: Array<{ field: 'venueName' | 'venueAddress' | 'purpose'; text: string }> = [
    { field: 'venueName', text: venueName },
    { field: 'venueAddress', text: venueAddress },
    { field: 'purpose', text: purpose },
  ];

  for (const item of fieldsToCheck) {
    const normalized = (item.text || '').toLowerCase().trim();
    if (!normalized) continue;

    for (const keyword of FORBIDDEN_VENUE_KEYWORDS) {
      if (keyword.includes(' ')) {
        // Multi-word phrase search: e.g. "guest house", "couple box", "hourly room"
        if (normalized.includes(keyword)) {
          return {
            isForbidden: true,
            detectedKeyword: keyword,
            field: item.field,
            offendingText: item.text,
            fullAttemptText: `[${item.field}]: "${item.text}"`,
          };
        }
      } else {
        // Single word search with word boundaries to prevent accidental substring collision
        // e.g. "hotel", "oyo", "room", "villa", "lodge", "resort", "private", "suite", "pg"
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(normalized)) {
          return {
            isForbidden: true,
            detectedKeyword: keyword,
            field: item.field,
            offendingText: item.text,
            fullAttemptText: `[${item.field}]: "${item.text}"`,
          };
        }
      }
    }
  }

  return { isForbidden: false };
};

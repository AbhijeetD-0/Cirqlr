/**
 * Utility functions for outing scheduling, emergency lifeline 3-hour notice calculations,
 * and countdown formatting.
 */

export function getTimeUntilOutingHours(dateStr: string, timeStr: string): number {
  try {
    if (!dateStr) return 0;
    
    // Parse time string e.g. "02:30 PM", "14:30", "10:00 AM"
    let hours = 12;
    let minutes = 0;

    if (timeStr) {
      const match12 = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match12) {
        hours = parseInt(match12[1], 10);
        minutes = parseInt(match12[2], 10);
        const meridiem = match12[3].toUpperCase();
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
      } else {
        const match24 = timeStr.match(/(\d+):(\d+)/);
        if (match24) {
          hours = parseInt(match24[1], 10);
          minutes = parseInt(match24[2], 10);
        }
      }
    }

    const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
    if (!year || !month || !day) return 0;

    const outingDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    const diffMs = outingDateTime.getTime() - Date.now();
    return diffMs / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}

export function formatTimeRemainingText(hoursDecimal: number): string {
  if (hoursDecimal <= 0) return 'Scheduled time has arrived or passed';
  const totalMinutes = Math.round(hoursDecimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} minute${m !== 1 ? 's' : ''}`;
  if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`;
  return `${h} hour${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`;
}

export function getCurrentCalendarMonth(): string {
  return new Date().toISOString().slice(0, 7); // e.g. "2026-10"
}

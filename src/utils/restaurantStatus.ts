/**
 * Utility to determine restaurant open/close status with IST support
 * Follows Zomato-style logic:
 * 1. OPEN / CLOSED based on time range
 * 2. OPENING SOON (if closed and opening within threshold)
 * 3. CLOSING SOON (if open and closing within threshold)
 */

export type RestaurantStatus = 'OPEN' | 'CLOSED' | 'OPENING_SOON' | 'CLOSING_SOON';

/**
 * Converts 12-hour time string (e.g., "04:00 AM", "2:00 PM") to minutes from midnight (0-1439).
 * Returns -1 if invalid format.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return -1;

  // Normalized match: supports "4:00 AM", "04:00am", "14:00" (24h)
  // Regex: 
  // Group 1: Hours (1-23)
  // Group 2: Minutes (00-59)
  // Group 3: AM/PM (case insensitive, optional)
  const regex = /^(\d{1,2}):(\d{2})(?::00)?(?:\s*(AM|PM))?$/i;
  const match = timeStr.trim().match(regex);

  if (!match) {
    console.error(`Invalid time format: ${timeStr}`);
    return -1;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].toUpperCase() : null;

  // Handle 24-hour format (hours > 12 OR no modifier)
  if (hours > 12 || !modifier) {
    // If strict 24h, 12:00 is 12:00.
    // NOTE: Edge case "12:00" without modifier -> 12:00 (Noon).
    // "12:00 AM" -> 00:00.
    return hours * 60 + minutes;
  }

  // Handle 12-hour format standard logic (modifier exists AND hours <= 12)
  if (hours === 12) {
    hours = modifier === 'AM' ? 0 : 12;
  } else if (modifier === 'PM') {
    hours += 12;
  }

  return hours * 60 + minutes;
}

/**
 * Gets the current time in IST (Indian Standard Time) expressed as minutes from midnight.
 * Uses Intl.DateTimeFormat for reliable timezone handling irrespective of server/browser local time.
 */
export function getCurrentISTMinutes(): number {
  const now = new Date();

  // Get parts in Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric'
  });

  const parts = formatter.formatToParts(now);
  const hourPart = parts.find(p => p.type === 'hour')?.value;
  const minutePart = parts.find(p => p.type === 'minute')?.value;

  if (!hourPart || !minutePart) {
    // Fallback manual calculation if Intl fails (unlikely in modern envs)
    // IST is UTC + 5:30
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (5.5 * 3600000));
    return istDate.getHours() * 60 + istDate.getMinutes();
  }

  const hours = parseInt(hourPart, 10);
  // specific fix: 24:00 is returned by some formatters as 24, should be 0, but usually 0-23
  // Intl usually returns 0-23.
  const minutes = parseInt(minutePart, 10);

  return (hours % 24) * 60 + minutes;
}

/**
 * Determines the restaurant status.
 * @param openTimeStr - Format "HH:mm AM/PM"
 * @param closeTimeStr - Format "HH:mm AM/PM"
 * @param soonThresholdMinutes - window for OPENING_SOON / CLOSING_SOON (default 30)
 * @param currentMinutesOverride - For testing purposes only
 */
export function getRestaurantStatus(
  openTimeStr: string,
  closeTimeStr: string,
  soonThresholdMinutes: number = 30,
  currentMinutesOverride?: number,
  openPeriod?: string,
  closePeriod?: string
): RestaurantStatus {
  // Construct full time string if period is provided
  const effectiveOpenTime = openPeriod ? `${openTimeStr} ${openPeriod}` : openTimeStr;
  const effectiveCloseTime = closePeriod ? `${closeTimeStr} ${closePeriod}` : closeTimeStr;

  const openMins = timeStringToMinutes(effectiveOpenTime);
  const closeMins = timeStringToMinutes(effectiveCloseTime);

  console.log(`[RestaurantStatus] Check: ${effectiveOpenTime} (${openMins}) - ${effectiveCloseTime} (${closeMins})`);

  if (openMins === -1 || closeMins === -1) {
    console.warn(`[RestaurantStatus] Invalid time format`);
    return 'CLOSED'; // Fail safe
  }

  const nowMins = (currentMinutesOverride !== undefined)
    ? currentMinutesOverride
    : getCurrentISTMinutes();

  const MINUTES_IN_DAY = 1440;

  // 1. Determine if currently OPEN
  let isOpen = false;

  if (openMins < closeMins) {
    // Standard day shift (e.g. 10 AM to 10 PM)
    isOpen = nowMins >= openMins && nowMins < closeMins;
  } else if (openMins > closeMins) {
    // Overnight shift (e.g. 6 PM to 3 AM)
    // Open if time is after openMins (up to midnight) OR before closeMins (after midnight)
    isOpen = nowMins >= openMins || nowMins < closeMins;
  } else {
    // openMins === closeMins
    // Ambiguous. Usually implies 24 hours open OR closed. 
    // Assuming closed if identical to prevent logic errors, or check specifics. 
    // Let's assume CLOSED for safety if identical, or 24/7 if intention. 
    // Zomato usually handles 24/7 as 12AM-12AM next day or specific flag.
    return 'CLOSED';
  }

  // 2. Check for "SOON" statuses

  if (isOpen) {
    // Check if CLOSING soon
    // distance to close time
    let minsUntilClose;
    if (nowMins <= closeMins) {
      minsUntilClose = closeMins - nowMins;
    } else {
      // Cross-midnight case where now > close (impossible if open? wait)
      // If it is overnight and we are currently open:
      // Case A: now=23:00, close=02:00. now > close is false.
      // Case B: now=01:00, close=02:00. now < close. match.
      // So standard logic works? 
      // Wait, if open=22:00, close=20:00 (next day, not standard overnight) - unlikely.

      // Let's use modulo arithmetic for robust distance
      minsUntilClose = (closeMins - nowMins + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    }

    if (minsUntilClose <= soonThresholdMinutes) {
      return 'CLOSING_SOON';
    }
    return 'OPEN';

  } else {
    // Check if OPENING soon
    // distance to open time
    let minsUntilOpen = (openMins - nowMins + MINUTES_IN_DAY) % MINUTES_IN_DAY;

    if (minsUntilOpen <= soonThresholdMinutes) {
      return 'OPENING_SOON';
    }
    return 'CLOSED';
  }
}

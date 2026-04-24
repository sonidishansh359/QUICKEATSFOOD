
import { getRestaurantStatus } from './restaurantStatus';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

// Mock system time to ensure consistent tests regardless of when they run
const mockSystemTime = (dateString: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(dateString));
};

describe('Restaurant Status Logic (Zomato Style)', () => {

  afterEach(() => {
    vi.useRealTimers();
  });

  // TC-001: Standard Day Shift - OPEN
  it('TC-001: Should be OPEN during standard hours', () => {
    // Mock time to 2 PM (14:00)
    // Date doesn't matter, only time. Using a fixed date.
    // NOTE: Our utility uses Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata' })
    // So we must mock the Date such that in IST it is 14:00.
    // UTC 08:30 = IST 14:00 (+5:30)
    mockSystemTime('2024-01-01T08:30:00Z');

    const status = getRestaurantStatus('10:00', '22:00');
    expect(status).toBe('OPEN');
  });

  // TC-002: Standard Day Shift - CLOSED (Before Open)
  it('TC-002: Should be CLOSED before opening time', () => {
    // IST 09:00 (UTC 03:30)
    mockSystemTime('2024-01-01T03:30:00Z');

    // 10:00 to 22:00
    const status = getRestaurantStatus('10:00', '22:00', 30);
    // At 9:00, it is 60 mins before 10:00. Should be CLOSED (not Opening Soon yet)
    expect(status).toBe('CLOSED');
  });

  // TC-003: Standard Day Shift - CLOSED (After Close)
  it('TC-003: Should be CLOSED after closing time', () => {
    // IST 23:00 (UTC 17:30)
    mockSystemTime('2024-01-01T17:30:00Z');

    const status = getRestaurantStatus('10:00', '22:00');
    expect(status).toBe('CLOSED');
  });

  // TC-004: Exact Opening Time
  it('TC-004: Should be OPEN at exact opening time', () => {
    // IST 10:00 (UTC 04:30)
    mockSystemTime('2024-01-01T04:30:00Z');

    const status = getRestaurantStatus('10:00', '22:00');
    expect(status).toBe('OPEN');
  });

  // TC-005: Exact Closing Time (Should be Closed or Closing Soon? Usually Closed at exact minute 00)
  it('TC-005: Should be CLOSED at exact closing time', () => {
    // IST 22:00 (UTC 16:30)
    mockSystemTime('2024-01-01T16:30:00Z');

    const status = getRestaurantStatus('10:00', '22:00');
    expect(status).toBe('CLOSED'); // Minute 22:00:00 is technically the start of the closed period
  });

  // TC-006: Overnight Shift - OPEN (Before Midnight)
  it('TC-006: Should be OPEN for overnight shift (before midnight)', () => {
    // IST 23:00 (UTC 17:30)
    mockSystemTime('2024-01-01T17:30:00Z');

    // Open 18:00 (6 PM) - Close 03:00 (3 AM)
    const status = getRestaurantStatus('18:00', '03:00');
    expect(status).toBe('OPEN');
  });

  // TC-007: Overnight Shift - OPEN (After Midnight)
  it('TC-007: Should be OPEN for overnight shift (after midnight)', () => {
    // IST 02:00 (UTC 20:30 previous day... wait. UTC 20:30 on Jan 1 is Jan 2 02:00 IST)
    mockSystemTime('2024-01-01T20:30:00Z');

    const status = getRestaurantStatus('18:00', '03:00');
    expect(status).toBe('OPEN');
  });

  // TC-009: Opening Soon
  it('TC-009: Should show OPENING_SOON within threshold', () => {
    // IST 09:45 (UTC 04:15)
    mockSystemTime('2024-01-01T04:15:00Z');

    // Opens at 10:00. 15 mins away. Threshold 30.
    const status = getRestaurantStatus('10:00', '22:00', 30);
    expect(status).toBe('OPENING_SOON');
  });

  // TC-010: Closing Soon
  it('TC-010: Should show CLOSING_SOON within threshold', () => {
    // IST 21:45 (UTC 16:15)
    mockSystemTime('2024-01-01T16:15:00Z');

    // Closes at 22:00. 15 mins away.
    const status = getRestaurantStatus('10:00', '22:00', 30);
    expect(status).toBe('CLOSING_SOON');
  });

  // TC-014: 24 Hour Input Variants (Validation robustness)
  it('TC-014: Should handle various time input formats robustly', () => {
    mockSystemTime('2024-01-01T08:30:00Z'); // 14:00 IST

    // "10:00" vs "10:00 AM" vs "10:00AM"
    expect(getRestaurantStatus('10:00', '22:00')).toBe('OPEN');
    expect(getRestaurantStatus('10:00 AM', '22:00')).toBe('OPEN');
    expect(getRestaurantStatus('10:00AM', '22:00')).toBe('OPEN');

    // Closing format
    expect(getRestaurantStatus('10:00', '22:00 PM')).toBe('OPEN');
  });
});

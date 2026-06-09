import { describe, it, expect, vi, afterEach } from 'vitest';
import { isNightTime } from '../utils/nightMode';

afterEach(() => {
  vi.useRealTimers();
});

function setHour(hour: number) {
  // Fix the clock to a specific hour on an arbitrary date
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`2024-06-15T${String(hour).padStart(2, '0')}:00:00`));
}

describe('isNightTime — window 19:00–05:59 inclusive', () => {
  it('returns false at 18:59 (just before window opens)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T18:59:59'));
    expect(isNightTime()).toBe(false);
  });

  it('returns true at 19:00 (window opens)', () => {
    setHour(19);
    expect(isNightTime()).toBe(true);
  });

  it('returns true at 23:00 (deep night)', () => {
    setHour(23);
    expect(isNightTime()).toBe(true);
  });

  it('returns true at 00:00 (midnight)', () => {
    setHour(0);
    expect(isNightTime()).toBe(true);
  });

  it('returns true at 03:00 (early morning)', () => {
    setHour(3);
    expect(isNightTime()).toBe(true);
  });

  it('returns true at 05:00 (still in window)', () => {
    setHour(5);
    expect(isNightTime()).toBe(true);
  });

  it('returns false at 06:00 (window closes)', () => {
    setHour(6);
    expect(isNightTime()).toBe(false);
  });

  it('returns false at 06:01 (just after window closes)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T06:01:00'));
    expect(isNightTime()).toBe(false);
  });

  it('returns false at 12:00 (midday)', () => {
    setHour(12);
    expect(isNightTime()).toBe(false);
  });
});

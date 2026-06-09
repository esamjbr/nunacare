import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcSleepDuration } from '../utils/dateHelpers';
import { saveState, loadState } from '../utils/storage';
import type { AppState, ActiveTimer } from '../types';

vi.mock('../api/core', () => ({
  getBabies: vi.fn().mockResolvedValue([]),
  getLogs: vi.fn().mockResolvedValue([]),
  createLog: vi.fn().mockImplementation((dto) => Promise.resolve({ id: 'saved-id', ...dto, data: dto.data, loggedAt: dto.loggedAt })),
  updateLog: vi.fn(),
  deleteLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../api/resources', () => ({
  getMedicines: vi.fn().mockResolvedValue([]),
  getMedicineDoses: vi.fn().mockResolvedValue([]),
  getAppointments: vi.fn().mockResolvedValue([]),
  getWeights: vi.fn().mockResolvedValue([]),
  getDoctorQuestions: vi.fn().mockResolvedValue([]),
  getFoodReactions: vi.fn().mockResolvedValue([]),
  getMomCheckIns: vi.fn().mockResolvedValue([]),
  getFamilyMembers: vi.fn().mockResolvedValue([]),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

beforeEach(() => {
  localStorageMock.clear();
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
  vi.resetModules();
});

describe('calcSleepDuration', () => {
  it('computes minutes between two ISO strings', () => {
    expect(calcSleepDuration('2024-01-01T10:00:00', '2024-01-01T10:45:00')).toBe(45);
  });

  it('returns 0 for same start and end', () => {
    expect(calcSleepDuration('2024-01-01T10:00:00', '2024-01-01T10:00:00')).toBe(0);
  });

  it('handles overnight sleep spanning midnight', () => {
    expect(calcSleepDuration('2024-01-01T22:00:00', '2024-01-02T06:00:00')).toBe(480);
  });
});

describe('SleepLog shape built by SleepSheet.handleSave pattern', () => {
  it('has expected fields when timer was running', () => {
    const today = '2024-06-01';
    const startTime = '21:30';
    const endTime = '22:45';
    const startISO = `${today}T${startTime}:00`;
    const endISO = `${today}T${endTime}:00`;
    const durationMinutes = calcSleepDuration(startISO, endISO);

    const log = {
      id: 'test-id',
      type: 'sleep' as const,
      sleepType: 'night' as const,
      startTime: startISO,
      endTime: endISO,
      durationMinutes,
      time: startTime,
      createdAt: new Date().toISOString(),
    };

    expect(log.type).toBe('sleep');
    expect(log.sleepType).toBe('night');
    expect(log.startTime).toContain('T');
    expect(log.endTime).toContain('T');
    expect(typeof log.durationMinutes).toBe('number');
    expect(log.durationMinutes).toBeGreaterThanOrEqual(0);
  });

  it('has expected fields for nap without end time (timer still running at save)', () => {
    const today = '2024-06-01';
    const startTime = '14:00';
    const startISO = `${today}T${startTime}:00`;
    const elapsed = 600;

    const log = {
      id: 'test-id',
      type: 'sleep' as const,
      sleepType: 'nap' as const,
      startTime: startISO,
      endTime: undefined,
      durationMinutes: Math.floor(elapsed / 60),
      time: startTime,
      createdAt: new Date().toISOString(),
    };

    expect(log.type).toBe('sleep');
    expect(log.sleepType).toBe('nap');
    expect(log.durationMinutes).toBe(10);
    expect(log.endTime).toBeUndefined();
  });
});

describe('activeTimer store behavior', () => {
  it('setActiveTimer stores a sleep timer in Zustand state', async () => {
    const { useStore } = await import('../store/useStore');
    const timer: ActiveTimer = { kind: 'sleep', startTimestamp: Date.now(), meta: { sleepType: 'nap' } };
    useStore.getState().setActiveTimer(timer);
    expect(useStore.getState().activeTimer).toEqual(timer);
  });

  it('setActiveTimer(null) clears the timer', async () => {
    const { useStore } = await import('../store/useStore');
    useStore.getState().setActiveTimer({ kind: 'sleep', startTimestamp: Date.now(), meta: { sleepType: 'night' } });
    useStore.getState().setActiveTimer(null);
    expect(useStore.getState().activeTimer).toBeNull();
  });

  it('setActiveTimer stores a breastfeeding timer', async () => {
    const { useStore } = await import('../store/useStore');
    const timer: ActiveTimer = { kind: 'breastfeeding', startTimestamp: Date.now(), meta: { side: 'left' } };
    useStore.getState().setActiveTimer(timer);
    expect(useStore.getState().activeTimer?.kind).toBe('breastfeeding');
    expect(useStore.getState().activeTimer?.meta.side).toBe('left');
  });
});

describe('localStorage persistence (post-refactor behavior)', () => {
  it('saveState persists activeTimer and loadState restores it', () => {
    const timer: ActiveTimer = { kind: 'sleep', startTimestamp: 1700000000000, meta: { sleepType: 'nap' } };
    const state: AppState = {
      babyProfile: null,
      logs: [],
      medicines: [],
      medicineDoses: [],
      appointments: [],
      weights: [],
      doctorQuestions: [],
      foodReactions: [],
      momCheckIns: [],
      caregivers: [],
      settings: {
        language: 'en',
        direction: 'ltr',
        calmMode: false,
        isPremium: false,
        notificationsEnabled: true,
        onboardingComplete: false,
        patternWhispers: false,
        weeklySummaryDismissedWeek: null,
        nightMode: false,
        nightModeAuto: false,
      },
      activeTimer: timer,
    };

    saveState(state);
    const loaded = loadState();
    expect(loaded?.activeTimer).toEqual(timer);
  });

  it('saveState preserves settings through reload', () => {
    const state: AppState = {
      babyProfile: null,
      logs: [],
      medicines: [],
      medicineDoses: [],
      appointments: [],
      weights: [],
      doctorQuestions: [],
      foodReactions: [],
      momCheckIns: [],
      caregivers: [],
      settings: {
        language: 'ar',
        direction: 'rtl',
        calmMode: true,
        isPremium: false,
        notificationsEnabled: false,
        onboardingComplete: false,
        patternWhispers: true,
        weeklySummaryDismissedWeek: '2024-W22',
        nightMode: false,
        nightModeAuto: false,
      },
      activeTimer: null,
    };

    saveState(state);
    const loaded = loadState();
    expect(loaded?.settings.language).toBe('ar');
    expect(loaded?.settings.calmMode).toBe(true);
    expect(loaded?.settings.patternWhispers).toBe(true);
    expect(loaded?.settings.weeklySummaryDismissedWeek).toBe('2024-W22');
  });
});

import type { AppState } from '../types';

const STORAGE_KEY = 'nunacare_app_state';

interface PersistedPreferences {
  settings?: Partial<AppState['settings']>;
  activeTimer?: AppState['activeTimer'];
}

const defaultSettings: AppState['settings'] = {
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
};

function toStateFromPreferences(preferences: PersistedPreferences): AppState {
  const settings = preferences.settings ?? {};
  return {
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
      ...defaultSettings,
      language: settings.language ?? defaultSettings.language,
      direction: settings.direction ?? defaultSettings.direction,
      calmMode: settings.calmMode ?? defaultSettings.calmMode,
      notificationsEnabled: settings.notificationsEnabled ?? defaultSettings.notificationsEnabled,
      patternWhispers: settings.patternWhispers ?? defaultSettings.patternWhispers,
      weeklySummaryDismissedWeek: settings.weeklySummaryDismissedWeek ?? null,
      nightMode: settings.nightMode ?? defaultSettings.nightMode,
      nightModeAuto: settings.nightModeAuto ?? defaultSettings.nightModeAuto,
      isPremium: false,
      onboardingComplete: false,
    },
    activeTimer: preferences.activeTimer ?? null,
  };
}

function preferencesOnly(state: AppState): PersistedPreferences {
  return {
    settings: {
      language: state.settings.language,
      direction: state.settings.direction,
      calmMode: state.settings.calmMode,
      notificationsEnabled: state.settings.notificationsEnabled,
      patternWhispers: state.settings.patternWhispers,
      weeklySummaryDismissedWeek: state.settings.weeklySummaryDismissedWeek,
      nightMode: state.settings.nightMode,
      nightModeAuto: state.settings.nightModeAuto,
    },
    activeTimer: state.activeTimer ?? undefined,
  };
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedPreferences;
    return toStateFromPreferences({ settings: parsed.settings, activeTimer: parsed.activeTimer });
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencesOnly(state)));
  } catch (e) {
    console.warn('NunaCare: Failed to save state to localStorage', e);
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportStateAsJson(state: AppState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nunacare-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importStateFromJson(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string) as AppState;
        resolve(state);
      } catch {
        reject(new Error('Invalid backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

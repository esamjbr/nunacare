// ─── Core Types ──────────────────────────────────────────────────────────────

export interface BabyProfile {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date string
  gender?: 'girl' | 'boy' | 'other';
  feedingType: 'breastfeeding' | 'bottle' | 'formula' | 'mixed';
  avatarUrl?: string;
}

export interface BaseLog {
  id: string;
  type: string;
  createdAt: string;
  time: string;
  notes?: string;
  createdByFamilyMemberId?: string;
  createdByName?: string;
}

export interface FeedingLog extends BaseLog {
  type: 'feeding';
  feedingType: 'breast' | 'bottle' | 'formula' | 'solid';
  amount?: number;
  side?: 'left' | 'right' | 'both';
  durationMinutes?: number;
}

export interface SleepLog extends BaseLog {
  type: 'sleep';
  sleepType: 'nap' | 'night';
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
}

export interface DiaperLog extends BaseLog {
  type: 'diaper';
  diaperType: 'wet' | 'dirty' | 'mixed';
  color?: string;
  texture?: string;
}

export interface WeightLog extends BaseLog {
  type: 'weight';
  value: number;
  unit: 'kg' | 'lb';
  date: string;
}

export interface NoteLog extends BaseLog {
  type: 'note';
  title?: string;
}

export type AnyLog = FeedingLog | SleepLog | DiaperLog | WeightLog | NoteLog;

// ─── Medicine ─────────────────────────────────────────────────────────────────

export interface Medicine {
  id: string;
  name: string;
  dose: string;
  frequency: string; // e.g. "Once daily", "Every 8 hours"
  time: string; // HH:mm
  startDate: string;
  endDate?: string;
  reminderEnabled: boolean;
  notes?: string;
}

export interface MedicineDose {
  id: string;
  medicineId: string;
  scheduledTime: string; // ISO
  status: 'upcoming' | 'taken' | 'missed';
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export type AppointmentType = 'pediatrician' | 'vaccine' | 'medicine' | 'weight-check' | 'other';

export interface Appointment {
  id: string;
  title: string;
  type: AppointmentType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
}

// ─── Growth / Weight ──────────────────────────────────────────────────────────

export interface WeightEntry {
  id: string;
  value: number;
  unit: 'kg' | 'lb';
  date: string; // YYYY-MM-DD
  notes?: string;
}

// ─── Doctor Questions ─────────────────────────────────────────────────────────

export interface DoctorQuestion {
  id: string;
  text: string;
  answered: boolean;
  appointmentId?: string;
  createdAt: string;
}

// ─── First Foods ──────────────────────────────────────────────────────────────

export interface FoodReaction {
  id: string;
  foodName: string;
  triedDate: string;
  liked: 'yes' | 'no' | 'neutral';
  rash: boolean;
  vomiting: boolean;
  constipation: boolean;
  notes?: string;
}

// ─── Mom Recovery ─────────────────────────────────────────────────────────────

export type MoodOption = 'calm' | 'tired' | 'overwhelmed' | 'sad' | 'in-pain' | 'need-support';

export interface MomCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodOption;
  painLevel?: number; // 0-10
  bleedingNote?: string;
  waterCups?: number;
  walkingMinutes?: number;
  notes?: string;
}

// ─── Family / Caregivers ──────────────────────────────────────────────────────

export type CaregiverRole = 'parent' | 'caregiver' | 'readonly';

export interface CaregiverPermissions {
  canAddLogs: boolean;
  canViewLogs: boolean;
  canManageMedicines: boolean;
  canExportReports: boolean;
}

export interface Caregiver {
  id: string;
  name: string;
  role: CaregiverRole;
  permissions: CaregiverPermissions;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export type AppLanguage = 'en' | 'ar';

export interface AppSettings {
  language: AppLanguage;
  direction: 'ltr' | 'rtl';
  calmMode: boolean;
  isPremium: boolean;
  notificationsEnabled: boolean;
  onboardingComplete: boolean;
  patternWhispers: boolean;
  weeklySummaryDismissedWeek: string | null;
  nightMode: boolean;
  nightModeAuto: boolean;
}

// ─── Active Timer ─────────────────────────────────────────────────────────────

export interface ActiveSleepTimer {
  startTimestamp: number;
  sleepType: 'nap' | 'night';
}

export type ActiveTimerKind = 'sleep' | 'breastfeeding';

export interface ActiveTimer {
  kind: ActiveTimerKind;
  startTimestamp: number;
  meta: {
    sleepType?: 'nap' | 'night';
    side?: 'left' | 'right' | 'both';
  };
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppState {
  babyProfile: BabyProfile | null;
  logs: AnyLog[];
  medicines: Medicine[];
  medicineDoses: MedicineDose[];
  appointments: Appointment[];
  weights: WeightEntry[];
  doctorQuestions: DoctorQuestion[];
  foodReactions: FoodReaction[];
  momCheckIns: MomCheckIn[];
  caregivers: Caregiver[];
  settings: AppSettings;
  activeTimer: ActiveTimer | null;
}

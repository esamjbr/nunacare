import { create } from 'zustand';
import * as coreApi from '../api/core';
import * as resourcesApi from '../api/resources';
import type {
  AppState,
  BabyProfile,
  AnyLog,
  Medicine,
  MedicineDose,
  Appointment,
  WeightEntry,
  DoctorQuestion,
  FoodReaction,
  MomCheckIn,
  Caregiver,
  AppSettings,
  AppointmentType,
  MoodOption,
  CaregiverRole,
  ActiveTimer,
} from '../types';
import { loadState, saveState, clearState } from '../utils/storage';
import { syncNightMode } from '../utils/nightMode';
import { defaultSeedData } from '../data/firstFoods';
import { generateId, nowISO } from '../utils/dateHelpers';
import type {
  BabyDto,
  BabyLogDto,
  MedicineDto,
  MedicineDoseDto,
  AppointmentDto,
  WeightEntryDto,
  DoctorQuestionDto,
  FoodReactionDto,
  MomCheckInDto,
  FamilyMemberDto,
} from '../types/coreApi';

// ─── Default State ─────────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
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

const defaultState: AppState = {
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
  settings: defaultSettings,
  activeTimer: null,
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface NunaCareStore extends AppState {
  coreLoading: boolean;
  coreLoaded: boolean;
  coreError: string | null;

  // Profile
  loadCoreData: () => Promise<void>;
  clearCoreData: () => void;
  setBabyProfile: (profile: BabyProfile) => Promise<void>;

  // Logs
  addLog: (log: AnyLog) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  updateLog: (id: string, updates: Partial<AnyLog>) => Promise<void>;

  // Medicine
  addMedicine: (med: Omit<Medicine, 'id'>) => Promise<void>;
  updateMedicine: (id: string, updates: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  addDose: (dose: Omit<MedicineDose, 'id'>) => Promise<void>;
  updateDoseStatus: (id: string, status: MedicineDose['status']) => Promise<void>;

  // Appointments
  addAppointment: (apt: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  // Weights
  addWeight: (entry: Omit<WeightEntry, 'id'>) => Promise<void>;
  deleteWeight: (id: string) => Promise<void>;

  // Doctor Questions
  addQuestion: (q: Omit<DoctorQuestion, 'id' | 'createdAt'>) => Promise<void>;
  toggleAnswered: (id: string) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;

  // Food Reactions
  addFoodReaction: (r: Omit<FoodReaction, 'id'>) => Promise<void>;
  updateFoodReaction: (id: string, updates: Partial<FoodReaction>) => Promise<void>;
  deleteFoodReaction: (id: string) => Promise<void>;

  // Mom Check-ins
  addMomCheckIn: (c: Omit<MomCheckIn, 'id'>) => Promise<void>;
  updateMomCheckIn: (id: string, updates: Partial<Omit<MomCheckIn, 'id'>>) => Promise<void>;

  // Caregivers
  addCaregiver: (c: Omit<Caregiver, 'id'>) => Promise<void>;
  updateCaregiver: (id: string, updates: Partial<Caregiver>) => Promise<void>;
  removeCaregiver: (id: string) => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Timer
  setActiveTimer: (timer: ActiveTimer | null) => void;

  // Data management
  resetAll: () => void;
  importState: (state: AppState) => void;
  initializeWithSeedData: () => void;
}

// ─── DTO → Domain Mappers ─────────────────────────────────────────────────────

function babyFromDto(dto: BabyDto): BabyProfile {
  return {
    id: dto.id,
    name: dto.name,
    dateOfBirth: dto.dateOfBirth,
    gender: dto.gender ?? undefined,
    feedingType: dto.feedingType ?? 'mixed',
  };
}

function backendType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function frontendType(type: string) {
  return type.toLowerCase();
}

function timeFromIso(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '00:00';
  return date.toTimeString().slice(0, 5);
}

function loggedAtFromLog(log: AnyLog) {
  if (log.type === 'sleep' && log.startTime) {
    return new Date(log.startTime).toISOString();
  }
  return new Date(log.createdAt).toISOString();
}

function logFromDto(dto: BabyLogDto): AnyLog {
  const data = dto.data as unknown as Partial<AnyLog>;
  return {
    ...data,
    id: dto.id,
    type: frontendType(dto.type),
    time: data.time ?? timeFromIso(dto.loggedAt),
    createdAt: data.createdAt ?? dto.loggedAt,
    createdByFamilyMemberId: dto.createdByFamilyMemberId ?? undefined,
    createdByName: dto.createdByName ?? undefined,
  } as AnyLog;
}

function medicineFromDto(dto: MedicineDto): Medicine {
  return {
    id: dto.id,
    name: dto.name,
    dose: dto.dose,
    frequency: dto.frequency ?? '',
    time: dto.time ?? '',
    startDate: dto.startDate ?? '',
    endDate: dto.endDate ?? undefined,
    reminderEnabled: dto.reminderEnabled,
    notes: dto.notes ?? undefined,
  };
}

// Backend uses 'scheduled'; frontend uses 'upcoming'
function doseStatusToFrontend(status: string): MedicineDose['status'] {
  if (status === 'scheduled') return 'upcoming';
  if (status === 'taken') return 'taken';
  return 'missed';
}

function doseStatusToBackend(status: MedicineDose['status']): string {
  return status === 'upcoming' ? 'scheduled' : status;
}

function doseFromDto(dto: MedicineDoseDto): MedicineDose {
  return {
    id: dto.id,
    medicineId: dto.medicineId,
    scheduledTime: dto.scheduledTime,
    status: doseStatusToFrontend(dto.status),
  };
}

function appointmentFromDto(dto: AppointmentDto): Appointment {
  return {
    id: dto.id,
    title: dto.title,
    type: (dto.type ?? 'other') as AppointmentType,
    date: dto.date,
    time: dto.time ?? '',
    notes: dto.notes ?? undefined,
  };
}

function weightEntryFromDto(dto: WeightEntryDto): WeightEntry {
  return {
    id: dto.id,
    value: dto.value,
    unit: dto.unit as 'kg' | 'lb',
    date: dto.date,
    notes: dto.notes ?? undefined,
  };
}

function doctorQuestionFromDto(dto: DoctorQuestionDto): DoctorQuestion {
  return {
    id: dto.id,
    text: dto.text,
    answered: dto.answered,
    appointmentId: dto.appointmentId ?? undefined,
    createdAt: dto.createdAt,
  };
}

function foodReactionFromDto(dto: FoodReactionDto): FoodReaction {
  return {
    id: dto.id,
    foodName: dto.foodName,
    triedDate: dto.triedDate,
    liked: dto.liked as 'yes' | 'no' | 'neutral',
    rash: dto.rash,
    vomiting: dto.vomiting,
    constipation: dto.constipation,
    notes: dto.notes ?? undefined,
  };
}

function momCheckInFromDto(dto: MomCheckInDto): MomCheckIn {
  return {
    id: dto.id,
    date: dto.date,
    mood: dto.mood as MoodOption,
    painLevel: dto.painLevel ?? undefined,
    bleedingNote: dto.bleedingNote ?? undefined,
    waterCups: dto.waterCups ?? undefined,
    walkingMinutes: dto.walkingMinutes ?? undefined,
    notes: dto.notes ?? undefined,
  };
}

function caregiverFromDto(dto: FamilyMemberDto): Caregiver {
  return {
    id: dto.id,
    name: dto.name,
    role: dto.role as CaregiverRole,
    permissions: {
      canAddLogs: dto.canAddLogs,
      canViewLogs: dto.canViewLogs,
      canManageMedicines: dto.canManageMedicines,
      canExportReports: dto.canExportReports,
    },
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function persist(state: AppState) {
  saveState(state);
}

const savedState = loadState();
const initial: AppState = savedState ?? defaultState;

const backendLogTypes = new Set(['feeding', 'sleep', 'diaper', 'note']);

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useStore = create<NunaCareStore>((set, get) => ({
  ...initial,
  coreLoading: false,
  coreLoaded: false,
  coreError: null,

  // ── Profile ────────────────────────────────────────────────────────────────

  loadCoreData: async () => {
    if (get().coreLoading) return;
    set({ coreLoading: true, coreError: null });
    try {
      const babies = await coreApi.getBabies();
      const babyProfile = babies[0] ? babyFromDto(babies[0]) : null;
      const babyId = babyProfile?.id;

      const [
        rawLogs,
        rawMedicines,
        rawDoses,
        rawAppointments,
        rawWeights,
        rawQuestions,
        rawReactions,
        rawCheckIns,
        rawMembers,
      ] = await Promise.all([
        babyId ? coreApi.getLogs({ babyId }) : Promise.resolve([]),
        resourcesApi.getMedicines(babyId),
        resourcesApi.getMedicineDoses(),
        resourcesApi.getAppointments(babyId),
        resourcesApi.getWeights(babyId),
        resourcesApi.getDoctorQuestions(babyId),
        resourcesApi.getFoodReactions(babyId),
        resourcesApi.getMomCheckIns(),
        resourcesApi.getFamilyMembers(),
      ]);

      const settings = { ...get().settings, onboardingComplete: !!babyProfile };
      const nextState = {
        babyProfile,
        logs: rawLogs.map(logFromDto),
        medicines: rawMedicines.map(medicineFromDto),
        medicineDoses: rawDoses.map(doseFromDto),
        appointments: rawAppointments.map(appointmentFromDto),
        weights: rawWeights.map(weightEntryFromDto),
        doctorQuestions: rawQuestions.map(doctorQuestionFromDto),
        foodReactions: rawReactions.map(foodReactionFromDto),
        momCheckIns: rawCheckIns.map(momCheckInFromDto),
        caregivers: rawMembers.map(caregiverFromDto),
        settings,
        coreLoaded: true,
        coreLoading: false,
        coreError: null,
      };

      set(nextState);
      persist({ ...get(), ...nextState });
    } catch (error) {
      set({
        coreLoading: false,
        coreError: error instanceof Error ? error.message : 'Unable to load data.',
      });
    }
  },

  clearCoreData: () => {
    const settings = { ...get().settings, onboardingComplete: false };
    const cleared = {
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
      coreLoaded: false,
      coreLoading: false,
      coreError: null,
      settings,
    };
    set(cleared);
    persist({ ...get(), ...cleared });
  },

  setBabyProfile: async (profile) => {
    const saved = await coreApi.createBaby({
      name: profile.name,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      feedingType: profile.feedingType,
    });
    const babyProfile = babyFromDto(saved);
    const settings = { ...get().settings, onboardingComplete: true };
    set({ babyProfile, settings, coreLoaded: true, coreError: null });
    persist({ ...get(), babyProfile, settings });
  },

  // ── Logs ───────────────────────────────────────────────────────────────────

  addLog: async (log) => {
    const babyProfile = get().babyProfile;
    let nextLog = log;

    if (babyProfile && backendLogTypes.has(log.type)) {
      const saved = await coreApi.createLog({
        babyId: babyProfile.id,
        type: backendType(log.type),
        data: log,
        loggedAt: loggedAtFromLog(log),
      });
      nextLog = logFromDto(saved);
    }

    const logs = [nextLog, ...get().logs];
    set({ logs });
    persist({ ...get(), logs });
  },

  deleteLog: async (id) => {
    const existing = get().logs.find((l) => l.id === id);
    if (existing && backendLogTypes.has(existing.type)) {
      await coreApi.deleteLog(id);
    }
    const logs = get().logs.filter((l) => l.id !== id);
    set({ logs });
    persist({ ...get(), logs });
  },

  updateLog: async (id, updates) => {
    const existing = get().logs.find((l) => l.id === id);
    if (existing && backendLogTypes.has(existing.type)) {
      const updated = { ...existing, ...updates } as AnyLog;
      const saved = await coreApi.updateLog(id, {
        type: backendType(updated.type),
        data: updated,
        loggedAt: loggedAtFromLog(updated),
      });
      const savedLog = logFromDto(saved);
      const logs = get().logs.map((l) => (l.id === id ? savedLog : l)) as AnyLog[];
      set({ logs });
      persist({ ...get(), logs });
      return;
    }
    const logs = get().logs.map((l) => (l.id === id ? { ...l, ...updates } : l)) as AnyLog[];
    set({ logs });
    persist({ ...get(), logs });
  },

  // ── Medicine ───────────────────────────────────────────────────────────────

  addMedicine: async (med) => {
    const babyId = get().babyProfile?.id;
    if (!babyId) {
      const m: Medicine = { ...med, id: generateId() };
      const medicines = [...get().medicines, m];
      set({ medicines });
      persist({ ...get(), medicines });
      return;
    }
    const dto = await resourcesApi.createMedicine({
      babyId,
      name: med.name,
      dose: med.dose,
      frequency: med.frequency || undefined,
      time: med.time || undefined,
      startDate: med.startDate || undefined,
      endDate: med.endDate || undefined,
      reminderEnabled: med.reminderEnabled,
      notes: med.notes,
    });
    const m = medicineFromDto(dto);
    const medicines = [...get().medicines, m];
    set({ medicines });
    persist({ ...get(), medicines });
  },

  updateMedicine: async (id, updates) => {
    const dto = await resourcesApi.updateMedicine(id, {
      name: updates.name,
      dose: updates.dose,
      frequency: updates.frequency,
      time: updates.time,
      startDate: updates.startDate,
      endDate: updates.endDate,
      reminderEnabled: updates.reminderEnabled,
      notes: updates.notes,
    });
    const updated = medicineFromDto(dto);
    const medicines = get().medicines.map((m) => (m.id === id ? updated : m));
    set({ medicines });
    persist({ ...get(), medicines });
  },

  deleteMedicine: async (id) => {
    await resourcesApi.deleteMedicine(id);
    const medicines = get().medicines.filter((m) => m.id !== id);
    set({ medicines });
    persist({ ...get(), medicines });
  },

  addDose: async (dose) => {
    const dto = await resourcesApi.createMedicineDose({
      medicineId: dose.medicineId,
      scheduledTime: dose.scheduledTime,
      status: doseStatusToBackend(dose.status),
    });
    const d = doseFromDto(dto);
    const medicineDoses = [...get().medicineDoses, d];
    set({ medicineDoses });
    persist({ ...get(), medicineDoses });
  },

  updateDoseStatus: async (id, status) => {
    const dto = await resourcesApi.updateMedicineDose(id, {
      status: doseStatusToBackend(status),
    });
    const updated = doseFromDto(dto);
    const medicineDoses = get().medicineDoses.map((d) => (d.id === id ? updated : d));
    set({ medicineDoses });
    persist({ ...get(), medicineDoses });
  },

  // ── Appointments ───────────────────────────────────────────────────────────

  addAppointment: async (apt) => {
    const babyId = get().babyProfile?.id;
    if (!babyId) {
      const a: Appointment = { ...apt, id: generateId() };
      const appointments = [...get().appointments, a];
      set({ appointments });
      persist({ ...get(), appointments });
      return;
    }
    const dto = await resourcesApi.createAppointment({
      babyId,
      title: apt.title,
      type: apt.type,
      date: apt.date,
      time: apt.time || undefined,
      notes: apt.notes,
    });
    const a = appointmentFromDto(dto);
    const appointments = [...get().appointments, a];
    set({ appointments });
    persist({ ...get(), appointments });
  },

  updateAppointment: async (id, updates) => {
    const dto = await resourcesApi.updateAppointment(id, {
      title: updates.title,
      type: updates.type,
      date: updates.date,
      time: updates.time,
      notes: updates.notes,
    });
    const updated = appointmentFromDto(dto);
    const appointments = get().appointments.map((a) => (a.id === id ? updated : a));
    set({ appointments });
    persist({ ...get(), appointments });
  },

  deleteAppointment: async (id) => {
    await resourcesApi.deleteAppointment(id);
    const appointments = get().appointments.filter((a) => a.id !== id);
    set({ appointments });
    persist({ ...get(), appointments });
  },

  // ── Weights ────────────────────────────────────────────────────────────────

  addWeight: async (entry) => {
    const babyId = get().babyProfile?.id;
    if (!babyId) {
      const w: WeightEntry = { ...entry, id: generateId() };
      const weights = [w, ...get().weights];
      set({ weights });
      persist({ ...get(), weights });
      return;
    }
    const dto = await resourcesApi.createWeight({
      babyId,
      value: entry.value,
      unit: entry.unit,
      date: entry.date,
      notes: entry.notes,
    });
    const w = weightEntryFromDto(dto);
    const weights = [w, ...get().weights];
    set({ weights });
    persist({ ...get(), weights });
  },

  deleteWeight: async (id) => {
    await resourcesApi.deleteWeight(id);
    const weights = get().weights.filter((w) => w.id !== id);
    set({ weights });
    persist({ ...get(), weights });
  },

  // ── Doctor Questions ───────────────────────────────────────────────────────

  addQuestion: async (q) => {
    const babyId = get().babyProfile?.id;
    if (!babyId) {
      const question: DoctorQuestion = { ...q, id: generateId(), createdAt: nowISO() };
      const doctorQuestions = [...get().doctorQuestions, question];
      set({ doctorQuestions });
      persist({ ...get(), doctorQuestions });
      return;
    }
    const dto = await resourcesApi.createDoctorQuestion({
      babyId,
      text: q.text,
      appointmentId: q.appointmentId,
    });
    const question = doctorQuestionFromDto(dto);
    const doctorQuestions = [...get().doctorQuestions, question];
    set({ doctorQuestions });
    persist({ ...get(), doctorQuestions });
  },

  toggleAnswered: async (id) => {
    const existing = get().doctorQuestions.find((q) => q.id === id);
    if (!existing) return;
    const dto = await resourcesApi.updateDoctorQuestion(id, {
      answered: !existing.answered,
    });
    const updated = doctorQuestionFromDto(dto);
    const doctorQuestions = get().doctorQuestions.map((q) => (q.id === id ? updated : q));
    set({ doctorQuestions });
    persist({ ...get(), doctorQuestions });
  },

  deleteQuestion: async (id) => {
    await resourcesApi.deleteDoctorQuestion(id);
    const doctorQuestions = get().doctorQuestions.filter((q) => q.id !== id);
    set({ doctorQuestions });
    persist({ ...get(), doctorQuestions });
  },

  // ── Food Reactions ─────────────────────────────────────────────────────────

  addFoodReaction: async (r) => {
    const babyId = get().babyProfile?.id;
    if (!babyId) {
      const reaction: FoodReaction = { ...r, id: generateId() };
      const foodReactions = [...get().foodReactions, reaction];
      set({ foodReactions });
      persist({ ...get(), foodReactions });
      return;
    }
    const dto = await resourcesApi.createFoodReaction({
      babyId,
      foodName: r.foodName,
      triedDate: r.triedDate,
      liked: r.liked,
      rash: r.rash,
      vomiting: r.vomiting,
      constipation: r.constipation,
      notes: r.notes,
    });
    const reaction = foodReactionFromDto(dto);
    const foodReactions = [...get().foodReactions, reaction];
    set({ foodReactions });
    persist({ ...get(), foodReactions });
  },

  updateFoodReaction: async (id, updates) => {
    const dto = await resourcesApi.updateFoodReaction(id, {
      foodName: updates.foodName,
      triedDate: updates.triedDate,
      liked: updates.liked,
      rash: updates.rash,
      vomiting: updates.vomiting,
      constipation: updates.constipation,
      notes: updates.notes,
    });
    const updated = foodReactionFromDto(dto);
    const foodReactions = get().foodReactions.map((r) => (r.id === id ? updated : r));
    set({ foodReactions });
    persist({ ...get(), foodReactions });
  },

  deleteFoodReaction: async (id) => {
    await resourcesApi.deleteFoodReaction(id);
    const foodReactions = get().foodReactions.filter((r) => r.id !== id);
    set({ foodReactions });
    persist({ ...get(), foodReactions });
  },

  // ── Mom Check-ins ──────────────────────────────────────────────────────────

  addMomCheckIn: async (c) => {
    const dto = await resourcesApi.createMomCheckIn({
      date: c.date,
      mood: c.mood,
      painLevel: c.painLevel,
      bleedingNote: c.bleedingNote,
      waterCups: c.waterCups,
      walkingMinutes: c.walkingMinutes,
      notes: c.notes,
    });
    const checkIn = momCheckInFromDto(dto);
    // POST now upserts server-side; replace existing entry for same date if present
    const momCheckIns = [checkIn, ...get().momCheckIns.filter((ci) => ci.id !== checkIn.id)];
    set({ momCheckIns });
    persist({ ...get(), momCheckIns });
  },

  updateMomCheckIn: async (id, updates) => {
    const dto = await resourcesApi.updateMomCheckIn(id, {
      date: updates.date,
      mood: updates.mood,
      painLevel: updates.painLevel,
      bleedingNote: updates.bleedingNote,
      waterCups: updates.waterCups,
      walkingMinutes: updates.walkingMinutes,
      notes: updates.notes,
    });
    const updated = momCheckInFromDto(dto);
    const momCheckIns = get().momCheckIns.map((ci) => (ci.id === id ? updated : ci));
    set({ momCheckIns });
    persist({ ...get(), momCheckIns });
  },

  // ── Caregivers ─────────────────────────────────────────────────────────────

  addCaregiver: async (c) => {
    const dto = await resourcesApi.createFamilyMember({
      name: c.name,
      role: c.role,
      canAddLogs: c.permissions.canAddLogs,
      canViewLogs: c.permissions.canViewLogs,
      canManageMedicines: c.permissions.canManageMedicines,
      canExportReports: c.permissions.canExportReports,
    });
    const caregiver = caregiverFromDto(dto);
    const caregivers = [...get().caregivers, caregiver];
    set({ caregivers });
    persist({ ...get(), caregivers });
  },

  updateCaregiver: async (id, updates) => {
    const existing = get().caregivers.find((c) => c.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updates };
    const dto = await resourcesApi.updateFamilyMember(id, {
      name: updates.name,
      role: updates.role,
      canAddLogs: updates.permissions?.canAddLogs,
      canViewLogs: updates.permissions?.canViewLogs,
      canManageMedicines: updates.permissions?.canManageMedicines,
      canExportReports: updates.permissions?.canExportReports,
    });
    const updated = caregiverFromDto(dto);
    const caregivers = get().caregivers.map((c) => (c.id === id ? updated : c));
    set({ caregivers });
    persist({ ...get(), caregivers });
    void merged;
  },

  removeCaregiver: async (id) => {
    await resourcesApi.deleteFamilyMember(id);
    const caregivers = get().caregivers.filter((c) => c.id !== id);
    set({ caregivers });
    persist({ ...get(), caregivers });
  },

  // ── Settings ───────────────────────────────────────────────────────────────

  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates };
    set({ settings });
    document.documentElement.dir = settings.direction;
    document.documentElement.lang = settings.language;
    syncNightMode(settings);
    persist({ ...get(), settings });
  },

  // ── Timer ──────────────────────────────────────────────────────────────────

  setActiveTimer: (timer: ActiveTimer | null) => {
    set({ activeTimer: timer });
    persist({ ...get(), activeTimer: timer });
  },

  // ── Data management ────────────────────────────────────────────────────────

  resetAll: () => {
    clearState();
    set(defaultState);
  },

  importState: (state) => {
    set(state);
    saveState(state);
  },

  initializeWithSeedData: () => {
    const { medicines, appointments } = defaultSeedData;
    const meds = medicines.map((m) => ({ ...m, id: m.id }));
    const apts = appointments.map((a) => ({ ...a, id: a.id }));
    const newState = { ...get(), medicines: meds, appointments: apts };
    set(newState);
    persist(newState);
  },
}));

// Apply language/direction/night-mode on startup
const storedSettings = initial.settings;
if (storedSettings) {
  document.documentElement.dir = storedSettings.direction;
  document.documentElement.lang = storedSettings.language;
  syncNightMode(storedSettings);
}

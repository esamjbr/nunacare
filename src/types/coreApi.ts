import type { AnyLog, BabyProfile } from './index';

export interface BabyDto {
  id: string;
  name: string;
  dateOfBirth: string;
  gender?: BabyProfile['gender'] | null;
  feedingType?: BabyProfile['feedingType'] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBabyRequest {
  name: string;
  dateOfBirth: string;
  gender?: BabyProfile['gender'];
  feedingType?: BabyProfile['feedingType'];
}

export interface UpdateBabyRequest {
  name?: string;
  dateOfBirth?: string;
  gender?: BabyProfile['gender'];
  feedingType?: BabyProfile['feedingType'];
}

export interface BabyLogDto {
  id: string;
  babyId: string;
  type: string;
  data: Record<string, unknown>;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
  createdByFamilyMemberId?: string | null;
  createdByName?: string | null;
}

export interface CreateBabyLogRequest {
  babyId: string;
  type: string;
  data: AnyLog;
  loggedAt?: string;
}

export interface UpdateBabyLogRequest {
  type?: string;
  data?: Partial<AnyLog>;
  loggedAt?: string;
}

// ─── Medicine ─────────────────────────────────────────────────────────────────

export interface MedicineDto {
  id: string;
  babyId: string;
  name: string;
  dose: string;
  frequency?: string | null;
  time?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  reminderEnabled: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineRequest {
  babyId: string;
  name: string;
  dose: string;
  frequency?: string;
  time?: string;
  startDate?: string;
  endDate?: string;
  reminderEnabled: boolean;
  notes?: string;
}

export interface UpdateMedicineRequest {
  name?: string;
  dose?: string;
  frequency?: string | null;
  time?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  reminderEnabled?: boolean;
  notes?: string | null;
}

// ─── MedicineDose ─────────────────────────────────────────────────────────────

export interface MedicineDoseDto {
  id: string;
  medicineId: string;
  babyId: string;
  scheduledTime: string;
  status: string;
  takenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineDoseRequest {
  medicineId: string;
  scheduledTime: string;
  status: string;
}

export interface UpdateMedicineDoseRequest {
  scheduledTime?: string;
  status?: string;
  takenAt?: string | null;
}

// ─── Appointment ──────────────────────────────────────────────────────────────

export interface AppointmentDto {
  id: string;
  babyId: string;
  title: string;
  type?: string | null;
  date: string;
  time?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  babyId: string;
  title: string;
  type?: string;
  date: string;
  time?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  title?: string;
  type?: string | null;
  date?: string;
  time?: string | null;
  notes?: string | null;
}

// ─── WeightEntry ──────────────────────────────────────────────────────────────

export interface WeightEntryDto {
  id: string;
  babyId: string;
  value: number;
  unit: string;
  date: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWeightEntryRequest {
  babyId: string;
  value: number;
  unit: string;
  date: string;
  notes?: string;
}

// ─── DoctorQuestion ───────────────────────────────────────────────────────────

export interface DoctorQuestionDto {
  id: string;
  babyId: string;
  text: string;
  answered: boolean;
  appointmentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoctorQuestionRequest {
  babyId: string;
  text: string;
  appointmentId?: string;
}

export interface UpdateDoctorQuestionRequest {
  text?: string;
  answered?: boolean;
  appointmentId?: string | null;
}

// ─── FoodReaction ─────────────────────────────────────────────────────────────

export interface FoodReactionDto {
  id: string;
  babyId: string;
  foodName: string;
  triedDate: string;
  liked: string;
  rash: boolean;
  vomiting: boolean;
  constipation: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFoodReactionRequest {
  babyId: string;
  foodName: string;
  triedDate: string;
  liked: string;
  rash: boolean;
  vomiting: boolean;
  constipation: boolean;
  notes?: string;
}

export interface UpdateFoodReactionRequest {
  foodName?: string;
  triedDate?: string;
  liked?: string;
  rash?: boolean;
  vomiting?: boolean;
  constipation?: boolean;
  notes?: string | null;
}

// ─── MomCheckIn ───────────────────────────────────────────────────────────────

export interface MomCheckInDto {
  id: string;
  date: string;
  mood: string;
  painLevel?: number | null;
  bleedingNote?: string | null;
  waterCups?: number | null;
  walkingMinutes?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMomCheckInRequest {
  date: string;
  mood: string;
  painLevel?: number;
  bleedingNote?: string;
  waterCups?: number;
  walkingMinutes?: number;
  notes?: string;
}

export interface UpdateMomCheckInRequest {
  date?: string;
  mood?: string;
  painLevel?: number | null;
  bleedingNote?: string | null;
  waterCups?: number | null;
  walkingMinutes?: number | null;
  notes?: string | null;
}

// ─── FamilyMember ─────────────────────────────────────────────────────────────

export interface FamilyMemberDto {
  id: string;
  name: string;
  role: string;
  canAddLogs: boolean;
  canViewLogs: boolean;
  canManageMedicines: boolean;
  canExportReports: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFamilyMemberRequest {
  name: string;
  role: string;
  canAddLogs: boolean;
  canViewLogs: boolean;
  canManageMedicines: boolean;
  canExportReports: boolean;
}

export interface UpdateFamilyMemberRequest {
  name?: string;
  role?: string;
  canAddLogs?: boolean;
  canViewLogs?: boolean;
  canManageMedicines?: boolean;
  canExportReports?: boolean;
}

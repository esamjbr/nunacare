import { apiRequest } from './client';
import type {
  MedicineDto,
  CreateMedicineRequest,
  UpdateMedicineRequest,
  MedicineDoseDto,
  CreateMedicineDoseRequest,
  UpdateMedicineDoseRequest,
  AppointmentDto,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  WeightEntryDto,
  CreateWeightEntryRequest,
  DoctorQuestionDto,
  CreateDoctorQuestionRequest,
  UpdateDoctorQuestionRequest,
  FoodReactionDto,
  CreateFoodReactionRequest,
  UpdateFoodReactionRequest,
  MomCheckInDto,
  CreateMomCheckInRequest,
  UpdateMomCheckInRequest,
  FamilyMemberDto,
  CreateFamilyMemberRequest,
  UpdateFamilyMemberRequest,
} from '../types/coreApi';

// ─── Medicines ────────────────────────────────────────────────────────────────

export function getMedicines(babyId?: string) {
  const q = babyId ? `?babyId=${babyId}` : '';
  return apiRequest<MedicineDto[]>(`/api/medicines${q}`);
}

export function createMedicine(req: CreateMedicineRequest) {
  return apiRequest<MedicineDto>('/api/medicines', { method: 'POST', body: req });
}

export function updateMedicine(id: string, req: UpdateMedicineRequest) {
  return apiRequest<MedicineDto>(`/api/medicines/${id}`, { method: 'PATCH', body: req });
}

export function deleteMedicine(id: string) {
  return apiRequest<void>(`/api/medicines/${id}`, { method: 'DELETE' });
}

// ─── Medicine Doses ───────────────────────────────────────────────────────────

export function getMedicineDoses(medicineId?: string) {
  const q = medicineId ? `?medicineId=${medicineId}` : '';
  return apiRequest<MedicineDoseDto[]>(`/api/medicine-doses${q}`);
}

export function createMedicineDose(req: CreateMedicineDoseRequest) {
  return apiRequest<MedicineDoseDto>('/api/medicine-doses', { method: 'POST', body: req });
}

export function updateMedicineDose(id: string, req: UpdateMedicineDoseRequest) {
  return apiRequest<MedicineDoseDto>(`/api/medicine-doses/${id}`, { method: 'PATCH', body: req });
}

export function deleteMedicineDose(id: string) {
  return apiRequest<void>(`/api/medicine-doses/${id}`, { method: 'DELETE' });
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export function getAppointments(babyId?: string) {
  const q = babyId ? `?babyId=${babyId}` : '';
  return apiRequest<AppointmentDto[]>(`/api/appointments${q}`);
}

export function createAppointment(req: CreateAppointmentRequest) {
  return apiRequest<AppointmentDto>('/api/appointments', { method: 'POST', body: req });
}

export function updateAppointment(id: string, req: UpdateAppointmentRequest) {
  return apiRequest<AppointmentDto>(`/api/appointments/${id}`, { method: 'PATCH', body: req });
}

export function deleteAppointment(id: string) {
  return apiRequest<void>(`/api/appointments/${id}`, { method: 'DELETE' });
}

// ─── Weights ──────────────────────────────────────────────────────────────────

export function getWeights(babyId?: string) {
  const q = babyId ? `?babyId=${babyId}` : '';
  return apiRequest<WeightEntryDto[]>(`/api/weights${q}`);
}

export function createWeight(req: CreateWeightEntryRequest) {
  return apiRequest<WeightEntryDto>('/api/weights', { method: 'POST', body: req });
}

export function deleteWeight(id: string) {
  return apiRequest<void>(`/api/weights/${id}`, { method: 'DELETE' });
}

// ─── Doctor Questions ─────────────────────────────────────────────────────────

export function getDoctorQuestions(babyId?: string) {
  const q = babyId ? `?babyId=${babyId}` : '';
  return apiRequest<DoctorQuestionDto[]>(`/api/doctor-questions${q}`);
}

export function createDoctorQuestion(req: CreateDoctorQuestionRequest) {
  return apiRequest<DoctorQuestionDto>('/api/doctor-questions', { method: 'POST', body: req });
}

export function updateDoctorQuestion(id: string, req: UpdateDoctorQuestionRequest) {
  return apiRequest<DoctorQuestionDto>(`/api/doctor-questions/${id}`, { method: 'PATCH', body: req });
}

export function deleteDoctorQuestion(id: string) {
  return apiRequest<void>(`/api/doctor-questions/${id}`, { method: 'DELETE' });
}

// ─── Food Reactions ───────────────────────────────────────────────────────────

export function getFoodReactions(babyId?: string) {
  const q = babyId ? `?babyId=${babyId}` : '';
  return apiRequest<FoodReactionDto[]>(`/api/food-reactions${q}`);
}

export function createFoodReaction(req: CreateFoodReactionRequest) {
  return apiRequest<FoodReactionDto>('/api/food-reactions', { method: 'POST', body: req });
}

export function updateFoodReaction(id: string, req: UpdateFoodReactionRequest) {
  return apiRequest<FoodReactionDto>(`/api/food-reactions/${id}`, { method: 'PATCH', body: req });
}

export function deleteFoodReaction(id: string) {
  return apiRequest<void>(`/api/food-reactions/${id}`, { method: 'DELETE' });
}

// ─── Mom Check-ins ────────────────────────────────────────────────────────────

export function getMomCheckIns() {
  return apiRequest<MomCheckInDto[]>('/api/mom-checkins');
}

export function createMomCheckIn(req: CreateMomCheckInRequest) {
  return apiRequest<MomCheckInDto>('/api/mom-checkins', { method: 'POST', body: req });
}

export function updateMomCheckIn(id: string, req: UpdateMomCheckInRequest) {
  return apiRequest<MomCheckInDto>(`/api/mom-checkins/${id}`, { method: 'PATCH', body: req });
}

// ─── Family Members ───────────────────────────────────────────────────────────

export function getFamilyMembers() {
  return apiRequest<FamilyMemberDto[]>('/api/family-members');
}

export function createFamilyMember(req: CreateFamilyMemberRequest) {
  return apiRequest<FamilyMemberDto>('/api/family-members', { method: 'POST', body: req });
}

export function updateFamilyMember(id: string, req: UpdateFamilyMemberRequest) {
  return apiRequest<FamilyMemberDto>(`/api/family-members/${id}`, { method: 'PATCH', body: req });
}

export function deleteFamilyMember(id: string) {
  return apiRequest<void>(`/api/family-members/${id}`, { method: 'DELETE' });
}

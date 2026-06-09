import { apiRequest } from './client';
import type {
  BabyDto,
  BabyLogDto,
  CreateBabyLogRequest,
  CreateBabyRequest,
  UpdateBabyLogRequest,
  UpdateBabyRequest,
} from '../types/coreApi';

export function getBabies() {
  return apiRequest<BabyDto[]>('/api/babies');
}

export function createBaby(request: CreateBabyRequest) {
  return apiRequest<BabyDto>('/api/babies', {
    method: 'POST',
    body: request,
  });
}

export function updateBaby(id: string, request: UpdateBabyRequest) {
  return apiRequest<BabyDto>(`/api/babies/${id}`, {
    method: 'PATCH',
    body: request,
  });
}

export function deleteBaby(id: string) {
  return apiRequest<void>(`/api/babies/${id}`, {
    method: 'DELETE',
  });
}

interface GetLogsParams {
  babyId?: string;
  type?: string;
  from?: string;
  to?: string;
}

export function getLogs(params: GetLogsParams = {}) {
  const search = new URLSearchParams();
  if (params.babyId) search.set('babyId', params.babyId);
  if (params.type) search.set('type', params.type);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);

  const query = search.toString();
  return apiRequest<BabyLogDto[]>(`/api/logs${query ? `?${query}` : ''}`);
}

export function createLog(request: CreateBabyLogRequest) {
  return apiRequest<BabyLogDto>('/api/logs', {
    method: 'POST',
    body: request,
  });
}

export function updateLog(id: string, request: UpdateBabyLogRequest) {
  return apiRequest<BabyLogDto>(`/api/logs/${id}`, {
    method: 'PATCH',
    body: request,
  });
}

export function deleteLog(id: string) {
  return apiRequest<void>(`/api/logs/${id}`, {
    method: 'DELETE',
  });
}

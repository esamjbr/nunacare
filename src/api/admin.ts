import { apiRequest } from './client';
import type {
  CreateCustomerRequest,
  CreateCustomerResponse,
  CustomerDetail,
  CustomerSummary,
  ResetPasswordResponse,
  UpdateCustomerRequest,
} from '../types/auth';

export function getCustomers() {
  return apiRequest<CustomerSummary[]>('/api/admin/customers');
}

export function createCustomer(request: CreateCustomerRequest) {
  return apiRequest<CreateCustomerResponse>('/api/admin/customers', {
    method: 'POST',
    body: request,
  });
}

export function getCustomer(id: string) {
  return apiRequest<CustomerDetail>(`/api/admin/customers/${id}`);
}

export function updateCustomer(id: string, request: UpdateCustomerRequest) {
  return apiRequest<CustomerDetail>(`/api/admin/customers/${id}`, {
    method: 'PATCH',
    body: request,
  });
}

export function resetCustomerPassword(id: string) {
  return apiRequest<ResetPasswordResponse>(`/api/admin/customers/${id}/reset-password`, {
    method: 'POST',
  });
}

export function activateCustomer(id: string) {
  return apiRequest<CustomerSummary>(`/api/admin/customers/${id}/activate`, {
    method: 'POST',
  });
}

export function deactivateCustomer(id: string) {
  return apiRequest<CustomerSummary>(`/api/admin/customers/${id}/deactivate`, {
    method: 'POST',
  });
}

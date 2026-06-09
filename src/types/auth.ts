export type UserRole = 'Admin' | 'Customer';
export type AccessType = 'Trial' | 'Lifetime' | 'Monthly' | 'Yearly';

export interface AuthUser {
  id: string;
  username: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  accessType: AccessType;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface ApiErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

export interface CustomerSummary {
  id: string;
  username: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  accessType: AccessType;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface CustomerDetail extends CustomerSummary {
  familyId?: string | null;
  familyName?: string | null;
}

export interface CreateCustomerRequest {
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  accessType?: AccessType;
  expiresAt?: string | null;
  familyName?: string;
}

export interface CreateCustomerResponse {
  customer: CustomerDetail;
  username: string;
  temporaryPassword: string;
}

export interface UpdateCustomerRequest {
  fullName?: string | null;
  phoneNumber?: string | null;
  accessType?: AccessType;
  expiresAt?: string | null;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
}

import { create } from 'zustand';
import type { AuthUser, UserRole } from '../types/auth';

const AUTH_STORAGE_KEY = 'nunacare_auth_state';

interface StoredAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  mustChangePassword: boolean;
}

interface AuthStore extends StoredAuthState {
  setAuth: (state: StoredAuthState) => void;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
}

function loadAuth(): StoredAuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return emptyAuthState;
    const parsed = JSON.parse(raw) as StoredAuthState;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
      role: parsed.role ?? null,
      mustChangePassword: parsed.mustChangePassword ?? parsed.user?.mustChangePassword ?? false,
    };
  } catch {
    return emptyAuthState;
  }
}

function saveAuth(state: StoredAuthState) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

const emptyAuthState: StoredAuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  role: null,
  mustChangePassword: false,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...loadAuth(),

  setAuth: (state) => {
    saveAuth(state);
    set(state);
  },

  updateUser: (user) => {
    const next = {
      accessToken: get().accessToken,
      refreshToken: get().refreshToken,
      user,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
    saveAuth(next);
    set(next);
  },

  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    set(emptyAuthState);
  },
}));

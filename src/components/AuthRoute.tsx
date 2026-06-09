import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { PrimaryButton } from './ui';

interface AuthRouteProps {
  children: ReactNode;
  roles?: Array<'Admin' | 'Customer'>;
}

export function isAccessExpired(expiresAt?: string | null) {
  return !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
}

export function AuthRoute({ children, roles }: AuthRouteProps) {
  const location = useLocation();
  const { accessToken, user, role, mustChangePassword } = useAuthStore();

  if (!accessToken || !user || !role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user.isActive || isAccessExpired(user.expiresAt)) {
    return <RenewAccessScreen />;
  }

  if (role === 'Admin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/customers" replace />;
  }

  if (role === 'Customer' && mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to={role === 'Admin' ? '/admin/customers' : '/home'} replace />;
  }

  return <>{children}</>;
}

export function PublicAuthRoute({ children }: { children: ReactNode }) {
  const { accessToken, role, mustChangePassword, user } = useAuthStore();

  if (accessToken && role === 'Admin') {
    return <Navigate to="/admin/customers" replace />;
  }

  if (accessToken && role === 'Customer') {
    if (!user?.isActive || isAccessExpired(user.expiresAt)) {
      return <RenewAccessScreen />;
    }
    return <Navigate to={mustChangePassword ? '/change-password' : '/home'} replace />;
  }

  return <>{children}</>;
}

function RenewAccessScreen() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="fixed inset-0 bg-background max-w-mobile mx-auto flex items-center justify-center px-6">
      <div className="w-full bg-white rounded-3xl shadow-soft p-6 text-center">
        <div className="w-14 h-14 bg-teal-soft rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">♡</div>
        <h1 className="text-xl font-extrabold text-text-primary mb-2">Contact us to renew access</h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-5">
          Your NunaCare account is inactive or expired. Please contact us to renew your access.
        </p>
        <PrimaryButton onClick={logout}>Back to login</PrimaryButton>
      </div>
    </div>
  );
}

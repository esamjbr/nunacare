import { useState } from 'react';
import { Lock, UserRound, Heart } from 'lucide-react';
import { login } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { PrimaryButton } from '../../components/ui';

export function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearCoreData = useStore((s) => s.clearCoreData);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auth = await login(username, password);
      clearCoreData();
      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
        role: auth.role,
        mustChangePassword: auth.mustChangePassword,
      });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || /inactive|expired/i.test(err.message))) {
        setError('Contact us to renew access.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to log in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto max-w-mobile mx-auto">
      <div className="min-h-full px-6 py-10 flex flex-col justify-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-feeding-tint rounded-[24px] flex items-center justify-center mb-4">
            <Heart size={28} className="text-primary" aria-hidden="true" />
          </div>
          <p className="text-[12px] text-text-hint font-medium mb-1 lowercase tracking-[0.05em]">NunaCare</p>
          <h1 className="font-display text-[26px] font-[500] text-text-primary">Welcome back</h1>
          <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">
            Sign in with the account details you received from NunaCare.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-[24px] shadow-soft border border-border-hairline/[.18] p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em]">Username</span>
            <span className="flex items-center gap-2 bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-4 py-3 min-h-[44px]">
              <UserRound size={16} className="text-text-hint shrink-0" aria-hidden="true" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent outline-none text-[14px] text-text-primary"
                autoComplete="username"
                required
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em]">Password</span>
            <span className="flex items-center gap-2 bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-4 py-3 min-h-[44px]">
              <Lock size={16} className="text-text-hint shrink-0" aria-hidden="true" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full bg-transparent outline-none text-[14px] text-text-primary"
                autoComplete="current-password"
                required
              />
            </span>
          </label>

          {error && <p className="text-[13px] text-error-text bg-error-soft rounded-[14px] px-4 py-3">{error}</p>}

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}

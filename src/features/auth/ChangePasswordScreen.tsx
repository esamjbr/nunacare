import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { changePassword } from '../../api/auth';
import { ApiError } from '../../api/client';
import { PrimaryButton, SecondaryButton } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';

export function ChangePasswordScreen() {
  const navigate = useNavigate();
  const { setAuth, logout } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const auth = await changePassword(newPassword);
      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
        role: auth.role,
        mustChangePassword: auth.mustChangePassword,
      });
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Unable to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto max-w-mobile mx-auto">
      <div className="min-h-full px-6 py-10 flex flex-col justify-center">
        <div className="mb-6">
          <div className="w-14 h-14 bg-teal-soft rounded-[20px] flex items-center justify-center mb-4">
            <KeyRound size={26} className="text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-display text-[24px] font-[500] text-text-primary">Change password</h1>
          <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">
            Please choose a new password before using NunaCare.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-[24px] shadow-soft border border-border-hairline/[.18] p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em]">New password</span>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              className="w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-4 py-3 text-[14px] text-text-primary outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
              autoComplete="new-password"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em]">Confirm password</span>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              className="w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-4 py-3 text-[14px] text-text-primary outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
              autoComplete="new-password"
              required
            />
          </label>

          {error && <p className="text-[13px] text-error-text bg-error-soft rounded-[14px] px-4 py-3">{error}</p>}

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save password'}
          </PrimaryButton>
          <SecondaryButton onClick={logout}>Log out</SecondaryButton>
        </form>
      </div>
    </div>
  );
}

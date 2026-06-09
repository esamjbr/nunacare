import { useEffect, useMemo, useState } from 'react';
import { Copy, LogOut, Plus, RefreshCcw, Search, UserCheck, UserX } from 'lucide-react';
import {
  activateCustomer,
  createCustomer,
  deactivateCustomer,
  getCustomers,
  resetCustomerPassword,
} from '../../api/admin';
import { ApiError } from '../../api/client';
import { BottomSheet } from '../../components/BottomSheet';
import { Badge, PrimaryButton, SecondaryButton, Toggle } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import type { AccessType, CustomerSummary } from '../../types/auth';

const accessTypes: AccessType[] = ['Trial', 'Lifetime', 'Monthly', 'Yearly'];

interface CredentialMessage {
  username: string;
  temporaryPassword: string;
}

function customerStatus(customer: CustomerSummary): 'active' | 'inactive' | 'expired' {
  if (!customer.isActive) return 'inactive';
  if (customer.expiresAt && new Date(customer.expiresAt).getTime() <= Date.now()) return 'expired';
  return 'active';
}

function statusBadge(customer: CustomerSummary) {
  const status = customerStatus(customer);
  if (status === 'active') return <Badge label="Active" color="soft" />;
  if (status === 'expired') return <Badge label="Expired" color="error" />;
  return <Badge label="Inactive" color="cream" />;
}

function formatDate(value?: string | null) {
  if (!value) return 'No expiration';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function buildCredentialText(credentials: CredentialMessage) {
  const appLink = window.location.origin;
  return [
    'Welcome to NunaCare 🤍',
    `App link: ${appLink}`,
    `Username: ${credentials.username}`,
    `Temporary password: ${credentials.temporaryPassword}`,
    'Please change your password after first login.',
  ].join('\n');
}

export function AdminCustomersScreen() {
  const { user, logout } = useAuthStore();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [credentials, setCredentials] = useState<CredentialMessage | null>(null);
  const [copyNote, setCopyNote] = useState('');

  async function loadCustomers() {
    setError('');
    setLoading(true);
    try {
      setCustomers(await getCustomers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load customers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((c) =>
      [c.username, c.fullName || '', c.phoneNumber || ''].some((v) => v.toLowerCase().includes(needle))
    );
  }, [customers, query]);

  const handleResetPassword = async (customer: CustomerSummary) => {
    setError('');
    try {
      const response = await resetCustomerPassword(customer.id);
      setCredentials({ username: customer.username, temporaryPassword: response.temporaryPassword });
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    }
  };

  const handleToggleActive = async (customer: CustomerSummary) => {
    setError('');
    try {
      const updated = customer.isActive
        ? await deactivateCustomer(customer.id)
        : await activateCustomer(customer.id);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update customer.');
    }
  };

  const handleCopy = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(buildCredentialText(credentials));
    setCopyNote('Credentials copied.');
    setTimeout(() => setCopyNote(''), 2200);
  };

  return (
    <div className="fixed inset-0 bg-background max-w-mobile mx-auto flex flex-col overflow-hidden">
      <header className="shrink-0 bg-background/95 border-b border-border/60 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-text-hint">NunaCare Admin</p>
            <h1 className="text-lg font-extrabold text-text-primary">Customers</h1>
          </div>
          <button onClick={logout} className="w-9 h-9 bg-white rounded-full shadow-soft flex items-center justify-center">
            <LogOut size={16} className="text-text-secondary" />
          </button>
        </div>
        {user && <p className="text-xs text-text-hint mt-1">Signed in as {user.username}</p>}
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        <div className="flex gap-2 mb-4">
          <label className="flex-1 flex items-center gap-2 bg-white rounded-2xl shadow-soft px-3 py-2.5">
            <Search size={16} className="text-text-hint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers"
              className="w-full bg-transparent outline-none text-sm text-text-primary"
            />
          </label>
          <button
            onClick={() => setShowCreate(true)}
            className="w-11 h-11 bg-primary rounded-2xl shadow-soft flex items-center justify-center"
          >
            <Plus size={18} className="text-white" />
          </button>
        </div>

        {error && <p className="text-sm text-error-text bg-error-soft rounded-2xl px-4 py-3 mb-4">{error}</p>}

        {credentials && (
          <div className="bg-white rounded-3xl shadow-soft p-4 mb-4 border border-primary-light">
            <p className="text-sm font-bold text-text-primary mb-2">Generated credentials</p>
            <pre className="whitespace-pre-wrap text-xs text-text-secondary bg-beige rounded-2xl p-3 leading-relaxed">
              {buildCredentialText(credentials)}
            </pre>
            <div className="flex gap-2 mt-3">
              <PrimaryButton onClick={handleCopy} fullWidth={false} className="flex-1">
                <span className="flex items-center justify-center gap-2"><Copy size={15} /> Copy</span>
              </PrimaryButton>
              <SecondaryButton onClick={() => setCredentials(null)} fullWidth={false} className="flex-1">Done</SecondaryButton>
            </div>
            {copyNote && <p className="text-xs text-primary text-center mt-2">{copyNote}</p>}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-hint text-center py-10">Loading customers...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-4xl mb-3">♡</p>
            <p className="text-sm font-semibold text-text-secondary">No customers found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((customer) => (
              <div key={customer.id} className="bg-white rounded-3xl shadow-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{customer.fullName || customer.username}</p>
                    <p className="text-xs text-text-hint truncate">@{customer.username}</p>
                    {customer.phoneNumber && <p className="text-xs text-text-hint truncate">{customer.phoneNumber}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {statusBadge(customer)}
                    <Badge label={customer.accessType} color="primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="bg-soft-surface rounded-2xl px-3 py-2">
                    <p className="text-text-hint">Expires</p>
                    <p className="font-semibold text-text-primary">{formatDate(customer.expiresAt)}</p>
                  </div>
                  <div className="bg-soft-surface rounded-2xl px-3 py-2">
                    <p className="text-text-hint">Password</p>
                    <p className="font-semibold text-text-primary">{customer.mustChangePassword ? 'Change required' : 'Set'}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleResetPassword(customer)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-soft-surface text-text-secondary rounded-2xl py-2.5 text-xs font-semibold"
                  >
                    <RefreshCcw size={13} /> Reset
                  </button>
                  <button
                    onClick={() => handleToggleActive(customer)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-semibold ${
                      customer.isActive ? 'bg-error-soft text-error-text' : 'bg-teal-soft text-primary'
                    }`}
                  >
                    {customer.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                    {customer.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateCustomerSheet
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async (created, active) => {
          setShowCreate(false);
          let customer = created.customer;
          if (!active) {
            customer = await deactivateCustomer(customer.id);
          }
          setCredentials({ username: created.username, temporaryPassword: created.temporaryPassword });
          setCustomers((prev) => [customer, ...prev.filter((c) => c.id !== customer.id)]);
        }}
        onError={setError}
      />
    </div>
  );
}

function CreateCustomerSheet({
  isOpen,
  onClose,
  onCreated,
  onError,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (created: Awaited<ReturnType<typeof createCustomer>>, active: boolean) => void | Promise<void>;
  onError: (message: string) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [accessType, setAccessType] = useState<AccessType>('Trial');
  const [expirationDate, setExpirationDate] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleCreate = async () => {
    setLocalError('');
    setSaving(true);
    try {
      const expiresAt = expirationDate
        ? new Date(`${expirationDate}T23:59:59`).toISOString()
        : null;
      const created = await createCustomer({
        fullName: fullName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        username: username.trim() || undefined,
        accessType,
        expiresAt,
      });
      await onCreated(created, active);
      setFullName('');
      setPhoneNumber('');
      setUsername('');
      setAccessType('Trial');
      setExpirationDate('');
      setActive(true);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : 'Unable to create customer.';
      setLocalError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Create customer">
      <div className="flex flex-col gap-4 pb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-beige border border-border rounded-2xl px-4 py-3 outline-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Phone number optional</span>
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-beige border border-border rounded-2xl px-4 py-3 outline-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Username optional</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-beige border border-border rounded-2xl px-4 py-3 outline-none" />
        </label>
        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">Access type</p>
          <div className="grid grid-cols-2 gap-2">
            {accessTypes.map((type) => (
              <button
                key={type}
                onClick={() => setAccessType(type)}
                className={`rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold ${
                  accessType === type ? 'border-primary bg-teal-soft text-primary' : 'border-border bg-soft-surface text-text-secondary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Expiration date optional</span>
          <input value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} type="date" className="w-full bg-beige border border-border rounded-2xl px-4 py-3 outline-none" />
        </label>
        <div className="flex items-center justify-between bg-soft-surface rounded-2xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-text-primary">Active</p>
            <p className="text-xs text-text-hint">Allow login immediately</p>
          </div>
          <Toggle enabled={active} onChange={setActive} />
        </div>

        {localError && <p className="text-sm text-error-text bg-error-soft rounded-2xl px-4 py-3">{localError}</p>}

        <div className="flex gap-3">
          <SecondaryButton onClick={onClose} fullWidth={false} className="flex-1">Cancel</SecondaryButton>
          <PrimaryButton onClick={handleCreate} disabled={saving} fullWidth={false} className="flex-1">
            {saving ? 'Creating...' : 'Create'}
          </PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}

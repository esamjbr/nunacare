import { useState } from 'react';
import { Plus, Trash2, Users, User, Eye, UserCheck, Info, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, PrimaryButton, SecondaryButton, FormInput, SegmentedControl, EmptyState, ConfirmModal, IconCircle } from '../../components/ui';
import { BottomSheet } from '../../components/BottomSheet';
import { useStore } from '../../store/useStore';
import type { CaregiverRole } from '../../types';

const ROLE_LABELS: Record<CaregiverRole, { en: string; ar: string }> = {
  parent: { en: 'Parent / Admin', ar: 'أحد الوالدين' },
  caregiver: { en: 'Caregiver', ar: 'مقدم رعاية' },
  readonly: { en: 'Read-Only', ar: 'قراءة فقط' },
};

const ROLE_ICON: Record<CaregiverRole, React.ReactNode> = {
  parent:    <UserCheck size={16} aria-hidden="true" />,
  caregiver: <User     size={16} aria-hidden="true" />,
  readonly:  <Eye      size={16} aria-hidden="true" />,
};

const ROLE_BG: Record<CaregiverRole, string> = {
  parent:    'bg-feeding-tint',
  caregiver: 'bg-teal-soft',
  readonly:  'bg-soft-surface',
};

function AddCaregiverSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const { addCaregiver } = useStore();
  const [name, setName] = useState('');
  const [role, setRole] = useState<CaregiverRole>('caregiver');

  const handleSave = () => {
    if (!name.trim()) return;
    addCaregiver({
      name: name.trim(), role,
      permissions: {
        canAddLogs: role !== 'readonly',
        canViewLogs: true,
        canManageMedicines: role === 'parent',
        canExportReports: role === 'parent',
      },
    });
    setName(''); onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.addCaregiver}>
      <div className="flex flex-col gap-4 pb-4">
        <FormInput label={lang === 'ar' ? 'الاسم' : 'name'} value={name} onChange={setName} placeholder={lang === 'ar' ? 'مثال: جدة' : 'e.g. Grandma'} />
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{lang === 'ar' ? 'الدور' : 'role'}</p>
          <SegmentedControl
            options={[
              { value: 'parent', label: lang === 'ar' ? 'والد/ة' : 'Parent' },
              { value: 'caregiver', label: lang === 'ar' ? 'رعاية' : 'Caregiver' },
              { value: 'readonly', label: lang === 'ar' ? 'قراءة' : 'Read-Only' },
            ]}
            value={role}
            onChange={(v) => setRole(v as CaregiverRole)}
          />
        </div>
        <div className="bg-teal-soft rounded-[14px] p-3">
          <p className="text-[12px] font-semibold text-primary mb-1">{lang === 'ar' ? 'الصلاحيات' : 'Permissions'}</p>
          <p className="text-[12px] text-text-secondary">
            {lang === 'ar'
              ? (role === 'parent' ? 'كامل الصلاحيات' : role === 'caregiver' ? 'إضافة وعرض السجلات' : 'عرض السجلات فقط')
              : (role === 'parent' ? 'Full access' : role === 'caregiver' ? 'Can add & view logs' : 'View logs only')}
          </p>
        </div>
        <div className="flex items-start gap-2 bg-warm-soft rounded-[14px] p-3">
          <Info size={13} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[12px] text-text-secondary">{t.inviteCode}</p>
        </div>
        <div className="flex gap-3">
          <SecondaryButton onClick={onClose} fullWidth={false} className="flex-1">{t.cancel}</SecondaryButton>
          <PrimaryButton onClick={handleSave} fullWidth={false} className="flex-1">{t.save}</PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}

export function FamilyScreen() {
  const { t, lang } = useT();
  const { caregivers, removeCaregiver } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <AppShell title={t.familyTitle} showBack showNav={false} headerRight={
      <button
        onClick={() => setShowAdd(true)}
        aria-label={lang === 'ar' ? 'إضافة مقدم رعاية' : 'Add caregiver'}
        className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Plus size={18} className="text-surface" aria-hidden="true" />
      </button>
    }>
      <div className="bg-teal-soft rounded-[18px] p-4 mb-5">
        <p className="text-[13px] font-bold text-primary mb-1">{lang === 'ar' ? 'مشاركة محلية فقط' : 'Local sharing only'}</p>
        <p className="text-[12px] text-text-secondary leading-relaxed">
          {lang === 'ar' ? 'لا يوجد مزامنة سحابية. هذه القائمة مخزنة محلياً على جهازك.' : 'No cloud sync. This list is stored locally on your device only.'}
        </p>
      </div>

      {caregivers.length === 0 ? (
        <EmptyState icon={<Users size={28} />} tint="bg-teal-soft" title={t.noFamily} subtitle={t.noFamilySub} />
      ) : (
        <div className="flex flex-col gap-3">
          {caregivers.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <SoftCard>
                <div className="flex items-center gap-3 mb-3">
                  <IconCircle icon={ROLE_ICON[c.role]} bg={ROLE_BG[c.role]} size="md" />
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-text-primary">{c.name}</p>
                    <p className="text-[12px] text-text-hint">{lang === 'ar' ? ROLE_LABELS[c.role].ar : ROLE_LABELS[c.role].en}</p>
                  </div>
                  <button
                    onClick={() => setConfirmId(c.id)}
                    aria-label={lang === 'ar' ? 'إزالة مقدم الرعاية' : 'Remove caregiver'}
                    className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Trash2 size={14} className="text-text-hint" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'canAddLogs',         label: lang === 'ar' ? 'إضافة سجلات' : 'Add logs',       val: c.permissions.canAddLogs },
                    { key: 'canViewLogs',         label: lang === 'ar' ? 'عرض السجلات' : 'View logs',      val: c.permissions.canViewLogs },
                    { key: 'canManageMedicines',  label: lang === 'ar' ? 'إدارة أدوية' : 'Manage meds',   val: c.permissions.canManageMedicines },
                    { key: 'canExportReports',    label: lang === 'ar' ? 'تصدير تقارير' : 'Export reports', val: c.permissions.canExportReports },
                  ].map(({ key, label, val }) => (
                    <div key={key} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-[10px] text-[11px] ${val ? 'bg-teal-soft text-primary' : 'bg-soft-surface text-text-hint'}`}>
                      {val
                        ? <Check size={10} aria-hidden="true" />
                        : <X    size={10} aria-hidden="true" />
                      }
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </SoftCard>
            </motion.div>
          ))}
        </div>
      )}

      <AddCaregiverSheet isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ConfirmModal
        isOpen={!!confirmId} title={lang === 'ar' ? 'إزالة مقدم الرعاية' : 'Remove Caregiver'}
        message={lang === 'ar' ? 'هل تريد إزالة هذا الشخص؟' : 'Remove this caregiver?'}
        confirmLabel={t.delete} cancelLabel={t.cancel} danger
        onConfirm={() => { if (confirmId) removeCaregiver(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
      />
    </AppShell>
  );
}

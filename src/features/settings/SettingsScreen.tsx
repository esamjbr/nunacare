import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Upload, Trash2, Globe, Moon, Bell, Sunset, MessageCircle, Stethoscope, HelpCircle, Apple, Flower2, Smile } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, Toggle, ConfirmModal, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { exportStateAsJson, importStateFromJson } from '../../utils/storage';

export function SettingsScreen() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const { babyProfile, settings, updateSettings, resetAll, importState } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLanguageToggle = () => {
    const newLang = settings.language === 'en' ? 'ar' : 'en';
    updateSettings({ language: newLang, direction: newLang === 'ar' ? 'rtl' : 'ltr' });
  };

  const handleExport = () => exportStateAsJson(useStore.getState());
  const handleImportClick = () => fileRef.current?.click();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const state = await importStateFromJson(file);
      importState(state);
      setImportError('');
      alert(lang === 'ar' ? 'تم استيراد البيانات بنجاح!' : 'Data imported successfully!');
    } catch {
      setImportError(lang === 'ar' ? 'ملف غير صالح' : 'Invalid file');
    }
    e.target.value = '';
  };

  function Row({ icon, label, value, onClick, rightEl }: { icon: React.ReactNode; label: React.ReactNode; value?: string; onClick?: () => void; rightEl?: React.ReactNode }) {
    return (
      <button
        onClick={onClick}
        disabled={!onClick && !rightEl}
        className={`flex items-center gap-3 py-3.5 px-4 w-full text-start min-h-[44px] ${onClick ? 'active:bg-soft-surface' : ''} transition-colors rounded-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`}
      >
        <div className="shrink-0" aria-hidden="true">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-text-primary">{label}</p>
          {value && <p className="text-[12px] text-text-hint">{value}</p>}
        </div>
        {rightEl ?? (onClick && <ChevronRight size={16} className="text-text-hint shrink-0" aria-hidden="true" />)}
      </button>
    );
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="mb-4">
        <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] px-1 mb-2">{title}</p>
        <SoftCard padding="p-0 overflow-hidden divide-y divide-border-hairline/[.15]">
          {children}
        </SoftCard>
      </div>
    );
  }

  return (
    <AppShell title={t.settingsTitle} showNav={false} showBack>
      {/* Baby profile card */}
      {babyProfile && (
        <div className="mb-5">
          <SoftCard className="bg-surface-sunk">
            <div className="flex items-center gap-3">
              <IconCircle icon={<Smile size={20} className="text-primary" aria-hidden="true" />} bg="bg-feeding-tint" size="lg" />
              <div>
                <p className="text-[16px] font-bold text-text-primary">{babyProfile.name}</p>
                <p className="text-[12px] text-text-hint">{babyProfile.dateOfBirth}</p>
              </div>
            </div>
          </SoftCard>
        </div>
      )}

      <Section title={lang === 'ar' ? 'التفضيلات' : 'preferences'}>
        <Row
          icon={<IconCircle icon={<Globe size={14} className="text-primary" />} bg="bg-teal-soft" size="sm" />}
          label={t.language}
          value={settings.language === 'en' ? 'English' : 'العربية'}
          onClick={handleLanguageToggle}
          rightEl={<span className="text-[12px] bg-teal-soft text-primary px-2 py-0.5 rounded-full font-medium">{settings.language === 'en' ? 'EN' : 'عر'}</span>}
        />
        <Row
          icon={<IconCircle icon={<Moon size={14} className="text-primary" />} bg="bg-sleep-soft" size="sm" />}
          label={t.calmMode} value={t.calmModeDesc}
          rightEl={<Toggle enabled={settings.calmMode} onChange={(v) => updateSettings({ calmMode: v })} />}
        />
        <Row
          icon={<IconCircle icon={<Sunset size={14} className="text-primary" />} bg="bg-warm-soft" size="sm" />}
          label={t.nightMode} value={t.nightModeDesc}
          rightEl={<Toggle enabled={settings.nightMode} onChange={(v) => updateSettings({ nightMode: v, nightModeAuto: false })} />}
        />
        <Row
          icon={<IconCircle icon={<Moon size={14} className="text-primary" />} bg="bg-soft-surface" size="sm" />}
          label={t.nightModeAuto} value={t.nightModeAutoDesc}
          rightEl={<Toggle enabled={settings.nightModeAuto} onChange={(v) => updateSettings({ nightModeAuto: v })} />}
        />
        <Row
          icon={<IconCircle icon={<Bell size={14} className="text-primary" />} bg="bg-teal-soft" size="sm" />}
          label={t.notifications}
          value={lang === 'ar' ? 'إشعارات داخل التطبيق' : 'In-app notifications'}
          rightEl={<Toggle enabled={settings.notificationsEnabled} onChange={(v) => updateSettings({ notificationsEnabled: v })} />}
        />
        <Row
          icon={<IconCircle icon={<MessageCircle size={14} className="text-primary" />} bg="bg-surface-sunk" size="sm" />}
          label={t.patternWhispers} value={t.patternWhispersDesc}
          rightEl={<Toggle enabled={settings.patternWhispers} onChange={(v) => updateSettings({ patternWhispers: v })} />}
        />
      </Section>

      <Section title={lang === 'ar' ? 'الملاحة' : 'navigation'}>
        <Row icon={<IconCircle icon={<Stethoscope size={14} className="text-primary" />} bg="bg-feeding-tint" size="sm" />} label={lang === 'ar' ? 'تقرير الطبيب' : 'Doctor Report'} onClick={() => navigate('/doctor-report')} />
        <Row icon={<IconCircle icon={<HelpCircle size={14} className="text-primary" />} bg="bg-teal-soft" size="sm" />} label={t.doctorQuestions} onClick={() => navigate('/doctor-questions')} />
        <Row icon={<IconCircle icon={<Apple size={14} className="text-primary" />} bg="bg-feeding-tint" size="sm" />} label={t.firstFoodsTitle} onClick={() => navigate('/first-foods')} />
        <Row icon={<IconCircle icon={<Flower2 size={14} className="text-primary" />} bg="bg-lavender-soft" size="sm" />} label={t.momRecovery} onClick={() => navigate('/mom-recovery')} />
      </Section>

      <Section title={lang === 'ar' ? 'البيانات' : 'data'}>
        <Row icon={<IconCircle icon={<Download size={14} className="text-primary" />} bg="bg-teal-soft" size="sm" />} label={t.exportData} onClick={handleExport} />
        <Row icon={<IconCircle icon={<Upload size={14} className="text-primary" />} bg="bg-teal-soft" size="sm" />} label={t.importData} onClick={handleImportClick} />
        <Row
          icon={<IconCircle icon={<Trash2 size={14} className="text-error-text" />} bg="bg-error-soft" size="sm" />}
          label={<span className="text-error-text">{t.deleteAllData}</span>}
          onClick={() => setShowDeleteConfirm(true)}
          rightEl={<span />}
        />
      </Section>

      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      {importError && <p className="text-[13px] text-error-text text-center mt-2">{importError}</p>}

      <p className="text-[11px] text-text-faint text-center mt-4 leading-relaxed">
        NunaCare v1.0 · {lang === 'ar' ? 'جميع بياناتك محفوظة محلياً على جهازك' : 'All data stored locally on your device'}
      </p>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={lang === 'ar' ? 'حذف كل البيانات' : 'Delete All Data'}
        message={t.deleteConfirm} confirmLabel={t.deleteAllData} cancelLabel={t.cancel} danger
        onConfirm={() => { resetAll(); navigate('/onboarding/welcome', { replace: true }); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AppShell>
  );
}

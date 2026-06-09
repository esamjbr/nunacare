import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smile } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { FormInput, PrimaryButton, SegmentedControl, IconCircle } from '../../components/ui';
import { todayISO } from '../../utils/dateHelpers';
import type { BabyProfile, AppSettings } from '../../types';

export function CreateProfileScreen() {
  const navigate = useNavigate();
  const { setBabyProfile, updateSettings } = useStore();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'girl' | 'boy' | 'other'>('girl');
  const [feedingType, setFeedingType] = useState<BabyProfile['feedingType']>('breastfeeding');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter your baby\'s name'); return; }
    if (!dob) { setError('Please enter your baby\'s date of birth'); return; }
    setError('');
    setSaving(true);

    const profile: BabyProfile = {
      id: '',
      name: name.trim(),
      dateOfBirth: dob,
      gender,
      feedingType,
    };

    const settings: Partial<AppSettings> = {
      language,
      direction: language === 'ar' ? 'rtl' : 'ltr',
      onboardingComplete: true,
    };

    try {
      await setBabyProfile(profile);
      updateSettings(settings);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create baby profile.');
    } finally {
      setSaving(false);
    }
  };

  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto overscroll-none max-w-mobile mx-auto">
      <div className="h-1.5 bg-primary" />

      <div className="px-6 py-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <IconCircle icon={<Smile size={28} className="text-primary" aria-hidden="true" />} bg="bg-feeding-tint" size="xl" className="mb-5" />
          <h1 className="font-display text-[24px] font-[500] text-text-primary mb-1">
            {isAr ? 'إنشاء ملف الطفل' : 'Create Baby Profile'}
          </h1>
          <p className="text-[13px] text-text-secondary mb-8">
            {isAr ? 'أخبرنا عن طفلك الرائع' : 'Tell us about your little one'}
          </p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col gap-5">
          <FormInput
            label={isAr ? 'اسم الطفل' : "baby's name"}
            value={name}
            onChange={setName}
            placeholder={isAr ? 'مثال: ليان' : 'e.g., Lily'}
            required
          />

          <FormInput
            label={isAr ? 'تاريخ الميلاد' : 'date of birth'}
            value={dob}
            onChange={setDob}
            type="date"
            max={todayISO()}
            required
          />

          {/* Gender */}
          <div>
            <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">
              {isAr ? 'الجنس' : 'gender'} <span className="text-text-hint">({isAr ? 'اختياري' : 'optional'})</span>
            </p>
            <SegmentedControl
              options={[
                { value: 'girl',  label: isAr ? 'بنت' : 'Girl' },
                { value: 'boy',   label: isAr ? 'ولد' : 'Boy' },
                { value: 'other', label: isAr ? 'آخر' : 'Other' },
              ]}
              value={gender}
              onChange={(v) => setGender(v as typeof gender)}
            />
          </div>

          {/* Feeding type */}
          <div>
            <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">
              {isAr ? 'طريقة الرضاعة' : 'primary feeding'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'breastfeeding', enLabel: 'Breastfeeding', arLabel: 'طبيعية' },
                { value: 'bottle',        enLabel: 'Bottle',         arLabel: 'رضّاعة' },
                { value: 'formula',       enLabel: 'Formula',        arLabel: 'صناعي' },
                { value: 'mixed',         enLabel: 'Mixed',          arLabel: 'مختلطة' },
              ].map(({ value, enLabel, arLabel }) => (
                <button
                  key={value}
                  onClick={() => setFeedingType(value as typeof feedingType)}
                  className={`py-3 px-3 rounded-[14px] text-[13px] font-medium border-2 transition-all text-start min-h-[44px] ${
                    feedingType === value
                      ? 'border-primary bg-feeding-tint text-primary'
                      : 'border-border-hairline/[.25] bg-soft-surface text-text-secondary'
                  }`}
                >
                  {isAr ? arLabel : enLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">
              {isAr ? 'لغة التطبيق' : 'app language'}
            </p>
            <SegmentedControl
              options={[
                { value: 'en', label: 'English' },
                { value: 'ar', label: 'العربية' },
              ]}
              value={language}
              onChange={(v) => setLanguage(v as 'en' | 'ar')}
            />
          </div>

          {error && (
            <div className="bg-error-soft rounded-[14px] px-4 py-3">
              <p className="text-[13px] text-error-text">{error}</p>
            </div>
          )}

          <PrimaryButton onClick={handleSubmit} className="mt-2" disabled={saving}>
            {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'إنشاء الملف' : 'Create Profile')}
          </PrimaryButton>
        </motion.div>
      </div>
    </div>
  );
}

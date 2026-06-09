import { useNavigate } from 'react-router-dom';
import { ChevronRight, Scale, Stethoscope, HelpCircle, Apple, Settings, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { calculateBabyAge } from '../../utils/dateHelpers';

type MenuItem = {
  icon: React.ReactNode;
  iconBg: string;
  enLabel: string;
  arLabel: string;
  route: string;
};

const menuItems: MenuItem[] = [
  { icon: <Scale size={18} aria-hidden="true" />, iconBg: 'bg-teal-soft', enLabel: 'Growth Tracker', arLabel: 'متابعة النمو', route: '/growth' },
  { icon: <Stethoscope size={18} aria-hidden="true" />, iconBg: 'bg-feeding-tint', enLabel: 'Doctor Report', arLabel: 'تقرير الطبيب', route: '/doctor-report' },
  { icon: <HelpCircle size={18} aria-hidden="true" />, iconBg: 'bg-teal-soft', enLabel: 'Questions for Doctor', arLabel: 'أسئلة للطبيب', route: '/doctor-questions' },
  { icon: <Apple size={18} aria-hidden="true" />, iconBg: 'bg-feeding-tint', enLabel: 'First Foods Guide', arLabel: 'دليل الأطعمة الأولى', route: '/first-foods' },
{ icon: <Settings size={18} aria-hidden="true" />, iconBg: 'bg-soft-surface', enLabel: 'Settings', arLabel: 'الإعدادات', route: '/settings' },
];

export function MoreScreen() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const { babyProfile } = useStore();
  const babyAge = babyProfile ? calculateBabyAge(babyProfile.dateOfBirth, lang) : '';

  return (
    <AppShell showNav>
      {/* Screen title */}
      <p className="font-display text-[24px] font-[500] text-text-primary mb-0.5">{t.moreScreenTitle}</p>
      <p className="text-[13px] text-text-hint mb-5">{t.moreScreenSubtitle}</p>

      {/* Baby switcher card */}
      {babyProfile && (
        <SoftCard className="mb-5 bg-surface-sunk">
          <div className="flex items-center gap-3">
            <IconCircle icon={<Smile size={20} className="text-primary" aria-hidden="true" />} bg="bg-feeding-tint" size="lg" />
            <div>
              <p className="text-[16px] font-bold text-text-primary">{babyProfile.name}</p>
              <p className="text-[12px] text-text-hint">{babyAge}</p>
            </div>
          </div>
        </SoftCard>
      )}

      <div className="flex flex-col gap-2">
        {menuItems.map(({ icon, iconBg, enLabel, arLabel, route }, i) => (
          <motion.div key={route} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <button
              onClick={() => navigate(route)}
              className="w-full flex items-center gap-3 bg-surface rounded-[18px] border border-border-hairline/[.18] px-4 py-3.5 active:scale-[0.98] transition-transform"
            >
              <IconCircle icon={icon} bg={iconBg} size="md" />
              <span className="flex-1 text-[14px] font-semibold text-text-primary text-start">
                {lang === 'ar' ? arLabel : enLabel}
              </span>
              <ChevronRight size={16} className="text-text-hint shrink-0" aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </div>
    </AppShell>
  );
}

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Milk, BedDouble, Droplets, Pill, CalendarDays, TrendingUp } from 'lucide-react';
import { PrimaryButton, IconCircle } from '../../components/ui';

const features: { icon: React.ReactNode; bg: string; label: string }[] = [
  { icon: <Milk        size={14} aria-hidden="true" />, bg: 'bg-feeding-tint', label: 'Feeding' },
  { icon: <BedDouble   size={14} aria-hidden="true" />, bg: 'bg-sleep-soft',   label: 'Sleep' },
  { icon: <Droplets    size={14} aria-hidden="true" />, bg: 'bg-diaper-tint',  label: 'Diapers' },
  { icon: <Pill        size={14} aria-hidden="true" />, bg: 'bg-warm-soft',    label: 'Medicine' },
  { icon: <CalendarDays size={14} aria-hidden="true" />, bg: 'bg-teal-soft',   label: 'Appointments' },
  { icon: <TrendingUp  size={14} aria-hidden="true" />, bg: 'bg-teal-soft',    label: 'Growth' },
];

export function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background flex flex-col max-w-mobile mx-auto">
      {/* Decorative top */}
      <div className="relative h-72 bg-gradient-to-br from-feeding-tint to-sleep-soft flex items-center justify-center overflow-hidden shrink-0">
        <div className="absolute top-4 start-4 w-20 h-20 bg-surface/40 rounded-full" />
        <div className="absolute bottom-4 end-8 w-32 h-32 bg-surface/25 rounded-full" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="z-10"
        >
          <IconCircle icon={<Moon size={48} className="text-primary" aria-hidden="true" />} bg="bg-surface/70" size="xl" className="w-28 h-28 shadow-soft" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display text-[26px] font-[500] text-text-primary leading-tight mb-3">
            Your baby's routine,<br />beautifully remembered.
          </h1>
          <p className="text-[13px] text-text-secondary leading-relaxed mb-6">
            Track feeding, sleep, diapers, medicine, appointments, and growth — all in one calm, private place.
          </p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="flex flex-wrap gap-2 mb-8">
          {features.map(({ icon, bg, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-surface border border-border-hairline/[.18] px-3 py-1.5 rounded-full">
              <IconCircle icon={icon} bg={bg} size="sm" className="w-5 h-5" />
              <span className="text-[12px] font-medium text-text-secondary">{label}</span>
            </div>
          ))}
        </motion.div>

        <div className="mt-auto">
          <PrimaryButton onClick={() => navigate('/onboarding/privacy')}>
            Get Started
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

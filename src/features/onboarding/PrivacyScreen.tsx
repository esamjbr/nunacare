import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, PackageOpen, Trash2 } from 'lucide-react';
import { PrimaryButton } from '../../components/ui';

const badges = [
  { icon: ShieldCheck, label: 'No Ads', color: 'text-primary' },
  { icon: PackageOpen, label: 'Export Anytime', color: 'text-primary' },
  { icon: Trash2, label: 'Delete Anytime', color: 'text-primary' },
];

export function PrivacyScreen() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background flex flex-col max-w-mobile mx-auto">
      {/* Decorative top */}
      <div className="relative h-56 bg-gradient-to-br from-teal-soft to-soft-surface flex items-center justify-center overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-28 h-28 bg-white rounded-full shadow-card flex items-center justify-center"
          >
            <ShieldCheck size={52} className="text-primary" />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-extrabold text-text-primary mb-3">
            Private by design.
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            Your baby's data belongs to your family. No ads. No selling data. Everything is stored privately on your device.
          </p>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col gap-3 mb-8"
        >
          {badges.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-3 bg-soft-surface rounded-2xl px-4 py-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-soft">
                <Icon size={18} className={color} />
              </div>
              <span className="text-sm font-semibold text-text-primary">{label}</span>
            </div>
          ))}
        </motion.div>

        <div className="mt-auto">
          <PrimaryButton onClick={() => navigate('/onboarding/profile')}>
            Continue
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

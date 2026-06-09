import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useT, PrimaryButton, SecondaryButton } from '../../components/ui';
import { useStore } from '../../store/useStore';

export function PremiumScreen() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const { settings, updateSettings } = useStore();

  // NOTE: Real payment integration (e.g., Stripe) can be added here.
  // For now, clicking "Unlock" sets isPremium: true in localStorage (local simulation only).
  const handleUnlock = () => {
    updateSettings({ isPremium: true });
    navigate(-1);
  };

  if (settings.isPremium) {
    return (
      <AppShell title={lang === 'ar' ? 'النسخة المميزة' : 'Premium'} showBack showNav={false}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-warm-soft rounded-full flex items-center justify-center mb-4">
            <Star size={36} className="text-amber-500 fill-amber-400" />
          </div>
          <h2 className="text-xl font-extrabold text-text-primary mb-2">{lang === 'ar' ? 'أنت بالفعل مميز!' : "You're Premium!"}</h2>
          <p className="text-sm text-text-secondary">{lang === 'ar' ? 'استمتع بجميع الميزات.' : 'Enjoy all features.'}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={lang === 'ar' ? 'النسخة المميزة' : 'Premium'} showBack showNav={false} noPadding>
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-primary to-primary-dark px-6 py-10 text-center">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star size={30} className="text-amber-300 fill-amber-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">{t.premiumTitle}</h1>
          <p className="text-white/70 text-sm">{lang === 'ar' ? 'مرة واحدة، مدى الحياة' : 'One time, lifetime access'}</p>
        </motion.div>
      </div>

      <div className="px-5 py-6">
        {/* Features */}
        <div className="flex flex-col gap-2 mb-6">
          {t.premiumFeatures.map((feature: string) => (
            <div key={feature} className="flex items-center gap-3 py-2">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                <Check size={13} className="text-white" />
              </div>
              <span className="text-sm font-medium text-text-primary">{feature}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="bg-gradient-to-br from-warm-soft to-cream rounded-3xl p-5 text-center mb-6 border border-amber-200">
          <p className="text-xs text-text-hint mb-1">{lang === 'ar' ? 'فتح دائم' : 'Lifetime unlock'}</p>
          <p className="text-4xl font-extrabold text-primary">{t.premiumPrice}</p>
          <p className="text-xs text-text-hint mt-1">{lang === 'ar' ? 'دفعة واحدة فقط — بدون اشتراك شهري' : 'One-time payment — no subscriptions'}</p>
        </div>

        <div className="flex flex-col gap-3">
          <PrimaryButton onClick={handleUnlock}>
            <span className="flex items-center justify-center gap-2">
              <Star size={16} fill="white" />
              {t.premiumLifetime} — {t.premiumPrice}
            </span>
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate(-1)}>{t.continueFree}</SecondaryButton>
        </div>

        <p className="text-xs text-text-hint text-center mt-4">
          {lang === 'ar' ? '* هذا تفعيل محلي تجريبي. سيتم إضافة الدفع الحقيقي لاحقاً.' : '* This is a local simulation. Real payment integration can be added later.'}
        </p>
      </div>
    </AppShell>
  );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function SplashScreen() {
  const navigate = useNavigate();
  const { settings, babyProfile } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (settings.onboardingComplete && babyProfile) {
        navigate('/home', { replace: true });
      } else {
        navigate('/onboarding/welcome', { replace: true });
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-primary overflow-hidden">
      <div className="absolute top-0 end-0 w-64 h-64 bg-surface/5 rounded-full -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 start-0 w-80 h-80 bg-surface/5 rounded-full translate-y-1/3 -translate-x-1/3" />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="w-24 h-24 bg-surface/20 rounded-[2rem] flex items-center justify-center shadow-elevated backdrop-blur-sm">
          <Heart size={44} className="text-surface fill-surface/80" aria-hidden="true" />
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h1 className="font-display text-[40px] font-[500] text-surface tracking-tight">NunaCare</h1>
          <p className="text-surface/70 text-[15px] mt-1 font-light">Care, remembered gently.</p>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-16 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 bg-surface/60 rounded-full"
          />
        ))}
      </motion.div>
    </div>
  );
}

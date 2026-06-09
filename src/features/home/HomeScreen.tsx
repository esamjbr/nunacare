import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronRight, RotateCcw, Milk, Moon, Droplets, Pill, Scale, FileText } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useT, IconCircle } from '../../components/ui';
import { SoftCard, SummaryCard, EmptyState } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { calculateBabyAge, getGreeting, timeAgo, formatDuration, generateId, nowISO } from '../../utils/dateHelpers';
import { FeedingSheet } from './FeedingSheet';
import { SleepSheet } from './SleepSheet';
import { DiaperSheet } from './DiaperSheet';
import { WeightSheet } from './WeightSheet';
import { NoteSheet } from './NoteSheet';
import { WeeklySummaryCard } from './WeeklySummaryCard';
import { PatternWhisper } from './PatternWhisper';
import type { FeedingLog, SleepLog, DiaperLog } from '../../types';

type SheetType = 'feeding' | 'sleep' | 'diaper' | 'weight' | 'note' | null;

function currentClock() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Primary "right now" CTA — large tap target for the most common logs (feeding, diaper)
function PrimaryCTA({ icon, label, onClick, color, iconBg }: { icon: React.ReactNode; label: string; onClick: () => void; color: string; iconBg: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 ${color} rounded-[18px] p-4 border border-border-hairline/[.15] active:scale-[0.98] transition-transform w-full text-start`}
    >
      <IconCircle icon={icon} bg={iconBg} size="lg" />
      <span className="text-[15px] font-bold text-text-primary leading-tight">{label}</span>
    </button>
  );
}

// "Same as last" repeat affordance
function RepeatButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-text-hint py-1.5 active:scale-95 transition-transform w-full"
    >
      <RotateCcw size={12} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

// Quick action tile
function QuickAction({ icon, iconBg, label, onClick }: { icon: React.ReactNode; iconBg: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 bg-surface rounded-[16px] p-3 border border-border-hairline/[.15] active:scale-95 transition-transform w-full"
    >
      <IconCircle icon={icon} bg={iconBg} size="sm" />
      <span className="text-[11px] font-medium text-text-secondary leading-tight text-center">{label}</span>
    </button>
  );
}

export function HomeScreen() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<SheetType>(null);
  const [toast, setToast] = useState<{ logId: string; message: string } | null>(null);

  const { babyProfile, logs, medicines, appointments, settings, activeTimer } = useStore();
  const addLog = useStore((s) => s.addLog);
  const deleteLog = useStore((s) => s.deleteLog);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const feedingLogs = logs.filter((l) => l.type === 'feeding') as FeedingLog[];
  const sleepLogs = logs.filter((l) => l.type === 'sleep') as SleepLog[];
  const diaperLogs = logs.filter((l) => l.type === 'diaper') as DiaperLog[];

  const lastFeeding = feedingLogs[0];
  const lastSleep = sleepLogs[0];
  const lastDiaper = diaperLogs[0];

  const today = new Date().toISOString().slice(0, 10);
  const nextAppointment = appointments
    .filter((a) => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const nextMedicine = medicines[0];

  const babyAge = babyProfile ? calculateBabyAge(babyProfile.dateOfBirth, lang) : '';
  const greeting = getGreeting(lang);

  const feedingTypeLabel: Record<string, string> = {
    breast: lang === 'ar' ? 'طبيعية' : 'Breast',
    bottle: lang === 'ar' ? 'رضّاعة' : 'Bottle',
    formula: lang === 'ar' ? 'صناعي' : 'Formula',
    solid: lang === 'ar' ? 'أطعمة' : 'Solid',
  };

  const diaperTypeLabel: Record<string, string> = {
    wet: lang === 'ar' ? 'بول' : 'Wet',
    dirty: lang === 'ar' ? 'براز' : 'Dirty',
    mixed: lang === 'ar' ? 'مختلط' : 'Mixed',
  };

  const logTypeLabel: Record<string, string> = {
    feeding: lang === 'ar' ? 'رضاعة' : 'feeding',
    sleep: lang === 'ar' ? 'نوم' : 'sleep',
    diaper: lang === 'ar' ? 'حفاض' : 'diaper',
    weight: lang === 'ar' ? 'وزن' : 'weight',
    note: lang === 'ar' ? 'ملاحظة' : 'note',
  };

  const logIconInfo = (type: string): { icon: React.ReactNode; bg: string } => {
    switch (type) {
      case 'feeding': return { icon: <Milk size={14} aria-hidden="true" />, bg: 'bg-feeding-tint' };
      case 'sleep': return { icon: <Moon size={14} aria-hidden="true" />, bg: 'bg-sleep-soft' };
      case 'diaper': return { icon: <Droplets size={14} aria-hidden="true" />, bg: 'bg-diaper-tint' };
      case 'weight': return { icon: <Scale size={14} aria-hidden="true" />, bg: 'bg-teal-soft' };
      default: return { icon: <FileText size={14} aria-hidden="true" />, bg: 'bg-teal-soft' };
    }
  };

  const repeatFeeding = async () => {
    if (!lastFeeding) return;
    const clone: FeedingLog = {
      id: generateId(), type: 'feeding',
      feedingType: lastFeeding.feedingType, amount: lastFeeding.amount,
      side: lastFeeding.side, time: currentClock(), createdAt: nowISO(),
    };
    await addLog(clone);
    const newId = useStore.getState().logs[0]?.id ?? clone.id;
    setToast({ logId: newId, message: t.feedingLogged });
  };

  const repeatDiaper = async () => {
    if (!lastDiaper) return;
    const clone: DiaperLog = {
      id: generateId(), type: 'diaper',
      diaperType: lastDiaper.diaperType, color: lastDiaper.color,
      time: currentClock(), createdAt: nowISO(),
    };
    await addLog(clone);
    const newId = useStore.getState().logs[0]?.id ?? clone.id;
    setToast({ logId: newId, message: t.diaperLogged });
  };

  const undoRepeat = async () => {
    if (!toast) return;
    await deleteLog(toast.logId);
    setToast(null);
  };

  if (!babyProfile) return (
    <AppShell showNav>
      <EmptyState
        icon={<Milk size={28} aria-hidden="true" />}
        tint="bg-feeding-tint"
        title={t.noBabyProfile}
        subtitle={t.noBabyProfileSub}
      />
    </AppShell>
  );

  return (
    <AppShell showNav noPadding>
      <div className="px-5 pt-5 pb-6">
        {/* ── Header: serif greeting + name + age ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[13px] text-text-hint">{greeting}</p>
            <h1 className="font-display text-[26px] font-[500] text-text-primary leading-tight">
              {babyProfile.name}
            </h1>
            <p className="text-[12px] text-text-hint mt-0.5">
              <span className="text-primary font-medium">{babyAge}</span>
            </p>
          </div>
          <button
            className="w-10 h-10 bg-soft-surface rounded-full flex items-center justify-center border border-border-hairline/[.2]"
            onClick={() => navigate('/settings')}
            aria-label={lang === 'ar' ? 'الإعدادات' : 'Settings'}
          >
            <Settings size={16} className="text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Active Timer Banner */}
        {activeTimer && (
          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-5">
            <button
              onClick={() => setSheet(activeTimer.kind === 'sleep' ? 'sleep' : 'feeding')}
              className="w-full flex items-center justify-between bg-primary text-surface rounded-[18px] p-4 animate-pulse-soft"
            >
              <div className="flex items-center gap-3">
                <IconCircle
                  icon={activeTimer.kind === 'sleep'
                    ? <Moon size={18} aria-hidden="true" />
                    : <Milk size={18} aria-hidden="true" />}
                  bg="bg-white/20"
                  size="md"
                />
                <div className="text-start">
                  <p className="text-[14px] font-bold">
                    {activeTimer.kind === 'sleep'
                      ? (lang === 'ar' ? 'مؤقت النوم يعمل' : 'Sleep timer active')
                      : (lang === 'ar' ? 'مؤقت الرضاعة يعمل' : 'Breastfeeding timer active')}
                  </p>
                  <p className="text-[12px] opacity-80">{lang === 'ar' ? 'انقري للمتابعة' : 'Tap to resume'}</p>
                </div>
              </div>
              <ChevronRight size={20} className="opacity-70" aria-hidden="true" />
            </button>
          </motion.div>
        )}

        {/* Pattern Whispers */}
        {settings.patternWhispers && !settings.calmMode && (
          <PatternWhisper logs={logs} babyName={babyProfile.name} />
        )}

        {/* ── Summary Cards 2×2 ── */}
        {!settings.calmMode && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-5"
          >
            <SummaryCard
              icon={<Milk size={14} className="text-primary" aria-hidden="true" />}
              label={t.lastFeeding}
              value={lastFeeding ? feedingTypeLabel[lastFeeding.feedingType] : t.noLogsYet}
              sub={lastFeeding ? timeAgo(lastFeeding.createdAt, lang) : t.tapToAdd}
              color="bg-feeding-tint"
              onClick={() => setSheet('feeding')}
            />
            <SummaryCard
              icon={<Moon size={14} className="text-primary" aria-hidden="true" />}
              label={t.lastSleep}
              value={lastSleep
                ? (lastSleep.durationMinutes ? formatDuration(lastSleep.durationMinutes, lang) : (lang === 'ar' ? 'جاري...' : 'Ongoing'))
                : t.noLogsYet}
              sub={lastSleep ? timeAgo(lastSleep.createdAt, lang) : t.tapToAdd}
              color="bg-sleep-soft"
              onClick={() => setSheet('sleep')}
            />
            <SummaryCard
              icon={<Droplets size={14} className="text-primary" aria-hidden="true" />}
              label={t.lastDiaper}
              value={lastDiaper ? diaperTypeLabel[lastDiaper.diaperType] : t.noLogsYet}
              sub={lastDiaper ? timeAgo(lastDiaper.createdAt, lang) : t.tapToAdd}
              color="bg-diaper-tint"
              onClick={() => setSheet('diaper')}
            />
            <SummaryCard
              icon={<Pill size={14} className="text-primary" aria-hidden="true" />}
              label={t.nextMedicine}
              value={nextMedicine ? nextMedicine.name : t.noLogsYet}
              sub={nextMedicine ? `${nextMedicine.dose} · ${nextMedicine.time}` : t.tapToAdd}
              color="bg-warm-soft"
              onClick={() => navigate('/medicine')}
            />
          </motion.div>
        )}

        {/* Next Appointment Banner */}
        {nextAppointment && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <SoftCard className="mb-5 bg-surface-sunk" onClick={() => navigate('/calendar')}>
              <div className="flex items-center gap-3">
                <IconCircle
                  icon={<ChevronRight size={16} className="text-primary" aria-hidden="true" />}
                  bg="bg-teal-soft"
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-text-hint lowercase">{t.nextAppointment}</p>
                  <p className="text-[14px] font-semibold text-text-primary truncate">{nextAppointment.title}</p>
                  <p className="text-[11px] text-primary">{nextAppointment.date} · {nextAppointment.time}</p>
                </div>
                <ChevronRight size={16} className="text-text-hint shrink-0" aria-hidden="true" />
              </div>
            </SoftCard>
          </motion.div>
        )}

        {/* Weekly Summary */}
        {logs.length > 0 && <WeeklySummaryCard logs={logs} />}

        {/* ── Quick Add ── */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <p className="font-display text-[16px] font-[500] text-text-primary mb-3">{t.quickAdd}</p>
          {/* Primary CTAs */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex flex-col">
              <PrimaryCTA
                icon={<Milk size={20} aria-hidden="true" />}
                iconBg="bg-feeding-tint"
                label={t.addFeeding}
                color="bg-feeding-tint"
                onClick={() => setSheet('feeding')}
              />
              {lastFeeding && <RepeatButton label={t.repeatLast} onClick={repeatFeeding} />}
            </div>
            <div className="flex flex-col">
              <PrimaryCTA
                icon={<Droplets size={20} aria-hidden="true" />}
                iconBg="bg-diaper-tint"
                label={t.addDiaper}
                color="bg-diaper-tint"
                onClick={() => setSheet('diaper')}
              />
              {lastDiaper && <RepeatButton label={t.repeatLast} onClick={repeatDiaper} />}
            </div>
          </div>
          {/* Secondary actions */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <QuickAction icon={<Moon size={16} aria-hidden="true" />} iconBg="bg-sleep-soft" label={t.addSleep} onClick={() => setSheet('sleep')} />
            <QuickAction icon={<Pill size={16} aria-hidden="true" />} iconBg="bg-warm-soft" label={t.addMedicine} onClick={() => navigate('/medicine')} />
            <QuickAction icon={<Scale size={16} aria-hidden="true" />} iconBg="bg-teal-soft" label={t.addWeight} onClick={() => setSheet('weight')} />
            <QuickAction icon={<FileText size={16} aria-hidden="true" />} iconBg="bg-teal-soft" label={t.addNote} onClick={() => setSheet('note')} />
          </div>
        </motion.div>

        {/* Recent Activity — "Today, gently" */}
        {logs.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-[16px] font-[500] text-text-primary">
                {t.recentActivityHeader}
              </p>
              <button
                className="text-[12px] text-primary font-semibold"
                onClick={() => navigate('/timeline')}
              >
                {lang === 'ar' ? 'عرض الكل' : 'See all'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {logs.slice(0, 3).map((log) => {
                const { icon, bg } = logIconInfo(log.type);
                return (
                  <SoftCard key={log.id} padding="p-3">
                    <div className="flex items-center gap-3">
                      <IconCircle icon={icon} bg={bg} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-text-primary capitalize">{logTypeLabel[log.type] || log.type}</p>
                        {log.notes && <p className="text-[11px] text-text-hint truncate">{log.notes}</p>}
                      </div>
                      <p className="text-[11px] text-text-hint shrink-0">{timeAgo(log.createdAt, lang)}</p>
                    </div>
                  </SoftCard>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Sheets */}
      <FeedingSheet isOpen={sheet === 'feeding'} onClose={() => setSheet(null)} />
      <SleepSheet isOpen={sheet === 'sleep'} onClose={() => setSheet(null)} />
      <DiaperSheet isOpen={sheet === 'diaper'} onClose={() => setSheet(null)} />
      <WeightSheet isOpen={sheet === 'weight'} onClose={() => setSheet(null)} />
      <NoteSheet isOpen={sheet === 'note'} onClose={() => setSheet(null)} />

      {/* Repeat-last toast with Undo */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 inset-x-0 z-50 flex justify-center px-5"
          >
            <div className="w-full max-w-mobile bg-text-primary text-surface rounded-[16px] px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium">{toast.message}</span>
              <button onClick={undoRepeat} className="text-[13px] font-bold text-primary-light shrink-0">
                {t.undo}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

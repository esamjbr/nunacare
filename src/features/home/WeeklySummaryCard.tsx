import { useMemo } from 'react';
import { X, Milk, Moon, Droplets, Clock } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useT } from '../../components/ui';
import { IconCircle } from '../../components/ui';
import type { AnyLog, SleepLog } from '../../types';

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function sevenDaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

interface WeeklySummaryCardProps { logs: AnyLog[]; }

export function WeeklySummaryCard({ logs }: WeeklySummaryCardProps) {
  const { lang } = useT();
  const { settings, updateSettings } = useStore();

  const currentWeek = isoWeekKey(new Date());
  const dismissed = settings.weeklySummaryDismissedWeek === currentWeek;

  const summary = useMemo(() => {
    const cutoff = sevenDaysAgo();
    const recent = logs.filter((l) => new Date(l.createdAt) >= cutoff);
    const feeds = recent.filter((l) => l.type === 'feeding').length;
    const sleeps = recent.filter((l) => l.type === 'sleep').length;
    const diapers = recent.filter((l) => l.type === 'diaper').length;
    const totalSleepMin = recent
      .filter((l): l is SleepLog => l.type === 'sleep')
      .reduce((acc, l) => acc + (l.durationMinutes ?? 0), 0);
    return { feeds, sleeps, diapers, totalSleepMin };
  }, [logs]);

  if (dismissed) return null;

  const totalSleepHours = Math.round(summary.totalSleepMin / 60 * 10) / 10;
  const dismiss = () => updateSettings({ weeklySummaryDismissedWeek: currentWeek });

  return (
    <div className="bg-surface rounded-[18px] border border-border-hairline/[.18] p-[14px] mb-5 relative">
      <button
        onClick={dismiss}
        className="absolute top-3 end-3 w-6 h-6 flex items-center justify-center text-text-hint"
        aria-label={lang === 'ar' ? 'إغلاق' : 'Dismiss'}
      >
        <X size={14} aria-hidden="true" />
      </button>

      <p className="text-[11px] font-medium text-text-faint mb-3 lowercase tracking-[0.05em]">
        {lang === 'ar' ? 'آخر ٧ أيام' : 'last 7 days'}
      </p>

      <div className="grid grid-cols-4 gap-2">
        <SummaryTile icon={<Milk size={14} aria-hidden="true" />} bg="bg-feeding-tint" value={summary.feeds} label={lang === 'ar' ? 'رضعات' : 'Feeds'} />
        <SummaryTile icon={<Moon size={14} aria-hidden="true" />} bg="bg-sleep-soft" value={summary.sleeps} label={lang === 'ar' ? 'نومات' : 'Sleeps'} />
        <SummaryTile icon={<Droplets size={14} aria-hidden="true" />} bg="bg-diaper-tint" value={summary.diapers} label={lang === 'ar' ? 'حفاضات' : 'Diapers'} />
        <SummaryTile icon={<Clock size={14} aria-hidden="true" />} bg="bg-teal-soft" value={`${totalSleepHours}h`} label={lang === 'ar' ? 'نوم' : 'Sleep'} />
      </div>
    </div>
  );
}

function SummaryTile({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-soft-surface rounded-[12px] p-2">
      <IconCircle icon={icon} bg={bg} size="sm" />
      <span className="text-[13px] font-bold text-text-primary">{value}</span>
      <span className="text-[10px] text-text-hint text-center leading-tight">{label}</span>
    </div>
  );
}

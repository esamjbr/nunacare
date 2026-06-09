import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Milk, Moon, Droplets, Pill, Scale, FileText, Clock, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useT, EmptyState, Pill as PillChip, ConfirmModal, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { timeAgo, formatTime, todayISO } from '../../utils/dateHelpers';
import type { AnyLog } from '../../types';

type FilterType = 'all' | 'feeding' | 'sleep' | 'diaper' | 'medicine' | 'weight' | 'note';

type IconInfo = { icon: React.ReactNode; bg: string };

function logIconInfo(type: string): IconInfo {
  const map: Record<string, IconInfo> = {
    feeding:  { icon: <Milk     size={14} aria-hidden="true" />, bg: 'bg-feeding-tint' },
    sleep:    { icon: <Moon     size={14} aria-hidden="true" />, bg: 'bg-sleep-soft' },
    diaper:   { icon: <Droplets size={14} aria-hidden="true" />, bg: 'bg-diaper-tint' },
    medicine: { icon: <Pill     size={14} aria-hidden="true" />, bg: 'bg-warm-soft' },
    weight:   { icon: <Scale    size={14} aria-hidden="true" />, bg: 'bg-teal-soft' },
    note:     { icon: <FileText size={14} aria-hidden="true" />, bg: 'bg-soft-surface' },
  };
  return map[type] ?? { icon: <Clock size={14} aria-hidden="true" />, bg: 'bg-soft-surface' };
}

function LogSummary({ log }: { log: AnyLog }) {
  const lines: string[] = [];
  if (log.type === 'feeding') {
    lines.push(log.feedingType);
    if (log.amount) lines.push(`${log.amount}ml`);
    if (log.side) lines.push(log.side);
    if (log.durationMinutes) lines.push(`${log.durationMinutes}min`);
  } else if (log.type === 'sleep') {
    lines.push(log.sleepType);
    if (log.durationMinutes) lines.push(`${log.durationMinutes}min`);
  } else if (log.type === 'diaper') {
    lines.push(log.diaperType);
    if (log.color) lines.push(log.color);
  } else if (log.type === 'weight') {
    lines.push(`${log.value} ${log.unit}`);
  } else if (log.type === 'note') {
    if (log.title) lines.push(log.title);
  }
  if (log.notes) lines.push(log.notes);
  return <p className="text-[12px] text-text-hint">{lines.filter(Boolean).join(' · ')}</p>;
}

function dayKey(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}


export function TimelineScreen() {
  const { t, lang } = useT();
  const { logs, deleteLog } = useStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const today = todayISO();
  const isToday = selectedDate === today;

  function shiftDay(delta: number) {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const next = d.toISOString().slice(0, 10);
    if (next <= today) setSelectedDate(next);
  }

  function formatNavDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    if (lang === 'ar') return d.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: t.all },
    { value: 'feeding', label: t.feeding },
    { value: 'sleep', label: t.sleep },
    { value: 'diaper', label: t.diaper },
    { value: 'medicine', label: t.medicine },
    { value: 'weight', label: t.weight },
    { value: 'note', label: t.note },
  ];

  const grouped = useMemo(() => {
    const byType = filter === 'all' ? logs : logs.filter((l) => l.type === filter);
    const byDate = byType.filter((l) => dayKey(l.createdAt) === selectedDate);
    const sorted = [...byDate].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted;
  }, [logs, filter, selectedDate]);

  return (
    <AppShell title={t.timelineTitle} showNav>
      {/* Date nav */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => shiftDay(-1)}
          aria-label={lang === 'ar' ? 'اليوم السابق' : 'Previous day'}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-soft-surface text-text-secondary min-h-[44px] min-w-[44px]"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <button
          onClick={() => dateInputRef.current?.showPicker?.()}
          className="relative flex-1 flex items-center justify-center gap-1.5 h-9 bg-soft-surface rounded-full text-[13px] font-medium text-text-primary min-h-[44px]"
          aria-label={lang === 'ar' ? 'اختر يوماً' : 'Pick a date'}
        >
          <CalendarDays size={14} className="text-primary" aria-hidden="true" />
          {isToday ? (lang === 'ar' ? 'اليوم' : 'Today') : formatNavDate(selectedDate)}
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            aria-hidden="true"
            tabIndex={-1}
          />
        </button>

        <button
          onClick={() => shiftDay(1)}
          disabled={isToday}
          aria-label={lang === 'ar' ? 'اليوم التالي' : 'Next day'}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-soft-surface text-text-secondary min-h-[44px] min-w-[44px] disabled:opacity-30"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Filter chips */}
      <div className="-mx-5 px-5 mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
          {filters.map((f) => (
            <PillChip key={f.value} label={f.label} active={filter === f.value} onClick={() => setFilter(f.value)} />
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <EmptyState icon={<Clock size={28} />} tint="bg-teal-soft" title={t.noTimelineLogs} subtitle={t.noTimelineLogsSub} />
      ) : (
        <div className="relative">
          {/* vertical line */}
          <div className="absolute top-0 bottom-0 start-[18px] w-px bg-border-hairline/[.25]" />

          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {grouped.map((log: AnyLog, i: number) => {
                const { icon, bg } = logIconInfo(log.type);
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex gap-3 ps-10 relative"
                  >
                    {/* Timeline dot */}
                    <div className="absolute start-3 top-2 z-10">
                      <IconCircle icon={icon} bg={bg} size="sm" />
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-surface rounded-[18px] border border-border-hairline/[.18] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-semibold text-text-primary capitalize">{log.type}</span>
                            <span className="text-[11px] text-text-hint">{formatTime(log.time)}</span>
                          </div>
                          <LogSummary log={log} />
                          {log.createdByName && (
                            <p className="text-[11px] text-text-hint mt-1">
                              {lang === 'ar' ? `سجّله: ${log.createdByName}` : `by ${log.createdByName}`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] text-text-hint">{timeAgo(log.createdAt, lang)}</span>
                          <button
                            onClick={() => setConfirmId(log.id)}
                            aria-label={lang === 'ar' ? 'حذف السجل' : 'Delete log'}
                            className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                          >
                            <Trash2 size={12} className="text-text-hint" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmId}
        title={lang === 'ar' ? 'حذف السجل' : 'Delete Log'}
        message={lang === 'ar' ? 'هل تريد حذف هذا السجل؟' : 'Are you sure you want to delete this log?'}
        confirmLabel={t.delete} cancelLabel={t.cancel} danger
        onConfirm={() => { if (confirmId) deleteLog(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
      />
    </AppShell>
  );
}

import { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { useT } from '../../components/ui';
import { timeAgo } from '../../utils/dateHelpers';
import type { AnyLog, FeedingLog, SleepLog, DiaperLog } from '../../types';

const PREDICTION_WINDOW_MS = 45 * 60 * 1000;
const MIN_DAYS = 7;
const MIN_LOGS = 20;

function medianInterval(timestamps: number[]): number | null {
  if (timestamps.length < 2) return null;
  const sorted = [...timestamps].sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i] - sorted[i - 1]);
  }
  intervals.sort((a, b) => a - b);
  const mid = Math.floor(intervals.length / 2);
  return intervals.length % 2 === 0
    ? (intervals[mid - 1] + intervals[mid]) / 2
    : intervals[mid];
}

function hasEnoughHistory(logs: AnyLog[], type: string): boolean {
  const typed = logs.filter((l) => l.type === type);
  if (typed.length < MIN_LOGS) return false;
  const oldest = typed.reduce((min, l) =>
    new Date(l.createdAt).getTime() < min ? new Date(l.createdAt).getTime() : min,
    Infinity,
  );
  const daysOfData = (Date.now() - oldest) / (24 * 60 * 60 * 1000);
  return daysOfData >= MIN_DAYS;
}

function predictedNextTime(logs: AnyLog[], type: string): number | null {
  if (!hasEnoughHistory(logs, type)) return null;
  const typed = logs.filter((l) => l.type === type);
  const timestamps = typed.map((l) => new Date(l.createdAt).getTime());
  const interval = medianInterval(timestamps);
  if (!interval) return null;
  const latest = Math.max(...timestamps);
  return latest + interval;
}

interface PatternWhisperProps {
  logs: AnyLog[];
  babyName: string;
}

export function PatternWhisper({ logs, babyName }: PatternWhisperProps) {
  const { t, lang } = useT();
  const now = Date.now();

  const whispers = useMemo(() => {
    const results: { key: string; text: string }[] = [];

    const feedingLogs = logs.filter((l): l is FeedingLog => l.type === 'feeding');
    const sleepLogs = logs.filter((l): l is SleepLog => l.type === 'sleep');
    const diaperLogs = logs.filter((l): l is DiaperLog => l.type === 'diaper');

    if (feedingLogs.length > 0) {
      const last = feedingLogs.reduce((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? a : b,
      );
      results.push({ key: 'last-feeding', text: t.whisperLastFeedingAgo(timeAgo(last.createdAt, lang)) });

      const predicted = predictedNextTime(logs, 'feeding');
      if (predicted !== null && Math.abs(now - predicted) <= PREDICTION_WINDOW_MS) {
        results.push({ key: 'feeding-pattern', text: t.whisperUsuallyFeedsNow(babyName) });
      }
    }

    if (sleepLogs.length > 0) {
      const last = sleepLogs.reduce((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? a : b,
      );
      results.push({ key: 'last-sleep', text: t.whisperLastSleepAgo(timeAgo(last.createdAt, lang)) });

      const predicted = predictedNextTime(logs, 'sleep');
      if (predicted !== null && Math.abs(now - predicted) <= PREDICTION_WINDOW_MS) {
        results.push({ key: 'sleep-pattern', text: t.whisperUsuallyNapsNow(babyName) });
      }
    }

    if (diaperLogs.length > 0) {
      const last = diaperLogs.reduce((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? a : b,
      );
      results.push({ key: 'last-diaper', text: t.whisperLastDiaperAgo(timeAgo(last.createdAt, lang)) });
    }

    return results;
  }, [logs, babyName, lang, now, t]);

  if (whispers.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-5">
      {whispers.map((w) => (
        <div
          key={w.key}
          className="flex items-center gap-2 px-3 py-2 bg-surface-sunk rounded-[14px] border border-border-hairline/[.15]"
        >
          <MessageCircle size={14} className="text-primary shrink-0" aria-hidden="true" />
          <p className="text-[12px] text-text-secondary leading-snug">{w.text}</p>
        </div>
      ))}
    </div>
  );
}

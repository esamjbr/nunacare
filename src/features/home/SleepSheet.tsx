import { useState, useEffect } from 'react';
import { Moon, Play, Square } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { SegmentedControl, FormInput, FormTextArea, PrimaryButton, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useT } from '../../components/ui';
import { generateId, nowISO, calcSleepDuration, formatDuration } from '../../utils/dateHelpers';
import type { SleepLog } from '../../types';

interface SleepSheetProps { isOpen: boolean; onClose: () => void; }

function nowTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

export function SleepSheet({ isOpen, onClose }: SleepSheetProps) {
  const { t, lang } = useT();
  const addLog = useStore((s) => s.addLog);
  const activeTimer = useStore((s) => s.activeTimer);
  const setActiveTimer = useStore((s) => s.setActiveTimer);

  const activeSleepTimer = activeTimer?.kind === 'sleep' ? activeTimer : null;

  const [sleepType, setSleepType] = useState<SleepLog['sleepType']>('nap');
  const [startTime, setStartTime] = useState(nowTimeStr());
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (activeSleepTimer) {
      setSleepType(activeSleepTimer.meta.sleepType ?? 'nap');
      const start = new Date(activeSleepTimer.startTimestamp);
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      setElapsed(Math.floor((Date.now() - activeSleepTimer.startTimestamp) / 1000));
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeSleepTimer.startTimestamp) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [activeSleepTimer]);

  useEffect(() => {
    if (isOpen && !activeSleepTimer && !endTime) {
      setStartTime(nowTimeStr());
    }
  }, [isOpen, activeSleepTimer, endTime]);

  const timerRunning = activeSleepTimer !== null;

  const handleStartTimer = () => {
    setActiveTimer({ kind: 'sleep', startTimestamp: Date.now(), meta: { sleepType } });
  };

  const handleStopTimer = () => {
    setActiveTimer(null);
    setEndTime(nowTimeStr());
  };

  const handleSave = () => {
    const today = new Date().toISOString().slice(0,10);
    const startISO = `${today}T${startTime}:00`;
    let endISO = endTime ? `${today}T${endTime}:00` : undefined;

    if (activeSleepTimer && !endTime) {
      const nowStr = nowTimeStr();
      endISO = `${today}T${nowStr}:00`;
    }

    const duration = endISO ? calcSleepDuration(startISO, endISO) : Math.floor(elapsed / 60);

    const log: SleepLog = {
      id: generateId(), type: 'sleep', sleepType,
      startTime: startISO, endTime: endISO,
      durationMinutes: duration,
      time: startTime,
      notes: notes || undefined,
      createdAt: nowISO(),
    };
    addLog(log);
    setActiveTimer(null);
    setNotes(''); setEndTime(''); setStartTime(nowTimeStr());
    onClose();
  };

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.addSleep}>
      <div className="flex flex-col gap-4 pb-4">
        {/* Hero */}
        <div className="flex flex-col items-center gap-2 py-2">
          <IconCircle icon={<Moon size={28} aria-hidden="true" />} bg="bg-sleep-soft" size="xl" />
        </div>

        {/* Type */}
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{lang === 'ar' ? 'النوع' : 'type'}</p>
          <SegmentedControl
            options={[
              { value: 'nap', label: t.nap },
              { value: 'night', label: t.nightSleep },
            ]}
            value={sleepType}
            onChange={(v) => setSleepType(v as SleepLog['sleepType'])}
          />
        </div>

        {/* Timer */}
        <div className="bg-soft-surface rounded-[14px] p-4 text-center">
          {timerRunning ? (
            <>
              <p className="font-display text-[36px] font-[500] text-primary tabular-nums">{formatElapsed(elapsed)}</p>
              <p className="text-[11px] text-text-hint mt-1">{lang === 'ar' ? 'المؤقت يعمل...' : 'Timer running...'}</p>
              <button
                onClick={handleStopTimer}
                className="mt-3 bg-primary text-surface px-6 py-2 rounded-full text-[13px] font-semibold flex items-center gap-1.5 mx-auto"
              >
                <Square size={13} aria-hidden="true" />
                {t.stopTimer}
              </button>
            </>
          ) : (
            <button
              onClick={handleStartTimer}
              className="bg-surface text-primary px-6 py-2 rounded-full text-[13px] font-semibold border border-border-hairline/[.3] flex items-center gap-1.5 mx-auto"
            >
              <Play size={13} aria-hidden="true" />
              {t.startTimer}
            </button>
          )}
        </div>

        <FormInput label={lang === 'ar' ? 'وقت البداية' : 'start'} value={startTime} onChange={setStartTime} type="time" />
        <FormInput label={lang === 'ar' ? 'وقت النهاية' : 'end'} value={endTime} onChange={setEndTime} type="time" />

        {startTime && endTime && (
          <p className="text-[12px] text-text-hint text-center">
            {lang === 'ar' ? 'المدة: ' : 'duration: '}
            {formatDuration(calcSleepDuration(`2000-01-01T${startTime}:00`, `2000-01-01T${endTime}:00`), lang)}
          </p>
        )}

        <FormTextArea label={lang === 'ar' ? 'ملاحظة' : 'a small note'} value={notes} onChange={setNotes} placeholder={t.notePlaceholder} />

        <PrimaryButton onClick={handleSave}>{t.save}</PrimaryButton>
      </div>
    </BottomSheet>
  );
}

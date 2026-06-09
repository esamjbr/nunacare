import { useState, useEffect } from 'react';
import { Milk, Play, Square } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { SegmentedControl, FormInput, FormTextArea, PrimaryButton, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useT } from '../../components/ui';
import { generateId, nowISO } from '../../utils/dateHelpers';
import type { FeedingLog } from '../../types';

interface FeedingSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

function currentTimeStr() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

export function FeedingSheet({ isOpen, onClose }: FeedingSheetProps) {
  const { t, lang } = useT();
  const addLog = useStore((s) => s.addLog);
  const activeTimer = useStore((s) => s.activeTimer);
  const setActiveTimer = useStore((s) => s.setActiveTimer);

  const activeBreastTimer = activeTimer?.kind === 'breastfeeding' ? activeTimer : null;

  const [feedingType, setFeedingType] = useState<FeedingLog['feedingType']>('breast');
  const [time, setTime] = useState(currentTimeStr());
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState<FeedingLog['side']>('left');
  const [notes, setNotes] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (activeBreastTimer) {
      const timerSide = activeBreastTimer.meta.side ?? 'left';
      setSide(timerSide);
      setElapsed(Math.floor((Date.now() - activeBreastTimer.startTimestamp) / 1000));
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeBreastTimer.startTimestamp) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [activeBreastTimer]);

  useEffect(() => {
    if (isOpen && !activeBreastTimer) {
      setTime(currentTimeStr());
    }
  }, [isOpen, activeBreastTimer]);

  const timerRunning = activeBreastTimer !== null;

  const handleStartTimer = () => {
    setActiveTimer({ kind: 'breastfeeding', startTimestamp: Date.now(), meta: { side } });
  };

  const handleStopTimer = () => {
    setActiveTimer(null);
  };

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const handleSave = () => {
    let durationMinutes: number | undefined;
    if (activeBreastTimer) {
      durationMinutes = Math.max(1, Math.round((Date.now() - activeBreastTimer.startTimestamp) / 60000));
    } else if (timerRunning) {
      durationMinutes = Math.max(1, Math.floor(elapsed / 60));
    }

    const log: FeedingLog = {
      id: generateId(), type: 'feeding', feedingType, time,
      amount: amount ? parseFloat(amount) : undefined,
      side: feedingType === 'breast' ? side : undefined,
      durationMinutes,
      notes: notes || undefined,
      createdAt: nowISO(),
    };
    addLog(log);
    if (activeBreastTimer) setActiveTimer(null);
    setAmount(''); setNotes(''); setTime(currentTimeStr());
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.addFeeding}>
      <div className="flex flex-col gap-4 pb-4">
        {/* Hero */}
        <div className="flex flex-col items-center gap-2 py-2">
          <IconCircle icon={<Milk size={28} aria-hidden="true" />} bg="bg-feeding-tint" size="xl" />
          <p className="font-display italic text-[15px] text-text-secondary font-[400]">{t.feedingHeroLine}</p>
        </div>

        {/* Type chips */}
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{lang === 'ar' ? 'النوع' : 'type'}</p>
          <SegmentedControl
            options={[
              { value: 'breast', label: lang === 'ar' ? t.breast : 'Breast' },
              { value: 'bottle', label: lang === 'ar' ? t.bottle : 'Bottle' },
              { value: 'formula', label: lang === 'ar' ? t.formula : 'Formula' },
              { value: 'solid', label: lang === 'ar' ? t.solid : 'Solid' },
            ]}
            value={feedingType}
            onChange={(v) => {
              setFeedingType(v as FeedingLog['feedingType']);
              if (v !== 'breast' && activeBreastTimer) setActiveTimer(null);
            }}
          />
        </div>

        {/* Breastfeeding timer */}
        {feedingType === 'breast' && (
          <div className="bg-soft-surface rounded-[14px] p-4 text-center">
            {timerRunning ? (
              <>
                <p className="font-display text-[36px] font-[500] text-primary font-mono tabular-nums">{formatElapsed(elapsed)}</p>
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
        )}

        {/* When */}
        <FormInput label={lang === 'ar' ? 'متى' : 'when'} value={time} onChange={setTime} type="time" />

        {/* Amount stepper area */}
        {(feedingType === 'bottle' || feedingType === 'formula') && (
          <FormInput label={lang === 'ar' ? 'الكمية (مل)' : 'amount'} value={amount} onChange={setAmount} type="number" placeholder="120" />
        )}

        {/* Breast side */}
        {feedingType === 'breast' && (
          <div>
            <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{lang === 'ar' ? 'الجانب' : 'side'}</p>
            <SegmentedControl
              options={[
                { value: 'left', label: t.left },
                { value: 'right', label: t.right },
                { value: 'both', label: t.both },
              ]}
              value={side!}
              onChange={(v) => setSide(v as FeedingLog['side'])}
            />
          </div>
        )}

        {/* Note */}
        <FormTextArea label={lang === 'ar' ? 'ملاحظة' : 'a small note'} value={notes} onChange={setNotes} placeholder={t.notePlaceholder} />

        {/* Actions */}
        <PrimaryButton onClick={handleSave}>{t.save}</PrimaryButton>
      </div>
    </BottomSheet>
  );
}

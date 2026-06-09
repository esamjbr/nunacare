import { useState } from 'react';
import { Droplets } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { SegmentedControl, FormInput, FormTextArea, PrimaryButton, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useT } from '../../components/ui';
import { generateId, nowISO } from '../../utils/dateHelpers';
import type { DiaperLog } from '../../types';

interface DiaperSheetProps { isOpen: boolean; onClose: () => void; }

function nowTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

export function DiaperSheet({ isOpen, onClose }: DiaperSheetProps) {
  const { t, lang } = useT();
  const addLog = useStore((s) => s.addLog);

  const [diaperType, setDiaperType] = useState<DiaperLog['diaperType']>('wet');
  const [time, setTime] = useState(nowTimeStr());
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const log: DiaperLog = {
      id: generateId(), type: 'diaper', diaperType, time,
      color: color || undefined,
      notes: notes || undefined,
      createdAt: nowISO(),
    };
    addLog(log);
    setColor(''); setNotes(''); setTime(nowTimeStr());
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.addDiaper}>
      <div className="flex flex-col gap-4 pb-4">
        {/* Hero */}
        <div className="flex flex-col items-center gap-2 py-2">
          <IconCircle icon={<Droplets size={28} aria-hidden="true" />} bg="bg-diaper-tint" size="xl" />
        </div>

        {/* Type */}
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{lang === 'ar' ? 'النوع' : 'type'}</p>
          <SegmentedControl
            options={[
              { value: 'wet', label: t.wet },
              { value: 'dirty', label: t.dirty },
              { value: 'mixed', label: lang === 'ar' ? 'مختلط' : 'Mixed' },
            ]}
            value={diaperType}
            onChange={(v) => setDiaperType(v as DiaperLog['diaperType'])}
          />
        </div>

        <FormInput label={lang === 'ar' ? 'متى' : 'when'} value={time} onChange={setTime} type="time" />

        {/* Color chips */}
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">
            {lang === 'ar' ? 'اللون (اختياري)' : 'color (optional)'}
          </p>
          <div className="flex gap-2 flex-wrap">
            {['Yellow', 'Green', 'Brown', 'Dark', 'Black'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(color === c ? '' : c)}
                className={`px-3 py-1.5 rounded-[10px] text-[13px] border transition-all ${
                  color === c ? 'bg-primary text-surface border-primary' : 'bg-soft-surface text-text-secondary border-border-hairline/[.25]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <FormTextArea label={lang === 'ar' ? 'ملاحظة' : 'a small note'} value={notes} onChange={setNotes} placeholder={t.notePlaceholder} />

        <PrimaryButton onClick={handleSave}>{t.save}</PrimaryButton>
      </div>
    </BottomSheet>
  );
}

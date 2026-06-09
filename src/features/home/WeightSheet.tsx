import { useState } from 'react';
import { Scale } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { FormInput, FormTextArea, PrimaryButton, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useT } from '../../components/ui';
import { generateId, nowISO } from '../../utils/dateHelpers';
import type { WeightLog } from '../../types';

interface WeightSheetProps { isOpen: boolean; onClose: () => void; }

export function WeightSheet({ isOpen, onClose }: WeightSheetProps) {
  const { t, lang } = useT();
  const { addLog, addWeight } = useStore();

  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!value || isNaN(parseFloat(value))) { setError(lang === 'ar' ? 'أدخل وزناً صحيحاً' : 'Please enter a valid weight'); return; }

    const w = parseFloat(value);
    addWeight({ value: w, unit: 'kg', date, notes: notes || undefined });

    const log: WeightLog = {
      id: generateId(), type: 'weight',
      value: w, unit: 'kg', date,
      time: new Date().toTimeString().slice(0,5),
      notes: notes || undefined,
      createdAt: nowISO(),
    };
    addLog(log);

    setValue(''); setNotes(''); setError('');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.addWeight2}>
      <div className="flex flex-col gap-4 pb-4">
        {/* Hero */}
        <div className="flex flex-col items-center gap-2 py-2">
          <IconCircle icon={<Scale size={28} aria-hidden="true" />} bg="bg-teal-soft" size="xl" />
        </div>

        <div className="flex gap-3">
          <FormInput
            label={lang === 'ar' ? 'الوزن (كغ)' : 'weight (kg)'}
            value={value}
            onChange={(v) => { setValue(v); setError(''); }}
            type="number"
            placeholder="6.5"
            className="flex-1"
          />
          <FormInput label={lang === 'ar' ? 'التاريخ' : 'date'} value={date} onChange={setDate} type="date" className="flex-1" />
        </div>

        <FormTextArea label={lang === 'ar' ? 'ملاحظة' : 'a small note'} value={notes} onChange={setNotes} placeholder={t.notePlaceholder} />

        {error && <p className="text-[13px] text-error-text">{error}</p>}

        <PrimaryButton onClick={handleSave}>{t.save}</PrimaryButton>
      </div>
    </BottomSheet>
  );
}

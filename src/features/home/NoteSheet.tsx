import { useState } from 'react';
import { FileText } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { FormInput, FormTextArea, PrimaryButton, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useT } from '../../components/ui';
import { generateId, nowISO } from '../../utils/dateHelpers';
import type { NoteLog } from '../../types';

interface NoteSheetProps { isOpen: boolean; onClose: () => void; }

export function NoteSheet({ isOpen, onClose }: NoteSheetProps) {
  const { t, lang } = useT();
  const addLog = useStore((s) => s.addLog);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!notes.trim() && !title.trim()) return;
    const log: NoteLog = {
      id: generateId(), type: 'note',
      title: title || undefined,
      notes: notes || undefined,
      time: new Date().toTimeString().slice(0,5),
      createdAt: nowISO(),
    };
    addLog(log);
    setTitle(''); setNotes('');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={lang === 'ar' ? 'إضافة ملاحظة' : 'Add Note'}>
      <div className="flex flex-col gap-4 pb-4">
        {/* Hero */}
        <div className="flex flex-col items-center gap-2 py-2">
          <IconCircle icon={<FileText size={28} aria-hidden="true" />} bg="bg-teal-soft" size="xl" />
        </div>

        <FormInput
          label={lang === 'ar' ? 'العنوان (اختياري)' : 'title (optional)'}
          value={title}
          onChange={setTitle}
          placeholder={lang === 'ar' ? 'مثال: ابتسامته الأولى اليوم!' : 'e.g. First smile today!'}
        />
        <FormTextArea
          label={lang === 'ar' ? 'الملاحظة' : 'note'}
          value={notes}
          onChange={setNotes}
          placeholder={t.notePlaceholder}
          rows={5}
        />
        <PrimaryButton onClick={handleSave}>{t.save}</PrimaryButton>
      </div>
    </BottomSheet>
  );
}

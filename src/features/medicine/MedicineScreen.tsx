import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Trash2, Pill } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, SafetyNotice, PrimaryButton, SecondaryButton, FormInput, FormTextArea, Toggle, EmptyState, Badge, ConfirmModal, IconCircle } from '../../components/ui';
import { BottomSheet } from '../../components/BottomSheet';
import { useStore } from '../../store/useStore';
import type { Medicine } from '../../types';
import { todayISO } from '../../utils/dateHelpers';

function AddMedicineSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const { addMedicine } = useStore();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [time, setTime] = useState('08:00');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError(lang === 'ar' ? 'أدخل اسم الدواء' : 'Enter medicine name'); return; }
    if (!dose.trim()) { setError(lang === 'ar' ? 'أدخل الجرعة' : 'Enter dose'); return; }
    addMedicine({ name: name.trim(), dose, frequency, time, startDate, endDate: endDate || undefined, reminderEnabled, notes: notes || undefined });
    setName(''); setDose(''); setFrequency(''); setNotes(''); setError('');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.addMedicineBtn}>
      <div className="flex flex-col gap-4 pb-4">
        <FormInput label={lang === 'ar' ? 'اسم الدواء' : 'medicine name'} value={name} onChange={setName} placeholder={lang === 'ar' ? 'مثال: فيتامين د' : 'e.g. Vitamin D Drops'} required />
        <div className="flex gap-3">
          <FormInput label={t.dose} value={dose} onChange={setDose} placeholder="400 IU" className="flex-1" />
          <FormInput label={t.frequency} value={frequency} onChange={setFrequency} placeholder={lang === 'ar' ? 'مرة يومياً' : 'Once daily'} className="flex-1" />
        </div>
        <FormInput label={lang === 'ar' ? 'وقت الجرعة' : 'dose time'} value={time} onChange={setTime} type="time" />
        <div className="flex gap-3">
          <FormInput label={t.startDate} value={startDate} onChange={setStartDate} type="date" className="flex-1" />
          <FormInput label={t.endDate} value={endDate} onChange={setEndDate} type="date" className="flex-1" />
        </div>
        <div className="flex items-center justify-between bg-soft-surface rounded-[14px] px-4 py-3 min-h-[44px]">
          <div>
            <p className="text-[14px] font-semibold text-text-primary">{t.reminder}</p>
            <p className="text-[12px] text-text-hint">{lang === 'ar' ? 'تذكير داخل التطبيق' : 'In-app reminder'}</p>
          </div>
          <Toggle enabled={reminderEnabled} onChange={setReminderEnabled} />
        </div>
        <FormTextArea label={t.notes} value={notes} onChange={setNotes} rows={2} />
        {error && <p className="text-[13px] text-error-text">{error}</p>}
        <div className="flex gap-3 pt-2">
          <SecondaryButton onClick={onClose} fullWidth={false} className="flex-1">{t.cancel}</SecondaryButton>
          <PrimaryButton onClick={handleSave} fullWidth={false} className="flex-1">{t.save}</PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}

export function MedicineScreen() {
  const { t, lang } = useT();
  const { medicines, deleteMedicine } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set());

  const today = todayISO();
  const activeMeds = medicines.filter((m) => !m.endDate || m.endDate >= today);
  const pastMeds = medicines.filter((m) => m.endDate && m.endDate < today);

  const toggleTaken = (id: string) => {
    setTakenIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setMissedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };
  const toggleMissed = (id: string) => {
    setMissedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setTakenIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  function MedCard({ med }: { med: Medicine }) {
    const isTaken = takenIds.has(med.id);
    const isMissed = missedIds.has(med.id);
    const iconBg = isTaken ? 'bg-success-soft' : isMissed ? 'bg-error-soft' : 'bg-warm-soft';
    return (
      <SoftCard className={`transition-all ${isTaken ? 'opacity-70' : ''}`}>
        <div className="flex items-start gap-3">
          <IconCircle icon={<Pill size={16} aria-hidden="true" />} bg={iconBg} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-text-primary">{med.name}</p>
              {isTaken && <Badge label={t.taken} color="soft" />}
              {isMissed && <Badge label={t.missed} color="error" />}
            </div>
            <p className="text-[12px] text-text-hint">{med.dose} · {med.frequency}</p>
            <p className="text-[12px] text-primary font-medium">{lang === 'ar' ? 'الوقت: ' : 'Time: '}{med.time}</p>
          </div>
          <button
            onClick={() => setConfirmId(med.id)}
            aria-label={lang === 'ar' ? 'حذف الدواء' : 'Delete medicine'}
            className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Trash2 size={12} className="text-text-hint" aria-hidden="true" />
          </button>
        </div>

        <div className="flex gap-2 mt-3 pt-3 border-t border-border-hairline/[.15]">
          <button
            onClick={() => toggleTaken(med.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all min-h-[44px] ${isTaken ? 'bg-success-soft text-success-text' : 'bg-soft-surface text-text-secondary'}`}
          >
            <Check size={13} aria-hidden="true" />{t.markTaken}
          </button>
          <button
            onClick={() => toggleMissed(med.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all min-h-[44px] ${isMissed ? 'bg-error-soft text-error-text' : 'bg-soft-surface text-text-secondary'}`}
          >
            <X size={13} aria-hidden="true" />{t.markMissed}
          </button>
        </div>
      </SoftCard>
    );
  }

  return (
    <AppShell title={t.medicineTitle} showNav headerRight={
      <button
        onClick={() => setShowAdd(true)}
        aria-label={lang === 'ar' ? 'إضافة دواء' : 'Add medicine'}
        className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Plus size={18} className="text-surface" aria-hidden="true" />
      </button>
    }>
      <SafetyNotice text={t.medicineSafety} className="mb-4" />

      <div className="mb-5">
        <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-3">{t.todaysDoses}</p>
        {activeMeds.length === 0 ? (
          <EmptyState icon={<Pill size={28} />} tint="bg-warm-soft" title={t.noMedicines} subtitle={t.noMedicinesSub} />
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {activeMeds.map((med, i) => (
                <motion.div key={med.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <MedCard med={med} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {pastMeds.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-3">{t.medicineHistory}</p>
          <div className="flex flex-col gap-2">
            {pastMeds.map((med) => (
              <SoftCard key={med.id} className="opacity-50">
                <div className="flex items-center gap-3">
                  <IconCircle icon={<Pill size={14} aria-hidden="true" />} bg="bg-warm-soft" size="sm" />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-text-primary">{med.name}</p>
                    <p className="text-[11px] text-text-hint">{med.dose} · {lang === 'ar' ? 'انتهى: ' : 'Ended: '}{med.endDate}</p>
                  </div>
                </div>
              </SoftCard>
            ))}
          </div>
        </div>
      )}

      <AddMedicineSheet isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ConfirmModal
        isOpen={!!confirmId} title={lang === 'ar' ? 'حذف الدواء' : 'Delete Medicine'}
        message={lang === 'ar' ? 'هل تريد حذف هذا الدواء؟' : 'Delete this medicine?'}
        confirmLabel={t.delete} cancelLabel={t.cancel} danger
        onConfirm={() => { if (confirmId) deleteMedicine(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
      />
    </AppShell>
  );
}

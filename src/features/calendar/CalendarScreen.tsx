import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ChevronLeft, ChevronRight, Stethoscope, Activity, Pill, Scale, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, PrimaryButton, FormInput, FormTextArea, EmptyState, ConfirmModal, IconCircle } from '../../components/ui';
import { BottomSheet } from '../../components/BottomSheet';
import { useStore } from '../../store/useStore';
import type { AppointmentType } from '../../types';

type TypeInfo = { icon: React.ReactNode; bg: string; enLabel: string; arLabel: string };

const TYPE_INFO: Record<AppointmentType, TypeInfo> = {
  pediatrician: { icon: <Stethoscope size={16} aria-hidden="true" />, bg: 'bg-feeding-tint', enLabel: 'Pediatrician', arLabel: 'طبيب أطفال' },
  vaccine:      { icon: <Activity    size={16} aria-hidden="true" />, bg: 'bg-teal-soft',    enLabel: 'Vaccine',      arLabel: 'لقاح' },
  medicine:     { icon: <Pill        size={16} aria-hidden="true" />, bg: 'bg-warm-soft',    enLabel: 'Medicine',     arLabel: 'دواء' },
  'weight-check':{ icon: <Scale      size={16} aria-hidden="true" />, bg: 'bg-sleep-soft',   enLabel: 'Weight Check', arLabel: 'فحص الوزن' },
  other:        { icon: <CalendarDays size={16} aria-hidden="true" />, bg: 'bg-soft-surface', enLabel: 'Other',        arLabel: 'أخرى' },
};

function AddAppointmentSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const { addAppointment } = useStore();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AppointmentType>('pediatrician');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim()) { setError(lang === 'ar' ? 'أدخل عنوان الموعد' : 'Please enter appointment title'); return; }
    if (!date) { setError(lang === 'ar' ? 'أدخل التاريخ' : 'Please select a date'); return; }
    addAppointment({ title: title.trim(), type, date, time, notes: notes || undefined });
    setTitle(''); setDate(''); setNotes(''); setError('');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.addAppointment}>
      <div className="flex flex-col gap-4 pb-4">
        <FormInput label={lang === 'ar' ? 'العنوان' : 'title'} value={title} onChange={setTitle} placeholder={lang === 'ar' ? 'مثال: فحص شهرين' : 'e.g. 2-Month Checkup'} required />

        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{lang === 'ar' ? 'النوع' : 'type'}</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(TYPE_INFO) as [AppointmentType, TypeInfo][]).map(([tp, info]) => (
              <button
                key={tp}
                onClick={() => setType(tp)}
                className={`py-2.5 px-2 rounded-[14px] text-[11px] font-medium border transition-all flex flex-col items-center gap-1.5 min-h-[44px] ${
                  type === tp
                    ? 'border-primary bg-feeding-tint text-primary'
                    : 'border-border-hairline/[.25] bg-soft-surface text-text-hint'
                }`}
              >
                <IconCircle icon={info.icon} bg={info.bg} size="sm" />
                <span>{lang === 'ar' ? info.arLabel : info.enLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <FormInput label={lang === 'ar' ? 'التاريخ' : 'date'} value={date} onChange={setDate} type="date" className="flex-1" />
          <FormInput label={lang === 'ar' ? 'الوقت' : 'time'} value={time} onChange={setTime} type="time" className="flex-1" />
        </div>

        <FormTextArea label={t.notes} value={notes} onChange={setNotes} />

        {error && <p className="text-[13px] text-error-text">{error}</p>}

        <PrimaryButton onClick={handleSave}>{t.save}</PrimaryButton>
      </div>
    </BottomSheet>
  );
}

export function CalendarScreen() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const { appointments, deleteAppointment } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...appointments].filter((a) => a.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = [...appointments].filter((a) => a.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const apptDates = new Set(appointments.map((a) => a.date));
  const monthName = t.months[month];

  function prevMonth() { setCurrentMonth(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentMonth(new Date(year, month + 1, 1)); }

  return (
    <AppShell title={t.calendarTitle} showNav headerRight={
      <button
        onClick={() => setShowAdd(true)}
        aria-label={lang === 'ar' ? 'إضافة موعد' : 'Add appointment'}
        className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Plus size={18} className="text-surface" aria-hidden="true" />
      </button>
    }>
      {t.calendarSubtitle && (
        <p className="text-[13px] text-text-hint mb-4">{t.calendarSubtitle}</p>
      )}

      {/* Mini calendar */}
      <SoftCard className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} aria-label={lang === 'ar' ? 'الشهر السابق' : 'Previous month'} className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] -ms-1">
            <ChevronLeft size={16} className="text-text-secondary" aria-hidden="true" />
          </button>
          <p className="font-display text-[15px] font-[500] text-text-primary">{monthName} {year}</p>
          <button onClick={nextMonth} aria-label={lang === 'ar' ? 'الشهر التالي' : 'Next month'} className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] -me-1">
            <ChevronRight size={16} className="text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {t.days.map((d) => (
            <div key={d} className="text-center text-[11px] text-text-hint font-medium py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = dateStr === today;
            const hasAppt = apptDates.has(dateStr);
            return (
              <div key={day} className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-full text-[13px] transition-all ${isToday ? 'bg-primary text-surface font-bold' : 'text-text-primary'}`}>
                {day}
                {hasAppt && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-surface' : 'bg-primary'}`} />}
              </div>
            );
          })}
        </div>
      </SoftCard>

      {/* Upcoming */}
      <div className="mb-4">
        <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-3">{t.upcomingAppointments}</p>
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarDays size={28} />} tint="bg-teal-soft" title={t.noAppointments} subtitle={t.noAppointmentsSub} />
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <SoftCard onClick={() => navigate(`/calendar/appointments/${apt.id}`)}>
                  <div className="flex items-center gap-3">
                    <IconCircle icon={TYPE_INFO[apt.type].icon} bg={TYPE_INFO[apt.type].bg} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-text-primary">{apt.title}</p>
                      <p className="text-[12px] text-text-hint">{apt.date} · {apt.time}</p>
                      {apt.notes && <p className="text-[12px] text-text-hint truncate">{apt.notes}</p>}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmId(apt.id); }}
                      aria-label={lang === 'ar' ? 'حذف الموعد' : 'Delete appointment'}
                      className="w-9 h-9 bg-soft-surface rounded-full flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <Trash2 size={14} className="text-text-hint" aria-hidden="true" />
                    </button>
                  </div>
                </SoftCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-3">{lang === 'ar' ? 'المواعيد السابقة' : 'past appointments'}</p>
          <div className="flex flex-col gap-2">
            {past.map((apt) => (
              <SoftCard key={apt.id} className="opacity-60" onClick={() => navigate(`/calendar/appointments/${apt.id}`)}>
                <div className="flex items-center gap-3">
                  <IconCircle icon={TYPE_INFO[apt.type].icon} bg={TYPE_INFO[apt.type].bg} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-text-primary">{apt.title}</p>
                    <p className="text-[11px] text-text-hint">{apt.date}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmId(apt.id); }}
                    aria-label={lang === 'ar' ? 'حذف الموعد' : 'Delete appointment'}
                    className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Trash2 size={12} className="text-text-hint" aria-hidden="true" />
                  </button>
                </div>
              </SoftCard>
            ))}
          </div>
        </div>
      )}

      <AddAppointmentSheet isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ConfirmModal
        isOpen={!!confirmId}
        title={lang === 'ar' ? 'حذف الموعد' : 'Delete Appointment'}
        message={lang === 'ar' ? 'هل تريد حذف هذا الموعد؟' : 'Delete this appointment?'}
        confirmLabel={t.delete} cancelLabel={t.cancel} danger
        onConfirm={() => { if (confirmId) deleteAppointment(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
      />
    </AppShell>
  );
}

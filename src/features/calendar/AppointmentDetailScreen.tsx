import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Check, Stethoscope, Activity, Pill, Scale, CalendarDays, MessageCircle } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, PrimaryButton, SecondaryButton, ConfirmModal, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import type { AppointmentType } from '../../types';

const TYPE_ICON: Record<AppointmentType, { icon: React.ReactNode; bg: string }> = {
  pediatrician:  { icon: <Stethoscope size={18} aria-hidden="true" />, bg: 'bg-feeding-tint' },
  vaccine:       { icon: <Activity    size={18} aria-hidden="true" />, bg: 'bg-teal-soft' },
  medicine:      { icon: <Pill        size={18} aria-hidden="true" />, bg: 'bg-warm-soft' },
  'weight-check':{ icon: <Scale       size={18} aria-hidden="true" />, bg: 'bg-sleep-soft' },
  other:         { icon: <CalendarDays size={18} aria-hidden="true" />, bg: 'bg-soft-surface' },
};

export function AppointmentDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, lang } = useT();
  const ar = lang === 'ar';
  const { appointments, doctorQuestions, addQuestion, toggleAnswered, deleteQuestion, deleteAppointment } = useStore();

  const apt = appointments.find((a) => a.id === id);
  const linkedQs = doctorQuestions.filter((q) => q.appointmentId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const [questionText, setQuestionText] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmDeleteApt, setConfirmDeleteApt] = useState(false);
  const [confirmDeleteQ, setConfirmDeleteQ] = useState<string | null>(null);

  if (!apt) {
    return (
      <AppShell title={ar ? 'الموعد' : 'Appointment'} showBack showNav={false}>
        <div className="flex flex-col items-center py-16 text-center px-4 gap-3">
          <IconCircle icon={<CalendarDays size={28} aria-hidden="true" />} bg="bg-teal-soft" size="xl" />
          <p className="text-[13px] text-text-secondary">{ar ? 'الموعد غير موجود.' : 'Appointment not found.'}</p>
        </div>
      </AppShell>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const isPast = apt.date < today;
  const typeInfo = TYPE_ICON[apt.type] ?? TYPE_ICON.other;

  const handleAddQuestion = async () => {
    if (!questionText.trim()) return;
    await addQuestion({ text: questionText.trim(), answered: false, appointmentId: apt.id });
    setQuestionText('');
    setAdding(false);
  };

  const handleDeleteApt = async () => {
    await deleteAppointment(apt.id);
    navigate('/calendar', { replace: true });
  };

  return (
    <AppShell title={ar ? 'تفاصيل الموعد' : 'Appointment Detail'} showBack showNav={false}>
      {/* Appointment card */}
      <SoftCard className="mb-5">
        <div className="flex items-start gap-3">
          <IconCircle icon={typeInfo.icon} bg={typeInfo.bg} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-text-primary">{apt.title}</p>
            <p className="text-[13px] text-text-secondary mt-0.5">{apt.date} · {apt.time}</p>
            {apt.notes && <p className="text-[12px] text-text-hint mt-1">{apt.notes}</p>}
            {isPast && (
              <span className="inline-block mt-1.5 text-[11px] bg-soft-surface text-text-hint px-2 py-0.5 rounded-full">
                {ar ? 'موعد سابق' : 'Past'}
              </span>
            )}
          </div>
        </div>
      </SoftCard>

      {/* Questions */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em]">
            {ar ? 'الأسئلة' : 'questions'} {linkedQs.length > 0 && `(${linkedQs.length})`}
          </p>
          <button
            onClick={() => setAdding(true)}
            aria-label={ar ? 'إضافة سؤال' : 'Add question'}
            className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-soft min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Plus size={16} className="text-surface" aria-hidden="true" />
          </button>
        </div>

        {linkedQs.length === 0 && !adding && (
          <div className="text-center py-6 flex flex-col items-center gap-3">
            <IconCircle icon={<MessageCircle size={24} aria-hidden="true" />} bg="bg-teal-soft" size="lg" />
            <p className="text-[13px] text-text-secondary">{ar ? 'لا أسئلة مرتبطة بهذا الموعد.' : 'No questions linked to this appointment.'}</p>
            <p className="text-[12px] text-text-hint">{ar ? 'أضف سؤالاً تريد طرحه على طبيبك.' : 'Add something you want to ask your doctor.'}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {linkedQs.map((q) => (
            <SoftCard key={q.id} padding="p-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => void toggleAnswered(q.id)}
                  aria-label={q.answered ? (ar ? 'علامة غير مجاب' : 'Mark unanswered') : (ar ? 'تم الإجابة' : 'Mark answered')}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${q.answered ? 'bg-primary border-primary' : 'border-border-hairline/[.3] bg-surface'}`}
                >
                  {q.answered && <Check size={12} className="text-surface" aria-hidden="true" />}
                </button>
                <p className={`flex-1 text-[13px] ${q.answered ? 'line-through text-text-hint' : 'text-text-primary'}`}>{q.text}</p>
                <button
                  onClick={() => setConfirmDeleteQ(q.id)}
                  aria-label={ar ? 'حذف السؤال' : 'Delete question'}
                  className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px]"
                >
                  <Trash2 size={12} className="text-text-hint" aria-hidden="true" />
                </button>
              </div>
            </SoftCard>
          ))}
        </div>

        {adding && (
          <div className="mt-3 bg-surface rounded-[18px] border border-border-hairline/[.18] p-4 flex flex-col gap-3">
            <p className="text-[14px] font-semibold text-text-primary">{ar ? 'سؤال جديد' : 'New Question'}</p>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
              placeholder={ar ? 'اكتب سؤالك هنا…' : 'Write your question here…'}
              autoFocus
              className="w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[44px]"
            />
            <div className="flex gap-2">
              <SecondaryButton onClick={() => { setAdding(false); setQuestionText(''); }} fullWidth={false} className="flex-1">{t.cancel}</SecondaryButton>
              <PrimaryButton onClick={() => void handleAddQuestion()} fullWidth={false} className="flex-1" disabled={!questionText.trim()}>{t.save}</PrimaryButton>
            </div>
          </div>
        )}
      </div>

      <SecondaryButton onClick={() => setConfirmDeleteApt(true)} className="border border-error-text text-error-text">
        {ar ? 'حذف الموعد' : 'Delete Appointment'}
      </SecondaryButton>

      <ConfirmModal
        isOpen={confirmDeleteApt}
        title={ar ? 'حذف الموعد' : 'Delete Appointment'}
        message={ar ? 'هل تريد حذف هذا الموعد؟' : 'Delete this appointment?'}
        confirmLabel={t.delete} cancelLabel={t.cancel} danger
        onConfirm={() => void handleDeleteApt()}
        onCancel={() => setConfirmDeleteApt(false)}
      />
      <ConfirmModal
        isOpen={!!confirmDeleteQ}
        title={ar ? 'حذف السؤال' : 'Delete Question'}
        message={ar ? 'هل تريد حذف هذا السؤال؟' : 'Delete this question?'}
        confirmLabel={t.delete} cancelLabel={t.cancel} danger
        onConfirm={() => { if (confirmDeleteQ) void deleteQuestion(confirmDeleteQ); setConfirmDeleteQ(null); }}
        onCancel={() => setConfirmDeleteQ(null)}
      />
    </AppShell>
  );
}

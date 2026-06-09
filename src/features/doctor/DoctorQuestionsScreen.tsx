import { useState } from 'react';
import { Plus, Check, Trash2, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, PrimaryButton, SecondaryButton, FormTextArea, EmptyState, ConfirmModal, IconCircle } from '../../components/ui';
import { BottomSheet } from '../../components/BottomSheet';
import { useStore } from '../../store/useStore';

export function DoctorQuestionsScreen() {
  const { t, lang } = useT();
  const { doctorQuestions, addQuestion, toggleAnswered, deleteQuestion } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [text, setText] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleSave = () => {
    if (!text.trim()) return;
    addQuestion({ text: text.trim(), answered: false });
    setText(''); setShowAdd(false);
  };

  const unanswered = doctorQuestions.filter(q => !q.answered);
  const answered = doctorQuestions.filter(q => q.answered);

  return (
    <AppShell title={t.doctorQuestions} showBack showNav={false} headerRight={
      <button
        onClick={() => setShowAdd(true)}
        aria-label={lang === 'ar' ? 'إضافة سؤال' : 'Add question'}
        className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Plus size={18} className="text-surface" aria-hidden="true" />
      </button>
    }>
      <p className="text-[13px] text-text-hint mb-4 leading-relaxed">
        {lang === 'ar' ? 'احفظ أسئلتك هنا واحضرها معك لموعد الطبيب.' : 'Save your questions here and bring them to your next appointment.'}
      </p>

      {/* Unanswered */}
      <div className="mb-5">
        <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-3">{t.unanswered} ({unanswered.length})</p>
        {unanswered.length === 0 ? (
          <EmptyState icon={<HelpCircle size={28} />} tint="bg-teal-soft" title={t.noQuestions} subtitle={t.noQuestionsSub} />
        ) : (
          <div className="flex flex-col gap-2">
            {unanswered.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <SoftCard padding="p-3">
                  <div className="flex items-start gap-3">
                    <IconCircle icon={<HelpCircle size={14} aria-hidden="true" />} bg="bg-teal-soft" size="sm" className="shrink-0 mt-0.5" />
                    <p className="flex-1 text-[13px] text-text-primary leading-relaxed">{q.text}</p>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => toggleAnswered(q.id)}
                        aria-label={lang === 'ar' ? 'تم الإجابة' : 'Mark answered'}
                        className="w-8 h-8 bg-success-soft rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <Check size={13} className="text-success-text" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setConfirmId(q.id)}
                        aria-label={lang === 'ar' ? 'حذف السؤال' : 'Delete question'}
                        className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <Trash2 size={12} className="text-text-hint" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </SoftCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Answered */}
      {answered.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-3">{t.answered} ({answered.length})</p>
          <div className="flex flex-col gap-2">
            {answered.map((q) => (
              <SoftCard key={q.id} padding="p-3" className="opacity-60">
                <div className="flex items-start gap-3">
                  <Check size={16} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="flex-1 text-[13px] text-text-secondary line-through">{q.text}</p>
                  <button
                    onClick={() => setConfirmId(q.id)}
                    aria-label={lang === 'ar' ? 'حذف السؤال' : 'Delete question'}
                    className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px]"
                  >
                    <Trash2 size={12} className="text-text-hint" aria-hidden="true" />
                  </button>
                </div>
              </SoftCard>
            ))}
          </div>
        </div>
      )}

      <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)} title={t.addQuestion}>
        <div className="flex flex-col gap-4 pb-4">
          <FormTextArea
            label={lang === 'ar' ? 'سؤالك للطبيب' : 'your question for the doctor'}
            value={text} onChange={setText}
            placeholder={lang === 'ar' ? 'مثال: هل هذا الطفح الجلدي طبيعي؟' : 'e.g. Is this rash normal?'}
            rows={4}
          />
          <div className="flex gap-3">
            <SecondaryButton onClick={() => setShowAdd(false)} fullWidth={false} className="flex-1">{t.cancel}</SecondaryButton>
            <PrimaryButton onClick={handleSave} fullWidth={false} className="flex-1">{t.save}</PrimaryButton>
          </div>
        </div>
      </BottomSheet>

      <ConfirmModal
        isOpen={!!confirmId} title={lang === 'ar' ? 'حذف السؤال' : 'Delete Question'}
        message={lang === 'ar' ? 'هل تريد حذف هذا السؤال؟' : 'Delete this question?'}
        confirmLabel={t.delete} cancelLabel={t.cancel} danger
        onConfirm={() => { if (confirmId) deleteQuestion(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
      />
    </AppShell>
  );
}

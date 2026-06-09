import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wind, Smile, Moon, AlertCircle, Frown, ZapOff, Heart, Leaf, BedDouble, Flower2, Droplets, PersonStanding, ChevronRight } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, SafetyNotice, PrimaryButton, SecondaryButton, FormTextArea, IconCircle } from '../../components/ui';
import { BottomSheet } from '../../components/BottomSheet';
import { useStore } from '../../store/useStore';
import { todayISO } from '../../utils/dateHelpers';
import type { MomCheckIn, MoodOption } from '../../types';

type MoodConfig = {
  value: MoodOption;
  icon: React.ReactNode;
  enLabel: string;
  arLabel: string;
  enResponse: string;
  arResponse: string;
  bg: string;
};

const MOODS: MoodConfig[] = [
  { value: 'calm',         icon: <Smile       size={20} aria-hidden="true" />, bg: 'bg-teal-soft',    enLabel: 'Calm',         arLabel: 'هادئة',      enResponse: 'What a peaceful moment. Rest counts too.',                   arResponse: 'لحظة هادئة جميلة. الراحة مهمة أيضاً.' },
  { value: 'tired',        icon: <Moon        size={20} aria-hidden="true" />, bg: 'bg-sleep-soft',   enLabel: 'Tired',        arLabel: 'متعبة',      enResponse: 'Tired is normal. Small recovery steps.',                    arResponse: 'التعب طبيعي جداً. خطوات تعافٍ صغيرة.' },
  { value: 'overwhelmed',  icon: <AlertCircle size={20} aria-hidden="true" />, bg: 'bg-warm-soft',    enLabel: 'Overwhelmed',  arLabel: 'مضغوطة',    enResponse: 'One breath at a time. You are doing well.',                  arResponse: 'تنفسي ببطء. أنتِ تقومين بعمل رائع.' },
  { value: 'sad',          icon: <Frown       size={20} aria-hidden="true" />, bg: 'bg-lavender-soft', enLabel: 'Sad',          arLabel: 'حزينة',      enResponse: 'Feelings are valid. Healing takes time.',                    arResponse: 'مشاعرك مفهومة. التعافي يأخذ وقته.' },
  { value: 'in-pain',      icon: <ZapOff      size={20} aria-hidden="true" />, bg: 'bg-error-soft',   enLabel: 'In Pain',      arLabel: 'أعاني ألماً', enResponse: 'Listen to your body. Rest and consult your doctor if needed.', arResponse: 'استمعي لجسدك. استريحي وتواصلي مع طبيبك عند الحاجة.' },
  { value: 'need-support', icon: <Heart       size={20} aria-hidden="true" />, bg: 'bg-feeding-tint', enLabel: 'Need Support', arLabel: 'أحتاج دعماً', enResponse: 'Reaching out takes courage. Talk to someone you trust.',      arResponse: 'طلب الدعم يحتاج شجاعة. تحدثي مع شخص تثقين به.' },
];

const affirmations: { enText: string; arText: string; icon: React.ReactNode; bg: string }[] = [
  { enText: 'Small recovery steps', arText: 'خطوات تعافٍ صغيرة', icon: <Leaf    size={16} aria-hidden="true" />, bg: 'bg-teal-soft' },
  { enText: 'Rest counts too',      arText: 'الراحة مهمة أيضاً',  icon: <BedDouble size={16} aria-hidden="true" />, bg: 'bg-sleep-soft' },
  { enText: 'Listen to your body',  arText: 'استمعي لجسدك',      icon: <Heart   size={16} aria-hidden="true" />, bg: 'bg-feeding-tint' },
  { enText: 'Healing takes time',   arText: 'التعافي يأخذ وقته',  icon: <Flower2 size={16} aria-hidden="true" />, bg: 'bg-lavender-soft' },
];

// ── Detailed check-in form ────────────────────────────────────────────────────

function DetailedCheckInSheet({ isOpen, onClose, existingId }: { isOpen: boolean; onClose: () => void; existingId?: string }) {
  const { t, lang } = useT();
  const ar = lang === 'ar';
  const { addMomCheckIn, updateMomCheckIn, momCheckIns } = useStore();
  const todayStr = todayISO();
  const existing = momCheckIns.find((c) => c.date === todayStr);

  const [mood, setMood] = useState<MoodOption>(existing?.mood ?? 'calm');
  const [water, setWater] = useState(existing?.waterCups ?? 0);
  const [walking, setWalking] = useState(existing?.walkingMinutes?.toString() ?? '');
  const [painLevel, setPainLevel] = useState(existing?.painLevel ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const handleSave = async () => {
    const payload: Omit<MomCheckIn, 'id'> = {
      date: todayStr,
      mood,
      waterCups: water,
      walkingMinutes: walking ? parseInt(walking) : undefined,
      painLevel,
      notes: notes || undefined,
    };
    if (existing) {
      await updateMomCheckIn(existing.id, payload);
    } else {
      await addMomCheckIn(payload);
    }
    onClose();
  };

  void existingId;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.dailyCheckIn}>
      <div className="flex flex-col gap-4 pb-4">
        {/* Mood */}
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{t.mood}</p>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`py-2.5 rounded-[14px] flex flex-col items-center gap-1.5 border transition-all min-h-[44px] ${mood === m.value ? 'border-primary bg-feeding-tint' : 'border-border-hairline/[.25] bg-soft-surface'}`}
              >
                <IconCircle icon={m.icon} bg={m.bg} size="sm" />
                <span className="text-[11px] font-medium text-text-secondary">{ar ? m.arLabel : m.enLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Water */}
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{t.waterTracker} ({water} {ar ? 'أكواب' : 'cups'})</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => setWater(n)}
                aria-label={`${n} ${ar ? 'أكواب' : 'cups'}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] transition-all ${n <= water ? 'bg-primary text-surface' : 'bg-soft-surface text-text-hint'}`}
              >
                <Droplets size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {/* Pain level */}
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{ar ? `مستوى الألم: ${painLevel}/10` : `Discomfort level: ${painLevel}/10`}</p>
          <input
            type="range" min={0} max={10} value={painLevel}
            onChange={(e) => setPainLevel(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Walking */}
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-1">{t.walkingTracker} ({ar ? 'دقائق' : 'minutes'})</p>
          <input
            type="number" value={walking} onChange={(e) => setWalking(e.target.value)} placeholder="0"
            className="w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-4 py-3 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
          />
        </div>

        <FormTextArea label={t.notes} value={notes} onChange={setNotes} rows={2} />

        <div className="flex gap-3">
          <SecondaryButton onClick={onClose} fullWidth={false} className="flex-1">{t.cancel}</SecondaryButton>
          <PrimaryButton onClick={() => void handleSave()} fullWidth={false} className="flex-1">{t.save}</PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function MomRecoveryScreen() {
  const { t, lang } = useT();
  const ar = lang === 'ar';
  const navigate = useNavigate();
  const { momCheckIns, addMomCheckIn, updateMomCheckIn } = useStore();
  const [showDetailed, setShowDetailed] = useState(false);

  const todayStr = todayISO();
  const todayCheckIn = momCheckIns.find((c) => c.date === todayStr);
  const recentCheckIns = [...momCheckIns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const displayMood = MOODS.find((m) => m.value === todayCheckIn?.mood);

  const handleMoodTap = async (mood: MoodOption) => {
    if (todayCheckIn) {
      await updateMomCheckIn(todayCheckIn.id, { mood });
    } else {
      await addMomCheckIn({ date: todayStr, mood });
    }
  };

  return (
    <AppShell title={t.momRecovery} showNav>
      <SafetyNotice text={t.momSafety} className="mb-4" />

      {/* Mood card */}
      <SoftCard className="mb-4 bg-lavender-soft/40">
        {displayMood ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <IconCircle icon={displayMood.icon} bg={displayMood.bg} size="lg" />
              <div>
                <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em]">{ar ? 'تسجيل اليوم' : "today's check-in"}</p>
                <p className="text-[14px] font-bold text-text-primary">{ar ? displayMood.arLabel : displayMood.enLabel}</p>
              </div>
            </div>
            <p className="text-[12px] text-text-secondary italic mb-3 leading-relaxed">{ar ? displayMood.arResponse : displayMood.enResponse}</p>
            <p className="text-[11px] text-text-faint lowercase tracking-[0.03em] mb-2">{ar ? 'كيف تشعرين الآن؟' : 'how are you feeling now?'}</p>
            <div className="grid grid-cols-6 gap-1">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => void handleMoodTap(m.value)}
                  aria-label={ar ? m.arLabel : m.enLabel}
                  className={`py-2 rounded-[12px] flex flex-col items-center min-h-[44px] border-2 transition-all ${todayCheckIn?.mood === m.value ? 'border-primary bg-surface' : 'border-transparent bg-surface/60'}`}
                >
                  <IconCircle icon={m.icon} bg={m.bg} size="sm" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[14px] font-semibold text-text-primary mb-1">{ar ? 'كيف تشعرين اليوم؟' : 'How are you feeling today?'}</p>
            <p className="text-[12px] text-text-hint mb-3">{ar ? 'اضغطي على حالتك' : 'Tap your mood'}</p>
            <div className="grid grid-cols-3 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => void handleMoodTap(m.value)}
                  className="py-2.5 rounded-[14px] flex flex-col items-center gap-1.5 border border-border-hairline/[.25] bg-surface active:scale-[0.97] transition-all min-h-[44px]"
                >
                  <IconCircle icon={m.icon} bg={m.bg} size="sm" />
                  <span className="text-[11px] font-medium text-text-secondary">{ar ? m.arLabel : m.enLabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </SoftCard>

      {/* Details link */}
      <button
        onClick={() => setShowDetailed(true)}
        className="w-full text-center text-[13px] text-primary font-medium mb-5 py-2 min-h-[44px] active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-[14px]"
      >
        {todayCheckIn
          ? (ar ? '+ إضافة تفاصيل / تحديث' : '+ Add details / update')
          : (ar ? '+ إضافة تفاصيل (اختياري)' : '+ Add details (optional)')}
      </button>

      {/* Affirmations */}
      <div className="mb-5">
        <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-3">{ar ? 'تذكيرات لطيفة' : 'gentle reminders'}</p>
        <div className="grid grid-cols-2 gap-2">
          {affirmations.map(({ enText, arText, icon, bg }) => (
            <div key={enText} className="bg-surface rounded-[18px] border border-border-hairline/[.18] p-3 flex flex-col items-center gap-1.5 text-center">
              <IconCircle icon={icon} bg={bg} size="sm" />
              <p className="text-[12px] font-medium text-text-secondary leading-snug">{ar ? arText : enText}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise guide entry */}
      <button
        onClick={() => navigate('/postpartum-exercise')}
        className="w-full mb-5 bg-surface-sunk border border-border-hairline/[.18] rounded-[18px] px-4 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary min-h-[44px]"
        aria-label={ar ? 'دليل تمارين ما بعد الولادة' : 'Postpartum Exercise Guide'}
      >
        <IconCircle icon={<PersonStanding size={20} aria-hidden="true" />} bg="bg-teal-soft" size="lg" />
        <div className="flex-1 text-start">
          <p className="text-[14px] font-bold text-text-primary">{ar ? 'دليل تمارين ما بعد الولادة' : 'Postpartum Exercise Guide'}</p>
          <p className="text-[12px] text-text-hint mt-0.5">{ar ? 'تمارين آمنة مرتبة حسب مرحلة تعافيك' : 'Safe exercises by recovery phase'}</p>
        </div>
        <ChevronRight size={16} className="text-text-hint shrink-0" aria-hidden="true" />
      </button>

      {/* Breathing card */}
      <SoftCard className="mb-4">
        <div className="flex items-center gap-3">
          <IconCircle icon={<Wind size={18} aria-hidden="true" />} bg="bg-teal-soft" size="md" />
          <div>
            <p className="text-[14px] font-bold text-text-primary">{t.breathingEx}</p>
            <p className="text-[12px] text-text-hint">{ar ? 'شهيق ٤ ثواني، زفير ٦ ثواني' : '4 sec inhale, 6 sec exhale'}</p>
          </div>
        </div>
      </SoftCard>

      {/* Recent check-ins */}
      {recentCheckIns.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-3">{ar ? 'سجل التسجيلات' : 'recent check-ins'}</p>
          <div className="flex flex-col gap-2">
            {recentCheckIns.map((ci) => {
              const m = MOODS.find((x) => x.value === ci.mood);
              return (
                <SoftCard key={ci.id} padding="p-3">
                  <div className="flex items-center gap-3">
                    {m && <IconCircle icon={m.icon} bg={m.bg} size="sm" />}
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-text-primary">{ar ? m?.arLabel : m?.enLabel}</p>
                      <p className="text-[11px] text-text-hint flex items-center gap-1">
                        {ci.date}
                        {ci.waterCups ? <span className="flex items-center gap-0.5"><Droplets size={10} aria-hidden="true" />{ci.waterCups}</span> : null}
                        {ci.walkingMinutes ? <span className="flex items-center gap-0.5"><PersonStanding size={10} aria-hidden="true" />{ci.walkingMinutes}min</span> : null}
                      </p>
                    </div>
                  </div>
                </SoftCard>
              );
            })}
          </div>
        </div>
      )}

      <DetailedCheckInSheet isOpen={showDetailed} onClose={() => setShowDetailed(false)} existingId={todayCheckIn?.id} />
    </AppShell>
  );
}

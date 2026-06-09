import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Lock, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Minus, AlertTriangle, Utensils, Check } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, SafetyNotice, PrimaryButton, SecondaryButton, SegmentedControl, IconCircle } from '../../components/ui';
import { BottomSheet } from '../../components/BottomSheet';
import { useStore } from '../../store/useStore';
import { foodItems, type FoodItem } from '../../data/firstFoods';
import { getBabyAgeInMonths } from '../../utils/dateHelpers';
import type { FoodReaction } from '../../types';

type AgeTab = '6-7' | '8-9' | '10-12';
type ScreenTab = 'foods' | 'history';
type FoodToLog = { nameEn: string; nameAr: string };

function FoodCard({ food, lang, tried, onLog }: {
  food: FoodItem; lang: string; tried?: FoodReaction; onLog: (food: FoodItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <SoftCard className={tried ? 'border border-teal-soft/60' : ''}>
      <button className="w-full text-start" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <IconCircle icon={<Utensils size={16} aria-hidden="true" />} bg="bg-feeding-tint" size="md" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-text-primary">{lang === 'ar' ? food.nameAr : food.nameEn}</p>
              {tried && (
                <span className="inline-flex items-center gap-0.5 text-[11px] bg-teal-soft text-primary px-2 py-0.5 rounded-full font-medium">
                  <Check size={10} aria-hidden="true" /> {lang === 'ar' ? 'جُرِّب' : 'Tried'}
                </span>
              )}
            </div>
            <p className="text-[12px] text-text-hint">{lang === 'ar' ? food.textureAr : food.textureEn}</p>
          </div>
          {expanded
            ? <ChevronUp size={16} className="text-text-hint shrink-0" aria-hidden="true" />
            : <ChevronDown size={16} className="text-text-hint shrink-0" aria-hidden="true" />
          }
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-border-hairline/[.15] flex flex-col gap-3">
              <div>
                <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-1">{lang === 'ar' ? 'المكونات' : 'ingredients'}</p>
                {(lang === 'ar' ? food.ingredientsAr : food.ingredientsEn).map((ing, i) => (
                  <p key={i} className="text-[12px] text-text-primary">• {ing}</p>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-1">{lang === 'ar' ? 'التحضير' : 'preparation'}</p>
                {(lang === 'ar' ? food.stepsAr : food.stepsEn).map((step, i) => (
                  <p key={i} className="text-[12px] text-text-primary">{i + 1}. {step}</p>
                ))}
              </div>
              {(food.allergyNote || food.allergyNoteAr) && (
                <div className="flex items-start gap-2 bg-warm-soft rounded-[12px] p-3">
                  <AlertTriangle size={13} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-[12px] text-text-secondary">{lang === 'ar' ? food.allergyNoteAr : food.allergyNote}</p>
                </div>
              )}
              {(food.chokingNote || food.chokingNoteAr) && (
                <div className="flex items-start gap-2 bg-error-soft rounded-[12px] p-3">
                  <AlertTriangle size={13} className="text-error-text shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-[12px] text-error-text">{lang === 'ar' ? food.chokingNoteAr : food.chokingNote}</p>
                </div>
              )}
              <PrimaryButton onClick={() => onLog(food)}>
                {tried ? (lang === 'ar' ? 'تحديث التجربة' : 'Update Reaction') : (lang === 'ar' ? 'سجّل كمجرب' : 'Log as Tried')}
              </PrimaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SoftCard>
  );
}

function LogFoodSheet({ food, isOpen, onClose }: { food: FoodToLog | null; isOpen: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const { addFoodReaction } = useStore();
  const [liked, setLiked] = useState<'yes' | 'no' | 'neutral'>('neutral');
  const [rash, setRash] = useState(false);
  const [vomiting, setVomiting] = useState(false);
  const [constipation, setConstipation] = useState(false);
  const [notes, setNotes] = useState('');

  if (!food) return null;
  const displayName = lang === 'ar' ? food.nameAr : food.nameEn;

  const handleSave = () => {
    addFoodReaction({ foodName: food.nameEn, triedDate: new Date().toISOString().slice(0, 10), liked, rash, vomiting, constipation, notes: notes || undefined });
    setLiked('neutral'); setRash(false); setVomiting(false); setConstipation(false); setNotes('');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={lang === 'ar' ? 'سجّل التجربة' : 'Log Food Reaction'}>
      <div className="flex flex-col gap-4 pb-4">
        <p className="text-[14px] font-semibold text-text-primary">{displayName}</p>

        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{lang === 'ar' ? 'هل أحبه؟' : 'did baby like it?'}</p>
          <SegmentedControl
            options={[
              { value: 'yes', label: lang === 'ar' ? 'أحبه' : 'Liked' },
              { value: 'neutral', label: lang === 'ar' ? 'محايد' : 'Neutral' },
              { value: 'no', label: lang === 'ar' ? 'لم يحبه' : 'Disliked' },
            ]}
            value={liked}
            onChange={(v) => setLiked(v as 'yes' | 'no' | 'neutral')}
          />
        </div>

        <div className="flex flex-col gap-2">
          {[
            { key: 'rash',        label: lang === 'ar' ? 'طفح جلدي' : 'Rash',        val: rash,        set: setRash },
            { key: 'vomiting',    label: lang === 'ar' ? 'قيء' : 'Vomiting',          val: vomiting,    set: setVomiting },
            { key: 'constipation',label: lang === 'ar' ? 'إمساك' : 'Constipation',   val: constipation, set: setConstipation },
          ].map(({ key, label, val, set }) => (
            <button
              key={key}
              onClick={() => set(!val)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-[14px] border-2 text-[13px] font-medium transition-all min-h-[44px] ${val ? 'border-error-text bg-error-soft text-error-text' : 'border-border-hairline/[.25] bg-soft-surface text-text-secondary'}`}
            >
              {label}
              {val && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div>
          <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-1">{t.notes}</p>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-4 py-3 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <SecondaryButton onClick={onClose} fullWidth={false} className="flex-1">{t.cancel}</SecondaryButton>
          <PrimaryButton onClick={handleSave} fullWidth={false} className="flex-1">{t.save}</PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}

function ReactionHistory({ reactions, lang }: { reactions: FoodReaction[]; lang: string }) {
  const ar = lang === 'ar';
  const sorted = [...reactions].sort((a, b) => b.triedDate.localeCompare(a.triedDate));

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center px-4 gap-3">
        <IconCircle icon={<Utensils size={28} aria-hidden="true" />} bg="bg-feeding-tint" size="xl" />
        <p className="text-[14px] font-semibold text-text-secondary">{ar ? 'لا أطعمة مجرَّبة بعد' : 'No foods tried yet'}</p>
        <p className="text-[12px] text-text-hint">{ar ? 'جرّبي طعاماً وسجّلي التجربة.' : 'Try a food and log the reaction.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((r) => {
        const likedIcon = r.liked === 'yes'
          ? <ThumbsUp size={14} className="text-primary" aria-label={ar ? 'أحبه' : 'Liked'} />
          : r.liked === 'no'
          ? <ThumbsDown size={14} className="text-error-text" aria-label={ar ? 'لم يحبه' : 'Disliked'} />
          : <Minus size={14} className="text-text-hint" aria-label={ar ? 'محايد' : 'Neutral'} />;
        const reactionsList = [
          r.rash && (ar ? 'طفح' : 'rash'),
          r.vomiting && (ar ? 'قيء' : 'vomiting'),
          r.constipation && (ar ? 'إمساك' : 'constipation'),
        ].filter(Boolean);
        return (
          <SoftCard key={r.id} padding="p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">{likedIcon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text-primary">{r.foodName}</p>
                <p className="text-[11px] text-text-hint">{r.triedDate}</p>
                {reactionsList.length > 0 && (
                  <p className="flex items-center gap-1 text-[11px] text-error-text mt-0.5">
                    <AlertTriangle size={10} aria-hidden="true" /> {reactionsList.join(', ')}
                  </p>
                )}
                {r.notes && <p className="text-[11px] text-text-hint mt-0.5 truncate">{r.notes}</p>}
              </div>
            </div>
          </SoftCard>
        );
      })}
    </div>
  );
}

export function FirstFoodsScreen() {
  const { t, lang } = useT();
  const ar = lang === 'ar';
  const { babyProfile, foodReactions } = useStore();
  const [tab, setTab] = useState<AgeTab>('6-7');
  const [screenTab, setScreenTab] = useState<ScreenTab>('foods');
  const [loggingFood, setLoggingFood] = useState<FoodToLog | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');

  const ageMonths = babyProfile ? getBabyAgeInMonths(babyProfile.dateOfBirth) : 0;
  const isUnder6 = ageMonths < 6;

  const tabFoods = foodItems.filter((f) => f.ageRange === tab);
  const triedMap = new Map(foodReactions.map((r) => [r.foodName, r]));

  const handleLogCustomFood = () => {
    const name = customFoodName.trim();
    if (!name) return;
    setLoggingFood({ nameEn: name, nameAr: name });
    setCustomFoodName('');
    setShowCustomInput(false);
  };

  if (isUnder6) {
    return (
      <AppShell title={t.firstFoodsTitle} showBack showNav={false}>
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-4">
          <IconCircle icon={<Lock size={28} aria-hidden="true" />} bg="bg-soft-surface" size="xl" />
          <h2 className="text-[18px] font-bold text-text-primary">{ar ? 'وقت مبكر قليلاً' : 'A little early yet'}</h2>
          <p className="text-[13px] text-text-secondary leading-relaxed">{t.lockedFoodsMsg}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={t.firstFoodsTitle} showBack showNav={false}>
      <SafetyNotice text={t.foodSafety} className="mb-4" />

      <div className="mb-4">
        <SegmentedControl
          options={[
            { value: 'foods', label: ar ? 'الأطعمة' : 'Foods' },
            { value: 'history', label: ar ? 'السجل' : 'History' },
          ]}
          value={screenTab}
          onChange={(v) => setScreenTab(v as ScreenTab)}
        />
      </div>

      {screenTab === 'history' ? (
        <ReactionHistory reactions={foodReactions} lang={lang} />
      ) : (
        <>
          <div className="mb-4">
            <SegmentedControl
              options={[{ value: '6-7', label: '6-7m' }, { value: '8-9', label: '8-9m' }, { value: '10-12', label: '10-12m' }]}
              value={tab}
              onChange={(v) => setTab(v as AgeTab)}
            />
          </div>

          <div className="flex flex-col gap-3">
            {tabFoods.map((food, i) => (
              <motion.div key={food.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <FoodCard food={food} lang={lang} tried={triedMap.get(food.nameEn)} onLog={setLoggingFood} />
              </motion.div>
            ))}
          </div>

          <div className="mt-4">
            {showCustomInput ? (
              <SoftCard>
                <p className="text-[14px] font-semibold text-text-primary mb-3">{ar ? 'طعام مخصص' : 'Custom food'}</p>
                <input
                  type="text"
                  value={customFoodName}
                  onChange={(e) => setCustomFoodName(e.target.value)}
                  placeholder={ar ? 'اسم الطعام…' : 'Food name…'}
                  autoFocus
                  className="w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-4 py-3 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3 min-h-[44px]"
                />
                <div className="flex gap-2">
                  <SecondaryButton onClick={() => { setShowCustomInput(false); setCustomFoodName(''); }} fullWidth={false} className="flex-1">{t.cancel}</SecondaryButton>
                  <PrimaryButton onClick={handleLogCustomFood} fullWidth={false} className="flex-1" disabled={!customFoodName.trim()}>{ar ? 'سجّل' : 'Log'}</PrimaryButton>
                </div>
              </SoftCard>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border-hairline/[.3] rounded-[18px] text-[13px] font-medium text-text-secondary active:scale-[0.98] transition-transform min-h-[44px]"
              >
                <Plus size={16} aria-hidden="true" />
                {ar ? 'إضافة طعام مخصص' : 'Add custom food'}
              </button>
            )}
          </div>
        </>
      )}

      <LogFoodSheet food={loggingFood} isOpen={!!loggingFood} onClose={() => setLoggingFood(null)} />
    </AppShell>
  );
}

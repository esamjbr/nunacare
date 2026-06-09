import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle, Heart, Zap, Shield, Moon, Dumbbell, Scale, Leaf, Flower2, PersonStanding, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, Pill, PrimaryButton, SecondaryButton, IconCircle } from '../../components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = 'pelvic' | 'core' | 'cardio' | 'strength';
type Phase = 'early' | 'gentle' | 'active';

interface Exercise {
  id: string;
  enName: string;
  arName: string;
  category: Category;
  phase: Phase[];
  enDesc: string;
  arDesc: string;
  enSteps: string[];
  arSteps: string[];
  videoUrl: string | null; // ← paste YouTube URL here
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const PHASES: { id: Phase; enTitle: string; arTitle: string; enDesc: string; arDesc: string; color: string; icon: React.ReactNode; iconBg: string }[] = [
  {
    id: 'early',
    enTitle: 'Days 1–14',
    arTitle: 'الأيام ١–١٤',
    enDesc: 'Early Recovery',
    arDesc: 'التعافي المبكر',
    color: 'from-rose-100 to-pink-50 border-rose-200',
    icon: <Leaf size={18} aria-hidden="true" />,
    iconBg: 'bg-teal-soft',
  },
  {
    id: 'gentle',
    enTitle: 'Weeks 2–6',
    arTitle: 'الأسابيع ٢–٦',
    enDesc: 'Gentle Rebuilding',
    arDesc: 'إعادة البناء اللطيف',
    color: 'from-amber-100 to-orange-50 border-amber-200',
    icon: <Leaf size={18} aria-hidden="true" />,
    iconBg: 'bg-warm-soft',
  },
  {
    id: 'active',
    enTitle: '6–8+ Weeks',
    arTitle: '٦–٨+ أسابيع',
    enDesc: 'Active Recovery',
    arDesc: 'التعافي النشط',
    color: 'from-teal-100 to-emerald-50 border-teal-200',
    icon: <Flower2 size={18} aria-hidden="true" />,
    iconBg: 'bg-lavender-soft',
  },
];

const CATEGORIES: { id: Category; enLabel: string; arLabel: string }[] = [
  { id: 'pelvic', enLabel: 'Pelvic Floor', arLabel: 'قاع الحوض' },
  { id: 'core', enLabel: 'Core', arLabel: 'العضلات الأساسية' },
  { id: 'cardio', enLabel: 'Cardio', arLabel: 'كارديو' },
  { id: 'strength', enLabel: 'Strength', arLabel: 'القوة' },
];

const CATEGORY_COLORS: Record<Category, string> = {
  pelvic: 'bg-rose-100 text-rose-700',
  core: 'bg-amber-100 text-amber-700',
  cardio: 'bg-sky-100 text-sky-700',
  strength: 'bg-violet-100 text-violet-700',
};

const EXERCISES: Exercise[] = [
  // ── Pelvic Floor ──────────────────────────────────────────────────────────
  {
    id: 'kegel-basic',
    enName: 'Kegel Contractions',
    arName: 'تمارين كيجل',
    category: 'pelvic',
    phase: ['early', 'gentle', 'active'],
    enDesc: 'Gentle contractions to rebuild pelvic floor strength after birth.',
    arDesc: 'انقباضات لطيفة لإعادة بناء قوة عضلات قاع الحوض بعد الولادة.',
    enSteps: [
      'Sit or lie comfortably.',
      'Identify your pelvic floor muscles (as if stopping urination mid-flow).',
      'Contract gently for 3–5 seconds.',
      'Release completely for 3–5 seconds.',
      'Repeat 10 times, 3 sets per day.',
    ],
    arSteps: [
      'اجلسي أو استلقي بشكل مريح.',
      'حددي عضلات قاع الحوض (كأنك توقفين التبول).',
      'انقبضي برفق لمدة ٣–٥ ثوانٍ.',
      'أرخي تماماً لمدة ٣–٥ ثوانٍ.',
      'كرري ١٠ مرات، ٣ مجموعات يومياً.',
    ],
    videoUrl:  "https://www.youtube.com/shorts/XvuheJa3hPo?feature=share" // TODO: paste YouTube URL
  },
  {
    id: 'pelvic-tilt',
    enName: 'Pelvic Tilts',
    arName: 'إمالة الحوض',
    category: 'pelvic',
    phase: ['early', 'gentle'],
    enDesc: 'Activates the deep pelvic muscles and eases lower back discomfort.',
    arDesc: 'تنشط عضلات الحوض العميقة وتخفف انزعاج أسفل الظهر.',
    enSteps: [
      'Lie on your back with knees bent.',
      'Breathe in; as you exhale, gently flatten your lower back to the floor.',
      'Hold for 5 seconds, then release.',
      'Repeat 10–15 times.',
    ],
    arSteps: [
      'استلقي على ظهرك مع ثني الركبتين.',
      'شهيق؛ عند الزفير، اضغطي أسفل ظهرك برفق نحو الأرض.',
      'احتفظي بالوضعية ٥ ثوانٍ ثم أرخي.',
      'كرري ١٠–١٥ مرة.',
    ],
    videoUrl: "https://www.youtube.com/shorts/6Ayl6IXpgyM?feature=share", // TODO: paste YouTube URL
  },
  // ── Core ──────────────────────────────────────────────────────────────────
  {
    id: 'diaphragm-breathing',
    enName: 'Diaphragmatic Breathing',
    arName: 'التنفس الحجابي',
    category: 'core',
    phase: ['early', 'gentle'],
    enDesc: 'Re-connects your breath with your deep core muscles for gentle activation.',
    arDesc: 'يربط تنفسك بعضلاتك الأساسية العميقة لتفعيل لطيف.',
    enSteps: [
      'Lie on your back, knees bent.',
      'Place one hand on your belly.',
      'Inhale slowly through your nose — let your belly rise.',
      'Exhale through your mouth, gently pulling your belly inward.',
      'Perform 5–10 slow breath cycles.',
    ],
    arSteps: [
      'استلقي على ظهرك مع ثني الركبتين.',
      'ضعي يداً على بطنك.',
      'شهيق ببطء من أنفك — دعي بطنك يرتفع.',
      'زفير من فمك مع سحب البطن برفق للداخل.',
      'اعملي ٥–١٠ دورات تنفس هادئة.',
    ],
    videoUrl: "https://www.youtube.com/shorts/Mw1PQZ6sQmI?feature=share" , // TODO: paste YouTube URL
  },
  {
    id: 'heel-slides',
    enName: 'Heel Slides',
    arName: 'انزلاق الكعب',
    category: 'core',
    phase: ['gentle', 'active'],
    enDesc: 'Low-impact core activation to safely rebuild abdominal strength.',
    arDesc: 'تفعيل للعضلات الأساسية بضغط منخفض لإعادة بناء قوة البطن بأمان.',
    enSteps: [
      'Lie on your back, knees bent, feet flat.',
      'Breathe in; as you exhale, engage your core gently.',
      'Slowly slide one heel along the floor, straightening the leg.',
      'Slide it back to the start. Alternate legs.',
      'Repeat 8–12 times each side.',
    ],
    arSteps: [
      'استلقي على ظهرك، ركبتان مثنيتان، قدمان على الأرض.',
      'شهيق؛ عند الزفير، شدّي عضلاتك الأساسية برفق.',
      'أمرري كعباً ببطء على الأرض لتمديد الساق.',
      'أعيديها للبداية. بادلي الساقين.',
      'كرري ٨–١٢ مرة لكل جانب.',
    ],
    videoUrl:"https://www.youtube.com/shorts/t17Z6HeiiQs?feature=share" , // TODO: paste YouTube URL
  },
  // ── Cardio ────────────────────────────────────────────────────────────────
  {
    id: 'gentle-walking',
    enName: 'Gentle Walking',
    arName: 'المشي اللطيف',
    category: 'cardio',
    phase: ['early', 'gentle'],
    enDesc: 'Low-impact movement to boost circulation and lift mood without strain.',
    arDesc: 'حركة بضغط منخفض لتحسين الدورة الدموية ورفع المزاج بدون إجهاد.',
    enSteps: [
      'Start with 5–10 minutes of slow, flat-surface walking.',
      'Increase by 5 minutes each week as tolerated.',
      'Walk in comfortable, supportive shoes.',
      'Stop if you feel pain, heaviness, or leaking.',
      'Aim for 20–30 min by week 6.',
    ],
    arSteps: [
      'ابدئي بـ ٥–١٠ دقائق من المشي الهادئ على أرض مستوية.',
      'زيدي ٥ دقائق أسبوعياً حسب قدرتك.',
      'امشي بحذاء مريح وداعم.',
      'توقفي إذا شعرت بألم أو ثقل أو تسرب.',
      'استهدفي ٢٠–٣٠ دقيقة بحلول الأسبوع ٦.',
    ],
    videoUrl: null, // TODO: paste YouTube URL
  },
  {
    id: 'marching',
    enName: 'Seated Marching',
    arName: 'المسيرة الجلوس',
    category: 'cardio',
    phase: ['early'],
    enDesc: 'A safe chair-based movement to gently increase heart rate.',
    arDesc: 'حركة آمنة على الكرسي لرفع معدل ضربات القلب بلطف.',
    enSteps: [
      'Sit tall on a sturdy chair.',
      'Lift one knee toward your chest, then lower.',
      'Alternate legs in a marching rhythm.',
      'Continue for 1–3 minutes.',
      'Rest and repeat if comfortable.',
    ],
    arSteps: [
      'اجلسي منتصبة على كرسي متين.',
      'ارفعي ركبةً نحو صدرك ثم أنزليها.',
      'بادلي الساقين بإيقاع تمشٍّ.',
      'استمري ١–٣ دقائق.',
      'ارتاحي وكرري إذا كنت مرتاحة.',
    ],
    videoUrl: "https://www.youtube.com/shorts/3uYm4pjByP0?feature=share", // TODO: paste YouTube URL
  },
  // ── Strength ──────────────────────────────────────────────────────────────
  {
    id: 'glute-bridges',
    enName: 'Glute Bridges',
    arName: 'جسر الأرداف',
    category: 'strength',
    phase: ['gentle', 'active'],
    enDesc: 'Rebuilds glute and posterior chain strength, essential for carrying your baby.',
    arDesc: 'يعيد بناء قوة عضلات الأرداف، وهي ضرورية لحمل طفلك.',
    enSteps: [
      'Lie on your back, knees bent, feet hip-width apart.',
      'Inhale; on exhale, engage your core and squeeze your glutes.',
      'Lift your hips off the floor until your body forms a straight line.',
      'Hold 2–3 seconds at the top.',
      'Lower slowly. Repeat 10–15 times.',
    ],
    arSteps: [
      'استلقي على ظهرك، ركبتان مثنيتان، قدمان بعرض الوركين.',
      'شهيق؛ عند الزفير، شدّي عضلاتك الأساسية واضغطي على عضلات الأرداف.',
      'ارفعي وركيك عن الأرض حتى يتشكل جسمك خطاً مستقيماً.',
      'احتفظي بالوضعية ٢–٣ ثوانٍ في الأعلى.',
      'انزلي ببطء. كرري ١٠–١٥ مرة.',
    ],
    videoUrl: "https://www.youtube.com/shorts/qXMFvK6mzDw?feature=share", // TODO: paste YouTube URL
  },
  {
    id: 'wall-push-ups',
    enName: 'Wall Push-Ups',
    arName: 'ضغط الجدار',
    category: 'strength',
    phase: ['gentle', 'active'],
    enDesc: 'Rebuilds upper-body strength in a low-impact, wrist-friendly way.',
    arDesc: 'يعيد بناء قوة الجزء العلوي من الجسم بطريقة ملائمة للمعصم.',
    enSteps: [
      'Stand facing a wall, hands at shoulder height.',
      'Step back so your arms are almost straight.',
      'Bend your elbows, lowering your chest toward the wall.',
      'Push back to start. Keep your core engaged throughout.',
      'Repeat 10–15 times.',
    ],
    arSteps: [
      'قفي مواجهةً للجدار، يدان على ارتفاع الكتفين.',
      'تراجعي خطوة حتى تمتد ذراعاك تقريباً.',
      'اثني مرفقيك لتقريب صدرك من الجدار.',
      'ادفعي للخلف للبداية. حافظي على تفعيل عضلاتك الأساسية.',
      'كرري ١٠–١٥ مرة.',
    ],
    videoUrl: "https://www.youtube.com/shorts/iqC-V7tiE_U?feature=share", // TODO: paste YouTube URL
  },
];

const BENEFITS = [
  { enLabel: 'Mood',          arLabel: 'المزاج',          enValue: 'Lifts spirits',   arValue: 'يرفع الروح المعنوية', Icon: Heart,   bg: 'bg-feeding-tint' },
  { enLabel: 'Energy',        arLabel: 'الطاقة',          enValue: 'Reduces fatigue', arValue: 'يقلل التعب',          Icon: Zap,     bg: 'bg-warm-soft' },
  { enLabel: 'Bladder',       arLabel: 'المثانة',         enValue: 'Reduces leaks',   arValue: 'يقلل التسرب',         Icon: Shield,  bg: 'bg-teal-soft' },
  { enLabel: 'Sleep',         arLabel: 'النوم',           enValue: 'Better rest',     arValue: 'نوم أفضل',            Icon: Moon,    bg: 'bg-sleep-soft' },
  { enLabel: 'Core Strength', arLabel: 'قوة العضلات',    enValue: 'Rebuilt safely',  arValue: 'إعادة بناء آمنة',     Icon: Dumbbell,bg: 'bg-soft-surface' },
  { enLabel: 'Weight',        arLabel: 'الوزن',           enValue: 'Healthy balance', arValue: 'توازن صحي',           Icon: Scale,   bg: 'bg-teal-soft' },
];

const STOP_SIGNS_EN = [
  'Heavy vaginal bleeding or increased lochia',
  'Severe pain in abdomen, pelvis, or incision site',
  'Dizziness, chest pain, or shortness of breath',
  'Urine or stool leakage during exercise',
  'Bulging or pressure in the pelvic area',
  'Fever above 38°C (100.4°F)',
];
const STOP_SIGNS_AR = [
  'نزيف مهبلي غزير أو زيادة في الإفرازات',
  'ألم شديد في البطن أو الحوض أو موضع الشق',
  'دوخة أو ألم في الصدر أو ضيق التنفس',
  'تسرب بول أو براز أثناء التمرين',
  'انتفاخ أو ضغط في منطقة الحوض',
  'حرارة فوق ٣٨ درجة مئوية',
];

// ─── Exercise Card (accordion) ────────────────────────────────────────────────
function ExerciseCard({
  exercise,
  isOpen,
  onToggle,
  lang,
}: {
  exercise: Exercise;
  isOpen: boolean;
  onToggle: () => void;
  lang: 'en' | 'ar';
}) {
  const name = lang === 'ar' ? exercise.arName : exercise.enName;
  const desc = lang === 'ar' ? exercise.arDesc : exercise.enDesc;
  const steps = lang === 'ar' ? exercise.arSteps : exercise.enSteps;
  const catLabel = CATEGORIES.find((c) => c.id === exercise.category);
  const catColor = CATEGORY_COLORS[exercise.category];

  return (
    <div
      className={`bg-white rounded-2xl shadow-soft overflow-hidden border-2 transition-all duration-200 ${
        isOpen ? 'border-primary' : 'border-transparent'
      }`}
    >
      <button
        className="w-full text-start px-4 py-3.5 flex items-start gap-3"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`exercise-steps-${exercise.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catColor}`}>
              {lang === 'ar' ? catLabel?.arLabel : catLabel?.enLabel}
            </span>
          </div>
          <p className="text-sm font-bold text-text-primary">{name}</p>
          <p className="text-xs text-text-hint mt-0.5 leading-relaxed">{desc}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-1"
        >
          <ChevronDown size={16} className="text-text-secondary" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`exercise-steps-${exercise.id}`}
            key="steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border">
              <p className="text-xs font-semibold text-text-secondary mb-2">
                {lang === 'ar' ? 'خطوات التمرين:' : 'How to do it:'}
              </p>
              <ol className="flex flex-col gap-2" aria-label={lang === 'ar' ? 'خطوات' : 'Steps'}>
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
              {exercise.videoUrl && (
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={lang === 'ar' ? 'شاهد الفيديو على يوتيوب' : 'Watch video on YouTube'}
                  className="mt-3 flex items-center gap-2 w-fit bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-3 py-1.5 text-xs font-semibold active:scale-[0.97] transition-transform"
                >
                  <span>▶</span>
                  <span>{lang === 'ar' ? 'شاهد الفيديو' : 'Watch video'}</span>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function PostpartumExerciseScreen() {
  const { lang } = useT();
  const navigate = useNavigate();

  const [activePhase, setActivePhase] = useState<Phase>('early');
  const [activeCategory, setActiveCategory] = useState<Category>('pelvic');
  const [openExerciseId, setOpenExerciseId] = useState<string | null>(null);

  const filtered = EXERCISES.filter(
    (e) => e.category === activeCategory && e.phase.includes(activePhase)
  );

  const handleToggle = (id: string) => {
    setOpenExerciseId((prev) => (prev === id ? null : id));
  };

  return (
    <AppShell
      title={lang === 'ar' ? 'دليل تمارين ما بعد الولادة' : 'Postpartum Exercise Guide'}
      showBack
      showNav={false}
    >
      {/* ── Phase Timeline ─────────────────────────────────────────────────── */}
      <section aria-label={lang === 'ar' ? 'مراحل التعافي' : 'Recovery Phases'} className="mb-5">
        <p className="text-xs font-semibold text-text-hint mb-3 uppercase tracking-wide">
          {lang === 'ar' ? 'مرحلة التعافي' : 'Recovery Phase'}
        </p>
        <div className="flex flex-col gap-2">
          {PHASES.map((phase) => {
            const isActive = activePhase === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => {
                  setActivePhase(phase.id);
                  setOpenExerciseId(null);
                }}
                aria-pressed={isActive}
                className={`w-full text-start rounded-2xl border-2 px-4 py-3 transition-all duration-200 bg-gradient-to-r ${
                  isActive ? phase.color + ' shadow-soft scale-[1.01]' : 'border-border bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconCircle icon={phase.icon} bg={phase.iconBg} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      {lang === 'ar' ? phase.arTitle : phase.enTitle}
                      <span className="mx-1.5 text-text-hint font-normal">·</span>
                      <span className="font-medium text-text-secondary">
                        {lang === 'ar' ? phase.arDesc : phase.enDesc}
                      </span>
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Category Tabs ──────────────────────────────────────────────────── */}
      <section aria-label={lang === 'ar' ? 'فئات التمارين' : 'Exercise Categories'} className="mb-4">
        <div
          className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
          role="tablist"
          aria-label={lang === 'ar' ? 'الفئات' : 'Categories'}
        >
          {CATEGORIES.map((cat) => (
            <Pill
              key={cat.id}
              label={lang === 'ar' ? cat.arLabel : cat.enLabel}
              active={activeCategory === cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setOpenExerciseId(null);
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Exercise Cards ─────────────────────────────────────────────────── */}
      <section
        aria-label={lang === 'ar' ? 'التمارين' : 'Exercises'}
        className="mb-6"
      >
        {filtered.length === 0 ? (
          <SoftCard className="text-center py-6">
            <IconCircle icon={<PersonStanding size={24} aria-hidden="true" />} bg="bg-teal-soft" size="md" className="mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              {lang === 'ar'
                ? 'لا توجد تمارين لهذا الاختيار حالياً'
                : 'No exercises for this selection yet'}
            </p>
          </SoftCard>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((ex) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ExerciseCard
                  exercise={ex}
                  isOpen={openExerciseId === ex.id}
                  onToggle={() => handleToggle(ex.id)}
                  lang={lang}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Benefits ───────────────────────────────────────────────────────── */}
      <section aria-label={lang === 'ar' ? 'الفوائد' : 'Benefits'} className="mb-6">
        <p className="text-sm font-semibold text-text-primary mb-3">
          {lang === 'ar' ? 'فوائد التمرين المنتظم' : 'Benefits of Regular Exercise'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {BENEFITS.map((b) => (
            <div key={b.enLabel} className={`rounded-2xl p-3 text-center ${b.bg}`}>
              <div className="flex justify-center mb-1">
                <b.Icon size={16} className="text-text-secondary" aria-hidden="true" />
              </div>
              <p className="text-[10px] font-bold leading-tight text-text-primary">
                {lang === 'ar' ? b.arLabel : b.enLabel}
              </p>
              <p className="text-[9px] text-text-secondary leading-tight mt-0.5">
                {lang === 'ar' ? b.arValue : b.enValue}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Warning Banner ─────────────────────────────────────────────────── */}
      <section
        aria-label={lang === 'ar' ? 'تحذير طبي' : 'Medical Warning'}
        className="mb-6"
      >
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <p className="text-sm font-bold text-rose-700">
              {lang === 'ar' ? 'توقفي واتصلي بطبيبتك إذا شعرت بـ:' : 'Stop & call your doctor if you experience:'}
            </p>
          </div>
          <ul className="flex flex-col gap-1.5" role="list">
            {(lang === 'ar' ? STOP_SIGNS_AR : STOP_SIGNS_EN).map((sign, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <p className="text-xs text-rose-700 leading-relaxed">{sign}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA Buttons ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pb-4">
        <PrimaryButton onClick={() => navigate('/mom-recovery')}>
          {lang === 'ar' ? '← العودة لتعافي الأم' : '← Back to Mom Recovery'}
        </PrimaryButton>
        <SecondaryButton onClick={() => navigate('/doctor-questions')}>
          <span className="flex items-center justify-center gap-2">
            <HelpCircle size={16} aria-hidden="true" />
            {lang === 'ar' ? 'أسئلة لطبيبتك' : 'Questions for Your Doctor'}
          </span>
        </SecondaryButton>
      </div>
    </AppShell>
  );
}

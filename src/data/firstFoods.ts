

// ─── First Foods Data ─────────────────────────────────────────────────────────

export interface FoodItem {
  id: string;
  nameEn: string;
  nameAr: string;
  ageRange: '6-7' | '8-9' | '10-12';
  textureEn: string;
  textureAr: string;
  ingredientsEn: string[];
  ingredientsAr: string[];
  stepsEn: string[];
  stepsAr: string[];
  allergyNote?: string;
  allergyNoteAr?: string;
  chokingNote?: string;
  chokingNoteAr?: string;
  emoji: string;
}

export const foodItems: FoodItem[] = [
  {
    id: 'avocado',
    nameEn: 'Mashed Avocado',
    nameAr: 'أفوكادو مهروس',
    ageRange: '6-7',
    textureEn: 'Smooth purée',
    textureAr: 'هريسة ناعمة',
    ingredientsEn: ['1/4 ripe avocado'],
    ingredientsAr: ['١/٤ حبة أفوكادو ناضجة'],
    stepsEn: ['Peel and remove seed', 'Mash with fork until smooth', 'Add a little breast milk or formula if needed to thin'],
    stepsAr: ['قشّر وأزل النواة', 'اهرس بالشوكة حتى يصبح ناعماً', 'أضف قليلاً من حليب الأم أو الصناعي إذا لزم'],
    allergyNote: 'Rare but possible allergy',
    allergyNoteAr: 'حساسية نادرة لكن ممكنة',
    emoji: '🥑',
  },
  {
    id: 'banana',
    nameEn: 'Banana Purée',
    nameAr: 'موز مهروس',
    ageRange: '6-7',
    textureEn: 'Smooth purée',
    textureAr: 'هريسة ناعمة',
    ingredientsEn: ['1/2 ripe banana'],
    ingredientsAr: ['نصف حبة موز ناضجة'],
    stepsEn: ['Peel banana', 'Mash until smooth', 'Serve immediately or refrigerate for up to 24 hours'],
    stepsAr: ['قشّر الموزة', 'اهرس حتى يصبح ناعماً', 'قدّم فوراً أو احفظ في الثلاجة لمدة ٢٤ ساعة'],
    emoji: '🍌',
  },
  {
    id: 'sweet-potato',
    nameEn: 'Mashed Sweet Potato',
    nameAr: 'بطاطا حلوة مهروسة',
    ageRange: '6-7',
    textureEn: 'Smooth purée',
    textureAr: 'هريسة ناعمة',
    ingredientsEn: ['1 small sweet potato'],
    ingredientsAr: ['بطاطا حلوة صغيرة'],
    stepsEn: ['Peel and dice', 'Steam or boil until very soft (15–20 min)', 'Blend or mash until smooth', 'Cool before serving'],
    stepsAr: ['قشّر وقطّع', 'بخّر أو اسلق حتى تصبح طرية جداً (١٥-٢٠ دقيقة)', 'اخلط أو اهرس حتى يصبح ناعماً', 'برّد قبل التقديم'],
    emoji: '🍠',
  },
  {
    id: 'lentil',
    nameEn: 'Lentil Purée',
    nameAr: 'هريسة عدس',
    ageRange: '6-7',
    textureEn: 'Smooth purée',
    textureAr: 'هريسة ناعمة',
    ingredientsEn: ['2 tbsp red lentils', 'Water'],
    ingredientsAr: ['٢ ملعقة كبيرة عدس أحمر', 'ماء'],
    stepsEn: ['Rinse lentils', 'Cook in water until very soft', 'Blend with cooking water until smooth'],
    stepsAr: ['اغسل العدس', 'اطبخ في الماء حتى يصبح طرياً جداً', 'اخلط مع ماء الطبخ حتى يصبح ناعماً'],
    allergyNote: 'Introduce gradually',
    allergyNoteAr: 'قدّم تدريجياً',
    emoji: '🫘',
  },
  {
    id: 'egg',
    nameEn: 'Soft Scrambled Egg',
    nameAr: 'بيض مخفوق طري',
    ageRange: '8-9',
    textureEn: 'Soft, small pieces',
    textureAr: 'طري، قطع صغيرة',
    ingredientsEn: ['1 egg', 'Small amount of butter or oil'],
    ingredientsAr: ['بيضة واحدة', 'كمية صغيرة من الزبدة أو الزيت'],
    stepsEn: ['Crack and whisk egg', 'Cook on low heat, stirring constantly', 'Remove when just set, not dry', 'Cool and serve in small pieces'],
    stepsAr: ['اكسر واخفق البيضة', 'اطبخ على نار هادئة مع التحريك المستمر', 'أخرج من النار عندما ينضج دون أن يجفّ', 'برّد وقدّم في قطع صغيرة'],
    allergyNote: 'Egg is a common allergen — introduce one food at a time, wait 3 days.',
    allergyNoteAr: 'البيض من الحساسيات الشائعة — قدّم طعاماً واحداً في كل مرة وانتظر ٣ أيام.',
    emoji: '🥚',
  },
  {
    id: 'yogurt',
    nameEn: 'Plain Yogurt',
    nameAr: 'زبادي سادة',
    ageRange: '8-9',
    textureEn: 'Smooth, creamy',
    textureAr: 'ناعم وكريمي',
    ingredientsEn: ['Full-fat plain yogurt (no added sugar)'],
    ingredientsAr: ['زبادي كامل الدهن بدون سكر مضاف'],
    stepsEn: ['Use plain, full-fat yogurt only', 'Serve as is or mix with pureed fruit', 'No honey — use mashed banana for sweetness if needed'],
    stepsAr: ['استخدم زبادي سادة كامل الدهن فقط', 'قدّم كما هو أو امزج مع فاكهة مهروسة', 'لا عسل — استخدم موزاً مهروساً للتحلية إذا لزم'],
    allergyNote: 'Dairy allergy — introduce carefully.',
    allergyNoteAr: 'حساسية الألبان — قدّم بحذر.',
    emoji: '🥛',
  },
  {
    id: 'oatmeal',
    nameEn: 'Baby Oatmeal',
    nameAr: 'شوفان للرضع',
    ageRange: '6-7',
    textureEn: 'Smooth porridge',
    textureAr: 'عصيدة ناعمة',
    ingredientsEn: ['2 tbsp baby oats', 'Breast milk or formula'],
    ingredientsAr: ['٢ ملعقة كبيرة شوفان للرضع', 'حليب أم أو صناعي'],
    stepsEn: ['Cook oats with water', 'Mix with breast milk or formula to desired consistency', 'Cool and serve'],
    stepsAr: ['اطبخ الشوفان بالماء', 'امزج مع حليب الأم أو الصناعي للقوام المناسب', 'برّد وقدّم'],
    emoji: '🌾',
  },
  {
    id: 'pumpkin',
    nameEn: 'Pumpkin Purée',
    nameAr: 'هريسة قرع عسلي',
    ageRange: '6-7',
    textureEn: 'Smooth purée',
    textureAr: 'هريسة ناعمة',
    ingredientsEn: ['1/2 cup pumpkin (peeled, cubed)'],
    ingredientsAr: ['نصف كوب قرع عسلي (مقشر ومقطع)'],
    stepsEn: ['Steam until very soft', 'Blend until smooth', 'Add water if too thick'],
    stepsAr: ['بخّر حتى يصبح طرياً جداً', 'اخلط حتى يصبح ناعماً', 'أضف ماءً إذا كان سميكاً جداً'],
    emoji: '🎃',
  },
  {
    id: 'finger-banana',
    nameEn: 'Banana Fingers',
    nameAr: 'قطع موز للمضغ',
    ageRange: '10-12',
    textureEn: 'Soft finger food',
    textureAr: 'طعام يدوي طري',
    ingredientsEn: ['1/2 ripe banana'],
    ingredientsAr: ['نصف موزة ناضجة'],
    stepsEn: ['Cut banana into finger-sized pieces', 'Offer one piece at a time', 'Supervise closely'],
    stepsAr: ['قطّع الموزة إلى قطع بحجم الإصبع', 'قدّم قطعة واحدة في كل مرة', 'راقب عن كثب'],
    chokingNote: 'Always supervise. Ensure baby is sitting upright.',
    chokingNoteAr: 'راقب دائماً. تأكد أن الطفل جالس بشكل مستقيم.',
    emoji: '🍌',
  },
];

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const defaultSeedData = {
  medicines: [
    {
      id: 'med-1',
      name: 'Vitamin D Drops',
      dose: '400 IU',
      frequency: 'Once daily',
      time: '08:00',
      startDate: new Date().toISOString().slice(0, 10),
      reminderEnabled: true,
      notes: 'Give with feeding',
    },
  ],
  appointments: [
    {
      id: 'apt-1',
      title: '2-Month Checkup',
      type: 'pediatrician' as const,
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
      })(),
      time: '10:00',
      notes: 'Bring vaccination card',
    },
  ],
};

export interface BannerThemeOption {
  id: string;
  name: string;
  category: 'trending' | 'gaming' | 'animated' | 'gradient' | 'luxury';
  previewGradient: string;
  backgroundClass: string;
  textColor: string;
  accentColor: string;
  badgeBg: string;
  effect?: 'cyber-grid' | 'stars' | 'matrix' | 'sparks' | 'sakura' | 'aurora' | 'bubbles' | 'none';
  description: string;
}

export interface AvatarFrameOption {
  id: string;
  name: string;
  category: 'neon' | 'gaming' | 'luxury' | 'animated' | 'classic';
  previewClass: string;
  frameClass: string;
  glowClass?: string;
  badgeIcon?: string;
  description: string;
}

export interface AvatarShapeOption {
  id: 'circle' | 'squircle' | 'hexagon' | 'diamond' | 'shield';
  name: string;
  shapeClass: string;
  clipPath?: string;
}

export interface AnimatedEffectOption {
  id: 'none' | 'stars' | 'sparks' | 'cyber-grid' | 'matrix' | 'sakura' | 'aurora' | 'bubbles';
  name: string;
  icon: string;
  description: string;
}

export interface BadgeOption {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgClass: string;
}

export interface TrendingPreset {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  bannerTheme: string;
  avatarFrame: string;
  avatarShape: 'circle' | 'squircle' | 'hexagon' | 'diamond' | 'shield';
  cardTheme: string;
  animatedEffect: 'none' | 'stars' | 'sparks' | 'cyber-grid' | 'matrix' | 'sakura' | 'aurora' | 'bubbles';
  badgeTitle: string;
  badgeIcon: string;
  badgeColor: string;
  fontStyle: 'default' | 'gaming' | 'modern' | 'luxury';
}

// 1. Banner Themes & Gaming / Animated Backgrounds
export const BANNER_THEMES: BannerThemeOption[] = [
  // Trending Gaming Themes
  {
    id: 'cyberpunk-2077',
    name: '🎮 سايبر بانك 2077 (Cyberpunk)',
    category: 'gaming',
    previewGradient: 'from-amber-400 via-rose-600 to-cyan-500',
    backgroundClass: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-cyan-950 text-cyan-100',
    textColor: 'text-cyan-300',
    accentColor: '#06b6d4',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    effect: 'cyber-grid',
    description: 'مدينة المستقبل مع نيون أزرق وسماوي وشبكة سايبر ثلاثية الأبعاد'
  },
  {
    id: 'pixel-arcade',
    name: '👾 ريترو بيكسل آركيد (8-Bit Pixel)',
    category: 'gaming',
    previewGradient: 'from-indigo-900 via-purple-800 to-pink-600',
    backgroundClass: 'bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-950 text-pink-200',
    textColor: 'text-pink-400',
    accentColor: '#f43f5e',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    effect: 'sparks',
    description: 'أجواء ألعاب الآركيد الكلاسيكية وشاشات الألعاب القديمة'
  },
  {
    id: 'nebula-space',
    name: '🚀 سديم الفضاء الكوني (Cosmic Nebula)',
    category: 'animated',
    previewGradient: 'from-blue-900 via-purple-900 to-black',
    backgroundClass: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-purple-100',
    textColor: 'text-indigo-300',
    accentColor: '#818cf8',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    effect: 'stars',
    description: 'مجرات بعيدة ونجوم متلألئة مع أضواء بنفسجية فضائية'
  },
  {
    id: 'dragon-magma',
    name: '🔥 نار التنين والماجما (Dragon Magma)',
    category: 'gaming',
    previewGradient: 'from-red-900 via-amber-700 to-black',
    backgroundClass: 'bg-gradient-to-r from-stone-950 via-red-950 to-orange-950 text-amber-200',
    textColor: 'text-amber-400',
    accentColor: '#f59e0b',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    effect: 'sparks',
    description: 'لهيب الحمم البركانية والشرارات المتصاعدة بقوة ملحمية'
  },
  {
    id: 'matrix-rain',
    name: '⚡ مطر الماتريكس الرقمي (Digital Matrix)',
    category: 'animated',
    previewGradient: 'from-emerald-950 via-black to-emerald-900',
    backgroundClass: 'bg-gradient-to-b from-black via-emerald-950 to-black text-emerald-300',
    textColor: 'text-emerald-400',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    effect: 'matrix',
    description: 'رموز الشيفرة البرمجية الخضراء الساقطة كالمطر الرقمي'
  },
  {
    id: 'sakura-anime',
    name: '🌸 حديقة الساكورا أنمي (Sakura Lofi)',
    category: 'trending',
    previewGradient: 'from-pink-300 via-rose-200 to-indigo-300',
    backgroundClass: 'bg-gradient-to-r from-pink-900/90 via-purple-900/90 to-rose-950 text-pink-100',
    textColor: 'text-pink-300',
    accentColor: '#f472b6',
    badgeBg: 'bg-pink-400/20 text-pink-200 border-pink-400/40',
    effect: 'sakura',
    description: 'أوراق أزهار الكرز المتطايرة في نسيم الأنمي الهادئ'
  },
  {
    id: 'synthwave-80s',
    name: '🕹️ سينث ويف الغروب (Synthwave 80s)',
    category: 'trending',
    previewGradient: 'from-fuchsia-600 via-purple-800 to-sky-500',
    backgroundClass: 'bg-gradient-to-b from-purple-950 via-fuchsia-950 to-slate-950 text-fuchsia-200',
    textColor: 'text-fuchsia-400',
    accentColor: '#d946ef',
    badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    effect: 'cyber-grid',
    description: 'شبكة ليزر بنفسجية مع شمس الغروب النيون الكلاسيكية'
  },
  {
    id: 'royal-gold',
    name: '👑 الملكي الأسود والذهب (Royal Obsidian & Gold)',
    category: 'luxury',
    previewGradient: 'from-amber-600 via-yellow-500 to-black',
    backgroundClass: 'bg-gradient-to-r from-zinc-950 via-stone-900 to-amber-950 text-amber-100',
    textColor: 'text-amber-300',
    accentColor: '#fbbf24',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    effect: 'sparks',
    description: 'فخامة ملكية متألقة بالذهب والسبج الأسود الخالص'
  },
  {
    id: 'midnight-aurora',
    name: '🌌 الشفق القطبي الشمالي (Nordic Aurora)',
    category: 'animated',
    previewGradient: 'from-teal-600 via-emerald-700 to-indigo-900',
    backgroundClass: 'bg-gradient-to-br from-slate-950 via-teal-950 to-indigo-950 text-teal-100',
    textColor: 'text-teal-300',
    accentColor: '#2dd4bf',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    effect: 'aurora',
    description: 'تموجات الأضواء القطبية الخضراء والزرقاء الساحرة'
  },
  {
    id: 'valorant-esports',
    name: '⚔️ إي سبورتس وريد زون (Esports Arena)',
    category: 'gaming',
    previewGradient: 'from-rose-600 via-red-800 to-zinc-900',
    backgroundClass: 'bg-gradient-to-r from-zinc-950 via-red-950 to-zinc-900 text-rose-100',
    textColor: 'text-rose-400',
    accentColor: '#f43f5e',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    effect: 'cyber-grid',
    description: 'طابع حماسي لبطولات الألعاب الاحترافية باللون الأحمر والأسود'
  },
  {
    id: 'diamond-ice',
    name: '💎 الكريستال والجليد الماسي (Diamond Frost)',
    category: 'luxury',
    previewGradient: 'from-cyan-400 via-blue-500 to-indigo-900',
    backgroundClass: 'bg-gradient-to-br from-slate-950 via-sky-950 to-blue-950 text-sky-100',
    textColor: 'text-sky-300',
    accentColor: '#38bdf8',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    effect: 'stars',
    description: 'أناقة الجليد والكريستال الماسي البراق فائق النقاوة'
  },
  {
    id: 'classic-blue',
    name: '🔷 الكلاسيكي الأزرق المشرق (Original Blue)',
    category: 'gradient',
    previewGradient: 'from-blue-600 via-indigo-600 to-sky-600',
    backgroundClass: 'bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white',
    textColor: 'text-blue-100',
    accentColor: '#3b82f6',
    badgeBg: 'bg-white/20 text-white border-white/30',
    effect: 'none',
    description: 'السمة الزرقاء الرسمية المعتمدة لنظام مكتبه الهدى'
  }
];

// 2. Avatar Ring / Frame Customization (شريط وخلفية إطار الصورة)
export const AVATAR_FRAMES: AvatarFrameOption[] = [
  {
    id: 'rainbow-chroma',
    name: '🌈 قوس قزح دوّار (RGB Chroma Spin)',
    category: 'animated',
    previewClass: 'p-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full animate-spin',
    frameClass: 'p-[4px] bg-[conic-gradient(from_0deg,#ef4444,#eab308,#22c55e,#06b6d4,#3b82f6,#a855f7,#ef4444)] animate-spin-slow shadow-lg shadow-purple-500/30',
    glowClass: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    description: 'إطار متحرك متعدد الألوان يدور بسلاسة مستمرة'
  },
  {
    id: 'neon-cyan',
    name: '⚡ نيون سايبر متوهج (Cyber Neon Cyan)',
    category: 'neon',
    previewClass: 'p-1 bg-cyan-400 rounded-full shadow-[0_0_12px_#06b6d4]',
    frameClass: 'p-[4px] bg-gradient-to-tr from-cyan-500 via-sky-400 to-teal-300 shadow-[0_0_22px_rgba(6,182,212,0.85)] animate-pulse',
    glowClass: 'shadow-[0_0_25px_rgba(6,182,212,0.9)]',
    description: 'شريط نيون أزرق سماوي نابض بتوهج كهربائي مستقبلي'
  },
  {
    id: 'fire-flame',
    name: '🔥 هالة اللهب والتنين (Fire Aura)',
    category: 'gaming',
    previewClass: 'p-1 bg-gradient-to-tr from-red-600 via-orange-500 to-yellow-400 rounded-full shadow-[0_0_12px_#ef4444]',
    frameClass: 'p-[4px] bg-gradient-to-tr from-red-600 via-amber-500 to-orange-400 shadow-[0_0_25px_rgba(239,68,68,0.85)] ring-2 ring-amber-400/60',
    glowClass: 'shadow-[0_0_28px_rgba(245,158,11,0.9)]',
    description: 'إطار بركاني مشتعل بألوان النار والشرار'
  },
  {
    id: 'royal-gold-crown',
    name: '👑 التاج الملكي الذهبي (Royal Gold Frame)',
    category: 'luxury',
    previewClass: 'p-1 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 rounded-full shadow-[0_0_10px_#eab308]',
    frameClass: 'p-[4px] bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 shadow-[0_0_20px_rgba(234,179,8,0.7)] ring-2 ring-yellow-300/80',
    glowClass: 'shadow-[0_0_20px_rgba(234,179,8,0.8)]',
    description: 'إطار ذهبي نقي يعكس الفخامة والمكانة العالية'
  },
  {
    id: 'diamond-frost-shimmer',
    name: '💎 بريق الماس الجليدي (Diamond Shimmer)',
    category: 'luxury',
    previewClass: 'p-1 bg-gradient-to-tr from-sky-300 via-white to-blue-400 rounded-full shadow-[0_0_12px_#38bdf8]',
    frameClass: 'p-[4px] bg-gradient-to-tr from-sky-200 via-white to-blue-400 shadow-[0_0_22px_rgba(56,189,248,0.8)] ring-2 ring-white/90',
    glowClass: 'shadow-[0_0_25px_rgba(255,255,255,0.8)]',
    description: 'شريط متلألئ أبيض وسماوي يحاكي بريق قطع الماس'
  },
  {
    id: 'cyber-hud-segmented',
    name: '🛡️ شريط السايبر المقسم (Cyber Segmented HUD)',
    category: 'gaming',
    previewClass: 'p-1 border-2 border-dashed border-cyan-400 rounded-full',
    frameClass: 'p-[4px] bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 ring-2 ring-offset-2 ring-cyan-400 ring-offset-zinc-950 border-2 border-dashed border-white/50',
    glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.7)]',
    description: 'إطار مقسم ثلاثي الأبعاد مستوحى من واجهات ألعاب الفضاء'
  },
  {
    id: 'pixel-8bit-frame',
    name: '👾 إطار بيكسل آركيد (Pixel 8-Bit Border)',
    category: 'gaming',
    previewClass: 'p-1 border-4 border-fuchsia-500 rounded-none',
    frameClass: 'p-[5px] bg-fuchsia-600 ring-4 ring-yellow-400 ring-offset-2 ring-offset-black',
    glowClass: 'shadow-[0_0_18px_rgba(217,70,239,0.9)]',
    description: 'إطار كلاسيكي حاد مستوحى من كونسولات الألعاب القديمة'
  },
  {
    id: 'dark-matter-void',
    name: '🔮 المادة المظلمة البنفسجية (Dark Void Pulse)',
    category: 'animated',
    previewClass: 'p-1 bg-gradient-to-tr from-purple-800 via-fuchsia-600 to-indigo-900 rounded-full',
    frameClass: 'p-[4px] bg-gradient-to-tr from-purple-900 via-fuchsia-500 to-indigo-600 shadow-[0_0_22px_rgba(192,38,211,0.8)] ring-2 ring-fuchsia-400/50',
    glowClass: 'shadow-[0_0_24px_rgba(192,38,211,0.8)]',
    description: 'شريط هالة طاقة مظلمة متدفقة بتدرج بنفسجي غامض'
  },
  {
    id: 'sakura-floral-ring',
    name: '🌸 طوق الساكورا الوردي (Sakura Blossom Ring)',
    category: 'neon',
    previewClass: 'p-1 bg-gradient-to-tr from-pink-400 via-rose-300 to-pink-500 rounded-full',
    frameClass: 'p-[4px] bg-gradient-to-tr from-pink-400 via-rose-200 to-pink-500 shadow-[0_0_20px_rgba(244,114,182,0.8)] ring-2 ring-pink-200/90',
    glowClass: 'shadow-[0_0_20px_rgba(244,114,182,0.8)]',
    description: 'طوق زهري أنيق يفيض بنعومة وجمال أزهار الساكورا'
  },
  {
    id: 'classic-white',
    name: '⚪ الكلاسيكي الأبيض النقي (Classic White Ring)',
    category: 'classic',
    previewClass: 'p-1 bg-white/40 rounded-full border border-white',
    frameClass: 'p-[3px] bg-white/20 ring-2 ring-white/80 shadow-md',
    glowClass: '',
    description: 'إطار أبيض ناعم وبسيط وراقي'
  },
  {
    id: 'none',
    name: '🔘 بدون إطار (None)',
    category: 'classic',
    previewClass: 'p-0.5 border border-gray-300 rounded-full',
    frameClass: 'p-0',
    glowClass: '',
    description: 'عرض الصورة بحافتها الطبيعية بدون أي تأثيرات'
  }
];

// 3. Avatar Shapes (أشكال صورة الملف الشخصي)
export const AVATAR_SHAPES: AvatarShapeOption[] = [
  {
    id: 'circle',
    name: 'دائري كلاسيكي (Circle)',
    shapeClass: 'rounded-full'
  },
  {
    id: 'squircle',
    name: 'مربع منحني عصري (Squircle)',
    shapeClass: 'rounded-2xl'
  },
  {
    id: 'hexagon',
    name: 'سداسي سايبر مستقبلي (Cyber Hexagon)',
    shapeClass: 'rounded-xl',
    clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)'
  },
  {
    id: 'diamond',
    name: 'ماسة وجوهرة (Diamond Gem)',
    shapeClass: 'rotate-45 rounded-lg'
  },
  {
    id: 'shield',
    name: 'درع الفارس الأسطوري (Legend Shield)',
    shapeClass: 'rounded-t-2xl rounded-b-3xl'
  }
];

// 4. Background Animated Particle / Canvas Effects
export const ANIMATED_EFFECTS: AnimatedEffectOption[] = [
  {
    id: 'none',
    name: 'بدون مؤثرات إضافية',
    icon: '✨',
    description: 'خلفية هادئة بدون حركة جزيئات'
  },
  {
    id: 'stars',
    name: 'نجوم وفضاء متلألئ (Floating Stars)',
    icon: '⭐',
    description: 'نجوم وبريق فضائي يلمع ويتحرك في الخلفية'
  },
  {
    id: 'sparks',
    name: 'شرارات نارية ولهب (Fire Sparks)',
    icon: '🔥',
    description: 'شرارات ملحمية تتصاعد من الأسفل للأعلى'
  },
  {
    id: 'cyber-grid',
    name: 'شبكة ليزر سايبر 3D (3D Cyber Grid)',
    icon: '🌐',
    description: 'أرضية شبكية متوهجة ومتحركة كألعاب السايبر'
  },
  {
    id: 'matrix',
    name: 'شلال الماتريكس الرقمي (Matrix Rain)',
    icon: '💻',
    description: 'أرقام وشفرات خضراء متساقطة بانسيابية'
  },
  {
    id: 'sakura',
    name: 'بتلات أزهار الساكورا (Sakura Petals)',
    icon: '🌸',
    description: 'بتلات ورود يابانية تتساقط برقة ونعومة'
  },
  {
    id: 'aurora',
    name: 'تموجات الشفق القطبي (Aurora Waves)',
    icon: '🌌',
    description: 'أمواج ضوئية متغيرة الألوان بانسيابية رائعة'
  },
  {
    id: 'bubbles',
    name: 'فقاعات نيون متصاعدة (Neon Bubbles)',
    icon: '🫧',
    description: 'فقاعات ضوئية ملونة تصعد ببطء ولمعان'
  }
];

// 5. Profile Role Badges (شارات وألقاب الملف الشخصي)
export const PROFILE_BADGES: BadgeOption[] = [
  {
    id: 'merchant-king',
    title: '👑 ملك التجارة',
    icon: '👑',
    color: '#fbbf24',
    bgClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  {
    id: 'cyber-pro',
    title: '⚡ سايبر برو',
    icon: '⚡',
    color: '#06b6d4',
    bgClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  {
    id: 'gaming-legend',
    title: '🎮 أسطورة الألعاب',
    icon: '🎮',
    color: '#f43f5e',
    bgClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  {
    id: 'diamond-vip',
    title: '💎 عضوية ماسية VIP',
    icon: '💎',
    color: '#38bdf8',
    bgClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
  },
  {
    id: 'golden-star',
    title: '🌟 النجم الذهبي',
    icon: '🌟',
    color: '#f59e0b',
    bgClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  },
  {
    id: 'mythic-guardian',
    title: '🛡️ الحارس الأسطوري',
    icon: '🛡️',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  {
    id: 'space-pioneer',
    title: '🚀 رائد فضاء كوني',
    icon: '🚀',
    color: '#6366f1',
    bgClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  },
  {
    id: 'champion-elite',
    title: '🏆 بطل الأداء النخبوي',
    icon: '🏆',
    color: '#10b981',
    bgClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    id: 'anime-shinobi',
    title: '🌸 أنمي شينوبي',
    icon: '🌸',
    color: '#f472b6',
    bgClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40'
  },
  {
    id: 'fire-dragon',
    title: '🐉 تنين النار المشتعل',
    icon: '🐉',
    color: '#ea580c',
    bgClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
  }
];

// 6. Trending Complete Presets (سمات رائجة كاملة جاهزة بنقرة واحدة)
export const TRENDING_PRESETS: TrendingPreset[] = [
  {
    id: 'preset-cyberpunk',
    name: '⚡ سايبر بانك نايت سيتي',
    tagline: 'نيون مستقبلي مع شبكة سايبر 3D وشريط نيون كهربائي',
    icon: '⚡',
    bannerTheme: 'cyberpunk-2077',
    avatarFrame: 'neon-cyan',
    avatarShape: 'hexagon',
    cardTheme: 'cyber-dark',
    animatedEffect: 'cyber-grid',
    badgeTitle: '⚡ سايبر برو',
    badgeIcon: '⚡',
    badgeColor: '#06b6d4',
    fontStyle: 'gaming'
  },
  {
    id: 'preset-pixel-arcade',
    name: '👾 ريترو آركيد 8-Bit',
    tagline: 'أجواء ألعاب الفيديو الكلاسيكية وإطار بيكسل مشع',
    icon: '👾',
    bannerTheme: 'pixel-arcade',
    avatarFrame: 'pixel-8bit-frame',
    avatarShape: 'squircle',
    cardTheme: 'synthwave',
    animatedEffect: 'sparks',
    badgeTitle: '🎮 أسطورة الألعاب',
    badgeIcon: '🎮',
    badgeColor: '#f43f5e',
    fontStyle: 'gaming'
  },
  {
    id: 'preset-galaxy-nebula',
    name: '🚀 المجرة الكونية السوبرنوفا',
    tagline: 'فضاء عميق وسدم بنفسجية مع بريق النجوم وطوق دوار',
    icon: '🚀',
    bannerTheme: 'nebula-space',
    avatarFrame: 'rainbow-chroma',
    avatarShape: 'circle',
    cardTheme: 'glass',
    animatedEffect: 'stars',
    badgeTitle: '🚀 رائد فضاء كوني',
    badgeIcon: '🚀',
    badgeColor: '#818cf8',
    fontStyle: 'modern'
  },
  {
    id: 'preset-royal-monarch',
    name: '👑 الملكي الإمبراطوري بالذهب',
    tagline: 'فخامة مطلقة بالسبج والذهب النقي وإطار التاج الملكي',
    icon: '👑',
    bannerTheme: 'royal-gold',
    avatarFrame: 'royal-gold-crown',
    avatarShape: 'shield',
    cardTheme: 'gold-luxury',
    animatedEffect: 'sparks',
    badgeTitle: '👑 ملك التجارة',
    badgeIcon: '👑',
    badgeColor: '#fbbf24',
    fontStyle: 'luxury'
  },
  {
    id: 'preset-dragon-magma',
    name: '🔥 أمير التنانين والحمم',
    tagline: 'لهيب بركاني مشتعل وإطار ناري هادر بالشرار',
    icon: '🔥',
    bannerTheme: 'dragon-magma',
    avatarFrame: 'fire-flame',
    avatarShape: 'shield',
    cardTheme: 'cyber-dark',
    animatedEffect: 'sparks',
    badgeTitle: '🐉 تنين النار المشتعل',
    badgeIcon: '🐉',
    badgeColor: '#ea580c',
    fontStyle: 'gaming'
  },
  {
    id: 'preset-sakura-anime',
    name: '🌸 حلم الساكورا والأنمي',
    tagline: 'طابع ياباني شاعري مع تساقط بتلات الورد وإطار وردي متوهج',
    icon: '🌸',
    bannerTheme: 'sakura-anime',
    avatarFrame: 'sakura-floral-ring',
    avatarShape: 'squircle',
    cardTheme: 'glass',
    animatedEffect: 'sakura',
    badgeTitle: '🌸 أنمي شينوبي',
    badgeIcon: '🌸',
    badgeColor: '#f472b6',
    fontStyle: 'modern'
  },
  {
    id: 'preset-diamond-vip',
    name: '💎 الألماسي الجليدي VIP',
    tagline: 'بريق الماس الملوكي مع أمواج الشفق الأزرق الماسي',
    icon: '💎',
    bannerTheme: 'diamond-ice',
    avatarFrame: 'diamond-frost-shimmer',
    avatarShape: 'diamond',
    cardTheme: 'hologram',
    animatedEffect: 'aurora',
    badgeTitle: '💎 عضوية ماسية VIP',
    badgeIcon: '💎',
    badgeColor: '#38bdf8',
    fontStyle: 'luxury'
  },
  {
    id: 'preset-matrix-hacker',
    name: '💻 الماتريكس سايبر هاك',
    tagline: 'شلال الكود الأخضر والشريط المقسم وإطار السايبر المستقبلي',
    icon: '💻',
    bannerTheme: 'matrix-rain',
    avatarFrame: 'cyber-hud-segmented',
    avatarShape: 'hexagon',
    cardTheme: 'cyber-dark',
    animatedEffect: 'matrix',
    badgeTitle: '⚡ سايبر برو',
    badgeIcon: '⚡',
    badgeColor: '#10b981',
    fontStyle: 'gaming'
  }
];

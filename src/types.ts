export type PageCategory = 
  | 'refrigerator' 
  | 'stands' 
  | 'indomie' 
  | 'paper_tissues' 
  | 'cleaners' 
  | 'grocery' 
  | 'spices_nuts' 
  | 'needed' 
  | 'all';

export interface Variation {
  id: string;
  name: string;
  isOutOfStock: boolean;
  group?: '5' | '10' | 'other';
  price?: number;
  barcode?: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category?: PageCategory | string;
  variations: Variation[];
  ownerId: string;
  createdAt: any; // Firebase Timestamp
}

export interface ReminderItem {
  id: string;
  text: string;
  completed: boolean;
  createdBy: string;
  authorName?: string;
  createdAt: any;
}

export interface ProfileCustomization {
  bannerTheme: string;       // id of theme or 'custom'
  bannerCustomUrl?: string;  // custom image url
  avatarFrame: string;       // id of frame (e.g. 'rainbow-chroma', 'neon-cyan', 'fire-flame', etc.)
  avatarShape: 'circle' | 'squircle' | 'hexagon' | 'diamond' | 'shield';
  cardTheme: string;         // 'glass' | 'cyber-dark' | 'hologram' | 'gold-luxury' | 'matte-black' | 'synthwave'
  animatedEffect: 'none' | 'stars' | 'sparks' | 'cyber-grid' | 'synthwave-sun' | 'matrix' | 'sakura' | 'aurora' | 'bubbles' | 'warp-speed' | 'electric-lightning' | 'floating-runes' | 'golden-confetti' | 'fire-tempest' | 'cyber-scanlines';
  avatarRotateAnimation?: 'none' | 'spin-smooth' | 'spin-slow-clock' | 'spin-reverse' | 'spin-3d-flip' | 'spin-pendulum' | 'spin-pulse-gyro' | 'spin-radar' | 'spin-bounce-tilt' | 'spin-hover';
  avatarFilter?: 'none' | 'cyber-neon' | 'golden-warmth' | 'hologram-cyan' | 'vintage-retro' | 'matrix-glitch' | 'noir-contrast' | 'sakura-soft' | 'magma-flame' | 'cool-ice';
  avatarZoom?: 'normal' | 'zoom-110' | 'zoom-125' | 'tilt-right' | 'tilt-left';
  badgeTitle?: string;       // custom badge title
  badgeIcon?: string;        // emoji or icon name
  badgeColor?: string;       // tailwind / hex color
  fontStyle?: 'default' | 'gaming' | 'modern' | 'luxury';
}

export type UserRole = 'admin' | 'supervisor' | 'user' | 'member';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoUrl: string;
  bio?: string;
  email?: string;
  role?: UserRole;
  customization?: ProfileCustomization;
  updatedAt: any;
}

export type PageCategory = 'refrigerator' | 'stands' | 'needed' | 'indomie' | 'cleaners';

export interface Variation {
  id: string;
  name: string;
  isOutOfStock: boolean;
  group?: '5' | '10' | 'other';
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category?: 'refrigerator' | 'stands' | 'indomie' | 'cleaners' | string;
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
  animatedEffect: 'none' | 'stars' | 'sparks' | 'cyber-grid' | 'matrix' | 'sakura' | 'aurora' | 'bubbles';
  badgeTitle?: string;       // custom badge title
  badgeIcon?: string;        // emoji or icon name
  badgeColor?: string;       // tailwind / hex color
  fontStyle?: 'default' | 'gaming' | 'modern' | 'luxury';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoUrl: string;
  bio?: string;
  role?: 'admin' | 'member' | 'user';
  customization?: ProfileCustomization;
  updatedAt: any;
}

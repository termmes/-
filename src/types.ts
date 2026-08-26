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

export interface UserProfile {
  uid: string;
  displayName: string;
  photoUrl: string;
  bio?: string;
  songUrl?: string;
  songTitle?: string;
  songArtist?: string;
  role?: 'admin' | 'member' | 'user';
  updatedAt: any;
}

export interface Story {
  id: string;
  userId: string;
  authorName: string;
  authorPhoto?: string;
  mediaUrl?: string;
  caption?: string;
  bgColor?: string;
  createdAt: any;
}

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
  variations: Variation[];
  ownerId: string;
  createdAt: any; // Firebase Timestamp
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoUrl: string;
  role?: 'admin' | 'member' | 'user';
  updatedAt: any;
}

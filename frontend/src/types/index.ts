export interface EventItem {
  _id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  category: string;
  location: string;
  focalPoint?: { x: number; y: number };
  createdAt?: string;
}

export interface GalleryItem {
  _id: string;
  title: string;
  image: string; // URL for image or video thumbnail / source
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  category: 'Students' | 'Events' | 'Ashram' | 'Activities';
  description?: string;
  focalPoint?: { x: number; y: number };
  createdAt?: string;
}

export interface FacilityItem {
  _id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  focalPoint?: { x: number; y: number };
  createdAt?: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt?: string;
}

export interface ContributionRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  amount: number;
  purpose: 'Education' | 'Food' | 'Healthcare' | 'Books' | 'General Support';
  paymentStatus: 'completed' | 'pending' | 'failed';
  paymentRef?: string;
  createdAt?: string;
}

export interface UserAdmin {
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  phone?: string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: UserAdmin;
}

export interface SiteSettingsData {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  facebookUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  showDonors: boolean;
}

export interface ReviewItem {
  _id: string;
  name: string;
  email?: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt?: string;
}

export interface ActivityItem {
  _id: string;
  type: 'signup' | 'login' | 'contact' | 'review' | 'contribution' | 'contribution_guest' | 'suggestion' | 'other';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt?: string;
}

export interface MemoryVaultCard {
  _id: string;
  title: string;
  image: string;
  description?: string;
  category: 'Campus' | 'Students' | 'Nature' | 'Events' | 'Activities' | 'Facilities' | 'Memories';
  cardNumber: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  focalPoint?: { x: number; y: number };
  createdAt?: string;
}

export interface StudentImage {
  _id: string;
  title: string;
  image: string;
  description: string;
  focalPoint?: { x: number; y: number };
  createdAt?: string;
}

export interface CarouselImage {
  _id: string;
  image: string;
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
}
